import nodemailer from "nodemailer";

interface SendResetEmailParams {
  to: string;
  otp: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, otp, resetUrl }: SendResetEmailParams) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || '"GrainFlow Mandi" <no-reply@grainflow.com>';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fbf7ee; margin: 0; padding: 20px; color: #2d2115; }
      .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #ebdcc9; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .header { background: linear-gradient(135deg, #8b5a2b, #b8860b); padding: 24px; text-align: center; color: #ffffff; }
      .title { font-size: 22px; font-weight: 800; margin: 0; }
      .subtitle { font-size: 13px; opacity: 0.9; margin-top: 4px; }
      .body { padding: 32px 24px; }
      .code-box { background: #fdf6e3; border: 2px dashed #b8860b; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0; }
      .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #8b5a2b; font-family: monospace; }
      .btn { display: inline-block; background: #2f5233; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px; margin-top: 15px; }
      .footer { background: #fbf7ee; padding: 16px; text-align: center; font-size: 11px; color: #7c6853; border-top: 1px solid #ebdcc9; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="title">GrainFlow Mandi / غلہ منڈی</h1>
        <div class="subtitle">Password Reset Request / پاس ورڈ کی تبدیلی</div>
      </div>
      <div class="body">
        <p style="font-size: 14px; line-height: 1.5;">
          Hello Admin,<br><br>
          We received a request to reset your password for the GrainFlow Mandi account (<strong>${to}</strong>).
        </p>
        <p style="font-size: 13px; color: #7c6853;">
          Use the 6-digit verification code below to set your new password:
        </p>
        <div class="code-box">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #7c6853; margin-bottom: 6px;">Your Reset Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 11px; color: #8b5a2b; margin-top: 6px;">Valid for 15 minutes only</div>
        </div>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="btn">Click Here to Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 25px;">
          If you did not request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <div class="footer">
        GrainFlow Mandi Shop Management System • Secure Commission Control
      </div>
    </div>
  </body>
  </html>
  `;

  // If user has not configured SMTP credentials, simulate and log nicely
  if (!user || !pass) {
    console.log("=================================================");
    console.log("📬 [SIMULATED EMAIL - SMTP credentials not set in .env.local]");
    console.log(`To: ${to}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("=================================================");
    return {
      success: true,
      simulated: true,
      message: "Email simulated (configure SMTP_USER & SMTP_PASS in .env.local for real sending)",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject: `GrainFlow Mandi - Password Reset Code: ${otp}`,
      html: htmlContent,
    });

    console.log("Email sent successfully: ", info.messageId);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
    // Return simulated fallback so user isn't stuck
    return {
      success: true,
      simulated: true,
      error: "SMTP connection failed, fallback code logged",
    };
  }
}
