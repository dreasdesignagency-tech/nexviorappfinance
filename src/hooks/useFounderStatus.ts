import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

export const useFounderStatus = () => {
  const { user } = useAuth();
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setIsFounder(false);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_subscriptions")
        .select("is_founder")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setIsFounder(Boolean((data as any)?.is_founder));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return { isFounder, loading };
};
