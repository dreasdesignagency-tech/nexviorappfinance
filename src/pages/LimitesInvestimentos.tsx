import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState, useMemo } from "react";
import { Plus, Target, TrendingUp, Trash2, Wallet, Activity } from "lucide-react";
import {
  useLimits,
  calcularGastoLimite,
  TIPOS_INVESTIMENTO,
  PeriodoLimite,
  TipoInvestimento,
} from "@/store/limits";
import { useTransactions, formatBRL, CATEGORIAS } from "@/store/transactions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PERIODOS: PeriodoLimite[] = ["Mensal", "Semanal", "Anual"];

const todayISO = () => new Date().toISOString().slice(0, 10);

const LimitesInvestimentos = () => {
  const {
    limits,
    investments,
    addLimit,
    removeLimit,
    addInvestment,
    removeInvestment,
    totalInvestido,
    patrimonioAtual,
    lucroPrejuizo,
    rentabilidadeMedia,
  } = useLimits();
  const { transactions } = useTransactions();

  // ---------- Limite ----------
  const [openLimit, setOpenLimit] = useState(false);
  const [lCategoria, setLCategoria] = useState("");
  const [lValor, setLValor] = useState("");
  const [lPeriodo, setLPeriodo] = useState<PeriodoLimite>("Mensal");
  const [lData, setLData] = useState(todayISO());
  const [lObs, setLObs] = useState("");

  const resetLimit = () => {
    setLCategoria("");
    setLValor("");
    setLPeriodo("Mensal");
    setLData(todayISO());
    setLObs("");
  };

  const submitLimit = () => {
    const valor = parseFloat(lValor.replace(",", "."));
    if (!lCategoria || !valor || valor <= 0 || !lPeriodo || !lData) {
      toast.error("Preencha categoria, valor, período e data inicial.");
      return;
    }
    addLimit({
      categoria: lCategoria,
      valor_limite: valor,
      periodo: lPeriodo,
      data_inicial: lData,
      observacao: lObs || undefined,
    });
    toast.success("Limite criado com sucesso.");
    resetLimit();
    setOpenLimit(false);
  };

  const limitesComCalculo = useMemo(
    () =>
      limits.map((l) => {
        const gasto = calcularGastoLimite(l, transactions);
        const restante = Math.max(0, l.valor_limite - gasto);
        const pct = l.valor_limite > 0 ? (gasto / l.valor_limite) * 100 : 0;
        let status: "Dentro do limite" | "Próximo do limite" | "Limite excedido" =
          "Dentro do limite";
        if (pct >= 100) status = "Limite excedido";
        else if (pct >= 80) status = "Próximo do limite";
        return { ...l, gasto, restante, pct, status };
      }),
    [limits, transactions],
  );

  // ---------- Investimento ----------
  const [openInv, setOpenInv] = useState(false);
  const [iNome, setINome] = useState("");
  const [iTipo, setITipo] = useState<TipoInvestimento>("Renda fixa");
  const [iValor, setIValor] = useState("");
  const [iData, setIData] = useState(todayISO());
  const [iRent, setIRent] = useState("");
  const [iAtual, setIAtual] = useState("");
  const [iObs, setIObs] = useState("");

  const resetInv = () => {
    setINome("");
    setITipo("Renda fixa");
    setIValor("");
    setIData(todayISO());
    setIRent("");
    setIAtual("");
    setIObs("");
  };

  const submitInv = () => {
    const valor = parseFloat(iValor.replace(",", "."));
    if (!iNome.trim() || !iTipo || !valor || valor <= 0 || !iData) {
      toast.error("Preencha nome, tipo, valor investido e data.");
      return;
    }
    const atual = iAtual ? parseFloat(iAtual.replace(",", ".")) : undefined;
    const rent = iRent ? parseFloat(iRent.replace(",", ".")) : undefined;
    addInvestment({
      nome: iNome.trim(),
      tipo: iTipo,
      valor_investido: valor,
      valor_atual: atual,
      rentabilidade: rent,
      data_investimento: iData,
      observacao: iObs || undefined,
    });
    toast.success("Investimento cadastrado.");
    resetInv();
    setOpenInv(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-6 md:p-10 max-w-[1400px] mx-auto overflow-x-hidden">
        <header className="mb-8 pl-12 md:pl-0">
          <h1 className="text-3xl font-bold tracking-tight">Limites & Investimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Defina tetos de gastos por categoria e acompanhe seu patrimônio.
          </p>
        </header>

        <Tabs defaultValue="limites" className="w-full">
          <TabsList className="bg-surface-elevated border border-border">
            <TabsTrigger value="limites" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Target className="w-4 h-4 mr-2" /> Limites
            </TabsTrigger>
            <TabsTrigger value="investimentos" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <TrendingUp className="w-4 h-4 mr-2" /> Investimentos
            </TabsTrigger>
          </TabsList>

          {/* ============ LIMITES ============ */}
          <TabsContent value="limites" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Seus Limites</h2>
                <p className="text-xs text-muted-foreground">
                  Acompanhe quanto você já gastou em cada categoria.
                </p>
              </div>
              <Button onClick={() => setOpenLimit(true)} className="bg-gradient-primary glow-primary">
                <Plus className="w-4 h-4 mr-2" /> Novo Limite
              </Button>
            </div>

            {limitesComCalculo.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhum limite definido</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {limitesComCalculo.map((l) => {
                  const statusColor =
                    l.status === "Limite excedido"
                      ? "text-destructive border-destructive/30 bg-destructive/10"
                      : l.status === "Próximo do limite"
                      ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
                      : "text-success border-success/30 bg-success/10";
                  return (
                    <div key={l.id} className="glass-card p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{l.categoria}</div>
                          <div className="text-xs text-muted-foreground">{l.periodo}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", statusColor)}>
                            {l.status}
                          </span>
                          <button
                            onClick={() => removeLimit(l.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground">
                            {formatBRL(l.gasto)} de {formatBRL(l.valor_limite)}
                          </span>
                          <span className="font-medium">{l.pct.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(100, l.pct)} className="h-2" />
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Restante</span>
                        <span className="font-semibold text-foreground">{formatBRL(l.restante)}</span>
                      </div>

                      {l.observacao && (
                        <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                          {l.observacao}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ============ INVESTIMENTOS ============ */}
          <TabsContent value="investimentos" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Seus Investimentos</h2>
                <p className="text-xs text-muted-foreground">
                  Acompanhe seu patrimônio investido e rentabilidade.
                </p>
              </div>
              <Button onClick={() => setOpenInv(true)} className="bg-gradient-primary glow-primary">
                <Plus className="w-4 h-4 mr-2" /> Novo Investimento
              </Button>
            </div>

            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-4">
              <ResumoCard label="Total Investido" value={formatBRL(totalInvestido)} icon={Wallet} />
              <ResumoCard label="Patrimônio Atual" value={formatBRL(patrimonioAtual)} icon={Activity} />
              <ResumoCard
                label="Lucro / Prejuízo"
                value={formatBRL(lucroPrejuizo)}
                icon={TrendingUp}
                valueClass={lucroPrejuizo >= 0 ? "text-success" : "text-destructive"}
              />
              <ResumoCard
                label="Rentabilidade Média"
                value={`${rentabilidadeMedia.toFixed(2)}%`}
                icon={TrendingUp}
                valueClass={rentabilidadeMedia >= 0 ? "text-success" : "text-destructive"}
              />
            </div>

            {investments.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhum investimento cadastrado</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border">
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-2 text-right">Investido</div>
                  <div className="col-span-2 text-right">Atual</div>
                  <div className="col-span-2 text-right">Rent.</div>
                  <div className="col-span-1" />
                </div>
                {investments.map((i) => {
                  const atual = i.valor_atual ?? i.valor_investido;
                  const rent =
                    i.rentabilidade ??
                    (i.valor_investido > 0
                      ? ((atual - i.valor_investido) / i.valor_investido) * 100
                      : 0);
                  return (
                    <div
                      key={i.id}
                      className="grid grid-cols-12 px-5 py-3 text-sm items-center border-b border-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors"
                    >
                      <div className="col-span-3">
                        <div className="font-medium">{i.nome}</div>
                        <div className="text-xs text-muted-foreground">{i.data_investimento}</div>
                      </div>
                      <div className="col-span-2 text-xs text-muted-foreground">{i.tipo}</div>
                      <div className="col-span-2 text-right">{formatBRL(i.valor_investido)}</div>
                      <div className="col-span-2 text-right">{formatBRL(atual)}</div>
                      <div
                        className={cn(
                          "col-span-2 text-right font-medium",
                          rent >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {rent.toFixed(2)}%
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeInvestment(i.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ============ MODAL: NOVO LIMITE ============ */}
      <Dialog open={openLimit} onOpenChange={setOpenLimit}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo Limite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={lCategoria} onValueChange={setLCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor limite (R$)</Label>
                <Input type="number" step="0.01" value={lValor} onChange={(e) => setLValor(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={lPeriodo} onValueChange={(v) => setLPeriodo(v as PeriodoLimite)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODOS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={lData} onChange={(e) => setLData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea placeholder="Opcional..." value={lObs} onChange={(e) => setLObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenLimit(false)}>Cancelar</Button>
            <Button onClick={submitLimit} className="bg-gradient-primary">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ MODAL: NOVO INVESTIMENTO ============ */}
      <Dialog open={openInv} onOpenChange={setOpenInv}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Investimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do investimento</Label>
              <Input value={iNome} onChange={(e) => setINome(e.target.value)} placeholder="Ex: Tesouro Selic" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={iTipo} onValueChange={(v) => setITipo(v as TipoInvestimento)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_INVESTIMENTO.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do investimento</Label>
                <Input type="date" value={iData} onChange={(e) => setIData(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor investido (R$)</Label>
                <Input type="number" step="0.01" value={iValor} onChange={(e) => setIValor(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Valor atual (R$)</Label>
                <Input type="number" step="0.01" value={iAtual} onChange={(e) => setIAtual(e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rentabilidade atual (%)</Label>
              <Input type="number" step="0.01" value={iRent} onChange={(e) => setIRent(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea placeholder="Opcional..." value={iObs} onChange={(e) => setIObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenInv(false)}>Cancelar</Button>
            <Button onClick={submitInv} className="bg-gradient-primary">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ResumoCard = ({
  label,
  value,
  icon: Icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon: any;
  valueClass?: string;
}) => (
  <div className="glass-card p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className={cn("text-xl font-bold", valueClass)}>{value}</div>
  </div>
);

export default LimitesInvestimentos;
