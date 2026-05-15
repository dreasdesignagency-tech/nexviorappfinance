import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import {
  enqueue,
  readCache,
  removeFromCache,
  replaceCache,
  upsertCache,
} from "@/lib/offline/db";
import { isOnline, useOnlineStatus } from "@/lib/offline/network";
import { onSynced } from "@/lib/offline/sync";

export type ParcelaStatus = "Em andamento" | "Finalizado";
export type AssinaturaStatus = "ativa" | "pausada" | "cancelada";
export type Frequencia = "mensal" | "anual";

export interface Parcela {
  id: string;
  nome: string;
  valor_total: number;
  valor_parcela: number;
  total_parcelas: number;
  parcela_atual: number;
  data_inicio: string;
  proxima_cobranca: string;
  status: ParcelaStatus;
  categoria?: string;
  cartao_id?: string;
  created_at: string;
  _pending?: boolean;
}

export interface Assinatura {
  id: string;
  nome: string;
  valor: number;
  frequencia: Frequencia;
  data_cobranca: string;
  status: AssinaturaStatus;
  categoria?: string;
  forma_pagamento?: string;
  cartao_id?: string;
  created_at: string;
  _pending?: boolean;
}

type ParcelaInput = Omit<Parcela, "id" | "created_at" | "parcela_atual" | "proxima_cobranca" | "status" | "valor_parcela" | "_pending"> & {
  valor_parcela?: number;
};
type AssinaturaInput = Omit<Assinatura, "id" | "created_at" | "status" | "_pending">;

const addMonths = (iso: string, months: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1 + months, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

interface RecurrentsContextValue {
  parcelas: Parcela[];
  assinaturas: Assinatura[];
  loading: boolean;
  addParcela: (parcela: ParcelaInput) => Promise<boolean>;
  updateParcela: (id: string, patch: Partial<Parcela>) => Promise<boolean>;
  removeParcela: (id: string) => Promise<boolean>;
  addAssinatura: (assinatura: AssinaturaInput) => Promise<boolean>;
  updateAssinatura: (id: string, patch: Partial<Assinatura>) => Promise<boolean>;
  removeAssinatura: (id: string) => Promise<boolean>;
  updateAssinaturaStatus: (id: string, status: AssinaturaStatus) => Promise<boolean>;
  payParcela: (id: string) => Promise<boolean>;
  totalMensalParcelas: number;
  totalMensalAssinaturas: number;
  refetch: () => Promise<void>;
}

type ParcelaRow = {
  id: string;
  nome: string;
  valor_total: number | string;
  valor_parcela: number | string;
  total_parcelas: number;
  parcela_atual: number;
  data_inicio: string;
  proxima_cobranca: string;
  status: ParcelaStatus;
  categoria: string | null;
  cartao_id: string | null;
  created_at: string;
};

type AssinaturaRow = {
  id: string;
  nome: string;
  valor: number | string;
  frequencia: Frequencia;
  data_cobranca: string;
  status: AssinaturaStatus;
  categoria: string | null;
  forma_pagamento: string | null;
  cartao_id: string | null;
  created_at: string;
};

const RecurrentsContext = createContext<RecurrentsContextValue | null>(null);
const db = supabase as any;

const fromInstallment = (row: ParcelaRow, pending = false): Parcela => ({
  id: row.id,
  nome: row.nome,
  valor_total: Number(row.valor_total),
  valor_parcela: Number(row.valor_parcela),
  total_parcelas: row.total_parcelas,
  parcela_atual: row.parcela_atual,
  data_inicio: row.data_inicio,
  proxima_cobranca: row.proxima_cobranca,
  status: row.status,
  categoria: row.categoria ?? undefined,
  cartao_id: row.cartao_id ?? undefined,
  created_at: row.created_at,
  _pending: pending || undefined,
});

const fromSubscription = (row: AssinaturaRow, pending = false): Assinatura => ({
  id: row.id,
  nome: row.nome,
  valor: Number(row.valor),
  frequencia: row.frequencia,
  data_cobranca: row.data_cobranca,
  status: row.status,
  categoria: row.categoria ?? undefined,
  forma_pagamento: row.forma_pagamento ?? undefined,
  cartao_id: row.cartao_id ?? undefined,
  created_at: row.created_at,
  _pending: pending || undefined,
});

export const RecurrentsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(false);
  useOnlineStatus();

  const refetch = useCallback(async () => {
    if (!user) {
      setParcelas([]);
      setAssinaturas([]);
      return;
    }

    // Hidrata do cache
    const [cachedP, cachedS] = await Promise.all([
      readCache<ParcelaRow>(user.id, "installments"),
      readCache<AssinaturaRow>(user.id, "subscriptions"),
    ]);
    if (cachedP.length > 0) {
      setParcelas(cachedP.map((c) => fromInstallment(c.data as ParcelaRow, !!c.pending)));
    }
    if (cachedS.length > 0) {
      setAssinaturas(cachedS.map((c) => fromSubscription(c.data as AssinaturaRow, !!c.pending)));
    }

    if (!isOnline()) {
      if (cachedP.length === 0) setParcelas([]);
      if (cachedS.length === 0) setAssinaturas([]);
      return;
    }

    setLoading(true);
    const [parcelasResult, assinaturasResult] = await Promise.all([
      db.from("installments").select("*").eq("user_id", user.id).order("proxima_cobranca", { ascending: true }),
      db.from("subscriptions").select("*").eq("user_id", user.id).order("data_cobranca", { ascending: true }),
    ]);
    setLoading(false);

    if (!parcelasResult.error) {
      const rows = ((parcelasResult.data ?? []) as ParcelaRow[]);
      setParcelas(rows.map((r) => fromInstallment(r)));
      await replaceCache(user.id, "installments", rows, (r) => r.id);
    }
    if (!assinaturasResult.error) {
      const rows = ((assinaturasResult.data ?? []) as AssinaturaRow[]);
      setAssinaturas(rows.map((r) => fromSubscription(r)));
      await replaceCache(user.id, "subscriptions", rows, (r) => r.id);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const off = onSynced((t) => {
      if (t === "installments" || t === "subscriptions") refetch();
    });
    return () => {
      off();
    };
  }, [user, refetch]);

  const addParcela = async (parcela: ParcelaInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar parcelas.");
      return false;
    }

    const valorParcela = parcela.valor_parcela && parcela.valor_parcela > 0
      ? parcela.valor_parcela
      : Number((parcela.valor_total / parcela.total_parcelas).toFixed(2));

    const id = uuidv4();
    const created_at = new Date().toISOString();
    const payload = {
      id,
      user_id: user.id,
      nome: parcela.nome,
      valor_total: parcela.valor_total,
      valor_parcela: valorParcela,
      total_parcelas: parcela.total_parcelas,
      parcela_atual: 1,
      data_inicio: parcela.data_inicio,
      proxima_cobranca: parcela.data_inicio,
      status: "Em andamento" as ParcelaStatus,
      categoria: parcela.categoria ?? null,
      cartao_id: parcela.cartao_id ?? null,
    };

    const optimistic: Parcela = fromInstallment({ ...payload, created_at } as ParcelaRow, !isOnline());
    setParcelas((prev) => [optimistic, ...prev]);
    await upsertCache(user.id, "installments", id, { ...payload, created_at }, !isOnline());

    if (!isOnline()) {
      await enqueue({ id: uuidv4(), userId: user.id, table: "installments", op: "insert", payload });
      toast.info("Parcela salva offline. Sincroniza ao voltar a conexão.");
      return true;
    }

    const { data, error } = await db.from("installments").insert(payload).select("*").single();
    if (error) {
      await enqueue({ id: uuidv4(), userId: user.id, table: "installments", op: "insert", payload });
      setParcelas((prev) => prev.map((x) => (x.id === id ? { ...x, _pending: true } : x)));
      toast.warning("Erro ao salvar. Tentaremos novamente.");
      return true;
    }
    const row = fromInstallment(data as ParcelaRow);
    setParcelas((prev) => prev.map((x) => (x.id === id ? row : x)));
    await upsertCache(user.id, "installments", row.id, data, false);
    return true;
  };

  const updateParcela = async (id: string, patch: Partial<Parcela>) => {
    if (!user) {
      toast.error("Faça login para atualizar parcelas.");
      return false;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
      return false;
    }

    const dbPatch: Record<string, unknown> = {};
    if (patch.nome !== undefined) dbPatch.nome = patch.nome;
    if (patch.valor_total !== undefined) dbPatch.valor_total = patch.valor_total;
    if (patch.valor_parcela !== undefined) dbPatch.valor_parcela = patch.valor_parcela;
    if (patch.total_parcelas !== undefined) dbPatch.total_parcelas = patch.total_parcelas;
    if (patch.parcela_atual !== undefined) dbPatch.parcela_atual = patch.parcela_atual;
    if (patch.data_inicio !== undefined) dbPatch.data_inicio = patch.data_inicio;
    if (patch.proxima_cobranca !== undefined) dbPatch.proxima_cobranca = patch.proxima_cobranca;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.categoria !== undefined) dbPatch.categoria = patch.categoria ?? null;
    if (patch.cartao_id !== undefined) dbPatch.cartao_id = patch.cartao_id ?? null;

    const { data, error } = await db
      .from("installments")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) {
      toast.error("Erro ao atualizar parcela.");
      return false;
    }
    const row = fromInstallment(data as ParcelaRow);
    setParcelas((prev) => prev.map((item) => (item.id === id ? row : item)));
    await upsertCache(user.id, "installments", row.id, data, false);
    return true;
  };

  const removeParcela = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover parcelas.");
      return false;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
      return false;
    }
    const { error } = await db.from("installments").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover parcela.");
      return false;
    }
    setParcelas((prev) => prev.filter((item) => item.id !== id));
    await removeFromCache(user.id, "installments", id);
    return true;
  };

  const addAssinatura = async (assinatura: AssinaturaInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar assinaturas.");
      return false;
    }
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const payload = {
      id,
      user_id: user.id,
      nome: assinatura.nome,
      valor: assinatura.valor,
      frequencia: assinatura.frequencia,
      data_cobranca: assinatura.data_cobranca,
      status: "ativa" as AssinaturaStatus,
      categoria: assinatura.categoria ?? null,
      forma_pagamento: assinatura.forma_pagamento ?? null,
      cartao_id: assinatura.cartao_id ?? null,
    };

    const optimistic: Assinatura = fromSubscription({ ...payload, created_at } as AssinaturaRow, !isOnline());
    setAssinaturas((prev) => [optimistic, ...prev]);
    await upsertCache(user.id, "subscriptions", id, { ...payload, created_at }, !isOnline());

    if (!isOnline()) {
      await enqueue({ id: uuidv4(), userId: user.id, table: "subscriptions", op: "insert", payload });
      toast.info("Assinatura salva offline. Sincroniza ao voltar a conexão.");
      return true;
    }

    const { data, error } = await db.from("subscriptions").insert(payload).select("*").single();
    if (error) {
      await enqueue({ id: uuidv4(), userId: user.id, table: "subscriptions", op: "insert", payload });
      setAssinaturas((prev) => prev.map((x) => (x.id === id ? { ...x, _pending: true } : x)));
      toast.warning("Erro ao salvar. Tentaremos novamente.");
      return true;
    }
    const row = fromSubscription(data as AssinaturaRow);
    setAssinaturas((prev) => prev.map((x) => (x.id === id ? row : x)));
    await upsertCache(user.id, "subscriptions", row.id, data, false);
    return true;
  };

  const updateAssinatura = async (id: string, patch: Partial<Assinatura>) => {
    if (!user) {
      toast.error("Faça login para atualizar assinaturas.");
      return false;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
      return false;
    }

    const dbPatch: Record<string, unknown> = {};
    if (patch.nome !== undefined) dbPatch.nome = patch.nome;
    if (patch.valor !== undefined) dbPatch.valor = patch.valor;
    if (patch.frequencia !== undefined) dbPatch.frequencia = patch.frequencia;
    if (patch.data_cobranca !== undefined) dbPatch.data_cobranca = patch.data_cobranca;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.categoria !== undefined) dbPatch.categoria = patch.categoria ?? null;
    if (patch.forma_pagamento !== undefined) dbPatch.forma_pagamento = patch.forma_pagamento ?? null;
    if (patch.cartao_id !== undefined) dbPatch.cartao_id = patch.cartao_id ?? null;

    const { data, error } = await db
      .from("subscriptions")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) {
      toast.error("Erro ao atualizar assinatura.");
      return false;
    }
    const row = fromSubscription(data as AssinaturaRow);
    setAssinaturas((prev) => prev.map((item) => (item.id === id ? row : item)));
    await upsertCache(user.id, "subscriptions", row.id, data, false);
    return true;
  };

  const removeAssinatura = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover assinaturas.");
      return false;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
      return false;
    }
    const { error } = await db.from("subscriptions").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover assinatura.");
      return false;
    }
    setAssinaturas((prev) => prev.filter((item) => item.id !== id));
    await removeFromCache(user.id, "subscriptions", id);
    return true;
  };

  const updateAssinaturaStatus = async (id: string, status: AssinaturaStatus) => updateAssinatura(id, { status });

  const { totalMensalParcelas, totalMensalAssinaturas } = useMemo(() => {
    const parcelasMensais = parcelas
      .filter((item) => item.status === "Em andamento")
      .reduce((sum, item) => sum + item.valor_parcela, 0);

    const assinaturasMensais = assinaturas
      .filter((item) => item.status === "ativa")
      .reduce((sum, item) => sum + (item.frequencia === "mensal" ? item.valor : item.valor / 12), 0);

    return {
      totalMensalParcelas: parcelasMensais,
      totalMensalAssinaturas: assinaturasMensais,
    };
  }, [parcelas, assinaturas]);

  return (
    <RecurrentsContext.Provider
      value={{
        parcelas,
        assinaturas,
        loading,
        addParcela,
        updateParcela,
        removeParcela,
        addAssinatura,
        updateAssinatura,
        removeAssinatura,
        updateAssinaturaStatus,
        totalMensalParcelas,
        totalMensalAssinaturas,
        refetch,
      }}
    >
      {children}
    </RecurrentsContext.Provider>
  );
};

export const useRecurrents = () => {
  const ctx = useContext(RecurrentsContext);
  if (!ctx) throw new Error("useRecurrents deve ser usado dentro de RecurrentsProvider");
  return ctx;
};

export { addMonths };
