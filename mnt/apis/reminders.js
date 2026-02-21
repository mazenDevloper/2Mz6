// Netlify Function: JSONBin Reminders CRUD (GET latest / PUT full record)
// ENV:
//  - JSONBIN_API_KEY (master key)
//  - JSONBIN_BIN_ID_REMINDERS

export default async (req) => {
  try{
    const master = process.env.JSONBIN_API_KEY;
    const binId  = process.env.JSONBIN_BIN_ID_REMINDERS;

    if (!master || !binId){
      return j({ ok:false, error: "JSONBin env missing (JSONBIN_API_KEY / JSONBIN_BIN_ID_REMINDERS)" }, 500);
    }

    const base = `https://api.jsonbin.io/v3/b/${binId}`;

    if (req.method === "GET"){
      const r = await fetch(`${base}/latest`, {
        headers: {
          "Accept": "application/json",
          "X-Master-Key": master
        }
      });
      const data = await safeJson(r);
      if (!r.ok) return j({ ok:false, error:"JSONBin GET failed", detail:data }, 502);
      return j({ ok:true, record: data.record ?? data }, 200);
    }

    if (req.method === "PUT"){
      const payload = await req.json();
      const r = await fetch(base, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": master
        },
        body: JSON.stringify(payload)
      });
      const data = await safeJson(r);
      if (!r.ok) return j({ ok:false, error:"JSONBin PUT failed", detail:data }, 502);
      return j({ ok:true, saved: data }, 200);
    }

    return j({ ok:false, error:"Method not allowed" }, 405);

  }catch(e){
    return j({ ok:false, error: e?.message || "Server error" }, 500);
  }
};

async function safeJson(r){
  try{ return await r.json(); }catch(_){ return {}; }
}

function j(body, status=200){
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
