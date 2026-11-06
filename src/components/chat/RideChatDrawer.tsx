"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Driver } from "@/modules/drivers/driver.types";
import { RideMessage } from "@/modules/chat/chat.types";
import { chatService } from "@/modules/chat/chat.service";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { formatTime, formatCredits } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Send,
  X,
  Sparkles,
  MapPin,
  Check,
  Ban,
  Bot,
  MessageSquare,
  Volume2,
} from "lucide-react";

interface RideChatDrawerProps {
  rideId: string;
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
  onStopUpdated?: () => void;
}

export function RideChatDrawer({
  rideId,
  driver,
  isOpen,
  onClose,
  onStopUpdated,
}: RideChatDrawerProps) {
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await chatService.getMessages(rideId);
      setMessages(msgs);
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
    }
  }, [rideId]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchMessages();
    }, 0);
    const interval = setInterval(fetchMessages, 1500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isOpen, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? inputValue;
    if (!text.trim() || isSending) return;

    setInputValue("");
    setIsSending(true);

    try {
      await chatService.sendMessage(rideId, text);
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionAction = async (msgId: string, decision: "accept" | "decline") => {
    try {
      await chatService.respondToStopSuggestion(rideId, msgId, decision);
      await fetchMessages();
      if (decision === "accept") {
        onStopUpdated?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const quickPrompts = [
    "Conta uma curiosidade sobre Marte!",
    "Qual a estimativa de chegada?",
    "Como estão as leituras de radiação lá fora?",
    "Sugere um passeio ou parada no caminho?",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 sm:top-20 right-3 sm:right-6 bottom-4 sm:bottom-6 z-40 w-[calc(100%-1.5rem)] sm:w-[410px] max-h-[620px] mars-glass-card border border-[#e2602c]/35 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in slide-in-from-right-8 fade-in-0 duration-300">
      {/* Header do Balão Flutuante */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#181210] to-[#120e0d]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              name={driver.name}
              image={driver.avatarUrl}
              color={driver.avatar.primary}
              isBot
              size="md"
              className="ring-2 ring-[#e2602c] shadow-lg"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-white tracking-wide">{driver.name}</span>
              <span className="text-[10px] text-[#f28b44] font-medium">· Piloto de IA</span>
            </div>
            {/* Visualizador de Transmissão de Voz */}
            <div className="flex items-center gap-1 text-[10px] text-[#a89990] mt-0.5">
              <Volume2 className="w-3 h-3 text-[#f28b44]" />
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 h-2 bg-[#f28b44] rounded-full animate-pulse" />
                <span className="w-0.5 h-3.5 bg-[#f28b44] rounded-full animate-pulse delay-100" />
                <span className="w-0.5 h-2 bg-[#f28b44] rounded-full animate-pulse delay-200" />
              </div>
              <span className="font-mono text-[9px] text-[#8c7d75] ml-1">ComLink Acidália</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Minimizar chat"
          className="p-1.5 rounded-xl text-[#8c7d75] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0d0a09]/80">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#8c7d75] gap-2 p-6">
            <Bot className="w-8 h-8 text-[#e2602c]/50 animate-pulse" />
            <p className="font-medium text-white/80">Conexão neural ativa com {driver.name}</p>
            <p className="text-[11px] text-[#8c7d75] max-w-xs">
              Você pode conversar, perguntar sobre o trajeto e pedir paradas no caminho.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isPassenger = msg.sender === "passenger";
            const isSystem = msg.sender === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-1.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] text-[#8c7d75]">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isPassenger ? "justify-end" : "justify-start"}`}
              >
                {!isPassenger && (
                  <Avatar
                    name={driver.name}
                    image={driver.avatarUrl}
                    color={driver.avatar.primary}
                    isBot
                    size="sm"
                    className="shrink-0 mt-0.5 ring-1 ring-[#e2602c]/50"
                  />
                )}

                <div
                  className={`max-w-[84%] rounded-2xl p-3 text-xs shadow-lg leading-relaxed ${
                    isPassenger
                      ? "bg-gradient-to-r from-[#e2602c] to-[#f28b44] text-white rounded-br-xs"
                      : "bg-[#1c1614] border border-[#332621] text-[#f4ede6] rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Anexo de Sugestão de Parada Turística */}
                  {msg.attachment?.kind === "stop_suggestion" && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-black/50 border border-[#e2602c]/40 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-[#f28b44] font-bold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sugestão de Parada em Marte</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#e2602c] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {LOCATIONS_SEED.find((l) => l.id === msg.attachment?.locationId)?.name}
                          </span>
                          <span className="text-[10px] text-[#a89990]">
                            +{formatCredits(msg.attachment.price)} · +{msg.attachment.extraDurationMin} min de percurso
                          </span>
                        </div>
                      </div>

                      {msg.attachment.state === "pending" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleSuggestionAction(msg.id, "accept")}
                            className="flex-1 py-1 px-2.5 rounded-lg bg-gradient-to-r from-[#e2602c] to-[#f28b44] text-white font-bold text-[11px] flex items-center justify-center gap-1 hover:brightness-110 cursor-pointer shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" /> Aceitar Parada
                          </button>
                          <button
                            onClick={() => handleSuggestionAction(msg.id, "decline")}
                            className="py-1 px-2.5 rounded-lg bg-white/10 text-[#c4b5ad] hover:text-white font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" /> Recusar
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] font-bold text-center py-1 rounded bg-black/30">
                          {msg.attachment.state === "accepted" ? (
                            <span className="text-emerald-400">✓ Parada Inclusa na Rota</span>
                          ) : (
                            <span className="text-[#8c7d75]">Sugestão Dispensada</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] text-right mt-1 font-mono ${
                      isPassenger ? "text-white/60" : "text-[#786c65]"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Atalhos Rápidos com envio direto ao clicar */}
      <div className="px-3 py-2 border-t border-white/5 bg-[#140f0e] flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#e2602c]/20 hover:border-[#e2602c]/40 text-[10px] text-[#c4b5ad] hover:text-white whitespace-nowrap transition-all border border-white/5 cursor-pointer active:scale-95 flex items-center gap-1"
          >
            <MessageSquare className="w-2.5 h-2.5 text-[#f28b44]" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input de Envio */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 border-t border-white/10 bg-[#16110f] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Mensagem para ${driver.name}...`}
          className="flex-1 h-9 px-3 rounded-xl bg-black/50 border border-white/10 text-xs text-[#f4ede6] placeholder:text-[#6a5e57] outline-none focus:border-[#e2602c] transition-colors"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="h-9 px-3"
          disabled={!inputValue.trim() || isSending}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}
