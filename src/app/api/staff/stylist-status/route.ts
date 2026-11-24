import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateQueueWaitTimes, getTodayDateString } from "@/lib/queue-rules";
import { broadcastQueueUpdate } from "@/lib/events";
import { StylistStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { staffId, status } = await req.json();

    if (!staffId || !status) {
      return NextResponse.json({ error: "staffId and status are required" }, { status: 400 });
    }

    const validStatuses = [
      StylistStatus.AVAILABLE,
      StylistStatus.BUSY,
      StylistStatus.ON_BREAK,
      StylistStatus.OFF_DUTY,
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid stylist status" }, { status: 400 });
    }

    // F9: "A stylist cannot go on break or off duty while serving someone."
    if (status === StylistStatus.ON_BREAK || status === StylistStatus.OFF_DUTY) {
      const activeServing = await prisma.queueEntry.findFirst({
        where: {
          assignedStaffId: staffId,
          status: "IN_SERVICE",
        },
      });
      if (activeServing) {
        return NextResponse.json(
          { error: "Cannot go on break or off duty while actively serving a customer" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { status },
    });

    // F9 & R5: Recalculate all queue wait times because working stylist count changed
    await recalculateQueueWaitTimes(updated.salonId, getTodayDateString());
    broadcastQueueUpdate(updated.salonId, "stylist_updated", { staffId, status });

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update stylist status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
