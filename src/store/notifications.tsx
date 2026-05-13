import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { safeQuery } from "@/lib/safe-query";
import { requireBackend } from "@/lib/backend-guard";

export type ReminderPriority = "baixa" | "média" | "alta";
export type ReminderStatus = "pendente" | "concluído";
export type ReminderFrequency = "diária" | "semanal" | "mensal" | "anual";
export type TaskPriority = "baixa" | "média" | "alta";
export type TaskStatus = "pendente" | "em andamento" | "concluída";

export interface Reminder {
  id: string;
  titulo: string;
  descricao?: string;
  data: string;
  hora?: string;
  tipo: string;
  prioridade: ReminderPriority;
  recorrente: boolean;
  frequencia?: ReminderFrequency;
  status: ReminderStatus;
  created_at: string;
}

export interface TaskItem {
  id: string;
  titulo: string;
  descricao?: string;
  prazo?: string;
  prioridade: TaskPriority;
  categoria?: string;
  status: TaskStatus;
  created_at: string;
}

type ReminderInput = Omit<Reminder, "id" | "created_at">;
type TaskInput = Omit<TaskItem, "id" | "created_at">;

interface NotificationsContextValue {
  reminders: Reminder[];
  tasks: TaskItem[];
  loading: boolean;
  addReminder: (reminder: ReminderInput) => Promise<boolean>;
  updateReminder: (id: string, patch: Partial<Reminder>) => Promise<boolean>;
  removeReminder: (id: string) => Promise<boolean>;
  addTask: (task: TaskInput) => Promise<boolean>;
  updateTask: (id: string, patch: Partial<TaskItem>) => Promise<boolean>;
  removeTask: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  pendingCount: number;
}

type ReminderRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  hora: string | null;
  tipo: string;
  prioridade: ReminderPriority;
  recorrente: boolean | null;
  frequencia: ReminderFrequency | null;
  status: ReminderStatus;
  created_at: string;
};

type TaskRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  prioridade: TaskPriority;
  categoria: string | null;
  status: TaskStatus;
  created_at: string;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);
const db = supabase as any;

const fromReminder = (row: ReminderRow): Reminder => ({
  id: row.id,
  titulo: row.titulo,
  descricao: row.descricao ?? undefined,
  data: row.data,
  hora: row.hora ?? undefined,
  tipo: row.tipo,
  prioridade: row.prioridade,
  recorrente: row.recorrente ?? false,
  frequencia: row.frequencia ?? undefined,
  status: row.status,
  created_at: row.created_at,
});

const fromTask = (row: TaskRow): TaskItem => ({
  id: row.id,
  titulo: row.titulo,
  descricao: row.descricao ?? undefined,
  prazo: row.prazo ?? undefined,
  prioridade: row.prioridade,
  categoria: row.categoria ?? undefined,
  status: row.status,
  created_at: row.created_at,
});

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (authLoading) return;
    if (!user?.id) {
      setReminders([]);
      setTasks([]);
      return;
    }
    if (!requireBackend("notifications:refetch", { toastMessage: "O backend não está configurado. Tarefas e lembretes foram mantidos em modo seguro." })) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [remindersResult, tasksResult] = await Promise.all([
      safeQuery<ReminderRow[]>(
        () => db.from("reminders").select("*").eq("user_id", user.id).order("data", { ascending: true }).order("hora", { ascending: true }),
        { entity: "lembretes" },
      ),
      safeQuery<TaskRow[]>(
        () => db.from("tasks").select("*").eq("user_id", user.id).order("prazo", { ascending: true }).order("created_at", { ascending: false }),
        { entity: "tarefas" },
      ),
    ]);
    setLoading(false);

    if (!remindersResult.error) {
      setReminders(((remindersResult.data ?? []) as ReminderRow[]).map(fromReminder));
    }
    if (!tasksResult.error) {
      setTasks(((tasksResult.data ?? []) as TaskRow[]).map(fromTask));
    }
  }, [authLoading, user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addReminder = async (reminder: ReminderInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar lembretes.");
      return false;
    }
    if (!requireBackend("notifications:addReminder")) return false;

    const { data, error } = await db
      .from("reminders")
      .insert({
        user_id: user.id,
        titulo: reminder.titulo,
        descricao: reminder.descricao ?? null,
        data: reminder.data,
        hora: reminder.hora ?? null,
        tipo: reminder.tipo,
        prioridade: reminder.prioridade,
        recorrente: reminder.recorrente,
        frequencia: reminder.recorrente ? reminder.frequencia ?? null : null,
        status: reminder.status,
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao salvar lembrete.");
      return false;
    }

    setReminders((prev) => [fromReminder(data as ReminderRow), ...prev]);
    return true;
  };

  const updateReminder = async (id: string, patch: Partial<Reminder>) => {
    if (!user) {
      toast.error("Faça login para atualizar lembretes.");
      return false;
    }
    if (!requireBackend("notifications:updateReminder")) return false;

    const dbPatch: Record<string, unknown> = {};
    if (patch.titulo !== undefined) dbPatch.titulo = patch.titulo;
    if (patch.descricao !== undefined) dbPatch.descricao = patch.descricao ?? null;
    if (patch.data !== undefined) dbPatch.data = patch.data;
    if (patch.hora !== undefined) dbPatch.hora = patch.hora ?? null;
    if (patch.tipo !== undefined) dbPatch.tipo = patch.tipo;
    if (patch.prioridade !== undefined) dbPatch.prioridade = patch.prioridade;
    if (patch.recorrente !== undefined) dbPatch.recorrente = patch.recorrente;
    if (patch.frequencia !== undefined) dbPatch.frequencia = patch.frequencia ?? null;
    if (patch.status !== undefined) dbPatch.status = patch.status;

    const { data, error } = await db
      .from("reminders")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao atualizar lembrete.");
      return false;
    }

    setReminders((prev) => prev.map((item) => (item.id === id ? fromReminder(data as ReminderRow) : item)));
    return true;
  };

  const removeReminder = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover lembretes.");
      return false;
    }
    if (!requireBackend("notifications:removeReminder")) return false;

    const { error } = await db.from("reminders").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover lembrete.");
      return false;
    }

    setReminders((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const addTask = async (task: TaskInput) => {
    if (!user) {
      toast.error("Faça login para cadastrar tarefas.");
      return false;
    }
    if (!requireBackend("notifications:addTask")) return false;

    const { data, error } = await db
      .from("tasks")
      .insert({
        user_id: user.id,
        titulo: task.titulo,
        descricao: task.descricao ?? null,
        prazo: task.prazo ?? null,
        prioridade: task.prioridade,
        categoria: task.categoria ?? null,
        status: task.status,
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao salvar tarefa.");
      return false;
    }

    setTasks((prev) => [fromTask(data as TaskRow), ...prev]);
    return true;
  };

  const updateTask = async (id: string, patch: Partial<TaskItem>) => {
    if (!user) {
      toast.error("Faça login para atualizar tarefas.");
      return false;
    }
    if (!requireBackend("notifications:updateTask")) return false;

    const dbPatch: Record<string, unknown> = {};
    if (patch.titulo !== undefined) dbPatch.titulo = patch.titulo;
    if (patch.descricao !== undefined) dbPatch.descricao = patch.descricao ?? null;
    if (patch.prazo !== undefined) dbPatch.prazo = patch.prazo ?? null;
    if (patch.prioridade !== undefined) dbPatch.prioridade = patch.prioridade;
    if (patch.categoria !== undefined) dbPatch.categoria = patch.categoria ?? null;
    if (patch.status !== undefined) dbPatch.status = patch.status;

    const { data, error } = await db
      .from("tasks")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      toast.error("Erro ao atualizar tarefa.");
      return false;
    }

    setTasks((prev) => prev.map((item) => (item.id === id ? fromTask(data as TaskRow) : item)));
    return true;
  };

  const removeTask = async (id: string) => {
    if (!user) {
      toast.error("Faça login para remover tarefas.");
      return false;
    }
    if (!requireBackend("notifications:removeTask")) return false;

    const { error } = await db.from("tasks").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao remover tarefa.");
      return false;
    }

    setTasks((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const pendingCount = useMemo(
    () => reminders.filter((item) => item.status === "pendente").length + tasks.filter((item) => item.status !== "concluída").length,
    [reminders, tasks],
  );

  return (
    <NotificationsContext.Provider
      value={{
        reminders,
        tasks,
        loading,
        addReminder,
        updateReminder,
        removeReminder,
        addTask,
        updateTask,
        removeTask,
        refetch,
        pendingCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications deve ser usado dentro de NotificationsProvider");
  return ctx;
};
