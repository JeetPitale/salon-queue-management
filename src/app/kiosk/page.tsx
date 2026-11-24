"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useLanguage } from "@/components/LanguageContext";
import { Language } from "@/lib/i18n";
import {
  Scissors,
  Globe,
  Clock,
  IndianRupee,
  Check,
  ArrowRight,
  RotateCcw,
  Sparkles,
  QrCode as QrIcon,
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export default function KioskCheckIn() {
  const { language, setLanguage, t, tService, tNumber } = useLanguage();

  const [step, setStep] = useState<"welcome" | "services" | "phone" | "otp" | "token">("welcome");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<{
    id: string;
    tokenNumber: number;
    waitMinutes: number;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [salonId, setSalonId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inactivity auto-reset: resets after 30 seconds of inactivity on token screen or interaction (F2)
  const resetInactivityTimer = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setCountdown(30);
    resetTimerRef.current = setTimeout(() => {
      handleFullReset();
    }, 30000);
  };

  const handleFullReset = () => {
    setStep("welcome");
    setSelectedIds([]);
    setName("");
    setPhone("");
    setOtp("");
    setDemoOtp(null);
    setTokenData(null);
    setQrCodeUrl("");
    setErrorMsg(null);
  };

  useEffect(() => {
    fetch("/api/salon")
      .then((r) => r.json())
      .then((data) => {
        if (data.salon) {
          setSalonId(data.salon.id);
          setServices(data.services || []);
        }
      });

    const handleUserActivity = () => {
      if (step !== "welcome") {
        resetInactivityTimer();
      }
    };

    window.addEventListener("pointerdown", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    return () => {
      window.removeEventListener("pointerdown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [step]);

  // Tick down countdown display on token screen
  useEffect(() => {
    if (step === "token") {
      const interval = setInterval(() => {
        setCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleSendOtp = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg("Please enter your name");
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
      setDemoOtp(data.demoOtp);
      setStep("otp");
    } catch {
      setErrorMsg("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, otp: otp.trim() }),
      });
      if (!verifyRes.ok) throw new Error("Invalid OTP code");

      // Join Queue
      const joinRes = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          name: name.trim(),
          phone: cleanPhone,
          serviceIds: selectedIds,
          isWalkIn: true,
        }),
      });
      const joinData = await joinRes.json();
      if (!joinRes.ok) throw new Error(joinData.error || "Failed to join");

      const entry = joinData.entry;
      setTokenData({
        id: entry.id,
        tokenNumber: entry.tokenNumber,
        waitMinutes: entry.estimatedWaitMinutes,
      });

      // Generate QR Code linking to /track/[entryId]
      const trackUrl = `${window.location.origin}/track/${entry.id}`;
      const qrDataUrl = await QRCode.toDataURL(trackUrl, { width: 280, margin: 2 });
      setQrCodeUrl(qrDataUrl);

      setStep("token");
      resetInactivityTimer();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans select-none overflow-x-hidden">
      {/* Kiosk Header */}
      <header className="bg-primary text-white px-4 sm:px-8 py-3.5 sm:py-5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent flex items-center justify-center text-white shrink-0">
            <Scissors className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{t("salon_name")}</h1>
            <p className="text-[11px] sm:text-xs text-white/70">{t("kiosk_tagline")}</p>
          </div>
        </div>

        {/* Touch Target Language Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          {(["en", "hi", "gu"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                resetInactivityTimer();
              }}
              className={`min-h-[44px] sm:min-h-[52px] px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center gap-1.5 ${
                language === lang
                  ? "bg-accent text-white shadow-md scale-105"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{lang === "en" ? "English" : lang === "hi" ? "हिंदी" : "ગુજરાતી"}</span>
            </button>
          ))}

          {step !== "welcome" && (
            <button
              onClick={handleFullReset}
              className="min-h-[44px] sm:min-h-[52px] px-3 sm:px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t("reset")}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#F4CCCC] border-2 border-[#8B1A1A] text-[#8B1A1A] font-bold text-center text-base sm:text-lg">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Welcome / Start */}
        {step === "welcome" && (
          <div className="text-center space-y-6 sm:space-y-8 my-auto py-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accent/15 border-4 border-accent text-accent flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-12 h-12 sm:w-14 sm:h-14" />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-primary">
                {t("welcome_to")} {t("salon_name")}
              </h2>
              <p className="text-base sm:text-xl text-muted max-w-lg mx-auto">
                {t("kiosk_welcome")}
              </p>
            </div>

            <button
              onClick={() => {
                setStep("services");
                resetInactivityTimer();
              }}
              className="min-h-[56px] sm:min-h-[72px] px-8 sm:px-12 rounded-2xl bg-primary hover:bg-[#182e4c] text-white text-lg sm:text-2xl font-black shadow-xl active:scale-[0.98] transition-transform inline-flex items-center gap-3 sm:gap-4"
            >
              <span>{t("start_kiosk")}</span>
              <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>
          </div>
        )}

        {/* Step 2: Select Services */}
        {step === "services" && (
          <div className="space-y-5 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
                {t("select_services")}
              </h2>
              <p className="text-xs sm:text-base text-muted mt-1">{t("kiosk_services_sub")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto p-1">
              {services.map((s) => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      toggleService(s.id);
                      resetInactivityTimer();
                    }}
                    className={`min-h-[72px] sm:min-h-[84px] p-4 sm:p-5 rounded-2xl border-2 sm:border-3 cursor-pointer flex items-center justify-between transition-all select-none ${
                      isSelected
                        ? "bg-white border-accent shadow-md scale-[1.01]"
                        : "bg-white border-[#E4E1DC] hover:border-primary/40"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <h3 className="font-bold text-base sm:text-xl text-[#1B1B1F] truncate">{tService(s.name)}</h3>
                      <div className="flex items-center gap-3 sm:gap-4 mt-1.5 text-xs sm:text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                          {tNumber(s.durationMinutes)} {t("mins")}
                        </span>
                        <span className="font-extrabold text-primary">₹{tNumber(s.price)}</span>
                      </div>
                    </div>

                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border-2 shrink-0 ${
                        isSelected
                          ? "bg-accent border-accent text-white"
                          : "border-[#E4E1DC] bg-[#FAF8F5]"
                      }`}
                    >
                      {isSelected && <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border border-[#E4E1DC] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-md">
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-muted">
                  {tNumber(selectedIds.length)} {t("service_chosen")} • {tNumber(totalDuration)} {t("mins")}
                </p>
                <p className="text-xl sm:text-2xl font-black text-primary">{t("total_price")}: ₹{tNumber(totalPrice)}</p>
              </div>

              <button
                disabled={selectedIds.length === 0}
                onClick={() => {
                  setStep("phone");
                  resetInactivityTimer();
                }}
                className={`min-h-[52px] sm:min-h-[64px] px-6 sm:px-8 rounded-xl font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 ${
                  selectedIds.length > 0
                    ? "bg-accent hover:opacity-95 text-white active:scale-95 shadow-md"
                    : "bg-[#E4E1DC] text-muted cursor-not-allowed"
                }`}
              >
                <span>{t("continue")}</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enter Details */}
        {step === "phone" && (
          <div className="max-w-lg mx-auto w-full bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#E4E1DC] shadow-lg space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary text-center">
              {t("enter_details")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-muted uppercase tracking-wider mb-1.5 sm:mb-2">
                  {t("name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    resetInactivityTimer();
                  }}
                  placeholder="e.g. Vikram Joshi"
                  className="w-full min-h-[52px] sm:min-h-[64px] bg-[#FAF8F5] border-2 border-[#E4E1DC] focus:border-primary rounded-xl px-4 sm:px-5 text-base sm:text-xl font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-muted uppercase tracking-wider mb-1.5 sm:mb-2">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    resetInactivityTimer();
                  }}
                  placeholder="10-digit mobile number"
                  className="w-full min-h-[52px] sm:min-h-[64px] bg-[#FAF8F5] border-2 border-[#E4E1DC] focus:border-primary rounded-xl px-4 sm:px-5 text-base sm:text-xl font-bold outline-none"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full min-h-[52px] sm:min-h-[64px] bg-primary hover:bg-[#182e4c] text-white font-black text-lg sm:text-xl rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-md mt-4 sm:mt-6"
              >
                <span>{loading ? t("sending") : t("send_code")}</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: OTP Verification */}
        {step === "otp" && (
          <div className="max-w-lg mx-auto w-full bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#E4E1DC] shadow-lg space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary text-center">
              {t("otp_title")}
            </h2>
            <p className="text-center text-xs sm:text-base text-muted">{t("otp_sent_to")} +91 {phone}</p>

            {demoOtp && (
              <div className="p-3 rounded-xl bg-[#DCE9F7] text-[#1F5FA8] text-xs sm:text-sm font-bold flex items-center justify-between">
                <span>{t("demo_otp_code")} {demoOtp}</span>
                <button
                  onClick={() => setOtp(demoOtp)}
                  className="underline"
                >
                  {t("autofill")}
                </button>
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                resetInactivityTimer();
              }}
              placeholder="123456"
              className="w-full min-h-[56px] sm:min-h-[72px] bg-[#FAF8F5] border-2 border-primary rounded-xl text-3xl sm:text-4xl font-black text-center tracking-widest outline-none"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className={`w-full min-h-[52px] sm:min-h-[64px] font-black text-lg sm:text-xl rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-md ${
                otp.length === 6 && !loading
                  ? "bg-accent text-white active:scale-95"
                  : "bg-[#E4E1DC] text-muted cursor-not-allowed"
              }`}
            >
              <span>{loading ? t("verifying") : t("verify_otp")}</span>
              <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Step 5: Final Token Slip with QR Code (F2 Spec) */}
        {step === "token" && tokenData && (
          <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-accent/40 shadow-2xl max-w-xl mx-auto w-full text-center space-y-5 sm:space-y-6 animate-fadeIn">
            <div className="inline-flex items-center gap-2 bg-[#D9EAD3] text-[#2D6A1F] px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t("in_line_badge")}</span>
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-muted uppercase tracking-wider">
                {t("your_token_number")}
              </p>
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-accent/15 border-4 border-accent text-primary flex items-center justify-center mx-auto shadow-inner">
                <span className="text-5xl sm:text-7xl font-black tracking-tight">
                  #{tNumber(tokenData.tokenNumber)}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#FAF8F5] px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-[#E4E1DC]">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="text-sm sm:text-lg font-extrabold text-[#1B1B1F]">
                {t("estimated_wait")}: {tNumber(tokenData.waitMinutes)} {t("mins")}
              </span>
            </div>

            {/* QR Code to track on phone (F2) */}
            <div className="p-3 sm:p-4 bg-[#FAF8F5] rounded-2xl border border-[#E4E1DC] inline-block space-y-2 max-w-full">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="Track Queue QR"
                  className="w-36 h-36 sm:w-48 sm:h-48 mx-auto rounded-lg shadow-sm"
                />
              )}
              <p className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                <QrIcon className="w-4 h-4" />
                <span>{t("scan_qr_phone")}</span>
              </p>
            </div>

            {/* 30s reset countdown (F2) */}
            <div className="pt-2 text-xs text-muted">
              <span>{t("reset_countdown_text")} <strong>{tNumber(countdown)}s</strong></span>
              <button
                onClick={handleFullReset}
                className="block mx-auto mt-2 text-primary font-bold hover:underline"
              >
                {t("done_next")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
