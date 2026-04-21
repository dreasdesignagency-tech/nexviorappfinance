import { createContext, useContext, useMemo, useState, ReactNode } from "react";

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
  data_inicio: string; // ISO yyyy-mm-dd
  proxima_cobranca: string; // ISO yyyy-mm-dd
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
  data_cobranca: string; // ISO yyyy-mm-dd (próxima cobrança)
  status: AssinaturaStatus;
  categoria?: string;
  forma_pagamento?: string;
  cartao_id?: string;
  created_at: string;
}

const addMonths = (iso: string, months: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1 + months, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

interface Ctx {
  parcelas: Parcela[];
  assinaturas: Assinatura[];
  addParcela: (p: Omit<Parcela, "id" | "created_at" | "parcela_atual" | "proxima_cobranca" | "status" | "valor_parcela"> & { valor_parcela?: number }) => void;
  removeParcela: (id: string) => void;
  addAssinatura: (a: Omit<Assinatura, "id" | "created_at" | "status">) => void;
  removeAssinatura: (id: string) => void;
  updateAssinaturaStatus: (id: string, status: AssinaturaStatus) => void;
  totalMensalParcelas: number;
  totalMensalAssinaturas: number;
}

const RecurrentsContext = createContext<Ctx | null>(null);

export const RecurrentsProvider = ({ children }: { children: ReactNode }) => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);

  const addParcela: Ctx["addParcela"] = (p) => {
    const valor_parcela = p.valor_parcela && p.valor_parcela > 0
      ? p.valor_parcela
      : Number((p.valor_total / p.total_parcelas).toFixed(2));
    setParcelas((prev) => [
      {
        ...p,
        valor_parcela,
        parcela_atual: 1,
        proxima_cobranca: p.data_inicio,
        status: "Em andamento" as ParcelaStatus,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const removeParcela = (id: string) =>
    setParcelas((prev) => prev.filter((p) => p.id !== id));

  const addAssinatura: Ctx["addAssinatura"] = (a) => {
    setAssinaturas((prev) => [
      {
        ...a,
        status: "ativa" as AssinaturaStatus,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const removeAssinatura = (id: string) =>
    setAssinaturas((prev) => prev.filter((a) => a.id !== id));

  const updateAssinaturaStatus = (id: string, status: AssinaturaStatus) =>
    setAssinaturas((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

  const { totalMensalParcelas, totalMensalAssinaturas } = useMemo(() => {
    const tp = parcelas
      .filter((p) => p.status === "Em andamento")
      .reduce((s, p) => s + p.valor_parcela, 0);
    const ta = assinaturas
      .filter((a) => a.status === "ativa")
      .reduce((s, a) => s + (a.frequencia === "mensal" ? a.valor : a.valor / 12), 0);
    return { totalMensalParcelas: tp, totalMensalAssinaturas: ta };
  }, [parcelas, assinaturas]);

  return (
    <RecurrentsContext.Provider
      value={{
        parcelas,
        assinaturas,
        addParcela,
        removeParcela,
        addAssinatura,
        removeAssinatura,
        updateAssinaturaStatus,
        totalMensalParcelas,
        totalMensalAssinaturas,
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
