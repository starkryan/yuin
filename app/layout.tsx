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
  title: "OTPMaya - Temporary Phone Numbers for Verification",
  description: "Get temporary phone numbers for SMS verification services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        // Global appearance configuration
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
          card: "rounded-lg shadow-lg border border-border bg-card",
        }
      }}
      // Redirect users to account page after sign in/up
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/account"
      afterSignUpUrl="/account"
    >
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
