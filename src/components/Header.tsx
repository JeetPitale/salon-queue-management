"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";
import { Language } from "@/lib/i18n";
import {
  Scissors,
  Globe,
  User,
  ShieldCheck,
  ClipboardList,
  ChevronDown,
  X,
} from "lucide-react";

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [portalModalOpen, setPortalModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E4E1DC] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <span>{t("salon_name")}</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1 text-sm bg-[#FAF8F5] border border-[#E4E1DC] rounded-lg p-1">
              <Globe className="w-3.5 h-3.5 text-muted ml-1" />
              {(["en", "hi", "gu"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    language === lang
                      ? "bg-primary text-white"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {lang === "en" ? "EN" : lang === "hi" ? "हिं" : "ગુ"}
                </button>
              ))}
            </div>

            {/* Isolated Portals Launcher Button */}
            <button
              onClick={() => setPortalModalOpen(true)}
              className="text-xs font-bold text-primary hover:text-accent px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] hover:border-primary flex items-center gap-1.5 transition-colors"
              title="Staff & Admin Portals"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portals</span>
              <ChevronDown className="w-3 h-3 text-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* Portals Selection Modal */}
      {portalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E4E1DC] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E1DC]">
              <h3 className="font-black text-lg text-primary">Select Staff Portal</h3>
              <button
                onClick={() => setPortalModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted">
              Choose your role to access your dedicated, isolated console:
            </p>

            <div className="space-y-2.5">
              <Link
                href="/admin/login"
                onClick={() => setPortalModalOpen(false)}
                className="p-3.5 rounded-2xl border-2 border-[#111C2B]/10 hover:border-[#111C2B] bg-[#111C2B]/5 flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#111C2B] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#111C2B]">Admin Portal</h4>
                  <p className="text-[11px] text-muted">Owner settings, services, staff &amp; reports</p>
                </div>
              </Link>

              <Link
                href="/receptionist/login"
                onClick={() => setPortalModalOpen(false)}
                className="p-3.5 rounded-2xl border-2 border-primary/10 hover:border-primary bg-primary/5 flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-primary">Reception Desk</h4>
                  <p className="text-[11px] text-muted">Front desk, walk-ins, calling turns &amp; payments</p>
                </div>
              </Link>

              <Link
                href="/stylist/login"
                onClick={() => setPortalModalOpen(false)}
                className="p-3.5 rounded-2xl border-2 border-accent/20 hover:border-accent bg-accent/5 flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-accent">Stylist Chair</h4>
                  <p className="text-[11px] text-muted">Service provider chair console &amp; skill matching</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
