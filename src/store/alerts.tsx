import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useTransactions } from "@/store/transactions";
import { useLimits, calcularGastoLimite } from "@/store/limits";
import { useGoals } from "@/store/goals";
import { useRecurrents } from "@/store/recurrents";
import { toast } from "sonner";

export type AlertType =
  | "limit_80"
  | "limit_100"
  | "goal_near"
  | "goal_done"
  | "subscription_soon"
  | "subscription_today"
  | "installment_soon"
  | "installment_today"
  | "health_down"
  | "health_up";

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  read: boolean;
  related_entity_id?: string;
  related_entity_type?: string;
  dedup_key?: string;
  created_at: string;
}

interface AlertsContextValue {
  notifications: AlertItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextValue | null>(null);
const db = supabase as any;

const daysDiff = (iso: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { limits } = useLimits();
  const { goals } = useGoals();
  const { assinaturas, parcelas } = useRecurrents();
  const [notifications, setNotifications] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const evaluatingRef = useRef(false);
  const dedupSeen = useRef<Set<string>>(new Set());

  const refetch = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      dedupSeen.current = new Set();
      return;
    }
    setLoading(true);
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) return;
    const rows = (data ?? []) as AlertItem[];
    setNotifications(rows);
    dedupSeen.current = new Set(rows.map((r) => r.dedup_key).filter(Boolean) as string[]);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const insertOne = useCallback(
    async (payload: { type: AlertType; title: string; message: string; dedup_key: string; related_entity_id?: string; related_entity_type?: string }) => {
      if (!user) return;
      if (dedupSeen.current.has(payload.dedup_key)) return;
      dedupSeen.current.add(payload.dedup_key);
      const { data, error } = await db
        .from("notifications")
        .insert({
          user_id: user.id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          dedup_key: payload.dedup_key,
          related_entity_id: payload.related_entity_id ?? null,
          related_entity_type: payload.related_entity_type ?? null,
          read: false,
        })
        .select("*")
        .single();
      if (error) {
        // pode ser conflito de unique — apenas ignore
        return;
      }
      setNotifications((prev) => [data as AlertItem, ...prev]);
    },
    [user],
  );

  // Engine: avalia regras quando stores mudam
  useEffect(() => {
    if (!user) return;
    if (evaluatingRef.current) return;
    evaluatingRef.current = true;

    const run = async () => {
      const mk = monthKey();

      // Orçamentos
      for (const limit of limits) {
        const gasto = calcularGastoLimite(limit, transactions);
        const pct = limit.valor_limite > 0 ? (gasto / limit.valor_limite) * 100 : 0;
        if (pct >= 100) {
          await insertOne({
            type: "limit_100",
            title: "Orçamento ultrapassado",
            message: `Você passou seu limite de gastos em ${limit.categoria}.`,
            dedup_key: `limit_100:${limit.id}:${mk}`,
            related_entity_id: limit.id,
            related_entity_type: "limit",
          });
        } else if (pct >= 80) {
          await insertOne({
            type: "limit_80",
            title: "Orçamento em alerta",
            message: `Você já usou ${Math.round(pct)}% do orçamento de ${limit.categoria}.`,
            dedup_key: `limit_80:${limit.id}:${mk}`,
            related_entity_id: limit.id,
            related_entity_type: "limit",
          });
        }
      }

      // Metas
      for (const g of goals) {
        const pct = g.valor_objetivo > 0 ? (g.valor_atual / g.valor_objetivo) * 100 : 0;
        if (pct >= 100) {
          await insertOne({
            type: "goal_done",
            title: "Meta concluída! 🎉",
            message: `Parabéns! Você bateu sua meta ${g.nome}.`,
            dedup_key: `goal_done:${g.id}`,
            related_entity_id: g.id,
            related_entity_type: "goal",
          });
        } else if (pct >= 90) {
          await insertOne({
            type: "goal_near",
            title: "Quase lá!",
            message: `Você está perto de concluir sua meta ${g.nome}.`,
            dedup_key: `goal_near:${g.id}`,
            related_entity_id: g.id,
            related_entity_type: "goal",
          });
        }
      }

      // Assinaturas
      for (const a of assinaturas) {
        if (a.status !== "ativa") continue;
        const diff = daysDiff(a.data_cobranca);
        if (diff === 0) {
          await insertOne({
            type: "subscription_today",
            title: "Assinatura vence hoje",
            message: `Sua assinatura ${a.nome} vence hoje.`,
            dedup_key: `subscription_today:${a.id}:${a.data_cobranca}`,
            related_entity_id: a.id,
            related_entity_type: "subscription",
          });
        } else if (diff > 0 && diff <= 3) {
          await insertOne({
            type: "subscription_soon",
            title: "Assinatura próxima do vencimento",
            message: `Sua assinatura ${a.nome} vence em ${diff} dia${diff > 1 ? "s" : ""}.`,
            dedup_key: `subscription_soon:${a.id}:${a.data_cobranca}`,
            related_entity_id: a.id,
            related_entity_type: "subscription",
          });
        }
      }

      // Parcelas
      for (const p of parcelas) {
        if (p.status !== "Em andamento") continue;
        const diff = daysDiff(p.proxima_cobranca);
        if (diff === 0) {
          await insertOne({
            type: "installment_today",
            title: "Parcela vence hoje",
            message: `A parcela do ${p.nome} vence hoje.`,
            dedup_key: `installment_today:${p.id}:${p.proxima_cobranca}`,
            related_entity_id: p.id,
            related_entity_type: "installment",
          });
        } else if (diff > 0 && diff <= 3) {
          await insertOne({
            type: "installment_soon",
            title: "Parcela próxima",
            message: `A parcela do ${p.nome} vence em ${diff} dia${diff > 1 ? "s" : ""}.`,
            dedup_key: `installment_soon:${p.id}:${p.proxima_cobranca}`,
            related_entity_id: p.id,
            related_entity_type: "installment",
          });
        }
      }

      evaluatingRef.current = false;
    };

    run();
  }, [user, limits, transactions, goals, assinaturas, parcelas, insertOne]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await db.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await db.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const clearAll = async () => {
    if (!user) return;
    setNotifications([]);
    dedupSeen.current = new Set();
    const { error } = await db.from("notifications").delete().eq("user_id", user.id);
    if (error) toast.error("Erro ao limpar notificações.");
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <AlertsContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAll, refetch }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error("useAlerts deve ser usado dentro de AlertsProvider");
  return ctx;
};
