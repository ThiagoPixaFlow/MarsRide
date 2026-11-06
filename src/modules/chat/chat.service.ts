import { mockStorage } from "@/mocks/storage";
import { RideMessage, StopSuggestionAttachment } from "@/modules/chat/chat.types";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { MARS_FACTS } from "@/mocks/data/mars-facts";
import { PRICING_CONFIG } from "@/config/app.config";
import { ServiceError } from "@/lib/errors";
import { createId } from "@/lib/id";
import { pickRandom } from "@/lib/random";
import { normalizeText } from "@/lib/utils";
import { rideService } from "@/modules/rides/ride.service";

export class ChatService {
  async getMessages(rideId: string): Promise<RideMessage[]> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/messages`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    return mockStorage.getMessages(rideId);
  }

  /**
   * Envia uma mensagem do passageiro e programa a resposta do motorista de IA simulada.
   */
  async sendMessage(rideId: string, content: string): Promise<RideMessage> {
    const cleanContent = content.trim();
    if (!cleanContent) {
      throw new ServiceError("VALIDATION", "A mensagem não pode estar vazia.");
    }

    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: cleanContent }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.userMessage) {
            return json.data.userMessage;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();

    const passengerMsg: RideMessage = {
      id: createId("msg"),
      rideId,
      sender: "passenger",
      content: cleanContent,
      createdAt: new Date().toISOString(),
      status: "sent",
      attachment: null,
    };

    mockStorage.saveMessage(passengerMsg);

    // Dispara resposta automática demonstrativa do motorista após um breve delay
    this.scheduleDriverResponse(rideId, cleanContent);

    return passengerMsg;
  }

  /**
   * Envia mensagem do sistema (ex: eventos de viagem).
   */
  async sendSystemMessage(rideId: string, content: string): Promise<RideMessage> {
    mockStorage.init();
    const sysMsg: RideMessage = {
      id: createId("msg"),
      rideId,
      sender: "system",
      content,
      createdAt: new Date().toISOString(),
      status: "read",
      attachment: null,
    };
    mockStorage.saveMessage(sysMsg);
    return sysMsg;
  }

  /**
   * Responde à sugestão de parada enviada pelo motorista.
   */
  async respondToStopSuggestion(
    rideId: string,
    messageId: string,
    decision: "accept" | "decline"
  ): Promise<void> {
    mockStorage.init();
    const messages = mockStorage.getMessages(rideId);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.attachment || msg.attachment.kind !== "stop_suggestion") {
      throw new ServiceError("NOT_FOUND", "Sugestão de parada não encontrada.");
    }

    const att = msg.attachment;
    if (att.state !== "pending") {
      throw new ServiceError("INVALID_STATE", "Esta sugestão já foi respondida.");
    }

    att.state = decision === "accept" ? "accepted" : "declined";
    mockStorage.saveMessage(msg);

    const stopLoc = LOCATIONS_SEED.find((l) => l.id === att.locationId);
    const stopName = stopLoc?.shortName ?? "o ponto sugerido";

    if (decision === "accept") {
      // Adiciona a parada na corrida
      await rideService.addStop(rideId, att.locationId);

      // Motorista confirma animado
      await this.sendDriverMessage(
        rideId,
        `Perfeito! Rota ajustada. Vamos passar rapidinho em ${stopName}. Vai valer a pena!`
      );
    } else {
      await this.sendDriverMessage(
        rideId,
        `Tranquilo! Seguimos direto para o nosso destino original sem desvios.`
      );
    }
  }

  /**
   * Envia mensagem direta do motorista (pode conter anexo de sugestão).
   */
  async sendDriverMessage(
    rideId: string,
    content: string,
    attachment: StopSuggestionAttachment | null = null
  ): Promise<RideMessage> {
    mockStorage.init();
    const msg: RideMessage = {
      id: createId("msg"),
      rideId,
      sender: "driver",
      content,
      createdAt: new Date().toISOString(),
      status: "sent",
      attachment,
    };
    mockStorage.saveMessage(msg);
    return msg;
  }

  /**
   * Motorista inicia a conversa proativamente quando a viagem começa.
   */
  async triggerWelcomeMessage(rideId: string): Promise<void> {
    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride || !ride.driverId) return;

    const driver = DRIVERS_SEED.find((d) => d.id === ride.driverId);
    if (!driver) return;

    const dest = LOCATIONS_SEED.find((l) => l.id === ride.destinationId)?.shortName ?? "seu destino";

    let greeting = "";
    switch (driver.id) {
      case "drv-marc":
        greeting = `E aí, tudo pronto! Já estamos a caminho de ${dest}. O solo tá bom hoje. Se quiser saber qualquer coisa sobre as trilhas da região, só falar!`;
        break;
      case "drv-nova":
        greeting = `Saudações. Sistemas de navegação calibrados rumo a ${dest}. Telemetria atmosférica estável a -58°C. Estou à disposição para dúvidas científicas sobre Marte.`;
        break;
      case "drv-bolt":
        greeting = `Opa! Pode se ajeitar que o rover é macio. Bora pra ${dest}! Só não vale pedir pra abrir a janela no vácuo, hein? Haha!`;
        break;
      case "drv-elys":
        greeting = `Olá! Seja muito bem-vindo a bordo. Já configurei o clima e o trajeto mais suave para ${dest}. Tenha uma excelente viagem.`;
        break;
      case "drv-kira":
        greeting = `Olá. Respira fundo, a viagem até ${dest} vai ser tranquila e contemplativa. O céu marciano está límpido.`;
        break;
      case "drv-orion":
        greeting = `Cinto conferido? Ótimo. Partindo para ${dest}. Conheço cada pedra desse setor desde os primeiros módulos.`;
        break;
      default:
        greeting = `Olá! Prazer em conduzir você rumo a ${dest}.`;
    }

    await this.sendDriverMessage(rideId, greeting);
  }

  /**
   * Programa a resposta simulada do motorista respeitando sua personalidade.
   */
  private scheduleDriverResponse(rideId: string, userText: string): void {
    setTimeout(async () => {
      try {
        const ride = mockStorage.getRideById(rideId);
        if (!ride || !ride.driverId) return;

        const driver = DRIVERS_SEED.find((d) => d.id === ride.driverId);
        if (!driver) return;

        const dest = LOCATIONS_SEED.find((l) => l.id === ride.destinationId);
        const reply = this.craftMockResponse(driver, dest, userText);

        // Se o passageiro perguntou sobre "parada", "passeio", "café", "lugar", podemos sugerir um POI
        const normalized = normalizeText(userText);
        const wantsSuggestion =
          (normalized.includes("passeio") ||
            normalized.includes("parada") ||
            normalized.includes("sugere") ||
            normalized.includes("visitar") ||
            normalized.includes("conhecer") ||
            normalized.includes("dica") ||
            normalized.includes("cafe")) &&
          ride.stops.length < 2;

        if (wantsSuggestion) {
          // Escolhe um local diferente da origem e destino
          const candidatePOIs = LOCATIONS_SEED.filter(
            (l) => l.id !== ride.originId && l.id !== ride.destinationId && !ride.stops.some((s) => s.locationId === l.id)
          );
          const suggestionPOI = pickRandom(candidatePOIs) ?? LOCATIONS_SEED[1];

          const attachment: StopSuggestionAttachment = {
            kind: "stop_suggestion",
            locationId: suggestionPOI.id,
            price: PRICING_CONFIG.stopFee,
            extraDurationMin: 4,
            state: "pending",
          };

          await this.sendDriverMessage(
            rideId,
            `${reply}\n\nAliás, estamos pertinho de ${suggestionPOI.name}! Gostaria de incluir uma paradinha rápida de 5 min lá?`,
            attachment
          );
        } else {
          await this.sendDriverMessage(rideId, reply);
        }
      } catch (e) {
        console.error("Erro ao gerar resposta do motorista:", e);
      }
    }, 1200);
  }

  private craftMockResponse(
    driver: typeof DRIVERS_SEED[0],
    dest: typeof LOCATIONS_SEED[0] | undefined,
    userText: string
  ): string {
    const text = normalizeText(userText);
    const fact = pickRandom(MARS_FACTS) ?? "o dia em Marte dura 24h e 37min.";

    // 1. Perguntas sobre Marte / curiosidades
    if (text.includes("marte") || text.includes("planeta") || text.includes("fato") || text.includes("curiosidade")) {
      if (driver.id === "drv-nova") {
        return `Um dado astronômico fascinante: você sabia que ${fact} Essa informação é confirmada pela telemetria do Instituto Sagan.`;
      }
      if (driver.id === "drv-bolt") {
        return `Se liga nessa: ${fact} Loucura, né? Aqui em Marte tudo é outro nível!`;
      }
      if (driver.id === "drv-marc") {
        return `Falando em Marte, uma coisa marcante das minhas expedições: ${fact} Andar por esse solo nunca perde a graça!`;
      }
      return `Uma curiosidade interessante sobre nosso planeta: ${fact}`;
    }

    // 2. Perguntas sobre o destino
    if (text.includes("destino") || text.includes("chegar") || text.includes("falta") || text.includes("tempo") || (dest && text.includes(normalizeText(dest.shortName)))) {
      const destFact = dest?.facts ? pickRandom(dest.facts) : null;
      if (driver.id === "drv-nova") {
        return `Estamos a caminho de ${dest?.name ?? "seu destino"}. ${destFact ? `Nota analítica: ${destFact}` : "Tempo estimado de chegada dentro da margem nominal."}`;
      }
      if (driver.id === "drv-elys") {
        return `${dest?.name ?? "Seu destino"} é um local fascinante. ${destFact ?? "Já avistei as estruturas e chegaremos em breve com todo conforto."}`;
      }
      return `Estamos avançando bem em direção a ${dest?.shortName ?? "ao destino"}! ${destFact ? `Você sabia que ${destFact}` : ""}`;
    }

    // 3. Perguntas sobre música / clima / velocidade
    if (text.includes("musica") || text.includes("som") || text.includes("radio")) {
      return `Ajustando a playlist ambiente da cabine. Deixa rolar um synthwave espacial para embalar o trajeto!`;
    }

    if (text.includes("frio") || text.includes("temperatura") || text.includes("ar")) {
      return `Nossa cabine é pressurizada a 1 atmosfera terrestre e mantida em agradáveis 21°C, enquanto lá fora o termômetro marca -64°C.`;
    }

    // 4. Respostas genéricas alinhadas à persona
    switch (driver.id) {
      case "drv-marc":
        return pickRandom([
          "Com certeza! Essa rota é uma das minhas favoritas. O relevo dessa cratera rende belas fotos.",
          "Exatamente! Já rodei muitos quilômetros por aqui e a vista nunca cansa.",
          "Bora nessa! Qualquer coisa que avistar de curioso lá fora, me avisa que eu comento!",
        ])!;
      case "drv-nova":
        return pickRandom([
          "Análise precisa. A gravidade de 0.38g e a pressão rarefeita mudam completamente a dinâmica aqui.",
          "De acordo com nossos sensores de bordo, as condições de navegação continuam 100% otimizadas.",
          "Interessante observação. A astrobiologia e a engenharia marciana nos surpreendem todos os dias.",
        ])!;
      case "drv-bolt":
        return pickRandom([
          "Haha, boa! Se a gente trombar com um marciano de três olhos no caminho, prometo que buzino!",
          "Pode crer! O rover tá no grau e a rota tá lisinha.",
          "Segura a empolgação que o piloto automático tá caprichando na curva!",
        ])!;
      case "drv-elys":
        return pickRandom([
          "Com certeza. É sempre uma honra proporcionar uma viagem tão agradável aos nossos colonos.",
          "Perfeito. O ambiente interno foi pensado exatamente para o seu descanso e contemplação.",
          "Uma colocação de extremo bom gosto. A arquitetura de Nova Acidália é admirável.",
        ])!;
      case "drv-kira":
        return pickRandom([
          "É muito bom poder desacelerar um pouco e observar a vastidão marciana com serenidade.",
          "Com certeza. Cuidar de cada detalhe do caminho nos traz equilíbrio.",
          "Concordo plenamente. A harmonia entre tecnologia e vida aqui em Marte é mágica.",
        ])!;
      case "drv-orion":
        return pickRandom([
          "Você tem toda razão. Nos primeiros sols nós nem tínhamos essas estradas pavimentadas com basalto fundido.",
          "Isso mesmo, rapaz. Quem viu essa colônia nascer dá valor a cada avanço.",
          "Confiabilidade em primeiro lugar. Esse modelo de rover nunca me deixou na mão.",
        ])!;
      default:
        return "Entendido! Seguindo com tranquilidade na rota.";
    }
  }
}

export const chatService = new ChatService();
