import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, X, Download, FileText, CheckCircle2, Phone, MapPin } from "lucide-react";
import { useShopSettings } from "@/components/RealTimeContext";

export interface SlipData {
  invoiceNumber: string;
  date: string | Date;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerType?: "local" | "regular";
  items: Array<{
    productName: string;
    grade?: string;
    quantity: number;
    unit: string;
    rate: number;
    discount: number;
    total: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: string;
  notes?: string;
}

interface Props {
  slip: SlipData | null;
  onClose: () => void;
}

export default function MandiSlipModal({ slip, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const { settings, refreshSettings } = useShopSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always re-fetch fresh settings from DB whenever the modal opens
  useEffect(() => {
    if (slip) {
      refreshSettings();
    }
  }, [slip, refreshSettings]);

  // Lock body scroll when slip modal is open
  useEffect(() => {
    if (slip) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [slip]);

  if (!mounted || !slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(slip.date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ebdcc9] max-w-xl w-full max-h-[90vh] flex flex-col no-print animate-fade-in">
        {/* Modal Controls Header */}
        <div className="p-4 border-b border-[#ebdcc9] flex items-center justify-between bg-[#fbf7ee] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#b8860b]" />
            <h3 className="font-bold text-[#2d2115]">
              Mandi Sale Slip / پرچہ فروخت (#{slip.invoiceNumber})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#f0e4d2] p-0.5 rounded-lg flex text-xs font-semibold">
              <button
                onClick={() => setFormat("thermal")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  format === "thermal"
                    ? "bg-[#8b5a2b] text-white"
                    : "text-[#7c6853] hover:text-black"
                }`}
              >
                Thermal 80mm
              </button>
              <button
                onClick={() => setFormat("a4")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  format === "a4"
                    ? "bg-[#8b5a2b] text-white"
                    : "text-[#7c6853] hover:text-black"
                }`}
              >
                A4 Slip
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-[#2f5233] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#234226] shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area preview inside modal */}
        <div className="p-6 overflow-y-auto flex justify-center bg-[#f7f2e7]">
          <div
            id="mandi-print-slip"
            className={`bg-white shadow-md border border-neutral-300 p-6 text-neutral-900 transition-all ${
              format === "thermal" ? "w-[360px] font-mono text-xs" : "w-full text-sm font-sans"
            }`}
          >
            {/* Slip Header */}
            <div className="text-center border-b-2 border-dashed border-neutral-400 pb-3 mb-3">
              <div className="text-xs font-semibold text-neutral-600">
                بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ
              </div>
              <h2 className="text-xl font-black text-[#8b5a2b] tracking-wider uppercase">
                {settings.shopName || "AL-REHMAN GRAIN COMMISSION"}
              </h2>
              {settings.shopNameUrdu && (
                <div className="text-xs font-bold text-neutral-800">
                  {settings.shopNameUrdu}
                </div>
              )}
              <div className="text-[11px] text-neutral-600 flex items-center justify-center gap-2 mt-0.5">
                <span>{settings.shopAddress || "Shop #42, Main Galla Mandi, Gate #1"}</span>
              </div>
              <div className="text-[11px] text-neutral-600 flex items-center justify-center gap-2">
                <span>Phone: {settings.shopPhone || "0300-1234567 | 0321-7654321"}</span>
              </div>
              {settings.shopLicense && (
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Mandi License / NTN: {settings.shopLicense}
                </div>
              )}
            </div>

            {/* Invoice & Customer Meta */}
            <div className="space-y-1 text-xs border-b border-dashed border-neutral-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Invoice / پرچہ نمبر:</span>
                <span className="font-bold">{slip.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Date / تاریخ:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Customer / نام خریدار:</span>
                <span className="font-bold">{slip.customerName}</span>
              </div>
              {slip.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phone / فون:</span>
                  <span>{slip.customerPhone}</span>
                </div>
              )}
              {slip.customerAddress && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Address / پتہ:</span>
                  <span>{slip.customerAddress}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Customer Type / قسم:</span>
                <span className="font-semibold uppercase text-[#8b5a2b]">
                  {slip.customerType === "regular" ? "Regular (کھاتہ دار)" : "Walk-in (عام گاہک)"}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left mb-3">
              <thead>
                <tr className="border-b-2 border-neutral-800 text-[11px] uppercase">
                  <th className="py-1">Grain / جنس</th>
                  <th className="py-1 text-right">Qty</th>
                  <th className="py-1 text-right">Rate</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {slip.items.map((item, idx) => (
                  <tr key={idx} className="text-xs">
                    <td className="py-1.5 pr-1">
                      <div className="font-bold">{item.productName}</div>
                      {item.grade && (
                        <div className="text-[10px] text-neutral-500">{item.grade}</div>
                      )}
                      {item.discount > 0 && (
                        <div className="text-[10px] text-emerald-700">
                          Disc: Rs {item.discount}/{item.unit}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap">
                      Rs {item.rate.toLocaleString()}/{item.unit}
                    </td>
                    <td className="py-1.5 text-right font-bold whitespace-nowrap">
                      Rs {item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculation Summary */}
            <div className="border-t-2 border-dashed border-neutral-400 pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal / کل میزان:</span>
                <span>Rs {slip.totalAmount.toLocaleString()}</span>
              </div>
              {slip.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Discount / رعایت:</span>
                  <span>- Rs {slip.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-neutral-300 pt-1">
                <span>Net Payable / خالص رقم:</span>
                <span className="text-[#8b5a2b]">Rs {slip.netAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-800 font-bold">
                <span>Cash Paid / نقد وصول:</span>
                <span className="text-emerald-700">Rs {slip.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-rose-700 border-t border-dotted border-neutral-400 pt-1">
                <span>Balance Due / بقایا ادھار:</span>
                <span>Rs {slip.dueAmount.toLocaleString()}</span>
              </div>
              {slip.paymentMethod && (
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Mode / ذریعہ ادائیگی:</span>
                  <span className="capitalize">{slip.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Footer & Signature Stamp */}
            <div className="mt-6 pt-4 border-t border-dashed border-neutral-300 text-center">
              <div className="flex justify-between items-end mb-4 px-2">
                <div className="text-center">
                  <div className="w-24 border-b border-neutral-400 mb-1" />
                  <div className="text-[10px] text-neutral-500">دستخط خریدار / Customer</div>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-neutral-400 mb-1" />
                  <div className="text-[10px] text-neutral-500">دستخط منشی / {settings.shopName || "GrainFlow"}</div>
                </div>
              </div>
              <div className="text-[10px] text-neutral-500 italic">
                {settings.receiptFooterNote || "مال تول کر چیک کر کے لیجائیں۔ بعد میں کوئی دعویٰ قبول نہیں ہوگا۔"}
              </div>
              <div className="text-[9px] text-neutral-400 mt-1">
                Software by GrainFlow Mandi Solutions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
