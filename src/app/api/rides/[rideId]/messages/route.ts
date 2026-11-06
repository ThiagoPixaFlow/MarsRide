import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { MARS_FACTS } from "@/mocks/data/mars-facts";
import { pickRandom } from "@/lib/random";
import { createId } from "@/lib/id";

export async function GET(
  _request: Request,
  props: { params: Promise<{ rideId: string }> }
) {
  try {
    const { rideId } = await props.params;

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data: messages, error } = await supabase
          .from("ride_messages")
          .select("*")
          .eq("ride_id", rideId)
          .order("created_at", { ascending: true });

        if (!error && messages) {
          return NextResponse.json({
            success: true,
            data: messages.map((m) => ({
              id: m.id,
              rideId: m.ride_id,
              sender: m.sender_type,
              content: m.content,
              createdAt: m.created_at,
            })),
          });
        }
      }
    }

    mockStorage.init();
    const messages = mockStorage.getMessages(rideId);
    return NextResponse.json({ success: true, data: messages });
  } catch (err) {
    console.error("Erro em /api/rides/[rideId]/messages GET:", err);
    return NextResponse.json({ success: false, error: "Erro ao buscar mensagens." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ rideId: string }> }
) {
  try {
    const { rideId } = await props.params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "Mensagem vazia." }, { status: 400 });
    }

    const cleanContent = content.trim();
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      if (supabase) {
        // Insere a mensagem do passageiro
        const { data: userMsg, error: userMsgError } = await supabase
          .from("ride_messages")
          .insert({
            ride_id: rideId,
            sender_type: "passenger",
            content: cleanContent,
          })
          .select()
          .single();

        if (userMsgError) throw userMsgError;

        // Gera resposta contextual do motorista (Fase 2 mock contextual antes da LLM na Fase 3)
        const { data: ride } = await supabase
          .from("rides")
          .select("driver_id, status")
          .eq("id", rideId)
          .single();

        const driver = DRIVERS_SEED.find((d) => d.id === ride?.driver_id) ?? DRIVERS_SEED[0];
        const replyText = generateContextualReply(driver, cleanContent);

        const { data: driverMsg } = await supabase
          .from("ride_messages")
          .insert({
            ride_id: rideId,
            sender_type: "driver",
            content: replyText,
          })
          .select()
          .single();

        return NextResponse.json({
          success: true,
          data: {
            userMessage: {
              id: userMsg.id,
              rideId: userMsg.ride_id,
              sender: userMsg.sender_type,
              content: userMsg.content,
              createdAt: userMsg.created_at,
            },
            driverMessage: driverMsg
              ? {
                  id: driverMsg.id,
                  rideId: driverMsg.ride_id,
                  sender: driverMsg.sender_type,
                  content: driverMsg.content,
                  createdAt: driverMsg.created_at,
                }
              : null,
          },
        });
      }
    }

    mockStorage.init();
    const passengerMsg = {
      id: createId("msg"),
      rideId,
      sender: "passenger" as const,
      content: cleanContent,
      createdAt: nowIso,
      status: "sent" as const,
      attachment: null,
    };
    mockStorage.saveMessage(passengerMsg);

    const ride = mockStorage.getRideById(rideId);
    const driver = DRIVERS_SEED.find((d) => d.id === ride?.driverId) ?? DRIVERS_SEED[0];
    const replyText = generateContextualReply(driver, cleanContent);

    const driverMsg = {
      id: createId("msg"),
      rideId,
      sender: "driver" as const,
      content: replyText,
      createdAt: new Date().toISOString(),
      status: "read" as const,
      attachment: null,
    };
    mockStorage.saveMessage(driverMsg);

    return NextResponse.json({
      success: true,
      data: {
        userMessage: passengerMsg,
        driverMessage: driverMsg,
      },
    });
  } catch (err) {
    console.error("Erro em /api/rides/[rideId]/messages POST:", err);
    return NextResponse.json({ success: false, error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}

function generateContextualReply(driver: (typeof DRIVERS_SEED)[0], text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("curiosidade") || lower.includes("fato") || lower.includes("marte")) {
    const fact = pickRandom(MARS_FACTS) ?? "A atmosfera de Marte é composta por 95% de dióxido de carbono.";
    return `${driver.name}: Sabia que ${fact.toLowerCase()}`;
  }
  if (lower.includes("tempo") || lower.includes("estimativa") || lower.includes("cheg")) {
    return `${driver.name}: Nossos sensores indicam rota livre e navegação estabilizada. Chegaremos logo!`;
  }
  if (lower.includes("música") || lower.includes("som")) {
    return `${driver.name}: Sintonizando frequências de áudio ambiente dos habitats de Acidália nos autofalantes da cabine.`;
  }
  return `${driver.name}: Recebido! ${driver.persona.conversationStyle}. ${driver.persona.catchphrase}`;
}
