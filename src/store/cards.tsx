import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import {
  enqueue,
  readCache,
  replaceCache,
  removeFromCache,
  upsertCache,
} from "@/lib/offline/db";
import { isOnline, useOnlineStatus } from "@/lib/offline/network";
import { onSynced } from "@/lib/offline/sync";

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
  _pending?: boolean;
}

type CardInput = Omit<Card, "id" | "created_at" | "_pending">;

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

const fromDb = (row: CardRow, pending = false): Card => ({
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
  _pending: pending || undefined,
});

const buildInsert = (userId: string, id: string, c: CardInput) => ({
  id,
  user_id: userId,
  nome: c.nome,
  banco: c.banco,
  tipo: c.tipo,
  limite: c.limite ?? null,
  dia_vencimento: c.dia_vencimento ?? null,
  dia_fechamento: c.dia_fechamento ?? null,
  bandeira: c.bandeira ?? null,
  cor: c.cor ?? null,
  ativo: c.ativo ?? true,
});

export const CardsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  useOnlineStatus();

  const refetch = useCallback(async () => {
    if (!user) {
      setCards([]);
      return;
    }
    const cached = await readCache<CardRow>(user.id, "cards");
    if (cached.length > 0) {
      setCards(
        cached
          .map((c) => fromDb(c.data as CardRow, !!c.pending))
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
      );
    }
    if (!isOnline()) {
      if (cached.length === 0) setCards([]);
      return;
    }

    setLoading(true);
    const { data, error } = await db
      .from("cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return;
    const rows = ((data ?? []) as CardRow[]);
    setCards(rows.map((r) => fromDb(r)));
    await replaceCache(user.id, "cards", rows, (r) => r.id);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const off = onSynced((t) => {
      if (t === "cards") refetch();
    });
    return () => {
      off();
    };
  }, [user, refetch]);

  const addCard = async (card: CardInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar cartões.");
      return false;
    }
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const payload = buildInsert(user.id, id, card);
    const optimistic: Card = { ...card, id, created_at, _pending: !isOnline() };
    setCards((prev) => [optimistic, ...prev]);
    await upsertCache(user.id, "cards", id, { ...payload, created_at }, !isOnline());

    if (!isOnline()) {
      await enqueue({ id: uuidv4(), userId: user.id, table: "cards", op: "insert", payload });
      toast.info("Cartão salvo offline. Sincroniza ao voltar a conexão.");
      return true;
    }

    const { data, error } = await db.from("cards").insert(payload).select("*").single();
    if (error) {
      await enqueue({ id: uuidv4(), userId: user.id, table: "cards", op: "insert", payload });
      setCards((prev) => prev.map((x) => (x.id === id ? { ...x, _pending: true } : x)));
      toast.warning("Erro ao salvar. Tentaremos novamente.");
      return true;
    }
    const row = fromDb(data as CardRow);
    setCards((prev) => prev.map((x) => (x.id === id ? row : x)));
    await upsertCache(user.id, "cards", row.id, data, false);
    return true;
  };

  const removeCard = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover cartões.");
      return false;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
      return false;
    }
    const { error } = await db.from("cards").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover cartão.");
      return false;
    }
    setCards((prev) => prev.filter((card) => card.id !== id));
    await removeFromCache(user.id, "cards", id);
    return true;
  };

  const updateCard = async (id: string, patch: Partial<Card>) => {
    if (!user) {
      toast.error("Faça login para atualizar cartões.");
      return false;
    }
    if (!isOnline()) {
      toast.info("Essa ação estará disponível quando você estiver online.");
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
    const row = fromDb(data as CardRow);
    setCards((prev) => prev.map((card) => (card.id === id ? row : card)));
    await upsertCache(user.id, "cards", row.id, data, false);
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
