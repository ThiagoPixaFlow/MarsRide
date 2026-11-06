import type { ISODateString } from "@/types/common";

export type MessageSender = "passenger" | "driver" | "system";

/** Estados persistidos. "sending" e "failed" existem apenas na interface. */
export type MessageDeliveryStatus = "sent" | "read";

export type SuggestionState = "pending" | "accepted" | "declined" | "expired";

export interface StopSuggestionAttachment {
  kind: "stop_suggestion";
  locationId: string;
  price: number;
  extraDurationMin: number;
  state: SuggestionState;
}

export type MessageAttachment = StopSuggestionAttachment;

export interface RideMessage {
  id: string;
  rideId: string;
  sender: MessageSender;
  content: string;
  createdAt: ISODateString;
  status: MessageDeliveryStatus;
  attachment: MessageAttachment | null;
}

