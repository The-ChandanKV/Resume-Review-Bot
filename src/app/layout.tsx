import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Resume Reviewer",
  description: "Get professional feedback on your resume using advanced AI analysis. Upload your resume and receive detailed insights to improve your job prospects.",
  keywords: ["Resume Review", "AI", "Career", "Job Search", "Professional Development"],
  openGraph: {
    title: "AI Resume Reviewer",
    description: "Professional resume analysis powered by AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Reviewer",
    description: "Professional resume analysis powered by AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
