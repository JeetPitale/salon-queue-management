import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDateString } from "@/lib/queue-rules";
import { Prisma, QueueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim();
    const tokenDate = getTodayDateString();

    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    const whereClause: Prisma.QueueEntryWhereInput = {
      salonId: salon.id,
      tokenDate,
      status: { in: [QueueStatus.COMPLETED, QueueStatus.NO_SHOW, QueueStatus.CANCELLED] },
    };

    if (search) {
      const isNum = !isNaN(Number(search));
      whereClause.OR = [
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
        ...(isNum ? [{ tokenNumber: Number(search) }] : []),
      ];
    }

    const historyEntries = await prisma.queueEntry.findMany({
      where: whereClause,
      include: {
        customer: true,
        assignedStaff: true,
        services: { include: { service: true } },
        payment: true,
        feedback: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      entries: historyEntries.map((e) => ({
        id: e.id,
        tokenNumber: e.tokenNumber,
        customerName: e.customer.name,
        customerPhone: e.customer.phone,
        status: e.status,
        assignedStaff: e.assignedStaff ? e.assignedStaff.name : "Unassigned",
        services: e.services.map((s) => s.service.name).join(", "),
        totalPrice: e.services.reduce((acc, s) => acc + s.price, 0),
        payment: e.payment ? { amount: e.payment.amount, method: e.payment.method } : null,
        feedback: e.feedback ? { rating: e.feedback.rating, comment: e.feedback.comment } : null,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        cancelledAt: e.cancelledAt,
        cancellationReason: e.cancellationReason,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
