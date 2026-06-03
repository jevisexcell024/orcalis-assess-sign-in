/**
 * Orcalis Assess — Exam Service Worker
 * Enables offline exam delivery:
 *  - Caches app shell and static assets
 *  - Queues answer saves to IndexedDB when offline
 *  - Syncs queued answers when connection restores
 */

const CACHE_NAME = "orcalis-assess-v1";
const EXAM_CACHE  = "orcalis-exam-session-v1";

const PRECACHE_URLS = [
  "/",
  "/student",
  "/offline.html",
];

// ── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

// ── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== EXAM_CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

// ── Fetch — Network-first with cache fallback ────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin requests
  if (url.origin !== location.origin) return;

  // API calls: network-first, queue if offline
  if (url.pathname.startsWith("/api/")) {
    if (request.method === "POST" && url.pathname.includes("save-answer")) {
      event.respondWith(networkOrQueue(request));
      return;
    }
    return; // Let other API calls through normally
  }

  // Navigation: cache-first for exam session pages
  if (url.pathname.includes("/session")) {
    event.respondWith(cacheFirst(request, EXAM_CACHE));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? caches.match("/offline.html");
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match("/offline.html");
  }
}

// ── Offline answer queue ─────────────────────────────────────────────────────
const QUEUE_STORE = "orcalis-answer-queue";

async function networkOrQueue(request) {
  try {
    const response = await fetch(request.clone());
    // If we're back online, flush queued answers
    await flushQueue();
    return response;
  } catch {
    // Offline — queue the request
    const body = await request.json().catch(() => ({}));
    await queueAnswer(body);
    return Response.json(
      { queued: true, message: "Answer saved offline. Will sync when connection restores." },
      { status: 202 },
    );
  }
}

async function queueAnswer(payload) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_STORE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("queue", { autoIncrement: true });
    req.onsuccess = () => {
      const tx = req.result.transaction("queue", "readwrite");
      tx.objectStore("queue").add({ payload, timestamp: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = reject;
    };
    req.onerror = reject;
  });
}

async function flushQueue() {
  return new Promise((resolve) => {
    const req = indexedDB.open(QUEUE_STORE, 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("queue", "readwrite");
      const store = tx.objectStore("queue");
      const getAll = store.getAll();
      getAll.onsuccess = async () => {
        const items = getAll.result;
        for (const item of items) {
          try {
            await fetch("/api/exams/save-answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.payload),
            });
          } catch {
            break; // Still offline, stop flushing
          }
        }
        store.clear();
        resolve(undefined);
      };
    };
    req.onerror = () => resolve(undefined);
  });
}

// ── Background sync (if supported) ──────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-exam-answers") {
    event.waitUntil(flushQueue());
  }
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Orcalis Assess", {
      body: data.body ?? "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
