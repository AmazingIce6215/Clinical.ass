import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { AvatarButton } from "@/components/avatar-button";
import "./globals.css";

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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
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
