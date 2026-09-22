"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Store,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Wheat,
  ArrowRight,
  TrendingUp,
  Scale,
  FileSpreadsheet,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Video state & controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMsg("Password reset successfully! Please log in with your new password.");
    }
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted until muted
      });
    }
  }, [searchParams]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        if (data.isLocked) {
          setIsLocked(true);
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#1b120a] text-neutral-900 overflow-hidden font-sans">
      {/* ========================================================= */}
      {/* LEFT SIDE: LOGIN FORM PANEL (Responsive: Full on mobile) */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[42%] min-h-screen bg-[#fdfcf9] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 relative z-10 shadow-2xl border-r border-[#ebdcc9] overflow-y-auto">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8b5a2b]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand & Mandi Identity */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b8860b] via-[#8b5a2b] to-[#5c3a1e] flex items-center justify-center text-white shadow-md shadow-amber-900/20">
                <Wheat className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#2d2115]">
                    GrainFlow
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    منڈی سسٹم
                  </span>
                </div>
                <p className="text-xs text-[#7c6853] font-medium">
                  Mandi Commission & Grain Shop Management
                </p>
              </div>
            </div>

            {/* Mobile Video Teaser Indicator */}
            <div className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Portal Live</span>
            </div>
          </div>
        </div>

        {/* Middle: Login Form Content */}
        <div className="my-8 max-w-md w-full mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-[#2d2115] tracking-tight">
              خوش آمدید / Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-[#7c6853] mt-1.5 font-medium leading-relaxed">
              براہ کرم منڈی شاپ کنٹرول سنٹر میں داخل ہونے کے لیے لاگ ان کریں
            </p>
          </div>

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-900 text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMsg}</div>
            </div>
          )}

          {error && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-shake shadow-xs ${
                isLocked
                  ? "bg-rose-50 border-rose-300 text-rose-800"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-snug">
                <span className="font-bold">Notice: </span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2d2115] uppercase tracking-wider mb-1.5">
                Username or Email / یوزر نام
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8b5a2b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin@grainflow.com"
                  className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border border-[#d9c4a8] bg-[#fbf7ee] text-[#2d2115] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8b5a2b]/30 focus:border-[#8b5a2b] transition-all font-medium shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#2d2115] uppercase tracking-wider">
                  Password / پاس ورڈ
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-[#8b5a2b] hover:text-[#b8860b] hover:underline transition-colors"
                >
                  Forgot Password? / بھول گئے؟
                </Link>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-[#8b5a2b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-[#d9c4a8] bg-[#fbf7ee] text-[#2d2115] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8b5a2b]/30 focus:border-[#8b5a2b] transition-all font-medium shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#2f5233] via-[#244327] to-[#1a331d] hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? "Authenticating / تصدیق ہو رہی ہے..." : "Login to Mandi Shop / داخل ہوں"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Bottom Footer */}
        <div className="pt-4 border-t border-[#ebdcc9] flex items-center justify-center text-[11px] text-[#7c6853]">
          <span>© GrainFlow Mandi OS</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE: FULL VIDEO SHOWCASE PANEL (Desktop / Tablet) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[58%] min-h-screen relative overflow-hidden bg-black items-center justify-center">
        {/* Background Video Player */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="/images/mandi-wheat-bg.jpg"
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-[0.95] contrast-[1.05]"
        >
          {/* User's video in public/videos/video.mp4 */}
          <source src="/videos/video.mp4" type="video/mp4" />
          <source src="/videos/login-bg.mp4" type="video/mp4" />
          <source src="/login-video.mp4" type="video/mp4" />
          <source src="/video.mp4" type="video/mp4" />
        </video>

        {/* Gradient Overlays for Cinematic Contrast & Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-black/60 pointer-events-none" />

        {/* Top Control Bar inside Video Area */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          {/* Live Mandi Status Pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="tracking-wide">غلہ منڈی لائیو ٹریڈنگ پورٹل</span>
          </div>

          {/* Video Controls (Mute & Play/Pause) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white transition-all active:scale-95 cursor-pointer"
              title={isPlaying ? "Pause Video" : "Play Video"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white transition-all active:scale-95 cursor-pointer"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Center / Bottom Cinematic Content Overlay */}
        <div className="relative z-20 p-8 xl:p-14 max-w-xl text-white mt-auto mb-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold backdrop-blur-md">
            <Wheat className="w-4 h-4" />
            <span>GrainFlow Pro OS 2.0</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight text-white drop-shadow-md">
              منڈی کا مکمل، تیز ترین اور محفوظ ترین ڈیجیٹل نظام
            </h2>
            <p className="text-sm xl:text-base text-amber-100/90 leading-relaxed font-medium drop-shadow">
              من اور کلو کا فوری حساب، کسان و بیوپاری کھاتہ، باردانہ گودام، اور روزانہ ریٹ شیٹ — سب ایک کلک پر۔
            </p>
          </div>

          {/* Quick 3 Feature Cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
              <Scale className="w-5 h-5 text-amber-300" />
              <div className="text-xs font-bold">من و کلو حساب</div>
              <div className="text-[10px] text-amber-200/80">خودکار وزن و بھاؤ</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
              <div className="text-xs font-bold">پرچہ و کھاتہ</div>
              <div className="text-[10px] text-amber-200/80">فوری رسید و بقایا</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
              <TrendingUp className="w-5 h-5 text-amber-300" />
              <div className="text-xs font-bold">ڈیلی ریٹس</div>
              <div className="text-[10px] text-amber-200/80">مارکیٹ تیزی مندی</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1b120a] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
