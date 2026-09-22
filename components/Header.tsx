"use client";

import React, { useState, useEffect } from "react";
import { Search, Clock, TrendingUp, TrendingDown, Minus, ShieldCheck, RefreshCw, Menu } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { useRealTimeSync } from "./RealTimeContext";

interface RateItem {
  productId: string;
  productName: string;
  todayRate: number;
  diff: number;
  status: "up" | "down" | "same";
}

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const { language, toggleLanguage } = useLanguage();
  const [rates, setRates] = useState<RateItem[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRates = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/daily-rates");
      if (res.ok) {
        const data = await res.json();
        setRates(data.rateBoard || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useRealTimeSync(["rates", "all"], () => {
    fetchRates();
  });

  useEffect(() => {
    fetchRates();
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-PK", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-[#ffffff] border-b border-[#ebdcc9] px-3.5 sm:px-6 flex items-center justify-between shadow-xs sticky top-0 z-20">
      {/* Left: Hamburger & Search & Market Ticker */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-3xl min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-[#8b5a2b] hover:bg-[#fbf7ee] transition-colors shrink-0"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-48 sm:w-64 hidden md:block shrink-0">
          <Search className="w-4 h-4 text-[#8b5a2b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === "ur" ? "تلاش کریں (غلہ، گاہک)..." : "Search grain, customer..."}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
          />
        </div>

        {/* Live Daily Rates Mini-Ticker */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none min-w-0">
          <span className="text-[11px] font-bold text-[#8b5a2b] uppercase tracking-wider flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden xs:inline">{language === "ur" ? "ریٹس:" : "Rates:"}</span>
          </span>
          {rates.slice(0, 4).map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fdf6e3] border border-[#ebdcc9] text-xs shrink-0"
            >
              <span className="font-semibold text-[#2d2115]">{r.productName.split(" ")[0]}</span>
              <span className="font-mono text-[#8b5a2b]">Rs {r.todayRate.toLocaleString()}</span>
              {r.diff !== 0 && (
                <span
                  className={`text-[10px] font-semibold flex items-center ${
                    r.diff > 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {r.diff > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(r.diff)}
                </span>
              )}
            </div>
          ))}
          <button
            onClick={fetchRates}
            title="Refresh rates"
            className={`p-1 text-[#8b5a2b] hover:text-[#b8860b] transition-transform ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Date/Time, Lang, Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#7c6853] bg-[#fbf7ee] px-3 py-1.5 rounded-lg border border-[#ebdcc9]">
          <Clock className="w-3.5 h-3.5 text-[#8b5a2b]" />
          <span className="font-mono">{currentTime || "Loading mandi time..."}</span>
        </div>

        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 rounded-lg bg-[#fdf6e3] text-xs font-semibold text-[#8b5a2b] hover:bg-[#ebdcc9] transition-colors border border-[#d9c4a8]"
        >
          {language === "en" ? "اردو" : "English"}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-[#ebdcc9]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2f5233] to-[#1e3621] text-emerald-100 flex items-center justify-center font-bold text-xs shadow-xs">
            GF
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[#2d2115] flex items-center gap-1">
              <span>Admin Munshi</span>
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="text-[10px] text-[#7c6853] leading-none">Mandi Incharge</div>
          </div>
        </div>
      </div>
    </header>
  );
}
