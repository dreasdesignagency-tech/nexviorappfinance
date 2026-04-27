import { Sidebar } from "@/components/dashboard/Sidebar";
import { Bell, BellOff, CalendarClock, CheckCircle2, ListTodo } from "lucide-react";
import { useMemo } from "react";
import { useNotifications } from "@/store/notifications";

const formatDateTime = (date: string, time?: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  const formatted = parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  return time ? `${formatted} · ${time}` : formatted;
};

const Notificacoes = () => {
  const { reminders, tasks, loading, pendingCount } = useNotifications();

  const items = useMemo(
    () => [
      ...reminders.map((reminder) => ({
        id: `reminder-${reminder.id}`,
        kind: "reminder" as const,
        title: reminder.titulo,
        subtitle: reminder.descricao || reminder.tipo,
        meta: formatDateTime(reminder.data, reminder.hora),
        status: reminder.status,
        priority: reminder.prioridade,
        createdAt: reminder.created_at,
      })),
      ...tasks.map((task) => ({
        id: `task-${task.id}`,
        kind: "task" as const,
        title: task.titulo,
        subtitle: task.descricao || task.categoria || "Sem descrição",
        meta: task.prazo ? formatDateTime(task.prazo) : "Sem prazo",
        status: task.status,
        priority: task.prioridade,
        createdAt: task.created_at,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reminders, tasks],
  );

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-3xl mx-auto w-full overflow-x-hidden pt-safe">
        <header className="mb-6 pl-12 md:pl-0">
          <p className="text-sm text-muted-foreground">Atualizações e alertas</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Notificações
          </h1>
        </header>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-semibold mt-2">{pendingCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Lembretes</p>
            <p className="text-2xl font-semibold mt-2">{reminders.length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Tarefas</p>
            <p className="text-2xl font-semibold mt-2">{tasks.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center text-sm text-muted-foreground">Carregando notificações...</div>
        ) : items.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl glass-inner mx-auto mb-4 flex items-center justify-center">
              <BellOff className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Você está em dia!</p>
            <p className="text-xs text-muted-foreground mt-1">Nenhum lembrete ou tarefa salvo até agora.</p>
          </div>
        ) : (
          <div className="glass-card divide-y divide-border/40 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4">
                <div className="w-10 h-10 rounded-xl glass-inner flex items-center justify-center shrink-0">
                  {item.kind === "reminder" ? (
                    <CalendarClock className="w-4 h-4 text-primary" />
                  ) : item.status === "concluída" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <ListTodo className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.priority}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{item.subtitle}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                    <span>{item.meta}</span>
                    <span>•</span>
                    <span className="capitalize">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notificacoes;
