import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export interface Profile {
  nome: string;
  telefone: string;
  email: string;
  avatar?: string;
}

const EMPTY: Profile = { nome: "", telefone: "", email: "", avatar: "" };

interface Ctx {
  profile: Profile;
  loading: boolean;
  updateProfile: (p: Partial<Pick<Profile, "nome" | "telefone" | "avatar">>) => Promise<void>;
}

const ProfileContext = createContext<Ctx | null>(null);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setProfile(EMPTY);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setLoading(false);
      if (!active) return;
      if (error) {
        return;
      }
      setProfile({
        nome: data?.full_name || (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "",
        telefone: data?.phone || (user.user_metadata?.phone as string) || "",
        email: user.email || "",
        avatar: data?.avatar_url || "",
      });
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const updateProfile: Ctx["updateProfile"] = async (p) => {
    if (!user) return;
    const dbPatch: TablesUpdate<"profiles"> = {};
    if (p.nome !== undefined) dbPatch.full_name = p.nome;
    if (p.telefone !== undefined) dbPatch.phone = p.telefone;
    if (p.avatar !== undefined) dbPatch.avatar_url = p.avatar;
    const { error } = await supabase.from("profiles").update(dbPatch).eq("id", user.id);
    if (error) {
      toast.error("Erro ao atualizar perfil.");
      return;
    }
    setProfile((prev) => ({ ...prev, ...p }));
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
};
