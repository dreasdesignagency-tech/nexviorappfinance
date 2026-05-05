import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export interface Goal {
  id: string;
  nome: string;
  valor_objetivo: number;
  valor_atual: number;
  data_alvo?: string;
  cor?: string;
  observacao?: string;
  status: string;
  created_at: string;
}

type GoalInput = Omit<Goal, "id" | "created_at" | "status" | "valor_atual"> & {
  valor_atual?: number;
  status?: string;
};

interface GoalsContextValue {
  goals: Goal[];
  loading: boolean;
  addGoal: (goal: GoalInput) => Promise<boolean>;
  removeGoal: (id: string) => Promise<boolean>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<boolean>;
  addAmount: (id: string, amount: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);
const db = supabase as any;

type GoalRow = {
  id: string;
  nome: string;
  valor_objetivo: number | string;
  valor_atual: number | string;
  data_alvo: string | null;
  cor: string | null;
  observacao: string | null;
  status: string;
  created_at: string;
};

const fromRow = (row: GoalRow): Goal => ({
  id: row.id,
  nome: row.nome,
  valor_objetivo: Number(row.valor_objetivo),
  valor_atual: Number(row.valor_atual),
  data_alvo: row.data_alvo ?? undefined,
  cor: row.cor ?? undefined,
  observacao: row.observacao ?? undefined,
  status: row.status,
  created_at: row.created_at,
});

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setGoals([]);
      return;
    }
    setLoading(true);
    const { data, error } = await db
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar metas.");
      return;
    }
    setGoals(((data ?? []) as GoalRow[]).map(fromRow));
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addGoal = async (goal: GoalInput) => {
    if (!user) return false;
    const { data, error } = await db
      .from("goals")
      .insert({
        user_id: user.id,
        nome: goal.nome,
        valor_objetivo: goal.valor_objetivo,
        valor_atual: goal.valor_atual ?? 0,
        data_alvo: goal.data_alvo ?? null,
        cor: goal.cor ?? null,
        observacao: goal.observacao ?? null,
        status: goal.status ?? "ativa",
      })
      .select("*")
      .single();
    if (error) {
      toast.error("Erro ao salvar meta.");
      return false;
    }
    setGoals((prev) => [fromRow(data as GoalRow), ...prev]);
    return true;
  };

  const removeGoal = async (id: string) => {
    if (!user) return false;
    const { error } = await db.from("goals").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover meta.");
      return false;
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));
    return true;
  };

  const updateGoal = async (id: string, patch: Partial<Goal>) => {
    if (!user) return false;
    const dbPatch: Record<string, unknown> = {};
    if (patch.nome !== undefined) dbPatch.nome = patch.nome;
    if (patch.valor_objetivo !== undefined) dbPatch.valor_objetivo = patch.valor_objetivo;
    if (patch.valor_atual !== undefined) dbPatch.valor_atual = patch.valor_atual;
    if (patch.data_alvo !== undefined) dbPatch.data_alvo = patch.data_alvo ?? null;
    if (patch.cor !== undefined) dbPatch.cor = patch.cor ?? null;
    if (patch.observacao !== undefined) dbPatch.observacao = patch.observacao ?? null;
    if (patch.status !== undefined) dbPatch.status = patch.status;

    const { data, error } = await db
      .from("goals")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) {
      toast.error("Erro ao atualizar meta.");
      return false;
    }
    setGoals((prev) => prev.map((g) => (g.id === id ? fromRow(data as GoalRow) : g)));
    return true;
  };

  const addAmount = async (id: string, amount: number) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return false;
    return updateGoal(id, { valor_atual: Math.max(0, goal.valor_atual + amount) });
  };

  return (
    <GoalsContext.Provider value={{ goals, loading, addGoal, removeGoal, updateGoal, addAmount, refetch }}>
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals deve ser usado dentro de GoalsProvider");
  return ctx;
};
