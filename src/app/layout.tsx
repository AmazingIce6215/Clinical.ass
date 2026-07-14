import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://clinicalass.vercel.app"),
  title: {
    default: "Orizon — Clinical tools for medical students",
    template: "%s | Orizon",
  },
  description:
    "AI-assisted clinical reasoning, image diagnosis, case reporting, OSCE practice, and evidence-aware calculators for medical students.",
  manifest: "/manifest.json",
  applicationName: "Orizon",
  category: "education",
  openGraph: {
    type: "website",
    siteName: "Orizon",
    title: "Orizon — Clinical tools for medical students",
    description:
      "Structure patient findings, review clinical images, prepare case reports, and strengthen clinical reasoning in one focused workspace.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Orizon clinical tools for medical students" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orizon — Clinical tools for medical students",
    description: "Clinical reasoning, image diagnosis, case reporting, and focused learning tools for medical students.",
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Orizon",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b141b" },
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
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className={`${GeistSans.className} min-h-dvh bg-background text-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
