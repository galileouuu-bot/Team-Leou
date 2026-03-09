// netlify/functions/photos.js
// Handles photo upload and retrieval using Netlify Blobs

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

  const store = getStore("teamleou-photos");
  const metaStore = getStore("teamleou");
  const urlParts = event.path.split("/");
  const photoId = urlParts[urlParts.length - 1];
  const isPhotoId = photoId && photoId !== "photos";

  // ── GET all photo metadata ──
  if (event.httpMethod === "GET" && !isPhotoId) {
    const raw = await metaStore.get("photos-meta").catch(() => null);
    const items = raw ? JSON.parse(raw) : [];
    return cors({ items });
  }

  // ── POST upload new photo ──
  if (event.httpMethod === "POST") {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    const body = JSON.parse(event.body || "{}");
    const { dataUrl, name } = body;
    if (!dataUrl) return cors({ error: "No image data" }, 400);

    const id = Date.now().toString();
    // Store the raw base64 data
    await store.set(id, dataUrl);

    // Update metadata list
    const raw = await metaStore.get("photos-meta").catch(() => null);
    const items = raw ? JSON.parse(raw) : [];
    const meta = { id, name: name || "Photo", date: new Date().toLocaleDateString("en-US") };
    items.unshift(meta);
    await metaStore.set("photos-meta", JSON.stringify(items));

    return cors({ success: true, item: meta });
  }

  // ── GET single photo data ──
  if (event.httpMethod === "GET" && isPhotoId) {
    const data = await store.get(photoId).catch(() => null);
    if (!data) return cors({ error: "Not found" }, 404);
    return cors({ dataUrl: data });
  }

  // ── DELETE photo ──
  if (event.httpMethod === "DELETE" && isPhotoId) {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    await store.delete(photoId).catch(() => {});
    const raw = await metaStore.get("photos-meta").catch(() => null);
    const items = raw ? JSON.parse(raw) : [];
    await metaStore.set("photos-meta", JSON.stringify(items.filter((i) => i.id !== photoId)));
    return cors({ success: true });
  }

  return cors({ error: "Not found" }, 404);
};
