import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "./db";
import { User, IUser } from "./models";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "grainflow_super_secure_mandi_secret_key_2026_jwt"
);

const COOKIE_NAME = "grainflow_session";

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function ensureDefaultAdmin(): Promise<IUser> {
  await connectToDatabase();

  const envEmail = (process.env.ADMIN_EMAIL || "admin@grainflow.com").trim().toLowerCase();
  const envPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();

  let admin = await User.findOne({
    $or: [{ role: "admin" }, { email: envEmail }],
  });

  if (!admin) {
    const passwordHash = await hashPassword(envPassword);
    admin = await User.create({
      username: "admin",
      email: envEmail,
      passwordHash,
      role: "admin",
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    console.log(`Default admin created from .env: ${envEmail}`);
  } else {
    // If admin exists, ensure email matches .env.local
    if (admin.email !== envEmail) {
      admin.email = envEmail;
      await admin.save();
    }
  }

  return admin;
}
