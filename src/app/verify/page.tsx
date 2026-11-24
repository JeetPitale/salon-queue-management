"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useLanguage } from "@/components/LanguageContext";
import { Phone, User, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function OtpVerification() {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [joinData, setJoinData] = useState<{
    salonId: string;
    serviceIds: string[];
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("queue_join_selection");
    if (!stored) {
      router.replace("/join");
      return;
    }
    setJoinData(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && resendSeconds > 0) {
      timer = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendSeconds]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2 || name.trim().length > 60) {
      setErrorMsg("Please enter a valid name (2-60 characters)");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      setDemoOtp(data.demoOtp);
      setStep("otp");
      setResendSeconds(30);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinData) return;
    setErrorMsg(null);

    if (otp.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit OTP code");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim().replace(/\D/g, ""), otp: otp.trim() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Invalid OTP code");
      }

      // 2. Join Queue atomically (R1, R2, R5)
      const joinRes = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: joinData.salonId,
          name: name.trim(),
          phone: phone.trim().replace(/\D/g, ""),
          serviceIds: joinData.serviceIds,
          isWalkIn: false,
        }),
      });
      const joinResult = await joinRes.json();
      if (!joinRes.ok) {
        throw new Error(joinResult.error || "Failed to join queue");
      }

      const entryId = joinResult.entry.id;
      // Store in localStorage for active token retention (R2)
      localStorage.setItem("active_token_id", entryId);
      sessionStorage.removeItem("queue_join_selection");

      router.push(`/track/${entryId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {step === "phone" ? t("enter_details") : t("otp_title")}
            </h1>
            <p className="text-sm text-muted">
              {step === "phone"
                ? t("otp_details_sub")
                : `${t("otp_sent_to")} +91 ${phone}`}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-[#F4CCCC] border border-[#8B1A1A]/30 p-3 rounded-xl flex items-center gap-2 text-sm text-[#8B1A1A]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  {t("name")}
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-white border border-[#E4E1DC] focus:border-primary rounded-xl pl-11 pr-4 py-3 text-base text-[#1B1B1F] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  {t("phone")}
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-white border border-[#E4E1DC] focus:border-primary rounded-xl pl-11 pr-4 py-3 text-base text-[#1B1B1F] outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-primary hover:bg-[#182e4c] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-sm transition-all active:scale-[0.98] mt-6"
              >
                <span>{loading ? t("sending") : t("send_code")}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndJoin} className="space-y-4">
              {demoOtp && (
                <div className="bg-[#DCE9F7] border border-[#1F5FA8]/30 p-3 rounded-xl text-xs text-[#1F5FA8] flex items-center justify-between">
                  <span>{t("demo_otp_code")} <strong>{demoOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp(demoOtp)}
                    className="underline font-semibold"
                  >
                    {t("autofill")}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  {t("otp_label")}
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-white border border-[#E4E1DC] focus:border-primary rounded-xl pl-11 pr-4 py-3 text-2xl font-bold tracking-widest text-[#1B1B1F] outline-none text-center transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted pt-1">
                <span>{t("didnt_receive_code")}</span>
                {resendSeconds > 0 ? (
                  <span>{t("resend_in")} {resendSeconds}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-primary font-semibold hover:underline"
                  >
                    {t("resend_otp")}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full min-h-[48px] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base transition-all mt-6 ${
                  otp.length === 6 && !loading
                    ? "bg-accent hover:opacity-95 text-white active:scale-[0.98] shadow-sm"
                    : "bg-[#E4E1DC] text-muted cursor-not-allowed"
                }`}
              >
                <span>{loading ? t("verifying") : t("verify_otp")}</span>
                <ShieldCheck className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-center text-xs text-muted hover:text-primary mt-2"
              >
                {t("change_number")}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
