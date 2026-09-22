import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrainFlow - Mandi Grain Market Shop Management",
  description: "Complete Grain Market Shop & Commission Management System",
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
