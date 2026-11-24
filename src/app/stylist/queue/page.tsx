"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Scissors,
  LogOut,
  Play,
  CheckCircle,
  Bell,
  Clock,
  Sparkles,
  Phone,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface StylistUser {
  id: string;
  name: string;
  username: string;
  role: string;
  status: "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFF_DUTY";
  skills: { id: string; name: string }[];
}

interface QueueRow {
  id: string;
  tokenNumber: number;
  customerName: string;
  customerPhone: string;
  status: string;
  estimatedWaitMinutes: number;
  calledAt: string | null;
  startedAt: string | null;
  assignedStaff: { id: string; name: string } | null;
  services: { id: string; name: string; durationMinutes: number; price: number }[];
  isWalkIn: boolean;
}

export default function StylistChairConsole() {
  const router = useRouter();
  const [stylist, setStylist] = useState<StylistUser | null>(null);
  const [entries, setEntries] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("stylist_user");
    if (!stored) {
      router.replace("/stylist/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "STYLIST") {
        localStorage.removeItem("stylist_user");
        router.replace("/stylist/login");
        return;
      }
      setStylist(parsed);
    } catch {
      router.replace("/stylist/login");
    }
  }, [router]);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/staff/queue");
      if (res.ok) {
        const json = await res.json();
        setEntries(json.entries || []);
        // Refresh stylist status from server
        if (stylist) {
          const fresh = json.stylists?.find((s: { id: string }) => s.id === stylist.id);
          if (fresh && fresh.status !== stylist.status) {
            setStylist((prev) => (prev ? { ...prev, status: fresh.status } : null));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const eventSource = new EventSource("/api/live");
    eventSource.onmessage = () => {
      fetchQueue();
    };

    const interval = setInterval(fetchQueue, 5000);
    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [stylist?.id]);

  const handleUpdateStatus = async (
    newStatus: "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFF_DUTY"
  ) => {
    if (!stylist) return;
    setErrorMsg(null);
    try {
      const res = await fetch("/api/staff/stylist-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: stylist.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status change failed");
      setStylist((prev) => (prev ? { ...prev, status: newStatus } : null));
      fetchQueue();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error changing status");
    }
  };

  const handleAction = async (action: string, entryId: string) => {
    if (!stylist) return;
    setErrorMsg(null);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, entryId, staffId: stylist.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      fetchQueue();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("stylist_user");
    router.replace("/stylist/login");
  };

  if (!stylist) return null;

  // 1. My Currently Assigned Customer (CALLED or IN_SERVICE)
  const currentServing = entries.find(
    (e) =>
      e.assignedStaff?.id === stylist.id &&
      (e.status === "CALLED" || e.status === "IN_SERVICE")
  );

  // 2. Waiting customers matching this stylist's exact skills (R4)
  const stylistSkillIds = stylist.skills.map((sk) => sk.id);
  const eligibleWaiting = entries.filter((e) => {
    if (e.status !== "WAITING") return false;
    const reqIds = e.services.map((s) => s.id);
    return reqIds.every((id) => stylistSkillIds.includes(id));
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans overflow-x-hidden">
      {/* Stylist Chair Header */}
      <header className="bg-white border-b border-[#E4E1DC] sticky top-0 z-30 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-lg sm:text-xl text-primary truncate">Chair Console: {stylist.name}</h1>
            <p className="text-xs text-muted truncate">
              Skills: {stylist.skills.map((s) => s.name).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-4">
          <button
            onClick={fetchQueue}
            className="p-2 rounded-xl text-muted hover:text-primary border border-[#E4E1DC] transition-colors"
            title="Refresh"
            aria-label="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-[#E4E1DC] text-muted hover:text-[#8B1A1A] hover:bg-[#F4CCCC]/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-[#F4CCCC] border border-[#8B1A1A]/40 text-[#8B1A1A] text-sm font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Chair Status Selector (F9: Available, Busy, On Break, Off Duty) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E4E1DC] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">
              My Current Chair Availability
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  stylist.status === "AVAILABLE"
                    ? "bg-[#2D6A1F]"
                    : stylist.status === "BUSY"
                    ? "bg-[#6B3FA0]"
                    : stylist.status === "ON_BREAK"
                    ? "bg-[#B45F06]"
                    : "bg-[#555555]"
                }`}
              />
              <span className="text-base sm:text-lg font-black text-primary">
                {stylist.status.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
            {(["AVAILABLE", "BUSY", "ON_BREAK", "OFF_DUTY"] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleUpdateStatus(st)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  stylist.status === st
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-[#FAF8F5] text-muted border-[#E4E1DC] hover:border-primary/40"
                }`}
              >
                {st === "AVAILABLE"
                  ? "Available"
                  : st === "BUSY"
                  ? "Busy"
                  : st === "ON_BREAK"
                  ? "On Break"
                  : "Off Duty"}
              </button>
            ))}
          </div>
        </div>

        {/* Active Customer in Chair */}
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-primary">Current Turn in My Chair</h2>

          {currentServing ? (
            <div
              className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all shadow-md ${
                currentServing.status === "CALLED"
                  ? "bg-[#DCE9F7]/40 border-accent animate-call-pulse"
                  : "bg-white border-[#2D6A1F]"
              }`}
            >
              <div className="flex items-center justify-between">
                <StatusBadge status={currentServing.status} size="lg" />
                <span className="text-xs font-mono text-muted flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {currentServing.customerPhone}
                </span>
              </div>

              <div className="my-4">
                <span className="text-5xl sm:text-6xl font-black text-primary">
                  #{currentServing.tokenNumber}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1B1B1F] mt-1 break-words">
                  {currentServing.customerName}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-muted mt-1">
                  Services: {currentServing.services.map((s) => s.name).join(", ")} (
                  {currentServing.services.reduce((a, b) => a + b.durationMinutes, 0)} mins)
                </p>
              </div>

              {/* Action Buttons for Chair */}
              <div className="flex items-center gap-3 pt-3 border-t border-black/10">
                {currentServing.status === "CALLED" && (
                  <button
                    onClick={() => handleAction("start", currentServing.id)}
                    className="flex-1 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#6B3FA0] hover:opacity-90 text-white font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm active:scale-95 px-3"
                  >
                    <Play className="w-4 h-4 sm:w-5 h-5 shrink-0" />
                    <span>Customer Seated: Start Service</span>
                  </button>
                )}

                {currentServing.status === "IN_SERVICE" && (
                  <button
                    onClick={() => handleAction("complete", currentServing.id)}
                    className="flex-1 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#2D6A1F] hover:opacity-90 text-white font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm active:scale-95 px-3"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 h-5 shrink-0" />
                    <span>Work Done: Complete Service</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-[#E4E1DC] text-center space-y-2">
              <Sparkles className="w-10 h-10 text-accent/50 mx-auto" />
              <p className="font-bold text-base text-[#1B1B1F]">Your Chair is Currently Free</p>
              <p className="text-xs text-muted">
                Pick a waiting customer matching your skills below to call them to your chair.
              </p>
            </div>
          )}
        </div>

        {/* Next Waiting Customers Matching My Skills (R4) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-primary">
              Customers Waiting for My Skills ({eligibleWaiting.length})
            </h2>
            <span className="text-xs text-muted bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E4E1DC] shrink-0">
              Rule R4 Skill-Matched
            </span>
          </div>

          <div className="space-y-2.5">
            {eligibleWaiting.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-[#E4E1DC] text-center text-xs text-muted">
                No eligible customers waiting for your specific skills at this moment.
              </div>
            ) : (
              eligibleWaiting.map((cust) => (
                <div
                  key={cust.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E4E1DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl sm:text-3xl font-black text-primary shrink-0">
                      #{cust.tokenNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-[#1B1B1F] truncate" title={cust.customerName}>
                        {cust.customerName}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {cust.services.map((s) => s.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4E1DC]/70 shrink-0">
                    <div className="text-left sm:text-right text-xs">
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        {cust.estimatedWaitMinutes}m wait
                      </span>
                    </div>

                    <button
                      disabled={Boolean(currentServing)}
                      onClick={() => handleAction("call", cust.id)}
                      className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                        !currentServing
                          ? "bg-accent hover:opacity-95 text-white active:scale-95 cursor-pointer"
                          : "bg-[#E4E1DC] text-muted cursor-not-allowed"
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Call to My Chair</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
