import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const session = await prisma.otpSession.findFirst({
      where: {
        phone: phone.trim(),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return NextResponse.json({ error: "No OTP session found. Please request a new OTP." }, { status: 400 });
    }

    if (new Date() > session.expiresAt) {
      return NextResponse.json({ error: "OTP expired. Please request a new OTP." }, { status: 400 });
    }

    if (session.attempts >= 3) {
      return NextResponse.json({ error: "Maximum attempts reached. Please request a new OTP." }, { status: 400 });
    }

    if (session.otp !== otp.trim()) {
      await prisma.otpSession.update({
        where: { id: session.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
