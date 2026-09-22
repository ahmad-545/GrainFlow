"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Filter,
  DollarSign,
  TrendingDown,
  Layers,
  Calendar,
  X,
  CreditCard,
  Edit2,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";
import Modal from "@/components/Modal";

export default function CashBookPage() {
  const { language } = useLanguage();
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // New Entry Modal
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<string>("labor");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);

  // Edit Modal
  const [editEntry, setEditEntry] = useState<any>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState<string>("labor");
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      let url = "/api/cashbook?";
      if (filterType !== "all") url += `type=${filterType}&`;
      if (filterCategory !== "all") url += `category=${filterCategory}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setSummary(data.summary || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filterType, filterCategory]);

  // Live real-time sync when sales, purchases, customers, or expenses happen
  useRealTimeSync(["cashbook", "sales", "purchases", "customers", "baqaya", "all"], () => {
    fetchEntries(true);
  });

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category,
          amount: Number(amount),
          paymentMethod,
          description,
          date: entryDate,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setAmount("");
        setDescription("");
        fetchEntries();
        broadcastSync("cashbook");
        broadcastSync("all");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (entry: any) => {
    setEditEntry(entry);
    setEditType(entry.type);
    setEditCategory(entry.category);
    setEditAmount(String(entry.amount));
    setEditPaymentMethod(entry.paymentMethod || "cash");
    setEditDescription(entry.description || "");
    setEditDate(new Date(entry.date).toISOString().split("T")[0]);
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/cashbook/${editEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          category: editCategory,
          amount: Number(editAmount),
          paymentMethod: editPaymentMethod,
          description: editDescription,
          date: editDate,
        }),
      });

      if (res.ok) {
        setEditEntry(null);
        fetchEntries();
        broadcastSync("cashbook");
        broadcastSync("all");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/cashbook/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchEntries();
        broadcastSync("cashbook");
        broadcastSync("all");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "sale_payment":
        return "Sale Receipt / فروخت وصولی";
      case "supplier_payment":
        return "Supplier Payment / سپلائر ادائیگی";
      case "transport":
        return "Transport / گاڑی کرایہ";
      case "labor":
        return "Labor (Hamali) / مزدوری و پلے داری";
      case "rent":
        return "Shop/Godown Rent / دکان کرایہ";
      case "electricity":
        return "Electricity Bill / بجلی بل";
      case "packing":
        return "Bags & Packing / باردانہ";
      default:
        return "Miscellaneous / متفرق خرچہ";
    }
  };

  const CategorySelect = ({ value, onChange, entryType }: { value: string; onChange: (v: string) => void; entryType: string }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
    >
      {entryType === "expense" ? (
        <>
          <option value="labor">Labor (Hamali / مزدوری)</option>
          <option value="transport">Transport (کرایہ)</option>
          <option value="packing">Bags &amp; Packing (باردانہ)</option>
          <option value="rent">Shop / Godown Rent (دکان کرایہ)</option>
          <option value="electricity">Electricity Bill (بجلی بل)</option>
          <option value="supplier_payment">Supplier Payment (سپلائر)</option>
          <option value="other">Miscellaneous (دیگر)</option>
        </>
      ) : (
        <>
          <option value="sale_payment">Customer Payment (وصولی)</option>
          <option value="other">Other Income (دیگر آمدن)</option>
        </>
      )}
    </select>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#8b5a2b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "روزنامچہ و کیش بک (Accounts)" : "Daily Cash Book (Roznamcha)"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "روزانہ کیش آمدن، دکان کے اخراجات (کرایہ، مزدوری، باردانہ) اور ہاتھ میں موجود رقم کا حساب"
              : "Track cash in hand, income, categorized operating expenses (labor, transport, rent), and balances."}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#8b5a2b] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === "ur" ? "+ نیا اندراج (آمدن / خرچہ)" : "+ Add Cash Entry"}</span>
        </button>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#1e3621] to-[#2f5233] text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Total Cash In Hand
            </span>
            <Wallet className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono">
              Rs {(summary?.cashInHand || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">
              Net Physical &amp; Bank Balance
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between text-[#7c6853]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-800">
              Rs {(summary?.totalIncome || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#7c6853] mt-0.5">Cash collected from sales</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between text-[#7c6853]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Expenses</span>
            <ArrowDownLeft className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-rose-700">
              Rs {(summary?.totalExpense || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#7c6853] mt-0.5">Labor, transport &amp; supplies</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between text-[#7c6853]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Receivable vs Payable</span>
            <CreditCard className="w-4 h-4 text-[#8b5a2b]" />
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs font-bold font-mono text-blue-800 flex justify-between">
              <span>Recv:</span>
              <span>Rs {(summary?.totalReceivable || 0).toLocaleString()}</span>
            </div>
            <div className="text-xs font-bold font-mono text-rose-700 flex justify-between">
              <span>Pay:</span>
              <span>Rs {(summary?.totalPayable || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Categories Breakdown Strip */}
      <div className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#8b5a2b] mb-3">
          Expense Breakdown by Category (اخراجات کی مد)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summary?.categoryBreakdown?.map((cat: any, idx: number) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#fbf7ee] border border-[#ebdcc9] text-xs"
            >
              <div className="text-[10px] font-bold uppercase text-[#7c6853] truncate">
                {cat._id.replace(/_/g, " ")}
              </div>
              <div className="font-mono font-bold text-sm text-[#2d2115] mt-1">
                Rs {cat.total.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#7c6853] mt-0.5">{cat.count} entry(s)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Entries List & Filters */}
      <div className="bg-white rounded-2xl border border-[#ebdcc9] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#fbf7ee] border-b border-[#ebdcc9] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8b5a2b]" />
            <span className="text-xs font-bold text-[#2d2115]">Filter Entries:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
            >
              <option value="all">All Types (آمدن و خرچہ)</option>
              <option value="income">Income Only (آمدن)</option>
              <option value="expense">Expense Only (اخراجات)</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
            >
              <option value="all">All Categories (تمام مد)</option>
              <option value="sale_payment">Sale Receipts</option>
              <option value="supplier_payment">Supplier Payments</option>
              <option value="labor">Labor (Hamali)</option>
              <option value="transport">Transport (Freight)</option>
              <option value="packing">Bags / Packing</option>
              <option value="rent">Rent</option>
              <option value="electricity">Electricity</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fbf7ee] text-[#7c6853] uppercase font-bold border-b border-[#ebdcc9]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description / تفصیل</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (Rs)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebdcc9]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7c6853]">
                    Loading roznamcha entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7c6853]">
                    No entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isIncome = entry.type === "income";
                  return (
                    <tr key={entry._id} className="hover:bg-[#fdf6e3]/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-[#7c6853]">
                        {new Date(entry.date).toLocaleDateString("en-PK")}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            isIncome
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#2d2115] whitespace-nowrap">
                        {getCategoryLabel(entry.category)}
                      </td>
                      <td className="py-3 px-4 text-[#7c6853]">
                        {entry.description || "—"}
                        {entry.referenceId && (
                          <span className="text-[10px] text-[#8b5a2b] font-mono block">
                            Ref: #{entry.referenceId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize whitespace-nowrap text-[#7c6853]">
                        {entry.paymentMethod}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-sm ${
                          isIncome ? "text-emerald-800" : "text-rose-700"
                        }`}
                      >
                        {isIncome ? "+" : "-"} Rs {entry.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(entry)}
                            className="p-1.5 rounded-lg text-[#8b5a2b] hover:bg-amber-100 transition-colors"
                            title="Edit / ترمیم کریں"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === entry._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                disabled={deleting}
                                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 disabled:opacity-50"
                              >
                                {deleting ? "..." : "تصدیق"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-1 rounded-lg text-neutral-500 hover:bg-neutral-100 text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(entry._id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                              title="Delete / حذف کریں"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Cash Entry */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={language === "ur" ? "نیا کیش اندراج درج کریں" : "Record New Cash Book Entry"}
        icon={<BookOpen className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateEntry} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Entry Type</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              >
                <option value="expense">Expense (خرچہ)</option>
                <option value="income">Income (آمدن)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Category / مد</label>
              <CategorySelect value={category} onChange={setCategory} entryType={type} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Amount (Rs) *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              >
                <option value="cash">Cash (نقد)</option>
                <option value="bank">Bank Transfer (بینک)</option>
                <option value="cheque">Cheque (چیک)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Description / تفصیل</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Paid Hamali for unloading wheat bags"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226]"
            >
              Save Entry / درج کریں
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Cash Entry */}
      <Modal
        isOpen={!!editEntry}
        onClose={() => setEditEntry(null)}
        title={language === "ur" ? "اندراج میں ترمیم کریں" : "Edit Cash Entry"}
        icon={<Edit2 className="w-5 h-5 text-[#b8860b]" />}
        maxWidth="md"
      >
        {editEntry && (
          <form onSubmit={handleEditEntry} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Entry Type</label>
                <select
                  value={editType}
                  onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="expense">Expense (خرچہ)</option>
                  <option value="income">Income (آمدن)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Category / مد</label>
                <CategorySelect value={editCategory} onChange={setEditCategory} entryType={editType} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Amount (Rs) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Payment Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="cash">Cash (نقد)</option>
                  <option value="bank">Bank Transfer (بینک)</option>
                  <option value="cheque">Cheque (چیک)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Description / تفصیل</label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditEntry(null)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-5 py-2 rounded-xl bg-[#8b5a2b] text-white font-bold hover:bg-[#6f4520] flex items-center gap-1.5 disabled:opacity-50"
              >
                {editSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Update Entry / تبدیلی محفوظ کریں</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
