export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_configuration: {
        Row: {
          id: string
          updated_at: string
          value: string
        }
        Insert: {
          id: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      analysis_queue: {
        Row: {
          created_at: string
          id: string
          processed: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      analysis_results: {
        Row: {
          created_at: string | null
          id: string
          keywords: string[] | null
          losing_strategy_flags: Json | null
          summary_text: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          losing_strategy_flags?: Json | null
          summary_text?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          losing_strategy_flags?: Json | null
          summary_text?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          id: number
          partnership_id: string | null
          sender_type: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          partnership_id?: string | null
          sender_type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          partnership_id?: string | null
          sender_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      partnerships: {
        Row: {
          created_at: string | null
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: []
      }
      therapy_concepts: {
        Row: {
          added_by: string | null
          alternative_names: string[] | null
          category: string
          created_at: string
          description: string
          examples: string[] | null
          id: string
          name: string
          related_concept_ids: string[] | null
          source_ids: string[] | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          alternative_names?: string[] | null
          category: string
          created_at?: string
          description: string
          examples?: string[] | null
          id?: string
          name: string
          related_concept_ids?: string[] | null
          source_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          alternative_names?: string[] | null
          category?: string
          created_at?: string
          description?: string
          examples?: string[] | null
          id?: string
          name?: string
          related_concept_ids?: string[] | null
          source_ids?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      therapy_sources: {
        Row: {
          added_by: string | null
          author: string
          content_summary: string | null
          created_at: string
          description: string
          full_content: string | null
          id: string
          keywords: string[] | null
          title: string
          type: string
          updated_at: string
          year: number
        }
        Insert: {
          added_by?: string | null
          author: string
          content_summary?: string | null
          created_at?: string
          description: string
          full_content?: string | null
          id?: string
          keywords?: string[] | null
          title: string
          type: string
          updated_at?: string
          year: number
        }
        Update: {
          added_by?: string | null
          author?: string
          content_summary?: string | null
          created_at?: string
          description?: string
          full_content?: string | null
          id?: string
          keywords?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: number
          is_partnered: boolean | null
          partner_code: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: number
          is_partnered?: boolean | null
          partner_code?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: number
          is_partnered?: boolean | null
          partner_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          beingright_value: number | null
          controlling_value: number | null
          created_at: string
          full_text: string | null
          id: string
          keywords: string[] | null
          linked_partner_id: string | null
          message_count: number | null
          partner_code: string | null
          retaliation_value: number | null
          summary_text: string | null
          timestamp: string | null
          unbridledselfexpression_value: number | null
          user_id: string
          withdrawal_value: number | null
        }
        Insert: {
          beingright_value?: number | null
          controlling_value?: number | null
          created_at?: string
          full_text?: string | null
          id?: string
          keywords?: string[] | null
          linked_partner_id?: string | null
          message_count?: number | null
          partner_code?: string | null
          retaliation_value?: number | null
          summary_text?: string | null
          timestamp?: string | null
          unbridledselfexpression_value?: number | null
          user_id: string
          withdrawal_value?: number | null
        }
        Update: {
          beingright_value?: number | null
          controlling_value?: number | null
          created_at?: string
          full_text?: string | null
          id?: string
          keywords?: string[] | null
          linked_partner_id?: string | null
          message_count?: number | null
          partner_code?: string | null
          retaliation_value?: number | null
          summary_text?: string | null
          timestamp?: string | null
          unbridledselfexpression_value?: number | null
          user_id?: string
          withdrawal_value?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
