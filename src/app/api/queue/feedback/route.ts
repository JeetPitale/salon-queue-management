import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QueueStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { entryId, rating, comment } = await req.json();

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    // R7: Rating 1-5, whole number
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5 || !Number.isInteger(numericRating)) {
      return NextResponse.json({ error: "Rating must be a whole number between 1 and 5" }, { status: 400 });
    }

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { feedback: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
    }

    if (entry.status !== QueueStatus.COMPLETED) {
      return NextResponse.json({ error: "Feedback can only be submitted for completed visits" }, { status: 400 });
    }

    // R7: One feedback per visit
    if (entry.feedback) {
      return NextResponse.json({ error: "Feedback has already been submitted for this visit" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        queueEntryId: entry.id,
        rating: numericRating,
        comment: comment ? String(comment).trim() : null,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
