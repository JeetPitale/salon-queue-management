import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QueueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    const { entryId } = params;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: {
        salon: true,
        customer: true,
        assignedStaff: true,
        services: {
          include: { service: true },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
    }

    // Calculate live position: count of lower tokens still waiting, called, or in_service + 1
    const peopleAheadCount = await prisma.queueEntry.count({
      where: {
        salonId: entry.salonId,
        tokenDate: entry.tokenDate,
        tokenNumber: { lt: entry.tokenNumber },
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_SERVICE] },
      },
    });

    const position = peopleAheadCount + 1;

    // Grace remaining in seconds if CALLED
    let graceSecondsRemaining = 0;
    if (entry.status === QueueStatus.CALLED && entry.calledAt) {
      const gracePeriodMs = (entry.salon.gracePeriodMinutes || 10) * 60 * 1000;
      const elapsedMs = Date.now() - new Date(entry.calledAt).getTime();
      graceSecondsRemaining = Math.max(0, Math.floor((gracePeriodMs - elapsedMs) / 1000));
    }

    return NextResponse.json({
      entry: {
        id: entry.id,
        tokenNumber: entry.tokenNumber,
        status: entry.status,
        estimatedWaitMinutes: entry.estimatedWaitMinutes,
        position,
        peopleAhead: peopleAheadCount,
        calledAt: entry.calledAt,
        graceSecondsRemaining,
        assignedStaff: entry.assignedStaff ? { name: entry.assignedStaff.name } : null,
        salon: {
          id: entry.salon.id,
          name: entry.salon.name,
          phone: entry.salon.phone,
          gracePeriodMinutes: entry.salon.gracePeriodMinutes,
        },
        services: entry.services.map((s) => ({
          id: s.serviceId,
          name: s.service.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
        })),
        createdAt: entry.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
