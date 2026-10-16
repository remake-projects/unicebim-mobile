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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      fixed_expenses: {
        Row: {
          amount: number
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          currency: string
          full_name: string | null
          id: string
          locale: string
          meal_price: number | null
          monthly_budget_goal: number | null
          monthly_fixed_expenses: number | null
          next_income_date: string | null
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          currency?: string
          full_name?: string | null
          id: string
          locale?: string
          meal_price?: number | null
          monthly_budget_goal?: number | null
          monthly_fixed_expenses?: number | null
          next_income_date?: string | null
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          currency?: string
          full_name?: string | null
          id?: string
          locale?: string
          meal_price?: number | null
          monthly_budget_goal?: number | null
          monthly_fixed_expenses?: number | null
          next_income_date?: string | null
          timezone?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          count: number
          key: string
        }
        Insert: {
          bucket: string
          count?: number
          key: string
        }
        Update: {
          bucket?: string
          count?: number
          key?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          currency: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          next_renewal_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          next_renewal_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          next_renewal_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          date: string
          description: string | null
          id: string
          import_hash: string | null
          kind: string
          order: number | null
          transfer_group_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          category: string
          date?: string
          description?: string | null
          id?: string
          import_hash?: string | null
          kind?: string
          order?: number | null
          transfer_group_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          date?: string
          description?: string | null
          id?: string
          import_hash?: string | null
          kind?: string
          order?: number | null
          transfer_group_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          is_paid: boolean
          name: string
          paid_at: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          is_paid?: boolean
          name: string
          paid_at?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          name?: string
          paid_at?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upcoming_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upcoming_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      delete_transfer: {
        Args: { p_transfer_group_id: string }
        Returns: undefined
      }
      get_expense_category_totals: {
        Args: { p_end: string; p_start: string }
        Returns: {
          category: string
          total: number
        }[]
      }
      get_monthly_subscriptions_total: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_monthly_summary: {
        Args: { p_end: string; p_start: string; p_wallet_id?: string }
        Returns: {
          expense_total: number
          fixed_expenses_paid: number
          income_total: number
          net_total: number
        }[]
      }
      get_monthly_trends: {
        Args: { p_months: number; p_tz: string }
        Returns: {
          expense_total: number
          income_total: number
          month: string
        }[]
      }
      get_transactions_page: {
        Args: {
          p_cursor_date?: string
          p_cursor_id?: string
          p_end: string
          p_limit: number
          p_start: string
        }
        Returns: {
          amount: number
          category: string
          date: string
          description: string
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }[]
      }
      get_unpaid_upcoming_payments_total: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_upcoming_payments_with_analysis: {
        Args: { p_user_id?: string }
        Returns: {
          amount: number
          created_at: string
          days_until_due: number
          due_date: string
          id: string
          is_paid: boolean
          name: string
          paid_at: string
          total_unpaid_amount: number
          updated_at: string
        }[]
      }
      get_upcoming_subscription_renewals: {
        Args: { p_days_ahead?: number; p_user_id?: string }
        Returns: {
          amount: number
          billing_cycle: string
          currency: string
          days_until_renewal: number
          icon_url: string
          id: string
          name: string
          next_renewal_date: string
        }[]
      }
      import_transactions: {
        Args: { p_final_balance?: number; p_rows: Json; p_wallet_id: string }
        Returns: {
          inserted: number
          skipped: number
        }[]
      }
      is_valid_timezone: { Args: { p_tz: string }; Returns: boolean }
      mark_payment_paid: {
        Args: {
          p_category?: string
          p_date?: string
          p_payment_id: string
          p_wallet_id: string
        }
        Returns: string
      }
      set_default_wallet: { Args: { p_wallet_id: string }; Returns: undefined }
      transfer_between_wallets: {
        Args: {
          p_amount: number
          p_date: string
          p_description?: string
          p_from_wallet_id: string
          p_to_wallet_id: string
        }
        Returns: string
      }
      unmark_payment_paid: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      transaction_type: "income" | "expense"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      transaction_type: ["income", "expense"],
    },
  },
} as const
