import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export interface Profile {
  nome: string;
  telefone: string;
  email: string;
  avatar?: string;
}

const EMPTY: Profile = { nome: "", telefone: "", email: "", avatar: "" };

interface UpdateInput {
  nome?: string;
  telefone?: string;
  avatar?: string; // direct URL (e.g. cleared with "")
  avatarFile?: File | null; // upload a new image
}

interface Ctx {
  profile: Profile;
  loading: boolean;
  updateProfile: (p: UpdateInput) => Promise<void>;
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

      // Ensure profile row exists (idempotent)
      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name:
              (user.user_metadata?.full_name as string) ||
              user.email?.split("@")[0] ||
              "",
            phone: (user.user_metadata?.phone as string) || "",
          },
          { onConflict: "id", ignoreDuplicates: true }
        );

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setLoading(false);
      if (!active) return;
      if (error) return;

      setProfile({
        nome:
          data?.full_name ||
          (user.user_metadata?.full_name as string) ||
          user.email?.split("@")[0] ||
          "",
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

    let avatarUrl: string | undefined = p.avatar;

    // If a new file was provided, upload it to storage first
    if (p.avatarFile) {
      const file = p.avatarFile;
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
          cacheControl: "3600",
        });

      if (upErr) {
        toast.error("Erro ao enviar imagem.");
        return;
      }

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      // bust cache so the UI refreshes immediately
      avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
    }

    const dbPatch: Record<string, unknown> = {};
    if (p.nome !== undefined) dbPatch.full_name = p.nome;
    if (p.telefone !== undefined) dbPatch.phone = p.telefone;
    if (avatarUrl !== undefined) dbPatch.avatar_url = avatarUrl;

    // Use upsert so it works even if row was missing
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...dbPatch }, { onConflict: "id" });

    if (error) {
      toast.error("Erro ao atualizar perfil.");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      ...(p.nome !== undefined ? { nome: p.nome } : {}),
      ...(p.telefone !== undefined ? { telefone: p.telefone } : {}),
      ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
    }));
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
