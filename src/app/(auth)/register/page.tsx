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
import { UserPlus, User, AtSign, Mail, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
    username: z
      .string()
      .min(3, "O usuário deve ter no mínimo 3 caracteres")
      .regex(/^[a-zA-Z0-9._]+$/, "Apenas letras, números, pontos e underlines"),
    email: z.string().email("Insira um e-mail válido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setAuthError(null);
      await authService.register({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      });

      setSuccessMsg("Registro efetuado com sucesso! Carregando terminal...");
      setTimeout(() => {
        router.push(ROUTES.app);
        router.refresh();
      }, 1000);
    } catch (err) {
      setAuthError(getErrorMessage(err, "Falha ao registrar novo colono."));
    }
  };

  return (
    <Card variant="glass" className="mars-glass-card shadow-2xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#e2602c]" />
          Registro de Passageiro
        </h2>
        <p className="text-sm text-[#8c7d75] mt-1">
          Crie seu cadastro na colônia para solicitar rovers autônomos.
        </p>
      </div>

      {authError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Nome Completo"
          placeholder="Ex: Elena Rostova"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Nome de Usuário"
          placeholder="elena.mars"
          leftIcon={<AtSign className="w-4 h-4" />}
          error={errors.username?.message}
          {...register("username")}
        />

        <Input
          label="E-mail"
          type="email"
          placeholder="elena@redride.mars"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            leftIcon={<KeyRound className="w-4 h-4" />}
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            leftIcon={<KeyRound className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
          rightIcon={<UserPlus className="w-4 h-4" />}
        >
          Criar Cadastro e Receber 1.000 MCR
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[#8c7d75]">
        Já possui identificação em Marte?{" "}
        <Link
          href={ROUTES.login}
          className="font-medium text-[#f28b44] hover:text-[#e2602c] transition-colors underline underline-offset-4"
        >
          Entrar na sua conta
        </Link>
      </div>
    </Card>
  );
}
