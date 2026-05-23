import { useRef, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/store/profile";
import { toast } from "sonner";
import { Mail, Phone, User, Lock, Camera, Trash2, Sparkles, Smartphone, Palette, Check } from "lucide-react";
import { useColorTheme } from "@/store/colorTheme";
import { resetOnboarding } from "@/components/onboarding/OnboardingTour";
import { resetInstallTour, InstallAppTour } from "@/components/onboarding/InstallAppTour";
import { useNavigate } from "react-router-dom";
import { FounderBadge } from "@/components/FounderBadge";
import { useFounderStatus } from "@/hooks/useFounderStatus";

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const Perfil = () => {
  const { profile, updateProfile } = useProfile();
  const { isFounder } = useFounderStatus();
  const [nome, setNome] = useState(profile.nome);
  const [telefone, setTelefone] = useState(profile.telefone);
  const [installOpen, setInstallOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { colorTheme, setColorTheme, presets } = useColorTheme();

  const replayInstallTour = () => {
    resetInstallTour();
    setInstallOpen(true);
  };

  const replayTour = () => {
    resetOnboarding();
    navigate("/app");
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    await updateProfile({ avatarFile: file });
    toast.success("Foto atualizada!");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAvatar = async () => {
    await updateProfile({ avatar: "" });
    toast.success("Foto removida.");
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 pb-28 md:pb-8 max-w-3xl mx-auto w-full overflow-x-hidden pt-safe">
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
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-semibold">{profile.nome}</p>
              {isFounder && <FounderBadge />}
            </div>
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

        <div className="glass-card p-5 mt-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" /> Instalar app no celular
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Veja como adicionar o Nexvior à tela inicial do seu celular.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={replayInstallTour}
            className="shrink-0"
          >
            Instalar app
          </Button>
        </div>

        <div className="glass-card p-5 mt-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shrink-0 shadow-[0_0_20px_hsl(var(--primary)/0.45)]">
              <Palette className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Personalização do tema</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Escolha a cor principal do Nexvior do seu jeito.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {presets.map((preset) => {
              const active = preset.id === colorTheme;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setColorTheme(preset.id)}
                  title={preset.label}
                  aria-label={preset.label}
                  aria-pressed={active}
                  className={`group flex flex-col items-center gap-2 rounded-xl p-2 sm:p-3 transition-all duration-300 ${
                    active
                      ? "bg-primary/10 ring-1 ring-primary/60 shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                      : "hover:bg-foreground/5"
                  }`}
                >
                  <span
                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                      active
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                        : "ring-1 ring-border group-hover:scale-105 group-hover:shadow-[0_0_18px_var(--swatch)]"
                    }`}
                    style={
                      {
                        background: preset.swatch,
                        ["--swatch" as any]: preset.swatch,
                      } as React.CSSProperties
                    }
                  >
                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs text-center leading-tight transition-colors ${
                      active ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <InstallAppTour open={installOpen} onClose={() => setInstallOpen(false)} />
      </main>
    </div>
  );
};

export default Perfil;
