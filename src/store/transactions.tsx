import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import {
  enqueue,
  readCache,
  replaceCache,
  upsertCache,
  removeFromCache,
} from "@/lib/offline/db";
import { isOnline, useOnlineStatus } from "@/lib/offline/network";
import { onSynced } from "@/lib/offline/sync";

export type TipoTransacao = "receita" | "despesa";
export type FormaPagamento = "PIX" | "Dinheiro" | "Cartão";

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
  cartao_id?: string | null;
  created_at: string;
  /** True quando criada offline e ainda não sincronizada. */
  _pending?: boolean;
}

type NewTransactionInput = Omit<Transaction, "id" | "created_at" | "_pending">;

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
  addTransaction: (t: NewTransactionInput) => Promise<void>;
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
  cartao_id: string | null;
  created_at: string;
};

const fromDb = (r: DbRow, pending = false): Transaction => ({
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
  cartao_id: r.cartao_id ?? null,
  created_at: r.created_at,
  _pending: pending || undefined,
});

const buildInsertPayload = (userId: string, id: string, t: NewTransactionInput) => ({
  id,
  user_id: userId,
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
  cartao_id: t.cartao_id ?? null,
});

const sortTx = (a: Transaction, b: Transaction) =>
  a.data === b.data ? b.created_at.localeCompare(a.created_at) : b.data.localeCompare(a.data);

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  useOnlineStatus(); // re-render em mudança de rede

  const refetch = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    // 1. Sempre tenta carregar do cache primeiro (UX instantânea + offline)
    const cached = await readCache<DbRow & { _pending?: boolean }>(user.id, "transactions");
    if (cached.length > 0) {
      const mapped = cached
        .map((c) => fromDb(c.data as DbRow, !!c.pending))
        .sort(sortTx);
      setTransactions(mapped);
    }

    if (!isOnline()) {
      if (cached.length === 0) setTransactions([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      // Falha de rede — mantém cache
      return;
    }
    const rows = (data as DbRow[]) ?? [];
    setTransactions(rows.map((r) => fromDb(r)));
    // Espelha para cache
    await replaceCache(user.id, "transactions", rows, (r) => r.id);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Refresh ao receber sync
  useEffect(() => {
    if (!user) return;
    const off = onSynced((table) => {
      if (table === "transactions") refetch();
    });
    return () => {
      off();
    };
  }, [user, refetch]);

  const addTransaction: Ctx["addTransaction"] = async (t) => {
    if (!user) {
      toast.error("Faça login para registrar transações.");
      return;
    }

    const id = uuidv4();
    const created_at = new Date().toISOString();
    const payload = buildInsertPayload(user.id, id, t);
    const optimistic: Transaction = { ...t, id, created_at, _pending: !isOnline() };

    // Atualiza UI imediatamente
    setTransactions((prev) => [optimistic, ...prev].sort(sortTx));
    await upsertCache(user.id, "transactions", id, { ...payload, created_at }, !isOnline());

    if (!isOnline()) {
      await enqueue({
        id: uuidv4(),
        userId: user.id,
        table: "transactions",
        op: "insert",
        payload,
      });
      toast.info("Salvo offline. Sincroniza ao voltar a conexão.");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select()
      .single();
    if (error) {
      // Online mas erro — enfileira como pending
      await enqueue({
        id: uuidv4(),
        userId: user.id,
        table: "transactions",
        op: "insert",
        payload,
      });
      setTransactions((prev) => prev.map((x) => (x.id === id ? { ...x, _pending: true } : x)));
      toast.warning("Erro ao salvar. Tentaremos novamente.");
      return;
    }
    const row = fromDb(data as DbRow);
    setTransactions((prev) => prev.map((x) => (x.id === id ? row : x)).sort(sortTx));
    await upsertCache(user.id, "transactions", row.id, data, false);
  };

  const removeTransaction = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover transações.");
      return;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
      return;
    }

    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover transação.");
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await removeFromCache(user.id, "transactions", id);
  };

  const updateTransaction: Ctx["updateTransaction"] = async (id, patch) => {
    if (!user) {
      toast.error("Faça login para atualizar transações.");
      return;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
      return;
    }

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
    if (patch.cartao_id !== undefined) (dbPatch as Record<string, unknown>).cartao_id = patch.cartao_id ?? null;

    const { data, error } = await supabase
      .from("transactions")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      toast.error("Erro ao atualizar transação.");
      return;
    }
    const row = fromDb(data as DbRow);
    setTransactions((prev) => prev.map((t) => (t.id === id ? row : t)));
    await upsertCache(user.id, "transactions", row.id, data, false);
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
