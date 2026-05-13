import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { safeQuery } from "@/lib/safe-query";

export type PeriodoLimite = "Mensal" | "Semanal" | "Anual";

export interface Limit {
  id: string;
  categoria: string;
  valor_limite: number;
  periodo: PeriodoLimite;
  data_inicial: string;
  observacao?: string;
  created_at: string;
}

export type TipoInvestimento =
  | "Renda fixa"
  | "Renda variável"
  | "Fundo imobiliário"
  | "Criptomoeda"
  | "Tesouro direto"
  | "Poupança"
  | "Outro";

export const TIPOS_INVESTIMENTO: TipoInvestimento[] = [
  "Renda fixa",
  "Renda variável",
  "Fundo imobiliário",
  "Criptomoeda",
  "Tesouro direto",
  "Poupança",
  "Outro",
];

export interface Investment {
  id: string;
  nome: string;
  tipo: TipoInvestimento;
  valor_investido: number;
  valor_atual?: number;
  rentabilidade?: number;
  data_investimento: string;
  observacao?: string;
  created_at: string;
}

type LimitInput = Omit<Limit, "id" | "created_at">;
type InvestmentInput = Omit<Investment, "id" | "created_at">;

interface LimitsContextValue {
  limits: Limit[];
  investments: Investment[];
  loading: boolean;
  addLimit: (limit: LimitInput) => Promise<boolean>;
  removeLimit: (id: string) => Promise<boolean>;
  updateLimit: (id: string, patch: Partial<Limit>) => Promise<boolean>;
  addInvestment: (investment: InvestmentInput) => Promise<boolean>;
  removeInvestment: (id: string) => Promise<boolean>;
  updateInvestment: (id: string, patch: Partial<Investment>) => Promise<boolean>;
  totalInvestido: number;
  patrimonioAtual: number;
  lucroPrejuizo: number;
  rentabilidadeMedia: number;
  refetch: () => Promise<void>;
}

type LimitRow = {
  id: string;
  categoria: string;
  valor_limite: number | string;
  periodo: PeriodoLimite;
  data_inicial: string;
  observacao: string | null;
  created_at: string;
};

type InvestmentRow = {
  id: string;
  nome: string;
  tipo: TipoInvestimento;
  valor_investido: number | string;
  valor_atual: number | string | null;
  rentabilidade: number | string | null;
  data_investimento: string;
  observacao: string | null;
  created_at: string;
};

const LimitsContext = createContext<LimitsContextValue | null>(null);
const db = supabase as any;

const fromLimit = (row: LimitRow): Limit => ({
  id: row.id,
  categoria: row.categoria,
  valor_limite: Number(row.valor_limite),
  periodo: row.periodo,
  data_inicial: row.data_inicial,
  observacao: row.observacao ?? undefined,
  created_at: row.created_at,
});

const fromInvestment = (row: InvestmentRow): Investment => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo,
  valor_investido: Number(row.valor_investido),
  valor_atual: row.valor_atual === null ? undefined : Number(row.valor_atual),
  rentabilidade: row.rentabilidade === null ? undefined : Number(row.rentabilidade),
  data_investimento: row.data_investimento,
  observacao: row.observacao ?? undefined,
  created_at: row.created_at,
});

export const LimitsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<Limit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setLimits([]);
      setInvestments([]);
      return;
    }

    setLoading(true);
    const [limitsResult, investmentsResult] = await Promise.all([
      db.from("limits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      db.from("investments").select("*").eq("user_id", user.id).order("data_investimento", { ascending: false }),
    ]);
    setLoading(false);

    if (limitsResult.error) {
      toast.error("Erro ao carregar limites.");
    } else {
      setLimits(((limitsResult.data ?? []) as LimitRow[]).map(fromLimit));
    }

    if (investmentsResult.error) {
      toast.error("Erro ao carregar investimentos.");
    } else {
      setInvestments(((investmentsResult.data ?? []) as InvestmentRow[]).map(fromInvestment));
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addLimit = async (limit: LimitInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar limites.");
      return false;
    }

    const { data, error } = await db
      .from("limits")
      .insert({
        user_id: user.id,
        categoria: limit.categoria,
        valor_limite: limit.valor_limite,
        periodo: limit.periodo,
        data_inicial: limit.data_inicial,
        observacao: limit.observacao ?? null,
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao salvar limite.");
      return false;
    }

    setLimits((prev) => [fromLimit(data as LimitRow), ...prev]);
    return true;
  };

  const removeLimit = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover limites.");
      return false;
    }

    const { error } = await db.from("limits").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover limite.");
      return false;
    }

    setLimits((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const updateLimit = async (id: string, patch: Partial<Limit>) => {
    if (!user) {
      toast.error("Faça login para atualizar limites.");
      return false;
    }

    const dbPatch: Record<string, unknown> = {};
    if (patch.categoria !== undefined) dbPatch.categoria = patch.categoria;
    if (patch.valor_limite !== undefined) dbPatch.valor_limite = patch.valor_limite;
    if (patch.periodo !== undefined) dbPatch.periodo = patch.periodo;
    if (patch.data_inicial !== undefined) dbPatch.data_inicial = patch.data_inicial;
    if (patch.observacao !== undefined) dbPatch.observacao = patch.observacao ?? null;

    const { data, error } = await db
      .from("limits")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao atualizar limite.");
      return false;
    }

    setLimits((prev) => prev.map((item) => (item.id === id ? fromLimit(data as LimitRow) : item)));
    return true;
  };

  const addInvestment = async (investment: InvestmentInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar investimentos.");
      return false;
    }

    const { data, error } = await db
      .from("investments")
      .insert({
        user_id: user.id,
        nome: investment.nome,
        tipo: investment.tipo,
        valor_investido: investment.valor_investido,
        valor_atual: investment.valor_atual ?? null,
        rentabilidade: investment.rentabilidade ?? null,
        data_investimento: investment.data_investimento,
        observacao: investment.observacao ?? null,
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao salvar investimento.");
      return false;
    }

    setInvestments((prev) => [fromInvestment(data as InvestmentRow), ...prev]);
    return true;
  };

  const removeInvestment = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover investimentos.");
      return false;
    }

    const { error } = await db.from("investments").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover investimento.");
      return false;
    }

    setInvestments((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const updateInvestment = async (id: string, patch: Partial<Investment>) => {
    if (!user) {
      toast.error("Faça login para atualizar investimentos.");
      return false;
    }

    const dbPatch: Record<string, unknown> = {};
    if (patch.nome !== undefined) dbPatch.nome = patch.nome;
    if (patch.tipo !== undefined) dbPatch.tipo = patch.tipo;
    if (patch.valor_investido !== undefined) dbPatch.valor_investido = patch.valor_investido;
    if (patch.valor_atual !== undefined) dbPatch.valor_atual = patch.valor_atual ?? null;
    if (patch.rentabilidade !== undefined) dbPatch.rentabilidade = patch.rentabilidade ?? null;
    if (patch.data_investimento !== undefined) dbPatch.data_investimento = patch.data_investimento;
    if (patch.observacao !== undefined) dbPatch.observacao = patch.observacao ?? null;

    const { data, error } = await db
      .from("investments")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao atualizar investimento.");
      return false;
    }

    setInvestments((prev) => prev.map((item) => (item.id === id ? fromInvestment(data as InvestmentRow) : item)));
    return true;
  };

  const totalInvestido = useMemo(() => investments.reduce((sum, item) => sum + item.valor_investido, 0), [investments]);
  const patrimonioAtual = useMemo(
    () => investments.reduce((sum, item) => sum + (item.valor_atual ?? item.valor_investido), 0),
    [investments],
  );
  const lucroPrejuizo = patrimonioAtual - totalInvestido;
  const rentabilidadeMedia = totalInvestido > 0 ? (lucroPrejuizo / totalInvestido) * 100 : 0;

  return (
    <LimitsContext.Provider
      value={{
        limits,
        investments,
        loading,
        addLimit,
        removeLimit,
        updateLimit,
        addInvestment,
        removeInvestment,
        updateInvestment,
        totalInvestido,
        patrimonioAtual,
        lucroPrejuizo,
        rentabilidadeMedia,
        refetch,
      }}
    >
      {children}
    </LimitsContext.Provider>
  );
};

export const useLimits = () => {
  const ctx = useContext(LimitsContext);
  if (!ctx) throw new Error("useLimits deve ser usado dentro de LimitsProvider");
  return ctx;
};

export const calcularGastoLimite = (
  limit: Limit,
  transactions: Array<{ tipo: string; categoria: string; valor: number; data: string }>,
): number => {
  const hoje = new Date();
  const inicio = new Date(limit.data_inicial);

  let janelaInicio = inicio;
  if (limit.periodo === "Semanal") {
    const d = new Date(hoje);
    d.setDate(d.getDate() - 7);
    janelaInicio = d > inicio ? d : inicio;
  } else if (limit.periodo === "Mensal") {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    janelaInicio = d > inicio ? d : inicio;
  } else if (limit.periodo === "Anual") {
    const d = new Date(hoje.getFullYear(), 0, 1);
    janelaInicio = d > inicio ? d : inicio;
  }

  return transactions
    .filter(
      (transaction) =>
        transaction.tipo === "despesa" &&
        transaction.categoria === limit.categoria &&
        new Date(transaction.data) >= janelaInicio &&
        new Date(transaction.data) <= hoje,
    )
    .reduce((sum, transaction) => sum + transaction.valor, 0);
};
