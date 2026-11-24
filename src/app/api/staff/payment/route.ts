import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, QueueStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { entryId, amount, method } = await req.json();

    if (!entryId || !amount || !method) {
      return NextResponse.json({ error: "entryId, amount, and method are required" }, { status: 400 });
    }

    const validMethods = [PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD];
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: "Payment method must be CASH, UPI, or CARD" }, { status: 400 });
    }

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { payment: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
    }

    // R7: One payment per visit
    if (entry.payment) {
      return NextResponse.json({ error: "Payment has already been recorded for this visit" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        queueEntryId: entry.id,
        amount: Number(amount),
        method,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
