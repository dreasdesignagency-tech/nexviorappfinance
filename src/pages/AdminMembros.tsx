import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: "admin" | "user";
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function AdminMembros() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Member | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_members");
    if (error) {
      toast.error("Erro ao carregar membros: " + error.message);
    } else {
      setMembers((data as Member[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.rpc("admin_delete_user", { _user_id: toDelete.id });
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Usuário excluído.");
      setMembers((prev) => prev.filter((m) => m.id !== toDelete.id));
    }
    setToDelete(null);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <header className="mb-6 mt-12 md:mt-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Membros
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Painel administrativo — visível apenas para administradores.
          </p>
        </header>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhum membro.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-elevated/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Nome</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Papel</th>
                      <th className="text-left px-4 py-3 font-medium">Criado em</th>
                      <th className="text-left px-4 py-3 font-medium">Último login</th>
                      <th className="text-right px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-t border-border/40 hover:bg-surface-elevated/30">
                        <td className="px-4 py-3 text-foreground">{m.full_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                              m.role === "admin"
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {m.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(m.created_at)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(m.last_sign_in_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDelete(m)}
                            disabled={m.role === "admin"}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/40">
                {members.map((m) => (
                  <div key={m.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{m.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                          m.role === "admin"
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Criado: {fmt(m.created_at)}</p>
                      <p>Último login: {fmt(m.last_sign_in_at)}</p>
                    </div>
                    {m.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDelete(m)}
                        className="w-full text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{toDelete?.email}</strong> e todos os dados
              associados. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
