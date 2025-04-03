import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import { Footerdemo } from "@/components/ui/footer-section";
import { AppProvider } from "@/lib/context/AppContext";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "5SIM Phone Verification Service",
  description: "Purchase phone numbers for SMS verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <AppProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footerdemo />
            </div>
            <Toaster position="top-right" />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
