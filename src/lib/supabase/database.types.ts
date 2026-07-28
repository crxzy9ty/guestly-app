// Hand-written placeholder matching the shape produced by:
//   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
// Regenerate this file for real once the project is linked to a hosted Supabase
// project (see supabase/migrations for the source of truth). Until then, this
// keeps src/lib/supabase/{client,server,admin}.ts type-safe. `Relationships`
// arrays are required by @supabase/postgrest-js's GenericTable/GenericView
// constraints even though we don't hand-author foreign-key metadata here.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "owner" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: AppRole;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      partners: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          question_set_id: string | null;
          alert_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["partners"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["partners"]["Row"]>;
        Relationships: [];
      };
      partner_members: {
        Row: {
          partner_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Pick<Database["public"]["Tables"]["partner_members"]["Row"], "partner_id" | "user_id"> &
          Partial<Database["public"]["Tables"]["partner_members"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["partner_members"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "partner_members_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
      };
      question_sets: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["question_sets"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["question_sets"]["Row"]>;
        Relationships: [];
      };
      question_aspects: {
        Row: {
          id: string;
          question_set_id: string;
          key: string;
          label: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["question_aspects"]["Row"]> & {
          question_set_id: string;
          key: string;
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["question_aspects"]["Row"]>;
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          partner_id: string;
          created_at: string;
          email: string | null;
          prize_id: string | null;
          winner_id: string | null;
          dedup_token: string | null;
          prize_consent_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["submissions"]["Row"]> & { partner_id: string };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Row"]>;
        Relationships: [];
      };
      submission_scores: {
        Row: {
          id: string;
          submission_id: string;
          aspect_key: string;
          score: number;
          reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["submission_scores"]["Row"]> & {
          submission_id: string;
          aspect_key: string;
          score: number;
        };
        Update: Partial<Database["public"]["Tables"]["submission_scores"]["Row"]>;
        Relationships: [];
      };
      demo_requests: {
        Row: {
          id: string;
          name: string;
          email: string;
          business: string;
          message: string | null;
          status: "new" | "contacted" | "closed";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["demo_requests"]["Row"]> & {
          name: string;
          email: string;
          business: string;
        };
        Update: Partial<Database["public"]["Tables"]["demo_requests"]["Row"]>;
        Relationships: [];
      };
      content_settings: {
        Row: {
          id: number;
          content: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["content_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["content_settings"]["Row"]>;
        Relationships: [];
      };
      prize_draws: {
        Row: {
          id: string;
          partner_id: string;
          draw_date: string;
          submission_id: string;
          winner_id: string;
          drawn_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["prize_draws"]["Row"]> & {
          partner_id: string;
          draw_date: string;
          submission_id: string;
          winner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["prize_draws"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      submissions_owner_view: {
        Row: {
          id: string;
          partner_id: string;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_partner_member: {
        Args: { target_partner_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
