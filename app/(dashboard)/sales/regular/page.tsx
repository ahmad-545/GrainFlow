"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Award,
  Phone,
  MapPin,
  Clock,
  RotateCcw,
  Wallet,
  ArrowRight,
  Printer,
  X,
  CreditCard,
  CheckCircle2,
  Save,
  Edit2,
  Trash2,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import MandiSlipModal, { SlipData } from "@/components/MandiSlipModal";
import { broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";
import Modal from "@/components/Modal";
import { formatWeightPreview } from "@/lib/units";

export default function RegularCustomersPage() {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selected customer for detail/ledger view
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPayBaqayaModal, setShowPayBaqayaModal] = useState(false);
  const [baqayaAmount, setBaqayaAmount] = useState("");
  const [baqayaMethod, setBaqayaMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [baqayaNotes, setBaqayaNotes] = useState("");
  const [baqayaLoading, setBaqayaLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeSlip, setActiveSlip] = useState<SlipData | null>(null);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<any>(null);

  // Edit Regular Sale State
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<any>(null);
  const [editProductId, setEditProductId] = useState("");
  const [editOrderUnit, setEditOrderUnit] = useState<"maund" | "kg">("maund");
  const [editQuantity, setEditQuantity] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editBaqayaAmount, setEditBaqayaAmount] = useState("0");
  const [editPaymentMethod, setEditPaymentMethod] = useState<"cash" | "bank" | "cheque" | "advance">("cash");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Edit Customer Modal State
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustName, setEditCustName] = useState("");
  const [editCustPhone, setEditCustPhone] = useState("");
  const [editCustAddress, setEditCustAddress] = useState("");
  const [editCustRanking, setEditCustRanking] = useState<"Bronze" | "Silver" | "Gold" | "VIP">("Silver");
  const [editCustDiscountRate, setEditCustDiscountRate] = useState("0");
  const [editCustTotalPending, setEditCustTotalPending] = useState("0");
  const [editCustAdvanceBalance, setEditCustAdvanceBalance] = useState("0");
  const [editCustNotes, setEditCustNotes] = useState("");
  const [editCustLoading, setEditCustLoading] = useState(false);

  // Add Customer Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [discountRate, setDiscountRate] = useState("20");
  const [initialPending, setInitialPending] = useState("0");
  const [ranking, setRanking] = useState<"Bronze" | "Silver" | "Gold" | "VIP">("Silver");

  // Regular Order Form
  const [productId, setProductId] = useState("");
  const [orderUnit, setOrderUnit] = useState<"maund" | "kg">("maund");
  const [quantity, setQuantity] = useState("20");
  const [rate, setRate] = useState("3950");
  const [customDiscount, setCustomDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "cheque" | "advance">("cash");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advance Payment Form
  const [advanceAmount, setAdvanceAmount] = useState("");

  // Return Form
  const [returnQty, setReturnQty] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const fetchCustomers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [custRes, prodRes] = await Promise.all([
        fetch("/api/customers?isRegular=true"),
        fetch("/api/products"),
      ]);

      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data);
        if (data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(data[0]._id);
        }
      }
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchDetail = async (silent = false) => {
    if (!selectedCustomerId) return;
    try {
      if (!silent) setDetailLoading(true);
      const res = await fetch(`/api/customers/${selectedCustomerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch individual customer detail with ledger whenever selectedCustomerId changes
  useEffect(() => {
    fetchDetail();
  }, [selectedCustomerId]);

  // Live real-time sync across tabs and actions
  useRealTimeSync(["sales", "customers", "products", "cashbook", "baqaya", "all"], () => {
    fetchCustomers(true);
    fetchDetail(true);
  });

  const handleProductSelect = (pId: string) => {
    setProductId(pId);
    const p = products.find((prod) => prod._id === pId);
    if (p && p.todayRate?.rate) {
      if (orderUnit === "kg") {
        const kgRate = p.todayRate.rate / 40;
        setRate(String(Number.isInteger(kgRate) ? kgRate : Number(kgRate.toFixed(2))));
      } else {
        setRate(String(p.todayRate.rate));
      }
    }
  };

  const handleOrderUnitChange = (newUnit: "maund" | "kg") => {
    if (newUnit === orderUnit) return;
    setOrderUnit(newUnit);
    const currentRateNum = Number(rate) || 0;
    if (newUnit === "kg") {
      if (currentRateNum > 0) {
        const kgRate = currentRateNum / 40;
        setRate(String(Number.isInteger(kgRate) ? kgRate : Number(kgRate.toFixed(2))));
      }
    } else {
      if (currentRateNum > 0) {
        setRate(String(Math.round(currentRateNum * 40)));
      }
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          address,
          discountRate: Number(discountRate),
          initialPending: Number(initialPending),
          ranking,
        }),
      });

      if (res.ok) {
        setShowAddCustomerModal(false);
        setName("");
        setPhone("");
        fetchCustomers();
        broadcastSync("customers");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegularOrder = async (e: React.FormEvent, shouldPrintSlip = false) => {
    e.preventDefault();
    if (!customerDetail?.customer || !productId) {
      alert("Please select a grain product");
      return;
    }

    const prod = products.find((p) => p._id === productId);
    const q = Number(quantity) || 0;
    const r = Number(rate) || 0;
    const disc = Number(customDiscount) || 0;
    const subtotal = q * r;
    const discAmount = q * disc;
    const net = Math.max(0, subtotal - discAmount);
    const paid = paidAmount === "" ? net : Number(paidAmount) || 0;

    if (q <= 0) {
      alert("Please enter a valid quantity greater than zero");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerType: "regular",
          customerId: customerDetail.customer._id,
          customerName: customerDetail.customer.name,
          customerPhone: customerDetail.customer.phone,
          customerAddress: customerDetail.customer.address,
          items: [
            {
              productId,
              productName: prod?.name || "Grain",
              quantity: q,
              unit: orderUnit,
              rate: r,
              discount: disc,
              total: net,
            },
          ],
          paidAmount: paid,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowOrderModal(false);
        setSuccessToast(
          `Sale #${data.invoiceNumber} recorded! Stock automatically deducted & customer ledger updated.`
        );
        setTimeout(() => setSuccessToast(null), 5000);

        if (shouldPrintSlip) {
          setActiveSlip({
            invoiceNumber: data.invoiceNumber,
            date: data.date,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerAddress: data.customerAddress,
            customerType: "regular",
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

        // 1. Immediately refresh products to reflect automatic stock deduction!
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) setProducts(await prodRes.json());

        // 2. Immediately refresh customer profile with latest recent order & balances!
        const dRes = await fetch(`/api/customers/${selectedCustomerId}`);
        if (dRes.ok) setCustomerDetail(await dRes.json());

        // 3. Refresh regular customers directory (left sidebar list)
        fetchCustomers();

        // Broadcast to all tabs & screens
        broadcastSync("sales");
        broadcastSync("products");
        broadcastSync("customers");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        alert(data.error || "Order failed");
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

  const openEditSaleModal = (sale: any) => {
    setSelectedSaleForEdit(sale);
    const firstItem = sale.items && sale.items[0];
    setEditProductId(firstItem?.productId ? String(firstItem.productId) : "");
    setEditOrderUnit(firstItem?.unit === "kg" ? "kg" : "maund");
    setEditQuantity(firstItem ? String(firstItem.quantity) : "1");
    setEditRate(firstItem ? String(firstItem.rate) : "0");
    setEditDiscount(firstItem ? String(firstItem.discount || 0) : "0");
    setEditPaidAmount(String(sale.paidAmount ?? 0));
    setEditBaqayaAmount(String(sale.dueAmount ?? 0));
    setEditPaymentMethod(sale.paymentMethod || "cash");
    setEditNotes(sale.notes || "");
    setShowEditSaleModal(true);
  };

  const handleUpdateRegularSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForEdit || !editProductId || !customerDetail?.customer) return;

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
          customerName: customerDetail.customer.name,
          customerPhone: customerDetail.customer.phone,
          customerAddress: customerDetail.customer.address,
          customerId: customerDetail.customer._id,
          items: [
            {
              productId: editProductId,
              productName: editProd?.name || "Grain",
              quantity: q,
              unit: editOrderUnit,
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
        setShowEditSaleModal(false);
        setSelectedSaleForEdit(null);
        setSuccessToast(`Sale #${data.invoiceNumber} updated! Stock & customer balance recalculated.`);
        setTimeout(() => setSuccessToast(null), 5000);

        // Refresh products and customer detail
        const [prodRes, dRes] = await Promise.all([
          fetch("/api/products"),
          fetch(`/api/customers/${selectedCustomerId}`),
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (dRes.ok) setCustomerDetail(await dRes.json());
        fetchCustomers(true);

        // Broadcast to all tabs & screens
        broadcastSync("sales");
        broadcastSync("products");
        broadcastSync("customers");
        broadcastSync("cashbook");
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

  const handleDeleteRegularSale = async (sale: any) => {
    if (
      !confirm(
        `Are you sure you want to delete Sale #${sale.invoiceNumber}?\n\nSold grain quantity will be automatically restored to your stock, and this order's due balance will be removed from ${customerDetail.customer.name}'s account!`
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
        setSuccessToast(`Sale #${sale.invoiceNumber} deleted! Stock restored and customer balance updated.`);
        setTimeout(() => setSuccessToast(null), 5000);

        const [prodRes, dRes] = await Promise.all([
          fetch("/api/products"),
          fetch(`/api/customers/${selectedCustomerId}`),
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (dRes.ok) setCustomerDetail(await dRes.json());
        fetchCustomers(true);

        // Broadcast to all tabs & screens
        broadcastSync("sales");
        broadcastSync("products");
        broadcastSync("customers");
        broadcastSync("cashbook");
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

  // Open Edit Customer Modal
  const openEditCustomerModal = () => {
    if (!customerDetail?.customer) return;
    const c = customerDetail.customer;
    setEditCustName(c.name || "");
    setEditCustPhone(c.phone || "");
    setEditCustAddress(c.address || "");
    setEditCustRanking(c.ranking || "Silver");
    setEditCustDiscountRate(String(c.discountRate ?? 0));
    setEditCustTotalPending(String(c.totalPending ?? 0));
    setEditCustAdvanceBalance(String(c.advanceBalance ?? 0));
    setEditCustNotes(c.notes || "");
    setShowEditCustomerModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerDetail?.customer) return;

    try {
      setEditCustLoading(true);
      const res = await fetch(`/api/customers/${customerDetail.customer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCustName,
          phone: editCustPhone,
          address: editCustAddress,
          ranking: editCustRanking,
          discountRate: Number(editCustDiscountRate) || 0,
          totalPending: Number(editCustTotalPending) || 0,
          advanceBalance: Number(editCustAdvanceBalance) || 0,
          notes: editCustNotes,
        }),
      });

      if (res.ok) {
        setShowEditCustomerModal(false);
        setSuccessToast(`Customer ${editCustName} profile & Baqaya updated!`);
        setTimeout(() => setSuccessToast(null), 5000);

        const [custRes, dRes] = await Promise.all([
          fetch("/api/customers?isRegular=true"),
          fetch(`/api/customers/${customerDetail.customer._id}`),
        ]);
        if (custRes.ok) setCustomers(await custRes.json());
        if (dRes.ok) setCustomerDetail(await dRes.json());

        broadcastSync("customers");
        broadcastSync("sales");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update customer");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    } finally {
      setEditCustLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerDetail?.customer) return;
    const c = customerDetail.customer;

    const warningText =
      c.totalPending > 0
        ? `\n\nWARNING: This customer has an outstanding balance (واجب الادا بقایا) of Rs ${c.totalPending.toLocaleString()}!`
        : "";

    if (
      !confirm(
        `Are you sure you want to delete customer "${c.name}"?${warningText}\n\nPast sales records will be safely preserved as spot sales.`
      )
    ) {
      return;
    }

    try {
      setDetailLoading(true);
      const res = await fetch(`/api/customers/${c._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditCustomerModal(false);
        setSuccessToast(`Customer "${c.name}" deleted successfully.`);
        setTimeout(() => setSuccessToast(null), 5000);
        setSelectedCustomerId(null);
        setCustomerDetail(null);
        await fetchCustomers();
        broadcastSync("customers");
        broadcastSync("sales");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        alert(data.error || "Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerDetail?.customer || !advanceAmount) return;

    try {
      const curAdvance = customerDetail.customer.advanceBalance || 0;
      const newAdvance = curAdvance + Number(advanceAmount);

      const res = await fetch(`/api/customers/${customerDetail.customer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customerDetail.customer,
          advanceBalance: newAdvance,
        }),
      });

      if (res.ok) {
        // Also log as CashBook income!
        await fetch("/api/cashbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "income",
            category: "sale_payment",
            amount: Number(advanceAmount),
            paymentMethod: "cash",
            description: `Advance Payment Booking from ${customerDetail.customer.name}`,
            referenceId: customerDetail.customer._id,
          }),
        });

        setShowAdvanceModal(false);
        setAdvanceAmount("");
        // Refresh
        const dRes = await fetch(`/api/customers/${selectedCustomerId}`);
        if (dRes.ok) setCustomerDetail(await dRes.json());
        broadcastSync("customers");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceiveBaqaya = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerDetail?.customer || !baqayaAmount) return;

    try {
      setBaqayaLoading(true);
      const res = await fetch(`/api/customers/${customerDetail.customer._id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(baqayaAmount),
          paymentMethod: baqayaMethod,
          notes: baqayaNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowPayBaqayaModal(false);
        const paidNum = Number(baqayaAmount);
        setBaqayaAmount("");
        setBaqayaNotes("");
        setSuccessToast(
          `Baqaya payment of Rs ${paidNum.toLocaleString()} received from ${customerDetail.customer.name}! Account updated.`
        );
        setTimeout(() => setSuccessToast(null), 5000);

        // Refresh customer detail and customer list
        const dRes = await fetch(`/api/customers/${selectedCustomerId}`);
        if (dRes.ok) setCustomerDetail(await dRes.json());
        fetchCustomers();

        broadcastSync("customers");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to server");
    } finally {
      setBaqayaLoading(false);
    }
  };

  const handleProcessSaleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForReturn) return;

    try {
      const res = await fetch("/api/sales/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: selectedSaleForReturn._id,
          returnQuantity: Number(returnQty),
          returnAmount: Number(returnAmount),
          reason: returnReason,
          refundCash: false,
        }),
      });

      if (res.ok) {
        setShowReturnModal(false);
        setSelectedSaleForReturn(null);
        // Refresh
        const dRes = await fetch(`/api/customers/${selectedCustomerId}`);
        if (dRes.ok) setCustomerDetail(await dRes.json());
        fetchCustomers();

        broadcastSync("sales");
        broadcastSync("products");
        broadcastSync("customers");
        broadcastSync("cashbook");
        broadcastSync("baqaya");
        broadcastSync("all");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to process sale return");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case "VIP":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Gold":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Silver":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#8b5a2b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "کھاتہ دار و مستقل گاہک" : "Regular Customer Accounts & Ledgers"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "مستقل گاہکوں کا کھاتہ، ادھار (Credit)، بیعانہ (Advance) اور مکمل تاریخ وار تفصیل"
              : "Profiles, purchase history, udhaar tracking, loyalty tiers (VIP/Gold), and advance bookings."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#8b5a2b] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === "ur" ? "+ نیا کھاتہ کھولیں" : "+ New Customer Profile"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Customer List, Right Customer Profile & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-[#ebdcc9] shadow-xs">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#8b5a2b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search regular customer..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div className="divide-y divide-[#ebdcc9] max-h-[600px] overflow-y-auto">
              {filteredCustomers.map((cust) => {
                const isSelected = cust._id === selectedCustomerId;
                return (
                  <div
                    key={cust._id}
                    onClick={() => setSelectedCustomerId(cust._id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#fdf6e3] border-l-4 border-[#8b5a2b] shadow-xs"
                        : "hover:bg-[#fbf7ee]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-[#2d2115] flex items-center gap-1.5">
                          <span>{cust.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRankBadge(
                              cust.ranking
                            )}`}
                          >
                            {cust.ranking}
                          </span>
                        </div>
                        {cust.phone && (
                          <div className="text-[10px] text-[#7c6853] mt-0.5">{cust.phone}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-bold font-mono text-rose-700">
                          {cust.totalPending > 0
                            ? `Rs ${cust.totalPending.toLocaleString()}`
                            : "No Due"}
                        </div>
                        <div className="text-[9px] text-[#7c6853]">Udhaar / بقایا</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Customer Profile & Ledger (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {detailLoading ? (
            <div className="p-12 text-center text-xs text-[#7c6853] bg-white rounded-2xl border border-[#ebdcc9]">
              Loading customer ledger...
            </div>
          ) : !customerDetail?.customer ? (
            <div className="p-12 text-center text-xs text-[#7c6853] bg-white rounded-2xl border border-[#ebdcc9]">
              Select a customer from the left list to view their ledger.
            </div>
          ) : (
            <>
              {/* Notification Toast */}
              {successToast && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebdcc9]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-[#2d2115]">
                        {customerDetail.customer.name}
                      </h2>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getRankBadge(
                          customerDetail.customer.ranking
                        )}`}
                      >
                        {customerDetail.customer.ranking} Customer
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#7c6853] mt-1.5">
                      {customerDetail.customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#8b5a2b]" />
                          {customerDetail.customer.phone}
                        </span>
                      )}
                      {customerDetail.customer.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8b5a2b]" />
                          {customerDetail.customer.address}
                        </span>
                      )}
                      <span className="text-emerald-800 font-semibold">
                        Discount: Rs {customerDetail.customer.discountRate || 0}/unit
                      </span>
                    </div>
                  </div>

                  {/* Actions for this Customer */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={openEditCustomerModal}
                      className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-800 border border-blue-200 flex items-center gap-1.5 transition-all shadow-xs"
                      title="Edit Profile & Baqaya / کھاتہ و بقایا درست کریں"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profile / کھاتہ درست کریں</span>
                    </button>
                    <button
                      onClick={handleDeleteCustomer}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-all shadow-xs"
                      title="Delete Customer Account / کھاتہ ختم کریں"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete / حذف کریں</span>
                    </button>
                    <button
                      onClick={() => setShowAdvanceModal(true)}
                      className="px-3 py-2 rounded-xl bg-[#fdf6e3] hover:bg-[#ebdcc9] text-xs font-bold text-[#8b5a2b] border border-[#d9c4a8]"
                    >
                      + Advance Payment (بیعانہ)
                    </button>
                    {customerDetail.customer.totalPending > 0 && (
                      <button
                        onClick={() => {
                          setBaqayaAmount(String(customerDetail.customer.totalPending));
                          setShowPayBaqayaModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Receive Due / بقایا وصول کریں</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="px-4 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Sale Order / مال دیں</span>
                    </button>
                  </div>
                </div>

                {/* Financial Ledger Snapshot */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Total Paid */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300">
                    <div className="text-[10px] uppercase font-black text-emerald-900 flex items-center justify-between">
                      <span>کتنے پیسے دیے ہیں</span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono">Paid</span>
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-800 mt-1">
                      Rs {customerDetail.customer.totalPaid.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      اب تک وصول شدہ نقد رقم
                    </div>
                  </div>

                  {/* Remaining Due / Baqaya */}
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300">
                    <div className="text-[10px] uppercase font-black text-rose-900 flex items-center justify-between">
                      <span>بعد میں دینے ہیں (بقایا)</span>
                      <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-mono">Due</span>
                    </div>
                    <div className="text-xl font-black font-mono text-rose-700 mt-1">
                      Rs {customerDetail.customer.totalPending.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-rose-700 mt-0.5">
                      واجب الادا ادھار بیلنس
                    </div>
                  </div>

                  {/* Total Grain Bought */}
                  <div className="p-3.5 rounded-xl bg-[#fdf6e3] border border-[#ebdcc9]">
                    <div className="text-[10px] uppercase font-black text-[#8b5a2b]">
                      کل خریدا گیا مال (Total Volume)
                    </div>
                    <div className="text-xl font-black font-mono text-[#2d2115] mt-1">
                      Rs {(customerDetail.customer.totalPaid + customerDetail.customer.totalPending).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#7c6853] mt-0.5">
                      کل خریداری میزان
                    </div>
                  </div>

                  {/* Advance Balance */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300">
                    <div className="text-[10px] uppercase font-black text-amber-900">
                      پیشگی بیعانہ (Advance)
                    </div>
                    <div className="text-xl font-black font-mono text-amber-900 mt-1">
                      Rs {(customerDetail.customer.advanceBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      مستقبل کے سودوں کیلئے بیلنس
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase History / Ledger Entries */}
              <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ebdcc9]">
                  <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8b5a2b]" />
                    <span>خریداری تاریخ وار پرچے و بقایا جات ({customerDetail.sales?.length || 0})</span>
                  </h3>
                </div>

                <div className="divide-y divide-[#ebdcc9] overflow-x-auto">
                  {customerDetail.sales?.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#7c6853]">
                      No previous orders. Click "New Sale Order" above!
                    </div>
                  ) : (
                    customerDetail.sales.map((sale: any) => (
                      <div key={sale._id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#2d2115] flex items-center gap-2">
                            <span className="font-mono text-[#8b5a2b]">#{sale.invoiceNumber}</span>
                            <span className="text-[10px] text-[#7c6853] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#8b5a2b]" />
                              {new Date(sale.date).toLocaleDateString("en-PK", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {sale.dueAmount > 0 ? (
                              <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.2 rounded border border-rose-200">
                                بقایا باقی ہے
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded border border-emerald-200">
                                مکمل ادا شدہ
                              </span>
                            )}
                            {sale.returnDetails?.isReturned && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                                واپسی / Return
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#7c6853] mt-1">
                            {sale.items?.map((it: any) => `${it.quantity} ${it.unit} ${it.productName} (Rate: Rs ${it.rate})`).join(", ")}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* 3 Explicit Financial Columns */}
                          <div className="grid grid-cols-3 gap-2 text-right bg-[#fbf7ee] p-2 rounded-xl border border-[#ebdcc9] min-w-[260px]">
                            <div>
                              <div className="text-[9px] text-[#7c6853] uppercase font-bold">کل بل</div>
                              <div className="font-bold font-mono text-[#2d2115]">
                                Rs {sale.netAmount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] text-emerald-800 uppercase font-bold">کتنے دیے</div>
                              <div className="font-bold font-mono text-emerald-800">
                                Rs {sale.paidAmount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] text-rose-700 uppercase font-bold">بعد میں دینے ہیں</div>
                              <div className="font-black font-mono text-rose-700">
                                Rs {sale.dueAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditSaleModal(sale)}
                              title="Edit Sale / پرچہ درست کریں"
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[10px] font-bold text-blue-700 border border-blue-200 flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteRegularSale(sale)}
                              title="Delete Sale / ختم کریں"
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 border border-rose-200 transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>

                            {!sale.returnDetails?.isReturned && (
                              <button
                                onClick={() => {
                                  setSelectedSaleForReturn(sale);
                                  setReturnQty(String(sale.items[0]?.quantity || 1));
                                  setReturnAmount(String(sale.netAmount));
                                  setShowReturnModal(true);
                                }}
                                className="px-2 py-1 rounded bg-[#fdf6e3] hover:bg-[#ebdcc9] text-[10px] font-bold text-[#8b5a2b] border border-[#d9c4a8]"
                              >
                                Return
                              </button>
                            )}

                            <button
                              onClick={() =>
                                setActiveSlip({
                                  invoiceNumber: sale.invoiceNumber,
                                  date: sale.date,
                                  customerName: sale.customerName,
                                  customerPhone: sale.customerPhone,
                                  customerAddress: sale.customerAddress,
                                  customerType: "regular",
                                  items: sale.items,
                                  totalAmount: sale.totalAmount,
                                  discountAmount: sale.discountAmount,
                                  netAmount: sale.netAmount,
                                  paidAmount: sale.paidAmount,
                                  dueAmount: sale.dueAmount,
                                  paymentMethod: sale.paymentMethod,
                                  notes: sale.notes,
                                })
                              }
                              className="px-2 py-1 rounded bg-[#2f5233] hover:bg-[#234226] text-[10px] font-bold text-white shadow-xs flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3 h-3" />
                              Slip
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: Add Regular Customer Profile */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title={language === "ur" ? "نیا کسٹمر کھاتہ کھولیں" : "New Customer Account"}
        icon={<Users className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Customer / Mill Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Haji Bashir Flour Mills"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-XXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Loyalty Tier</label>
              <select
                value={ranking}
                onChange={(e: any) => setRanking(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              >
                <option value="Bronze">Bronze (کانسی)</option>
                <option value="Silver">Silver (سلور)</option>
                <option value="Gold">Gold (گولڈ)</option>
                <option value="VIP">VIP (اعلیٰ گاہک)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Address / Location</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Old Mandi Bazaar"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Custom Discount Rate (Rs/unit)
              </label>
              <input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Previous Udhaar (سابقہ ادھار)
              </label>
              <input
                type="number"
                value={initialPending}
                onChange={(e) => setInitialPending(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(false)}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226] shadow-xs active:scale-95 transition-all"
            >
              Save Profile / محفوظ کریں
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Regular Customer Sale Order */}
      <Modal
        isOpen={showOrderModal && !!customerDetail?.customer}
        onClose={() => setShowOrderModal(false)}
        title={customerDetail?.customer ? `Issue Order for ${customerDetail.customer.name}` : "Issue Order"}
        icon={<CreditCard className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="lg"
      >
        {customerDetail?.customer && (
          <form onSubmit={handleRegularOrder} className="space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#2d2115]">Select Grain Type *</label>
                <div className="flex items-center gap-1 bg-[#f0e4d2] p-0.5 rounded-lg text-xs font-bold">
                  <span className="text-[10px] text-[#7c6853] px-1 font-semibold">یونٹ:</span>
                  <button
                    type="button"
                    onClick={() => handleOrderUnitChange("maund")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                      orderUnit === "maund"
                        ? "bg-[#8b5a2b] text-white shadow-xs"
                        : "text-[#7c6853] hover:text-[#2d2115]"
                    }`}
                  >
                    من (Maund - 40kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrderUnitChange("kg")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                      orderUnit === "kg"
                        ? "bg-[#2f5233] text-white shadow-xs"
                        : "text-[#7c6853] hover:text-[#2d2115]"
                    }`}
                  >
                    کلو (KG)
                  </button>
                </div>
              </div>
              <select
                required
                value={productId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#2d2115]">
                    {orderUnit === "kg" ? "Quantity in KG (وزن کلو میں) *" : "Quantity in Maund (مقدار من میں) *"}
                  </label>
                  {Number(quantity) > 0 && (
                    <span className="text-[10px] font-bold text-[#8b5a2b] bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-200">
                      {formatWeightPreview(Number(quantity), orderUnit)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={orderUnit === "kg" ? "e.g. 20, 50, 100 kg" : "e.g. 1, 5, 20 maund"}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  {orderUnit === "kg" ? "Rate per KG (فی کلو ریٹ Rs) *" : "Rate per Maund (فی من ریٹ Rs) *"}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder={orderUnit === "kg" ? "Rs per kg" : "Rs per maund"}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Optional Custom Discount & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Discount per Unit (Rs) - Optional / رعایت
                </label>
                <input
                  type="number"
                  min="0"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(e.target.value)}
                  placeholder="0 (Optional)"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-white text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                />
                {customerDetail.customer.discountRate > 0 && (
                  <div className="text-[10px] text-[#7c6853] mt-1">
                    Customer default: Rs {customerDetail.customer.discountRate}/unit (editable)
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="cash">Cash in Hand (نقد)</option>
                  <option value="bank">Bank Transfer (بینک)</option>
                  <option value="cheque">Cheque (چیک)</option>
                  <option value="advance">
                    Deduct from Advance (پیشگی سے کٹوتی - Bal: Rs{" "}
                    {customerDetail.customer.advanceBalance || 0})
                  </option>
                </select>
              </div>
            </div>

            <div>
              {(() => {
                const q = Number(quantity) || 0;
                const r = Number(rate) || 0;
                const d = Number(customDiscount) || 0;
                const gross = q * r;
                const discAmt = q * d;
                const net = Math.max(0, gross - discAmt);
                const paid = paidAmount === "" ? net : Number(paidAmount) || 0;
                const dueThisBill = Math.max(0, net - paid);
                const prevPending = customerDetail?.customer?.totalPending || 0;
                const newTotalPending = prevPending + dueThisBill;

                return (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-[#2d2115]">
                        Amount Paid Now (Rs) / نقد وصول
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPaidAmount(String(net))}
                          className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 transition-colors"
                        >
                          Full Cash (نقد)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaidAmount("0")}
                          className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold hover:bg-rose-200 transition-colors"
                        >
                          Full Baqaya (پورا ادھار)
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder={`Full net amount: Rs ${net.toLocaleString()}`}
                      className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                    />

                    {/* Live Bill Calculation Summary */}
                    <div className="p-3.5 mt-3 rounded-xl bg-gradient-to-br from-[#fdf6e3] to-[#f4ebd9] border border-[#ebdcc9] space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#7c6853]">
                        <span>Gross Total ({q} × Rs {r}):</span>
                        <span className="font-mono">Rs {gross.toLocaleString()}</span>
                      </div>
                      {discAmt > 0 && (
                        <div className="flex justify-between text-emerald-800 font-semibold">
                          <span>Total Discount ({q} × Rs {d}):</span>
                          <span className="font-mono">- Rs {discAmt.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-[#2d2115] pt-1 border-t border-[#ebdcc9]">
                        <span>Net Bill (خالص بل):</span>
                        <span className="font-mono text-[#8b5a2b]">Rs {net.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-neutral-800 font-semibold">
                        <span>Amount Paid Now (نقد وصول):</span>
                        <span className="font-mono text-emerald-800">Rs {paid.toLocaleString()}</span>
                      </div>
                      {dueThisBill > 0 && (
                        <div className="flex justify-between text-rose-700 font-bold border-t border-rose-200 pt-1">
                          <span>This Bill Due / Baqaya (اس بل کا بقایا):</span>
                          <span className="font-mono">Rs {dueThisBill.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#7c6853] text-[11px] pt-1 border-t border-[#ebdcc9]/60">
                        <span>Customer Previous Baqaya (سابقہ ادھار):</span>
                        <span className="font-mono text-rose-700">Rs {prevPending.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-black text-rose-900 text-xs bg-rose-100/70 p-2 rounded-lg border border-rose-200">
                        <span>New Total Baqaya (کل نیا بقایا بعد از بل):</span>
                        <span className="font-mono">Rs {newTotalPending.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleRegularOrder(e, false)}
                className="px-4 py-2 rounded-xl bg-[#8b5a2b] hover:bg-[#724820] text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Saving..." : "Save Only / صرف محفوظ کریں"}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleRegularOrder(e, true)}
                className="px-4 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Saving..." : "Save & Print Slip / محفوظ اور پرچہ"}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Advance Payment */}
      <Modal
        isOpen={showAdvanceModal && !!customerDetail?.customer}
        onClose={() => setShowAdvanceModal(false)}
        title="Advance Payment Booking (بیعانہ)"
        icon={<Wallet className="w-5 h-5 text-amber-600" />}
        maxWidth="sm"
      >
        <form onSubmit={handleAddAdvance} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#2d2115] mb-1">Advance Amount (Rs) *</label>
            <input
              type="number"
              required
              min="1"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
            />
          </div>

          <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvanceModal(false)}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2f5233] text-white font-bold hover:bg-[#234226] shadow-xs active:scale-95 transition-all"
            >
              Record Advance & Cash
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Receive Baqaya (Udhaar Payment Recovery) */}
      <Modal
        isOpen={showPayBaqayaModal && !!customerDetail?.customer}
        onClose={() => setShowPayBaqayaModal(false)}
        title="Receive Due / بقایا وصول کریں"
        icon={<Wallet className="w-5 h-5 text-amber-600" />}
        maxWidth="md"
      >
        {customerDetail?.customer && (
          <div className="space-y-3.5">
            {/* Customer & Baqaya Info Card */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-[#2d2115]">{customerDetail.customer.name}</span>
                <span className="text-[11px] text-[#7c6853]">{customerDetail.customer.phone || "No phone"}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-rose-200/60">
                <span className="text-xs font-semibold text-rose-800">Total Outstanding Baqaya (کل بقایا ادھار):</span>
                <span className="text-base font-black font-mono text-rose-700">
                  Rs {customerDetail.customer.totalPending.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleReceiveBaqaya} className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-[#2d2115]">Payment Amount (Rs) * / موصولہ رقم</label>
                  <button
                    type="button"
                    onClick={() => setBaqayaAmount(String(customerDetail.customer.totalPending))}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition-colors"
                  >
                    Full Due (پورا بقایا)
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={customerDetail.customer.totalPending > 0 ? customerDetail.customer.totalPending : undefined}
                  value={baqayaAmount}
                  onChange={(e) => setBaqayaAmount(e.target.value)}
                  placeholder="Enter amount received"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5a2b]/30"
                />
              </div>

              {Number(baqayaAmount) > 0 && (
                <div className="p-2.5 rounded-lg bg-[#fdf6e3] border border-[#ebdcc9] text-[11px] flex justify-between font-bold">
                  <span className="text-[#7c6853]">Remaining Baqaya After Payment:</span>
                  <span className="text-rose-700 font-mono">
                    Rs {Math.max(0, customerDetail.customer.totalPending - Number(baqayaAmount)).toLocaleString()}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Payment Method / ادائیگی کا طریقہ</label>
                <select
                  value={baqayaMethod}
                  onChange={(e: any) => setBaqayaMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="cash">Cash in Hand (نقد کیش)</option>
                  <option value="bank">Bank Transfer (بینک ٹرانسفر)</option>
                  <option value="cheque">Cheque (چیک)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Notes / تفصیل (Optional)</label>
                <input
                  type="text"
                  value={baqayaNotes}
                  onChange={(e) => setBaqayaNotes(e.target.value)}
                  placeholder="e.g. Received via Munshi / slip #12"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPayBaqayaModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={baqayaLoading || !baqayaAmount}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{baqayaLoading ? "Saving..." : "Record Payment / وصول کریں"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: Sale Return */}
      <Modal
        isOpen={showReturnModal && !!selectedSaleForReturn}
        onClose={() => setShowReturnModal(false)}
        title="Customer Sale Return (مال واپسی)"
        icon={<RotateCcw className="w-5 h-5 text-rose-700" />}
        maxWidth="md"
      >
        {selectedSaleForReturn && (
          <div className="space-y-3.5">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              Invoice #{selectedSaleForReturn.invoiceNumber} • {selectedSaleForReturn.customerName}
            </div>

            <form onSubmit={handleProcessSaleReturn} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Return Quantity *</label>
                <input
                  type="number"
                  required
                  step="any"
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Adjust / Refund Amount (Rs) *
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
                <label className="block font-bold text-[#2d2115] mb-1">Reason for Return</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Excess bags returned by buyer"
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
                  Confirm Return & Restock
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Regular Sale */}
      <Modal
        isOpen={showEditSaleModal && !!selectedSaleForEdit && !!customerDetail?.customer}
        onClose={() => setShowEditSaleModal(false)}
        title={selectedSaleForEdit ? `Edit Order #${selectedSaleForEdit.invoiceNumber} / پرچہ میں ترمیم` : "Edit Order"}
        icon={<Edit2 className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="lg"
      >
        {selectedSaleForEdit && customerDetail?.customer && (
          <div className="space-y-3.5">
            <div className="p-3 bg-[#fdf6e3] rounded-xl border border-[#ebdcc9] text-xs">
              <span className="text-[#7c6853]">Customer: </span>
              <span className="font-bold text-[#2d2115]">{customerDetail.customer.name}</span>
            </div>

            <form onSubmit={handleUpdateRegularSale} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#2d2115]">Select Grain Type *</label>
                  <div className="flex items-center gap-1 bg-[#f0e4d2] p-0.5 rounded-lg text-xs font-bold">
                    <span className="text-[10px] text-[#7c6853] px-1 font-semibold">یونٹ:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (editOrderUnit === "kg") {
                          setEditOrderUnit("maund");
                          const curRate = Number(editRate) || 0;
                          if (curRate > 0) setEditRate(String(Math.round(curRate * 40)));
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                        editOrderUnit === "maund"
                          ? "bg-[#8b5a2b] text-white shadow-xs"
                          : "text-[#7c6853] hover:text-[#2d2115]"
                      }`}
                    >
                      من (Maund)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editOrderUnit === "maund") {
                          setEditOrderUnit("kg");
                          const curRate = Number(editRate) || 0;
                          if (curRate > 0) {
                            const r = curRate / 40;
                            setEditRate(String(Number.isInteger(r) ? r : Number(r.toFixed(2))));
                          }
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                        editOrderUnit === "kg"
                          ? "bg-[#2f5233] text-white shadow-xs"
                          : "text-[#7c6853] hover:text-[#2d2115]"
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
                    Qty ({editOrderUnit === "kg" ? "KG" : "Maund"}) *
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
                    Rate / {editOrderUnit === "kg" ? "KG" : "Maund"} *
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
                    Disc / {editOrderUnit === "kg" ? "KG" : "Maund"}
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
                    <option value="advance">
                      Deduct from Advance (پیشگی سے کٹوتی - Bal: Rs{" "}
                      {customerDetail.customer.advanceBalance || 0})
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#2d2115] mb-1">Notes / تفصیل</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notes"
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
                  onClick={() => setShowEditSaleModal(false)}
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
                  <span>{editLoading ? "Updating..." : "Update Order & Recalculate"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Customer Profile & Baqaya */}
      <Modal
        isOpen={showEditCustomerModal && !!customerDetail?.customer}
        onClose={() => setShowEditCustomerModal(false)}
        title={customerDetail?.customer ? `Edit Profile & Baqaya: ${customerDetail.customer.name}` : "Edit Profile"}
        icon={<Edit2 className="w-5 h-5 text-[#8b5a2b]" />}
        maxWidth="lg"
      >
        {customerDetail?.customer && (
          <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Address / گاؤں یا منڈی پتہ</label>
              <input
                type="text"
                value={editCustAddress}
                onChange={(e) => setEditCustAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Ranking Tier</label>
                <select
                  value={editCustRanking}
                  onChange={(e: any) => setEditCustRanking(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                >
                  <option value="Bronze">Bronze (عام کسٹمر)</option>
                  <option value="Silver">Silver (معیاری کھاتہ دار)</option>
                  <option value="Gold">Gold (خاص خریدار)</option>
                  <option value="VIP">VIP (اعلیٰ کاروباری شراکت دار)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Discount Rate (Rs/unit)</label>
                <input
                  type="number"
                  value={editCustDiscountRate}
                  onChange={(e) => setEditCustDiscountRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
            </div>

            {/* DEDICATED BAQAYA & ADVANCE EDIT SECTION */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3">
              <div className="font-bold text-amber-900 flex items-center justify-between">
                <span>کھاتہ ادھار و بقایا بیلنس ایڈجسٹمنٹ</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                  Ledger Balances
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-rose-800 mb-1">
                    کل واجب الادا بقایا (Total Baqaya Rs) *
                  </label>
                  <input
                    type="number"
                    value={editCustTotalPending}
                    onChange={(e) => setEditCustTotalPending(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-rose-900 font-mono font-black text-sm focus:outline-none"
                  />
                  <span className="text-[10px] text-rose-700 block mt-0.5">گاہک کے ذمے کل ادھار</span>
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">
                    پیشگی بیعانہ (Advance Balance Rs)
                  </label>
                  <input
                    type="number"
                    value={editCustAdvanceBalance}
                    onChange={(e) => setEditCustAdvanceBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-900 font-mono font-black text-sm focus:outline-none"
                  />
                  <span className="text-[10px] text-emerald-700 block mt-0.5">شاپ کے پاس جمع بیعانہ</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">Notes / تفصیل</label>
              <input
                type="text"
                value={editCustNotes}
                onChange={(e) => setEditCustNotes(e.target.value)}
                placeholder="Additional notes"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div className="pt-3 sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#ebdcc9] flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDeleteCustomer}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-colors"
                title="Delete Customer Account / کھاتہ ختم کریں"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account / کھاتہ ختم کریں</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editCustLoading}
                  className="px-5 py-2 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editCustLoading ? "Saving..." : "Save Profile & Baqaya"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Mandi Slip Modal */}
      <MandiSlipModal slip={activeSlip} onClose={() => setActiveSlip(null)} />
    </div>
  );
}
