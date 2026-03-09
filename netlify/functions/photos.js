// netlify/functions/photos.js
// Uploads images to ImgBB (free image host) and stores URLs in Netlify Blobs
// ImgBB free tier: unlimited uploads, images never expire on free accounts

import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teamleou2024";
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "";

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
  const photoId = urlParts[urlParts.length - 1];
  const isPhotoId = photoId && photoId !== "photos";

  // ── GET all photos ──
  if (event.httpMethod === "GET" && !isPhotoId) {
    try {
      const raw = await store.get("photos-meta");
      const items = raw ? JSON.parse(raw) : [];
      return cors({ items });
    } catch {
      return cors({ items: [] });
    }
  }

  // ── POST: upload image to ImgBB, store URL ──
  if (event.httpMethod === "POST" && !isPhotoId) {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    if (!IMGBB_API_KEY) return cors({ error: "IMGBB_API_KEY not configured" }, 500);

    const body = JSON.parse(event.body || "{}");
    const { base64, name } = body;
    if (!base64) return cors({ error: "No image data provided" }, 400);

    // Upload to ImgBB (send raw base64, no data: prefix)
    const formData = new URLSearchParams();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", base64);
    formData.append("name", name || "photo");

    const imgRes = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });
    const imgData = await imgRes.json();

    if (!imgData.success) {
      return cors({ error: "ImgBB upload failed", detail: imgData.error?.message }, 500);
    }

    const id = Date.now().toString();
    const newPhoto = {
      id,
      name: name || "Photo",
      url: imgData.data.display_url,
      date: new Date().toLocaleDateString("en-US"),
    };

    // Save metadata list to Blobs
    let items = [];
    try {
      const raw = await store.get("photos-meta");
      items = raw ? JSON.parse(raw) : [];
    } catch {}
    items.unshift(newPhoto);
    await store.set("photos-meta", JSON.stringify(items));

    return cors({ success: true, item: newPhoto });
  }

  // ── DELETE photo ──
  if (event.httpMethod === "DELETE" && isPhotoId) {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    let items = [];
    try {
      const raw = await store.get("photos-meta");
      items = raw ? JSON.parse(raw) : [];
    } catch {}
    const filtered = items.filter((i) => i.id !== photoId);
    await store.set("photos-meta", JSON.stringify(filtered));
    return cors({ success: true });
  }

  return cors({ error: "Not found" }, 404);
};
