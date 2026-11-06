"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { APP_CONFIG } from "@/config/app.config";
import { authService } from "@/modules/auth/auth.service";
import { walletService } from "@/modules/wallet/wallet.service";
import { UserProfile } from "@/modules/users/user.types";
import { formatCredits } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { WalletModal } from "@/components/wallet/WalletModal";
import {
  Compass,
  Map,
  History,
  User,
  Coins,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<number>(1000);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (!u) {
          router.push(ROUTES.login);
          return;
        }
        setUser(u);
        const w = await walletService.getWallet(u.id);
        setBalance(w.balance);
      } catch {
        router.push(ROUTES.login);
      }
    };
    loadSession();
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    router.push(ROUTES.login);
  };

  const navLinks = [
    { label: "Mapa & Viagens", href: ROUTES.app, icon: Map },
    { label: "Histórico", href: ROUTES.history, icon: History },
    { label: "Meu Perfil", href: ROUTES.profile, icon: User },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-16 mars-glass-solid border-b border-[#2e221d] px-4 sm:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href={ROUTES.app} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e2602c] to-[#f28b44] flex items-center justify-center text-white shadow-md shadow-[#e2602c]/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center">
                Red<span className="text-[#f28b44]">Ride</span>
              </span>
              <span className="text-[10px] text-[#8c7d75] tracking-wider block -mt-1 uppercase">
                {APP_CONFIG.colonyName}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#e2602c]/15 text-[#f28b44] border border-[#e2602c]/30 shadow-sm"
                      : "text-[#a89990] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User & Wallet actions */}
        <div className="flex items-center gap-3">
          {/* Botão de Saldo MCR */}
          <button
            onClick={() => setIsWalletOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl mars-glass border border-[#e2602c]/30 hover:border-[#e2602c] transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-[#e2602c]/20 flex items-center justify-center text-[#f28b44] group-hover:scale-110 transition-transform">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">
                {formatCredits(balance)}
              </span>
            </div>
            <div className="hidden sm:flex items-center text-[#8c7d75] group-hover:text-[#f28b44] transition-colors ml-1">
              <Plus className="w-3 h-3" />
            </div>
          </button>

          {/* Avatar e Perfil */}
          {user && (
            <Link
              href={ROUTES.profile}
              className="hidden sm:flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
              <div className="text-right">
                <span className="text-xs font-semibold text-white block leading-tight">
                  {user.name.split(" ")[0]}
                </span>
                <span className="text-[10px] text-[#8c7d75] block leading-tight">
                  @{user.username}
                </span>
              </div>
              <Avatar name={user.name} color={user.avatarColor} size="sm" />
            </Link>
          )}

          {/* Botão Logout */}
          <button
            onClick={handleLogout}
            title="Sair do terminal"
            className="hidden sm:flex p-2 rounded-xl text-[#8c7d75] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-xl text-[#a89990] hover:text-white hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-30 mars-glass-solid border-b border-[#2e221d] p-4 flex flex-col gap-2 md:hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? "bg-[#e2602c]/20 text-[#f28b44] border border-[#e2602c]/40"
                    : "text-[#c4b5ad] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      )}

      {/* Modal de Carteira / Saldo */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onBalanceUpdated={(newBal) => setBalance(newBal)}
      />
    </>
  );
}
