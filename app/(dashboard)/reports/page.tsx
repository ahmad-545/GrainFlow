"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Users,
  Wheat,
  FileSpreadsheet,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useRealTimeSync } from "@/components/RealTimeContext";

export default function ReportsPage() {
  const { language } = useLanguage();
  const [range, setRange] = useState<"7days" | "30days" | "year" | "all">("30days");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/reports?range=${range}`);
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(false);
  }, [range]);

  // Live real-time sync across sales, purchases, cashbook, stock, and customers
  useRealTimeSync(["sales", "purchases", "cashbook", "products", "customers", "baqaya", "all"], () => {
    fetchReports(true);
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!reportData?.grainProfitLoss) return;

    const headers = [
      "Grain Name",
      "Unit",
      "Purchased Qty",
      "Avg Purchase Rate (Rs)",
      "Sold Qty",
      "Avg Sale Rate (Rs)",
      "Margin per Unit (Rs)",
      "Estimated Gross Profit (Rs)",
    ];

    const rows = reportData.grainProfitLoss.map((g: any) => [
      `"${g.grainName}"`,
      g.unit,
      g.purchasedQty,
      g.avgPurchaseRate,
      g.soldQty,
      g.avgSaleRate,
      g.marginPerUnit,
      g.estimatedProfit,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GrainFlow_ProfitLoss_Report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#8b5a2b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "رپورٹس و مالیاتی تجزیات" : "Reports & Market Analytics"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "اناج کے حساب سے نفع و نقصان، ادھار کھاتہ داروں کی رپورٹ اور ایکسل/پی ڈی ایف ڈاؤن لوڈ"
              : "Grain-wise profit/loss analysis, customer udhaar reports, and CSV data export."}
          </p>
        </div>

        {/* Range Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#ebdcc9] p-0.5 rounded-xl flex text-xs font-bold">
            <button
              onClick={() => setRange("7days")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === "7days" ? "bg-[#8b5a2b] text-white shadow-xs" : "text-[#7c6853]"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange("30days")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === "30days" ? "bg-[#8b5a2b] text-white shadow-xs" : "text-[#7c6853]"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRange("year")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === "year" ? "bg-[#8b5a2b] text-white shadow-xs" : "text-[#7c6853]"
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setRange("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === "all" ? "bg-[#8b5a2b] text-white shadow-xs" : "text-[#7c6853]"
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#fdf6e3] text-xs font-bold text-[#8b5a2b] border border-[#ebdcc9] flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[#7c6853]">
          Aggregating business performance reports...
        </div>
      ) : (
        <>
          {/* Summary KPIs for selected Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c6853]">
                Total Sales Revenue
              </span>
              <div className="text-2xl font-black font-mono text-[#2d2115] mt-2">
                Rs {(reportData?.totalSalesRevenue || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#7c6853] mt-0.5">
                {reportData?.salesCount || 0} sale invoices
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c6853]">
                Total Grain Purchases
              </span>
              <div className="text-2xl font-black font-mono text-[#8b5a2b] mt-2">
                Rs {(reportData?.totalPurchasesCost || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#7c6853] mt-0.5">
                {reportData?.purchasesCount || 0} purchase arrivals
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c6853]">
                Est. Gross Profit
              </span>
              <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
                Rs{" "}
                {reportData?.grainProfitLoss
                  ?.reduce((acc: number, g: any) => acc + (g.estimatedProfit || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-800 mt-0.5">Across sold inventory</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c6853]">
                Customer Credit (Udhaar)
              </span>
              <div className="text-2xl font-black font-mono text-rose-700 mt-2">
                Rs{" "}
                {reportData?.customersWithUdhaar
                  ?.reduce((acc: number, c: any) => acc + (c.totalPending || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5">
                {reportData?.customersWithUdhaar?.length || 0} customers with pending balance
              </div>
            </div>
          </div>

          {/* Section 1: Grain-wise Profit / Loss Table */}
          <div className="bg-white rounded-2xl border border-[#ebdcc9] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#fbf7ee] border-b border-[#ebdcc9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-[#b8860b]" />
                <h3 className="font-bold text-sm text-[#2d2115]">
                  {language === "ur"
                    ? "اناج کے حساب سے نفع / نقصان (Grain-wise Profit & Loss)"
                    : "Grain-wise Profit & Loss Performance"}
                </h3>
              </div>
              <span className="text-[11px] text-[#7c6853]">
                Computed from Purchase vs Sale rate margins
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fdf6e3]/60 text-[#7c6853] uppercase font-bold border-b border-[#ebdcc9]">
                  <tr>
                    <th className="py-3 px-4">Grain Type</th>
                    <th className="py-3 px-4 text-right">Procured Qty</th>
                    <th className="py-3 px-4 text-right">Avg Purchase Rate</th>
                    <th className="py-3 px-4 text-right">Sold Qty</th>
                    <th className="py-3 px-4 text-right">Avg Sale Rate</th>
                    <th className="py-3 px-4 text-right">Margin / Unit</th>
                    <th className="py-3 px-4 text-right">Gross Profit (Rs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdcc9]">
                  {reportData?.grainProfitLoss?.map((grain: any) => {
                    const isProfit = grain.estimatedProfit >= 0;
                    return (
                      <tr key={grain.productId} className="hover:bg-[#fdf6e3]/50">
                        <td className="py-3 px-4 font-bold text-[#2d2115] whitespace-nowrap">
                          {grain.grainName}
                          {grain.nameUrdu && (
                            <span className="text-[#8b5a2b] text-[11px] block font-normal">
                              {grain.nameUrdu}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                          {grain.purchasedQty} {grain.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                          Rs {grain.avgPurchaseRate.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                          {grain.soldQty} {grain.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                          Rs {grain.avgSaleRate.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono whitespace-nowrap font-bold">
                          <span className={grain.marginPerUnit >= 0 ? "text-emerald-800" : "text-rose-700"}>
                            {grain.marginPerUnit >= 0 ? `+Rs ${grain.marginPerUnit}` : `-Rs ${Math.abs(grain.marginPerUnit)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                          <span className={isProfit ? "text-emerald-800" : "text-rose-700"}>
                            Rs {grain.estimatedProfit.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Customer-wise Udhaar (Credit) Ledger Report */}
          <div className="bg-white rounded-2xl border border-[#ebdcc9] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#fbf7ee] border-b border-[#ebdcc9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-700" />
                <h3 className="font-bold text-sm text-[#2d2115]">
                  {language === "ur"
                    ? "کسٹمر ادھار کھاتہ رپورٹ (Customer Credit Ledger Report)"
                    : "Customer-wise Udhaar (Credit) Ledger Report"}
                </h3>
              </div>
              <span className="text-[11px] text-rose-700 font-bold">
                Total Outstanding: Rs{" "}
                {reportData?.customersWithUdhaar
                  ?.reduce((acc: number, c: any) => acc + (c.totalPending || 0), 0)
                  .toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fdf6e3]/60 text-[#7c6853] uppercase font-bold border-b border-[#ebdcc9]">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Location / Address</th>
                    <th className="py-3 px-4 text-center">Tier</th>
                    <th className="py-3 px-4 text-right">Total Paid (Rs)</th>
                    <th className="py-3 px-4 text-right">Outstanding Udhaar (Rs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdcc9]">
                  {reportData?.customersWithUdhaar?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#7c6853]">
                        No pending customer credit
                      </td>
                    </tr>
                  ) : (
                    reportData?.customersWithUdhaar?.map((cust: any) => (
                      <tr key={cust._id} className="hover:bg-[#fdf6e3]/50">
                        <td className="py-3 px-4 font-bold text-[#2d2115] whitespace-nowrap">
                          {cust.name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[#7c6853]">
                          {cust.phone || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#7c6853]">{cust.address || "—"}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                            {cust.ranking}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-800 whitespace-nowrap">
                          Rs {cust.totalPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-700 whitespace-nowrap text-sm">
                          Rs {cust.totalPending.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
