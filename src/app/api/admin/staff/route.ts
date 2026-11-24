import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    const staffList = await prisma.staff.findMany({
      where: { salonId: salon.id },
      include: {
        skills: { include: { service: true } },
      },
      orderBy: { name: "asc" },
    });

    const services = await prisma.service.findMany({
      where: { salonId: salon.id, isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ staff: staffList, services });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, username, password, role, serviceIds } = await req.json();
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: "Name, username, password, and role are required" }, { status: 400 });
    }

    const existing = await prisma.staff.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const staff = await prisma.staff.create({
      data: {
        salonId: salon.id,
        name: String(name).trim(),
        username: String(username).trim().toLowerCase(),
        password: String(password).trim(),
        role,
        status: "AVAILABLE",
        skills: {
          create: Array.isArray(serviceIds)
            ? serviceIds.map((sId: string) => ({ serviceId: sId }))
            : [],
        },
      },
      include: {
        skills: { include: { service: true } },
      },
    });

    return NextResponse.json({ success: true, staff });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, role, status, serviceIds } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Update basic fields
    const updated = await prisma.staff.update({
      where: { id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
    });

    // Update skill matrix if serviceIds provided
    if (Array.isArray(serviceIds)) {
      await prisma.staffSkill.deleteMany({
        where: { staffId: id },
      });
      for (const sId of serviceIds) {
        await prisma.staffSkill.create({
          data: { staffId: id, serviceId: sId },
        });
      }
    }

    const refreshed = await prisma.staff.findUnique({
      where: { id },
      include: { skills: { include: { service: true } } },
    });

    return NextResponse.json({ success: true, staff: refreshed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
