import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDateString, calculateWaitTimeMinutes } from "@/lib/queue-rules";
import { QueueStatus, StylistStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let salon = await prisma.salon.findFirst({
      include: {
        services: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!salon) {
      return NextResponse.json({ error: "Salon not configured" }, { status: 404 });
    }

    const tokenDate = getTodayDateString();

    // People currently waiting
    const waitingCount = await prisma.queueEntry.count({
      where: {
        salonId: salon.id,
        tokenDate,
        status: QueueStatus.WAITING,
      },
    });

    // Total active people (waiting + called + in_service)
    const activeEntries = await prisma.queueEntry.findMany({
      where: {
        salonId: salon.id,
        tokenDate,
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_SERVICE] },
      },
      include: { services: true },
    });

    const workingStylists = await prisma.staff.count({
      where: {
        salonId: salon.id,
        role: "STYLIST",
        status: { not: StylistStatus.OFF_DUTY },
      },
    });

    const totalMinutes = activeEntries.reduce(
      (sum, e) => sum + e.services.reduce((sSum, s) => sSum + s.durationMinutes, 0),
      0
    );

    const estimatedWait = calculateWaitTimeMinutes(totalMinutes, workingStylists);

    return NextResponse.json({
      salon: {
        id: salon.id,
        name: salon.name,
        address: salon.address,
        phone: salon.phone,
        openingTime: salon.openingTime,
        closingTime: salon.closingTime,
        gracePeriodMinutes: salon.gracePeriodMinutes,
        isOpen: salon.isOpen,
      },
      services: salon.services,
      waitingCount,
      estimatedWaitMinutes: estimatedWait,
      workingStylistsCount: workingStylists,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
