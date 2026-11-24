import { NextResponse } from "next/server";
import { joinQueue } from "@/lib/queue-rules";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { salonId, name, phone, serviceIds, isWalkIn } = body;

    if (!name || name.trim().length < 2 || name.trim().length > 60) {
      return NextResponse.json(
        { error: "Name must be between 2 and 60 characters" },
        { status: 400 }
      );
    }

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json(
        { error: "Valid mobile number is required" },
        { status: 400 }
      );
    }

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: "At least one service is required" },
        { status: 400 }
      );
    }

    const result = await joinQueue({
      salonId,
      name: name.trim(),
      phone: phone.trim(),
      serviceIds,
      isWalkIn: Boolean(isWalkIn),
    });

    return NextResponse.json({
      success: true,
      isExisting: result.isExisting,
      entry: result.entry,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to join queue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
