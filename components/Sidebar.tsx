"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wheat,
  Truck,
  ShoppingCart,
  Users,
  TrendingUp,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Languages,
  Store,
  ChevronRight,
  ReceiptText,
  X,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { useShopSettings } from "./RealTimeContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const { settings } = useShopSettings();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const navItems = [
    {
      label: t("dashboard"),
      labelUrdu: "ڈیش بورڈ",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      label: t("inventory"),
      labelUrdu: "گودام و اسٹاک",
      href: "/inventory",
      icon: Wheat,
      active: pathname.startsWith("/inventory"),
    },
    {
      label: t("purchases"),
      labelUrdu: "خریداری (سپلائر)",
      href: "/purchases",
      icon: Truck,
      active: pathname.startsWith("/purchases"),
    },
    {
      type: "header",
      label: language === "ur" ? "سیلز و کسٹمرز" : "Sales Management",
    },
    {
      label: t("localSales"),
      labelUrdu: "عام گاہک (نقد پرچہ)",
      href: "/sales/local",
      icon: ShoppingCart,
      active: pathname === "/sales/local",
    },
    {
      label: t("regularSales"),
      labelUrdu: "کھاتہ دار کسٹمرز",
      href: "/sales/regular",
      icon: Users,
      active: pathname === "/sales/regular",
    },
    {
      label: language === "ur" ? "بقایا جات کھاتہ رجسٹر" : "Baqaya & Credit Register",
      labelUrdu: "بقایا جات کھاتہ رجسٹر",
      href: "/baqaya",
      icon: ReceiptText,
      badge: language === "ur" ? "بقایا" : "Baqaya",
      active: pathname.startsWith("/baqaya"),
    },
    {
      type: "header",
      label: language === "ur" ? "مارکیٹ و اکاؤنٹس" : "Market & Accounts",
    },
    {
      label: t("dailyRates"),
      labelUrdu: "روزانہ غلہ ریٹ",
      href: "/daily-rates",
      icon: TrendingUp,
      active: pathname.startsWith("/daily-rates"),
    },
    {
      label: t("cashBook"),
      labelUrdu: "روزنامچہ / کیش بُک",
      href: "/cashbook",
      icon: BookOpen,
      active: pathname.startsWith("/cashbook"),
    },
    {
      label: t("reports"),
      labelUrdu: "رپورٹس و تجزیات",
      href: "/reports",
      icon: BarChart3,
      active: pathname.startsWith("/reports"),
    },
    {
      label: t("settings"),
      labelUrdu: "سیٹنگز و سیکیورٹی",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:static lg:w-64 bg-[#23180d] text-[#fdf6e3] flex flex-col min-h-screen border-r border-[#3d2a19] shadow-2xl select-none transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#3d2a19] flex items-center justify-between">
          <Link
            href="/"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b8860b] to-[#8b5a2b] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-wide text-white flex items-center gap-1.5">
                <span>GrainFlow</span>
                <span className="text-[10px] bg-[#2f5233] text-[#86efac] font-mono px-1.5 py-0.5 rounded border border-[#3f6e45]">
                  منڈی
                </span>
              </div>
              <div
                className="text-[11px] text-[#cbb49d] truncate max-w-[150px]"
                title={settings.shopName}
              >
                {language === "ur"
                  ? settings.shopNameUrdu || settings.shopName || "غلہ منڈی شاپ"
                  : settings.shopName || "Grain Market Shop"}
              </div>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#a89279] hover:text-white hover:bg-[#342415] transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.type === "header") {
            return (
              <div
                key={idx}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#a89279] px-3 pt-3 pb-1"
              >
                {item.label}
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = item.active;

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => onCloseMobile?.()}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-[#b8860b] to-[#92400e] text-white shadow-md shadow-[#b8860b]/20"
                  : "text-[#d6c7b2] hover:bg-[#342415] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-[#b8860b] group-hover:text-amber-300"
                  }`}
                />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  {language === "en" && (
                    <span className="text-[10px] text-[#a89279] group-hover:text-[#cbb49d] leading-none">
                      {item.labelUrdu}
                    </span>
                  )}
                </div>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </Link>
          );
        })}
      </div>

      {/* Language Toggle & User Controls */}
      <div className="p-3 border-t border-[#3d2a19] bg-[#1a120a] space-y-2">
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#2a1d13] text-xs text-[#e6d7c3] hover:bg-[#3d2a19] transition-colors border border-[#4a3522]"
        >
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-[#b8860b]" />
            <span>Language / زبان:</span>
          </div>
          <span className="font-bold text-amber-400 bg-[#1e140c] px-2 py-0.5 rounded">
            {language === "en" ? "English" : "اردو"}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{language === "ur" ? "لاگ آؤٹ کریں" : "Logout Admin"}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
