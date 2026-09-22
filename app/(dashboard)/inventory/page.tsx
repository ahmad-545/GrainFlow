"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wheat,
  Plus,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  TrendingDown,
  Scale,
  X,
  Search,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";
import Modal from "@/components/Modal";

interface GrainProduct {
  _id: string;
  name: string;
  nameUrdu: string;
  unit: "maund" | "kg" | "bag";
  currentStock: number;
  minStockAlert: number;
  isLowStock: boolean;
  grades: Array<{ name: string; nameUrdu?: string; rateAdjustment: number; stock: number }>;
  bagStock: {
    emptyBags: number;
    filledBags: number;
    bagCapacityKg: number;
  };
  wastageRecords: any[];
  todayRate?: { rate: number; diff: number; status: string };
}

export default function InventoryPage() {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState<GrainProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Grain form state
  const [name, setName] = useState("");
  const [nameUrdu, setNameUrdu] = useState("");
  const [unit, setUnit] = useState<"maund" | "kg" | "bag">("maund");
  
  // Dual Stock fields
  const [openingMaunds, setOpeningMaunds] = useState("1");
  const [openingKg, setOpeningKg] = useState("20");
  const [currentStock, setCurrentStock] = useState(""); // For bag or direct kg input
  
  const [minStockAlert, setMinStockAlert] = useState("20");
  const [initialRate, setInitialRate] = useState("4000");
  const [emptyBags, setEmptyBags] = useState("150");

  const calcTotalStock = () => {
    if (unit === "maund") {
      const m = Number(openingMaunds) || 0;
      const k = Number(openingKg) || 0;
      return Number((m + k / 40).toFixed(3));
    } else if (unit === "kg") {
      if (currentStock !== "") return Number(currentStock) || 0;
      const m = Number(openingMaunds) || 0;
      const k = Number(openingKg) || 0;
      return Number((m * 40 + k).toFixed(2));
    } else {
      return Number(currentStock) || 0;
    }
  };

  const computedTotalStock = calcTotalStock();
  const initialRateNum = Number(initialRate) || 0;
  const initialInvestment = Number((computedTotalStock * initialRateNum).toFixed(2));

  const fetchProducts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Live real-time sync when stock changes from sales, purchases, or wastage
  useRealTimeSync(["products", "sales", "purchases", "all"], () => {
    fetchProducts(true);
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalStockVal = calcTotalStock();
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nameUrdu,
          unit,
          currentStock: totalStockVal,
          openingMaunds: unit === "maund" ? Number(openingMaunds) || 0 : undefined,
          openingKg: unit === "maund" ? Number(openingKg) || 0 : undefined,
          initialRate: initialRateNum,
          openingStockValue: initialInvestment,
          minStockAlert: Number(minStockAlert) || 20,
          bagStock: {
            emptyBags: Number(emptyBags) || 50,
            filledBags: unit === "bag" ? Math.round(totalStockVal) : 0,
            bagCapacityKg: 50,
          },
          grades: [
            { name: "Grade A (Premium)", nameUrdu: "اعلیٰ", rateAdjustment: 100, stock: Number((totalStockVal / 2).toFixed(2)) },
            { name: "Grade B (Standard)", nameUrdu: "معیاری", rateAdjustment: 0, stock: Number((totalStockVal / 2).toFixed(2)) },
          ],
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset
        setName("");
        setNameUrdu("");
        setOpeningMaunds("1");
        setOpeningKg("20");
        setCurrentStock("");
        fetchProducts();
        broadcastSync("products");
        broadcastSync("purchases");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create grain");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating grain");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.nameUrdu.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wheat className="w-6 h-6 text-[#b8860b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "گودام و اناج کا ذخیرہ" : "Grain Inventory & Stock"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "مختلف اقسام کا اناج، باردانہ (بوریاں)، نقصان و کٹوتی کا اندراج اور کوالٹی گریڈز"
              : "Grain stock levels, grades, packing bag reserves, and wastage management."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-[#8b5a2b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === "ur" ? "اناج تلاش کریں..." : "Search grain..."}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#8b5a2b] text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-105 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === "ur" ? "+ نیا اناج شامل کریں" : "+ Add Grain Type"}</span>
          </button>
        </div>
      </div>

      {/* Bag / Packing Material Tracking Global Counter */}
      <div className="bg-gradient-to-r from-[#fdf6e3] via-[#fbf7ee] to-[#f4ebd9] rounded-2xl p-4 border border-[#ebdcc9] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8b5a2b] text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#2d2115] uppercase tracking-wider">
              {language === "ur" ? "باردانہ و پیکنگ مٹیریل (Bags)" : "Packing Material & Bag Stock"}
            </h4>
            <div className="text-[11px] text-[#7c6853]">
              {language === "ur"
                ? "ہر اناج کے ساتھ خالی اور بھری بوریوں کی تعداد خودکار اپ ڈیٹ ہوتی ہے"
                : "Tracking of empty jute bags, filled bags, and standard 50kg sacks across godown"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-[#7c6853]">
              {language === "ur" ? "خالی بوریاں (Empty)" : "Empty Bags"}
            </div>
            <div className="text-lg font-black font-mono text-[#8b5a2b]">
              {products.reduce((acc, p) => acc + (p.bagStock?.emptyBags || 0), 0)}
            </div>
          </div>
          <div className="w-px h-8 bg-[#ebdcc9]" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-[#7c6853]">
              {language === "ur" ? "بھری بوریاں (Filled)" : "Filled Bags"}
            </div>
            <div className="text-lg font-black font-mono text-emerald-800">
              {products.reduce((acc, p) => acc + (p.bagStock?.filledBags || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Grain Types Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#7c6853]">
          Loading grain inventory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((grain) => (
            <div
              key={grain._id}
              className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                grain.isLowStock ? "border-amber-400/80 bg-amber-50/20" : "border-[#ebdcc9]"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#2d2115]">{grain.name}</h3>
                    {grain.nameUrdu && (
                      <div className="text-xs font-semibold text-[#8b5a2b]">{grain.nameUrdu}</div>
                    )}
                  </div>

                  {grain.isLowStock ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      Healthy
                    </span>
                  )}
                </div>

                {/* Stock Level Display */}
                <div className="mt-4 p-3 rounded-xl bg-[#fbf7ee] border border-[#ebdcc9]">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-[#7c6853]">
                      {language === "ur" ? "موجودہ مقدار (اسٹاک)" : "Current Reserves"}
                    </div>
                    {grain.todayRate && (
                      <span className="text-[10px] font-bold text-[#8b5a2b] bg-[#fdf6e3] px-2 py-0.5 rounded border border-[#ebdcc9]">
                        Rs {grain.todayRate.rate.toLocaleString()} / {grain.unit}
                      </span>
                    )}
                  </div>

                  <div className="text-2xl font-black font-mono text-[#8b5a2b] mt-0.5">
                    {grain.currentStock.toLocaleString()}{" "}
                    <span className="text-xs font-medium text-[#7c6853]">{grain.unit}</span>
                  </div>

                  {grain.unit === "maund" && (
                    <div className="text-[11px] font-bold font-mono text-emerald-800 mt-0.5">
                      = {Math.floor(grain.currentStock)} من {Math.round((grain.currentStock % 1) * 40)} کلو ({Math.round(grain.currentStock * 40)} KG)
                    </div>
                  )}

                  <div className="text-[10px] text-[#7c6853] mt-1.5 pt-1.5 border-t border-[#ebdcc9]/60 flex items-center justify-between">
                    <span>Alert threshold: {grain.minStockAlert} {grain.unit}</span>
                    {grain.todayRate && (
                      <span className="font-bold text-emerald-800">
                        مالیت: Rs {Math.round(grain.currentStock * grain.todayRate.rate).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quality Grades & Bags Snapshot */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#7c6853]">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#b8860b]" />
                      <span>Grades:</span>
                    </span>
                    <span className="font-semibold text-[#2d2115]">
                      {grain.grades?.map((g) => g.name.split(" ")[0]).join(", ") || "Standard"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#7c6853]">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-[#8b5a2b]" />
                      <span>Bags in Godown:</span>
                    </span>
                    <span className="font-semibold text-[#2d2115]">
                      {grain.bagStock?.filledBags || 0} filled / {grain.bagStock?.emptyBags || 0} empty
                    </span>
                  </div>

                  {grain.wastageRecords?.length > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-rose-700">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        <span>Wastage logged:</span>
                      </span>
                      <span className="font-bold">
                        {grain.wastageRecords.reduce((acc: number, w: any) => acc + w.quantity, 0)}{" "}
                        {grain.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-[#ebdcc9] flex items-center justify-between">
                <Link
                  href={`/inventory/${grain._id}`}
                  className="text-xs font-bold text-[#8b5a2b] hover:text-[#b8860b] flex items-center gap-1"
                >
                  <span>{language === "ur" ? "مکمل کھاتہ و نقصان لاگ" : "View Details & Ledger"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/inventory/${grain._id}`}
                  className="px-2.5 py-1 rounded-lg bg-[#fdf6e3] hover:bg-[#ebdcc9] text-xs font-semibold text-[#2d2115] border border-[#d9c4a8]"
                >
                  Edit / کٹوتی
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add New Grain Type */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={language === "ur" ? "نیا اناج شامل کریں" : "Add New Grain Type"}
        icon={<Wheat className="w-5 h-5 text-[#b8860b]" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2d2115] mb-1">
              Grain Name (English) / اناج کا نام *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Barley (Jao)"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">
              Name in Urdu / اردو نام
            </label>
            <input
              type="text"
              value={nameUrdu}
              onChange={(e) => setNameUrdu(e.target.value)}
              placeholder="مثلاً جو (دیسی)"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">
              Standard Unit / بنیادی پیمانہ
            </label>
            <select
              value={unit}
              onChange={(e: any) => setUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-semibold focus:outline-none"
            >
              <option value="maund">Maund (من - 40kg پیمانہ)</option>
              <option value="kg">KG (کلوگرام پیمانہ)</option>
              <option value="bag">Bag (بوری پیمانہ)</option>
            </select>
          </div>

          {/* Initial Stock Inputs */}
          {unit === "maund" && (
            <div className="space-y-2 p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[#2d2115]">
                  {language === "ur" ? "ابتدائی موجود اسٹاک (من اور کلو)" : "Initial Stock (Maunds & KG)"} *
                </label>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded">
                  1 من = 40 کلو
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#7c6853] mb-1">
                    من (Maunds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={openingMaunds}
                    onChange={(e) => setOpeningMaunds(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] font-mono text-sm font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#7c6853] mb-1">
                    کلو (KG - 0 to 39.9)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="39.99"
                    step="any"
                    value={openingKg}
                    onChange={(e) => setOpeningKg(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] font-mono text-sm font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Weight Preview Badge */}
              <div className="p-2.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-[#8b5a2b] flex items-center justify-between">
                <span>{language === "ur" ? "کل درج شدہ وزن:" : "Total Computed Weight:"}</span>
                <span className="font-mono text-emerald-800">
                  {openingMaunds || 0} من {openingKg || 0} کلو = {computedTotalStock.toFixed(2)} من ({(computedTotalStock * 40).toFixed(1)} KG)
                </span>
              </div>
            </div>
          )}

          {unit === "kg" && (
            <div className="space-y-2 p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
              <label className="block font-bold text-[#2d2115]">
                {language === "ur" ? "ابتدائی موجود اسٹاک (کلوگرام میں)" : "Initial Stock (in KG)"} *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="مثلاً 60 کلو"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] font-mono text-sm font-bold focus:outline-none"
              />
              {Number(currentStock) > 0 && (
                <div className="text-[11px] text-[#8b5a2b] font-semibold flex justify-between bg-white p-2 rounded-lg border border-amber-300">
                  <span>من موازنہ (Maund conversion):</span>
                  <span className="font-mono font-bold text-emerald-800">
                    = {Math.floor(Number(currentStock) / 40)} من {Number((Number(currentStock) % 40).toFixed(1))} کلو ({(Number(currentStock) / 40).toFixed(2)} Maunds)
                  </span>
                </div>
              )}
            </div>
          )}

          {unit === "bag" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Filled Bags (بھری بوریاں) *</label>
                <input
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Empty Bags (خالی باردانہ)</label>
                <input
                  type="number"
                  min="0"
                  value={emptyBags}
                  onChange={(e) => setEmptyBags(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Min Alert Threshold ({unit})
              </label>
              <input
                type="number"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Initial Market Rate (Rs per {unit === "kg" ? "KG" : unit === "bag" ? "Bag" : "Maund"}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={initialRate}
                onChange={(e) => setInitialRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
              />
              {unit === "maund" && Number(initialRate) > 0 && (
                <div className="text-[10px] text-[#7c6853] mt-0.5">
                  = Rs {(Number(initialRate) / 40).toFixed(2)} / KG
                </div>
              )}
            </div>
          </div>

          {/* TOTAL INITIAL INVESTMENT BANNER */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-xl border border-[#ebdcc9] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#7c6853] text-xs">
                {language === "ur" ? "کل ابتدائی مالیت (Opening Investment):" : "Opening Stock Investment:"}
              </span>
              <span className="text-base font-black font-mono text-emerald-800">
                Rs {initialInvestment.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-[#7c6853]">
              {language === "ur"
                ? `💡 یہ رقم ڈیش بورڈ کی "کل سرمایہ کاری (Total Investment)" میں خودکار شامل ہوگی (${computedTotalStock} ${unit} × Rs ${initialRateNum.toLocaleString()})۔`
                : `💡 This amount is automatically added to "Total Investment" on your Dashboard (${computedTotalStock} ${unit} × Rs ${initialRateNum.toLocaleString()}).`}
            </div>
          </div>

          {unit !== "bag" && (
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Empty Bags in Stock (خالی باردانہ)
              </label>
              <input
                type="number"
                value={emptyBags}
                onChange={(e) => setEmptyBags(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
              />
            </div>
          )}

          <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226] shadow-xs active:scale-95 transition-all"
            >
              Save Grain / محفوظ کریں
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
