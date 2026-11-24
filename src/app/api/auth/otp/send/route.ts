import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    // Generate 6 digit OTP (default demo OTP: 123456 or random)
    const otp = "123456";
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Upsert or create OTP session
    await prisma.otpSession.create({
      data: {
        phone: phone.trim(),
        otp,
        expiresAt,
        attempts: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Include demo OTP in development for ease of testing
      demoOtp: otp,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
