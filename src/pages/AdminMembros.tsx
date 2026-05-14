import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Trash2,
  Shield,
  User as UserIcon,
  Search,
  MoreVertical,
  Ban,
  CheckCircle2,
  Eye,
  CreditCard,
  Receipt,
  Repeat,
  Mail,
  Gift,
  Loader2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AccessGrant {
  id: string;
  email: string;
  plan_type: string;
  note: string | null;
  granted_at: string;
  claimed_user_id: string | null;
  claimed_at: string | null;
}

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: "admin" | "user";
  banned_until: string | null;
}

interface UserDetails {
  transactions: Array<{
    id: string;
    descricao: string;
    valor: number;
    tipo: string;
    categoria: string;
    data: string;
    forma_pagamento: string | null;
  }>;
  cards: Array<{
    id: string;
    nome: string;
    banco: string;
    bandeira: string | null;
    tipo: string;
    limite: number | null;
    ativo: boolean;
  }>;
  subscriptions: Array<{
    id: string;
    nome: string;
    valor: number;
    frequencia: string;
    status: string;
    data_cobranca: string;
  }>;
  counts: { transactions: number; cards: number; subscriptions: number };
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const isBanned = (m: Member) => {
  if (!m.banned_until) return false;
  // 'infinity' or future date
  return m.banned_until === "infinity" || new Date(m.banned_until).getTime() > Date.now();
};

type SortKey = "newest" | "oldest";
type StatusFilter = "all" | "active" | "banned";

export default function AdminMembros() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const [toDelete, setToDelete] = useState<Member | null>(null);
  const [toToggleBan, setToToggleBan] = useState<Member | null>(null);
  const [detailsMember, setDetailsMember] = useState<Member | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const filtered = useMemo(() => {
    let list = [...members];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.email.toLowerCase().includes(q) ||
          (m.full_name ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((m) => (statusFilter === "banned" ? isBanned(m) : !isBanned(m)));
    }
    list.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return list;
  }, [members, search, statusFilter, sort]);

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

  const handleToggleBan = async () => {
    if (!toToggleBan) return;
    const banning = !isBanned(toToggleBan);
    const { error } = await supabase.rpc("admin_set_user_banned", {
      _user_id: toToggleBan.id,
      _banned: banning,
    });
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success(banning ? "Usuário bloqueado." : "Usuário ativado.");
      setMembers((prev) =>
        prev.map((m) =>
          m.id === toToggleBan.id
            ? { ...m, banned_until: banning ? "infinity" : null }
            : m,
        ),
      );
    }
    setToToggleBan(null);
  };

  const openDetails = async (m: Member) => {
    setDetailsMember(m);
    setDetails(null);
    setDetailsLoading(true);
    const { data, error } = await supabase.rpc("admin_get_user_details", { _user_id: m.id });
    if (error) {
      toast.error("Erro ao carregar detalhes: " + error.message);
    } else {
      setDetails(data as unknown as UserDetails);
    }
    setDetailsLoading(false);
  };

  const StatusBadge = ({ m }: { m: Member }) => {
    const banned = isBanned(m);
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          banned
            ? "bg-destructive/15 text-destructive border border-destructive/30"
            : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
        }`}
      >
        {banned ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
        {banned ? "Bloqueado" : "Ativo"}
      </span>
    );
  };

  const RoleBadge = ({ role }: { role: "admin" | "user" }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
        role === "admin"
          ? "bg-primary/15 text-primary border border-primary/30"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
      {role}
    </span>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full pt-safe">
        <header className="mb-6 mt-12 md:mt-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Membros
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Painel administrativo — visível apenas para administradores.
          </p>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="banned">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {members.length === 0 ? "Nenhum membro." : "Nenhum membro encontrado."}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-elevated/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Nome</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Papel</th>
                      <th className="text-left px-4 py-3 font-medium">Criado em</th>
                      <th className="text-left px-4 py-3 font-medium">Último login</th>
                      <th className="text-right px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr
                        key={m.id}
                        className="border-t border-border/40 hover:bg-surface-elevated/30"
                      >
                        <td className="px-4 py-3 text-foreground">{m.full_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                        <td className="px-4 py-3">
                          <StatusBadge m={m} />
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={m.role} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(m.created_at)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {fmt(m.last_sign_in_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openDetails(m)}>
                                <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                              </DropdownMenuItem>
                              {m.role !== "admin" && (
                                <>
                                  <DropdownMenuItem onClick={() => setToToggleBan(m)}>
                                    {isBanned(m) ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Ativar
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" /> Bloquear
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setToDelete(m)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/40">
                {filtered.map((m) => (
                  <div key={m.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {m.full_name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge m={m} />
                        <RoleBadge role={m.role} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Criado: {fmt(m.created_at)}</p>
                      <p>Último login: {fmt(m.last_sign_in_at)}</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetails(m)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Detalhes
                      </Button>
                      {m.role !== "admin" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setToToggleBan(m)}
                            className="flex-1"
                          >
                            {isBanned(m) ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Ativar
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 mr-1" /> Bloquear
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDelete(m)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </main>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{toDelete?.email}</strong> e todos os
              dados associados. Não pode ser desfeita.
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

      {/* Ban confirm */}
      <AlertDialog open={!!toToggleBan} onOpenChange={(o) => !o && setToToggleBan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toToggleBan && isBanned(toToggleBan) ? "Ativar usuário?" : "Bloquear usuário?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toToggleBan && isBanned(toToggleBan)
                ? `${toToggleBan?.email} poderá acessar a plataforma novamente.`
                : `${toToggleBan?.email} ficará impedido de fazer login até ser desbloqueado.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleBan}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details modal */}
      <Dialog
        open={!!detailsMember}
        onOpenChange={(o) => {
          if (!o) {
            setDetailsMember(null);
            setDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              {detailsMember?.full_name || detailsMember?.email}
            </DialogTitle>
            <DialogDescription>{detailsMember?.email}</DialogDescription>
          </DialogHeader>

          {detailsMember && (
            <div className="space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-surface-elevated/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge m={detailsMember} />
                  </div>
                </div>
                <div className="bg-surface-elevated/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Papel</p>
                  <div className="mt-1">
                    <RoleBadge role={detailsMember.role} />
                  </div>
                </div>
                <div className="bg-surface-elevated/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="mt-1 text-foreground">{detailsMember.phone || "—"}</p>
                </div>
                <div className="bg-surface-elevated/40 rounded-lg p-3 col-span-2 md:col-span-1">
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="mt-1 text-foreground">{fmt(detailsMember.created_at)}</p>
                </div>
                <div className="bg-surface-elevated/40 rounded-lg p-3 col-span-2 md:col-span-2">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="mt-1 text-foreground font-mono text-xs break-all">
                    {detailsMember.id}
                  </p>
                </div>
              </div>

              {detailsLoading ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Carregando dados…
                </div>
              ) : details ? (
                <>
                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface-elevated/40 rounded-lg p-3 text-center">
                      <Receipt className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-semibold text-foreground">
                        {details.counts.transactions}
                      </p>
                      <p className="text-xs text-muted-foreground">Transações</p>
                    </div>
                    <div className="bg-surface-elevated/40 rounded-lg p-3 text-center">
                      <CreditCard className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-semibold text-foreground">
                        {details.counts.cards}
                      </p>
                      <p className="text-xs text-muted-foreground">Cartões</p>
                    </div>
                    <div className="bg-surface-elevated/40 rounded-lg p-3 text-center">
                      <Repeat className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-semibold text-foreground">
                        {details.counts.subscriptions}
                      </p>
                      <p className="text-xs text-muted-foreground">Assinaturas</p>
                    </div>
                  </div>

                  {/* Cards */}
                  <section>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Cartões
                    </h3>
                    {details.cards.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum cartão.</p>
                    ) : (
                      <div className="space-y-2">
                        {details.cards.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between bg-surface-elevated/40 rounded-lg p-3 text-sm"
                          >
                            <div>
                              <p className="text-foreground font-medium">{c.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {c.banco} · {c.bandeira || c.tipo}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-foreground">
                                {c.limite ? fmtBRL(Number(c.limite)) : "—"}
                              </p>
                              <p
                                className={`text-xs ${c.ativo ? "text-emerald-500" : "text-muted-foreground"}`}
                              >
                                {c.ativo ? "Ativo" : "Inativo"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Subscriptions */}
                  <section>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Repeat className="w-4 h-4" /> Assinaturas
                    </h3>
                    {details.subscriptions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma assinatura.</p>
                    ) : (
                      <div className="space-y-2">
                        {details.subscriptions.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between bg-surface-elevated/40 rounded-lg p-3 text-sm"
                          >
                            <div>
                              <p className="text-foreground font-medium">{s.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.frequencia} · próxima {fmtDate(s.data_cobranca)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-foreground">{fmtBRL(Number(s.valor))}</p>
                              <p className="text-xs text-muted-foreground">{s.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Transactions */}
                  <section>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Receipt className="w-4 h-4" /> Últimas transações
                    </h3>
                    {details.transactions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma transação.</p>
                    ) : (
                      <div className="space-y-1">
                        {details.transactions.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between bg-surface-elevated/40 rounded-lg p-3 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="text-foreground font-medium truncate">
                                {t.descricao}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {fmtDate(t.data)} · {t.categoria}
                                {t.forma_pagamento ? ` · ${t.forma_pagamento}` : ""}
                              </p>
                            </div>
                            <p
                              className={`shrink-0 font-medium ${
                                t.tipo === "receita" || t.tipo === "entrada"
                                  ? "text-emerald-500"
                                  : "text-destructive"
                              }`}
                            >
                              {fmtBRL(Number(t.valor))}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
