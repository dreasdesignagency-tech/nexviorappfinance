import { createContext, useContext, useState, ReactNode } from "react";

export type TipoCartao = "Crédito" | "Débito" | "Múltiplo";

export interface Card {
  id: string;
  nome: string;
  banco: string;
  tipo: TipoCartao;
  limite?: number;
  dia_vencimento?: number;
  dia_fechamento?: number;
  bandeira?: string;
  cor?: string;
  ativo?: boolean;
  created_at: string;
}

export const BANCOS = [
  "Nubank",
  "Itaú",
  "Banco do Brasil",
  "Inter",
  "Santander",
  "Caixa",
  "Bradesco",
  "Outro",
];

interface Ctx {
  cards: Card[];
  addCard: (c: Omit<Card, "id" | "created_at">) => void;
  removeCard: (id: string) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
}

const CardsContext = createContext<Ctx | null>(null);

export const CardsProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCards] = useState<Card[]>([]);

  const addCard: Ctx["addCard"] = (c) => {
    setCards((prev) => [
      { ...c, id: crypto.randomUUID(), created_at: new Date().toISOString(), ativo: true },
      ...prev,
    ]);
  };

  const removeCard = (id: string) => setCards((prev) => prev.filter((c) => c.id !== id));

  const updateCard: Ctx["updateCard"] = (id, patch) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <CardsContext.Provider value={{ cards, addCard, removeCard, updateCard }}>
      {children}
    </CardsContext.Provider>
  );
};

export const useCards = () => {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error("useCards deve ser usado dentro de CardsProvider");
  return ctx;
};
