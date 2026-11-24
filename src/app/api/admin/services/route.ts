import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    const services = await prisma.service.findMany({
      where: { salonId: salon.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ services });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, durationMinutes, price } = await req.json();
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    if (!name || !durationMinutes || !price) {
      return NextResponse.json({ error: "Name, duration, and price are required" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        salonId: salon.id,
        name: String(name).trim(),
        durationMinutes: Number(durationMinutes),
        price: Number(price),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create service";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, durationMinutes, price, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(durationMinutes ? { durationMinutes: Number(durationMinutes) } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update service";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
