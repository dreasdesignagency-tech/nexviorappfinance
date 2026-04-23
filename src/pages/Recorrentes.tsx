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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, Plus, Repeat, Trash2, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { useRecurrents, Frequencia } from "@/store/recurrents";
import { useCards } from "@/store/cards";
import { CATEGORIAS, formatBRL, formatDateBR } from "@/store/transactions";

const Recorrentes = () => {
  const {
    parcelas, assinaturas,
    addParcela, removeParcela,
    addAssinatura, removeAssinatura, updateAssinaturaStatus,
    totalMensalParcelas, totalMensalAssinaturas, loading,
  } = useRecurrents();
  const { cards } = useCards();

  const [openP, setOpenP] = useState(false);
  const [openA, setOpenA] = useState(false);

  // Parcela form
  const [pNome, setPNome] = useState("");
  const [pValorTotal, setPValorTotal] = useState("");
  const [pTotalParc, setPTotalParc] = useState("");
  const [pValorParc, setPValorParc] = useState("");
  const [pDataInicio, setPDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [pCategoria, setPCategoria] = useState<string>("");
  const [pCartao, setPCartao] = useState<string>("");

  // Assinatura form
  const [aNome, setANome] = useState("");
  const [aValor, setAValor] = useState("");
  const [aFreq, setAFreq] = useState<Frequencia>("mensal");
  const [aData, setAData] = useState(new Date().toISOString().slice(0, 10));
  const [aCategoria, setACategoria] = useState<string>("");
  const [aForma, setAForma] = useState<string>("");
  const [aCartao, setACartao] = useState<string>("");

  const resetParcela = () => {
    setPNome(""); setPValorTotal(""); setPTotalParc(""); setPValorParc("");
    setPDataInicio(new Date().toISOString().slice(0, 10));
    setPCategoria(""); setPCartao("");
  };
  const resetAssinatura = () => {
    setANome(""); setAValor(""); setAFreq("mensal");
    setAData(new Date().toISOString().slice(0, 10));
    setACategoria(""); setAForma(""); setACartao("");
  };

  const salvarParcela = async () => {
    if (!pNome.trim()) return toast.error("Informe o nome da compra");
    const vt = Number(pValorTotal);
    const tp = Number(pTotalParc);
    if (!vt || vt <= 0) return toast.error("Valor total inválido");
    if (!tp || tp < 1) return toast.error("Número de parcelas inválido");
    if (!pDataInicio) return toast.error("Informe a data da primeira parcela");

    const ok = await addParcela({
      nome: pNome.trim(),
      valor_total: vt,
      total_parcelas: tp,
      valor_parcela: pValorParc ? Number(pValorParc) : undefined,
      data_inicio: pDataInicio,
      categoria: pCategoria || undefined,
      cartao_id: pCartao || undefined,
    });
    if (!ok) return;
    toast.success("Parcela cadastrada", { description: pNome });
    resetParcela();
    setOpenP(false);
  };

  const salvarAssinatura = async () => {
    if (!aNome.trim()) return toast.error("Informe o nome da assinatura");
    const v = Number(aValor);
    if (!v || v <= 0) return toast.error("Valor inválido");
    if (!aData) return toast.error("Informe a data de cobrança");

    const ok = await addAssinatura({
      nome: aNome.trim(),
      valor: v,
      frequencia: aFreq,
      data_cobranca: aData,
      categoria: aCategoria || undefined,
      forma_pagamento: aForma || undefined,
      cartao_id: aCartao || undefined,
    });
    if (!ok) return;
    toast.success("Assinatura cadastrada", { description: aNome });
    resetAssinatura();
    setOpenA(false);
  };

  const cardName = (id?: string) => cards.find((c) => c.id === id)?.nome;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1500px] mx-auto w-full overflow-x-hidden">
        <header className="flex items-center justify-between mb-6 gap-4 flex-wrap pl-12 md:pl-0">
          <div>
            <p className="text-sm text-muted-foreground">Compromissos recorrentes</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Parcelas e Assinaturas</h1>
          </div>
        </header>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Parcelas / mês</p>
            <p className="text-xl font-bold mt-2 tabular-nums">{formatBRL(totalMensalParcelas)}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Assinaturas / mês</p>
            <p className="text-xl font-bold mt-2 tabular-nums">{formatBRL(totalMensalAssinaturas)}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total comprometido / mês</p>
            <p className="text-xl font-bold mt-2 tabular-nums text-primary">
              {formatBRL(totalMensalParcelas + totalMensalAssinaturas)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="parcelas" className="w-full">
          <TabsList className="glass-inner mb-4">
            <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
            <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
          </TabsList>

          {/* PARCELAS */}
          <TabsContent value="parcelas" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setOpenP(true)}
                className="h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow glow-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4" /> Nova Parcela
              </Button>
            </div>

            {parcelas.length === 0 ? (
              <div className="glass-card py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto bg-surface-elevated/60 border border-border/50 flex items-center justify-center mb-4">
                  <CalendarClock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-base font-medium">Nenhuma parcela cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">Adicione uma compra parcelada para acompanhar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parcelas.map((p) => {
                  const progresso = (p.parcela_atual / p.total_parcelas) * 100;
                  return (
                    <div key={p.id} className="glass-card p-5 group relative">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-base font-semibold">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.categoria || "Sem categoria"}
                            {cardName(p.cartao_id) ? ` · ${cardName(p.cartao_id)}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => { removeParcela(p.id); toast.success("Parcela removida"); }}
                          className="opacity-0 group-hover:opacity-100 transition w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total</p>
                          <p className="text-sm font-medium tabular-nums">{formatBRL(p.valor_total)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Parcela</p>
                          <p className="text-sm font-medium tabular-nums">{formatBRL(p.valor_parcela)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Progresso</p>
                          <p className="text-sm font-medium tabular-nums">{p.parcela_atual}/{p.total_parcelas}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Próxima</p>
                          <p className="text-sm font-medium">{formatDateBR(p.proxima_cobranca)}</p>
                        </div>
                      </div>

                      <div className="mt-4 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary-glow"
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                      <p className="text-[11px] mt-2 text-muted-foreground">
                        Status: <span className={p.status === "Finalizado" ? "text-success" : "text-primary"}>{p.status}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ASSINATURAS */}
          <TabsContent value="assinaturas" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setOpenA(true)}
                className="h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow glow-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4" /> Nova Assinatura
              </Button>
            </div>

            {assinaturas.length === 0 ? (
              <div className="glass-card py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto bg-surface-elevated/60 border border-border/50 flex items-center justify-center mb-4">
                  <Repeat className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-base font-medium">Nenhuma assinatura cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">Adicione um serviço recorrente para controlar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assinaturas.map((a) => {
                  const statusColor =
                    a.status === "ativa" ? "text-success"
                    : a.status === "pausada" ? "text-yellow-500"
                    : "text-destructive";
                  return (
                    <div key={a.id} className="glass-card p-5 group relative">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-base font-semibold">{a.nome}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {a.frequencia}
                            {cardName(a.cartao_id) ? ` · ${cardName(a.cartao_id)}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          {a.status !== "cancelada" && (
                            <button
                              onClick={() => updateAssinaturaStatus(a.id, a.status === "ativa" ? "pausada" : "ativa")}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                              title={a.status === "ativa" ? "Pausar" : "Ativar"}
                            >
                              {a.status === "ativa" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                          )}
                          {a.status !== "cancelada" && (
                            <button
                              onClick={() => updateAssinaturaStatus(a.id, "cancelada")}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { removeAssinatura(a.id); toast.success("Assinatura removida"); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Valor</p>
                          <p className="text-sm font-medium tabular-nums">{formatBRL(a.valor)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Próxima</p>
                          <p className="text-sm font-medium">{formatDateBR(a.data_cobranca)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Status</p>
                          <p className={`text-sm font-medium capitalize ${statusColor}`}>{a.status}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal Nova Parcela */}
        <Dialog open={openP} onOpenChange={(v) => { setOpenP(v); if (!v) resetParcela(); }}>
          <DialogContent className="glass-card border-border/60 max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Parcela</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={pNome} onChange={(e) => setPNome(e.target.value)} placeholder="Ex: iPhone" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Valor total</Label>
                  <Input type="number" value={pValorTotal} onChange={(e) => setPValorTotal(e.target.value)} placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <Label>Nº de parcelas</Label>
                  <Input type="number" min={1} value={pTotalParc} onChange={(e) => setPTotalParc(e.target.value)} placeholder="12" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Valor da parcela <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input type="number" value={pValorParc} onChange={(e) => setPValorParc(e.target.value)} placeholder="auto" />
                </div>
                <div className="grid gap-2">
                  <Label>1ª parcela</Label>
                  <Input type="date" value={pDataInicio} onChange={(e) => setPDataInicio(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Categoria <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Select value={pCategoria} onValueChange={setPCategoria}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {cards.length > 0 && (
                <div className="grid gap-2">
                  <Label>Cartão <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Select value={pCartao} onValueChange={setPCartao}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetParcela(); setOpenP(false); }}>Cancelar</Button>
              <Button onClick={salvarParcela} className="bg-gradient-to-r from-primary to-primary-glow glow-primary text-primary-foreground">
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Nova Assinatura */}
        <Dialog open={openA} onOpenChange={(v) => { setOpenA(v); if (!v) resetAssinatura(); }}>
          <DialogContent className="glass-card border-border/60 max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Assinatura</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={aNome} onChange={(e) => setANome(e.target.value)} placeholder="Ex: Netflix" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Valor</Label>
                  <Input type="number" value={aValor} onChange={(e) => setAValor(e.target.value)} placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <Label>Frequência</Label>
                  <Select value={aFreq} onValueChange={(v) => setAFreq(v as Frequencia)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Data de cobrança</Label>
                <Input type="date" value={aData} onChange={(e) => setAData(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Categoria <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Select value={aCategoria} onValueChange={setACategoria}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Forma de pagamento <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Select value={aForma} onValueChange={setAForma}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Débito">Débito</SelectItem>
                    <SelectItem value="Crédito">Crédito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {cards.length > 0 && (
                <div className="grid gap-2">
                  <Label>Cartão <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Select value={aCartao} onValueChange={setACartao}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetAssinatura(); setOpenA(false); }}>Cancelar</Button>
              <Button onClick={salvarAssinatura} className="bg-gradient-to-r from-primary to-primary-glow glow-primary text-primary-foreground">
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Recorrentes;
