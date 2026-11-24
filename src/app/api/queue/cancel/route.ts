import { NextResponse } from "next/server";
import { updateQueueStatus } from "@/lib/queue-rules";
import { QueueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { entryId, reason } = await req.json();

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    const updated = await updateQueueStatus({
      entryId,
      targetStatus: QueueStatus.CANCELLED,
      cancellationReason: reason || "Cancelled by customer",
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel queue entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
