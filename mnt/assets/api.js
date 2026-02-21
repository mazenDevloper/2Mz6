// ============================================================
// API Client (Browser)
// - كل النداءات هنا بتكون بدون مفاتيح
// - المفاتيح بتكون داخل Netlify Functions كـ Environment Variables
// ============================================================

export const Api = (() => {
  async function request(path, { method = "GET", jsonBody = null } = {}) {
    const init = {
      method,
      headers: {
        "Accept": "application/json"
      }
    };
    if (jsonBody != null) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(jsonBody);
    }

    const r = await fetch(path, init);
    const data = await safeJson(r);

    if (!r.ok) {
      const err = new Error(`HTTP ${r.status}`);
      err.status = r.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function safeJson(r) {
    try { return await r.json(); } catch { return {}; }
  }

  // ---------- YouTube ----------
  async function youtubeSearch(q, max = 8) {
    const url = `/.netlify/functions/youtube?q=${encodeURIComponent(q)}&max=${encodeURIComponent(max)}`;
    return request(url);
  }

  // ---------- Weather ----------
  async function weather(city) {
    const url = `/.netlify/functions/weather?city=${encodeURIComponent(city)}`;
    return request(url);
  }

  // ---------- Reminders (JSONBin) ----------
  async function remindersGet() {
    return request("/.netlify/functions/reminders");
  }

  async function remindersPut(record) {
    return request("/.netlify/functions/reminders", { method: "PUT", jsonBody: record });
  }

  // ---------- Optional: messages/calls (local-only by default) ----------
  // لو انت وفرت bins إضافية على JSONBin وكتبت functions ليها
  // تقدر تزود هنا نفس الشكل.

  return {
    youtubeSearch,
    weather,
    remindersGet,
    remindersPut
  };
})();
