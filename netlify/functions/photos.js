// netlify/functions/photos.js
// - GET  /photos/config  → returns ImgBB key to browser (admin only)
// - GET  /photos         → list all photo metadata
// - POST /photos         → save photo URL + metadata (upload happens browser→ImgBB directly)
// - DELETE /photos/:id   → remove photo metadata

import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teamleou2024";
const IMGBB_API_KEY  = process.env.IMGBB_API_KEY  || "";

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

  const store = getStore({ name: "teamleou", consistency: "strong" });
  const urlParts = event.path.split("/");
  const last = urlParts[urlParts.length - 1];

  // ── GET /photos/config  → return ImgBB key to admin browser ──
  if (event.httpMethod === "GET" && last === "config") {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    return cors({ imgbbKey: IMGBB_API_KEY });
  }

  // ── GET /photos  → list all photos ──
  if (event.httpMethod === "GET" && last === "photos") {
    try {
      const raw = await store.get("photos-meta");
      const items = raw ? JSON.parse(raw) : [];
      return cors({ items });
    } catch {
      return cors({ items: [] });
    }
  }

  // ── POST /photos  → save URL + metadata only (image already on ImgBB) ──
  if (event.httpMethod === "POST" && last === "photos") {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);

    const body = JSON.parse(event.body || "{}");
    const { url, name } = body;
    if (!url) return cors({ error: "No URL provided" }, 400);

    const id = Date.now().toString();
    const newPhoto = {
      id,
      name: name || "Photo",
      url,
      date: new Date().toLocaleDateString("en-US"),
    };

    let items = [];
    try {
      const raw = await store.get("photos-meta");
      items = raw ? JSON.parse(raw) : [];
    } catch {}
    items.unshift(newPhoto);
    await store.set("photos-meta", JSON.stringify(items));

    return cors({ success: true, item: newPhoto });
  }

  // ── DELETE /photos/:id ──
  if (event.httpMethod === "DELETE") {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    const photoId = last;
    let items = [];
    try {
      const raw = await store.get("photos-meta");
      items = raw ? JSON.parse(raw) : [];
    } catch {}
    await store.set("photos-meta", JSON.stringify(items.filter(i => i.id !== photoId)));
    return cors({ success: true });
  }

  return cors({ error: "Not found" }, 404);
};
