"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ur";

interface Translations {
  [key: string]: {
    en: string;
    ur: string;
  };
}

export const translations: Translations = {
  // Brand
  appName: { en: "GrainFlow", ur: "گرین فلو" },
  shopTagline: { en: "Mandi Grain Market Management", ur: "غلہ منڈی شاپ مینجمنٹ" },

  // Navigation
  dashboard: { en: "Dashboard", ur: "ڈیش بورڈ" },
  inventory: { en: "Inventory & Grains", ur: "گودام و اسٹاک" },
  purchases: { en: "Purchase Management", ur: "خریداری (سپلائر)" },
  sales: { en: "Sale Management", ur: "فروخت (سیلز)" },
  localSales: { en: "Local Walk-in Sale", ur: "عام گاہک (نقد پرچہ)" },
  regularSales: { en: "Regular Customers", ur: "کھاتہ دار کسٹمرز" },
  dailyRates: { en: "Daily Grain Rates", ur: "روزانہ غلہ ریٹ" },
  cashBook: { en: "Cash Book (Accounts)", ur: "روزنامچہ / کیش بُک" },
  reports: { en: "Reports & Analytics", ur: "رپورٹس و تجزیات" },
  settings: { en: "Settings & Security", ur: "سیٹنگز و سیکیورٹی" },

  // Metrics
  totalInvestment: { en: "Total Investment", ur: "کل سرمایہ کاری" },
  totalSales: { en: "Total Sales", ur: "کل فروخت" },
  totalReceivable: { en: "Receivable (Udhaar)", ur: "کل واجب الوصول (ادھار)" },
  totalPayable: { en: "Payable (Suppliers)", ur: "کل واجب الادا (سپلائرز)" },
  cashInHand: { en: "Cash in Hand", ur: "موجودہ کیش (ہاتھ میں)" },
  currentStock: { en: "Current Stock", ur: "موجودہ اسٹاک" },
  lowStockAlerts: { en: "Low Stock Alerts", ur: "کم اسٹاک وارننگ" },
  recentSales: { en: "Recent Sales", ur: "حالیہ فروخت" },
  recentPurchases: { en: "Recent Purchases", ur: "حالیہ خریداری" },

  // Common terms
  grainType: { en: "Grain Type", ur: "جنس / غلہ" },
  grade: { en: "Grade / Quality", ur: "کوالٹی / گریڈ" },
  quantity: { en: "Quantity", ur: "مقدار / وزن" },
  rate: { en: "Rate", ur: "ریٹ / بھاؤ" },
  amount: { en: "Amount", ur: "رقم" },
  paid: { en: "Paid", ur: "ادا شدہ / وصول" },
  balance: { en: "Balance / Pending", ur: "بقایا / ادھار" },
  supplier: { en: "Supplier", ur: "سپلائر / زمیندار" },
  customer: { en: "Customer", ur: "گاہک / خریدار" },
  date: { en: "Date", ur: "تاریخ" },
  actions: { en: "Actions", ur: "کارروائی" },
  save: { en: "Save", ur: "محفوظ کریں" },
  cancel: { en: "Cancel", ur: "منسوخ" },
  printSlip: { en: "Print Mandi Slip", ur: "پرچہ پرنٹ کریں" },
  search: { en: "Search...", ur: "تلاش کریں..." },
  maund: { en: "Maund (40kg)", ur: "من (40 کلو)" },
  bag: { en: "Bag (Bori)", ur: "بوری (باردانہ)" },
  kg: { en: "KG", ur: "کلو گرام" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("grainflow_lang") as Language;
    if (saved === "en" || saved === "ur") {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("grainflow_lang", lang);
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "ur" : "en";
    handleSetLanguage(next);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
