"use client";

import React, { useState, useEffect } from "react";
import {
  ReceiptText,
  Users,
  ShoppingCart,
  Truck,
  Wallet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";
import Modal from "@/components/Modal";

export default function BaqayaPage() {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"regular" | "local" | "suppliers">("regular");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Modals state
  const [payCustomerModal, setPayCustomerModal] = useState<any | null>(null);
  const [payCustomerAmount, setPayCustomerAmount] = useState("");
  const [payCustomerMethod, setPayCustomerMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [payCustomerNotes, setPayCustomerNotes] = useState("");
  const [customerPayLoading, setCustomerPayLoading] = useState(false);

  const [clearLocalModal, setClearLocalModal] = useState<any | null>(null);
  const [clearLocalAmount, setClearLocalAmount] = useState("");
  const [clearLocalMethod, setClearLocalMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [clearLocalNotes, setClearLocalNotes] = useState("");
  const [localPayLoading, setLocalPayLoading] = useState(false);

  const [paySupplierModal, setPaySupplierModal] = useState<any | null>(null);
  const [paySupplierAmount, setPaySupplierAmount] = useState("");
  const [paySupplierMethod, setPaySupplierMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [paySupplierNotes, setPaySupplierNotes] = useState("");
  const [supplierPayLoading, setSupplierPayLoading] = useState(false);

  // Edit Customer Baqaya Modal State
  const [showEditBaqayaModal, setShowEditBaqayaModal] = useState(false);
  const [editBaqayaCustomer, setEditBaqayaCustomer] = useState<any | null>(null);
  const [editBaqayaValue, setEditBaqayaValue] = useState("");
  const [editBaqayaLoading, setEditBaqayaLoading] = useState(false);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchBaqayaData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/baqaya");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch Baqaya data:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaqayaData();
  }, []);

  // Live real-time sync across sales, customers, purchases, cashbook, and baqaya
  useRealTimeSync(["sales", "customers", "purchases", "cashbook", "baqaya", "all"], () => {
    fetchBaqayaData(true);
  });

  // Handle Save Edit Customer Baqaya
  const handleSaveEditBaqaya = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBaqayaCustomer) return;

    try {
      setEditBaqayaLoading(true);
      const res = await fetch(`/api/customers/${editBaqayaCustomer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editBaqayaCustomer,
          totalPending: Number(editBaqayaValue) || 0,
        }),
      });

      if (res.ok) {
        setSuccessToast(
          `Baqaya for ${editBaqayaCustomer.name} updated to Rs ${Number(editBaqayaValue).toLocaleString()}!`
        );
        setTimeout(() => setSuccessToast(null), 5000);
        setShowEditBaqayaModal(false);
        setEditBaqayaCustomer(null);
        fetchBaqayaData(true);

        broadcastSync("customers");
        broadcastSync("sales");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update Baqaya");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setEditBaqayaLoading(false);
    }
  };

  // Handle Pay Regular Customer Baqaya
  const handlePayCustomerBaqaya = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCustomerModal || !payCustomerAmount) return;

    try {
      setCustomerPayLoading(true);
      const res = await fetch(`/api/customers/${payCustomerModal._id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(payCustomerAmount),
          paymentMethod: payCustomerMethod,
          notes: payCustomerNotes,
        }),
      });

      if (res.ok) {
        setSuccessToast(
          `Baqaya payment of Rs ${Number(payCustomerAmount).toLocaleString()} received from ${
            payCustomerModal.name
          }!`
        );
        setTimeout(() => setSuccessToast(null), 5000);
        setPayCustomerModal(null);
        setPayCustomerAmount("");
        setPayCustomerNotes("");
        fetchBaqayaData(true);
        broadcastSync("customers");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const err = await res.json();
        alert(err.error || "Payment recording failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setCustomerPayLoading(false);
    }
  };

  // Handle Clear Local Walk-in Sale Baqaya
  const handleClearLocalBaqaya = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearLocalModal || !clearLocalAmount) return;

    try {
      setLocalPayLoading(true);
      const res = await fetch("/api/baqaya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear_local_sale",
          saleId: clearLocalModal._id,
          amount: Number(clearLocalAmount),
          paymentMethod: clearLocalMethod,
          notes: clearLocalNotes,
        }),
      });

      if (res.ok) {
        setSuccessToast(
          `Walk-in Sale #${clearLocalModal.invoiceNumber} baqaya of Rs ${Number(
            clearLocalAmount
          ).toLocaleString()} cleared & added to CashBook!`
        );
        setTimeout(() => setSuccessToast(null), 5000);
        setClearLocalModal(null);
        setClearLocalAmount("");
        setClearLocalNotes("");
        fetchBaqayaData(true);
        broadcastSync("sales");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const err = await res.json();
        alert(err.error || "Payment failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setLocalPayLoading(false);
    }
  };

  // Handle Pay Supplier Due
  const handlePaySupplierDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplierModal || !paySupplierAmount) return;

    try {
      setSupplierPayLoading(true);
      const res = await fetch("/api/baqaya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay_supplier",
          supplierId: paySupplierModal._id,
          amount: Number(paySupplierAmount),
          paymentMethod: paySupplierMethod,
          notes: paySupplierNotes,
        }),
      });

      if (res.ok) {
        setSuccessToast(
          `Payment of Rs ${Number(paySupplierAmount).toLocaleString()} to supplier ${
            paySupplierModal.name
          } recorded!`
        );
        setTimeout(() => setSuccessToast(null), 5000);
        setPaySupplierModal(null);
        setPaySupplierAmount("");
        setPaySupplierNotes("");
        fetchBaqayaData(true);
        broadcastSync("purchases");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const err = await res.json();
        alert(err.error || "Payment failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setSupplierPayLoading(false);
    }
  };

  const summary = data?.summary || {
    totalCustomerBaqaya: 0,
    totalLocalBaqaya: 0,
    totalSupplierBaqaya: 0,
    totalOverallBaqaya: 0,
    countCustomers: 0,
    countLocalSlips: 0,
    countSuppliers: 0,
  };

  // Filter regular customers
  const filteredCustomers = (data?.regularCustomers || []).filter(
    (c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  // Filter local sales
  const filteredLocalSales = (data?.localSales || []).filter(
    (s: any) =>
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(search))
  );

  // Filter suppliers
  const filteredSuppliers = (data?.suppliers || []).filter(
    (sp: any) =>
      sp.name.toLowerCase().includes(search.toLowerCase()) ||
      (sp.phone && sp.phone.includes(search))
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-[#8b5a2b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "بقایا جات کھاتہ رجسٹر" : "Baqaya & Credit Register"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "کھاتہ دار کسٹمرز، عام گاہک اور سپلائر خریداری کے تمام بقایا جات کا مکمل رجسٹر اور فوری وصولی"
              : "Comprehensive accounts receivable, customer udhaar khata, walk-in slip dues, and supplier payables."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBaqayaData()}
            className="px-3 py-2 rounded-xl bg-white border border-[#ebdcc9] text-xs font-bold text-[#7c6853] hover:text-[#2d2115] hover:bg-[#fbf7ee] flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{language === "ur" ? "تازہ کریں" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Top Glowing Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Regular Customer Baqaya */}
        <div className="bg-gradient-to-br from-[#ffffff] to-[#fff7eb] rounded-2xl p-4 sm:p-5 border border-[#fed7aa] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9a3412] uppercase tracking-wider">
              {language === "ur" ? "کھاتہ دار بقایا" : "Regular Customer Baqaya"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-[#7c2d12] mt-2">
            Rs {summary.totalCustomerBaqaya.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#9a3412]/80 mt-1 flex items-center justify-between">
            <span>{summary.countCustomers} کھاتہ داروں کا ادھار</span>
            <span className="font-semibold text-orange-700">کھاتہ رجسٹر</span>
          </div>
        </div>

        {/* Card 2: Local Walk-in Sales Baqaya */}
        <div className="bg-gradient-to-br from-[#ffffff] to-[#fef2f2] rounded-2xl p-4 sm:p-5 border border-[#fecaca] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
              {language === "ur" ? "عام گاہک پرچہ بقایا" : "Walk-in Slip Baqaya"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-800 mt-2">
            Rs {summary.totalLocalBaqaya.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-800/80 mt-1 flex items-center justify-between">
            <span>{summary.countLocalSlips} نقد پرچیاں بقایا</span>
            <span className="font-semibold text-rose-700">غیر ادا شدہ</span>
          </div>
        </div>

        {/* Card 3: Supplier Payables */}
        <div className="bg-gradient-to-br from-[#ffffff] to-[#fefce8] rounded-2xl p-4 sm:p-5 border border-[#fef08a] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              {language === "ur" ? "سپلائر واجب الادا" : "Supplier Payables"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-900 mt-2">
            Rs {summary.totalSupplierBaqaya.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-900/80 mt-1 flex items-center justify-between">
            <span>{summary.countSuppliers} سپلائرز کو ادائیگی</span>
            <span className="font-semibold text-amber-700">واجب الادا</span>
          </div>
        </div>

        {/* Card 4: Total Net Market Dues */}
        <div className="bg-gradient-to-br from-[#23180d] to-[#3d2a19] text-white rounded-2xl p-4 sm:p-5 border border-[#523922] shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              {language === "ur" ? "کل مارکیٹ ادھار وصولی" : "Total Market Receivables"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#b8860b] flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-100 mt-2">
            Rs {summary.totalOverallBaqaya.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-200/80 mt-1">
            کھاتہ دار + عام گاہک کل واجب الوصول
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-[#ebdcc9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* 3 Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#fbf7ee] rounded-xl border border-[#ebdcc9] overflow-x-auto">
            <button
              onClick={() => setActiveTab("regular")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === "regular"
                  ? "bg-[#8b5a2b] text-white shadow-xs"
                  : "text-[#7c6853] hover:text-[#2d2115]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === "ur" ? "کھاتہ دار کسٹمرز بقایا" : "Regular Customers"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "regular" ? "bg-white/20 text-white" : "bg-[#ebdcc9] text-[#7c6853]"
                }`}
              >
                {summary.countCustomers}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("local")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === "local"
                  ? "bg-[#8b5a2b] text-white shadow-xs"
                  : "text-[#7c6853] hover:text-[#2d2115]"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{language === "ur" ? "عام گاہک پرچہ بقایا" : "Walk-in Slip Baqaya"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "local" ? "bg-white/20 text-white" : "bg-[#ebdcc9] text-[#7c6853]"
                }`}
              >
                {summary.countLocalSlips}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("suppliers")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === "suppliers"
                  ? "bg-[#8b5a2b] text-white shadow-xs"
                  : "text-[#7c6853] hover:text-[#2d2115]"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{language === "ur" ? "سپلائر خریداری بقایا" : "Supplier Purchases"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "suppliers" ? "bg-white/20 text-white" : "bg-[#ebdcc9] text-[#7c6853]"
                }`}
              >
                {summary.countSuppliers}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8b5a2b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "regular"
                  ? "Search regular customer by name/phone..."
                  : activeTab === "local"
                  ? "Search walk-in sale or slip #..."
                  : "Search supplier..."
              }
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
            />
          </div>
        </div>

        {/* TAB 1: REGULAR CUSTOMERS BAQAYA */}
        {activeTab === "regular" && (
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#7c6853]">
                Loading regular customer accounts...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-xs text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 font-bold">
                تمام کھاتہ داروں کے بقایا جات کلیئر ہیں! No regular customer has pending balance.
              </div>
            ) : (
              <div className="divide-y divide-[#ebdcc9] border border-[#ebdcc9] rounded-xl overflow-hidden">
                {filteredCustomers.map((cust: any) => {
                  const isExpanded = expandedCustomer === cust._id;
                  return (
                    <div key={cust._id} className="bg-white hover:bg-[#fffdfa] transition-colors">
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Customer Meta */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#fbf7ee] border border-[#ebdcc9] flex items-center justify-center font-bold text-[#8b5a2b] text-sm shrink-0">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
                              <span>{cust.name}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {cust.ranking || "Silver"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#7c6853] mt-1">
                              {cust.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-[#8b5a2b]" />
                                  <span>{cust.phone}</span>
                                </span>
                              )}
                              {cust.address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#8b5a2b]" />
                                  <span>{cust.address}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Financial Ledger Details: Paid vs Due */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          {/* Total Paid */}
                          <div className="bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl text-right">
                            <div className="text-[10px] text-emerald-800 font-bold uppercase">
                              کتنے پیسے دیے ہیں (Paid)
                            </div>
                            <div className="text-sm font-black font-mono text-emerald-800">
                              Rs {cust.totalPaid.toLocaleString()}
                            </div>
                          </div>

                          {/* Remaining Due */}
                          <div className="bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl text-right">
                            <div className="text-[10px] text-rose-800 font-bold uppercase">
                              بعد میں دینے ہیں (بقایا)
                            </div>
                            <div className="text-base font-black font-mono text-rose-700">
                              Rs {cust.totalPending.toLocaleString()}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditBaqayaCustomer(cust);
                                setEditBaqayaValue(String(cust.totalPending));
                                setShowEditBaqayaModal(true);
                              }}
                              className="px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center gap-1 border border-blue-200 transition-all shadow-xs"
                              title="Edit Customer Baqaya / کھاتہ بقایا درست کریں"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>درست کریں</span>
                            </button>

                            <button
                              onClick={() => {
                                setPayCustomerModal(cust);
                                setPayCustomerAmount(String(cust.totalPending));
                              }}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>بقایا وصول کریں</span>
                            </button>

                            <button
                              onClick={() =>
                                setExpandedCustomer(isExpanded ? null : cust._id)
                              }
                              className="p-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#7c6853] hover:text-[#2d2115]"
                              title="تاریخ وار آرڈرز تفصیل"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Order Breakdown: Date-wise orders */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-[#fcf9f2] border-t border-[#ebdcc9]">
                          <div className="text-[11px] font-bold text-[#8b5a2b] uppercase mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              غیر ادا شدہ و بقایا پرچیاں / Pending Invoices with Dates (
                              {cust.pendingOrders?.length || 0})
                            </span>
                          </div>

                          {(!cust.pendingOrders || cust.pendingOrders.length === 0) ? (
                            <div className="text-xs text-[#7c6853] italic py-2">
                              سابقہ کھاتہ بیلنس موجود ہے۔ کوئی الگ غیر ادا شدہ پرچہ نہیں ہے۔
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-[#ebdcc9] bg-white">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#fbf7ee] text-[#7c6853] font-bold uppercase text-[10px] border-b border-[#ebdcc9]">
                                  <tr>
                                    <th className="py-2 px-3">تاریخ (Date)</th>
                                    <th className="py-2 px-3">پرچہ نمبر</th>
                                    <th className="py-2 px-3">جنس و تفصیل</th>
                                    <th className="py-2 px-3 text-right">کل بل (Total)</th>
                                    <th className="py-2 px-3 text-right text-emerald-800">
                                      نقد دیا (Paid)
                                    </th>
                                    <th className="py-2 px-3 text-right text-rose-700 font-bold">
                                      اس دن کا بقایا (Due)
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#ebdcc9]">
                                  {cust.pendingOrders.map((order: any) => (
                                    <tr key={order._id} className="hover:bg-[#fbf7ee]/50">
                                      <td className="py-2 px-3 whitespace-nowrap font-medium text-[#2d2115]">
                                        {new Date(order.date).toLocaleDateString("en-PK", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-[#8b5a2b]">
                                        #{order.invoiceNumber}
                                      </td>
                                      <td className="py-2 px-3 text-[#7c6853]">
                                        {order.items
                                          ?.map(
                                            (it: any) =>
                                              `${it.quantity} ${it.unit} ${it.productName}`
                                          )
                                          .join(", ")}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-[#2d2115]">
                                        Rs {order.netAmount.toLocaleString()}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-emerald-800 font-semibold">
                                        Rs {order.paidAmount.toLocaleString()}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                                        Rs {order.dueAmount.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LOCAL WALK-IN SLIPS BAQAYA */}
        {activeTab === "local" && (
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#7c6853]">
                Loading walk-in sale slips...
              </div>
            ) : filteredLocalSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 font-bold">
                تمام عام گاہکوں کے نقد پرچے کلیئر ہیں! No walk-in slips have pending balance.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#ebdcc9]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbf7ee] text-[#7c6853] font-bold uppercase text-[10px] border-b border-[#ebdcc9]">
                    <tr>
                      <th className="py-3 px-3.5">کس دن کا بقایا ہے (Date)</th>
                      <th className="py-3 px-3.5">پرچہ نمبر</th>
                      <th className="py-3 px-3.5">گاہک کا نام و فون</th>
                      <th className="py-3 px-3.5">جنس و وزن</th>
                      <th className="py-3 px-3.5 text-right">کل بل رقم</th>
                      <th className="py-3 px-3.5 text-right text-emerald-800">کتنے پیسے دیے ہیں</th>
                      <th className="py-3 px-3.5 text-right text-rose-700 font-bold">
                        بعد میں دینے ہیں (بقایا)
                      </th>
                      <th className="py-3 px-3.5 text-center">کارروائی (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebdcc9] bg-white">
                    {filteredLocalSales.map((sale: any) => (
                      <tr key={sale._id} className="hover:bg-[#fbf7ee]/60 transition-colors">
                        <td className="py-3 px-3.5 whitespace-nowrap font-medium text-[#2d2115]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#8b5a2b]" />
                            <span>
                              {new Date(sale.date).toLocaleDateString("en-PK", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-[#8b5a2b]">
                          #{sale.invoiceNumber}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-[#2d2115]">{sale.customerName}</div>
                          {sale.customerPhone && (
                            <div className="text-[10px] text-[#7c6853] flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{sale.customerPhone}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-[#7c6853]">
                          {sale.items
                            ?.map((it: any) => `${it.quantity} ${it.unit} ${it.productName}`)
                            .join(", ")}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-[#2d2115]">
                          Rs {sale.netAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-emerald-800 font-semibold">
                          Rs {sale.paidAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-rose-700">
                          Rs {sale.dueAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => {
                              setClearLocalModal(sale);
                              setClearLocalAmount(String(sale.dueAmount));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1 mx-auto transition-all active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>بقایا کلیئر کریں</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUPPLIER PURCHASES BAQAYA */}
        {activeTab === "suppliers" && (
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#7c6853]">
                Loading supplier accounts...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-xs text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 font-bold">
                تمام سپلائرز کے بقایا جات ادا ہو چکے ہیں! All supplier payables are cleared.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#ebdcc9]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbf7ee] text-[#7c6853] font-bold uppercase text-[10px] border-b border-[#ebdcc9]">
                    <tr>
                      <th className="py-3 px-3.5">سپلائر کا نام (Supplier)</th>
                      <th className="py-3 px-3.5">فون و پتہ</th>
                      <th className="py-3 px-3.5 text-right text-amber-900 font-bold">
                        سپلائر کو بعد میں دینے ہیں (واجب الادا)
                      </th>
                      <th className="py-3 px-3.5 text-center">کارروائی (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebdcc9] bg-white">
                    {filteredSuppliers.map((supp: any) => (
                      <tr key={supp._id} className="hover:bg-[#fbf7ee]/60 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-[#2d2115]">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {supp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{supp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-[#7c6853]">
                          <div>{supp.phone || "No phone"}</div>
                          <div className="text-[10px] text-[#a89279]">{supp.address}</div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-amber-900 text-sm">
                          Rs {supp.totalPayable.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => {
                              setPaySupplierModal(supp);
                              setPaySupplierAmount(String(supp.totalPayable));
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs flex items-center gap-1 mx-auto transition-all active:scale-95"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>سپلائر کو بقایا دیں</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: PAY REGULAR CUSTOMER BAQAYA */}
      {/* ==================================================== */}
      <Modal
        isOpen={!!payCustomerModal}
        onClose={() => setPayCustomerModal(null)}
        title="کھاتہ دار بقایا وصول کریں / Receive Customer Due"
        icon={<Wallet className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="md"
      >
        {payCustomerModal && (
          <div>
            <div className="p-3 bg-[#fdf6e3] rounded-xl border border-[#ebdcc9] mb-4 space-y-1">
              <div className="flex justify-between font-bold text-[#2d2115]">
                <span>گاہک (Customer):</span>
                <span>{payCustomerModal.name}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>کل واجب الادا بقایا:</span>
                <span className="font-mono text-sm">
                  Rs {payCustomerModal.totalPending.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayCustomerBaqaya} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#2d2115]">وصول شدہ رقم (Rs)</label>
                  <button
                    type="button"
                    onClick={() => setPayCustomerAmount(String(payCustomerModal.totalPending))}
                    className="text-[11px] text-[#8b5a2b] font-bold underline hover:text-black"
                  >
                    پورا بقایا وصول کریں
                  </button>
                </div>
                <input
                  type="number"
                  value={payCustomerAmount}
                  onChange={(e) => setPayCustomerAmount(e.target.value)}
                  placeholder="Enter amount paid"
                  max={payCustomerModal.totalPending}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-base font-bold font-mono text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  ذریعہ ادائیگی (Payment Mode)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "bank", "cheque"] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPayCustomerMethod(mode)}
                      className={`py-2 rounded-xl border text-center font-bold capitalize transition-all ${
                        payCustomerMethod === mode
                          ? "bg-[#2f5233] text-white border-[#2f5233]"
                          : "bg-[#fbf7ee] text-[#7c6853] border-[#ebdcc9]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  نوٹ / تفصیل (Remarks)
                </label>
                <input
                  type="text"
                  value={payCustomerNotes}
                  onChange={(e) => setPayCustomerNotes(e.target.value)}
                  placeholder="e.g. نقد وصول بذریعہ منشی"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPayCustomerModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#ebdcc9] text-[#7c6853] font-bold hover:bg-neutral-100"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  disabled={customerPayLoading}
                  className="px-5 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {customerPayLoading ? "Saving..." : "وصولی محفوظ کریں (Save)"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: CLEAR LOCAL WALK-IN SALE BAQAYA */}
      {/* ==================================================== */}
      <Modal
        isOpen={!!clearLocalModal}
        onClose={() => setClearLocalModal(null)}
        title={clearLocalModal ? `عام گاہک پرچہ بقایا وصولی (#${clearLocalModal.invoiceNumber})` : "بقایا وصولی"}
        icon={<ShoppingCart className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="md"
      >
        {clearLocalModal && (
          <div>
            <div className="p-3 bg-[#fdf6e3] rounded-xl border border-[#ebdcc9] mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#7c6853]">خریدار کا نام:</span>
                <span className="font-bold text-[#2d2115]">{clearLocalModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c6853]">پرچہ تاریخ:</span>
                <span>{new Date(clearLocalModal.date).toLocaleDateString("en-PK")}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold border-t border-[#ebdcc9] pt-1 mt-1">
                <span>باقی بقایا رقم:</span>
                <span className="font-mono text-sm">
                  Rs {clearLocalModal.dueAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleClearLocalBaqaya} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#2d2115]">وصول شدہ رقم (Rs)</label>
                  <button
                    type="button"
                    onClick={() => setClearLocalAmount(String(clearLocalModal.dueAmount))}
                    className="text-[11px] text-[#8b5a2b] font-bold underline hover:text-black"
                  >
                    مکمل بقایا وصول
                  </button>
                </div>
                <input
                  type="number"
                  value={clearLocalAmount}
                  onChange={(e) => setClearLocalAmount(e.target.value)}
                  max={clearLocalModal.dueAmount}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-base font-bold font-mono text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">ذریعہ ادائیگی</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "bank", "cheque"] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setClearLocalMethod(mode)}
                      className={`py-2 rounded-xl border text-center font-bold capitalize transition-all ${
                        clearLocalMethod === mode
                          ? "bg-[#2f5233] text-white border-[#2f5233]"
                          : "bg-[#fbf7ee] text-[#7c6853] border-[#ebdcc9]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setClearLocalModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#ebdcc9] text-[#7c6853] font-bold hover:bg-neutral-100"
                >
                  منسوخ
                </button>
                <button
                  type="submit"
                  disabled={localPayLoading}
                  className="px-5 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {localPayLoading ? "Processing..." : "بقایا کلیئر کریں"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: PAY SUPPLIER DUE */}
      {/* ==================================================== */}
      <Modal
        isOpen={!!paySupplierModal}
        onClose={() => setPaySupplierModal(null)}
        title="سپلائر کو بقایا ادا کریں / Pay Supplier Due"
        icon={<Truck className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="md"
      >
        {paySupplierModal && (
          <div>
            <div className="p-3 bg-[#fefce8] rounded-xl border border-[#fef08a] mb-4 space-y-1">
              <div className="flex justify-between font-bold text-[#2d2115]">
                <span>سپلائر:</span>
                <span>{paySupplierModal.name}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-bold">
                <span>واجب الادا بقایا:</span>
                <span className="font-mono text-sm">
                  Rs {paySupplierModal.totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaySupplierDue} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#2d2115]">ادائیگی رقم (Rs)</label>
                  <button
                    type="button"
                    onClick={() => setPaySupplierAmount(String(paySupplierModal.totalPayable))}
                    className="text-[11px] text-amber-800 font-bold underline hover:text-black"
                  >
                    مکمل بقایا ادا کریں
                  </button>
                </div>
                <input
                  type="number"
                  value={paySupplierAmount}
                  onChange={(e) => setPaySupplierAmount(e.target.value)}
                  max={paySupplierModal.totalPayable}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-base font-bold font-mono text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">ادائیگی موڈ</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "bank", "cheque"] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPaySupplierMethod(mode)}
                      className={`py-2 rounded-xl border text-center font-bold capitalize transition-all ${
                        paySupplierMethod === mode
                          ? "bg-amber-800 text-white border-amber-800"
                          : "bg-[#fbf7ee] text-[#7c6853] border-[#ebdcc9]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPaySupplierModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#ebdcc9] text-[#7c6853] font-bold hover:bg-neutral-100"
                >
                  منسوخ
                </button>
                <button
                  type="submit"
                  disabled={supplierPayLoading}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {supplierPayLoading ? "Processing..." : "ادائیگی درج کریں"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Customer Baqaya */}
      <Modal
        isOpen={showEditBaqayaModal && !!editBaqayaCustomer}
        onClose={() => setShowEditBaqayaModal(false)}
        title={editBaqayaCustomer ? `کھاتہ دار کا بقایا درست کریں: ${editBaqayaCustomer.name}` : "درست کریں"}
        icon={<Edit2 className="w-5 h-5 text-blue-700" />}
        maxWidth="md"
      >
        {editBaqayaCustomer && (
          <form onSubmit={handleSaveEditBaqaya} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex justify-between items-center text-amber-900 font-medium mb-1">
                <span>سابقہ بقایا رقم:</span>
                <span className="font-mono font-bold text-rose-700">
                  Rs {Number(editBaqayaCustomer.totalPending || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-900 font-medium">
                <span>وصول شدہ نقد (Paid):</span>
                <span className="font-mono font-bold text-emerald-800">
                  Rs {Number(editBaqayaCustomer.totalPaid || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-rose-800 mb-1.5">
                نیا کل واجب الادا بقایا (New Total Due Baqaya Rs) *
              </label>
              <input
                type="number"
                required
                value={editBaqayaValue}
                onChange={(e) => setEditBaqayaValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50/50 text-rose-900 font-mono font-black text-base focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                placeholder="0"
              />
              <span className="text-[10px] text-[#7c6853] block mt-1">
                اگر کسی غلط اندراج کی وجہ سے بقایا غلط تھا تو یہاں درست رقم درج کریں۔
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditBaqayaValue("0")}
                className="py-1 px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors"
              >
                صفر بقایا (0 - No Due)
              </button>
              <button
                type="button"
                onClick={() => setEditBaqayaValue(String(editBaqayaCustomer.totalPending || 0))}
                className="py-1 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold transition-colors"
              >
                ری سیٹ (Reset)
              </button>
            </div>

            <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditBaqayaModal(false)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
              >
                منسوخ
              </button>
              <button
                type="submit"
                disabled={editBaqayaLoading}
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editBaqayaLoading ? "Saving..." : "بقایا محفوظ کریں"}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
