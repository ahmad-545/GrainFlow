"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Printer,
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Search,
  Sparkles,
  Receipt,
  User,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import MandiSlipModal, { SlipData } from "@/components/MandiSlipModal";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";
import Modal from "@/components/Modal";
import { formatWeightPreview } from "@/lib/units";

export default function LocalSalesPage() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [productId, setProductId] = useState("");
  const [saleUnit, setSaleUnit] = useState<"maund" | "kg">("maund");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Edit State & Modal
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editProductId, setEditProductId] = useState("");
  const [editUnit, setEditUnit] = useState<"maund" | "kg">("maund");
  const [editQuantity, setEditQuantity] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editBaqayaAmount, setEditBaqayaAmount] = useState("0");
  const [editPaymentMethod, setEditPaymentMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Print Slip Modal
  const [activeSlip, setActiveSlip] = useState<SlipData | null>(null);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [prodRes, saleRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales?customerType=local"),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (saleRes.ok) setSales(await saleRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live real-time sync when sales, products, cashbook, or customers change anywhere
  useRealTimeSync(["sales", "products", "cashbook", "customers", "baqaya", "all"], () => {
    fetchData(true);
  });

  const handleProductChange = (pId: string) => {
    setProductId(pId);
    const p = products.find((prod) => prod._id === pId);
    if (p && p.todayRate?.rate) {
      if (saleUnit === "kg") {
        const kgRate = p.todayRate.rate / 40;
        setRate(String(Number.isInteger(kgRate) ? kgRate : Number(kgRate.toFixed(2))));
      } else {
        setRate(String(p.todayRate.rate));
      }
    }
  };

  const handleUnitChange = (newUnit: "maund" | "kg") => {
    if (newUnit === saleUnit) return;
    setSaleUnit(newUnit);
    const currentRateNum = Number(rate) || 0;
    if (newUnit === "kg") {
      // Switched from maund to kg -> rate / 40
      if (currentRateNum > 0) {
        const kgRate = currentRateNum / 40;
        setRate(String(Number.isInteger(kgRate) ? kgRate : Number(kgRate.toFixed(2))));
      }
    } else {
      // Switched from kg to maund -> rate * 40
      if (currentRateNum > 0) {
        setRate(String(Math.round(currentRateNum * 40)));
      }
    }
  };

  // Live calculations
  const selectedProduct = products.find((p) => p._id === productId);
  const qtyNum = Number(quantity) || 0;
  const rateNum = Number(rate) || 0;
  const discPerUnit = Number(discount) || 0;

  const totalAmount = qtyNum * rateNum;
  const discountTotal = qtyNum * discPerUnit;
  const netAmount = Math.max(0, totalAmount - discountTotal);
  const paidNum = paidAmount === "" ? netAmount : Number(paidAmount) || 0;
  const dueAmount = Math.max(0, netAmount - paidNum);

  const handleSubmit = async (e: React.FormEvent, shouldPrint = false) => {
    e.preventDefault();
    if (!productId || qtyNum <= 0) {
      alert("Please select a grain and valid quantity");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerType: "local",
          customerName: customerName || "Walk-in Customer",
          customerPhone,
          customerAddress,
          items: [
            {
              productId,
              productName: selectedProduct?.name || "Grain",
              quantity: qtyNum,
              unit: saleUnit,
              rate: rateNum,
              discount: discPerUnit,
              total: netAmount,
            },
          ],
          paidAmount: paidNum,
          paymentMethod,
          date: saleDate,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessToast(
          `Sale #${data.invoiceNumber} recorded! Stock automatically deducted.`
        );
        setTimeout(() => setSuccessToast(null), 5000);

        if (shouldPrint) {
          // Show printable Mandi Slip immediately!
          setActiveSlip({
            invoiceNumber: data.invoiceNumber,
            date: data.date,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerAddress: data.customerAddress,
            customerType: "local",
            items: data.items,
            totalAmount: data.totalAmount,
            discountAmount: data.discountAmount,
            netAmount: data.netAmount,
            paidAmount: data.paidAmount,
            dueAmount: data.dueAmount,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
          });
        }

        // Reset form
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        setPaidAmount("");
        fetchData();

        // Broadcast to all tabs & components
        broadcastSync("sales");
        broadcastSync("products");
        broadcastSync("cashbook");
        broadcastSync("customers");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        alert(data.error || "Sale failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEditNet = (qtyStr: string, rateStr: string, discStr: string) => {
    const q = Number(qtyStr) || 0;
    const r = Number(rateStr) || 0;
    const d = Number(discStr) || 0;
    return Math.max(0, q * r - q * d);
  };

  const handleEditPaidChange = (newPaid: string) => {
    setEditPaidAmount(newPaid);
    const net = calculateEditNet(editQuantity, editRate, editDiscount);
    const p = newPaid === "" ? 0 : Number(newPaid) || 0;
    setEditBaqayaAmount(String(Math.max(0, net - p)));
  };

  const handleEditBaqayaChange = (newBaqaya: string) => {
    setEditBaqayaAmount(newBaqaya);
    const net = calculateEditNet(editQuantity, editRate, editDiscount);
    const b = newBaqaya === "" ? 0 : Number(newBaqaya) || 0;
    setEditPaidAmount(String(Math.max(0, net - b)));
  };

  const setEditFullCash = () => {
    const net = calculateEditNet(editQuantity, editRate, editDiscount);
    setEditPaidAmount(String(net));
    setEditBaqayaAmount("0");
  };

  const setEditFullBaqaya = () => {
    const net = calculateEditNet(editQuantity, editRate, editDiscount);
    setEditPaidAmount("0");
    setEditBaqayaAmount(String(net));
  };

  const setEditHalfCash = () => {
    const net = calculateEditNet(editQuantity, editRate, editDiscount);
    const half = Math.round(net / 2);
    setEditPaidAmount(String(half));
    setEditBaqayaAmount(String(net - half));
  };

  const handleEditQtyChange = (val: string) => {
    setEditQuantity(val);
    const net = calculateEditNet(val, editRate, editDiscount);
    const p = editPaidAmount === "" ? 0 : Number(editPaidAmount) || 0;
    setEditBaqayaAmount(String(Math.max(0, net - p)));
  };

  const handleEditRateChange = (val: string) => {
    setEditRate(val);
    const net = calculateEditNet(editQuantity, val, editDiscount);
    const p = editPaidAmount === "" ? 0 : Number(editPaidAmount) || 0;
    setEditBaqayaAmount(String(Math.max(0, net - p)));
  };

  const handleEditDiscountChange = (val: string) => {
    setEditDiscount(val);
    const net = calculateEditNet(editQuantity, editRate, val);
    const p = editPaidAmount === "" ? 0 : Number(editPaidAmount) || 0;
    setEditBaqayaAmount(String(Math.max(0, net - p)));
  };

  const openEditModal = (sale: any) => {
    setSelectedSaleForEdit(sale);
    setEditCustomerName(sale.customerName || "");
    setEditCustomerPhone(sale.customerPhone || "");
    const firstItem = sale.items && sale.items[0];
    setEditProductId(firstItem?.productId ? String(firstItem.productId) : "");
    setEditUnit(firstItem?.unit === "kg" ? "kg" : "maund");
    setEditQuantity(firstItem ? String(firstItem.quantity) : "1");
    setEditRate(firstItem ? String(firstItem.rate) : "0");
    setEditDiscount(firstItem ? String(firstItem.discount || 0) : "0");
    setEditPaidAmount(String(sale.paidAmount ?? 0));
    setEditBaqayaAmount(String(sale.dueAmount ?? 0));
    setEditPaymentMethod(sale.paymentMethod || "cash");
    setEditNotes(sale.notes || "");
    setShowEditModal(true);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForEdit || !editProductId) return;

    const editProd = products.find((p) => p._id === editProductId);
    const q = Number(editQuantity) || 0;
    const r = Number(editRate) || 0;
    const d = Number(editDiscount) || 0;
    const subtotal = q * r;
    const discTotal = q * d;
    const net = Math.max(0, subtotal - discTotal);
    const paid = editPaidAmount === "" ? net : Number(editPaidAmount) || 0;

    if (q <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      setEditLoading(true);
      const res = await fetch(`/api/sales/${selectedSaleForEdit._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editCustomerName || "Walk-in Customer",
          customerPhone: editCustomerPhone,
          items: [
            {
              productId: editProductId,
              productName: editProd?.name || "Grain",
              quantity: q,
              unit: editUnit,
              rate: r,
              discount: d,
              total: net,
            },
          ],
          paidAmount: paid,
          paymentMethod: editPaymentMethod,
          notes: editNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setSelectedSaleForEdit(null);
        setSuccessToast(`Sale #${data.invoiceNumber} updated! Stock & Baqaya automatically adjusted.`);
        setTimeout(() => setSuccessToast(null), 5000);
        fetchData();

        // Broadcast live updates across all modules
        broadcastSync("sales");
        broadcastSync("products");
        broadcastSync("cashbook");
        broadcastSync("customers");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        alert(data.error || "Failed to update sale");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSale = async (sale: any) => {
    if (
      !confirm(
        `Are you sure you want to delete Sale #${sale.invoiceNumber} (${sale.customerName})?\n\nSold grain quantity will be automatically returned to your inventory stock!`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/sales/${sale._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessToast(`Sale #${sale.invoiceNumber} deleted and stock restored to inventory.`);
        setTimeout(() => setSuccessToast(null), 5000);
        fetchData();

        // Broadcast live updates across all modules
        broadcastSync("sales");
        broadcastSync("products");
        broadcastSync("cashbook");
        broadcastSync("customers");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        alert(data.error || "Failed to delete sale");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
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
            <ShoppingCart className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "عام گاہک (نقد فروخت پرچہ)" : "Local Customer (Walk-in Sales)"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "فوری واک اِن گاہک اندراج، خودکار ریٹ، رعایت اور منڈی پرچہ (Slip) پرنٹنگ"
              : "Quick spot sale checkout, custom discounts, instant thermal & A4 Mandi receipt printing."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7c6853]">Auto-Inventory Sync:</span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Active ✓
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Walk-in Sale Entry Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ebdcc9]">
            <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#b8860b]" />
              <span>{language === "ur" ? "پرچہ فروخت کی تفصیلات" : "New Sale Entry Form"}</span>
            </h3>
            <span className="text-xs text-[#7c6853]">Step 1: Fill &gt; Step 2: Print</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Customer Details */}
            <div className="p-3.5 rounded-xl bg-[#fbf7ee] border border-[#ebdcc9] space-y-3">
              <div className="font-bold text-xs text-[#8b5a2b] uppercase tracking-wider">
                Customer Information (گاہک کی تفصیل)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">
                    Customer Name / نام گاہک *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Haji Saleem / Cash Buyer"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">Phone / فون نمبر</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0300-XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">Date / تاریخ فروخت</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Grain Item Selection */}
            <div className="p-3.5 rounded-xl bg-[#fbf7ee] border border-[#ebdcc9] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-xs text-[#8b5a2b] uppercase tracking-wider">
                  Grain & Rate Specification (اناج و بھاؤ)
                </div>

                {/* Unit Selector Toggle: Maund (من) vs KG (کلو) */}
                <div className="flex items-center gap-1 bg-[#f0e4d2] p-1 rounded-xl text-xs font-bold border border-[#ebdcc9] shadow-2xs self-start sm:self-auto">
                  <span className="text-[10px] text-[#7c6853] px-1 font-semibold">یونٹ:</span>
                  <button
                    type="button"
                    onClick={() => handleUnitChange("maund")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      saleUnit === "maund"
                        ? "bg-[#8b5a2b] text-white shadow-xs"
                        : "text-[#7c6853] hover:text-[#2d2115]"
                    }`}
                  >
                    من (Maund - 40kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitChange("kg")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      saleUnit === "kg"
                        ? "bg-[#2f5233] text-white shadow-xs"
                        : "text-[#7c6853] hover:text-[#2d2115]"
                    }`}
                  >
                    کلو (KG)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">
                    Select Grain Type (جنس) *
                  </label>
                  <select
                    required
                    value={productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none font-medium"
                  >
                    <option value="">-- Choose Grain --</option>
                    {products.map((p) => {
                      const stockInKg = (p.unit === "maund" ? p.currentStock * 40 : p.currentStock).toLocaleString();
                      return (
                        <option key={p._id} value={p._id}>
                          {p.name} (Stock: {p.currentStock} {p.unit} / {stockInKg} kg)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-[#2d2115]">
                      {saleUnit === "kg" ? "Quantity in KG (وزن کلو میں) *" : "Quantity in Maund (مقدار من میں) *"}
                    </label>
                    {qtyNum > 0 && (
                      <span className="text-[10px] font-bold text-[#8b5a2b] bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200">
                        {formatWeightPreview(qtyNum, saleUnit)}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={saleUnit === "kg" ? "e.g. 10, 20, 50 kg" : "e.g. 1, 2.5, 5 maund"}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">
                    {saleUnit === "kg" ? "Rate per KG (فی کلو ریٹ Rs) *" : "Rate per Maund (فی من ریٹ Rs) *"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder={saleUnit === "kg" ? "Rs per kg" : "Rs per maund"}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none font-mono"
                  />
                  {selectedProduct?.todayRate && (
                    <div className="text-[10px] text-[#7c6853] mt-1 flex items-center gap-1">
                      <span>Mandi Rate:</span>
                      <span className="font-bold text-[#8b5a2b]">
                        Rs {selectedProduct.todayRate.rate}/maund (Rs {(selectedProduct.todayRate.rate / 40).toFixed(1)}/kg)
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">
                    {saleUnit === "kg" ? "Custom Discount per KG (Rs)" : "Custom Discount per Maund (Rs)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder={saleUnit === "kg" ? "e.g. 2" : "e.g. 20"}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Cash Paid Now (نقد وصول)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={`Full: Rs ${netAmount.toLocaleString()}`}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="cash">Cash in Hand (نقد)</option>
                  <option value="bank">Bank Transfer (آن لائن / بینک)</option>
                  <option value="cheque">Cheque (چیک)</option>
                </select>
              </div>
            </div>

            {/* Live Calculation Bill Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#fdf6e3] to-[#f4ebd9] border border-[#ebdcc9] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#7c6853]">
                <span>Gross Total:</span>
                <span className="font-mono">Rs {totalAmount.toLocaleString()}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Total Discount:</span>
                  <span className="font-mono">- Rs {discountTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#2d2115] pt-1 border-t border-[#ebdcc9]">
                <span>Net Payable (خالص رقم):</span>
                <span className="font-mono text-[#8b5a2b]">Rs {netAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-800 font-semibold">
                <span>Amount Paid (نقد وصول):</span>
                <span className="font-mono text-emerald-800">Rs {paidNum.toLocaleString()}</span>
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold bg-rose-100/70 p-1.5 rounded-lg border border-rose-200">
                  <span>Balance Due / Udhaar (بقایا):</span>
                  <span className="font-mono font-black">Rs {dueAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Dual Action Buttons: Save Only vs Save & Print */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, false)}
                className="w-full py-3 rounded-xl bg-[#8b5a2b] hover:bg-[#724820] text-white font-bold text-xs tracking-wide active:scale-[0.99] transition-all shadow-md shadow-amber-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "Saving..." : "Save Only / صرف محفوظ کریں"}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2f5233] to-[#1e3621] text-white font-bold text-xs tracking-wide hover:brightness-105 active:scale-[0.99] transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{isSubmitting ? "Saving..." : "Save & Print Mandi Slip / محفوظ اور پرچہ"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Recent Walk-in Slips & Fast Reprint */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ebdcc9]">
              <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#8b5a2b]" />
                <span>Recent Walk-in Slips ({sales.length})</span>
              </h3>
            </div>

            <div className="divide-y divide-[#ebdcc9] max-h-[500px] overflow-y-auto space-y-1">
              {sales.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7c6853]">
                  No walk-in sales yet. Issue your first slip above!
                </div>
              ) : (
                sales.map((s) => (
                  <div key={s._id} className="py-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-[#2d2115]">{s.customerName}</div>
                        <div className="text-[10px] text-[#7c6853]">
                          #{s.invoiceNumber} • {new Date(s.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-mono font-bold text-[#2d2115]">
                          Rs {s.netAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-medium">
                          Paid: Rs {s.paidAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px]">
                          {s.dueAmount > 0 ? (
                            <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Due (بقایا): Rs {s.dueAmount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">مکمل ادا شدہ</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-1 pt-1.5 border-t border-[#ebdcc9]/50">
                      <span className="text-[11px] text-[#7c6853] truncate max-w-[130px]">
                        {s.items?.map((it: any) => `${it.quantity} ${it.unit} ${it.productName}`).join(", ")}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit Sale / درست کریں"
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[10px] font-bold text-blue-700 border border-blue-200 flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSale(s)}
                          title="Delete Sale / ختم کریں"
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveSlip({
                              invoiceNumber: s.invoiceNumber,
                              date: s.date,
                              customerName: s.customerName,
                              customerPhone: s.customerPhone,
                              customerAddress: s.customerAddress,
                              customerType: "local",
                              items: s.items,
                              totalAmount: s.totalAmount,
                              discountAmount: s.discountAmount,
                              netAmount: s.netAmount,
                              paidAmount: s.paidAmount,
                              dueAmount: s.dueAmount,
                              paymentMethod: s.paymentMethod,
                              notes: s.notes,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-[#fdf6e3] hover:bg-[#ebdcc9] text-[10px] font-bold text-[#8b5a2b] border border-[#d9c4a8] flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-2.5 h-2.5" />
                          <span>Slip</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Edit Walk-in Sale */}
      <Modal
        isOpen={showEditModal && !!selectedSaleForEdit}
        onClose={() => setShowEditModal(false)}
        title={selectedSaleForEdit ? `Edit Sale #${selectedSaleForEdit.invoiceNumber} / پرچہ میں ترمیم` : "Edit Sale"}
        icon={<Edit2 className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="lg"
      >
        {selectedSaleForEdit && (
          <form onSubmit={handleUpdateSale} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#2d2115]">Grain Product *</label>
                <div className="flex items-center gap-1 bg-[#f0e4d2] p-0.5 rounded-lg text-xs font-bold">
                  <span className="text-[10px] text-[#7c6853] px-1">یونٹ:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (editUnit === "kg") {
                        setEditUnit("maund");
                        const curRate = Number(editRate) || 0;
                        if (curRate > 0) setEditRate(String(Math.round(curRate * 40)));
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      editUnit === "maund" ? "bg-[#8b5a2b] text-white" : "text-[#7c6853]"
                    }`}
                  >
                    من (Maund)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editUnit === "maund") {
                        setEditUnit("kg");
                        const curRate = Number(editRate) || 0;
                        if (curRate > 0) {
                          const r = curRate / 40;
                          setEditRate(String(Number.isInteger(r) ? r : Number(r.toFixed(2))));
                        }
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      editUnit === "kg" ? "bg-[#2f5233] text-white" : "text-[#7c6853]"
                    }`}
                  >
                    کلو (KG)
                  </button>
                </div>
              </div>
              <select
                required
                value={editProductId}
                onChange={(e) => setEditProductId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (Stock: {p.currentStock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Qty ({editUnit === "kg" ? "KG" : "Maund"}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editQuantity}
                  onChange={(e) => handleEditQtyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Rate / {editUnit === "kg" ? "KG" : "Maund"} *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editRate}
                  onChange={(e) => handleEditRateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Disc / {editUnit === "kg" ? "KG" : "Maund"}
                </label>
                <input
                  type="number"
                  step="any"
                  value={editDiscount}
                  onChange={(e) => handleEditDiscountChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Net Bill & Quick Actions */}
            {(() => {
              const net = calculateEditNet(editQuantity, editRate, editDiscount);
              return (
                <div className="p-3 bg-[#fdf6e3] rounded-xl border border-[#ebdcc9] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#7c6853]">خالص بل (Net Total):</span>
                    <span className="font-mono font-black text-sm text-[#2d2115]">
                      Rs {net.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={setEditFullCash}
                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs"
                    >
                      مکمل نقد (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={setEditFullBaqaya}
                      className="flex-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all shadow-xs"
                    >
                      مکمل بقایا (Baqaya)
                    </button>
                    <button
                      type="button"
                      onClick={setEditHalfCash}
                      className="py-1 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all shadow-xs"
                    >
                      50% آدھا
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Two-Way Paid vs Baqaya Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-emerald-900 mb-1">
                  نقد وصول شدہ (Paid Now Rs)
                </label>
                <input
                  type="number"
                  value={editPaidAmount}
                  onChange={(e) => handleEditPaidChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 text-emerald-900 font-mono font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-rose-800 mb-1">
                  بقایا رقم (Baqaya / Due Rs) *
                </label>
                <input
                  type="number"
                  value={editBaqayaAmount}
                  onChange={(e) => handleEditBaqayaChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/50 text-rose-900 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Payment Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e: any) => setEditPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="cash">Cash (نقد)</option>
                  <option value="bank">Bank Transfer (بینک)</option>
                  <option value="cheque">Cheque (چیک)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes or vehicle #"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
            </div>

            {/* Live Status Pill */}
            {(() => {
              const net = calculateEditNet(editQuantity, editRate, editDiscount);
              const p = editPaidAmount === "" ? net : Number(editPaidAmount) || 0;
              const b = Math.max(0, net - p);

              return (
                <div className="p-2.5 bg-[#fbf7ee] rounded-xl border border-[#ebdcc9] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#7c6853]">
                    خالص بل: <span className="font-mono text-[#8b5a2b]">Rs {net.toLocaleString()}</span>
                  </span>
                  <span className="text-emerald-800">
                    نقد ادا: <span className="font-mono">Rs {p.toLocaleString()}</span>
                  </span>
                  <span className={b > 0 ? "text-rose-700 font-black" : "text-emerald-700"}>
                    بقایا: <span className="font-mono">Rs {b.toLocaleString()}</span>
                  </span>
                </div>
              );
            })()}

            <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editLoading ? "Updating..." : "Update Sale & Adjust Stock"}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Slip Print Modal */}
      <MandiSlipModal slip={activeSlip} onClose={() => setActiveSlip(null)} />
    </div>
  );
}
