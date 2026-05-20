import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useRecurrents, type Assinatura } from "@/store/recurrents";
import { useTransactions } from "@/store/transactions";
import { toast } from "sonner";

const db = supabase as any;

export type ChargeStatus = "pendente" | "pago" | "atrasado";

export interface SubscriptionCharge {
  id: string;
  subscription_id: string;
  mes_referencia: string;
  valor: number;
  vencimento: string;
  status: ChargeStatus;
  data_pagamento: string | null;
  transaction_id: string | null;
  created_at: string;
}

interface Ctx {
  charges: SubscriptionCharge[];
  loading: boolean;
  payCharge: (chargeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  getCurrentChargeFor: (subscription_id: string) => SubscriptionCharge | undefined;
}

const SubscriptionChargesContext = createContext<Ctx | null>(null);

const pad2 = (n: number) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const periodKey = (a: Assinatura, ref: Date = new Date()) => {
  if (a.frequencia === "anual") return String(ref.getFullYear());
  return `${ref.getFullYear()}-${pad2(ref.getMonth() + 1)}`;
};

const computeVencimento = (a: Assinatura, ref: Date = new Date()) => {
  const [yy, mm, dd] = a.data_cobranca.split("-").map(Number);
  if (a.frequencia === "anual") {
    return `${ref.getFullYear()}-${pad2(mm)}-${pad2(dd)}`;
  }
  // mensal: dia da assinatura no mês de referência
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const day = Math.min(dd, lastDay);
  return `${ref.getFullYear()}-${pad2(ref.getMonth() + 1)}-${pad2(day)}`;
};

const nextRef = (a: Assinatura, ref: Date): Date => {
  if (a.frequencia === "anual") return new Date(ref.getFullYear() + 1, ref.getMonth(), 1);
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
};

export const SubscriptionChargesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { assinaturas } = useRecurrents();
  const { addTransaction } = useTransactions();
  const [charges, setCharges] = useState<SubscriptionCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const seededKeyRef = useRef<string | null>(null);
  const chargesRef = useRef<SubscriptionCharge[]>([]);
  useEffect(() => { chargesRef.current = charges; }, [charges]);

  const refetch = useCallback(async () => {
    if (!user) {
      setCharges([]);
      return;
    }
    setLoading(true);
    const { data, error } = await db
      .from("subscription_charges")
      .select("*")
      .eq("user_id", user.id)
      .order("vencimento", { ascending: false });
    setLoading(false);
    if (error) {
      console.error("[subscription_charges] load error", error);
      return;
    }
    setCharges((data ?? []) as SubscriptionCharge[]);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Seeder: roda quando muda o user, conjunto de assinaturas ativas OU o mês corrente.
  // NUNCA depende de `charges` — isso causaria loop infinito de upserts.
  useEffect(() => {
    if (!user || assinaturas.length === 0) return;
    const ativas = assinaturas.filter((a) => a.status === "ativa");
    if (ativas.length === 0) return;
    const now = new Date();
    // Inclui mês/ano corrente para que ao virar o mês uma nova cobrança "pendente" seja gerada
    const monthToken = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const key = `${user.id}|${monthToken}|${ativas.map((a) => a.id).sort().join(",")}`;
    if (seededKeyRef.current === key) return;
    seededKeyRef.current = key;

    const run = async () => {
      try {
        const today = todayISO();
        const current = chargesRef.current;

        // 1. Marca atrasadas
        const toLate = current.filter((c) => c.status === "pendente" && c.vencimento < today);
        if (toLate.length > 0) {
          const ids = toLate.map((c) => c.id);
          await db.from("subscription_charges").update({ status: "atrasado" }).in("id", ids).eq("user_id", user.id);
          setCharges((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, status: "atrasado" as ChargeStatus } : c)));
        }

        // 2. Gera cobrança do período atual se não existir
        const inserts: any[] = [];
        for (const a of ativas) {
          const period = periodKey(a, now);
          const exists = current.some((c) => c.subscription_id === a.id && c.mes_referencia === period);
          if (exists) continue;
          inserts.push({
            user_id: user.id,
            subscription_id: a.id,
            mes_referencia: period,
            valor: a.valor,
            vencimento: computeVencimento(a, now),
            status: "pendente",
          });
        }
        if (inserts.length > 0) {
          const { data, error } = await db
            .from("subscription_charges")
            .upsert(inserts, { onConflict: "subscription_id,mes_referencia", ignoreDuplicates: true })
            .select("*");
          if (error) console.error("[subscription_charges] seed error", error);
          if (data && data.length > 0) {
            setCharges((prev) => {
              const ids = new Set(prev.map((c) => c.id));
              const fresh = (data as SubscriptionCharge[]).filter((c) => !ids.has(c.id));
              return [...fresh, ...prev];
            });
          }
        }
      } catch (e) {
        console.error("[subscription_charges] seeder failed", e);
      }
    };
    run();
  }, [user, assinaturas]);

  // Re-verifica seeder ao voltar foco/online (ex.: virou o mês com o app aberto)
  useEffect(() => {
    const recheck = () => { seededKeyRef.current = null; };
    window.addEventListener("focus", recheck);
    window.addEventListener("online", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      window.removeEventListener("online", recheck);
    };
  }, []);

  const getCurrentChargeFor = useCallback(
    (subscription_id: string) => {
      const a = assinaturas.find((x) => x.id === subscription_id);
      if (!a) return undefined;
      const period = periodKey(a);
      return charges.find((c) => c.subscription_id === subscription_id && c.mes_referencia === period);
    },
    [charges, assinaturas],
  );

  const payCharge = async (chargeId: string) => {
    if (!user) return false;
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return false;
    if (charge.status === "pago") return true;
    const a = assinaturas.find((x) => x.id === charge.subscription_id);
    if (!a) return false;

    // 1. Cria transação
    await addTransaction({
      tipo: "despesa",
      titulo: a.nome,
      valor: charge.valor,
      categoria: a.categoria || "Outros",
      data: todayISO(),
      forma_pagamento: (a.forma_pagamento as any) || undefined,
      cartao_id: a.cartao_id ?? null,
      observacao: `Pagamento de assinatura · ${charge.mes_referencia}`,
      recorrente: true,
    });

    // 2. Marca cobrança como paga
    const nowIso = new Date().toISOString();
    const { error } = await db
      .from("subscription_charges")
      .update({ status: "pago", data_pagamento: nowIso })
      .eq("id", chargeId)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao registrar pagamento");
      return false;
    }
    setCharges((prev) => prev.map((c) => (c.id === chargeId ? { ...c, status: "pago", data_pagamento: nowIso } : c)));

    // 3. Gera próxima cobrança
    const [yy, mm] = charge.mes_referencia.split("-").map(Number);
    const curRef = a.frequencia === "anual" ? new Date(yy, 0, 1) : new Date(yy, (mm || 1) - 1, 1);
    const nxt = nextRef(a, curRef);
    const nextPeriod = periodKey(a, nxt);
    const alreadyHasNext = charges.some((c) => c.subscription_id === a.id && c.mes_referencia === nextPeriod);
    if (!alreadyHasNext) {
      const payload = {
        user_id: user.id,
        subscription_id: a.id,
        mes_referencia: nextPeriod,
        valor: a.valor,
        vencimento: computeVencimento(a, nxt),
        status: "pendente",
      };
      const { data } = await db
        .from("subscription_charges")
        .upsert(payload, { onConflict: "subscription_id,mes_referencia", ignoreDuplicates: true })
        .select("*")
        .maybeSingle();
      if (data) setCharges((prev) => [data as SubscriptionCharge, ...prev]);
    }

    toast.success("Assinatura paga", { description: a.nome });
    return true;
  };

  const value = useMemo(
    () => ({ charges, loading, payCharge, refetch, getCurrentChargeFor }),
    [charges, loading, refetch, getCurrentChargeFor],
  );

  return <SubscriptionChargesContext.Provider value={value}>{children}</SubscriptionChargesContext.Provider>;
};

export const useSubscriptionCharges = () => {
  const ctx = useContext(SubscriptionChargesContext);
  if (!ctx) throw new Error("useSubscriptionCharges deve ser usado dentro de SubscriptionChargesProvider");
  return ctx;
};
