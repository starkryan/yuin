import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - OTPMaya",
  description: "Sign in to your OTPMaya account",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-background to-muted/20 min-h-screen flex flex-col">
      {children}
    </div>
  );
} 