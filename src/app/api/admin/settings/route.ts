import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }
    return NextResponse.json({ salon });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { name, address, phone, openingTime, closingTime, gracePeriodMinutes, isOpen } = body;

    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(address ? { address: String(address).trim() } : {}),
        ...(phone ? { phone: String(phone).trim() } : {}),
        ...(openingTime ? { openingTime: String(openingTime) } : {}),
        ...(closingTime ? { closingTime: String(closingTime) } : {}),
        ...(gracePeriodMinutes !== undefined ? { gracePeriodMinutes: Number(gracePeriodMinutes) } : {}),
        ...(isOpen !== undefined ? { isOpen: Boolean(isOpen) } : {}),
      },
    });

    return NextResponse.json({ success: true, salon: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
