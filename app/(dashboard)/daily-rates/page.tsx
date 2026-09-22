"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Calendar,
  Wheat,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";

interface RateBoardItem {
  productId: string;
  productName: string;
  nameUrdu: string;
  unit: string;
  currentStock: number;
  todayRate: number;
  yesterdayRate: number;
  diff: number;
  status: "up" | "down" | "same";
  notes?: string;
  updatedAt?: string;
}

export default function DailyRatesPage() {
  const { language } = useLanguage();
  const [board, setBoard] = useState<RateBoardItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Rate inputs mapped by productId
  const [inputRates, setInputRates] = useState<{ [id: string]: string }>({});
  const [inputNotes, setInputNotes] = useState<{ [id: string]: string }>({});

  const fetchRateBoard = async (dateStr = selectedDate, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/daily-rates?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setBoard(data.rateBoard || []);
        setHistory(data.history || []);

        const ratesMap: { [id: string]: string } = {};
        const notesMap: { [id: string]: string } = {};
        (data.rateBoard || []).forEach((item: RateBoardItem) => {
          ratesMap[item.productId] = item.todayRate ? String(item.todayRate) : "";
          notesMap[item.productId] = item.notes || "";
        });
        setInputRates(ratesMap);
        setInputNotes(notesMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateBoard(selectedDate);
  }, [selectedDate]);

  // Live real-time sync when rates change
  useRealTimeSync(["rates", "all"], () => {
    fetchRateBoard(selectedDate, true);
  });

  const handleSaveRate = async (productId: string) => {
    const rateVal = inputRates[productId];
    if (!rateVal || isNaN(Number(rateVal))) {
      alert("Please enter a valid rate number");
      return;
    }

    try {
      setSaveLoading(productId);
      const res = await fetch("/api/daily-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rate: Number(rateVal),
          date: selectedDate,
          notes: inputNotes[productId] || "",
        }),
      });

      if (res.ok) {
        setMessage("Rate updated successfully!");
        setTimeout(() => setMessage(""), 3000);
        fetchRateBoard(selectedDate);
        broadcastSync("rates");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#b8860b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "روزانہ غلہ منڈی ریٹ بورڈ" : "Daily Mandi Grain Rates"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "منڈی کمیٹی کے مطابق روزانہ ریٹ طے کریں، کل کے مقابلے میں اتار چڑھاؤ اور تاریخی رجحانات"
              : "Set daily grain market rates, monitor day-over-day price fluctuations and seasonal trends."}
          </p>
        </div>

        {/* Date Selector & Status Indicator */}
        <div className="flex items-center gap-3">
          {message && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#ebdcc9] text-xs">
            <Calendar className="w-4 h-4 text-[#8b5a2b]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-[#2d2115] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Rate Setter Board */}
      <div className="bg-white rounded-2xl border border-[#ebdcc9] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#fbf7ee] border-b border-[#ebdcc9] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8b5a2b]">
            Grain Rate Setting &amp; Variance Board
          </span>
          <span className="text-[11px] text-[#7c6853]">
            Rates set here automatically suggest during Sales &amp; Purchases
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#7c6853]">Loading daily rates...</div>
        ) : (
          <div className="divide-y divide-[#ebdcc9]">
            {board.map((item) => {
              const isUp = item.diff > 0;
              const isDown = item.diff < 0;

              return (
                <div
                  key={item.productId}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#fdf6e3]/40 transition-colors"
                >
                  {/* Left: Grain Identity */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#fdf6e3] border border-[#ebdcc9] text-[#8b5a2b] flex items-center justify-center shadow-xs">
                      <Wheat className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
                        <span>{item.productName}</span>
                        {item.nameUrdu && (
                          <span className="text-xs font-semibold text-[#8b5a2b]">
                            ({item.nameUrdu})
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] text-[#7c6853] mt-0.5">
                        Base Unit: <span className="font-semibold">{item.unit}</span> • Godown Stock:{" "}
                        <span className="font-mono font-bold text-[#2d2115]">
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Yesterday vs Today comparison badge */}
                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-[#7c6853]">
                        Yesterday's Rate
                      </div>
                      <div className="font-mono font-bold text-neutral-600 text-sm mt-0.5">
                        {item.yesterdayRate > 0
                          ? `Rs ${item.yesterdayRate.toLocaleString()}`
                          : "No Data"}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-[#7c6853]">
                        Day Change
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                          isUp
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isDown
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {isUp && <TrendingUp className="w-3 h-3" />}
                        {isDown && <TrendingDown className="w-3 h-3" />}
                        {!isUp && !isDown && <Minus className="w-3 h-3" />}
                        <span>
                          {item.diff > 0 ? `+${item.diff}` : item.diff === 0 ? "0" : item.diff}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rate Input Field & Save Button */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">
                        Rs
                      </span>
                      <input
                        type="number"
                        value={inputRates[item.productId] ?? ""}
                        onChange={(e) =>
                          setInputRates({ ...inputRates, [item.productId]: e.target.value })
                        }
                        placeholder="Today's Rate"
                        className="w-full pl-8 pr-2 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
                      />
                    </div>

                    <button
                      onClick={() => handleSaveRate(item.productId)}
                      disabled={saveLoading === item.productId}
                      className="px-4 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saveLoading === item.productId ? "Saving..." : "Set Rate"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Trend & Seasonal Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate History Logs */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ebdcc9]">
            <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8b5a2b]" />
              <span>Historical Mandi Rate Log</span>
            </h3>
            <span className="text-[11px] text-[#7c6853]">Recent Market Settlements</span>
          </div>

          <div className="divide-y divide-[#ebdcc9] max-h-72 overflow-y-auto">
            {history.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7c6853]">No rate logs found</div>
            ) : (
              history.map((h, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#2d2115]">{h.productName}</div>
                    <div className="text-[10px] text-[#7c6853]">{h.date} • {h.notes || "Official Closing"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-[#8b5a2b]">
                      Rs {h.rate.toLocaleString()}
                    </div>
                    {h.changeDiff !== 0 && (
                      <span
                        className={`text-[10px] font-semibold ${
                          h.changeDiff > 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {h.changeDiff > 0 ? `+${h.changeDiff}` : h.changeDiff}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Seasonal / Yearly Comparison Insight */}
        <div className="bg-gradient-to-br from-[#fdf6e3] via-[#fbf7ee] to-[#f4ebd9] rounded-2xl p-6 border border-[#ebdcc9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b5a2b] mb-2">
              <Sparkles className="w-4 h-4 text-[#b8860b]" />
              <span>Seasonal Mandi Market Intelligence</span>
            </div>
            <h4 className="font-black text-lg text-[#2d2115]">
              Harvest &amp; Off-Season Rate Benchmark
            </h4>
            <p className="text-xs text-[#7c6853] mt-2 leading-relaxed">
              Comparison with the corresponding harvest period:
              <br />
              • <strong>Wheat (گندم):</strong> Current rate Rs 3,950/maund vs last year post-harvest Rs 3,450 (+14.4% appreciation).
              <br />
              • <strong>Super Basmati (چاول):</strong> Peak export demand maintaining strong floor around Rs 11,200/maund.
              <br />
              • <strong>Yellow Corn (مکئی):</strong> Feed mill procurement rate stable between Rs 2,800 – Rs 2,900/maund.
            </p>
          </div>

          <div className="mt-6 p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-[#ebdcc9] text-[11px] text-[#7c6853]">
            💡 <strong>Mandi Tip:</strong> Rates update daily at 10:00 AM auction closing. Changing rates here instantly updates the auto-suggested rates in the walk-in and regular customer slip forms.
          </div>
        </div>
      </div>
    </div>
  );
}
