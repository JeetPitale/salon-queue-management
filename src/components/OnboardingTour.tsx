"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "./LanguageContext";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Eye,
} from "lucide-react";

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "center";
}

interface OnboardingTourProps {
  role?: "customer" | "staff" | "admin";
  customSteps?: TourStep[];
  autoStartOnFirstVisit?: boolean;
}

export function OnboardingTour({
  role = "customer",
  customSteps,
  autoStartOnFirstVisit = true,
}: OnboardingTourProps) {
  const { t, tNumber } = useLanguage();
  const storageKey = `salon_tour_completed_${role}`;

  const [hasCompleted, setHasCompleted] = useState<boolean>(true); // default true until client checks
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showCompletedModal, setShowCompletedModal] = useState<boolean>(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Default step definitions for each role
  const getSteps = useCallback((): TourStep[] => {
    if (customSteps && customSteps.length > 0) return customSteps;

    if (role === "customer") {
      return [
        {
          targetId: "tour-wait-card",
          title: t("tour_step1_title") || "Real-Time Wait Time",
          content:
            t("tour_step1_desc") ||
            "Live estimated waiting minutes calculated dynamically using total service duration ahead divided by active stylists on duty.",
          placement: "bottom",
        },
        {
          targetId: "tour-info-cards",
          title: t("tour_step2_title") || "Queue Status & Hours",
          content:
            t("tour_step2_desc") ||
            "Check current queue depth, active working stylists, and daily salon opening hours at a glance.",
          placement: "bottom",
        },
        {
          targetId: "tour-join-btn",
          title: t("tour_step3_title") || "Join the Virtual Line",
          content:
            t("tour_step3_desc") ||
            "Tap here to browse services, see combined duration & pricing in your sticky cart, and verify your phone number to get your live token.",
          placement: "top",
        },
        {
          targetId: "tour-header-lang",
          title: t("tour_step4_title") || "Trilingual Localization",
          content:
            t("tour_step4_desc") ||
            "Seamlessly switch between English, Hindi, and Gujarati with automatic numeral transliteration across the entire interface.",
          placement: "bottom",
        },
        {
          targetId: "tour-header-portals",
          title: t("tour_step5_title") || "Public Display & Staff Consoles",
          content:
            t("tour_step5_desc") ||
            "Access the waiting area Salon TV display with audio chimes, the touch entrance kiosk, and role-isolated staff stations.",
          placement: "bottom",
        },
      ];
    }

    if (role === "staff") {
      return [
        {
          targetId: "tour-staff-stats",
          title: "Live Queue Overview",
          content:
            "Monitor total waiting customers, active clients in service chairs, and completed visits for the day.",
          placement: "bottom",
        },
        {
          targetId: "tour-staff-list",
          title: "Customer Queue Roster",
          content:
            "View token numbers, requested services, estimated turn times, and 10-minute grace countdowns when called.",
          placement: "bottom",
        },
        {
          targetId: "tour-staff-call-btn",
          title: "Skill-Matched Dispatching",
          content:
            "Call the next waiting customer. The system automatically validates that the assigned stylist possesses all required skills.",
          placement: "bottom",
        },
        {
          targetId: "tour-staff-actions",
          title: "Frontdesk Walk-Ins & Payments",
          content:
            "Quickly issue tokens for walk-in clients without smartphones and record UPI or cash payments upon service completion.",
          placement: "bottom",
        },
      ];
    }

    // Admin role
    return [
      {
        targetId: "tour-admin-metrics",
        title: "Salon Analytics & KPI Metrics",
        content:
          "Track today's total footfall, average waiting times, no-show rates, and gross revenue in real time.",
        placement: "bottom",
      },
      {
        targetId: "tour-admin-nav",
        title: "Management Console",
        content:
          "Easily manage salon services, pricing, operating schedules, staff accounts, and stylist skill matrices.",
        placement: "bottom",
      },
      {
        targetId: "tour-admin-export",
        title: "CSV Reports Export",
        content:
          "Download comprehensive daily visit records, payment methods, and customer ratings for bookkeeping.",
        placement: "bottom",
      },
    ];
  }, [role, customSteps, t]);

  const steps = getSteps();

  // Check initial visit status from localStorage
  useEffect(() => {
    try {
      const completed = localStorage.getItem(storageKey);
      if (!completed && autoStartOnFirstVisit) {
        setHasCompleted(false);
        // Small delay to let the page render smoothly first
        const timer = setTimeout(() => setShowWelcome(true), 600);
        return () => clearTimeout(timer);
      } else {
        setHasCompleted(!!completed);
      }
    } catch {
      // localStorage may fail in restricted iframes
    }
  }, [storageKey, autoStartOnFirstVisit]);

  // Listen for global restart tour events
  useEffect(() => {
    const handleStartTour = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.role || detail.role === role) {
        startTour();
      }
    };
    window.addEventListener("start-salon-tour", handleStartTour);
    return () => window.removeEventListener("start-salon-tour", handleStartTour);
  }, [role]);

  // Update target bounding box and scroll into view when step changes
  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const updateRect = () => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      };
      updateRect();

      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect, { passive: true });
      return () => {
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect);
      };
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStepIndex, steps]);

  const startTour = () => {
    setShowWelcome(false);
    setShowCompletedModal(false);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const skipTour = () => {
    setIsActive(false);
    setShowWelcome(false);
    try {
      localStorage.setItem(storageKey, "true");
      setHasCompleted(true);
    } catch {}
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const finishTour = () => {
    setIsActive(false);
    setShowCompletedModal(true);
    try {
      localStorage.setItem(storageKey, "true");
      setHasCompleted(true);
    } catch {}
  };

  const currentStep = steps[currentStepIndex];

  return (
    <>
      {/* 1. Welcoming Introduction Modal (Shown on First Visit) */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E4E1DC] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

            <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#E4E1DC] text-accent flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Compass className="w-8 h-8 animate-pulse text-accent" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#F3ECE1] text-[#916E2E] mb-2">
              {role === "customer" ? "Welcome Guide" : role === "staff" ? "Staff Onboarding" : "Admin Tour"}
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight mb-2">
              {t("tour_welcome_title") || "Welcome to Velvet & Blade Salon!"}
            </h2>

            <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6">
              {t("tour_welcome_desc") ||
                "Take a quick 1-minute interactive tour to learn how to check live wait times, pick your services, and track your turn in real time."}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={startTour}
                className="w-full min-h-[46px] bg-primary hover:bg-[#182e4c] text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span>{t("start_tour") || "Start Interactive Tour"}</span>
              </button>
              <button
                onClick={skipTour}
                className="w-full sm:w-auto min-h-[46px] text-muted hover:text-primary py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-colors hover:bg-[#FAF8F5]"
              >
                {t("maybe_later") || "Maybe Later"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Tour Backdrop & Floating Tooltip */}
      {isActive && currentStep && (
        <div className="fixed inset-0 z-[110] pointer-events-none">
          {/* Backdrop darkened overlay with pointer events */}
          <div
            onClick={skipTour}
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] pointer-events-auto transition-opacity duration-300"
          />

          {/* Highlight ring around target element */}
          {targetRect && (
            <div
              style={{
                position: "fixed",
                top: Math.max(0, targetRect.top - 6),
                left: Math.max(0, targetRect.left - 6),
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                borderRadius: 16,
              }}
              className="pointer-events-none ring-4 ring-accent shadow-[0_0_30px_rgba(197,160,89,0.5)] z-[115] transition-all duration-300"
            />
          )}

          {/* Floating Tooltip Card */}
          <div className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bottom-6 sm:bottom-10 max-w-sm sm:max-w-md w-full mx-auto pointer-events-auto z-[120] animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-accent/40 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" />

              {/* Header: Progress & Close */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3ECE1] text-[#916E2E]">
                    {t("step_indicator") || "Step"} {tNumber(currentStepIndex + 1)} {t("of") || "of"}{" "}
                    {tNumber(steps.length)}
                  </span>
                  <span className="text-[11px] text-muted font-medium capitalize">
                    {role} tour
                  </span>
                </div>

                <button
                  onClick={skipTour}
                  className="p-1 rounded-lg text-muted hover:text-primary hover:bg-[#FAF8F5] transition-colors"
                  title={t("skip_tour") || "Skip Tour"}
                  aria-label={t("skip_tour") || "Skip Tour"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg font-bold text-primary mb-1">
                {currentStep.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed mb-4">
                {currentStep.content}
              </p>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex
                        ? "w-6 bg-accent"
                        : idx < currentStepIndex
                        ? "w-2 bg-primary/40"
                        : "w-2 bg-[#E4E1DC]"
                    }`}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    currentStepIndex === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-muted hover:text-primary hover:bg-[#FAF8F5]"
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t("prev") || "Previous"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={skipTour}
                    className="text-xs text-muted hover:text-primary underline px-2 py-1"
                  >
                    {t("skip_tour") || "Skip"}
                  </button>

                  <button
                    onClick={nextStep}
                    className="px-4 py-2 bg-primary hover:bg-[#182e4c] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>
                      {currentStepIndex === steps.length - 1
                        ? t("finish_tour") || "Finish Tour"
                        : t("next") || "Next"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Final Completion Celebratory Modal */}
      {showCompletedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E4E1DC] text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />

            <div className="w-16 h-16 rounded-full bg-[#D9EAD3] text-[#2D6A1F] flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight mb-2">
              {t("tour_complete_title") || "You're All Set!"}
            </h2>

            <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6">
              {t("tour_complete_desc") ||
                "You now know how the queue system works. Pick your services and join the line whenever you're ready!"}
            </p>

            <button
              onClick={() => setShowCompletedModal(false)}
              className="w-full min-h-[46px] bg-primary hover:bg-[#182e4c] text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <span>{t("get_started") || "Get Started"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Persistent Subtle "Take a Tour" floating trigger */}
      {hasCompleted && !isActive && !showWelcome && !showCompletedModal && (
        <button
          onClick={startTour}
          className="fixed bottom-4 right-4 z-30 bg-white/95 hover:bg-white text-primary border border-[#E4E1DC] hover:border-accent shadow-md hover:shadow-lg px-3 py-2 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 group"
          title={t("restart_tour") || "Take a Tour"}
          aria-label={t("restart_tour") || "Take a Tour"}
        >
          <Compass className="w-3.5 h-3.5 text-accent group-hover:rotate-45 transition-transform" />
          <span className="hidden xs:inline">{t("restart_tour") || "Explore Tour"}</span>
        </button>
      )}
    </>
  );
}

// Global helper to trigger the tour from any menu or button
export function restartSalonTour(role: "customer" | "staff" | "admin" = "customer") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("start-salon-tour", { detail: { role } }));
  }
}
