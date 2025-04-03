import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - OTPMaya",
  description: "Create your OTPMaya account",
};

export default function SignUpLayout({
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