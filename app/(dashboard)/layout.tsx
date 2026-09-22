"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { LanguageProvider } from "@/components/LanguageContext";
import { SettingsProvider } from "@/components/RealTimeContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fbf7ee] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#b8860b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LanguageProvider>
      <SettingsProvider>
        <div className="flex min-h-screen bg-[#fbf7ee]">
          {/* Mandi Sidebar with responsive drawer */}
          <Sidebar
            mobileOpen={mobileNavOpen}
            onCloseMobile={() => setMobileNavOpen(false)}
          />

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
            <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 space-y-6">
              {children}
            </main>
          </div>
        </div>
      </SettingsProvider>
    </LanguageProvider>
  );
}
