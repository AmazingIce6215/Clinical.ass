import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://clinicalass.vercel.app"),
  title: {
    default: "DxFlow — Clinical tools for medical students",
    template: "%s | DxFlow",
  },
  description:
    "Independent patient-encounter tools, OSCE practice, teaching cases, image review, and clinical calculators for medical students.",
  manifest: "/manifest.json",
  applicationName: "DxFlow",
  category: "education",
  openGraph: {
    type: "website",
    siteName: "DxFlow",
    title: "DxFlow — Clinical tools for medical students",
    description:
      "Independent tools for supervised patient encounters, case presentations, practice sessions, image review, and common clinical scores.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DxFlow clinical tools for medical students" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DxFlow — Clinical tools for medical students",
    description: "Independent patient-encounter tools and practice modes for medical students.",
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DxFlow",
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
