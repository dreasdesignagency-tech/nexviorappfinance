import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

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
}

type ParcelaInput = Omit<Parcela, "id" | "created_at" | "parcela_atual" | "proxima_cobranca" | "status" | "valor_parcela"> & {
  valor_parcela?: number;
};
type AssinaturaInput = Omit<Assinatura, "id" | "created_at" | "status">;

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

const fromInstallment = (row: ParcelaRow): Parcela => ({
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
});

const fromSubscription = (row: AssinaturaRow): Assinatura => ({
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
});

export const RecurrentsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setParcelas([]);
      setAssinaturas([]);
      return;
    }

    setLoading(true);
    const [parcelasResult, assinaturasResult] = await Promise.all([
      db.from("installments").select("*").eq("user_id", user.id).order("proxima_cobranca", { ascending: true }),
      db.from("subscriptions").select("*").eq("user_id", user.id).order("data_cobranca", { ascending: true }),
    ]);
    setLoading(false);

    if (parcelasResult.error) {
      toast.error("Erro ao carregar parcelas.");
    } else {
      setParcelas(((parcelasResult.data ?? []) as ParcelaRow[]).map(fromInstallment));
    }

    if (assinaturasResult.error) {
      toast.error("Erro ao carregar assinaturas.");
    } else {
      setAssinaturas(((assinaturasResult.data ?? []) as AssinaturaRow[]).map(fromSubscription));
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addParcela = async (parcela: ParcelaInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar parcelas.");
      return false;
    }

    const valorParcela = parcela.valor_parcela && parcela.valor_parcela > 0
      ? parcela.valor_parcela
      : Number((parcela.valor_total / parcela.total_parcelas).toFixed(2));

    const { data, error } = await db
      .from("installments")
      .insert({
        user_id: user.id,
        nome: parcela.nome,
        valor_total: parcela.valor_total,
        valor_parcela: valorParcela,
        total_parcelas: parcela.total_parcelas,
        parcela_atual: 1,
        data_inicio: parcela.data_inicio,
        proxima_cobranca: parcela.data_inicio,
        status: "Em andamento",
        categoria: parcela.categoria ?? null,
        cartao_id: parcela.cartao_id ?? null,
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao salvar parcela.");
      return false;
    }

    setParcelas((prev) => [fromInstallment(data as ParcelaRow), ...prev]);
    return true;
  };

  const updateParcela = async (id: string, patch: Partial<Parcela>) => {
    if (!user) {
      toast.error("Faça login para atualizar parcelas.");
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

    setParcelas((prev) => prev.map((item) => (item.id === id ? fromInstallment(data as ParcelaRow) : item)));
    return true;
  };

  const removeParcela = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover parcelas.");
      return false;
    }

    const { error } = await db.from("installments").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover parcela.");
      return false;
    }

    setParcelas((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const addAssinatura = async (assinatura: AssinaturaInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar assinaturas.");
      return false;
    }

    const { data, error } = await db
      .from("subscriptions")
      .insert({
        user_id: user.id,
        nome: assinatura.nome,
        valor: assinatura.valor,
        frequencia: assinatura.frequencia,
        data_cobranca: assinatura.data_cobranca,
        status: "ativa",
        categoria: assinatura.categoria ?? null,
        forma_pagamento: assinatura.forma_pagamento ?? null,
        cartao_id: assinatura.cartao_id ?? null,
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao salvar assinatura.");
      return false;
    }

    setAssinaturas((prev) => [fromSubscription(data as AssinaturaRow), ...prev]);
    return true;
  };

  const updateAssinatura = async (id: string, patch: Partial<Assinatura>) => {
    if (!user) {
      toast.error("Faça login para atualizar assinaturas.");
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

    setAssinaturas((prev) => prev.map((item) => (item.id === id ? fromSubscription(data as AssinaturaRow) : item)));
    return true;
  };

  const removeAssinatura = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover assinaturas.");
      return false;
    }

    const { error } = await db.from("subscriptions").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover assinatura.");
      return false;
    }

    setAssinaturas((prev) => prev.filter((item) => item.id !== id));
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
