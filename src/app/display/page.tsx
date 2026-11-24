"use client";

import React, { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Scissors, Clock, Users, Volume2, VolumeX, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-[#1F3A5F] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Banner: Salon Name, Clock, Chime Toggle */}
      <header className="bg-[#14263E] border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white shadow-md">
            <Scissors className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{salonName}</h1>
            <p className="text-xs text-white/70 uppercase tracking-widest">
              Live Queue Display
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 bg-white/10 px-5 py-2 rounded-xl border border-white/10">
            <Clock className="w-5 h-5 text-accent" />
            <span className="text-2xl font-mono font-bold tracking-wider">
              {currentTime}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/80"
            title={soundEnabled ? "Mute Chime" : "Enable Chime"}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-accent" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Grid: Left = Now Serving (Large), Right = Next Up */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-8">
        {/* Left 7 Columns: Now Serving */}
        <section className="col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <h2 className="text-2xl font-black tracking-wide flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-[#2D6A1F] animate-ping" />
              <span>NOW SERVING</span>
            </h2>
            <span className="text-sm font-semibold text-white/70">
              {nowServing.length} in chairs
            </span>
          </div>

          {nowServing.length === 0 ? (
            <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-16 h-16 text-white/30 mb-3" />
              <p className="text-2xl font-bold text-white/60">
                Chairs are ready. Next customers being called!
              </p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-fr">
              {nowServing.map((item) => {
                const isCalled = item.status === "CALLED";
                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl p-6 flex flex-col justify-between border-2 transition-all ${
                      isCalled
                        ? "bg-[#DCE9F7] text-[#1F3A5F] border-accent shadow-2xl animate-call-pulse scale-[1.02]"
                        : "bg-white text-[#1B1B1F] border-transparent shadow-lg"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={item.status} size="md" />
                        {isCalled && (
                          <span className="text-xs font-black uppercase text-[#1F5FA8] tracking-wider">
                            Proceed to Chair
                          </span>
                        )}
                      </div>

                      <div className="text-6xl font-black tracking-tight my-2">
                        #{item.tokenNumber}
                      </div>

                      {/* Token numbers and first names ONLY, never phone numbers (Rule D1) */}
                      <p className="text-2xl font-extrabold truncate">
                        {getFirstName(item.customerName)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-black/10 flex items-center justify-between text-sm">
                      <span className="text-xs font-semibold opacity-70">Stylist:</span>
                      <span className="font-bold">
                        {item.assignedStaff?.name || "Available"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right 5 Columns: Next Up & Wait Time Metrics */}
        <section className="col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <h2 className="text-2xl font-black tracking-wide flex items-center gap-3">
              <Users className="w-6 h-6 text-accent" />
              <span>NEXT UP</span>
            </h2>
            <div className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Clock className="w-4 h-4" />
              <span>Avg Wait: {avgWait}m</span>
            </div>
          </div>

          <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-4 overflow-y-auto space-y-3">
            {nextUp.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6 text-white/50">
                <p className="text-lg">No one currently waiting.</p>
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
                        {item.services.map((s) => s.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-accent">
                      ~{item.estimatedWaitMinutes}m
                    </span>
                    <p className="text-xs text-white/50">est. wait</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Ticker */}
      <footer className="bg-[#14263E] border-t border-white/10 px-8 py-3 flex items-center justify-between text-xs text-white/60">
        <span>Phone numbers are masked for privacy • Live tracking enabled</span>
        <span>Auto-refreshes every 2 seconds</span>
      </footer>
    </div>
  );
}
