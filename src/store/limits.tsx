import { createContext, useContext, useState, ReactNode } from "react";

export type PeriodoLimite = "Mensal" | "Semanal" | "Anual";

export interface Limit {
  id: string;
  categoria: string;
  valor_limite: number;
  periodo: PeriodoLimite;
  data_inicial: string; // ISO yyyy-mm-dd
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
  rentabilidade?: number; // %
  data_investimento: string; // ISO
  observacao?: string;
  created_at: string;
}

interface Ctx {
  limits: Limit[];
  investments: Investment[];
  addLimit: (l: Omit<Limit, "id" | "created_at">) => void;
  removeLimit: (id: string) => void;
  updateLimit: (id: string, patch: Partial<Limit>) => void;
  addInvestment: (i: Omit<Investment, "id" | "created_at">) => void;
  removeInvestment: (id: string) => void;
  updateInvestment: (id: string, patch: Partial<Investment>) => void;
  totalInvestido: number;
  patrimonioAtual: number;
  lucroPrejuizo: number;
  rentabilidadeMedia: number;
}

const LimitsContext = createContext<Ctx | null>(null);

export const LimitsProvider = ({ children }: { children: ReactNode }) => {
  const [limits, setLimits] = useState<Limit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  const addLimit: Ctx["addLimit"] = (l) =>
    setLimits((prev) => [
      { ...l, id: crypto.randomUUID(), created_at: new Date().toISOString() },
      ...prev,
    ]);
  const removeLimit = (id: string) => setLimits((prev) => prev.filter((l) => l.id !== id));
  const updateLimit: Ctx["updateLimit"] = (id, patch) =>
    setLimits((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addInvestment: Ctx["addInvestment"] = (i) =>
    setInvestments((prev) => [
      { ...i, id: crypto.randomUUID(), created_at: new Date().toISOString() },
      ...prev,
    ]);
  const removeInvestment = (id: string) =>
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  const updateInvestment: Ctx["updateInvestment"] = (id, patch) =>
    setInvestments((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const totalInvestido = investments.reduce((s, i) => s + i.valor_investido, 0);
  const patrimonioAtual = investments.reduce(
    (s, i) => s + (i.valor_atual ?? i.valor_investido),
    0,
  );
  const lucroPrejuizo = patrimonioAtual - totalInvestido;
  const rentabilidadeMedia =
    totalInvestido > 0 ? (lucroPrejuizo / totalInvestido) * 100 : 0;

  return (
    <LimitsContext.Provider
      value={{
        limits,
        investments,
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

/**
 * Calcula o gasto de uma categoria dentro do período de um limite.
 * Considera apenas despesas. Janela:
 *  - Semanal: últimos 7 dias a partir de data_inicial (rolling forward até hoje)
 *  - Mensal: mesmo mês/ano da data atual, a partir de data_inicial
 *  - Anual: ano corrente a partir de data_inicial
 */
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
      (t) =>
        t.tipo === "despesa" &&
        t.categoria === limit.categoria &&
        new Date(t.data) >= janelaInicio &&
        new Date(t.data) <= hoje,
    )
    .reduce((s, t) => s + t.valor, 0);
};
