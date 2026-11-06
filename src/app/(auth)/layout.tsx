import React from "react";
import { Compass, Sparkles } from "lucide-react";
import { APP_CONFIG } from "@/config/app.config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#0a0807]">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#e2602c]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#a8431d]/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-[#f28b44]/8 blur-[100px] pointer-events-none" />

      {/* Header / Brand */}
      <div className="relative z-10 flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full mars-glass border border-[#e2602c]/30 mb-3 shadow-lg">
          <Compass className="w-5 h-5 text-[#e2602c] animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-semibold text-[#f28b44]">
            {APP_CONFIG.colonyName} · Setor 7
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Red<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e2602c] to-[#f28b44]">Ride</span>
        </h1>
        <p className="text-sm text-[#8c7d75] mt-1.5 max-w-sm">
          {APP_CONFIG.tagline}. Mobilidade autônoma e motoristas com personalidade própria.
        </p>
      </div>

      {/* Content Box */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-8 text-xs text-[#5a4e48] text-center flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#e2602c]/50" />
        <span>RedRide Nova Acidália · Mobilidade Autônoma em Marte</span>
      </div>
    </div>
  );
}
