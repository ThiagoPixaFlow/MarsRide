import React, { Suspense } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0a09] text-[#f4ede6] flex flex-col pt-16">
      <Suspense fallback={<div className="h-16 fixed top-0 inset-x-0 bg-[#151110] border-b border-[#2e221d]" />}>
        <AppNavbar />
      </Suspense>
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Suspense fallback={<div className="p-8 text-xs text-[#8c7d75]">Carregando...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
