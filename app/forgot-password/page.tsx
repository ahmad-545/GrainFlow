"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KeyRound,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    null
  );
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  // Check URL query parameters if opened via reset link
  useEffect(() => {
    const qEmail = searchParams.get("email");
    const qOtp = searchParams.get("otp");
    if (qEmail) setEmail(qEmail);
    if (qOtp) {
      setOtp(qOtp);
      setStep(2);
      setMessage({
        type: "info",
        text: "Verification code detected from email link. Please set your new password.",
      });
    }
  }, [searchParams]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2);
        if (data.previewOtp) {
          setPreviewOtp(data.previewOtp);
          setOtp(data.previewOtp);
        }
        setMessage({
          type: "success",
          text: data.message || "Verification code sent to your email.",
        });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send reset code" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Password updated successfully! Redirecting to login...",
        });
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to reset password" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md bg-[#ffffff] rounded-3xl shadow-2xl border border-[#ebdcc9] overflow-hidden animate-fade-in">
      {/* Mandi Banner */}
      <div className="bg-gradient-to-r from-[#8b5a2b] via-[#b8860b] to-[#78350f] p-6 text-center text-white relative">
        <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-2 shadow-lg">
          <KeyRound className="w-7 h-7 text-amber-200" />
        </div>
        <h1 className="text-xl font-black tracking-wide">
          {step === 1 ? "Forgot Password / پاس ورڈ کی بازیابی" : "Set New Password / نیا پاس ورڈ"}
        </h1>
        <p className="text-amber-100/90 text-xs mt-1">
          {step === 1
            ? "Enter your registered admin email to receive a verification code"
            : "Enter the 6-digit code received on your email and choose a new password"}
        </p>
      </div>

      <div className="p-7">
        {message && (
          <div
            className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : message.type === "error"
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : "bg-amber-50 border-amber-300 text-amber-900"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>{message.text}</div>
          </div>
        )}

        {previewOtp && (
          <div className="mb-4 p-3 bg-[#fdf6e3] border border-[#d9c4a8] rounded-xl text-xs text-[#8b5a2b]">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#b8860b]" />
              <span>Test Code (Auto-Detected):</span>
            </div>
            <div className="text-base font-mono font-black text-[#2d2115] mt-1">
              {previewOtp}
            </div>
            <div className="text-[10px] text-[#7c6853]">
              (Simulated because SMTP is not yet configured in .env.local)
            </div>
          </div>
        )}

        {/* STEP 1: REQUEST CODE */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#2d2115] uppercase tracking-wider mb-1.5">
                Admin Email Address / ای میل پتہ *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8b5a2b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@grainflow.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-[#d9c4a8] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#8b5a2b] text-white font-bold text-sm tracking-wide hover:brightness-105 active:scale-[0.99] transition-all shadow-md disabled:opacity-50"
            >
              {loading ? "Sending Code..." : "Send Verification Code / کوڈ بھیجیں"}
            </button>

            <div className="pt-3 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8b5a2b] hover:text-[#b8860b]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login / لاگ ان پر واپس جائیں</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: ENTER OTP & NEW PASSWORD */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#2d2115] uppercase tracking-wider mb-1.5">
                6-Digit Verification Code (OTP) *
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-[#8b5a2b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-3 py-2.5 text-base font-mono font-bold tracking-widest rounded-xl border border-[#d9c4a8] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] uppercase tracking-wider mb-1.5">
                New Password (نیا پاس ورڈ) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8b5a2b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#d9c4a8] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2d2115] uppercase tracking-wider mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8b5a2b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-[#d9c4a8] bg-[#fbf7ee] text-[#2d2115] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2f5233] to-[#1e3621] text-white font-bold text-sm tracking-wide hover:brightness-105 active:scale-[0.99] transition-all shadow-md disabled:opacity-50"
            >
              {loading ? "Updating Password..." : "Set New Password / پاس ورڈ تبدیل کریں"}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#7c6853] hover:underline"
              >
                ← Request new code
              </button>
              <Link
                href="/login"
                className="text-xs font-bold text-[#8b5a2b] hover:text-[#b8860b]"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#24170d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambience Background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#b8860b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#b8860b]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#2f5233]/30 blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center text-xs text-[#7c6853]">
            Loading...
          </div>
        }
      >
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
