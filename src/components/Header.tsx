"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Menu,
  Tv,
  Tablet,
  Home,
  UserPlus,
} from "lucide-react";

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E4E1DC] px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg tracking-tight shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              {t("salon_name")}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-muted">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/" ? "bg-[#FAF8F5] text-primary font-bold" : "hover:text-primary"
              }`}
            >
              {t("join_queue")}
            </Link>
            <Link
              href="/display"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname === "/display" ? "bg-[#FAF8F5] text-primary font-bold" : "hover:text-primary"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{t("salon_display")}</span>
            </Link>
            <Link
              href="/kiosk"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname === "/kiosk" ? "bg-[#FAF8F5] text-primary font-bold" : "hover:text-primary"
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>{t("kiosk_mode")}</span>
            </Link>
          </nav>

          {/* Actions & Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-0.5 sm:gap-1 text-xs bg-[#FAF8F5] border border-[#E4E1DC] rounded-lg p-0.5 sm:p-1">
              <Globe className="w-3 h-3 text-muted ml-0.5 sm:ml-1 hidden xs:inline" />
              {(["en", "hi", "gu"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  aria-label={`Switch to ${lang}`}
                  className={`px-1.5 sm:px-2 py-1 rounded text-[11px] sm:text-xs font-semibold transition-colors ${
                    language === lang
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {lang === "en" ? "EN" : lang === "hi" ? "हिं" : "ગુ"}
                </button>
              ))}
            </div>

            {/* Portals Launcher Button */}
            <button
              onClick={() => setPortalModalOpen(true)}
              className="text-xs font-bold text-primary hover:text-accent px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#E4E1DC] hover:border-primary flex items-center gap-1 sm:gap-1.5 transition-colors min-h-[36px]"
              title={t("portals")}
              aria-label={t("portals")}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("portals")}</span>
              <ChevronDown className="w-3 h-3 text-muted" />
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg border border-[#E4E1DC] text-primary hover:bg-[#FAF8F5] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-[#E4E1DC] mt-2.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/" ? "bg-primary text-white" : "text-primary hover:bg-[#FAF8F5]"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t("join_queue")}</span>
            </Link>

            <Link
              href="/join"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/join" ? "bg-primary text-white" : "text-primary hover:bg-[#FAF8F5]"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("select_services")}</span>
            </Link>

            <Link
              href="/display"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/display" ? "bg-primary text-white" : "text-primary hover:bg-[#FAF8F5]"
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>{t("salon_display")}</span>
            </Link>

            <Link
              href="/kiosk"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/kiosk" ? "bg-primary text-white" : "text-primary hover:bg-[#FAF8F5]"
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>{t("kiosk_mode")}</span>
            </Link>

            <div className="pt-2 border-t border-[#E4E1DC] mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPortalModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-sm font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>{t("select_staff_portal")}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Portals Selection Modal */}
      {portalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 border border-[#E4E1DC] shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E1DC]">
              <h3 className="font-black text-base sm:text-lg text-primary">{t("select_staff_portal")}</h3>
              <button
                onClick={() => setPortalModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-[#FAF8F5] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted">
              {t("select_portal_subtitle")}
            </p>

            <div className="space-y-2.5">
              <Link
                href="/admin/login"
                onClick={() => setPortalModalOpen(false)}
                className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-[#111C2B]/10 hover:border-[#111C2B] bg-[#111C2B]/5 flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#111C2B] text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-[#111C2B] truncate">{t("admin_portal_title")}</h4>
                  <p className="text-[11px] text-muted line-clamp-1">{t("admin_portal_desc")}</p>
                </div>
              </Link>

              <Link
                href="/receptionist/login"
                onClick={() => setPortalModalOpen(false)}
                className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-primary/10 hover:border-primary bg-primary/5 flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-primary truncate">{t("reception_desk_title")}</h4>
                  <p className="text-[11px] text-muted line-clamp-1">{t("reception_desk_desc")}</p>
                </div>
              </Link>

              <Link
                href="/stylist/login"
                onClick={() => setPortalModalOpen(false)}
                className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-accent/20 hover:border-accent bg-accent/5 flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-accent truncate">{t("stylist_chair_title")}</h4>
                  <p className="text-[11px] text-muted line-clamp-1">{t("stylist_chair_desc")}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
