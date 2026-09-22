"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  ArrowRight,
  Search,
  RotateCcw,
  BarChart2,
  Phone,
  MapPin,
  CheckCircle2,
  X,
  AlertCircle,
  Filter,
  Edit2,
  Trash2,
  Save,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";
import Modal from "@/components/Modal";

export default function PurchasesPage() {
  const { language } = useLanguage();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"entries" | "suppliers" | "comparison">("entries");

  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPaySupplierModal, setShowPaySupplierModal] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<any>(null);
  const [paySuppAmount, setPaySuppAmount] = useState("");
  const [paySuppMethod, setPaySuppMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [paySuppNotes, setPaySuppNotes] = useState("");
  const [paySuppLoading, setPaySuppLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedPurchaseForReturn, setSelectedPurchaseForReturn] = useState<any>(null);

  // Edit Purchase Modal State
  const [showEditPurchaseModal, setShowEditPurchaseModal] = useState(false);
  const [selectedPurchaseForEdit, setSelectedPurchaseForEdit] = useState<any>(null);
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editProductId, setEditProductId] = useState("");
  const [editGrade, setEditGrade] = useState("Standard");
  const [editUnit, setEditUnit] = useState("maund");
  const [editQuantity, setEditQuantity] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // New Purchase Form
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [purchaseUnit, setPurchaseUnit] = useState("maund");
  const [quantity, setQuantity] = useState("50");
  const [rate, setRate] = useState("3900");
  const [paidAmount, setPaidAmount] = useState("150000");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  // New Supplier Form
  const [suppName, setSuppName] = useState("");
  const [suppPhone, setSuppPhone] = useState("");
  const [suppAddress, setSuppAddress] = useState("");
  const [suppPayable, setSuppPayable] = useState("0");
  const [suppNotes, setSuppNotes] = useState("");

  // Return Form
  const [returnQty, setReturnQty] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [purRes, supRes, prodRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/products"),
      ]);

      if (purRes.ok) setPurchases(await purRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live real-time sync when purchases, inventory, cashbook, or baqaya changes
  useRealTimeSync(["purchases", "products", "cashbook", "baqaya", "all"], () => {
    fetchData(true);
  });

  // When product is selected in new purchase form, auto-fill today's rate
  const handleProductSelect = (pId: string) => {
    setProductId(pId);
    const prod = products.find((p) => p._id === pId);
    if (prod) {
      if (prod.unit) setPurchaseUnit(prod.unit);
      if (prod.todayRate?.rate) {
        setRate(String(prod.todayRate.rate));
      }
    }
  };

  const calcTotal = (Number(quantity) || 0) * (Number(rate) || 0);
  const calcEditTotal = (Number(editQuantity) || 0) * (Number(editRate) || 0);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          productId,
          unit: purchaseUnit,
          quantity: Number(quantity),
          rate: Number(rate),
          totalAmount: calcTotal,
          paidAmount: Number(paidAmount),
          paymentMethod,
          notes,
        }),
      });

      if (res.ok) {
        setShowPurchaseModal(false);
        fetchData();
        broadcastSync("purchases");
        broadcastSync("products");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to record purchase");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditPurchaseModal = (pur: any) => {
    setSelectedPurchaseForEdit(pur);
    setEditSupplierId(pur.supplierId || "");
    setEditProductId(pur.productId || "");
    setEditGrade(pur.grade || "Standard");
    setEditUnit(pur.unit || "maund");
    setEditQuantity(String(pur.quantity || ""));
    setEditRate(String(pur.rate || ""));
    setEditPaidAmount(String(pur.paidAmount ?? ""));
    setEditPaymentMethod(pur.paymentMethod || "cash");
    setEditDate(pur.date ? new Date(pur.date).toISOString().split("T")[0] : "");
    setEditNotes(pur.notes || "");
    setShowEditPurchaseModal(true);
  };

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseForEdit) return;
    try {
      setEditLoading(true);
      const res = await fetch(`/api/purchases/${selectedPurchaseForEdit._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: editSupplierId,
          productId: editProductId,
          grade: editGrade,
          unit: editUnit,
          quantity: Number(editQuantity),
          rate: Number(editRate),
          totalAmount: calcEditTotal,
          paidAmount: Number(editPaidAmount),
          paymentMethod: editPaymentMethod,
          date: editDate || undefined,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        setShowEditPurchaseModal(false);
        fetchData();
        broadcastSync("purchases");
        broadcastSync("products");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update purchase");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating purchase");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePurchase = async (pur: any) => {
    const confirmMsg =
      language === "ur"
        ? `کیا آپ واقعی اس خریداری کو ڈیلیٹ کرنا چاہتے ہیں؟\n\nسپلائر: ${pur.supplierName}\nاجناس: ${pur.productName} (${pur.quantity} ${pur.unit})\nکل رقم: Rs ${pur.totalAmount.toLocaleString()}\nادا شدہ: Rs ${pur.paidAmount.toLocaleString()}\n\nنوٹ: ڈیلیٹ کرنے سے اسٹاک، سپلائر کا کھاتہ اور کیش بک خودکار درست ہو جائیں گے۔`
        : `Are you sure you want to delete this purchase?\n\nSupplier: ${pur.supplierName}\nItem: ${pur.productName} (${pur.quantity} ${pur.unit})\nTotal: Rs ${pur.totalAmount.toLocaleString()}\nPaid: Rs ${pur.paidAmount.toLocaleString()}\n\nNote: Deleting will automatically adjust inventory stock, supplier ledger, and cashbook.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/purchases/${pur._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
        broadcastSync("purchases");
        broadcastSync("products");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete purchase");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting purchase");
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suppName,
          phone: suppPhone,
          address: suppAddress,
          initialPayable: Number(suppPayable),
          notes: suppNotes,
        }),
      });

      if (res.ok) {
        setShowSupplierModal(false);
        setSuppName("");
        setSuppPhone("");
        fetchData();
        broadcastSync("purchases");
        broadcastSync("baqaya");
        broadcastSync("all");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay || !paySuppAmount) return;

    try {
      setPaySuppLoading(true);
      const res = await fetch(`/api/suppliers/${selectedSupplierForPay._id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paySuppAmount),
          paymentMethod: paySuppMethod,
          notes: paySuppNotes,
        }),
      });

      if (res.ok) {
        setShowPaySupplierModal(false);
        setPaySuppAmount("");
        setPaySuppNotes("");
        fetchData();
        broadcastSync("purchases");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Payment failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setPaySuppLoading(false);
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseForReturn) return;

    try {
      const res = await fetch("/api/purchases/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: selectedPurchaseForReturn._id,
          returnQuantity: Number(returnQty),
          returnAmount: Number(returnAmount),
          reason: returnReason,
        }),
      });

      if (res.ok) {
        setShowReturnModal(false);
        setSelectedPurchaseForReturn(null);
        fetchData();
        broadcastSync("purchases");
        broadcastSync("products");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to process return");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Group purchases by grain for Multi-Supplier Rate Comparison
  const rateComparisonByGrain = products.map((prod) => {
    const grainPurchases = purchases.filter((p) => p.productId === prod._id);
    // Find unique suppliers and their latest purchase rate
    const supplierRatesMap: { [suppName: string]: { rate: number; date: string; qty: number } } = {};
    grainPurchases.forEach((p) => {
      if (!supplierRatesMap[p.supplierName]) {
        supplierRatesMap[p.supplierName] = { rate: p.rate, date: p.date, qty: p.quantity };
      }
    });

    return {
      grainName: prod.name,
      nameUrdu: prod.nameUrdu,
      unit: prod.unit,
      suppliers: Object.keys(supplierRatesMap).map((s) => ({
        supplierName: s,
        rate: supplierRatesMap[s].rate,
        date: supplierRatesMap[s].date,
        qty: supplierRatesMap[s].qty,
      })),
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#8b5a2b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "خریداری و سپلائرز مینجمنٹ" : "Purchase & Supplier Management"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "زمینداروں و سپلائرز سے اناج کی خریداری، بقایا ادائیگی اور ملٹی سپلائر ریٹ موازنہ"
              : "Record grain arrivals from suppliers, auto-update stock, manage returns & compare rates."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#fdf6e3] hover:bg-[#ebdcc9] text-xs font-bold text-[#8b5a2b] border border-[#d9c4a8] transition-colors"
          >
            + New Supplier Profile
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#8b5a2b] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Purchase / خریداری درج کریں</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#ebdcc9] space-x-4">
        <button
          onClick={() => setActiveTab("entries")}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "entries"
              ? "text-[#8b5a2b] border-b-2 border-[#8b5a2b]"
              : "text-[#7c6853] hover:text-[#2d2115]"
          }`}
        >
          {language === "ur" ? "خریداری اندراج (Entries)" : "Purchase Invoices"} (
          {purchases.length})
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "suppliers"
              ? "text-[#8b5a2b] border-b-2 border-[#8b5a2b]"
              : "text-[#7c6853] hover:text-[#2d2115]"
          }`}
        >
          {language === "ur" ? "سپلائر پروفائلز (Suppliers)" : "Supplier Directory"} (
          {suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === "comparison"
              ? "text-[#8b5a2b] border-b-2 border-[#8b5a2b]"
              : "text-[#7c6853] hover:text-[#2d2115]"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>{language === "ur" ? "ریٹ موازنہ (Rate Comparison)" : "Multi-Supplier Rate Comparison"}</span>
        </button>
      </div>

      {/* TAB 1: PURCHASES LIST */}
      {activeTab === "entries" && (
        <div className="bg-white rounded-2xl border border-[#ebdcc9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fbf7ee] text-[#7c6853] uppercase font-bold border-b border-[#ebdcc9]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Grain Item</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Total (Rs)</th>
                  <th className="py-3 px-4 text-right">Paid (Rs)</th>
                  <th className="py-3 px-4 text-right">Payable (Rs)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebdcc9]">
                {purchases.map((pur) => (
                  <tr key={pur._id} className="hover:bg-[#fdf6e3]/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[#7c6853]">
                      {new Date(pur.date).toLocaleDateString("en-PK")}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2d2115] whitespace-nowrap">
                      {pur.supplierName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#8b5a2b]">{pur.productName}</div>
                      {pur.grade && (
                        <div className="text-[10px] text-[#7c6853]">{pur.grade}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap font-bold">
                      {pur.quantity} {pur.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      Rs {pur.rate.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2d2115] whitespace-nowrap">
                      Rs {pur.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 whitespace-nowrap">
                      Rs {pur.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {pur.dueAmount > 0 ? (
                        <span className="font-bold text-rose-700">
                          Rs {pur.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 text-[10px] font-bold">Clear</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditPurchaseModal(pur)}
                          className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title={language === "ur" ? "ترمیم کریں" : "Edit Purchase"}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{language === "ur" ? "ترمیم" : "Edit"}</span>
                        </button>
                        <button
                          onClick={() => handleDeletePurchase(pur)}
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title={language === "ur" ? "ڈیلیٹ کریں" : "Delete Purchase"}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{language === "ur" ? "ڈیلیٹ" : "Delete"}</span>
                        </button>
                        {pur.returnDetails?.isReturned ? (
                          <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Returned ({pur.returnDetails.returnQuantity} {pur.unit})
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPurchaseForReturn(pur);
                              setReturnQty(String(pur.quantity));
                              setReturnAmount(String(pur.totalAmount));
                              setShowReturnModal(true);
                            }}
                            className="px-2 py-1 rounded bg-[#fdf6e3] hover:bg-[#ebdcc9] text-[11px] font-semibold text-[#8b5a2b] border border-[#d9c4a8] transition-colors"
                          >
                            Return (واپسی)
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supp) => (
            <div
              key={supp._id}
              className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-[#2d2115]">{supp.name}</h3>
                  <span className="text-[10px] font-bold uppercase bg-[#fdf6e3] text-[#8b5a2b] px-2 py-0.5 rounded border border-[#ebdcc9]">
                    Supplier
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#7c6853]">
                  {supp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#8b5a2b]" />
                      <span>{supp.phone}</span>
                    </div>
                  )}
                  {supp.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#8b5a2b]" />
                      <span>{supp.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#fbf7ee] border border-[#ebdcc9]">
                    <div className="text-[10px] text-[#7c6853] uppercase">Paid So Far</div>
                    <div className="font-bold font-mono text-emerald-800 text-sm mt-0.5">
                      Rs {supp.totalPaid.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#fbf7ee] border border-[#ebdcc9]">
                    <div className="text-[10px] text-[#7c6853] uppercase">Still Payable</div>
                    <div className="font-bold font-mono text-rose-700 text-sm mt-0.5">
                      Rs {supp.totalPayable.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#ebdcc9] flex items-center justify-between text-xs">
                <span className="text-[#7c6853] text-[11px]">
                  {purchases.filter((p) => p.supplierId === supp._id).length} purchases
                </span>
                <div className="flex items-center gap-2">
                  {supp.totalPayable > 0 && (
                    <button
                      onClick={() => {
                        setSelectedSupplierForPay(supp);
                        setPaySuppAmount(String(supp.totalPayable));
                        setShowPaySupplierModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors"
                    >
                      Pay Due / بقایا دیں
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSupplierId(supp._id);
                      setShowPurchaseModal(true);
                    }}
                    className="text-xs font-bold text-[#8b5a2b] hover:underline"
                  >
                    + New Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MULTI-SUPPLIER RATE COMPARISON */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="bg-[#fdf6e3] p-4 rounded-xl border border-[#ebdcc9] text-xs text-[#7c6853]">
            <span className="font-bold text-[#8b5a2b]">Rate Intelligence: </span>
            Compare historical procurement rates across multiple suppliers for each grain to negotiate the best price!
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rateComparisonByGrain.map((grain, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-[#ebdcc9] shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#ebdcc9]">
                  <div>
                    <h3 className="font-bold text-sm text-[#2d2115]">{grain.grainName}</h3>
                    {grain.nameUrdu && (
                      <span className="text-xs text-[#8b5a2b]">{grain.nameUrdu}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#7c6853] font-mono">
                    Per {grain.unit}
                  </span>
                </div>

                <div className="mt-3 divide-y divide-[#ebdcc9]">
                  {grain.suppliers.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#7c6853]">
                      No purchase records yet for this grain
                    </div>
                  ) : (
                    grain.suppliers.map((sup, sIdx) => (
                      <div
                        key={sIdx}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#2d2115]">{sup.supplierName}</div>
                          <div className="text-[10px] text-[#7c6853]">
                            Last: {new Date(sup.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-[#8b5a2b] text-sm">
                            Rs {sup.rate.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#7c6853]">
                            Order Qty: {sup.qty} {grain.unit}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Record Purchase */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title={language === "ur" ? "نئی خریداری کا اندراج" : "Record New Grain Purchase"}
        icon={<Truck className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Select Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Select Grain *</label>
              <select
                required
                value={productId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              >
                <option value="">-- Choose Grain Type --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Unit / اکائی</label>
              <select
                value={purchaseUnit}
                onChange={(e) => setPurchaseUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-semibold focus:outline-none"
              >
                <option value="maund">Maund (من - 40 KG)</option>
                <option value="kg">KG (کلوگرام)</option>
                <option value="bag">Bag (بوری)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Rate per {purchaseUnit === "kg" ? "KG" : purchaseUnit === "bag" ? "Bag" : "Maund"} (Rs) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Total Calculation Display */}
          <div className="p-3 bg-[#fdf6e3] rounded-xl border border-[#ebdcc9] flex items-center justify-between">
            <span className="font-bold text-[#7c6853]">Total Bill Amount:</span>
            <span className="text-base font-black font-mono text-[#8b5a2b]">
              Rs {calcTotal.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Amount Paid Now (Rs)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
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
            <label className="block font-bold text-[#2d2115] mb-1">Truck / Vehicle / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Truck # LES-9080, Gate 1"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPurchaseModal(false)}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226] shadow-xs active:scale-95 transition-all"
            >
              Save & Update Stock / اسٹاک شامل کریں
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Purchase Invoice (خریداری میں ترمیم) */}
      <Modal
        isOpen={showEditPurchaseModal && !!selectedPurchaseForEdit}
        onClose={() => setShowEditPurchaseModal(false)}
        title={language === "ur" ? "خریداری میں ترمیم کریں" : "Edit Purchase Invoice / خریداری میں ترمیم"}
        icon={<Edit2 className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="lg"
      >
        {selectedPurchaseForEdit && (
          <form onSubmit={handleUpdatePurchase} className="space-y-3.5 text-xs">
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold">⚠️ Notice / تنبیہ: </span>
              {language === "ur"
                ? "اس خریداری میں ترمیم کرنے سے گودام کا اسٹاک، سپلائر کا بیلنس کھاتہ اور کیش بک کے اخراجات خودکار درست ہو جائیں گے۔"
                : "Editing this purchase will automatically re-calculate and synchronize product stock, supplier payable balance, and cashbook expenses."}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Supplier / سپلائر *</label>
                <select
                  required
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-semibold"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Grain Product / اجناس *</label>
                <select
                  required
                  value={editProductId}
                  onChange={(e) => setEditProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-semibold"
                >
                  <option value="">-- Choose Grain Type --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Unit / اکائی</label>
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-semibold focus:outline-none"
                >
                  <option value="maund">Maund (من - 40 KG)</option>
                  <option value="kg">KG (کلوگرام)</option>
                  <option value="bag">Bag (بوری)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Quantity / مقدار *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Rate per {editUnit === "kg" ? "KG" : editUnit === "bag" ? "Bag" : "Maund"} (Rs) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Total Calculation Display */}
            <div className="p-3 bg-[#fdf6e3] rounded-xl border border-[#ebdcc9] flex items-center justify-between">
              <span className="font-bold text-[#7c6853]">Total Bill Amount / کل بل:</span>
              <span className="text-base font-black font-mono text-[#8b5a2b]">
                Rs {calcEditTotal.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Amount Paid (Rs) / ادا رقم</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Payment Method / ادائیگی ذریعہ</label>
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

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Purchase Date / تاریخ</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
            </div>

            {Number(calcEditTotal) > 0 && (
              <div className="p-2.5 rounded-lg bg-[#fbf7ee] border border-[#ebdcc9] text-[11px] flex justify-between font-bold">
                <span className="text-[#7c6853]">Remaining Due to Supplier (بقایا):</span>
                <span className="text-rose-700 font-mono">
                  Rs {Math.max(0, calcEditTotal - (Number(editPaidAmount) || 0)).toLocaleString()}
                </span>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Truck / Vehicle / Notes</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g. Truck # LES-9080, Gate 1"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (selectedPurchaseForEdit) {
                    handleDeletePurchase(selectedPurchaseForEdit);
                    setShowEditPurchaseModal(false);
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === "ur" ? "ڈیلیٹ کریں" : "Delete"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226] shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editLoading ? "Saving..." : language === "ur" ? "تبدیلیاں محفوظ کریں" : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Create Supplier */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title={language === "ur" ? "نیا سپلائر کھاتہ" : "Create Supplier Profile"}
        icon={<Truck className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Supplier / Trader Name *</label>
            <input
              type="text"
              required
              value={suppName}
              onChange={(e) => setSuppName(e.target.value)}
              placeholder="e.g. Tariq Grain Commission"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Phone Number</label>
            <input
              type="text"
              value={suppPhone}
              onChange={(e) => setSuppPhone(e.target.value)}
              placeholder="0300-XXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Address / Mandi Location</label>
            <input
              type="text"
              value={suppAddress}
              onChange={(e) => setSuppAddress(e.target.value)}
              placeholder="Galla Mandi Gate 2"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">
              Previous Payable Balance (سابقہ بقایا)
            </label>
            <input
              type="number"
              value={suppPayable}
              onChange={(e) => setSuppPayable(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSupplierModal(false)}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226] shadow-xs active:scale-95 transition-all"
            >
              Save Supplier / محفوظ کریں
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Purchase Return */}
      <Modal
        isOpen={showReturnModal && !!selectedPurchaseForReturn}
        onClose={() => setShowReturnModal(false)}
        title={language === "ur" ? "مال واپسی (سپلائر)" : "Return Goods to Supplier / مال واپسی"}
        icon={<RotateCcw className="w-5 h-5 text-rose-700" />}
        maxWidth="md"
      >
        {selectedPurchaseForReturn && (
          <div className="space-y-3.5">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <div className="font-bold text-amber-900">{selectedPurchaseForReturn.productName}</div>
              <div className="text-[#7c6853]">
                Supplier: {selectedPurchaseForReturn.supplierName} • Total Qty:{" "}
                {selectedPurchaseForReturn.quantity} {selectedPurchaseForReturn.unit}
              </div>
            </div>

            <form onSubmit={handleProcessReturn} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Return Quantity ({selectedPurchaseForReturn.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Refund / Deduct Amount (Rs) *
                </label>
                <input
                  type="number"
                  required
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Reason / وجہ</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Damaged bags / high moisture rejected"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-xs active:scale-95 transition-all"
                >
                  Confirm Return & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: Pay Supplier Due (بقایا ادائیگی) */}
      <Modal
        isOpen={showPaySupplierModal && !!selectedSupplierForPay}
        onClose={() => setShowPaySupplierModal(false)}
        title={language === "ur" ? "سپلائر کو ادائیگی" : "Pay Supplier Due / سپلائر کو ادائیگی"}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-800" />}
        maxWidth="md"
      >
        {selectedSupplierForPay && (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-xs text-[#2d2115]">
                <span>{selectedSupplierForPay.name}</span>
                <span className="text-[11px] text-[#7c6853]">{selectedSupplierForPay.phone || ""}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-rose-200/60">
                <span className="text-xs font-semibold text-rose-800">Total Due Payable (کل واجب الادا):</span>
                <span className="text-base font-black font-mono text-rose-700">
                  Rs {selectedSupplierForPay.totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaySupplier} className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-[#2d2115]">Payment Amount (Rs) * / ادا کردہ رقم</label>
                  <button
                    type="button"
                    onClick={() => setPaySuppAmount(String(selectedSupplierForPay.totalPayable))}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition-colors"
                  >
                    Full Due (پورا بقایا)
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedSupplierForPay.totalPayable > 0 ? selectedSupplierForPay.totalPayable : undefined}
                  value={paySuppAmount}
                  onChange={(e) => setPaySuppAmount(e.target.value)}
                  placeholder="Enter amount to pay"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5a2b]/30"
                />
              </div>

              {Number(paySuppAmount) > 0 && (
                <div className="p-2.5 rounded-lg bg-[#fdf6e3] border border-[#ebdcc9] text-[11px] flex justify-between font-bold">
                  <span className="text-[#7c6853]">Remaining Payable After Payment:</span>
                  <span className="text-rose-700 font-mono">
                    Rs {Math.max(0, selectedSupplierForPay.totalPayable - Number(paySuppAmount)).toLocaleString()}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Payment Method / ادائیگی کا ذریعہ</label>
                <select
                  value={paySuppMethod}
                  onChange={(e: any) => setPaySuppMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="cash">Cash (نقد کیش)</option>
                  <option value="bank">Bank Transfer (بینک ٹرانسفر)</option>
                  <option value="cheque">Cheque (چیک)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Notes / تفصیل (Optional)</label>
                <input
                  type="text"
                  value={paySuppNotes}
                  onChange={(e) => setPaySuppNotes(e.target.value)}
                  placeholder="e.g. Paid via Online Bank Transfer / Cheque #541"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPaySupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySuppLoading || !paySuppAmount}
                  className="px-5 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{paySuppLoading ? "Saving..." : "Record Payment / ادائیگی درج کریں"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
