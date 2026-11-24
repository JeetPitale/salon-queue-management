"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors, BarChart3, Settings, Sparkles, Users, ArrowLeft } from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/reports", label: "Reports Dashboard (A4)", icon: BarChart3 },
    { href: "/admin/settings", label: "Salon Settings (A1)", icon: Settings },
    { href: "/admin/services", label: "Services Manager (A2)", icon: Sparkles },
    { href: "/admin/staff", label: "Staff & Skills (A3)", icon: Users },
  ];

  return (
    <header className="bg-white border-b border-[#E4E1DC] sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/admin/reports" className="flex items-center gap-2 font-black text-xl text-primary">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <span>Admin Portal</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-semibold">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-primary text-white font-bold"
                    : "text-muted hover:text-primary hover:bg-[#FAF8F5]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/staff/queue"
          className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E1DC] hover:border-accent"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Queue Board (S2)</span>
        </Link>
      </div>
    </header>
  );
}
