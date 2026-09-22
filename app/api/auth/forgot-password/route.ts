import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User, ActivityLog } from "@/lib/models";
import { ensureDefaultAdmin } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    await ensureDefaultAdmin();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const envEmail = (process.env.ADMIN_EMAIL || "admin@grainflow.com").trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail });

    // If user is asking for admin or matches .env admin email
    if (!user && (cleanEmail === envEmail || cleanEmail === "admin")) {
      user = await User.findOne({ role: "admin" });
    }

    if (!user) {
      return NextResponse.json(
        { error: "No account found associated with this email address" },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP code & token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(24).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetOtp = otp;
    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/forgot-password?email=${encodeURIComponent(user.email)}&token=${resetToken}&otp=${otp}`;

    // Send email via nodemailer (or console preview if SMTP unconfigured)
    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      otp,
      resetUrl,
    });

    await ActivityLog.create({
      action: "FORGOT_PASSWORD_REQUEST",
      entity: "User",
      details: `Password reset OTP generated for ${user.email}`,
    });

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${user.email}. Please check your inbox.`,
      simulated: mailResult.simulated,
      // For local testing convenience if SMTP credentials are not yet added:
      previewOtp: mailResult.simulated ? otp : undefined,
    });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
