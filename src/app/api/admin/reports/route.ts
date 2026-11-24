import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QueueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Fetch entries with all relations
    const allEntries = await prisma.queueEntry.findMany({
      where: { salonId: salon.id },
      include: {
        services: { include: { service: true } },
        payment: true,
        feedback: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const footfall = allEntries.length;
    const completedEntries = allEntries.filter((e) => e.status === QueueStatus.COMPLETED);
    const noShowEntries = allEntries.filter((e) => e.status === QueueStatus.NO_SHOW);
    const noShowRate = footfall > 0 ? Math.round((noShowEntries.length / footfall) * 100) : 0;

    // Average wait
    const totalWait = allEntries.reduce((sum, e) => sum + e.estimatedWaitMinutes, 0);
    const averageWait = footfall > 0 ? Math.round(totalWait / footfall) : 0;

    // Revenue
    const revenue = allEntries.reduce((sum, e) => sum + (e.payment?.amount || 0), 0);

    // Feedback rating average
    const rated = allEntries.filter((e) => e.feedback?.rating);
    const avgRating =
      rated.length > 0
        ? (rated.reduce((sum, e) => sum + (e.feedback?.rating || 0), 0) / rated.length).toFixed(1)
        : "5.0";

    // Hourly footfall breakdown
    const hourlyCounts: Record<string, number> = {};
    for (let h = 9; h <= 21; h++) {
      const hourStr = `${String(h).padStart(2, "0")}:00`;
      hourlyCounts[hourStr] = 0;
    }
    allEntries.forEach((e) => {
      const d = new Date(e.createdAt);
      const hourStr = `${String(d.getHours()).padStart(2, "0")}:00`;
      if (hourlyCounts[hourStr] !== undefined) {
        hourlyCounts[hourStr]++;
      }
    });

    // Revenue by service breakdown
    const serviceRevenueMap: Record<string, { count: number; revenue: number }> = {};
    allEntries.forEach((e) => {
      e.services.forEach((s) => {
        const name = s.service.name;
        if (!serviceRevenueMap[name]) {
          serviceRevenueMap[name] = { count: 0, revenue: 0 };
        }
        serviceRevenueMap[name].count++;
        serviceRevenueMap[name].revenue += s.price;
      });
    });

    return NextResponse.json({
      metrics: {
        footfall,
        completedCount: completedEntries.length,
        noShowRate,
        averageWait,
        revenue,
        avgRating,
      },
      hourly: Object.entries(hourlyCounts).map(([hour, count]) => ({ hour, count })),
      serviceBreakdown: Object.entries(serviceRevenueMap).map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      })),
      entries: allEntries.map((e) => ({
        tokenNumber: e.tokenNumber,
        tokenDate: e.tokenDate,
        status: e.status,
        services: e.services.map((s) => s.service.name).join("; "),
        amount: e.payment?.amount || 0,
        paymentMethod: e.payment?.method || "None",
        rating: e.feedback?.rating || null,
        createdAt: e.createdAt,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
