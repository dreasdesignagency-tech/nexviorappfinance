import { useRef, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/store/profile";
import { toast } from "sonner";
import { Mail, Phone, User, Lock, Camera, Trash2, Sparkles } from "lucide-react";
import { resetOnboarding } from "@/components/onboarding/OnboardingTour";
import { useNavigate } from "react-router-dom";

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const Perfil = () => {
  const { profile, updateProfile } = useProfile();
  const [nome, setNome] = useState(profile.nome);
  const [telefone, setTelefone] = useState(profile.telefone);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const replayTour = () => {
    resetOnboarding();
    navigate("/");
    // Index escuta este evento para abrir o tour
    window.setTimeout(() => {
      window.dispatchEvent(new Event("nexvior:open-tour"));
    }, 50);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe seu nome.");
    updateProfile({ nome: nome.trim(), telefone: telefone.trim() });
    toast.success("Perfil atualizado!");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar: reader.result as string });
      toast.success("Foto atualizada!");
    };
    reader.onerror = () => toast.error("Erro ao carregar imagem.");
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    updateProfile({ avatar: "" });
    toast.success("Foto removida.");
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-3xl mx-auto w-full overflow-x-hidden">
        <header className="mb-6 pl-12 md:pl-0">
          <p className="text-sm text-muted-foreground">Suas informações pessoais</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Perfil</h1>
        </header>

        <div className="glass-card p-6 mb-5 flex items-center gap-4">
          <div className="relative group">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent ring-2 ring-border flex items-center justify-center text-xl font-bold text-primary-foreground overflow-hidden transition hover:ring-primary/60"
              title="Alterar foto"
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.nome} className="w-full h-full object-cover" />
              ) : (
                profile.nome.charAt(0).toUpperCase()
              )}
              <span className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Camera className="w-5 h-5 text-foreground" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">{profile.nome}</p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs"
              >
                <Camera className="w-3 h-3 mr-1.5" />
                {profile.avatar ? "Trocar foto" : "Adicionar foto"}
              </Button>
              {profile.avatar && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={removeAvatar}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Remover
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="glass-card p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" /> Nome
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" /> Telefone
            </Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" /> Email
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> Não editável
              </span>
            </Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-primary-glow glow-primary"
            >
              Salvar alterações
            </Button>
          </div>
        </form>

        <div className="glass-card p-5 mt-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Tutorial inicial
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Reveja o passo a passo de como usar o Nexvior.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={replayTour}
            className="shrink-0"
          >
            Ver tutorial novamente
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Perfil;
