"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";
import { Language } from "@/lib/i18n";
import { Scissors, Globe, User } from "lucide-react";

export function Header() {
  const { language, setLanguage, t } = useLanguage();

  return (
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

          {/* Staff Login Link */}
          <Link
            href="/staff/login"
            className="text-xs font-medium text-primary hover:text-accent p-1.5 flex items-center gap-1"
            title="Staff Access"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
