import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NewTransactionDialog } from "@/components/dashboard/NewTransactionDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORIAS, formatBRL, formatDateBR, useTransactions } from "@/store/transactions";
import { ArrowDownRight, ArrowUpRight, Eye, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Transacoes = () => {
  const { transactions, removeTransaction } = useTransactions();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<"todos" | "receita" | "despesa">("todos");
  const [categoria, setCategoria] = useState<string>("todas");

  const editingTransaction = useMemo(
    () => transactions.find((transaction) => transaction.id === editingId) ?? null,
    [transactions, editingId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => (tipo === "todos" ? true : t.tipo === tipo))
      .filter((t) => (categoria === "todas" ? true : t.categoria === categoria))
      .filter((t) => {
        if (!q) return true;
        return (
          t.titulo.toLowerCase().includes(q) ||
          t.categoria.toLowerCase().includes(q) ||
          t.tipo.includes(q) ||
          t.data.includes(q) ||
          formatDateBR(t.data).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [transactions, query, tipo, categoria]);

  const handleDelete = (id: string, titulo: string) => {
    removeTransaction(id);
    toast.success("Transação removida", { description: titulo });
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setEditingId(null);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1500px] mx-auto w-full overflow-x-hidden">
        <header className="flex items-center justify-between mb-6 gap-4 flex-wrap pl-12 md:pl-0">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Gerencie suas movimentações</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Transações</h1>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow glow-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Nova
          </Button>
        </header>

        {/* Filtros */}
        <div className="glass-card p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_220px] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 bg-secondary/50 border-border/60"
              />
            </div>

            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger className="bg-secondary/50 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="bg-secondary/50 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista */}
        <div className="glass-card p-2 sm:p-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map((t) => {
                const isReceita = t.tipo === "receita";
                const Icon = isReceita ? ArrowUpRight : ArrowDownRight;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 sm:gap-4 px-2 sm:px-3 py-3 hover:bg-surface-elevated/40 rounded-xl transition group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        isReceita
                          ? "bg-success/15 border-success/25 text-success"
                          : "bg-destructive/15 border-destructive/25 text-destructive"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.titulo}
                        {t._pending && (
                          <span className="ml-1.5 inline-block align-middle text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                            Aguardando sincronização
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.categoria} · {formatDateBR(t.data)}
                        {t.forma_pagamento && <> · {t.forma_pagamento}</>}
                      </p>
                    </div>

                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isReceita ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isReceita ? "+" : "-"}
                      {formatBRL(t.valor)}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition opacity-60 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => toast.info("Visualização em breve")}>
                          <Eye className="w-4 h-4 mr-2" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(t.id)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(t.id, t.titulo)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <NewTransactionDialog open={open} onOpenChange={handleOpenChange} initialValues={editingTransaction} />
      </main>
    </div>
  );
};

export default Transacoes;
