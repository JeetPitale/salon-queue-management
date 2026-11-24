import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDateString, checkAndReleaseExpiredCalls } from "@/lib/queue-rules";
import { QueueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    const tokenDate = getTodayDateString();

    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Auto-check expired grace calls (R6)
    await checkAndReleaseExpiredCalls(salon.id);

    // Active entries (WAITING, CALLED, IN_SERVICE) in token order
    const entries = await prisma.queueEntry.findMany({
      where: {
        salonId: salon.id,
        tokenDate,
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_SERVICE] },
      },
      include: {
        customer: true,
        assignedStaff: true,
        services: { include: { service: true } },
        payment: true,
      },
      orderBy: { tokenNumber: "asc" },
    });

    // Stylists list
    const stylists = await prisma.staff.findMany({
      where: {
        salonId: salon.id,
        role: "STYLIST",
      },
      include: {
        skills: { include: { service: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      salonId: salon.id,
      entries: entries.map((e) => ({
        id: e.id,
        tokenNumber: e.tokenNumber,
        customerName: e.customer.name,
        customerPhone: e.customer.phone,
        status: e.status,
        estimatedWaitMinutes: e.estimatedWaitMinutes,
        calledAt: e.calledAt,
        startedAt: e.startedAt,
        assignedStaff: e.assignedStaff ? { id: e.assignedStaff.id, name: e.assignedStaff.name } : null,
        services: e.services.map((s) => ({
          id: s.serviceId,
          name: s.service.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
        })),
        isWalkIn: e.isWalkIn,
        createdAt: e.createdAt,
      })),
      stylists: stylists.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        skills: s.skills.map((sk) => ({ id: sk.serviceId, name: sk.service.name })),
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
