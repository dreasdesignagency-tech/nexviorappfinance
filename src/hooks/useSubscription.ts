import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "inactive";

export interface UserSubscription {
  subscription_status: SubscriptionStatus | string;
  plan_type: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      setResolvedUserId(null);
      return;
    }

    const isFirstLoadForUser = resolvedUserId !== user.id;
    if (isFirstLoadForUser) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("subscription_status, plan_type, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[useSubscription] failed to load subscription", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        status: (error as any)?.status,
      });
      // On transient failure, keep previous subscription state so the user
      // is not bounced to /planos or /login because of a network/quota error.
      setResolvedUserId(user.id);
      setLoading(false);
      return;
    }
    setSubscription((data as UserSubscription) ?? null);
    setResolvedUserId(user.id);
    setLoading(false);
  }, [resolvedUserId, user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  const hasAccess = !!subscription && (
    subscription.subscription_status === "active" ||
    subscription.subscription_status === "trialing" ||
    subscription.plan_type === "legacy"
  );

  const needsInitialResolution = !!user && resolvedUserId !== user.id;

  return { subscription, loading: authLoading || needsInitialResolution || loading, hasAccess, refresh };
};
