import type { Metadata } from "next";
import "./globals.css";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://grain-flow-git-main-ahmaddev545-4016s-projects.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GrainFlow | غلہ منڈی ڈیجیٹل سسٹم - Mandi Commission & Grain Shop Management",
    template: "%s | GrainFlow Mandi OS",
  },
  description:
    "پاکستان کا جدید ترین ڈیجیٹل غلہ منڈی سافٹ ویئر۔ من اور کلو کا فوری حساب، کسان و بیوپاری کھاتہ، باردانہ گودام، روزنامچہ، اور روزانہ ریٹ شیٹ۔",
  applicationName: "GrainFlow Mandi OS",
  keywords: [
    "GrainFlow",
    "غلہ منڈی",
    "منڈی سافٹ ویئر",
    "Mandi Management System",
    "Aarthi commission shop",
    "Grain market software Pakistan",
    "Maund to KG calculator",
    "من اور کلو حساب",
    "Roznamcha",
    "روزنامچہ کھاتہ",
    "Baqaya Khata",
  ],
  authors: [{ name: "Muhammad Ahmad", url: "https://github.com/ahmad-545" }],
  creator: "GrainFlow Tech",
  publisher: "GrainFlow Mandi OS",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/images/og-banner.jpg",
  },
  openGraph: {
    type: "website",
    locale: "ur_PK",
    alternateLocale: "en_US",
    url: baseUrl,
    siteName: "GrainFlow Mandi Management System",
    title: "GrainFlow | منڈی کا مکمل، تیز ترین اور محفوظ ترین ڈیجیٹل نظام",
    description:
      "من اور کلو کا فوری حساب، کسان و بیوپاری کھاتہ، باردانہ گودام، اور روزانہ ریٹ شیٹ — سب ایک کلک پر۔",
    images: [
      {
        url: "/images/og-banner.jpg",
        width: 1200,
        height: 675,
        alt: "GrainFlow - Mandi Commission & Grain Shop Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GrainFlow | غلہ منڈی ڈیجیٹل کنٹرول سسٹم",
    description:
      "من اور کلو کا فوری حساب، کسان و بیوپاری کھاتہ، اور روزنامچہ — جدید ڈیجیٹل غلہ منڈی پورٹل۔",
    images: ["/images/og-banner.jpg"],
    creator: "@ahmaddev545",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#fbf7ee] text-[#2d2115]">
        {children}
      </body>
    </html>
  );
}
