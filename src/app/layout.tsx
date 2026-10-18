import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { SetupNotice } from "@/components/setup-notice";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { APP_NAME } from "@/lib/constants";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${APP_NAME}: learn languages through real conversations`, template: `%s · ${APP_NAME}` },
  description:
    "Find language tutors and native speakers for English, German, French, Italian, Spanish, Arabic and Portuguese. Practise speaking in one-to-one lessons.",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {isSupabaseConfigured() ? <SiteHeader /> : <SetupNotice />}
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
