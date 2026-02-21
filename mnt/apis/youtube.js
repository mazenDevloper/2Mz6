// Netlify Function: YouTube search (with key pool rotation)
// ENV:
//  - YT_KEYS_POOL: JSON array string: ["KEY1","KEY2",...]

export default async (req) => {
  try{
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const maxResults = clamp(parseInt(url.searchParams.get("max") || "8", 10), 1, 12);

    if (!q) return json({ error: "Missing q" }, 400);

    const keys = readKeyPool(process.env.YT_KEYS_POOL);
    if (!keys.length) return json({ error: "YT_KEYS_POOL not set" }, 500);

    let last = null;

    // Try up to 5 keys (or pool length)
    const tries = Math.min(keys.length, 5);
    for (let i=0;i<tries;i++){
      const key = pickKey(keys);
      const api = new URL("https://www.googleapis.com/youtube/v3/search");
      api.searchParams.set("part", "snippet");
      api.searchParams.set("type", "video");
      api.searchParams.set("maxResults", String(maxResults));
      api.searchParams.set("q", q);
      api.searchParams.set("key", key);

      const r = await fetch(api.toString(), {
        headers: { "Accept": "application/json" }
      });

      const data = await safeJson(r);

      if (r.ok){
        return json({
          ok: true,
          q,
          provider: "youtube",
          items: (data.items || []).map(x => normalizeItem(x))
        }, 200, {
          "Cache-Control": "public, max-age=60"
        });
      }

      last = { status: r.status, data };
      // 403/429 often quota issues; retry with another key
      if (![403, 429].includes(r.status)) break;
    }

    return json({ ok:false, error: "YouTube API failed", detail: last }, 502);

  }catch(e){
    return json({ ok:false, error: e?.message || "Server error" }, 500);
  }
};

function normalizeItem(x){
  const sn = x?.snippet || {};
  const id = x?.id?.videoId || "";
  const thumbs = sn?.thumbnails || {};
  const thumb = thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url || "";
  return {
    id,
    title: sn.title || "",
    channelTitle: sn.channelTitle || "",
    publishedAt: sn.publishedAt || "",
    thumbnail: thumb
  };
}

function readKeyPool(raw){
  try{
    if (!raw) return [];
    const a = JSON.parse(raw);
    if (!Array.isArray(a)) return [];
    return a.filter(Boolean);
  }catch(_){
    return [];
  }
}

function pickKey(keys){
  return keys[Math.floor(Math.random() * keys.length)];
}

function clamp(n, a, b){
  if (Number.isNaN(n)) return a;
  return Math.max(a, Math.min(b, n));
}

async function safeJson(r){
  try{ return await r.json(); }catch(_){ return {}; }
}

function json(body, status=200, headers={}){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}
