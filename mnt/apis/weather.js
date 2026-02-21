// Netlify Function: WeatherAPI proxy
// ENV:
//  - WEATHER_API_KEY

export default async (req) => {
  try{
    const key = process.env.WEATHER_API_KEY;
    if (!key) return j({ ok:false, error: "WEATHER_API_KEY not set" }, 500);

    const url = new URL(req.url);
    const city = (url.searchParams.get("city") || "Cairo").trim();

    const api = new URL("https://api.weatherapi.com/v1/current.json");
    api.searchParams.set("key", key);
    api.searchParams.set("q", city);
    api.searchParams.set("lang", "ar");

    const r = await fetch(api.toString(), { headers: { "Accept": "application/json" } });
    const data = await safeJson(r);

    if (!r.ok){
      return j({ ok:false, error: "WeatherAPI failed", detail: data }, 502);
    }

    return j({ ok:true, provider:"weatherapi", city, data }, 200, {
      "Cache-Control": "public, max-age=120"
    });

  }catch(e){
    return j({ ok:false, error: e?.message || "Server error" }, 500);
  }
};

async function safeJson(r){
  try{ return await r.json(); }catch(_){ return {}; }
}

function j(body, status=200, headers={}){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}
