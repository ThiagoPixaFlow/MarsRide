"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { authService } from "@/modules/auth/auth.service";
import { getErrorMessage } from "@/lib/errors";
import { ROUTES } from "@/config/routes";
import { LogIn, Rocket, KeyRound, Mail, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Insira um endereço de e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setAuthError(null);
      await authService.login({ email: data.email, password: data.password });
      router.push(ROUTES.app);
    } catch (err) {
      setAuthError(getErrorMessage(err, "Falha ao entrar na colônia. Verifique os dados."));
    }
  };

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      setAuthError(null);
      setValue("email", "alex@redride.mars");
      setValue("password", "demo123");
      await authService.login({ email: "alex@redride.mars", password: "demo123" });
      router.push(ROUTES.app);
      router.refresh();
    } catch (err) {
      setAuthError(getErrorMessage(err));
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <Card variant="glass" className="mars-glass-card shadow-2xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <LogIn className="w-5 h-5 text-[#e2602c]" />
          Acessar Terminal RedRide
        </h2>
        <p className="text-sm text-[#8c7d75] mt-1">
          Identifique-se como passageiro registrado na colônia.
        </p>
      </div>

      {authError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail do Passageiro"
          type="email"
          placeholder="exemplo@redride.mars"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Chave de Acesso"
          type="password"
          placeholder="••••••••"
          leftIcon={<KeyRound className="w-4 h-4" />}
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
          rightIcon={<LogIn className="w-4 h-4" />}
        >
          Entrar na Colônia
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#332621]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-[#181311] text-[#8c7d75] uppercase tracking-wider">
            Ou acesse sem cadastro
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full border-[#e2602c]/30 hover:border-[#e2602c]/60 bg-[#1e1714]/80 text-[#f4ede6]"
        onClick={handleDemoLogin}
        isLoading={isDemoLoading}
        leftIcon={<Rocket className="w-4 h-4 text-[#e2602c]" />}
      >
        Entrar como Visitante (Acesso Rápido Demo)
      </Button>
      <p className="text-[11px] text-[#8c7d75] text-center mt-2.5">
        Acesse em 1 clique com o colono demo <strong>Alex Vance</strong> (1.000 MCR inclusos).
      </p>

      <div className="mt-6 text-center text-xs text-[#8c7d75]">
        Ainda não tem registro em Marte?{" "}
        <Link
          href={ROUTES.register}
          className="font-medium text-[#f28b44] hover:text-[#e2602c] transition-colors underline underline-offset-4"
        >
          Cadastre seu perfil
        </Link>
      </div>
    </Card>
  );
}
