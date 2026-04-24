import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  bumpAttempts,
  dequeue,
  listQueue,
  reidentifyCache,
  removeFromCache,
  upsertCache,
  type QueueRecord,
  type SyncTable,
} from "./db";
import { isOnline, onNetworkChange } from "./network";

type IdMap = Map<string, string>; // localId -> serverId (por tabela seria igual já que usamos uuid)

/**
 * Envia uma operação ao Supabase, retornando o registro real (para reconciliação).
 * Retorna null em caso de falha — o item permanece na fila.
 */
async function flushOne(op: QueueRecord, idMap: IdMap): Promise<Record<string, unknown> | null> {
  const db = supabase as any;
  const payload = { ...op.payload };

  // Resolver dependências: se algum campo *_id apontar para um id local que já mapeou pra real, atualizar.
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === "string" && idMap.has(v)) {
      payload[k] = idMap.get(v);
    }
  }

  if (op.op === "insert") {
    const { data, error } = await db.from(op.table).insert(payload).select("*").single();
    if (error) {
      console.warn("[sync] insert falhou", op.table, error);
      return null;
    }
    return data as Record<string, unknown>;
  }

  if (op.op === "update") {
    const id = payload.id as string;
    delete payload.id;
    const { data, error } = await db
      .from(op.table)
      .update(payload)
      .eq("id", id)
      .eq("user_id", op.userId)
      .select("*")
      .single();
    if (error) return null;
    return data as Record<string, unknown>;
  }

  if (op.op === "delete") {
    const id = payload.id as string;
    const { error } = await db.from(op.table).delete().eq("id", id).eq("user_id", op.userId);
    if (error) return null;
    return { id };
  }

  return null;
}

let flushing = false;
const onSyncedCallbacks = new Set<(table: SyncTable, oldId: string, newRow: Record<string, unknown>) => void>();
const onFlushDoneCallbacks = new Set<(synced: number) => void>();

export function onSynced(cb: (table: SyncTable, oldId: string, newRow: Record<string, unknown>) => void) {
  onSyncedCallbacks.add(cb);
  return () => onSyncedCallbacks.delete(cb);
}

export function onFlushDone(cb: (synced: number) => void) {
  onFlushDoneCallbacks.add(cb);
  return () => onFlushDoneCallbacks.delete(cb);
}

/** Tenta esvaziar a fila do usuário. Idempotente — pode ser chamado várias vezes. */
export async function flushQueue(userId: string) {
  if (flushing) return;
  if (!isOnline()) return;
  flushing = true;

  try {
    let queue = await listQueue(userId);
    if (queue.length === 0) return;

    const idMap: IdMap = new Map();
    let synced = 0;

    // Como usamos UUIDs locais que viram os mesmos IDs no Supabase (ID é gerado no cliente),
    // a "reconciliação" é simples: sucesso => removemos pending flag.
    for (const op of queue) {
      const oldId = (op.payload as { id?: string }).id ?? op.id;
      const result = await flushOne(op, idMap);
      if (result) {
        const newId = (result.id as string) ?? oldId;
        if (oldId && newId && oldId !== newId) {
          idMap.set(oldId, newId);
          await reidentifyCache(userId, op.table, oldId, newId, result);
        } else if (op.op === "delete") {
          await removeFromCache(userId, op.table, oldId);
        } else {
          // Marca como sincronizado (pending = false)
          await upsertCache(userId, op.table, newId, result, false);
        }
        await dequeue(op.id);
        onSyncedCallbacks.forEach((cb) => cb(op.table, oldId, result));
        synced++;
      } else {
        await bumpAttempts(op.id);
        // Se falhou, paramos para tentar de novo no próximo evento online (evita loop)
        if (!isOnline()) break;
      }
    }

    if (synced > 0) {
      toast.success(
        synced === 1 ? "1 registro sincronizado." : `${synced} registros sincronizados.`
      );
      onFlushDoneCallbacks.forEach((cb) => cb(synced));
    }
  } finally {
    flushing = false;
  }
}

let started = false;
export function startSyncDaemon(getUserId: () => string | null) {
  if (started) return;
  started = true;

  const tryFlush = () => {
    const uid = getUserId();
    if (uid) flushQueue(uid);
  };

  onNetworkChange((online) => {
    if (online) {
      toast.info("Conexão restaurada. Sincronizando...");
      setTimeout(tryFlush, 500);
    } else {
      toast.warning("Você está offline. As alterações serão sincronizadas quando a conexão voltar.");
    }
  });

  // Flush inicial caso já esteja online
  setTimeout(tryFlush, 1000);

  // Retry periódico leve (a cada 30s) caso a fila tenha falhas residuais
  setInterval(tryFlush, 30000);
}
