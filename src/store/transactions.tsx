import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export type TipoTransacao = "receita" | "despesa";
export type FormaPagamento = "PIX" | "Débito" | "Crédito" | "Dinheiro" | "Transferência" | "Boleto" | "Outro";

export interface Transaction {
  id: string;
  tipo: TipoTransacao;
  titulo: string;
  valor: number;
  categoria: string;
  data: string;
  forma_pagamento?: FormaPagamento;
  parcelado?: boolean;
  numero_parcelas?: number;
  parcela_atual?: number;
  recorrente?: boolean;
  observacao?: string;
  created_at: string;
}

export const CATEGORIAS = [
  "Meus Mimos",
  "Transporte",
  "Alimentação",
  "Streaming",
  "Presentes",
  "Investimentos",
  "Salário",
  "Freelance",
  "Outros",
];

interface Ctx {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (t: Omit<Transaction, "id" | "created_at">) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

const TransactionsContext = createContext<Ctx | null>(null);

type DbRow = {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number | string;
  categoria: string;
  data: string;
  observacoes: string | null;
  forma_pagamento: string | null;
  parcelado: boolean | null;
  numero_parcelas: number | null;
  parcela_atual: number | null;
  recorrente: boolean | null;
  created_at: string;
};

const fromDb = (r: DbRow): Transaction => ({
  id: r.id,
  tipo: r.tipo,
  titulo: r.descricao,
  valor: Number(r.valor),
  categoria: r.categoria,
  data: r.data,
  observacao: r.observacoes ?? undefined,
  forma_pagamento: (r.forma_pagamento as FormaPagamento | null) ?? undefined,
  parcelado: r.parcelado ?? false,
  numero_parcelas: r.numero_parcelas ?? undefined,
  parcela_atual: r.parcela_atual ?? undefined,
  recorrente: r.recorrente ?? false,
  created_at: r.created_at,
});

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar transações.");
      return;
    }
    setTransactions((data as DbRow[]).map(fromDb));
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addTransaction: Ctx["addTransaction"] = async (t) => {
    if (!user) {
      toast.error("Faça login para registrar transações.");
      return;
    }
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        tipo: t.tipo,
        descricao: t.titulo,
        valor: t.valor,
        categoria: t.categoria,
        data: t.data,
        observacoes: t.observacao ?? null,
        forma_pagamento: t.forma_pagamento ?? null,
        parcelado: !!t.parcelado,
        numero_parcelas: t.parcelado ? t.numero_parcelas ?? null : null,
        parcela_atual: t.parcelado ? t.parcela_atual ?? null : null,
        recorrente: !!t.recorrente,
      })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao salvar transação.");
      return;
    }
    setTransactions((prev) => [fromDb(data as DbRow), ...prev]);
  };

  const removeTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover transação.");
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTransaction: Ctx["updateTransaction"] = async (id, patch) => {
    const dbPatch: TablesUpdate<"transactions"> = {};
    if (patch.tipo !== undefined) dbPatch.tipo = patch.tipo;
    if (patch.titulo !== undefined) dbPatch.descricao = patch.titulo;
    if (patch.valor !== undefined) dbPatch.valor = patch.valor;
    if (patch.categoria !== undefined) dbPatch.categoria = patch.categoria;
    if (patch.data !== undefined) dbPatch.data = patch.data;
    if (patch.observacao !== undefined) dbPatch.observacoes = patch.observacao ?? null;
    if (patch.forma_pagamento !== undefined) dbPatch.forma_pagamento = patch.forma_pagamento ?? null;
    if (patch.parcelado !== undefined) dbPatch.parcelado = patch.parcelado;
    if (patch.numero_parcelas !== undefined) dbPatch.numero_parcelas = patch.numero_parcelas ?? null;
    if (patch.parcela_atual !== undefined) dbPatch.parcela_atual = patch.parcela_atual ?? null;
    if (patch.recorrente !== undefined) dbPatch.recorrente = patch.recorrente;

    const { data, error } = await supabase
      .from("transactions")
      .update(dbPatch)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast.error("Erro ao atualizar transação.");
      return;
    }
    setTransactions((prev) => prev.map((t) => (t.id === id ? fromDb(data as DbRow) : t)));
  };

  const { totalReceitas, totalDespesas } = useMemo(() => {
    let r = 0, d = 0;
    for (const t of transactions) {
      if (t.tipo === "receita") r += t.valor;
      else d += t.valor;
    }
    return { totalReceitas: r, totalDespesas: d };
  }, [transactions]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        loading,
        addTransaction,
        removeTransaction,
        updateTransaction,
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions deve ser usado dentro de TransactionsProvider");
  return ctx;
};

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDateBR = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
};

export const formatDateShort = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
};
