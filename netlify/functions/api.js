// netlify/functions/api.js
// Handles all data: stories, announcements, recognitions
// Uses Netlify Blobs as free persistent storage

import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teamleou2024";

function cors(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function isAdmin(event) {
  return event.headers["x-admin-token"] === ADMIN_PASSWORD;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors({});

  const store = getStore("teamleou");
  const path = event.path.replace("/.netlify/functions/api", "").replace("/api", "");
  const [, collection, id] = path.split("/"); // e.g. /stories, /stories/123

  // ── GET list ──
  if (event.httpMethod === "GET" && !id) {
    try {
      const raw = await store.get(collection);
      const items = raw ? JSON.parse(raw) : [];
      return cors({ items });
    } catch {
      return cors({ items: [] });
    }
  }

  // ── POST (add item) ──
  if (event.httpMethod === "POST" && !id) {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    const body = JSON.parse(event.body || "{}");
    const raw = await store.get(collection).catch(() => null);
    const items = raw ? JSON.parse(raw) : [];
    const newItem = { ...body, id: Date.now().toString(), date: new Date().toLocaleDateString("en-US") };
    items.unshift(newItem);
    await store.set(collection, JSON.stringify(items));
    return cors({ success: true, item: newItem });
  }

  // ── DELETE item ──
  if (event.httpMethod === "DELETE" && id) {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    const raw = await store.get(collection).catch(() => null);
    const items = raw ? JSON.parse(raw) : [];
    const filtered = items.filter((i) => i.id !== id);
    await store.set(collection, JSON.stringify(filtered));
    return cors({ success: true });
  }

  return cors({ error: "Not found" }, 404);
};
