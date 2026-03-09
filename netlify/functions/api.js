// netlify/functions/api.js
// Handles stories, announcements, recognitions
// Uses Netlify Blobs REST API directly (no npm package needed)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teamleou2024";
const SITE_ID        = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || "";
const NETLIFY_TOKEN  = process.env.NETLIFY_TOKEN || "";

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

async function blobGet(key) {
  const url = `https://api.netlify.com/api/v1/blobs/${SITE_ID}/teamleou/${encodeURIComponent(key)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } });
  if (!r.ok) return null;
  return r.text();
}

async function blobSet(key, value) {
  const url = `https://api.netlify.com/api/v1/blobs/${SITE_ID}/teamleou/${encodeURIComponent(key)}`;
  await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}`, "Content-Type": "text/plain" },
    body: value,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors({});

  const path = event.path.replace("/.netlify/functions/api", "");
  const parts = path.split("/").filter(Boolean);
  const collection = parts[0];
  const id = parts[1];

  if (!collection) return cors({ error: "Not found" }, 404);

  // GET list
  if (event.httpMethod === "GET" && !id) {
    try {
      const raw = await blobGet(collection);
      return cors({ items: raw ? JSON.parse(raw) : [] });
    } catch {
      return cors({ items: [] });
    }
  }

  // POST add item
  if (event.httpMethod === "POST" && !id) {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    const body = JSON.parse(event.body || "{}");
    // Skip internal verify calls
    if (body._verify) return cors({ success: true, item: { id: "verify" } });
    let items = [];
    try { const raw = await blobGet(collection); items = raw ? JSON.parse(raw) : []; } catch {}
    const newItem = { ...body, id: Date.now().toString(), date: new Date().toLocaleDateString("en-US") };
    items.unshift(newItem);
    await blobSet(collection, JSON.stringify(items));
    return cors({ success: true, item: newItem });
  }

  // DELETE item
  if (event.httpMethod === "DELETE" && id) {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    let items = [];
    try { const raw = await blobGet(collection); items = raw ? JSON.parse(raw) : []; } catch {}
    await blobSet(collection, JSON.stringify(items.filter(i => i.id !== id)));
    return cors({ success: true });
  }

  return cors({ error: "Not found" }, 404);
};
