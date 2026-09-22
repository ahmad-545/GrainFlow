"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wheat,
  ShoppingCart,
  Truck,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Package,
  ReceiptText,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useRealTimeSync } from "@/components/RealTimeContext";

interface StockItem {
  id: string;
  name: string;
  nameUrdu: string;
  unit: string;
  currentStock: number;
  minStockAlert: number;
  isLowStock: boolean;
  bagStock?: { emptyBags: number; filledBags: number };
}

interface SaleRecord {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerType: string;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  items: Array<{ productName: string; quantity: number; unit: string }>;
}

interface PurchaseRecord {
  _id: string;
  supplierName: string;
  productName: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
}

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  // Live real-time sync when sales, purchases, stock, rates, cashbook, customers, or baqaya changes
  useRealTimeSync(["sales", "purchases", "products", "cashbook", "rates", "customers", "baqaya", "all"], () => {
    fetchDashboardData(true);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-[#b8860b] border-t-transparent rounded-full animate-spin" />
        <div className="text-xs text-[#7c6853] font-medium animate-pulse">
          {language === "ur" ? "منڈی ریکارڈ لوڈ ہو رہا ہے..." : "Loading Mandi Dashboard..."}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: language === "ur" ? "کل سرمایہ کاری" : "Total Investment",
      amount: stats?.totalInvestment || 0,
      icon: Truck,
      color: "from-amber-700 to-amber-900",
      textColor: "text-amber-700",
      sub: language === "ur" ? "خریداری + ابتدائی اسٹاک" : "Purchases + Opening Stock",
      breakdown: stats?.openingStockInvestment
        ? (language === "ur"
            ? `خریداری: Rs ${(stats.purchasesInvestment || 0).toLocaleString()} | ابتدائی: Rs ${(stats.openingStockInvestment || 0).toLocaleString()}`
            : `Purchases: Rs ${(stats.purchasesInvestment || 0).toLocaleString()} | Initial: Rs ${(stats.openingStockInvestment || 0).toLocaleString()}`)
        : undefined,
    },
    {
      title: language === "ur" ? "کل فروخت (سیلز)" : "Total Sales",
      amount: stats?.totalSaleAmount || 0,
      icon: ShoppingCart,
      color: "from-[#2f5233] to-[#1e3621]",
      textColor: "text-emerald-700",
      sub: language === "ur" ? "خالص آمدنی" : "Gross Revenue",
    },
    {
      title: language === "ur" ? "کل واجب الوصول (ادھار)" : "Total Receivable",
      amount: stats?.totalReceivable || 0,
      icon: ArrowUpRight,
      color: "from-blue-700 to-blue-900",
      textColor: "text-blue-700",
      sub: language === "ur" ? "گاہکوں کا بقایا ادھار" : "Customer Credits Due",
    },
    {
      title: language === "ur" ? "کل واجب الادا (سپلائرز)" : "Total Payable",
      amount: stats?.totalPayable || 0,
      icon: ArrowDownLeft,
      color: "from-rose-700 to-rose-900",
      textColor: "text-rose-700",
      sub: language === "ur" ? "سپلائر کو ادائیگیاں" : "Owed to Suppliers",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-[#8b5a2b] via-[#a0522d] to-[#78350f] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-amber-200 text-xs font-semibold backdrop-blur-xs">
              Mandi Shop Portal
            </span>
            <span className="text-xs text-amber-100/80">
              {new Date().toLocaleDateString("en-PK", { dateStyle: "full" })}
            </span>
          </div>
          <h1 className="text-2xl font-black mt-1">
            {language === "ur" ? "غلہ منڈی ڈیش بورڈ" : "Grain Market Control Center"}
          </h1>
          <p className="text-xs text-amber-100/90 mt-1 max-w-xl">
            {language === "ur"
              ? "اسٹاک، نقد و ادھار فروخت، خریداری، اور روزنامچہ کی مکمل نگرانی"
              : "Live monitoring of stock reserves, walk-in & regular sales, and cash flows."}
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/sales/local"
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#2d2115] font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{language === "ur" ? "+ نیا پرچہ (فروخت)" : "+ New Sale Slip"}</span>
          </Link>

          <Link
            href="/purchases"
            className="px-4 py-2.5 rounded-xl bg-[#2f5233] hover:bg-[#3f6e45] text-white font-bold text-xs flex items-center gap-2 border border-emerald-500/30 shadow-md transition-all active:scale-95"
          >
            <Truck className="w-4 h-4" />
            <span>{language === "ur" ? "+ مال خریداری" : "+ New Purchase"}</span>
          </Link>

          <Link
            href="/baqaya"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <ReceiptText className="w-4 h-4" />
            <span>{language === "ur" ? "بقایا رجسٹر" : "Baqaya Register"}</span>
          </Link>

          <Link
            href="/daily-rates"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 backdrop-blur-xs transition-all"
          >
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <span>{language === "ur" ? "ریٹ سیٹ کریں" : "Set Rates"}</span>
          </Link>
        </div>
      </div>

      {/* Low Stock Alerts Notice (if any) */}
      {stats?.lowStockAlerts?.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              {language === "ur" ? "کم اسٹاک وارننگ (Low Stock Alert)" : "Attention: Low Stock Threshold Reached"}
            </h4>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {stats.lowStockAlerts.map((item: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/inventory/${item.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs font-semibold text-amber-900 transition-colors"
                >
                  <span>{item.name}</span>
                  <span className="font-mono font-bold text-rose-700">
                    ({item.currentStock} {item.unit})
                  </span>
                  <span className="text-[10px] text-amber-700">Min: {item.minStockAlert}</span>
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/purchases"
            className="text-xs font-bold text-amber-900 underline hover:text-amber-700 shrink-0 self-center"
          >
            {language === "ur" ? "مال منگوائیں →" : "Procure Now →"}
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7c6853]">
                  {kpi.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-[#2d2115] font-mono tracking-tight">
                  Rs {kpi.amount.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#7c6853] mt-1 flex flex-col gap-0.5">
                  <span>{kpi.sub}</span>
                  {kpi.breakdown && (
                    <span className="text-[10px] text-amber-800 font-mono font-semibold">
                      {kpi.breakdown}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cash In Hand & Stock Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash in Hand Card */}
        <div className="bg-gradient-to-br from-[#1e3621] to-[#2f5233] rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {language === "ur" ? "روزنامچہ کیش (ہاتھ میں)" : "Cash in Hand (Roznamcha)"}
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black font-mono">
                Rs {(stats?.cashInHand || 0).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-200/80 mt-1">
                {language === "ur"
                  ? "آمدن منہا تمام اخراجات و ادائیگیاں"
                  : "Net balance from sales minus supplier & operating expenses"}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-500/30 flex items-center justify-between">
            <Link
              href="/cashbook"
              className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
            >
              <span>{language === "ur" ? "مکمل روزنامچہ دیکھیں" : "View Cash Book"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/cashbook"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs"
            >
              {language === "ur" ? "+ خرچہ درج کریں" : "+ Add Expense"}
            </Link>
          </div>
        </div>

        {/* Current Grain Stock Reserves (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wheat className="w-5 h-5 text-[#b8860b]" />
              <h3 className="font-bold text-[#2d2115]">
                {language === "ur" ? "گودام موجودہ اسٹاک" : "Grain Stock Overview"}
              </h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-[#8b5a2b] hover:underline flex items-center gap-1"
            >
              <span>{language === "ur" ? "تمام اناج دیکھیں" : "Manage Inventory"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats?.stockOverview?.map((grain: StockItem) => (
              <div
                key={grain.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  grain.isLowStock
                    ? "bg-rose-50/70 border-rose-200 text-rose-950"
                    : "bg-[#fbf7ee] border-[#ebdcc9] text-[#2d2115]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-xs truncate max-w-[130px]">{grain.name}</div>
                  {grain.isLowStock ? (
                    <span className="text-[9px] font-bold uppercase bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">
                      Low
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      In Stock
                    </span>
                  )}
                </div>
                <div className="text-lg font-black font-mono mt-1 text-[#8b5a2b]">
                  {grain.currentStock.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-[#7c6853]">{grain.unit}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#7c6853] mt-1 pt-1 border-t border-black/5">
                  <span>Min: {grain.minStockAlert}</span>
                  {grain.bagStock && <span>Bags: {grain.bagStock.filledBags}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity: Sales & Purchases Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-[#2d2115]">
                {language === "ur" ? "حالیہ فروخت (سیلز)" : "Recent Sales"}
              </h3>
            </div>
            <Link
              href="/sales/local"
              className="text-xs font-bold text-[#8b5a2b] hover:underline"
            >
              {language === "ur" ? "تمام دیکھیں" : "View All"}
            </Link>
          </div>

          <div className="divide-y divide-[#ebdcc9] overflow-x-auto">
            {stats?.recentSales?.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7c6853]">
                {language === "ur" ? "کوئی حالیہ فروخت نہیں" : "No recent sales recorded"}
              </div>
            ) : (
              stats?.recentSales?.map((sale: SaleRecord) => (
                <div key={sale._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#2d2115] flex items-center gap-2">
                      <span>{sale.customerName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#fdf6e3] rounded text-[#8b5a2b] border border-[#ebdcc9]">
                        #{sale.invoiceNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#7c6853]">
                      {sale.items?.map((it) => `${it.quantity} ${it.unit} ${it.productName}`).join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-[#2d2115]">
                      Rs {sale.netAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px]">
                      {sale.dueAmount > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          Due: Rs {sale.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Fully Paid</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-700" />
              <h3 className="font-bold text-[#2d2115]">
                {language === "ur" ? "حالیہ خریداری (سپلائرز)" : "Recent Purchases"}
              </h3>
            </div>
            <Link
              href="/purchases"
              className="text-xs font-bold text-[#8b5a2b] hover:underline"
            >
              {language === "ur" ? "تمام دیکھیں" : "View All"}
            </Link>
          </div>

          <div className="divide-y divide-[#ebdcc9] overflow-x-auto">
            {stats?.recentPurchases?.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7c6853]">
                {language === "ur" ? "کوئی حالیہ خریداری نہیں" : "No recent purchases recorded"}
              </div>
            ) : (
              stats?.recentPurchases?.map((pur: PurchaseRecord) => (
                <div key={pur._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#2d2115]">{pur.supplierName}</div>
                    <div className="text-[11px] text-[#7c6853]">
                      {pur.quantity} {pur.unit} {pur.productName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-[#2d2115]">
                      Rs {pur.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px]">
                      {pur.dueAmount > 0 ? (
                        <span className="text-amber-800 font-semibold">
                          Payable: Rs {pur.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Paid In Full</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
