"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useLanguage } from "@/components/LanguageContext";
import { Clock, Users, ArrowRight, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface SalonData {
  salon: {
    id: string;
    name: string;
    address: string;
    phone: string;
    openingTime: string;
    closingTime: string;
    gracePeriodMinutes: number;
    isOpen: boolean;
  };
  waitingCount: number;
  estimatedWaitMinutes: number;
  workingStylistsCount: number;
}

export default function SalonHome() {
  const { t, tNumber } = useLanguage();
  const [data, setData] = useState<SalonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const fetchSalon = async () => {
    try {
      const res = await fetch("/api/salon");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load salon info", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalon();

    // Check if user has an active token in localStorage
    const savedEntryId = localStorage.getItem("active_token_id");
    if (savedEntryId) {
      fetch(`/api/queue/track/${savedEntryId}`)
        .then((r) => r.json())
        .then((trackData) => {
          if (
            trackData?.entry &&
            ["WAITING", "CALLED", "IN_SERVICE"].includes(trackData.entry.status)
          ) {
            setActiveEntryId(savedEntryId);
          } else {
            localStorage.removeItem("active_token_id");
          }
        })
        .catch(() => {});
    }

    // Connect to live SSE for real-time refresh
    const eventSource = new EventSource("/api/live");
    eventSource.onmessage = () => {
      fetchSalon();
    };

    const interval = setInterval(fetchSalon, 15000);
    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const isOpen = data?.salon?.isOpen ?? true;
  const waitingCount = data?.waitingCount ?? 0;
  const waitMinutes = data?.estimatedWaitMinutes ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />

      <main className="flex-1 max-w-md sm:max-w-lg lg:max-w-xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Open/Closed status pill & hours */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isOpen
                    ? "bg-[#D9EAD3] text-[#2D6A1F]"
                    : "bg-[#F4CCCC] text-[#8B1A1A]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpen ? "bg-[#2D6A1F]" : "bg-[#8B1A1A]"
                  }`}
                />
                {isOpen ? t("open") : t("closed")}
              </span>
              <span className="text-xs text-muted">
                {tNumber(data?.salon?.openingTime || "09:00")} - {tNumber(data?.salon?.closingTime || "21:00")}
              </span>
            </div>

            <button
              onClick={fetchSalon}
              className="p-2 rounded-lg text-muted hover:text-primary hover:bg-white border border-transparent hover:border-[#E4E1DC] transition-colors"
              title={t("refresh")}
              aria-label={t("refresh")}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Hero Wait Time Card */}
          <div
            id="tour-wait-card"
            className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#E4E1DC] shadow-sm text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-accent" />

            <p className="text-xs sm:text-sm font-semibold text-muted uppercase tracking-wider mb-2">
              {t("estimated_wait")}
            </p>

            <div className="my-3 flex items-baseline justify-center">
              <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-primary tracking-tight">
                {isOpen ? tNumber(waitMinutes) : "--"}
              </span>
              <span className="text-base sm:text-lg font-semibold text-muted ml-2">
                {t("mins")}
              </span>
            </div>

            {/* People waiting counter */}
            <div className="inline-flex items-center gap-2 bg-[#FAF8F5] px-4 py-2 rounded-full border border-[#E4E1DC] mt-2">
              <Users className="w-4 h-4 text-accent shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-[#1B1B1F]">
                {tNumber(waitingCount)} {t("people_waiting")}
              </span>
            </div>

            {waitingCount === 0 && isOpen && (
              <p className="mt-4 text-xs text-muted flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                {t("empty_queue")}
              </p>
            )}
          </div>

          {/* Quick Info Cards */}
          <div id="tour-info-cards" className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E4E1DC]">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Clock className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-semibold">{t("hours_today")}</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#1B1B1F] truncate">
                {tNumber(data?.salon?.openingTime || "09:00")} - {tNumber(data?.salon?.closingTime || "21:00")}
              </p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E4E1DC]">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Users className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-semibold">{t("active_stylists")}</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#1B1B1F] truncate">
                {tNumber(data?.workingStylistsCount ?? 0)} {t("on_duty")}
              </p>
            </div>
          </div>

          {/* Public Display & Kiosk Links for convenience */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 text-xs text-muted flex-wrap">
            <Link href="/display" className="hover:text-primary underline py-1">
              {t("salon_display")}
            </Link>
            <span>•</span>
            <Link href="/kiosk" className="hover:text-primary underline py-1">
              {t("kiosk_mode")}
            </Link>
          </div>
        </div>

        {/* Primary Action Button (R2 logic: View My Token vs Join Queue) */}
        <div id="tour-join-btn" className="mt-8 pt-4 pb-2">
          {!isOpen ? (
            <div className="bg-[#FAF8F5] border border-[#E4E1DC] p-4 rounded-xl text-center">
              <p className="text-sm font-medium text-muted">
                {t("salon_closed_desc")}{" "}
                {tNumber(data?.salon?.openingTime || "09:00")}.
              </p>
            </div>
          ) : activeEntryId ? (
            <Link
              href={`/track/${activeEntryId}`}
              className="w-full min-h-[48px] bg-accent hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-sm transition-all active:scale-[0.98]"
            >
              <span>{t("view_my_token")}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href="/join"
              className="w-full min-h-[48px] bg-primary hover:bg-[#182e4c] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-sm transition-all active:scale-[0.98]"
            >
              <span>{t("join_queue")}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </main>

      {/* Interactive Onboarding Tour */}
      <OnboardingTour role="customer" />
    </div>
  );
}
