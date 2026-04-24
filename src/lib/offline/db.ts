import { openDB, type IDBPDatabase } from "idb";

/**
 * Camada de persistência offline.
 *
 * Estrutura:
 * - cache: snapshot dos dados sincronizados, por (userId, table, id).
 * - queue: operações pendentes a serem enviadas quando voltar a conexão.
 *
 * Tudo é particionado por user_id para evitar vazamento entre contas.
 */

export type SyncTable =
  | "transactions"
  | "cards"
  | "subscriptions"
  | "installments";

export type QueueOp = "insert" | "update" | "delete";

export interface CacheRecord<T = Record<string, unknown>> {
  key: string; // `${userId}:${table}:${id}`
  userId: string;
  table: SyncTable;
  id: string;
  data: T;
  pending?: boolean; // criado offline, ainda não sincronizado
  updatedAt: number;
}

export interface QueueRecord {
  id: string; // uuid próprio da operação
  userId: string;
  table: SyncTable;
  op: QueueOp;
  // Para insert: o payload já contém o uuid local em data.id
  // Para update/delete (apenas online por regra): contém id alvo
  payload: Record<string, unknown>;
  // Caso esse insert dependa de outro insert ainda na fila (FK), apontar pro id local pai
  dependsOn?: string | null;
  createdAt: number;
  attempts: number;
}

const DB_NAME = "nexvior-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("cache")) {
          const cache = db.createObjectStore("cache", { keyPath: "key" });
          cache.createIndex("byUserTable", ["userId", "table"]);
          cache.createIndex("byUser", "userId");
        }
        if (!db.objectStoreNames.contains("queue")) {
          const queue = db.createObjectStore("queue", { keyPath: "id" });
          queue.createIndex("byUser", "userId");
          queue.createIndex("byCreatedAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
};

const cacheKey = (userId: string, table: SyncTable, id: string) =>
  `${userId}:${table}:${id}`;

// ---------- CACHE ----------

export async function readCache<T = Record<string, unknown>>(
  userId: string,
  table: SyncTable
): Promise<CacheRecord<T>[]> {
  try {
    const db = await getDb();
    const tx = db.transaction("cache", "readonly");
    const idx = tx.store.index("byUserTable");
    const rows = (await idx.getAll(IDBKeyRange.only([userId, table]))) as CacheRecord<T>[];
    return rows;
  } catch {
    return [];
  }
}

export async function replaceCache<T = Record<string, unknown>>(
  userId: string,
  table: SyncTable,
  rows: T[],
  getId: (r: T) => string
) {
  try {
    const db = await getDb();
    const tx = db.transaction("cache", "readwrite");
    // Remove existing non-pending records for this user+table
    const idx = tx.store.index("byUserTable");
    const existing = (await idx.getAll(IDBKeyRange.only([userId, table]))) as CacheRecord[];
    for (const e of existing) {
      if (!e.pending) await tx.store.delete(e.key);
    }
    const now = Date.now();
    for (const r of rows) {
      const id = getId(r);
      const key = cacheKey(userId, table, id);
      await tx.store.put({ key, userId, table, id, data: r as unknown as Record<string, unknown>, updatedAt: now });
    }
    await tx.done;
  } catch (e) {
    console.warn("[offline] replaceCache falhou", e);
  }
}

export async function upsertCache<T = Record<string, unknown>>(
  userId: string,
  table: SyncTable,
  id: string,
  data: T,
  pending = false
) {
  try {
    const db = await getDb();
    await db.put("cache", {
      key: cacheKey(userId, table, id),
      userId,
      table,
      id,
      data: data as unknown as Record<string, unknown>,
      pending,
      updatedAt: Date.now(),
    } satisfies CacheRecord);
  } catch (e) {
    console.warn("[offline] upsertCache falhou", e);
  }
}

export async function removeFromCache(userId: string, table: SyncTable, id: string) {
  try {
    const db = await getDb();
    await db.delete("cache", cacheKey(userId, table, id));
  } catch {
    /* ignore */
  }
}

/** Substitui o id de um registro pendente pelo id real retornado do servidor. */
export async function reidentifyCache(
  userId: string,
  table: SyncTable,
  oldId: string,
  newId: string,
  newData: Record<string, unknown>
) {
  try {
    const db = await getDb();
    const tx = db.transaction("cache", "readwrite");
    await tx.store.delete(cacheKey(userId, table, oldId));
    await tx.store.put({
      key: cacheKey(userId, table, newId),
      userId,
      table,
      id: newId,
      data: newData,
      pending: false,
      updatedAt: Date.now(),
    } satisfies CacheRecord);
    await tx.done;
  } catch (e) {
    console.warn("[offline] reidentifyCache falhou", e);
  }
}

// ---------- QUEUE ----------

export async function enqueue(item: Omit<QueueRecord, "createdAt" | "attempts">) {
  try {
    const db = await getDb();
    await db.put("queue", {
      ...item,
      createdAt: Date.now(),
      attempts: 0,
    } satisfies QueueRecord);
  } catch (e) {
    console.warn("[offline] enqueue falhou", e);
  }
}

export async function listQueue(userId: string): Promise<QueueRecord[]> {
  try {
    const db = await getDb();
    const idx = db.transaction("queue").store.index("byUser");
    const all = (await idx.getAll(IDBKeyRange.only(userId))) as QueueRecord[];
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function dequeue(opId: string) {
  try {
    const db = await getDb();
    await db.delete("queue", opId);
  } catch {
    /* ignore */
  }
}

export async function bumpAttempts(opId: string) {
  try {
    const db = await getDb();
    const item = (await db.get("queue", opId)) as QueueRecord | undefined;
    if (!item) return;
    await db.put("queue", { ...item, attempts: item.attempts + 1 });
  } catch {
    /* ignore */
  }
}

export async function clearUserData(userId: string) {
  try {
    const db = await getDb();
    const tx = db.transaction(["cache", "queue"], "readwrite");
    const cIdx = tx.objectStore("cache").index("byUser");
    const qIdx = tx.objectStore("queue").index("byUser");
    const ck = await cIdx.getAllKeys(IDBKeyRange.only(userId));
    for (const k of ck) await tx.objectStore("cache").delete(k);
    const qk = await qIdx.getAllKeys(IDBKeyRange.only(userId));
    for (const k of qk) await tx.objectStore("queue").delete(k);
    await tx.done;
  } catch (e) {
    console.warn("[offline] clearUserData falhou", e);
  }
}

export async function countPending(userId: string): Promise<number> {
  try {
    const db = await getDb();
    const idx = db.transaction("queue").store.index("byUser");
    return await idx.count(IDBKeyRange.only(userId));
  } catch {
    return 0;
  }
}
