import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CATEGORIAS, FormaPagamento, TipoTransacao, useTransactions } from "@/store/transactions";
import { useCards } from "@/store/cards";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultType?: TipoTransacao;
  initialValues?: {
    id: string;
    tipo: TipoTransacao;
    titulo: string;
    valor: number;
    categoria: string;
    data: string;
    forma_pagamento?: FormaPagamento;
    parcelado?: boolean;
    numero_parcelas?: number;
    parcela_atual?: number;
    recorrente?: boolean;
    observacao?: string;
    cartao_id?: string | null;
  } | null;
}

const formasPagamento: FormaPagamento[] = ["PIX", "Cartão", "Dinheiro", "Transferência", "Boleto", "Outro"];

export const NewTransactionDialog = ({ open, onOpenChange, defaultType = "despesa", initialValues = null }: Props) => {
  const { addTransaction, updateTransaction } = useTransactions();
  const { cards } = useCards();

  const [tipo, setTipo] = useState<TipoTransacao>(defaultType);
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [cartaoId, setCartaoId] = useState<string>("");
  const [parcelado, setParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState("2");
  const [parcelaAtual, setParcelaAtual] = useState("1");
  const [recorrente, setRecorrente] = useState(false);
  const [observacao, setObservacao] = useState("");

  const requiresCard = formaPagamento === "Cartão";
  const availableCards = cards.filter((c) => c.ativo !== false);

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      setTipo(initialValues.tipo);
      setTitulo(initialValues.titulo);
      setValor(String(initialValues.valor));
      setCategoria(initialValues.categoria);
      setData(initialValues.data);
      setFormaPagamento(initialValues.forma_pagamento ?? "PIX");
      setCartaoId(initialValues.cartao_id ?? "");
      setParcelado(initialValues.parcelado ?? false);
      setNumParcelas(String(initialValues.numero_parcelas ?? 2));
      setParcelaAtual(String(initialValues.parcela_atual ?? 1));
      setRecorrente(initialValues.recorrente ?? false);
      setObservacao(initialValues.observacao ?? "");
      return;
    }

    setTipo(defaultType);
    reset();
    setData(new Date().toISOString().slice(0, 10));
  }, [open, defaultType, initialValues]);

  const reset = () => {
    setTitulo(""); setValor(""); setCategoria("");
    setParcelado(false); setRecorrente(false); setObservacao("");
    setNumParcelas("2"); setParcelaAtual("1"); setFormaPagamento("PIX");
    setCartaoId("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor.replace(",", "."));
    if (!titulo.trim()) return toast.error("Informe o título.");
    if (!valor || isNaN(v) || v <= 0) return toast.error("Informe um valor válido.");
    if (!categoria) return toast.error("Selecione uma categoria.");
    if (!data) return toast.error("Informe a data.");
    if (requiresCard && !cartaoId) {
      if (availableCards.length === 0) {
        return toast.error("Cadastre um cartão antes de registrar despesas no cartão.");
      }
      return toast.error("Selecione o cartão utilizado.");
    }

    const payload = {
      tipo,
      titulo: titulo.trim(),
      valor: v,
      categoria,
      data,
      forma_pagamento: formaPagamento,
      parcelado,
      numero_parcelas: parcelado ? Number(numParcelas) : undefined,
      parcela_atual: parcelado ? Number(parcelaAtual) : undefined,
      recorrente,
      observacao: observacao.trim() || undefined,
      cartao_id: requiresCard ? cartaoId : null,
    };

    if (initialValues) {
      await updateTransaction(initialValues.id, payload);
      toast.success("Transação atualizada!", {
        description: `${titulo} · ${tipo === "receita" ? "+" : "-"}R$ ${v.toFixed(2)}`,
      });
    } else {
      await addTransaction(payload);
      toast.success("Transação adicionada!", {
        description: `${titulo} · ${tipo === "receita" ? "+" : "-"}R$ ${v.toFixed(2)}`,
      });
    }

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Editar Transação" : "Nova Transação"}</DialogTitle>
          <DialogDescription className="hidden sm:block">
            {initialValues ? "Atualize os dados da transação selecionada." : "Registre uma nova receita ou despesa."}
          </DialogDescription>
        </DialogHeader>

        {/* Tipo toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 glass-inner">
          <button
            type="button"
            onClick={() => setTipo("receita")}
            className={cn(
              "h-9 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition",
              tipo === "receita"
                ? "bg-success/20 text-success border border-success/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowUpRight className="w-4 h-4" /> Receita
          </button>
          <button
            type="button"
            onClick={() => setTipo("despesa")}
            className={cn(
              "h-9 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition",
              tipo === "despesa"
                ? "bg-destructive/20 text-destructive border border-destructive/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowDownRight className="w-4 h-4" /> Despesa
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Almoço" maxLength={80} className="h-9 sm:h-10" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input id="valor" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="h-9 sm:h-10" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-9 sm:h-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="h-9 sm:h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}>
                <SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {requiresCard && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label>Cartão utilizado</Label>
              {availableCards.length === 0 ? (
                <p className="text-xs text-muted-foreground glass-inner p-3">
                  Nenhum cartão cadastrado. Vá em <span className="text-foreground font-medium">Cartões</span> e cadastre um para vincular esta despesa.
                </p>
              ) : (
                <Select value={cartaoId} onValueChange={setCartaoId}>
                  <SelectTrigger className="h-9 sm:h-10"><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                  <SelectContent>
                    {availableCards.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome} · {c.banco}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="glass-inner p-2.5 sm:p-3 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="parcelado" className="cursor-pointer text-sm">Parcelamento</Label>
              <Switch id="parcelado" checked={parcelado} onCheckedChange={setParcelado} />
            </div>
            {parcelado && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nº de parcelas</Label>
                  <Input type="number" min="2" value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Parcela atual</Label>
                  <Input type="number" min="1" value={parcelaAtual} onChange={(e) => setParcelaAtual(e.target.value)} className="h-9" />
                </div>
              </div>
            )}
          </div>

          <div className="glass-inner p-2.5 sm:p-3 flex items-center justify-between">
            <Label htmlFor="recorrente" className="cursor-pointer text-sm">Gasto fixo / recorrente</Label>
            <Switch id="recorrente" checked={recorrente} onCheckedChange={setRecorrente} />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="obs">Observação</Label>
            <Textarea id="obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Opcional..." maxLength={300} rows={2} />
          </div>

          <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-1 bg-background/95 backdrop-blur-sm flex justify-end gap-2 border-t border-border/40 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow glow-primary">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
