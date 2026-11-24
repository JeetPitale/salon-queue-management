"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Settings,
  Sparkles,
  Users,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; username: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (!stored) {
      router.replace("/admin/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "ADMIN") {
        localStorage.removeItem("admin_user");
        router.replace("/admin/login");
        return;
      }
      setAdminUser(parsed);
    } catch {
      router.replace("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    router.replace("/admin/login");
  };

  const links = [
    { href: "/admin/reports", label: "Reports Dashboard", icon: BarChart3 },
    { href: "/admin/settings", label: "Salon Settings", icon: Settings },
    { href: "/admin/services", label: "Services Manager", icon: Sparkles },
    { href: "/admin/staff", label: "Staff & Skills", icon: Users },
  ];

  return (
    <header className="bg-white border-b border-[#E4E1DC] sticky top-0 z-30 px-4 sm:px-6 py-2.5 sm:py-3 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Desktop Nav Links */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link
            href="/admin/reports"
            className="flex items-center gap-2 font-black text-lg sm:text-xl text-primary shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="truncate">Admin Portal</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
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

        {/* Right side: User info, Customer site link, Signout on desktop, Hamburger on mobile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-xs text-muted hover:text-primary font-medium px-2 py-1 rounded-lg border border-[#E4E1DC]"
            title="View Customer Site"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Site</span>
          </Link>

          {adminUser && (
            <span className="hidden md:inline-block text-xs font-bold text-primary truncate max-w-[150px]">
              Admin: {adminUser.name}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="hidden lg:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#E4E1DC] text-muted hover:text-[#8B1A1A] hover:bg-[#F4CCCC]/30 transition-colors items-center gap-1.5 text-xs font-semibold min-h-[36px]"
            title="Sign out of Admin Portal"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-[#E4E1DC] text-primary hover:bg-[#FAF8F5] transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden pt-3 pb-2 border-t border-[#E4E1DC] mt-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {adminUser && (
            <div className="px-3 py-1.5 text-xs font-bold text-muted bg-[#FAF8F5] rounded-lg">
              Signed in as: <span className="text-primary">{adminUser.name}</span>
            </div>
          )}

          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-white font-bold"
                    : "text-primary hover:bg-[#FAF8F5]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#E4E1DC] flex items-center justify-between gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E4E1DC] text-xs font-semibold text-muted hover:text-primary"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer Site</span>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#F4CCCC]/40 text-[#8B1A1A] hover:bg-[#F4CCCC] text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
