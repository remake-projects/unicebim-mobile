/**
 * Database types for supabase-js, hand-written to match supabase/migrations.
 * Regenerate with `npx supabase gen types typescript --linked > src/data/database.types.ts`
 * once the project is linked; keep the file name so imports stay the same.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TransactionType = 'income' | 'expense';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          monthly_budget_goal: number | null;
          monthly_fixed_expenses: number | null;
          meal_price: number | null;
          next_income_date: string | null;
          avatar_url: string | null;
          currency: string;
          timezone: string;
          locale: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          balance: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          balance?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['wallets']['Insert']>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          amount: number;
          type: TransactionType;
          category: string;
          date: string;
          description: string | null;
          order: number | null;
          kind: 'normal' | 'transfer';
          transfer_group_id: string | null;
          import_hash: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id?: string | null;
          amount: number;
          type: TransactionType;
          category: string;
          date?: string;
          description?: string | null;
          order?: number | null;
        };
        Update: Partial<Omit<Database['public']['Tables']['transactions']['Insert'], 'user_id'>>;
        Relationships: [
          {
            foreignKeyName: 'transactions_wallet_id_fkey';
            columns: ['wallet_id'];
            isOneToOne: false;
            referencedRelation: 'wallets';
            referencedColumns: ['id'];
          },
        ];
      };
      fixed_expenses: {
        Row: { id: string; user_id: string; name: string; amount: number; created_at: string };
        Insert: { id?: string; user_id: string; name: string; amount: number; created_at?: string };
        Update: { name?: string; amount?: number };
        Relationships: [];
      };
      upcoming_payments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          due_date: string;
          is_paid: boolean;
          paid_at: string | null;
          transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; user_id: string; name: string; amount: number; due_date: string };
        Update: { name?: string; amount?: number; due_date?: string };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          currency: string;
          billing_cycle: 'monthly' | 'yearly';
          next_renewal_date: string;
          icon_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          currency?: string;
          billing_cycle?: 'monthly' | 'yearly';
          next_renewal_date: string;
          icon_url?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Omit<Database['public']['Tables']['subscriptions']['Insert'], 'user_id'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_monthly_summary: {
        Args: { p_start: string; p_end: string };
        Returns: { income_total: number; expense_total: number; net_total: number; fixed_expenses_paid: number }[];
      };
      get_expense_category_totals: {
        Args: { p_start: string; p_end: string };
        Returns: { category: string; total: number }[];
      };
      get_monthly_trends: {
        Args: { p_months: number; p_tz: string };
        Returns: { month: string; income_total: number; expense_total: number }[];
      };
      transfer_between_wallets: {
        Args: {
          p_from_wallet_id: string;
          p_to_wallet_id: string;
          p_amount: number;
          p_date: string;
          p_description?: string | null;
        };
        Returns: string;
      };
      delete_transfer: { Args: { p_transfer_group_id: string }; Returns: undefined };
      set_default_wallet: { Args: { p_wallet_id: string }; Returns: undefined };
      mark_payment_paid: {
        Args: { p_payment_id: string; p_wallet_id: string | null; p_date?: string; p_category?: string };
        Returns: string;
      };
      unmark_payment_paid: { Args: { p_payment_id: string }; Returns: undefined };
      import_transactions: {
        Args: { p_wallet_id: string; p_rows: Json; p_final_balance?: number | null };
        Returns: { inserted: number; skipped: number }[];
      };
    };
    Enums: { transaction_type: TransactionType };
    CompositeTypes: { [_ in never]: never };
  };
};
