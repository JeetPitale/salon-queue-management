import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username, password, expectedRole } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { username: username.trim().toLowerCase() },
      include: {
        skills: { include: { service: true } },
        salon: true,
      },
    });

    if (!staff || staff.password !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Role Isolation Enforcement
    if (expectedRole && staff.role !== expectedRole) {
      return NextResponse.json(
        {
          error: `Access denied. This login portal is strictly reserved for ${expectedRole.toLowerCase()} accounts only.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        status: staff.status,
        salonId: staff.salonId,
        salonName: staff.salon.name,
        skills: staff.skills.map((sk) => ({ id: sk.serviceId, name: sk.service.name })),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
