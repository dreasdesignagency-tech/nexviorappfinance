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
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Plus, Target, TrendingUp, Trash2, Wallet, Activity, PiggyBank, Sparkles, Minus } from "lucide-react";
import {
  useLimits,
  calcularGastoLimite,
  TIPOS_INVESTIMENTO,
  PeriodoLimite,
  TipoInvestimento,
} from "@/store/limits";
import { useGoals } from "@/store/goals";
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
  const { goals, addGoal, removeGoal, addAmount } = useGoals();
  const { transactions } = useTransactions();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const pathTab =
    location.pathname.startsWith("/metas") ? "metas" :
    location.pathname.startsWith("/investimentos") ? "investimentos" :
    location.pathname.startsWith("/orcamento") ? "orcamento" : null;
  const tabParam = searchParams.get("tab");
  const initialTab =
    pathTab ?? (tabParam === "metas" || tabParam === "investimentos" ? tabParam : "orcamento");
  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    if (pathTab && pathTab !== tab) setTab(pathTab);
  }, [pathTab]);
  useEffect(() => {
    if (!pathTab && tab !== (searchParams.get("tab") || "orcamento")) {
      setSearchParams({ tab }, { replace: true });
    }
  }, [tab]);

  // ---------- Orçamento (Limite) ----------
  const [openLimit, setOpenLimit] = useState(false);
  const [lCategoria, setLCategoria] = useState("");
  const [lValor, setLValor] = useState("");
  const [lPeriodo, setLPeriodo] = useState<PeriodoLimite>("Mensal");
  const [lData, setLData] = useState(todayISO());
  const [lObs, setLObs] = useState("");

  const resetLimit = () => {
    setLCategoria(""); setLValor(""); setLPeriodo("Mensal"); setLData(todayISO()); setLObs("");
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
    toast.success("Orçamento criado com sucesso.");
    resetLimit();
    setOpenLimit(false);
  };

  const limitesComCalculo = useMemo(
    () =>
      limits.map((l) => {
        const gasto = calcularGastoLimite(l, transactions);
        const restante = Math.max(0, l.valor_limite - gasto);
        const pct = l.valor_limite > 0 ? (gasto / l.valor_limite) * 100 : 0;
        let status: "Dentro do orçamento" | "Próximo do limite" | "Orçamento excedido" =
          "Dentro do orçamento";
        if (pct >= 100) status = "Orçamento excedido";
        else if (pct >= 80) status = "Próximo do limite";
        return { ...l, gasto, restante, pct, status };
      }),
    [limits, transactions],
  );

  // ---------- Metas ----------
  const [openGoal, setOpenGoal] = useState(false);
  const [gNome, setGNome] = useState("");
  const [gObjetivo, setGObjetivo] = useState("");
  const [gAtual, setGAtual] = useState("");
  const [gData, setGData] = useState("");
  const [gObs, setGObs] = useState("");

  const resetGoal = () => { setGNome(""); setGObjetivo(""); setGAtual(""); setGData(""); setGObs(""); };

  const submitGoal = () => {
    const objetivo = parseFloat(gObjetivo.replace(",", "."));
    const atual = gAtual ? parseFloat(gAtual.replace(",", ".")) : 0;
    if (!gNome.trim() || !objetivo || objetivo <= 0) {
      toast.error("Preencha o nome e o valor objetivo.");
      return;
    }
    addGoal({
      nome: gNome.trim(),
      valor_objetivo: objetivo,
      valor_atual: atual,
      data_alvo: gData || undefined,
      observacao: gObs || undefined,
    });
    toast.success("Meta criada! Continue firme. 💪");
    resetGoal();
    setOpenGoal(false);
  };

  const [openAdd, setOpenAdd] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");

  const submitAdd = (sign: 1 | -1) => {
    if (!openAdd) return;
    const valor = parseFloat(addValue.replace(",", "."));
    if (!valor || valor <= 0) { toast.error("Informe um valor válido."); return; }
    addAmount(openAdd, sign * valor);
    toast.success(sign > 0 ? "Valor adicionado à meta." : "Valor retirado da meta.");
    setAddValue("");
    setOpenAdd(null);
  };

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
    setINome(""); setITipo("Renda fixa"); setIValor(""); setIData(todayISO()); setIRent(""); setIAtual(""); setIObs("");
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
      <main className="flex-1 min-w-0 p-3 sm:p-6 md:p-10 max-w-[1400px] mx-auto overflow-x-hidden pt-safe pb-24 md:pb-10">
        <header className="mb-6 pl-12 md:pl-0">
          <h1 className="text-3xl font-bold tracking-tight">
            {tab === "metas" ? "Metas" : tab === "investimentos" ? "Investimentos" : "Orçamento"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "metas"
              ? "Conquiste seus sonhos com caixinhas dedicadas a cada objetivo."
              : tab === "investimentos"
              ? "Acompanhe seu patrimônio e faça seu dinheiro crescer."
              : "Controle seus gastos por categoria e mantenha o equilíbrio do mês."}
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="w-full">

          {/* ============ ORÇAMENTO ============ */}
          <TabsContent value="orcamento" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold">Seu Orçamento</h2>
                <p className="text-xs text-muted-foreground">
                  Defina quanto pretende gastar em cada categoria e acompanhe o consumo.
                </p>
              </div>
              <Button onClick={() => setOpenLimit(true)} className="bg-gradient-primary glow-primary">
                <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
              </Button>
            </div>

            {limitesComCalculo.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhum orçamento definido ainda</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Crie um orçamento para manter seus gastos sob controle.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {limitesComCalculo.map((l) => {
                  const statusColor =
                    l.status === "Orçamento excedido"
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
                        <span className="text-muted-foreground">Disponível</span>
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

          {/* ============ METAS ============ */}
          <TabsContent value="metas" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold">Suas Metas</h2>
                <p className="text-xs text-muted-foreground">
                  Crie caixinhas para realizar seus sonhos. Cada depósito é um passo a mais.
                </p>
              </div>
              <Button onClick={() => setOpenGoal(true)} className="bg-gradient-primary glow-primary">
                <Plus className="w-4 h-4 mr-2" /> Nova Meta
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhuma meta criada ainda</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Que tal começar com sua próxima viagem? ✈️</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((g) => {
                  const pct = g.valor_objetivo > 0 ? Math.min(100, (g.valor_atual / g.valor_objetivo) * 100) : 0;
                  const restante = Math.max(0, g.valor_objetivo - g.valor_atual);
                  const concluida = pct >= 100;
                  return (
                    <div key={g.id} className="glass-card p-5 space-y-4 relative overflow-hidden">
                      {concluida && (
                        <div className="absolute top-2 right-2 text-success">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center">
                            <PiggyBank className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold leading-tight">{g.nome}</div>
                            {g.data_alvo && (
                              <div className="text-[11px] text-muted-foreground">até {new Date(g.data_alvo).toLocaleDateString("pt-BR")}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeGoal(g.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground">{formatBRL(g.valor_atual)}</span>
                          <span className="font-medium">{formatBRL(g.valor_objetivo)}</span>
                        </div>
                        <Progress value={pct} className="h-2.5" />
                        <div className="flex justify-between text-[11px] mt-1.5">
                          <span className={cn("font-semibold", concluida ? "text-success" : "text-primary")}>
                            {pct.toFixed(1)}% conquistado
                          </span>
                          <span className="text-muted-foreground">faltam {formatBRL(restante)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => { setOpenAdd(g.id); setAddValue(""); }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Depositar
                        </Button>
                      </div>

                      {g.observacao && (
                        <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                          {g.observacao}
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
            <div className="flex items-center justify-between flex-wrap gap-3">
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

      {/* ============ MODAL: NOVO ORÇAMENTO ============ */}
      <Dialog open={openLimit} onOpenChange={setOpenLimit}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
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
                <Label>Valor (R$)</Label>
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

      {/* ============ MODAL: NOVA META ============ */}
      <Dialog open={openGoal} onOpenChange={setOpenGoal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da meta</Label>
              <Input value={gNome} onChange={(e) => setGNome(e.target.value)} placeholder="Ex: Viagem para a praia" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor objetivo (R$)</Label>
                <Input type="number" step="0.01" value={gObjetivo} onChange={(e) => setGObjetivo(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Já guardou (R$)</Label>
                <Input type="number" step="0.01" value={gAtual} onChange={(e) => setGAtual(e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data alvo (opcional)</Label>
              <Input type="date" value={gData} onChange={(e) => setGData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea placeholder="Opcional..." value={gObs} onChange={(e) => setGObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenGoal(false)}>Cancelar</Button>
            <Button onClick={submitGoal} className="bg-gradient-primary">Criar Meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ MODAL: DEPOSITAR EM META ============ */}
      <Dialog open={!!openAdd} onOpenChange={(o) => !o && setOpenAdd(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Movimentar meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => submitAdd(-1)} className="w-full sm:w-auto">
              <Minus className="w-4 h-4 mr-1" /> Retirar
            </Button>
            <Button onClick={() => submitAdd(1)} className="bg-gradient-primary w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" /> Depositar
            </Button>
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
