import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

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

type CardInput = Omit<Card, "id" | "created_at">;

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

interface CardsContextValue {
  cards: Card[];
  loading: boolean;
  addCard: (card: CardInput) => Promise<boolean>;
  removeCard: (id: string) => Promise<boolean>;
  updateCard: (id: string, patch: Partial<Card>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

type CardRow = {
  id: string;
  nome: string;
  banco: string;
  tipo: TipoCartao;
  limite: number | string | null;
  dia_vencimento: number | null;
  dia_fechamento: number | null;
  bandeira: string | null;
  cor: string | null;
  ativo: boolean | null;
  created_at: string;
};

const CardsContext = createContext<CardsContextValue | null>(null);
const db = supabase as any;

const fromDb = (row: CardRow): Card => ({
  id: row.id,
  nome: row.nome,
  banco: row.banco,
  tipo: row.tipo,
  limite: row.limite === null ? undefined : Number(row.limite),
  dia_vencimento: row.dia_vencimento ?? undefined,
  dia_fechamento: row.dia_fechamento ?? undefined,
  bandeira: row.bandeira ?? undefined,
  cor: row.cor ?? undefined,
  ativo: row.ativo ?? true,
  created_at: row.created_at,
});

export const CardsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setCards([]);
      return;
    }

    setLoading(true);
    const { data, error } = await db
      .from("cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);

    if (error) {
      toast.error("Erro ao carregar cartões.");
      return;
    }

    setCards(((data ?? []) as CardRow[]).map(fromDb));
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addCard = async (card: CardInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar cartões.");
      return false;
    }

    const { data, error } = await db
      .from("cards")
      .insert({
        user_id: user.id,
        nome: card.nome,
        banco: card.banco,
        tipo: card.tipo,
        limite: card.limite ?? null,
        dia_vencimento: card.dia_vencimento ?? null,
        dia_fechamento: card.dia_fechamento ?? null,
        bandeira: card.bandeira ?? null,
        cor: card.cor ?? null,
        ativo: card.ativo ?? true,
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao salvar cartão.");
      return false;
    }

    setCards((prev) => [fromDb(data as CardRow), ...prev]);
    return true;
  };

  const removeCard = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover cartões.");
      return false;
    }

    const { error } = await db.from("cards").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover cartão.");
      return false;
    }

    setCards((prev) => prev.filter((card) => card.id !== id));
    return true;
  };

  const updateCard = async (id: string, patch: Partial<Card>) => {
    if (!user) {
      toast.error("Faça login para atualizar cartões.");
      return false;
    }

    const dbPatch: Record<string, unknown> = {};
    if (patch.nome !== undefined) dbPatch.nome = patch.nome;
    if (patch.banco !== undefined) dbPatch.banco = patch.banco;
    if (patch.tipo !== undefined) dbPatch.tipo = patch.tipo;
    if (patch.limite !== undefined) dbPatch.limite = patch.limite ?? null;
    if (patch.dia_vencimento !== undefined) dbPatch.dia_vencimento = patch.dia_vencimento ?? null;
    if (patch.dia_fechamento !== undefined) dbPatch.dia_fechamento = patch.dia_fechamento ?? null;
    if (patch.bandeira !== undefined) dbPatch.bandeira = patch.bandeira ?? null;
    if (patch.cor !== undefined) dbPatch.cor = patch.cor ?? null;
    if (patch.ativo !== undefined) dbPatch.ativo = patch.ativo;

    const { data, error } = await db
      .from("cards")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao atualizar cartão.");
      return false;
    }

    setCards((prev) => prev.map((card) => (card.id === id ? fromDb(data as CardRow) : card)));
    return true;
  };

  return (
    <CardsContext.Provider value={{ cards, loading, addCard, removeCard, updateCard, refetch }}>
      {children}
    </CardsContext.Provider>
  );
};

export const useCards = () => {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error("useCards deve ser usado dentro de CardsProvider");
  return ctx;
};
