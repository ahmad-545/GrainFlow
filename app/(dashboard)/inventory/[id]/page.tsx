"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wheat,
  ArrowLeft,
  Package,
  AlertTriangle,
  TrendingDown,
  Layers,
  Calendar,
  Save,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingCart,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";

export default function GrainDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const id = params?.id as string;

  const [grainData, setGrainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Edit fields
  const [name, setName] = useState("");
  const [nameUrdu, setNameUrdu] = useState("");
  const [currentStock, setCurrentStock] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(20);
  const [emptyBags, setEmptyBags] = useState(0);
  const [filledBags, setFilledBags] = useState(0);
  const [notes, setNotes] = useState("");

  // Wastage entry fields
  const [lossQty, setLossQty] = useState("");
  const [lossReason, setLossReason] = useState("damage");
  const [lossNotes, setLossNotes] = useState("");
  const [wastageLoading, setWastageLoading] = useState(false);

  const fetchDetail = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGrainData(data);
        const p = data.product;
        setName(p.name);
        setNameUrdu(p.nameUrdu || "");
        setCurrentStock(p.currentStock);
        setMinStockAlert(p.minStockAlert);
        setEmptyBags(p.bagStock?.emptyBags || 0);
        setFilledBags(p.bagStock?.filledBags || 0);
        setNotes(p.notes || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  // Live real-time sync
  useRealTimeSync(["products", "sales", "purchases", "all"], () => {
    if (id) fetchDetail(true);
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nameUrdu,
          unit: grainData.product.unit,
          currentStock: Number(currentStock),
          minStockAlert: Number(minStockAlert),
          grades: grainData.product.grades,
          bagStock: {
            emptyBags: Number(emptyBags),
            filledBags: Number(filledBags),
            bagCapacityKg: grainData.product.bagStock?.bagCapacityKg || 50,
          },
          notes,
        }),
      });

      if (res.ok) {
        setMessage("Grain updated successfully!");
        setTimeout(() => setMessage(""), 3000);
        fetchDetail();
        broadcastSync("products");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossQty || Number(lossQty) <= 0) return;
    try {
      setWastageLoading(true);
      const res = await fetch(`/api/products/${id}/wastage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(lossQty),
          reason: lossReason,
          notes: lossNotes,
        }),
      });

      if (res.ok) {
        setLossQty("");
        setLossNotes("");
        setMessage("Wastage deducted from stock!");
        setTimeout(() => setMessage(""), 3000);
        fetchDetail();
        broadcastSync("products");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to log wastage");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWastageLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this grain type?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        broadcastSync("products");
        router.push("/inventory");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#7c6853]">
        Loading grain details...
      </div>
    );
  }

  if (!grainData || !grainData.product) {
    return (
      <div className="p-12 text-center text-xs text-rose-700">
        Grain not found. <Link href="/inventory" className="underline">Back to Inventory</Link>
      </div>
    );
  }

  const p = grainData.product;
  const isLow = p.currentStock <= p.minStockAlert;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8b5a2b] hover:text-[#b8860b]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Grain Inventory / واپسی</span>
        </Link>

        {message && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Main Grain Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ebdcc9]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#fdf6e3] border border-[#ebdcc9] flex items-center justify-center text-[#8b5a2b] shadow-xs">
              <Wheat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#2d2115]">{p.name}</h1>
                {isLow && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                    Low Stock Alert
                  </span>
                )}
              </div>
              {p.nameUrdu && (
                <div className="text-sm font-semibold text-[#8b5a2b]">{p.nameUrdu}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#ebdcc9] text-right">
              <div className="text-[10px] uppercase font-bold text-[#7c6853]">Total Reserves</div>
              <div className="text-2xl font-black font-mono text-[#8b5a2b]">
                {p.currentStock.toLocaleString()}{" "}
                <span className="text-xs text-[#7c6853]">{p.unit}</span>
              </div>
              {p.unit === "maund" && (
                <div className="text-[11px] font-bold font-mono text-emerald-800 mt-0.5">
                  = {Math.floor(p.currentStock)} من {Math.round((p.currentStock % 1) * 40)} کلو ({Math.round(p.currentStock * 40)} KG)
                </div>
              )}
            </div>

            <div className="p-3 bg-[#fbf7ee] rounded-xl border border-[#ebdcc9] text-right">
              <div className="text-[10px] uppercase font-bold text-[#7c6853]">Filled Bags</div>
              <div className="text-2xl font-black font-mono text-emerald-800">
                {p.bagStock?.filledBags || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form & Wastage Form Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* Left 2 Cols: Edit Grain Information */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-sm text-[#2d2115] mb-3">
              Edit Grain Configuration & Alerts
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">English Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">Urdu Name</label>
                  <input
                    type="text"
                    value={nameUrdu}
                    onChange={(e) => setNameUrdu(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">
                    Current Stock ({p.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono font-bold"
                  />
                  {p.unit === "maund" && (
                    <div className="text-[10px] font-bold text-emerald-800 mt-1">
                      = {Math.floor(currentStock)} من {Math.round((currentStock % 1) * 40)} کلو ({Math.round(currentStock * 40)} KG)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">
                    Low Stock Alert ({p.unit})
                  </label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">Empty Bags in Godown</label>
                  <input
                    type="number"
                    value={emptyBags}
                    onChange={(e) => setEmptyBags(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Notes / گودام لوکیشن</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Stored in Shed #2, inspected for moisture."
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Grain</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226] flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes / محفوظ کریں</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Col: Stock Wastage & Loss Tracking Form */}
          <div className="bg-[#fbf7ee] rounded-xl p-4 border border-[#ebdcc9]">
            <h3 className="font-bold text-xs text-[#2d2115] uppercase tracking-wider flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-rose-700" />
              <span>Record Wastage / کٹوتی و نقصان</span>
            </h3>
            <p className="text-[11px] text-[#7c6853] mb-3">
              نقصان، چوہوں، خشک ہونے یا تول میں کمی کو ریکارڈ کریں، اسٹاک خودکار کم ہو جائے گا۔
            </p>

            <form onSubmit={handleLogWastage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Quantity Lost ({p.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={lossQty}
                  onChange={(e) => setLossQty(e.target.value)}
                  placeholder={`e.g. 2 ${p.unit}`}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Reason / وجہ</label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
                >
                  <option value="damage">Damaged Bags (خراب مال)</option>
                  <option value="rodents">Rodents / Pests (چوہے / کیڑا)</option>
                  <option value="drying_weight_loss">Drying / Moisture Loss (خشک ہونے پر کمی)</option>
                  <option value="handling">Handling / Loading Spillage (لوڈنگ کا نقصان)</option>
                  <option value="other">Other Reason (دیگر)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Details / تفصیل</label>
                <input
                  type="text"
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  placeholder="Notes..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={wastageLoading}
                className="w-full py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold transition-all shadow-xs"
              >
                {wastageLoading ? "Deducting..." : "Deduct Loss from Stock / کٹوتی درج کریں"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Wastage Records Ledger & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wastage Logs */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-rose-700" />
            <span>Wastage & Loss History ({p.wastageRecords?.length || 0})</span>
          </h3>

          <div className="divide-y divide-[#ebdcc9] max-h-60 overflow-y-auto">
            {p.wastageRecords?.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7c6853]">No wastage recorded</div>
            ) : (
              p.wastageRecords.map((w: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-rose-800 capitalize">
                      {w.reason.replace(/_/g, " ")}
                    </span>
                    <div className="text-[10px] text-[#7c6853]">
                      {new Date(w.date).toLocaleDateString()} {w.notes && `• ${w.notes}`}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-rose-700">
                    -{w.quantity} {p.unit}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases & Sales Movement for this grain */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#8b5a2b]" />
            <span>Recent Movement (Purchases & Sales)</span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {grainData.recentPurchases?.map((pur: any) => (
              <div
                key={pur._id}
                className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-amber-700" />
                  <div>
                    <div className="font-bold text-[#2d2115]">Purchased from {pur.supplierName}</div>
                    <div className="text-[10px] text-[#7c6853]">{new Date(pur.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-emerald-800">
                  +{pur.quantity} {pur.unit} (Rs {pur.rate})
                </div>
              </div>
            ))}

            {grainData.recentSales?.map((sale: any) => (
              <div
                key={sale._id}
                className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
                  <div>
                    <div className="font-bold text-[#2d2115]">Sold to {sale.customerName}</div>
                    <div className="text-[10px] text-[#7c6853]">#{sale.invoiceNumber}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-rose-700">
                  - Sold
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
