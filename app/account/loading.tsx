'use client';

import { Loader2 } from "lucide-react";

export default function AccountLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading your account data...</p>
    </div>
  );
} 