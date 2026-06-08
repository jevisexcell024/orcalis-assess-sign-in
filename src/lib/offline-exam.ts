/**
 * Offline Exam Support — IndexedDB helpers + Service Worker registration
 */

const DB_NAME    = "orcalis-exam-offline";
const DB_VERSION = 1;
const STORE      = "pending-answers";

// ── DB Setup ─────────────────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export type PendingAnswer = {
  id: string;           // unique key: `${attemptId}-${questionId}`
  attempt_id: string;
  question_id: string;
  response: unknown;
  answered_at: string;
  synced: boolean;
};

/** Save an answer locally (immediate, no network) */
export async function saveAnswerLocally(answer: Omit<PendingAnswer, "synced">): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...answer, synced: false });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Get all un-synced answers */
export async function getPendingAnswers(): Promise<PendingAnswer[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as PendingAnswer[]).filter((a) => !a.synced));
    req.onerror   = () => reject(req.error);
  });
}

/** Mark answers as synced */
export async function markSynced(ids: string[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  for (const id of ids) {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) store.put({ ...getReq.result, synced: true });
    };
  }
  await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
}

/** Sync pending answers to the server */
export async function syncAnswers(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingAnswers();
  if (!pending.length) return { synced: 0, failed: 0 };

  let synced = 0; let failed = 0;
  const syncedIds: string[] = [];

  for (const answer of pending) {
    try {
      const res = await fetch("/api/exams/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id:  answer.attempt_id,
          question_id: answer.question_id,
          response:    answer.response,
          answered_at: answer.answered_at,
        }),
      });
      if (res.ok) { synced++; syncedIds.push(answer.id); }
      else failed++;
    } catch {
      failed++;
    }
  }

  if (syncedIds.length) await markSynced(syncedIds);

  // Register background sync if supported
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const reg = await navigator.serviceWorker.ready;
    await (reg as any).sync.register("sync-exam-answers").catch(() => {});
  }

  return { synced, failed };
}

/** Clear all local answers for an attempt (call after successful submission) */
export async function clearAttemptAnswers(attemptId: string): Promise<void> {
  const db = await openDB();
  const tx  = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const all = await new Promise<PendingAnswer[]>((res) => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result as PendingAnswer[]);
  });
  for (const a of all.filter((x) => x.attempt_id === attemptId)) {
    store.delete(a.id);
  }
}

// ── Service Worker Registration ───────────────────────────────────────────────
export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.info("[SW] Service worker registered");
  } catch (err) {
    console.warn("[SW] Registration failed:", err);
  }
}

/** Listen for online event and auto-sync */
export function setupAutoSync(onSync?: (result: { synced: number; failed: number }) => void): () => void {
  const handler = async () => {
    const result = await syncAnswers();
    if (result.synced > 0) onSync?.(result);
  };
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
