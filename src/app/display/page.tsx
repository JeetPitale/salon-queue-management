"use client";

import React, { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useLanguage } from "@/components/LanguageContext";
import { Language } from "@/lib/i18n";
import { Scissors, Clock, Users, Volume2, VolumeX, Sparkles, Globe } from "lucide-react";

interface DisplayEntry {
  id: string;
  tokenNumber: number;
  customerName: string;
  // Notice: NO phone number as per privacy rule (D1)
  status: string;
  estimatedWaitMinutes: number;
  calledAt: string | null;
  assignedStaff: { name: string } | null;
  services: { name: string }[];
}

export default function PublicDisplayBoard() {
  const { language, setLanguage, t, tService } = useLanguage();

  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [salonName, setSalonName] = useState("Velvet & Blade Salon");
  const [currentTime, setCurrentTime] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);

  // Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/staff/queue");
      if (res.ok) {
        const json = await res.json();
        const incomingEntries: DisplayEntry[] = json.entries || [];
        setEntries(incomingEntries);

        // Check if there is a newly called customer
        const calledEntry = incomingEntries.find((e) => e.status === "CALLED");
        if (calledEntry && calledEntry.id !== lastCalledId) {
          setLastCalledId(calledEntry.id);
          if (soundEnabled) {
            playChime();
          }
        }
      }
    } catch (err) {
      console.error("Display board fetch error", err);
    }
  };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch {
      // Audio autoplay policy
    }
  };

  useEffect(() => {
    fetch("/api/salon")
      .then((r) => r.json())
      .then((d) => {
        if (d?.salon?.name) setSalonName(d.salon.name);
      });

    fetchQueue();

    // SSE Live updates for < 2 seconds refresh (F4)
    const eventSource = new EventSource("/api/live");
    eventSource.onmessage = () => {
      fetchQueue();
    };

    const interval = setInterval(fetchQueue, 5000);
    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [soundEnabled, lastCalledId]);

  // Separate "Now Serving" (CALLED, IN_SERVICE) from "Next Up" (WAITING)
  const nowServing = entries.filter((e) => e.status === "CALLED" || e.status === "IN_SERVICE");
  const nextUp = entries.filter((e) => e.status === "WAITING");

  const avgWait =
    nextUp.length > 0
      ? Math.round(
          nextUp.reduce((sum, e) => sum + e.estimatedWaitMinutes, 0) / nextUp.length
        )
      : 0;

  // Helper to extract first name only (Rule D1: "Token numbers and first names only, never phone numbers")
  const getFirstName = (fullName: string) => {
    return fullName.trim().split(" ")[0];
  };

  return (
    <div className="min-h-screen bg-[#1F3A5F] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Banner: Salon Name, Clock, Chime Toggle & Language Selector */}
      <header className="bg-[#14263E] border-b border-white/10 px-4 sm:px-8 py-3.5 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent flex items-center justify-center text-white shadow-md shrink-0">
              <Scissors className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">{t("salon_name")}</h1>
              <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest">
                {t("display_subtitle")}
              </p>
            </div>
          </div>

          {/* Clock for mobile if stacked */}
          <div className="flex sm:hidden items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono font-bold tracking-wider">
              {currentTime}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Language Buttons */}
          <div className="flex items-center gap-1 bg-white/10 p-0.5 sm:p-1 rounded-xl border border-white/10">
            <Globe className="w-3.5 h-3.5 text-white/60 ml-1.5 mr-0.5 hidden xs:inline" />
            {(["en", "hi", "gu"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === lang
                    ? "bg-accent text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {lang === "en" ? "EN" : lang === "hi" ? "हिंदी" : "ગુજરાતી"}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <Clock className="w-5 h-5 text-accent" />
            <span className="text-xl lg:text-2xl font-mono font-bold tracking-wider">
              {currentTime}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/80"
            title={soundEnabled ? "Mute Chime" : "Enable Chime"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Grid: Responsive 1 col on mobile/tablet, 12-col on large screens */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl 2xl:max-w-[1800px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Now Serving: 1 col on small screens, 7 columns on desktop */}
        <section className="col-span-1 lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <h2 className="text-xl sm:text-2xl font-black tracking-wide flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-[#2D6A1F] animate-ping" />
              <span>{t("now_serving")}</span>
            </h2>
            <span className="text-xs sm:text-sm font-semibold text-white/70">
              {nowServing.length} {t("in_chairs")}
            </span>
          </div>

          {nowServing.length === 0 ? (
            <div className="flex-1 min-h-[180px] bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 sm:p-8 text-center">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mb-3" />
              <p className="text-lg sm:text-2xl font-bold text-white/60">
                {t("chairs_ready")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 auto-rows-fr">
              {nowServing.map((item) => {
                const isCalled = item.status === "CALLED";
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between border-2 transition-all ${
                      isCalled
                        ? "bg-[#DCE9F7] text-[#1F3A5F] border-accent shadow-2xl animate-call-pulse"
                        : "bg-white text-[#1B1B1F] border-transparent shadow-lg"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={item.status} size="md" />
                        {isCalled && (
                          <span className="text-[10px] sm:text-xs font-black uppercase text-[#1F5FA8] tracking-wider">
                            {t("proceed_chair_ticker")}
                          </span>
                        )}
                      </div>

                      <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight my-2">
                        #{item.tokenNumber}
                      </div>

                      {/* Token numbers and first names ONLY, never phone numbers (Rule D1) */}
                      <p className="text-lg sm:text-2xl font-extrabold truncate">
                        {getFirstName(item.customerName)}
                      </p>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-black/10 flex items-center justify-between text-xs sm:text-sm mt-3">
                      <span className="text-[11px] sm:text-xs font-semibold opacity-70">{t("assigned_stylist")}:</span>
                      <span className="font-bold truncate ml-2">
                        {item.assignedStaff?.name || t("available")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Next Up: 1 col on small screens, 5 columns on desktop */}
        <section className="col-span-1 lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-wide flex items-center gap-2 sm:gap-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent shrink-0" />
              <span>{t("next_up")}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-accent">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t("average_wait")}: {avgWait}m</span>
            </div>
          </div>

          <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-4 overflow-y-auto space-y-3">
            {nextUp.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6 text-white/50">
                <p className="text-lg">{t("no_waiting_display")}</p>
              </div>
            ) : (
              nextUp.slice(0, 7).map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white/10 hover:bg-white/15 rounded-2xl p-4 flex items-center justify-between border border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center text-lg font-bold text-white/50">
                      #{idx + 1}
                    </span>
                    <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black">
                      #{item.tokenNumber}
                    </div>
                    <div>
                      {/* First name only (Rule D1) */}
                      <p className="text-xl font-bold">{getFirstName(item.customerName)}</p>
                      <p className="text-xs text-white/70">
                        {item.services.map((s) => tService(s.name)).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-accent">
                      ~{item.estimatedWaitMinutes}m
                    </span>
                    <p className="text-xs text-white/50">{t("est_wait")}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Ticker */}
      <footer className="bg-[#14263E] border-t border-white/10 px-8 py-3 flex items-center justify-between text-xs text-white/60">
        <span>{t("privacy_notice")}</span>
        <span>{t("auto_refreshes")}</span>
      </footer>
    </div>
  );
}
