import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndReleaseExpiredCalls } from "@/lib/queue-rules";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ released: [] });
    }

    const released = await checkAndReleaseExpiredCalls(salon.id);
    return NextResponse.json({ success: true, releasedCount: released.length, released });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error in cron";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
