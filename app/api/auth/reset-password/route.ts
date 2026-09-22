import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, ActivityLog } from "@/lib/models";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code (OTP), and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const envEmail = (process.env.ADMIN_EMAIL || "admin@grainflow.com").trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail });
    if (!user && (cleanEmail === envEmail || cleanEmail === "admin")) {
      user = await User.findOne({ role: "admin" });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify OTP and expiry
    if (!user.resetOtp || user.resetOtp !== cleanOtp) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your email and try again." },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Update password
    user.passwordHash = await hashPassword(newPassword);
    user.resetOtp = null;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await ActivityLog.create({
      action: "PASSWORD_RESET_SUCCESS",
      entity: "User",
      details: `Password successfully reset via OTP for ${user.email}`,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: unknown) {
    console.error("Reset password error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
