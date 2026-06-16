import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { AvatarButton } from "@/components/avatar-button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clincalass — Clinical Reasoning Companion",
  description:
    "AI-powered clinical workup and case-based teaching for medical students. Educational use only.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Clincalass",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-dvh bg-background text-foreground">
          <ThemeProvider>
            <div className="flex min-h-dvh items-center justify-center px-4">
              <div className="text-center">
                <h1 className="text-3xl font-bold">Under Maintenance</h1>
                <p className="mt-3 text-muted">App under maintenance. Back soon!</p>
              </div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AvatarButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
