export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_keys: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_type: string
          completed_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          started_at: string | null
          status: string
          supplier_id: string | null
        }
        Insert: {
          automation_type: string
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          supplier_id?: string | null
        }
        Update: {
          automation_type?: string
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          supplier_id?: string | null
        }
        Relationships: []
      }
      carts: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crypto_payments: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string | null
          payin_extra_id: string | null
          payin_hash: string | null
          payment_id: string
          payment_status: string
          payout_extra_id: string | null
          payout_hash: string | null
          price_amount: number
          price_currency: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string | null
          payin_extra_id?: string | null
          payin_hash?: string | null
          payment_id: string
          payment_status?: string
          payout_extra_id?: string | null
          payout_hash?: string | null
          price_amount: number
          price_currency?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string | null
          payin_extra_id?: string | null
          payin_hash?: string | null
          payment_id?: string
          payment_status?: string
          payout_extra_id?: string | null
          payout_hash?: string | null
          price_amount?: number
          price_currency?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crypto_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_preferences: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          locale: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          locale?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          locale?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          carrier: string | null
          cj_order_id: string | null
          created_at: string | null
          currency: string
          fulfillment_status: string | null
          id: string
          items: Json
          order_number: string
          payment_status: string
          shipping_address: Json | null
          shopify_order_id: string | null
          status: string
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          carrier?: string | null
          cj_order_id?: string | null
          created_at?: string | null
          currency?: string
          fulfillment_status?: string | null
          id?: string
          items: Json
          order_number: string
          payment_status?: string
          shipping_address?: Json | null
          shopify_order_id?: string | null
          status?: string
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          carrier?: string | null
          cj_order_id?: string | null
          created_at?: string | null
          currency?: string
          fulfillment_status?: string | null
          id?: string
          items?: Json
          order_number?: string
          payment_status?: string
          shipping_address?: Json | null
          shopify_order_id?: string | null
          status?: string
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cj_product_id: string
          created_at: string
          description: string | null
          final_price: number | null
          id: string
          images: Json
          markup_multiplier: number
          stock_status: string | null
          supplier: string | null
          supplier_cost: number
          supplier_sku: string | null
          title: string
          updated_at: string
          variants: Json
        }
        Insert: {
          category?: string | null
          cj_product_id: string
          created_at?: string
          description?: string | null
          final_price?: number | null
          id?: string
          images?: Json
          markup_multiplier?: number
          stock_status?: string | null
          supplier?: string | null
          supplier_cost: number
          supplier_sku?: string | null
          title: string
          updated_at?: string
          variants?: Json
        }
        Update: {
          category?: string | null
          cj_product_id?: string
          created_at?: string
          description?: string | null
          final_price?: number | null
          id?: string
          images?: Json
          markup_multiplier?: number
          stock_status?: string | null
          supplier?: string | null
          supplier_cost?: number
          supplier_sku?: string | null
          title?: string
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplier_credentials: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          locale: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          supplier_type: string
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
          user_nick: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          locale?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          supplier_type: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          user_nick?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          locale?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          supplier_type?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          user_nick?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
