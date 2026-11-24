import { QueueStatus, StylistStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { broadcastQueueUpdate } from "./events";

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// R3: Allowed Status Transitions
export const ALLOWED_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  [QueueStatus.WAITING]: [QueueStatus.CALLED, QueueStatus.CANCELLED],
  [QueueStatus.CALLED]: [QueueStatus.IN_SERVICE, QueueStatus.NO_SHOW, QueueStatus.CANCELLED],
  [QueueStatus.IN_SERVICE]: [QueueStatus.COMPLETED],
  [QueueStatus.COMPLETED]: [],
  [QueueStatus.NO_SHOW]: [],
  [QueueStatus.CANCELLED]: [],
};

export function isTransitionAllowed(from: QueueStatus, to: QueueStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return Boolean(allowed && allowed.includes(to));
}

// R4: Skill-matched assignment
export function canStylistPerformServices(
  stylistServiceIds: string[],
  requestedServiceIds: string[]
): boolean {
  if (requestedServiceIds.length === 0) return false;
  const skillSet = new Set(stylistServiceIds);
  return requestedServiceIds.every((id) => skillSet.has(id));
}

// R5: Wait time calculation
// "total service minutes of everyone ahead, divided by the number of stylists who are not off duty, rounded up."
export function calculateWaitTimeMinutes(
  totalMinutesAhead: number,
  workingStylistsCount: number
): number {
  const stylists = Math.max(1, workingStylistsCount);
  return Math.ceil(totalMinutesAhead / stylists);
}

// Check if customer already has an active live token today (R2)
export async function getActiveTokenForCustomer(
  salonId: string,
  customerId: string,
  tokenDate: string = getTodayDateString()
) {
  return prisma.queueEntry.findFirst({
    where: {
      salonId,
      customerId,
      tokenDate,
      status: {
        in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_SERVICE],
      },
    },
    include: {
      services: {
        include: { service: true },
      },
      customer: true,
      assignedStaff: true,
    },
  });
}

// R5 & Wait time recalculator for entire active queue of a salon
export async function recalculateQueueWaitTimes(salonId: string, tokenDate: string = getTodayDateString()) {
  // Count stylists not OFF_DUTY
  const workingStylists = await prisma.staff.count({
    where: {
      salonId,
      role: "STYLIST",
      status: { not: StylistStatus.OFF_DUTY },
    },
  });
  const workingCount = Math.max(1, workingStylists);

  // Fetch active entries ordered by tokenNumber
  const activeEntries = await prisma.queueEntry.findMany({
    where: {
      salonId,
      tokenDate,
      status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_SERVICE] },
    },
    include: {
      services: true,
    },
    orderBy: {
      tokenNumber: "asc",
    },
  });

  let runningMinutesAhead = 0;

  for (let i = 0; i < activeEntries.length; i++) {
    const entry = activeEntries[i];
    // Position is number of lower tokens still active + 1
    // The wait time counts all services of everyone ahead, shared across stylists working, rounded up
    const waitTime = calculateWaitTimeMinutes(runningMinutesAhead, workingCount);

    if (entry.estimatedWaitMinutes !== waitTime) {
      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { estimatedWaitMinutes: waitTime },
      });
    }

    // Accumulate service minutes of this entry for subsequent entries
    const entryTotalMinutes = entry.services.reduce((acc, s) => acc + s.durationMinutes, 0);
    runningMinutesAhead += entryTotalMinutes;
  }
}

// R1: Allocate unique token per salon per day in one transaction
export async function joinQueue(params: {
  salonId: string;
  name: string;
  phone: string;
  serviceIds: string[];
  isWalkIn?: boolean;
}) {
  const { salonId, name, phone, serviceIds, isWalkIn = false } = params;
  const tokenDate = getTodayDateString();

  // Validate salon exists
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: {
      services: { where: { isActive: true } },
    },
  });
  if (!salon) {
    throw new Error("Salon not found");
  }

  if (!salon.isOpen) {
    throw new Error("Salon is currently closed");
  }

  if (!serviceIds || serviceIds.length === 0) {
    throw new Error("At least one service is required");
  }

  // Validate services exist and are active
  const chosenServices = salon.services.filter((s) => serviceIds.includes(s.id));
  if (chosenServices.length !== serviceIds.length) {
    throw new Error("One or more chosen services are invalid or inactive");
  }

  // Check if any stylist has the required skills for this combination (R4)
  const qualifiedStylists = await prisma.staff.findMany({
    where: {
      salonId,
      role: "STYLIST",
    },
    include: {
      skills: true,
    },
  });

  const hasCapableStylist = qualifiedStylists.some((st) =>
    canStylistPerformServices(
      st.skills.map((sk) => sk.serviceId),
      serviceIds
    )
  );

  if (!hasCapableStylist) {
    throw new Error("No stylist can perform all chosen services");
  }

  // Find or create customer
  let customer = await prisma.customer.findUnique({
    where: { phone },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { phone, name },
    });
  } else if (customer.name !== name) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { name },
    });
  }

  // R2: Check if customer already has an active token today
  const existingActive = await getActiveTokenForCustomer(salonId, customer.id, tokenDate);
  if (existingActive) {
    return {
      isExisting: true,
      entry: existingActive,
    };
  }

  // Execute in atomic transaction for R1
  const result = await prisma.$transaction(async (tx) => {
    // 1. Atomic token counter increment
    const counter = await tx.dailyTokenCounter.upsert({
      where: {
        salonId_tokenDate: { salonId, tokenDate },
      },
      update: {
        lastTokenNumber: { increment: 1 },
      },
      create: {
        salonId,
        tokenDate,
        lastTokenNumber: 1,
      },
    });

    const tokenNumber = counter.lastTokenNumber;

    // 2. Count working stylists
    const workingStylists = await tx.staff.count({
      where: {
        salonId,
        role: "STYLIST",
        status: { not: StylistStatus.OFF_DUTY },
      },
    });
    const workingCount = Math.max(1, workingStylists);

    // 3. Sum total service minutes of everyone ahead still active
    const activeEntriesAhead = await tx.queueEntry.findMany({
      where: {
        salonId,
        tokenDate,
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_SERVICE] },
      },
      include: { services: true },
    });

    const totalMinutesAhead = activeEntriesAhead.reduce((acc, entry) => {
      const entryMins = entry.services.reduce((sum, s) => sum + s.durationMinutes, 0);
      return acc + entryMins;
    }, 0);

    const estimatedWaitMinutes = calculateWaitTimeMinutes(totalMinutesAhead, workingCount);

    // 4. Create QueueEntry
    const newEntry = await tx.queueEntry.create({
      data: {
        salonId,
        customerId: customer.id,
        tokenNumber,
        tokenDate,
        status: QueueStatus.WAITING,
        estimatedWaitMinutes,
        isWalkIn,
        services: {
          create: chosenServices.map((s) => ({
            serviceId: s.id,
            durationMinutes: s.durationMinutes,
            price: s.price,
          })),
        },
      },
      include: {
        services: { include: { service: true } },
        customer: true,
      },
    });

    // 5. Create "joined" notification log
    await tx.notificationLog.create({
      data: {
        queueEntryId: newEntry.id,
        event: "JOINED",
        channel: isWalkIn ? "PUSH" : "SMS",
        status: "SENT",
        content: `Token #${tokenNumber} confirmed. Estimated wait: ${estimatedWaitMinutes} mins.`,
      },
    });

    return newEntry;
  });

  broadcastQueueUpdate(salonId, "queue_updated", { entryId: result.id, tokenNumber: result.tokenNumber });
  return { isExisting: false, entry: result };
}

// R6: Release expired called customer & check grace periods
export async function checkAndReleaseExpiredCalls(salonId: string) {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
  });
  if (!salon) return [];

  const graceMs = salon.gracePeriodMinutes * 60 * 1000;
  const now = new Date();
  const threshold = new Date(now.getTime() - graceMs);

  const expiredEntries = await prisma.queueEntry.findMany({
    where: {
      salonId,
      status: QueueStatus.CALLED,
      calledAt: { lte: threshold },
    },
    include: {
      assignedStaff: true,
      customer: true,
    },
  });

  const released: string[] = [];

  for (const entry of expiredEntries) {
    await prisma.$transaction(async (tx) => {
      // Mark as no-show
      await tx.queueEntry.update({
        where: { id: entry.id },
        data: {
          status: QueueStatus.NO_SHOW,
          cancellationReason: "Grace period expired",
        },
      });

      // Free stylist if assigned
      if (entry.assignedStaffId) {
        await tx.staff.update({
          where: { id: entry.assignedStaffId },
          data: { status: StylistStatus.AVAILABLE },
        });
      }

      // Log notification
      await tx.notificationLog.create({
        data: {
          queueEntryId: entry.id,
          event: "NO_SHOW",
          channel: "SMS",
          status: "SENT",
          content: `Token #${entry.tokenNumber} marked as no-show due to timeout.`,
        },
      });
    });

    released.push(entry.id);
  }

  if (released.length > 0) {
    await recalculateQueueWaitTimes(salonId);
    broadcastQueueUpdate(salonId, "customer_no_show", { released });
  }

  return released;
}

// Change Status with R3 enforcement
export async function updateQueueStatus(params: {
  entryId: string;
  targetStatus: QueueStatus;
  staffId?: string; // Optional caller
  cancellationReason?: string;
}) {
  const { entryId, targetStatus, staffId, cancellationReason } = params;

  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: {
      services: true,
      assignedStaff: true,
      salon: true,
    },
  });

  if (!entry) {
    throw new Error("Queue entry not found");
  }

  // R3 check
  if (!isTransitionAllowed(entry.status, targetStatus)) {
    throw new Error(
      `Invalid status change from ${entry.status} to ${targetStatus}`
    );
  }

  // If transitioning to CALLED, verify staff skills (R4)
  if (targetStatus === QueueStatus.CALLED) {
    if (!staffId) {
      throw new Error("A stylist must be assigned when calling next");
    }
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { skills: true },
    });
    if (!staff) {
      throw new Error("Assigned stylist not found");
    }

    const requestedServiceIds = entry.services.map((s) => s.serviceId);
    const stylistSkillIds = staff.skills.map((sk) => sk.serviceId);

    if (!canStylistPerformServices(stylistSkillIds, requestedServiceIds)) {
      throw new Error("Assigned stylist does not have skills for all requested services");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = { status: targetStatus };

    if (targetStatus === QueueStatus.CALLED) {
      updateData.calledAt = new Date();
      updateData.assignedStaffId = staffId;
      // Also set stylist to busy or called
    } else if (targetStatus === QueueStatus.IN_SERVICE) {
      updateData.startedAt = new Date();
      if (entry.assignedStaffId) {
        await tx.staff.update({
          where: { id: entry.assignedStaffId },
          data: { status: StylistStatus.BUSY },
        });
      }
    } else if (targetStatus === QueueStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (entry.assignedStaffId) {
        await tx.staff.update({
          where: { id: entry.assignedStaffId },
          data: { status: StylistStatus.AVAILABLE },
        });
      }
    } else if (targetStatus === QueueStatus.CANCELLED || targetStatus === QueueStatus.NO_SHOW) {
      updateData.cancelledAt = new Date();
      if (cancellationReason) updateData.cancellationReason = cancellationReason;
      if (entry.assignedStaffId) {
        await tx.staff.update({
          where: { id: entry.assignedStaffId },
          data: { status: StylistStatus.AVAILABLE },
        });
      }
    }

    const res = await tx.queueEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        services: { include: { service: true } },
        assignedStaff: true,
        customer: true,
      },
    });

    // Create corresponding notification
    let eventName: string | null = null;
    let message = "";
    if (targetStatus === QueueStatus.CALLED) {
      eventName = "CALLED";
      message = `Token #${entry.tokenNumber}: Please proceed to chair. Staff: ${res.assignedStaff?.name || "Stylist"}.`;
    } else if (targetStatus === QueueStatus.COMPLETED) {
      eventName = "COMPLETED";
      message = `Token #${entry.tokenNumber}: Service complete. Please rate your experience!`;
    } else if (targetStatus === QueueStatus.NO_SHOW) {
      eventName = "NO_SHOW";
      message = `Token #${entry.tokenNumber} marked as no-show.`;
    }

    if (eventName) {
      await tx.notificationLog.create({
        data: {
          queueEntryId: entry.id,
          event: eventName,
          channel: "SMS",
          status: "SENT",
          content: message,
        },
      });
    }

    return res;
  });

  await recalculateQueueWaitTimes(entry.salonId, entry.tokenDate);
  broadcastQueueUpdate(entry.salonId, "queue_updated", { entryId: updated.id, status: targetStatus });
  return updated;
}
