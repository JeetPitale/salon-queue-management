"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { useLanguage } from "@/components/LanguageContext";
import {
  Clock,
  Users,
  AlertTriangle,
  XCircle,
  Sparkles,
  WifiOff,
  Star,
  CheckCircle2,
} from "lucide-react";

interface EntryDetails {
  id: string;
  tokenNumber: number;
  status: string;
  estimatedWaitMinutes: number;
  position: number;
  peopleAhead: number;
  calledAt: string | null;
  graceSecondsRemaining: number;
  assignedStaff: { name: string } | null;
  salon: {
    id: string;
    name: string;
    phone: string;
    gracePeriodMinutes: number;
  };
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  }[];
}

export default function TokenLiveTracking({
  params,
}: {
  params: { entryId: string };
}) {
  const { entryId } = params;
  const { t, tService } = useLanguage();

  const [data, setData] = useState<EntryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [graceCountdown, setGraceCountdown] = useState<number>(0);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchEntry = async () => {
    try {
      const res = await fetch(`/api/queue/track/${entryId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.entry);
        if (json.entry?.graceSecondsRemaining) {
          setGraceCountdown(json.entry.graceSecondsRemaining);
        }
      }
    } catch (err) {
      console.error(err);
      setReconnecting(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntry();

    // SSE Live updates with reconnect banner (F4)
    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      eventSource = new EventSource("/api/live");
      eventSource.onopen = () => {
        setReconnecting(false);
      };
      eventSource.onmessage = () => {
        fetchEntry();
      };
      eventSource.onerror = () => {
        setReconnecting(true);
        eventSource?.close();
        setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();

    // Polling fallback every 15s (F4)
    const pollInterval = setInterval(fetchEntry, 15000);

    return () => {
      eventSource?.close();
      clearInterval(pollInterval);
    };
  }, [entryId]);

  // Grace timer countdown tick
  useEffect(() => {
    if (data?.status === "CALLED" && graceCountdown > 0) {
      const timer = setInterval(() => {
        setGraceCountdown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [data?.status, graceCountdown]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/queue/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, reason: "Cancelled by customer" }),
      });
      if (res.ok) {
        localStorage.removeItem("active_token_id");
        fetchEntry();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
      setCancelModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <Header />
        <main className="flex-1 max-w-md w-full mx-auto p-6 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <Header />
        <main className="flex-1 max-w-md w-full mx-auto p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-accent mx-auto" />
          <h2 className="text-xl font-bold text-primary">{t("token_not_found")}</h2>
          <p className="text-sm text-muted">
            {t("token_not_found_desc")}
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-white font-bold py-2.5 px-6 rounded-xl text-sm"
          >
            {t("return_home")}
          </Link>
        </main>
      </div>
    );
  }

  const isCalled = data.status === "CALLED";
  const isCompleted = data.status === "COMPLETED";
  const isWaiting = data.status === "WAITING";
  const isFinal = ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(data.status);
  const canCancel = isWaiting || isCalled;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />

      {/* Reconnecting banner (F4) */}
      {reconnecting && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-1 px-4 text-center flex items-center justify-center gap-1.5 animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t("reconnecting")}</span>
        </div>
      )}

      {/* Near Turn Banner if position <= 2 */}
      {isWaiting && data.position <= 2 && (
        <div className="bg-[#DCE9F7] border-b border-[#1F5FA8]/20 text-[#1F5FA8] py-2 px-4 text-center text-xs font-bold flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>{t("turn_close_alert")}</span>
        </div>
      )}

      {/* Called Pulsing Banner (C4 & F5) */}
      {isCalled && (
        <div className="bg-gradient-to-r from-primary to-[#2C5282] text-white py-3 px-4 text-center animate-call-pulse shadow-md">
          <p className="text-sm font-extrabold uppercase tracking-wide">
            {t("proceed_to_chair")}
          </p>
          <p className="text-xs opacity-90 mt-0.5">
            {t("assigned_stylist")}: <strong>{data.assignedStaff?.name || "Stylist"}</strong>
          </p>
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mt-2">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {t("grace_remaining")}: {formatSeconds(graceCountdown)}
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-md sm:max-w-lg lg:max-w-xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Centered Token Inside Accent Circle & Badge (C4 spec) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#E4E1DC] shadow-sm text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              {t("token")}
            </p>

            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-accent/40 bg-accent/10 flex items-center justify-center mx-auto my-2 shadow-inner">
              <span className="text-5xl sm:text-6xl font-black text-primary tracking-tight">
                #{data.tokenNumber}
              </span>
            </div>

            {/* Status Badge directly below token */}
            <div className="mt-4">
              <StatusBadge status={data.status} size="lg" />
            </div>

            {/* In-service note */}
            {data.status === "IN_SERVICE" && (
              <p className="text-xs text-muted mt-3">
                {t("service_in_progress_with")} {data.assignedStaff?.name || "stylist"}.
              </p>
            )}
          </div>

          {/* Live Position & Estimated Wait (unless final) */}
          {!isFinal && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-[#E4E1DC] text-center">
                <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold text-muted">
                    {t("people_ahead")}
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-primary">
                  {data.peopleAhead}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E4E1DC] text-center">
                <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold text-muted">
                    {t("estimated_wait")}
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-primary">
                  {data.estimatedWaitMinutes} <span className="text-xs font-normal text-muted">{t("mins")}</span>
                </p>
              </div>
            </div>
          )}

          {/* Completed State (C4 spec: show summary and link to feedback) */}
          {isCompleted && (
            <div className="bg-[#D9EAD3]/40 border border-[#2D6A1F]/30 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#2D6A1F] mx-auto" />
              <h3 className="font-bold text-lg text-[#2D6A1F]">
                {t("service_completed_title")}
              </h3>
              <p className="text-xs text-muted">
                {t("thank_you_hope_great")}
              </p>
              <Link
                href={`/feedback/${data.id}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-[#182e4c] text-white font-bold py-3 px-6 rounded-xl text-sm shadow-sm transition-all"
              >
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span>{t("rate_experience")}</span>
              </Link>
            </div>
          )}

          {/* Selected Services List */}
          <div className="bg-white rounded-xl border border-[#E4E1DC] p-4 space-y-3">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
              {t("selected_services_title")}
            </h4>
            <div className="divide-y divide-[#E4E1DC]">
              {data.services.map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-[#1B1B1F]">{tService(s.name)}</span>
                    <span className="text-xs text-muted ml-2">({s.durationMinutes} {t("mins")})</span>
                  </div>
                  <span className="font-bold text-primary">₹{s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 pb-2">
          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="w-full min-h-[48px] bg-white border border-[#8B1A1A]/40 text-[#8B1A1A] hover:bg-[#F4CCCC]/20 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>{t("cancel_queue")}</span>
            </button>
          )}

          {isFinal && !isCompleted && (
            <Link
              href="/"
              className="w-full min-h-[48px] bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-sm"
            >
              {t("return_home")}
            </Link>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 sm:p-6 space-y-4 border border-[#E4E1DC] shadow-xl my-auto">
            <h3 className="font-bold text-lg text-primary">{t("cancel_queue")}</h3>
            <p className="text-sm text-muted">
              {t("cancel_confirm")} {t("cancel_modal_desc")}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E4E1DC] font-semibold text-sm text-[#1B1B1F]"
              >
                {t("keep_turn")}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-[#8B1A1A] hover:bg-[#701515] text-white font-bold text-sm"
              >
                {cancelling ? t("cancelling") : t("yes_cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
