import { NextResponse } from "next/server";
import { updateQueueStatus, canStylistPerformServices } from "@/lib/queue-rules";
import { prisma } from "@/lib/prisma";
import { QueueStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { action, entryId, staffId, reason } = await req.json();

    if (!entryId && action !== "call_next_auto") {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    let targetStatus: QueueStatus;

    switch (action) {
      case "call":
      case "call_next":
        targetStatus = QueueStatus.CALLED;
        break;
      case "start":
        targetStatus = QueueStatus.IN_SERVICE;
        break;
      case "complete":
        targetStatus = QueueStatus.COMPLETED;
        break;
      case "no_show":
        targetStatus = QueueStatus.NO_SHOW;
        break;
      case "cancel":
        targetStatus = QueueStatus.CANCELLED;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await updateQueueStatus({
      entryId,
      targetStatus,
      staffId,
      cancellationReason: reason,
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
