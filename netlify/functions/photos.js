// netlify/functions/photos.js
// Uses Netlify Blobs REST API directly (no npm package needed)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teamleou2024";
const IMGBB_API_KEY  = process.env.IMGBB_API_KEY  || "";
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

// Simple in-process store using Netlify Blobs REST API
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

  const urlParts = event.path.split("/");
  const last = urlParts[urlParts.length - 1];

  // GET /photos/config → return ImgBB key to admin
  if (event.httpMethod === "GET" && last === "config") {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    return cors({ imgbbKey: IMGBB_API_KEY });
  }

  // GET /photos → list all photos
  if (event.httpMethod === "GET" && last === "photos") {
    try {
      const raw = await blobGet("photos-meta");
      const items = raw ? JSON.parse(raw) : [];
      return cors({ items });
    } catch {
      return cors({ items: [] });
    }
  }

  // POST /photos → save URL + metadata
  if (event.httpMethod === "POST" && last === "photos") {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    const body = JSON.parse(event.body || "{}");
    const { url, name } = body;
    if (!url) return cors({ error: "No URL provided" }, 400);

    const id = Date.now().toString();
    const newPhoto = { id, name: name || "Photo", url, date: new Date().toLocaleDateString("en-US") };

    let items = [];
    try { const raw = await blobGet("photos-meta"); items = raw ? JSON.parse(raw) : []; } catch {}
    items.unshift(newPhoto);
    await blobSet("photos-meta", JSON.stringify(items));
    return cors({ success: true, item: newPhoto });
  }

  // DELETE /photos/:id
  if (event.httpMethod === "DELETE") {
    if (!isAdmin(event)) return cors({ error: "Unauthorized" }, 401);
    let items = [];
    try { const raw = await blobGet("photos-meta"); items = raw ? JSON.parse(raw) : []; } catch {}
    await blobSet("photos-meta", JSON.stringify(items.filter(i => i.id !== last)));
    return cors({ success: true });
  }

  return cors({ error: "Not found" }, 404);
};
