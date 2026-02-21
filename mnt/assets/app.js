// ============================================================
// CarPlay-like Web UI — Dynamic + Netlify
// ------------------------------------------------------------
// هدف الملف:
// 1) Navigation + Swipe
// 2) YouTube search via Netlify Function (Key Pool rotation server-side)
// 3) Weather via Netlify Function (WeatherAPI proxy)
// 4) Reminders CRUD via Netlify Function (JSONBin)
// 5) Offline caching (localStorage)
// 6) MapLibre map (OSM) بدون API Key
// ------------------------------------------------------------
// ملاحظة مهمة:
// - متحطّش أي API Key في المتصفح.
// - لو المفاتيح اتنشرت قبل كده: اعمل Rotate/Regenerate.
// ============================================================

import { Api } from "./api.js";
import { Store } from "./store.js";
import { UI } from "./ui.js";
import { itemTemplate, kvTemplate, escapeHtml } from "./templates.js";

// ----------------------------
// Global State
// ----------------------------
const State = {
  version: "1.0.0",
  isSystemReady: false,

  // UI
  view: "home",
  viewOrder: ["home","maps","music","weather","reminders","messages","phone","settings"],

  // Settings
  accent: Store.get("accent", "#4aa3ff"),
  online: navigator.onLine,

  // Music/YouTube
  playing: false,
  shuffle: false,
  nowPlaying: Store.get("nowPlaying", {
    id: "",
    title: "—",
    channelTitle: "—",
    thumbnail: "",
    publishedAt: ""
  }),
  queue: Store.get("queue", []),
  progress: 0.20,

  // Weather
  city: Store.get("city", "Cairo"),
  weather: Store.get("weather", null),

  // Reminders
  reminders: Store.get("reminders", { reminders: [] }),
  remindersDirty: false,

  // Messages (local dynamic)
  messages: Store.get("messages", {
    threads: [
      { from: "أحمد", msg: "وصلت؟", time: Date.now() - 1000*60*12 },
      { from: "سارة", msg: "هات اللوكيشن", time: Date.now() - 1000*60*40 }
    ]
  }),

  // Calls (local dynamic)
  calls: Store.get("calls", {
    list: [
      { name: "ماما", type: "وارد", time: Date.now() - 1000*60*90 },
      { name: "خالد", type: "صادر", time: Date.now() - 1000*60*300 }
    ]
  }),

  // Map
  map: null,
  mapCenter: [31.2357, 30.0444], // Cairo

  // Observers
  hammer: null
};

// ----------------------------
// Boot
// ----------------------------
init();

async function init(){
  // 1) Apply accent
  setAccent(State.accent);

  // 2) Bind UI
  bindDock();
  bindTopbar();
  bindSwipe();
  bindMusic();
  bindWeather();
  bindReminders();
  bindMessages();
  bindPhone();
  bindSettings();

  // 3) Clock ticker
  tickClock();
  setInterval(tickClock, 1000);

  // 4) Online status
  updateOnlineUI();
  window.addEventListener("online", () => { State.online = true; updateOnlineUI(); UI.toast("اتصال", "رجعنا Online"); });
  window.addEventListener("offline", () => { State.online = false; updateOnlineUI(); UI.toast("اتصال", "أنت Offline"); });

  // 5) Render cached data first
  renderAllFromState();

  // 6) Init map lazily when entering maps view
  // (We still can init now in background)
  tryInitMap();

  // 7) Background sync (best effort)
  await initialSync();

  // 8) Start simulated player
  startProgressLoop();

  State.isSystemReady = true;
  UI.toast("جاهز", "تم تشغيل النظام (ديناميك + Netlify)");
}

// ============================================================
// Navigation
// ============================================================

function setView(name){
  State.view = name;

  // Dock buttons
  UI.$$(".cp-appbtn").forEach(b => {
    b.classList.toggle("is-active", b.dataset.view === name);
  });

  // Views
  UI.$$(".cp-view").forEach(v => v.classList.remove("is-active"));
  const viewEl = UI.$(`#view-${name}`);
  if (viewEl) viewEl.classList.add("is-active");

  // Lazy map resize
  if (name === "maps"){
    tryInitMap();
    setTimeout(() => State.map?.resize?.(), 120);
  }
}

function nextView(dir){
  const order = State.viewOrder;
  const i = order.indexOf(State.view);
  const j = (i + dir + order.length) % order.length;
  setView(order[j]);
}

function bindDock(){
  UI.$$(".cp-appbtn").forEach(btn => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });
}

function bindSwipe(){
  // Hammer loaded via CDN
  const root = UI.$("#appRoot");
  if (!root || typeof Hammer === "undefined") return;

  State.hammer = new Hammer(root);
  State.hammer.get("swipe").set({ direction: Hammer.DIRECTION_HORIZONTAL, velocity: 0.25, threshold: 12 });

  State.hammer.on("swipeleft", () => nextView(+1));
  State.hammer.on("swiperight", () => nextView(-1));
}

// ============================================================
// Topbar: global search, clock, status
// ============================================================

function bindTopbar(){
  const input = UI.$("#globalSearch");
  const btn = UI.$("#globalSearchBtn");

  async function run(){
    const q = (input.value || "").trim();
    if (!q) return;

    // Smart routing
    // - لو كتب: yt: query
    // - أو بدأ بـ "يوتيوب" / "yt"
    // - أو كتب "طقس" / "weather"
    const lower = q.toLowerCase();

    if (lower.startsWith("yt:") || lower.startsWith("yt ") || q.includes("يوتيوب")){
      setView("music");
      const qq = q.replace(/^yt:\s*/i, "").replace(/^yt\s+/i, "").replace("يوتيوب", "").trim();
      UI.$("#ytQ").value = qq || q;
      await youtubeSearchAndRender(qq || q);
      return;
    }

    if (lower.startsWith("w:") || q.includes("طقس") || lower.startsWith("weather")){
      setView("weather");
      const city = q.replace(/^w:\s*/i, "").replace("طقس", "").replace(/weather/i, "").trim();
      if (city) UI.$("#weatherCity").value = city;
      await refreshWeather();
      return;
    }

    if (q.includes("تذكير") || q.includes("reminder")){
      setView("reminders");
      UI.toast("بحث", "اكتب التذكير واضغط جديد");
      return;
    }

    // Default: treat as YouTube search
    setView("music");
    UI.$("#ytQ").value = q;
    await youtubeSearchAndRender(q);
  }

  btn?.addEventListener("click", run);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });
}

function tickClock(){
  if (typeof dayjs === "undefined") return;
  const now = dayjs();
  UI.setText("#clockText", now.format("HH:mm"));

  // Optional: arrival time mock
  // (We keep it simple)
}

function updateOnlineUI(){
  const dot = UI.$("#connDot");
  const txt = UI.$("#connText");
  if (!dot || !txt) return;

  if (State.online){
    dot.style.background = "var(--good)";
    dot.style.boxShadow = "0 0 0 3px rgba(48,209,88,0.18)";
    txt.textContent = "Online";
  }else{
    dot.style.background = "var(--warn)";
    dot.style.boxShadow = "0 0 0 3px rgba(255,214,10,0.18)";
    txt.textContent = "Offline";
  }

  // Settings debug
  renderSystemKV();
}

// ============================================================
// Render: from State
// ============================================================

function renderAllFromState(){
  renderNowPlaying();
  renderHomeCards();
  renderWeatherCards();
  renderReminders();
  renderMessages();
  renderCalls();
  renderSystemKV();
}

function renderHomeCards(){
  // Now playing mini
  UI.setText("#homeNowTitle", State.nowPlaying?.title || "—");
  UI.setText("#homeNowMeta", State.nowPlaying?.channelTitle || "—");

  // Home reminders list
  const list = UI.$("#homeRemindersList");
  if (list){
    list.innerHTML = "";
    const items = (State.reminders?.reminders || []).slice(0, 4);
    if (!items.length){
      list.innerHTML = `<div class="cp-muted">مفيش تذكيرات…</div>`;
    } else {
      items.forEach(r => {
        const html = itemTemplate({
          icon: r.done ? "fa-regular fa-circle-check" : "fa-regular fa-circle",
          title: r.title || "(بدون عنوان)",
          subtitle: r.note || "",
          badge: r.dueAt ? fmtTime(r.dueAt) : "—"
        });
        const wrap = document.createElement("div");
        wrap.innerHTML = html;
        wrap.firstElementChild.addEventListener("click", () => toggleReminder(r.id));
        list.appendChild(wrap.firstElementChild);
      });
    }
  }

  // Home inbox
  const inbox = UI.$("#homeInbox");
  if (inbox){
    inbox.innerHTML = "";
    const threads = (State.messages?.threads || []).slice().sort((a,b)=>b.time-a.time).slice(0, 4);
    if (!threads.length){
      inbox.innerHTML = `<div class="cp-muted">مفيش رسائل…</div>`;
    } else {
      threads.forEach(m => {
        const html = itemTemplate({
          icon: "fa-solid fa-user",
          title: m.from,
          subtitle: m.msg,
          badge: fmtAgo(m.time)
        });
        const wrap = document.createElement("div");
        wrap.innerHTML = html;
        wrap.firstElementChild.addEventListener("click", () => UI.toast("رسالة", `${m.from}: ${m.msg}`));
        inbox.appendChild(wrap.firstElementChild);
      });
    }
  }
}

function renderNowPlaying(){
  UI.setText("#npTitle", State.nowPlaying?.title || "—");
  UI.setText("#npChannel", State.nowPlaying?.channelTitle || "—");
  UI.setText("#npMeta", State.nowPlaying?.publishedAt ? `Published: ${fmtDate(State.nowPlaying.publishedAt)}` : "—");

  const thumb = State.nowPlaying?.thumbnail || "";
  const album = UI.$("#npThumb");
  if (album){
    album.style.backgroundImage = thumb ? `url('${thumb}')` : "";
  }

  // Home card also
  UI.setText("#homeNowTitle", State.nowPlaying?.title || "—");
  UI.setText("#homeNowMeta", State.nowPlaying?.channelTitle || "—");

  // Play button states
  syncPlayButtons();
}

function renderWeatherCards(){
  if (!State.weather){
    UI.setText("#homeWeather", "—");
    UI.setText("#homeWeatherMeta", "—");
    UI.setText("#wTemp", "—");
    UI.setText("#wCond", "—");
    UI.setText("#wMore", "—");
    UI.setText("#wMeta", "—");
    UI.setHtml("#wKv", "");
    return;
  }

  const w = State.weather;
  const temp = `${Math.round(w.temp_c)}°`;

  UI.setText("#homeWeather", `${w.location_name} • ${temp}`);
  UI.setText("#homeWeatherMeta", w.cond_text);

  UI.setText("#wTemp", temp);
  UI.setText("#wCond", w.cond_text);
  UI.setText("#wMore", `الإحساس: ${Math.round(w.feelslike_c)}° • رطوبة: ${w.humidity}%`);
  UI.setText("#wMeta", `آخر تحديث: ${fmtTime(w.updated_at)} • ${w.location_name}`);

  const kv = UI.$("#wKv");
  if (kv){
    kv.innerHTML = [
      kvTemplate("الرياح", `${w.wind_kph} km/h`),
      kvTemplate("الاتجاه", w.wind_dir),
      kvTemplate("ضغط", `${w.pressure_mb} mb`),
      kvTemplate("رؤية", `${w.vis_km} km`),
      kvTemplate("UV", `${w.uv}`),
      kvTemplate("Cloud", `${w.cloud}%`)
    ].join("\n");
  }
}

function renderReminders(){
  // Main reminders list
  const host = UI.$("#remList");
  if (host){
    host.innerHTML = "";
    const list = (State.reminders?.reminders || []).slice().sort((a,b)=>{
      const da = a.dueAt || "";
      const db = b.dueAt || "";
      return da.localeCompare(db);
    });

    if (!list.length){
      host.innerHTML = `<div class="cp-muted">مفيش تذكيرات… اضغط "جديد"</div>`;
    } else {
      list.forEach(r => {
        const html = itemTemplate({
          icon: r.done ? "fa-regular fa-circle-check" : "fa-regular fa-circle",
          title: r.title,
          subtitle: r.note || "",
          badge: r.dueAt ? fmtTime(r.dueAt) : "—"
        });
        const wrap = document.createElement("div");
        wrap.innerHTML = html;
        wrap.firstElementChild.addEventListener("click", () => reminderActions(r.id));
        host.appendChild(wrap.firstElementChild);
      });
    }
  }

  // Home card
  renderHomeCards();
}

function renderMessages(){
  const host = UI.$("#msgList");
  if (!host) return;
  host.innerHTML = "";

  const threads = (State.messages?.threads || []).slice().sort((a,b)=>b.time-a.time);
  if (!threads.length){
    host.innerHTML = `<div class="cp-muted">مفيش رسائل…</div>`;
    renderHomeCards();
    return;
  }

  threads.forEach(m => {
    const html = itemTemplate({
      icon: "fa-solid fa-comment",
      title: m.from,
      subtitle: m.msg,
      badge: fmtAgo(m.time)
    });
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    wrap.firstElementChild.addEventListener("click", () => UI.toast("رسالة", `${m.from}: ${m.msg}`));
    host.appendChild(wrap.firstElementChild);
  });

  renderHomeCards();
}

function renderCalls(){
  const host = UI.$("#callList");
  if (!host) return;
  host.innerHTML = "";

  const list = (State.calls?.list || []).slice().sort((a,b)=>b.time-a.time);
  if (!list.length){
    host.innerHTML = `<div class="cp-muted">مفيش مكالمات…</div>`;
    return;
  }

  list.forEach(c => {
    const html = itemTemplate({
      icon: "fa-solid fa-phone",
      title: c.name,
      subtitle: `${c.type} • ${fmtAgo(c.time)}`,
      badge: "اتصال"
    });
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    wrap.firstElementChild.addEventListener("click", async () => {
      const ok = await UI.confirmBox(`محاكاة اتصال بـ ${c.name}؟`);
      if (ok) UI.toast("هاتف", `Calling ${c.name}…`);
    });
    host.appendChild(wrap.firstElementChild);
  });
}

function renderSystemKV(){
  const host = UI.$("#sysKv");
  if (!host) return;

  const kv = [
    kvTemplate("Version", State.version),
    kvTemplate("View", State.view),
    kvTemplate("Online", State.online ? "true" : "false"),
    kvTemplate("Accent", State.accent),
    kvTemplate("Queue", String(State.queue?.length || 0)),
    kvTemplate("Reminders", String(State.reminders?.reminders?.length || 0)),
    kvTemplate("Messages", String(State.messages?.threads?.length || 0)),
    kvTemplate("Calls", String(State.calls?.list?.length || 0))
  ];

  host.innerHTML = kv.join("\n");
}

// ============================================================
// Music / YouTube
// ============================================================

function bindMusic(){
  UI.$("#ytBtn")?.addEventListener("click", async () => {
    const q = (UI.$("#ytQ")?.value || "").trim();
    if (!q) return;
    await youtubeSearchAndRender(q);
  });

  UI.$("#ytQ")?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter"){
      const q = (UI.$("#ytQ")?.value || "").trim();
      if (!q) return;
      await youtubeSearchAndRender(q);
    }
  });

  UI.$("#ytQuickBtn")?.addEventListener("click", async () => {
    const q = (UI.$("#ytQuickQ")?.value || "").trim();
    if (!q) return;
    await youtubeQuick(q);
  });

  UI.$("#homePlayBtn")?.addEventListener("click", () => togglePlay());

  UI.$("#npPlay")?.addEventListener("click", () => togglePlay());
  UI.$("#npPrev")?.addEventListener("click", () => prevTrack());
  UI.$("#npNext")?.addEventListener("click", () => nextTrack());
  UI.$("#npShuffle")?.addEventListener("click", () => {
    State.shuffle = !State.shuffle;
    UI.toast("Music", State.shuffle ? "Shuffle ON" : "Shuffle OFF");
  });
}

async function youtubeSearchAndRender(q){
  UI.setText("#ytStatus", "Loading…");
  try{
    const res = await Api.youtubeSearch(q, 10);
    const items = res.items || [];

    UI.setText("#ytStatus", `${items.length} نتيجة`);
    State.queue = items;
    Store.set("queue", items);

    renderYouTubeList(items);

    if (items[0]){
      setNowPlaying(items[0]);
    }

  }catch(e){
    console.error(e);
    UI.setText("#ytStatus", "فشل");
    UI.toast("YouTube", "حصل خطأ في البحث (راجع Netlify ENV)" );
  }
}

async function youtubeQuick(q){
  const host = UI.$("#ytQuickList");
  if (!host) return;

  host.innerHTML = `<div class="cp-muted">Loading…</div>`;

  try{
    const res = await Api.youtubeSearch(q, 5);
    const items = res.items || [];

    host.innerHTML = "";
    if (!items.length){
      host.innerHTML = `<div class="cp-muted">مفيش نتائج</div>`;
      return;
    }

    items.forEach(v => {
      const html = itemTemplate({
        icon: "fa-brands fa-youtube",
        title: v.title,
        subtitle: v.channelTitle,
        badge: v.publishedAt ? fmtDate(v.publishedAt) : ""
      });
      const wrap = document.createElement("div");
      wrap.innerHTML = html;
      wrap.firstElementChild.addEventListener("click", () => {
        setView("music");
        setNowPlaying(v);
        UI.toast("YouTube", "تم اختيار فيديو" );
      });
      host.appendChild(wrap.firstElementChild);
    });

  }catch(e){
    console.error(e);
    host.innerHTML = `<div class="cp-muted">فشل التحميل</div>`;
  }
}

function renderYouTubeList(items){
  const host = UI.$("#ytList");
  if (!host) return;

  host.innerHTML = "";
  if (!items.length){
    host.innerHTML = `<div class="cp-muted">مفيش نتائج…</div>`;
    return;
  }

  items.forEach(v => {
    const html = `
      <div class="cp-item">
        <div class="cp-item__meta">
          <i class="fa-brands fa-youtube"></i>
          <div class="cp-item__txt">
            <p class="cp-item__t">${escapeHtml(v.title)}</p>
            <p class="cp-item__s">${escapeHtml(v.channelTitle)}</p>
          </div>
        </div>
        <span class="cp-badge">${v.publishedAt ? escapeHtml(fmtDate(v.publishedAt)) : ""}</span>
      </div>
    `;
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    wrap.firstElementChild.addEventListener("click", () => setNowPlaying(v));
    host.appendChild(wrap.firstElementChild);
  });
}

function setNowPlaying(v){
  State.nowPlaying = v;
  Store.set("nowPlaying", v);
  renderNowPlaying();
  renderHomeCards();
  renderEmbed(v.id);
}

function renderEmbed(videoId){
  const host = UI.$("#ytEmbed");
  if (!host) return;

  if (!videoId){
    host.innerHTML = `<div class="cp-muted">اختار فيديو…</div>`;
    return;
  }

  // Privacy-enhanced mode
  host.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}"
      title="YouTube video"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  `;
}

function togglePlay(){
  State.playing = !State.playing;
  syncPlayButtons();
  UI.toast("Music", State.playing ? "تشغيل" : "إيقاف");
}

function syncPlayButtons(){
  // Home
  UI.$("#homePlayIcon")?.classList.toggle("fa-play", !State.playing);
  UI.$("#homePlayIcon")?.classList.toggle("fa-pause", State.playing);
  UI.setText("#homePlayText", State.playing ? "إيقاف" : "تشغيل");

  // Now playing
  const icon = UI.$("#npPlayIcon");
  if (icon){
    icon.className = State.playing ? "fa-solid fa-pause" : "fa-solid fa-play";
  }
  UI.setText("#npPlayText", State.playing ? "إيقاف" : "تشغيل");
}

function nextTrack(){
  const q = State.queue || [];
  if (!q.length) return;

  let idx = q.findIndex(x => x.id === State.nowPlaying?.id);
  if (idx < 0) idx = 0;

  if (State.shuffle){
    idx = Math.floor(Math.random() * q.length);
  } else {
    idx = (idx + 1) % q.length;
  }

  setNowPlaying(q[idx]);
  State.playing = true;
  syncPlayButtons();
}

function prevTrack(){
  const q = State.queue || [];
  if (!q.length) return;

  let idx = q.findIndex(x => x.id === State.nowPlaying?.id);
  if (idx < 0) idx = 0;

  idx = (idx - 1 + q.length) % q.length;
  setNowPlaying(q[idx]);
  State.playing = true;
  syncPlayButtons();
}

function startProgressLoop(){
  const homeProg = UI.$("#homeProg");
  const npProg = UI.$("#npProg");

  setInterval(() => {
    if (!State.playing) return;

    State.progress += 0.004;
    if (State.progress >= 1){
      State.progress = 0.02;
      nextTrack();
    }

    const w = `${Math.round(State.progress * 100)}%`;
    if (homeProg) homeProg.style.width = w;
    if (npProg) npProg.style.width = w;

  }, 160);
}

// ============================================================
// Weather
// ============================================================

function bindWeather(){
  UI.$("#weatherBtn")?.addEventListener("click", refreshWeather);
  UI.$("#weatherCity")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") refreshWeather();
  });

  UI.$("#homeWeatherRefresh")?.addEventListener("click", async () => {
    setView("weather");
    await refreshWeather();
  });
}

async function refreshWeather(){
  const city = (UI.$("#weatherCity")?.value || State.city || "Cairo").trim();
  if (!city) return;

  State.city = city;
  Store.set("city", city);

  UI.setText("#wMeta", "Loading…");

  try{
    const res = await Api.weather(city);
    if (!res.ok) throw new Error("weather not ok");

    const d = res.data;
    const current = d.current || {};
    const loc = d.location || {};

    State.weather = {
      location_name: `${loc.name || city}${loc.country ? " • " + loc.country : ""}`,
      temp_c: current.temp_c,
      feelslike_c: current.feelslike_c,
      humidity: current.humidity,
      wind_kph: current.wind_kph,
      wind_dir: current.wind_dir,
      pressure_mb: current.pressure_mb,
      vis_km: current.vis_km,
      uv: current.uv,
      cloud: current.cloud,
      cond_text: current?.condition?.text || "—",
      updated_at: loc.localtime || new Date().toISOString()
    };

    Store.set("weather", State.weather);
    renderWeatherCards();
    UI.toast("طقس", "تم التحديث");

  }catch(e){
    console.error(e);
    UI.toast("طقس", "فشل التحديث (راجع WEATHER_API_KEY على Netlify)");
    renderWeatherCards();
  }
}

// ============================================================
// Reminders (JSONBin)
// ============================================================

function bindReminders(){
  UI.$("#remNew")?.addEventListener("click", newReminder);
  UI.$("#remSync")?.addEventListener("click", syncReminders);
  UI.$("#syncChip")?.addEventListener("click", () => initialSync(true));
}

function ensureReminderSchema(record){
  // record expected: { reminders: [] }
  if (!record || typeof record !== "object") return { reminders: [] };
  if (!Array.isArray(record.reminders)) record.reminders = [];
  record.reminders = record.reminders.map(r => normalizeReminder(r));
  return record;
}

function normalizeReminder(r){
  return {
    id: r?.id || uid(),
    title: String(r?.title || ""),
    note: String(r?.note || ""),
    dueAt: r?.dueAt || "",
    done: Boolean(r?.done)
  };
}

async function newReminder(){
  const title = await UI.promptText("عنوان التذكير:", "");
  if (!title) return;

  const note = await UI.promptText("ملاحظة (اختياري):", "");
  const dueAt = await UI.promptText("ميعاد (ISO أو اتركه فارغ):", "");

  const r = normalizeReminder({ title, note, dueAt, done:false });

  const record = ensureReminderSchema(State.reminders);
  record.reminders.push(r);
  State.reminders = record;

  State.remindersDirty = true;
  Store.set("reminders", record);

  renderReminders();
  UI.toast("تذكيرات", "تمت الإضافة (محليًا)");
}

async function reminderActions(id){
  const r = (State.reminders?.reminders || []).find(x => x.id === id);
  if (!r) return;

  const action = await UI.promptText(
    `اختار: toggle / edit / delete\n(اكتب الكلمة)`,
    "toggle"
  );

  if (!action) return;

  if (action === "toggle"){
    await toggleReminder(id);
    return;
  }

  if (action === "edit"){
    const title = await UI.promptText("عنوان:", r.title);
    if (title == null) return;
    const note = await UI.promptText("ملاحظة:", r.note);
    if (note == null) return;
    const dueAt = await UI.promptText("ميعاد:", r.dueAt);
    if (dueAt == null) return;

    r.title = title;
    r.note = note;
    r.dueAt = dueAt;

    State.remindersDirty = true;
    Store.set("reminders", State.reminders);
    renderReminders();
    UI.toast("تذكيرات", "تم التعديل (محليًا)");
    return;
  }

  if (action === "delete"){
    const ok = await UI.confirmBox("متأكد تحذف؟");
    if (!ok) return;

    State.reminders.reminders = State.reminders.reminders.filter(x => x.id !== id);
    State.remindersDirty = true;
    Store.set("reminders", State.reminders);
    renderReminders();
    UI.toast("تذكيرات", "تم الحذف (محليًا)");
    return;
  }
}

async function toggleReminder(id){
  const list = State.reminders?.reminders || [];
  const r = list.find(x => x.id === id);
  if (!r) return;

  r.done = !r.done;
  State.remindersDirty = true;
  Store.set("reminders", State.reminders);
  renderReminders();
}

async function syncReminders(){
  UI.toast("Sync", "جارِ المزامنة…");

  // Strategy:
  // 1) GET from server
  // 2) Merge with local dirty changes (simple: local wins)
  // 3) PUT merged to server

  try{
    const remote = await Api.remindersGet();
    const remoteRecord = ensureReminderSchema(remote.record ?? remote);

    const localRecord = ensureReminderSchema(State.reminders);

    // Merge by id (local wins)
    const byId = new Map();
    remoteRecord.reminders.forEach(r => byId.set(r.id, r));
    localRecord.reminders.forEach(r => byId.set(r.id, r));

    const merged = { reminders: Array.from(byId.values()) };

    // Save local
    State.reminders = merged;
    Store.set("reminders", merged);
    renderReminders();

    // Push to remote
    await Api.remindersPut(merged);
    State.remindersDirty = false;

    UI.toast("Sync", "تمت المزامنة");

  }catch(e){
    console.error(e);
    UI.toast("Sync", "فشل (راجع JSONBIN env على Netlify)");
  }
}

// ============================================================
// Messages (Dynamic local)
// ============================================================

function bindMessages(){
  UI.$("#msgSend")?.addEventListener("click", sendMessage);
}

async function sendMessage(){
  const to = (UI.$("#msgTo")?.value || "").trim();
  const text = (UI.$("#msgText")?.value || "").trim();
  if (!to || !text){
    UI.toast("رسائل", "اكتب (إلى) و(رسالة)");
    return;
  }

  State.messages.threads.push({ from: to, msg: text, time: Date.now() });
  Store.set("messages", State.messages);

  UI.$("#msgText").value = "";
  renderMessages();
  UI.toast("رسائل", "تم الإرسال (محليًا)");
}

// ============================================================
// Phone (Dynamic local)
// ============================================================

function bindPhone(){
  UI.$("#callAdd")?.addEventListener("click", addCall);
}

async function addCall(){
  const name = (UI.$("#callName")?.value || "").trim();
  if (!name){
    UI.toast("هاتف", "اكتب اسم");
    return;
  }

  State.calls.list.push({ name, type: "صادر", time: Date.now() });
  Store.set("calls", State.calls);

  UI.$("#callName").value = "";
  renderCalls();
  UI.toast("هاتف", "تمت الإضافة");
}

// ============================================================
// Settings
// ============================================================

function bindSettings(){
  UI.$("#testToast")?.addEventListener("click", () => UI.toast("تنبيه", "ده مثال Toast"));

  UI.$("#clearCache")?.addEventListener("click", async () => {
    const ok = await UI.confirmBox("مسح الكاش المحلي؟");
    if (!ok) return;
    Store.clearAll();
    UI.toast("Cache", "تم المسح. أعد تحميل الصفحة.");
  });

  UI.$$(".cp-swatch").forEach(btn => {
    btn.addEventListener("click", () => {
      const hex = btn.dataset.accent;
      setAccent(hex);
      UI.toast("ألوان", "تم تغيير Accent");
    });
  });
}

function setAccent(hex){
  if (!hex) return;
  State.accent = hex;
  Store.set("accent", hex);
  document.documentElement.style.setProperty("--accent", hex);
  renderSystemKV();
}

// ============================================================
// MapLibre
// ============================================================

function tryInitMap(){
  if (State.map) return;
  if (typeof maplibregl === "undefined") return;

  const el = UI.$("#map");
  if (!el) return;

  State.map = new maplibregl.Map({
    container: el,
    // Public demo style (you can replace with your own)
    style: "https://demotiles.maplibre.org/style.json",
    center: State.mapCenter,
    zoom: 11
  });

  State.map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

  State.map.on("load", () => {
    UI.setText("#mapHudText", "Loaded");

    // marker
    new maplibregl.Marker({ color: getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#4aa3ff" })
      .setLngLat(State.mapCenter)
      .addTo(State.map);
  });

  UI.$("#mapCenter")?.addEventListener("click", () => {
    State.map?.flyTo?.({ center: State.mapCenter, zoom: 12, speed: 1.2 });
  });

  UI.$("#mapsGo")?.addEventListener("click", () => {
    const q = (UI.$("#mapsQuery")?.value || "").trim();
    UI.toast("Maps", q ? `بحث: ${q} (placeholder)` : "اكتب مكان");
  });
}

// ============================================================
// Sync
// ============================================================

async function initialSync(force = false){
  // Reminders: try sync on startup
  // Weather: refresh with saved city
  // YouTube: keep cached queue

  // Avoid too noisy toasts
  const chip = UI.$("#syncChip");
  if (chip) chip.innerHTML = `<i class="fa-solid fa-rotate"></i> Sync…`;

  // Weather refresh
  if (force || !State.weather){
    try{
      await refreshWeather();
    }catch(_){ /* ignore */ }
  }

  // Reminders sync
  // - لو Offline: skip
  if (State.online){
    try{
      await syncReminders();
    }catch(_){ /* ignore */ }
  }

  if (chip) chip.innerHTML = `<i class="fa-solid fa-rotate"></i> Sync`;
}

// ============================================================
// Utils
// ============================================================

function uid(){
  return "r_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString("ar-EG", { year:"numeric", month:"2-digit", day:"2-digit" });
  }catch{ return String(iso); }
}

function fmtTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", { hour:"2-digit", minute:"2-digit", year:"2-digit", month:"2-digit", day:"2-digit" });
  }catch{ return String(iso); }
}

function fmtAgo(ts){
  const diff = Date.now() - Number(ts || 0);
  const m = Math.round(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `من ${m} د`;
  const h = Math.round(m/60);
  if (h < 24) return `من ${h} س`;
  const d = Math.round(h/24);
  return `من ${d} ي`;
}
