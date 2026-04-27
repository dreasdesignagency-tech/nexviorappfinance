import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BANCOS, TipoCartao, useCards } from "@/store/cards";
import { formatBRL, useTransactions, formatDateShort } from "@/store/transactions";
import { Progress } from "@/components/ui/progress";

const TIPOS: TipoCartao[] = ["Crédito", "Débito", "Múltiplo"];

const Cartoes = () => {
  const { cards, loading, addCard, removeCard } = useCards();
  const { transactions } = useTransactions();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const cardStats = (cardId: string) => {
    const txs = transactions.filter((t) => t.cartao_id === cardId && t.tipo === "despesa");
    const monthTxs = txs.filter((t) => {
      const [y, m] = t.data.split("-").map(Number);
      return y === currentYear && m - 1 === currentMonth;
    });
    const gastoMes = monthTxs.reduce((sum, t) => sum + t.valor, 0);
    return { gastoMes, monthTxs, allTxs: txs };
  };
  const [open, setOpen] = useState(false);

  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [tipo, setTipo] = useState<TipoCartao>("Crédito");
  const [limite, setLimite] = useState("");
  const [diaVenc, setDiaVenc] = useState("");
  const [diaFech, setDiaFech] = useState("");

  const reset = () => {
    setNome(""); setBanco(""); setTipo("Crédito");
    setLimite(""); setDiaVenc(""); setDiaFech("");
  };

  const handleSave = async () => {
    if (!nome.trim()) return toast.error("Informe o nome do cartão");
    if (!banco.trim()) return toast.error("Informe o banco");
    if (!tipo) return toast.error("Selecione o tipo");

    const dv = diaVenc ? Number(diaVenc) : undefined;
    const df = diaFech ? Number(diaFech) : undefined;
    if (dv && (dv < 1 || dv > 31)) return toast.error("Dia vencimento inválido");
    if (df && (df < 1 || df > 31)) return toast.error("Dia fechamento inválido");

    const ok = await addCard({
      nome: nome.trim(),
      banco: banco.trim(),
      tipo,
      limite: limite ? Number(limite) : undefined,
      dia_vencimento: dv,
      dia_fechamento: df,
    });
    if (!ok) return;
    toast.success("Cartão cadastrado", { description: nome });
    reset();
    setOpen(false);
  };

  const showCreditFields = tipo === "Crédito" || tipo === "Múltiplo";

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1500px] mx-auto w-full overflow-x-hidden pt-safe">
        <header className="flex items-center justify-between mb-6 gap-4 flex-wrap pl-12 md:pl-0">
          <div>
            <p className="text-sm text-muted-foreground">Gerencie seus cartões</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Cartões</h1>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow glow-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Novo Cartão
          </Button>
        </header>

        {loading ? (
          <div className="glass-card py-20 px-6 text-center text-sm text-muted-foreground">Carregando cartões...</div>
        ) : cards.length === 0 ? (
          <div className="glass-card py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto bg-surface-elevated/60 border border-border/50 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium">Nenhum cartão cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione seu primeiro cartão para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => {
              const { gastoMes, monthTxs } = cardStats(c.id);
              const temLimite = !!c.limite && c.limite > 0;
              const disponivel = temLimite ? Math.max(0, (c.limite ?? 0) - gastoMes) : 0;
              const pct = temLimite ? Math.min(100, (gastoMes / (c.limite ?? 1)) * 100) : 0;
              const recentes = [...monthTxs]
                .sort((a, b) => b.data.localeCompare(a.data))
                .slice(0, 3);

              return (
                <div key={c.id} className="glass-card p-5 relative group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <button
                      onClick={async () => { const ok = await removeCard(c.id); if (ok) toast.success("Cartão removido"); }}
                      className="opacity-0 group-hover:opacity-100 transition w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-base font-semibold truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.banco} · {c.tipo}</p>

                  {temLimite && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Disponível</span>
                        <span className="text-sm font-semibold tabular-nums text-success">{formatBRL(disponivel)}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <div className="flex items-baseline justify-between text-xs text-muted-foreground tabular-nums">
                        <span>Gasto: <span className="text-foreground font-medium">{formatBRL(gastoMes)}</span></span>
                        <span>Limite: {formatBRL(c.limite ?? 0)}</span>
                      </div>
                    </div>
                  )}

                  {!temLimite && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Gasto no mês</p>
                      <p className="text-sm font-semibold tabular-nums">{formatBRL(gastoMes)}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/40">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Vencimento</p>
                      <p className="text-sm font-medium tabular-nums">
                        {c.dia_vencimento ? `Dia ${c.dia_vencimento}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Fechamento</p>
                      <p className="text-sm font-medium tabular-nums">
                        {c.dia_fechamento ? `Dia ${c.dia_fechamento}` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Despesas do mês</p>
                    {recentes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma despesa registrada neste mês.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {recentes.map((t) => (
                          <li key={t.id} className="flex items-center justify-between text-xs">
                            <span className="truncate text-foreground/90">{t.titulo}</span>
                            <span className="tabular-nums text-muted-foreground ml-2 shrink-0">
                              {formatDateShort(t.data)} · {formatBRL(t.valor)}
                            </span>
                          </li>
                        ))}
                        {monthTxs.length > recentes.length && (
                          <li className="text-[11px] text-muted-foreground pt-1">
                            +{monthTxs.length - recentes.length} outras
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogContent className="glass-card border-border/60 max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Cartão</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Nubank" />
              </div>

              <div className="grid gap-2">
                <Label>Banco</Label>
                <Select value={banco} onValueChange={setBanco}>
                  <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCartao)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>
                  Limite (R$) {showCreditFields ? "" : <span className="text-muted-foreground text-xs">(opcional)</span>}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Dia vencimento</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={diaVenc}
                    onChange={(e) => setDiaVenc(e.target.value)}
                    placeholder="1-31"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dia fechamento</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={diaFech}
                    onChange={(e) => setDiaFech(e.target.value)}
                    placeholder="1-31"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-primary to-primary-glow glow-primary text-primary-foreground"
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Cartoes;
