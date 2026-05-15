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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          claimed_at: string | null
          claimed_user_id: string | null
          created_at: string
          email: string
          granted_at: string
          granted_by: string | null
          id: string
          note: string | null
          plan_type: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_user_id?: string | null
          created_at?: string
          email: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          plan_type?: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_user_id?: string | null
          created_at?: string
          email?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          plan_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          ativo: boolean
          banco: string
          bandeira: string | null
          cor: string | null
          created_at: string
          dia_fechamento: number | null
          dia_vencimento: number | null
          id: string
          limite: number | null
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          banco: string
          bandeira?: string | null
          cor?: string | null
          created_at?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          id?: string
          limite?: number | null
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          banco?: string
          bandeira?: string | null
          cor?: string | null
          created_at?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          id?: string
          limite?: number | null
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          cor: string | null
          created_at: string
          data_alvo: string | null
          id: string
          nome: string
          observacao: string | null
          status: string
          updated_at: string
          user_id: string
          valor_atual: number
          valor_objetivo: number
        }
        Insert: {
          cor?: string | null
          created_at?: string
          data_alvo?: string | null
          id?: string
          nome: string
          observacao?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor_atual?: number
          valor_objetivo: number
        }
        Update: {
          cor?: string | null
          created_at?: string
          data_alvo?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor_atual?: number
          valor_objetivo?: number
        }
        Relationships: []
      }
      installment_payments: {
        Row: {
          created_at: string
          data_pagamento: string
          id: string
          installment_id: string
          parcela_numero: number
          transaction_id: string | null
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string
          id?: string
          installment_id: string
          parcela_numero: number
          transaction_id?: string | null
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string
          id?: string
          installment_id?: string
          parcela_numero?: number
          transaction_id?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      installments: {
        Row: {
          cartao_id: string | null
          categoria: string | null
          created_at: string
          data_inicio: string
          id: string
          nome: string
          parcela_atual: number
          proxima_cobranca: string
          status: string
          total_parcelas: number
          updated_at: string
          user_id: string
          valor_parcela: number
          valor_total: number
        }
        Insert: {
          cartao_id?: string | null
          categoria?: string | null
          created_at?: string
          data_inicio: string
          id?: string
          nome: string
          parcela_atual?: number
          proxima_cobranca: string
          status: string
          total_parcelas: number
          updated_at?: string
          user_id: string
          valor_parcela: number
          valor_total: number
        }
        Update: {
          cartao_id?: string | null
          categoria?: string | null
          created_at?: string
          data_inicio?: string
          id?: string
          nome?: string
          parcela_atual?: number
          proxima_cobranca?: string
          status?: string
          total_parcelas?: number
          updated_at?: string
          user_id?: string
          valor_parcela?: number
          valor_total?: number
        }
        Relationships: []
      }
      investments: {
        Row: {
          created_at: string
          data_investimento: string
          id: string
          nome: string
          observacao: string | null
          rentabilidade: number | null
          tipo: string
          updated_at: string
          user_id: string
          valor_atual: number | null
          valor_investido: number
        }
        Insert: {
          created_at?: string
          data_investimento: string
          id?: string
          nome: string
          observacao?: string | null
          rentabilidade?: number | null
          tipo: string
          updated_at?: string
          user_id: string
          valor_atual?: number | null
          valor_investido: number
        }
        Update: {
          created_at?: string
          data_investimento?: string
          id?: string
          nome?: string
          observacao?: string | null
          rentabilidade?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_atual?: number | null
          valor_investido?: number
        }
        Relationships: []
      }
      limits: {
        Row: {
          categoria: string
          created_at: string
          data_inicial: string
          id: string
          observacao: string | null
          periodo: string
          updated_at: string
          user_id: string
          valor_limite: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data_inicial: string
          id?: string
          observacao?: string | null
          periodo: string
          updated_at?: string
          user_id: string
          valor_limite: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_inicial?: string
          id?: string
          observacao?: string | null
          periodo?: string
          updated_at?: string
          user_id?: string
          valor_limite?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          dedup_key: string | null
          id: string
          message: string
          read: boolean
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dedup_key?: string | null
          id?: string
          message: string
          read?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          dedup_key?: string | null
          id?: string
          message?: string
          read?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          frequencia: string | null
          hora: string | null
          id: string
          prioridade: string
          recorrente: boolean
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao?: string | null
          frequencia?: string | null
          hora?: string | null
          id?: string
          prioridade: string
          recorrente?: boolean
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          frequencia?: string | null
          hora?: string | null
          id?: string
          prioridade?: string
          recorrente?: boolean
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_charges: {
        Row: {
          created_at: string
          data_pagamento: string | null
          id: string
          mes_referencia: string
          status: string
          subscription_id: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia: string
          status?: string
          subscription_id: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          valor: number
          vencimento: string
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia?: string
          status?: string
          subscription_id?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cartao_id: string | null
          categoria: string | null
          created_at: string
          data_cobranca: string
          forma_pagamento: string | null
          frequencia: string
          id: string
          nome: string
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          cartao_id?: string | null
          categoria?: string | null
          created_at?: string
          data_cobranca: string
          forma_pagamento?: string | null
          frequencia: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          cartao_id?: string | null
          categoria?: string | null
          created_at?: string
          data_cobranca?: string
          forma_pagamento?: string | null
          frequencia?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          prazo: string | null
          prioridade: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          cartao_id: string | null
          categoria: string
          created_at: string
          data: string
          descricao: string
          forma_pagamento: string | null
          id: string
          numero_parcelas: number | null
          observacoes: string | null
          parcela_atual: number | null
          parcelado: boolean
          recorrente: boolean
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          cartao_id?: string | null
          categoria: string
          created_at?: string
          data: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          parcelado?: boolean
          recorrente?: boolean
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          cartao_id?: string | null
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          parcelado?: boolean
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: { Args: { _user_id: string }; Returns: undefined }
      admin_get_user_details: { Args: { _user_id: string }; Returns: Json }
      admin_grant_access: {
        Args: { _email: string; _note?: string; _plan_type?: string }
        Returns: Json
      }
      admin_list_access_grants: {
        Args: never
        Returns: {
          claimed_at: string | null
          claimed_user_id: string | null
          created_at: string
          email: string
          granted_at: string
          granted_by: string | null
          id: string
          note: string | null
          plan_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "access_grants"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_members: {
        Args: never
        Returns: {
          banned_until: string
          created_at: string
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      admin_revoke_access: { Args: { _email: string }; Returns: undefined }
      admin_set_user_banned: {
        Args: { _banned: boolean; _user_id: string }
        Returns: undefined
      }
      claim_access_grant: { Args: never; Returns: Json }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
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
      transaction_type: "receita" | "despesa"
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
      transaction_type: ["receita", "despesa"],
    },
  },
} as const
