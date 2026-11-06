export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          username: string | null;
          email: string | null;
          avatar_color: string | null;
          occupation: string | null;
          home_location_id: string | null;
          preferences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          username?: string | null;
          email?: string | null;
          avatar_color?: string | null;
          occupation?: string | null;
          home_location_id?: string | null;
          preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          username?: string | null;
          email?: string | null;
          avatar_color?: string | null;
          occupation?: string | null;
          home_location_id?: string | null;
          preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          id: string;
          wallet_id: string;
          ride_id: string | null;
          type: "initial_credit" | "ride_debit" | "promo_credit" | "refund" | "topup";
          amount: number;
          balance_after: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          ride_id?: string | null;
          type: "initial_credit" | "ride_debit" | "promo_credit" | "refund" | "topup";
          amount: number;
          balance_after: number;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_id?: string;
          ride_id?: string | null;
          type?: "initial_credit" | "ride_debit" | "promo_credit" | "refund" | "topup";
          amount?: number;
          balance_after?: number;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          type: string;
          district: string;
          description: string;
          map_x: number;
          map_z: number;
          position_y: number;
          highlights: string[] | null;
          facts: string[] | null;
          open_hours: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          short_name: string;
          type: string;
          district?: string;
          description: string;
          map_x: number;
          map_z: number;
          position_y?: number;
          highlights?: string[] | null;
          facts?: string[] | null;
          open_hours?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string;
          type?: string;
          district?: string;
          description?: string;
          map_x?: number;
          map_z?: number;
          position_y?: number;
          highlights?: string[] | null;
          facts?: string[] | null;
          open_hours?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          plate: string;
          model: string;
          category: "go" | "prime";
          capacity: number;
          paint_color: string;
          accent_color: string;
          fleet_status: "active" | "busy" | "maintenance";
          battery_level: number;
          features: string[] | null;
          current_node_id: string;
          map_x: number;
          map_z: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          plate: string;
          model: string;
          category: "go" | "prime";
          capacity?: number;
          paint_color: string;
          accent_color: string;
          fleet_status?: "active" | "busy" | "maintenance";
          battery_level?: number;
          features?: string[] | null;
          current_node_id: string;
          map_x?: number;
          map_z?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plate?: string;
          model?: string;
          category?: "go" | "prime";
          capacity?: number;
          paint_color?: string;
          accent_color?: string;
          fleet_status?: "active" | "busy" | "maintenance";
          battery_level?: number;
          features?: string[] | null;
          current_node_id?: string;
          map_x?: number;
          map_z?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          name: string;
          title: string;
          personality_summary: string;
          traits: string[];
          bio: string;
          specialty: string;
          rating: number;
          completed_trips: number;
          sols_on_mars: number;
          avatar_url: string;
          system_prompt: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          title: string;
          personality_summary: string;
          traits?: string[];
          bio: string;
          specialty: string;
          rating?: number;
          completed_trips?: number;
          sols_on_mars?: number;
          avatar_url: string;
          system_prompt: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          title?: string;
          personality_summary?: string;
          traits?: string[];
          bio?: string;
          specialty?: string;
          rating?: number;
          completed_trips?: number;
          sols_on_mars?: number;
          avatar_url?: string;
          system_prompt?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      rides: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string | null;
          driver_id: string | null;
          origin_id: string;
          destination_id: string;
          category: "go" | "prime";
          status:
            | "searching_driver"
            | "awaiting_approval"
            | "approaching_pickup"
            | "boarding"
            | "in_progress"
            | "completed"
            | "cancelled"
            | "no_driver_available";
          estimated_price: number;
          final_price: number | null;
          estimated_duration_min: number;
          distance_km: number;
          approach_route: Json | null;
          trip_route: Json;
          scenario_seed: number;
          requested_at: string;
          approved_at: string | null;
          pickup_eta: string | null;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id?: string | null;
          driver_id?: string | null;
          origin_id: string;
          destination_id: string;
          category: "go" | "prime";
          status?:
            | "searching_driver"
            | "awaiting_approval"
            | "approaching_pickup"
            | "boarding"
            | "in_progress"
            | "completed"
            | "cancelled"
            | "no_driver_available";
          estimated_price: number;
          final_price?: number | null;
          estimated_duration_min: number;
          distance_km: number;
          approach_route?: Json | null;
          trip_route: Json;
          scenario_seed?: number;
          requested_at?: string;
          approved_at?: string | null;
          pickup_eta?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vehicle_id?: string | null;
          driver_id?: string | null;
          origin_id?: string;
          destination_id?: string;
          category?: "go" | "prime";
          status?:
            | "searching_driver"
            | "awaiting_approval"
            | "approaching_pickup"
            | "boarding"
            | "in_progress"
            | "completed"
            | "cancelled"
            | "no_driver_available";
          estimated_price?: number;
          final_price?: number | null;
          estimated_duration_min?: number;
          distance_km?: number;
          approach_route?: Json | null;
          trip_route?: Json;
          scenario_seed?: number;
          requested_at?: string;
          approved_at?: string | null;
          pickup_eta?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ride_candidate_attempts: {
        Row: {
          id: string;
          ride_id: string;
          driver_id: string;
          vehicle_id: string;
          status: "presented" | "approved" | "declined";
          presented_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          ride_id: string;
          driver_id: string;
          vehicle_id: string;
          status?: "presented" | "approved" | "declined";
          presented_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          ride_id?: string;
          driver_id?: string;
          vehicle_id?: string;
          status?: "presented" | "approved" | "declined";
          presented_at?: string;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      ride_events: {
        Row: {
          id: string;
          ride_id: string;
          event_type: string;
          title: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ride_id: string;
          event_type: string;
          title: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ride_id?: string;
          event_type?: string;
          title?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ride_messages: {
        Row: {
          id: string;
          ride_id: string;
          sender_type: "passenger" | "driver" | "system";
          content: string;
          attachment: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ride_id: string;
          sender_type: "passenger" | "driver" | "system";
          content: string;
          attachment?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ride_id?: string;
          sender_type?: "passenger" | "driver" | "system";
          content?: string;
          attachment?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ride_stops: {
        Row: {
          id: string;
          ride_id: string;
          location_id: string;
          status: "pending" | "accepted" | "declined";
          price: number;
          extra_duration_min: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          ride_id: string;
          location_id: string;
          status?: "pending" | "accepted" | "declined";
          price?: number;
          extra_duration_min?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          ride_id?: string;
          location_id?: string;
          status?: "pending" | "accepted" | "declined";
          price?: number;
          extra_duration_min?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
