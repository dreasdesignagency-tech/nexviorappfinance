import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Crown, Users, Calendar, Loader2, Trash2 } from "lucide-react";

interface FounderRow {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  signup_source: string;
  created_at: string;
}

interface Stats {
  total: number;
  last_24h: number;
  last_7d: number;
  is_open: boolean;
  max_slots: number | null;
  slots_remaining: number | null;
  founders: FounderRow[];
}

const AdminLancamento = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxSlots, setMaxSlots] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_launch_stats" as any);
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar estatísticas");
      return;
    }
    const s = data as Stats;
    setStats(s);
    setMaxSlots(s.max_slots == null ? "" : String(s.max_slots));
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async (open: boolean) => {
    setSaving(true);
    const slots = maxSlots.trim() === "" ? null : Math.max(0, parseInt(maxSlots, 10) || 0);
    const { error } = await supabase.rpc("admin_set_launch_open" as any, {
      p_open: open,
      p_max_slots: slots,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Configurações atualizadas");
    load();
  };

  const revoke = async (userId: string) => {
    if (!confirm("Revogar acesso Founder deste usuário?")) return;
    const { error } = await supabase.rpc("admin_revoke_founder" as any, { _user_id: userId });
    if (error) {
      toast.error("Erro ao revogar");
      return;
    }
    toast.success("Founder revogado");
    load();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64">
        <header className="mb-6 flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-300" />
          <div>
            <h1 className="text-2xl font-bold">Lançamento Founder</h1>
            <p className="text-sm text-muted-foreground">Acompanhe os cadastros e gerencie a campanha</p>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> Total Founders
                </p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Últimas 24h
                </p>
                <p className="text-2xl font-bold mt-1">{stats.last_24h}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Últimos 7 dias
                </p>
                <p className="text-2xl font-bold mt-1">{stats.last_7d}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Vagas restantes</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.slots_remaining === null ? "∞" : stats.slots_remaining}
                </p>
              </Card>
            </div>

            <Card className="p-5 mb-6">
              <h2 className="font-semibold mb-4">Configurações da campanha</h2>
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={stats.is_open}
                    onCheckedChange={(v) => saveSettings(v)}
                    disabled={saving}
                  />
                  <Label className="cursor-pointer">{stats.is_open ? "Lançamento aberto" : "Lançamento fechado"}</Label>
                </div>
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="max_slots" className="text-xs">Vagas máximas (vazio = ilimitado)</Label>
                  <Input
                    id="max_slots"
                    type="number"
                    min="0"
                    value={maxSlots}
                    onChange={(e) => setMaxSlots(e.target.value)}
                    placeholder="Ilimitado"
                    className="mt-1"
                  />
                </div>
                <Button onClick={() => saveSettings(stats.is_open)} disabled={saving}>
                  {saving ? "Salvando…" : "Salvar vagas"}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold mb-4">Founders ({stats.founders.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3">Nome</th>
                      <th className="py-2 pr-3">E-mail</th>
                      <th className="py-2 pr-3">WhatsApp</th>
                      <th className="py-2 pr-3">Origem</th>
                      <th className="py-2 pr-3">Data</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.founders.map((f) => (
                      <tr key={f.id} className="border-b border-border/50">
                        <td className="py-2 pr-3">{f.full_name || "—"}</td>
                        <td className="py-2 pr-3">{f.email}</td>
                        <td className="py-2 pr-3">{f.phone || "—"}</td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                            {f.signup_source}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {new Date(f.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 pr-3">
                          <Button size="sm" variant="ghost" onClick={() => revoke(f.user_id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {stats.founders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                          Nenhum founder ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default AdminLancamento;
