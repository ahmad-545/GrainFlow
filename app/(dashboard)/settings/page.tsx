"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Lock,
  Shield,
  Store,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useShopSettings, broadcastSync, useRealTimeSync } from "@/components/RealTimeContext";

export default function SettingsPage() {
  const { language } = useLanguage();
  const { settings, updateSettings, loading: settingsLoading } = useShopSettings();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: string; msg: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Shop Profile state
  const [shopName, setShopName] = useState("");
  const [shopNameUrdu, setShopNameUrdu] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopLicense, setShopLicense] = useState("");
  const [receiptFooterNote, setReceiptFooterNote] = useState("");
  const [savingShop, setSavingShop] = useState(false);
  const [shopSaved, setShopSaved] = useState(false);
  const [shopError, setShopError] = useState("");

  // Populate state once settings are loaded
  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName || "");
      setShopNameUrdu(settings.shopNameUrdu || "");
      setShopAddress(settings.shopAddress || "");
      setShopPhone(settings.shopPhone || "");
      setShopLicense(settings.shopLicense || "");
      setReceiptFooterNote(settings.receiptFooterNote || "");
    }
  }, [settings]);

  // Seed status
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/activity-logs");
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", msg: "New passwords do not match" });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ type: "success", msg: "Admin password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchLogs();
      } else {
        setPasswordStatus({ type: "error", msg: data.error || "Failed to update password" });
      }
    } catch {
      setPasswordStatus({ type: "error", msg: "An error occurred" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShop(true);
    setShopError("");
    setShopSaved(false);

    try {
      const ok = await updateSettings({
        shopName,
        shopNameUrdu,
        shopAddress,
        shopPhone,
        shopLicense,
        receiptFooterNote,
      });

      if (ok) {
        setShopSaved(true);
        setTimeout(() => setShopSaved(false), 4000);
        fetchLogs();
      } else {
        setShopError("Failed to save shop details. Please check connection.");
      }
    } catch (err: any) {
      setShopError(err.message || "Failed to save shop details");
    } finally {
      setSavingShop(false);
    }
  };

  const handleClearAllData = async () => {
    if (
      !confirm(
        "⚠️ کیا آپ واقعی تمام ڈیمو / سیمپل ڈیٹا صاف کرنا چاہتے ہیں؟\n\nیہ تمام اناج، کسٹمرز، سپلائرز، سیلز، خریداری، روزنامچہ اور ریٹ حذف کر دے گا۔\n\nدکان کی سیٹنگز اور ایڈمن لاگ ان محفوظ رہیں گے۔"
      )
    )
      return;

    try {
      setSeedLoading(true);
      const res = await fetch("/api/clear-data", { method: "POST" });
      if (res.ok) {
        setSeedMsg("تمام ڈیمو ڈیٹا صاف ہو گیا! اب آپ اپنا ڈیٹا شامل کر سکتے ہیں۔");
        setTimeout(() => setSeedMsg(""), 5000);
        fetchLogs();
        broadcastSync("all");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#8b5a2b]" />
            <h1 className="text-2xl font-black text-[#2d2115]">
              {language === "ur" ? "سیٹنگز، سیکیورٹی و آڈٹ لاگ" : "Settings, Security & Audit"}
            </h1>
          </div>
          <p className="text-xs text-[#7c6853] mt-1">
            {language === "ur"
              ? "دکان کی معلومات، ایڈمن پاس ورڈ تبدیلی، لاگ ان سیکیورٹی اور کارروائیوں کا ریکارڈ"
              : "Shop metadata, admin password management, brute-force security controls, and audit logs."}
          </p>
        </div>

        <button
          onClick={handleClearAllData}
          disabled={seedLoading}
          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Trash2 className={`w-3.5 h-3.5 ${seedLoading ? "animate-spin" : ""}`} />
          <span>{seedLoading ? "صاف ہو رہا ہے..." : "تمام ڈیمو ڈیٹا صاف کریں (Clear All Data)"}</span>
        </button>
      </div>

      {seedMsg && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{seedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Profile Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ebdcc9]">
            <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#b8860b]" />
              <span>Mandi Shop Details (پرچہ و بل ہیڈر)</span>
            </h3>
            {shopSaved && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> محفوظ ہو گیا / Live Synced!
              </span>
            )}
          </div>

          {shopError && (
            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{shopError}</span>
            </div>
          )}

          <form onSubmit={handleSaveShopProfile} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Shop Name - English (دکان کا نام انگریزی)
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Al-Rehman Grain Commission Shop"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-semibold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  Shop Name - Urdu (دکان کا نام اردو)
                </label>
                <input
                  type="text"
                  value={shopNameUrdu}
                  onChange={(e) => setShopNameUrdu(e.target.value)}
                  placeholder="الرحمٰن غلہ کمیشن شاپ - غلہ منڈی"
                  dir="rtl"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Mandi Location Address (پتہ غلہ منڈی)
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Shop #42, Main Galla Mandi, Gate 1"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Contact Phone(s) (رابطہ نمبرز)</label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="0300-1234567, 0321-7654321"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Mandi License / NTN (لائسنس)</label>
                <input
                  type="text"
                  value={shopLicense}
                  onChange={(e) => setShopLicense(e.target.value)}
                  placeholder="MANDI-FSD-2026-904"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Receipt Footer Note / پرچہ نوٹ (شرائط منڈی)
              </label>
              <textarea
                rows={2}
                value={receiptFooterNote}
                onChange={(e) => setReceiptFooterNote(e.target.value)}
                placeholder="مال تول کر چیک کر کے لیجائیں۔ بعد میں کوئی دعویٰ قبول نہیں ہوگا۔"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="submit"
                disabled={savingShop}
                className="px-5 py-2.5 rounded-xl bg-[#2f5233] hover:bg-[#234226] text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                {savingShop ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Shop Details (محفوظ کریں)</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-[#7c6853]">
                * Automatic live sync on all print slips
              </span>
            </div>
          </form>
        </div>

        {/* Security & Password Change */}
        <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ebdcc9]">
            <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8b5a2b]" />
              <span>Admin Security &amp; Password</span>
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              Lockout Protection Active
            </span>
          </div>

          {passwordStatus && (
            <div
              className={`mb-3 p-3 rounded-xl text-xs font-semibold ${
                passwordStatus.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : "bg-rose-50 text-rose-800 border border-rose-300"
              }`}
            >
              {passwordStatus.msg}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-[#2d2115] mb-1">
                Current Password (موجودہ پاس ورڈ)
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2d2115] mb-1">
                  New Password (نیا پاس ورڈ)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d2115] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcc9] bg-[#fbf7ee] text-[#2d2115] focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-[#fdf6e3] rounded-xl border border-[#ebdcc9] text-[11px] text-[#7c6853]">
              🔒 <strong>Security Policy:</strong> Accounts are protected by bcrypt password hashing. Repeated incorrect login attempts trigger a 15-minute lockout automatically.
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#8b5a2b] hover:bg-[#6f4520] text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{passwordLoading ? "Updating..." : "Update Admin Password"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Audit Log / Activity Trail */}
      <div className="bg-white rounded-2xl p-6 border border-[#ebdcc9] shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ebdcc9]">
          <h3 className="font-bold text-sm text-[#2d2115] flex items-center gap-2">
            <History className="w-4 h-4 text-[#8b5a2b]" />
            <span>Staff Activity &amp; Audit Trail (آڈٹ لاگ)</span>
          </h3>
          <span className="text-[11px] text-[#7c6853]">
            Tracks logins, sales, purchases, rate updates &amp; stock wastage
          </span>
        </div>

        <div className="divide-y divide-[#ebdcc9] max-h-72 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7c6853]">No activity logged yet</div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#fdf6e3] text-[#8b5a2b] border border-[#ebdcc9]">
                    {log.action}
                  </span>
                  <span className="text-[#2d2115] font-medium">{log.details}</span>
                </div>
                <div className="text-[10px] text-[#7c6853] whitespace-nowrap pl-2">
                  {new Date(log.createdAt).toLocaleString("en-PK")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
