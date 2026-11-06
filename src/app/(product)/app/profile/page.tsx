"use client";

import React, { useState, useEffect } from "react";
import { userService } from "@/modules/users/user.service";
import {
  UserProfile,
  TravelPreferences,
  UserStats,
  AVATAR_COLORS,
  CONVERSATION_LEVEL_LABEL,
  MUSIC_LABEL,
  ConversationLevel,
  MusicPreference,
} from "@/modules/users/user.types";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { formatCredits, formatDistanceKm } from "@/lib/format";
import {
  User,
  Sliders,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Music,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [occupation, setOccupation] = useState("");
  const [avatarColor, setAvatarColor] = useState("#e2602c");
  const [homeLocationId, setHomeLocationId] = useState("loc-residential");

  // Preferences
  const [preferences, setPreferences] = useState<TravelPreferences>({
    preferredCategory: "go",
    conversationLevel: "balanced",
    cabinTemperature: 21,
    music: "ambient",
    accessibleBoarding: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const p = await userService.getProfile();
        const s = await userService.getUserStats();
        setProfile(p);
        setStats(s);

        setName(p.name);
        setUsername(p.username);
        setOccupation(p.occupation);
        setAvatarColor(p.avatarColor);
        setHomeLocationId(p.homeLocationId);
        setPreferences(p.preferences);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);

      const updatedProfile = await userService.updateProfile({
        name,
        username,
        occupation,
        avatarColor,
        homeLocationId,
      });

      const updatedPrefs = await userService.updatePreferences(preferences);

      setProfile(updatedProfile);
      setPreferences(updatedPrefs);
      setFeedback({ type: "success", message: "Perfil e preferências atualizados com sucesso!" });
    } catch (err) {
      setFeedback({ type: "error", message: (err as Error).message || "Falha ao atualizar perfil." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#8c7d75]">
        Carregando dados do colono...
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#e2602c]/20 flex items-center justify-center text-[#f28b44]">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Perfil do Passageiro</h1>
          <p className="text-sm text-[#8c7d75]">
            Dados de registro e configurações de viagem na colônia Nova Acidália.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Estatísticas do Colono */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Card variant="solid" className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e2602c]/15 text-[#f28b44] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#8c7d75] uppercase font-semibold block">
                Viagens Realizadas
              </span>
              <span className="text-xl font-black text-white">{stats.completedRides}</span>
            </div>
          </Card>

          <Card variant="solid" className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#8c7d75] uppercase font-semibold block">
                Total Investido
              </span>
              <span className="text-xl font-black text-white">
                {formatCredits(stats.totalSpent)}
              </span>
            </div>
          </Card>

          <Card variant="solid" className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#8c7d75] uppercase font-semibold block">
                Distância Total
              </span>
              <span className="text-xl font-black text-white">
                {formatDistanceKm(stats.totalDistanceKm)}
              </span>
            </div>
          </Card>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Dados Básicos */}
        <Card variant="glass" className="p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#e2602c]" />
            Identificação em Marte
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
            <Avatar name={name || "User"} color={avatarColor} size="xl" />
            <div>
              <span className="text-xs text-[#8c7d75] block mb-2 font-medium">
                Cor do Avatar Holográfico
              </span>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      avatarColor === c ? "ring-2 ring-white scale-110" : "opacity-75 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Nome de Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="E-mail de Acesso"
              value={profile.email}
              disabled
              helperText="E-mail fixo registrado pelo terminal"
            />
            <Input
              label="Ocupação na Colônia"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#c4b5ad] block mb-1.5">
              Local de Residência Habitual
            </label>
            <select
              value={homeLocationId}
              onChange={(e) => setHomeLocationId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#181311] border border-[#332621] text-xs text-[#f4ede6] outline-none focus:border-[#e2602c] cursor-pointer"
            >
              {LOCATIONS_SEED.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-[#181311]">
                  {loc.name} ({loc.district})
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Preferências de Viagem para o Motorista de IA */}
        <Card variant="glass" className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#f28b44]" />
              Preferências de Cabine & Motorista de IA
            </h2>
            <span className="text-[11px] text-[#8c7d75]">
              Essas preferências orientam a IA do motorista
            </span>
          </div>

          {/* Nível de Conversa */}
          <div>
            <label className="text-xs font-semibold text-[#c4b5ad] block mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#e2602c]" />
              Estilo de Conversa do Motorista
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(["chatty", "balanced", "quiet"] as ConversationLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPreferences({ ...preferences, conversationLevel: level })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    preferences.conversationLevel === level
                      ? "bg-[#e2602c]/20 border-[#e2602c] text-white"
                      : "bg-[#181311] border-[#2e2320] text-[#a89990] hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block">
                    {CONVERSATION_LEVEL_LABEL[level]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Música na Cabine */}
          <div>
            <label className="text-xs font-semibold text-[#c4b5ad] block mb-2 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#e2602c]" />
              Ambiente Sonoro / Música
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["ambient", "synthwave", "classical", "silence"] as MusicPreference[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPreferences({ ...preferences, music: m })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    preferences.music === m
                      ? "bg-[#e2602c]/20 border-[#e2602c] text-white"
                      : "bg-[#181311] border-[#2e2320] text-[#a89990] hover:text-white"
                  }`}
                >
                  <span className="text-xs font-medium block">{MUSIC_LABEL[m]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Temperatura da Cabine */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#c4b5ad] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#e2602c]" />
                Temperatura da Cabine
              </label>
              <span className="text-sm font-bold text-[#f28b44]">
                {preferences.cabinTemperature}°C
              </span>
            </div>
            <input
              type="range"
              min={18}
              max={25}
              value={preferences.cabinTemperature}
              onChange={(e) =>
                setPreferences({ ...preferences, cabinTemperature: Number(e.target.value) })
              }
              className="w-full accent-[#e2602c] cursor-pointer"
            />
          </div>

          {/* Embarque com Acessibilidade */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
            <div>
              <span className="text-xs font-bold text-white block">Embarque Acessível</span>
              <span className="text-[11px] text-[#8c7d75] block">
                Solicita preferencialmente rovers com rampa adaptada.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.accessibleBoarding}
              onChange={(e) =>
                setPreferences({ ...preferences, accessibleBoarding: e.target.checked })
              }
              className="w-4 h-4 accent-[#e2602c] cursor-pointer"
            />
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
