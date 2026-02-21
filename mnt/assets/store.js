// ============================================================
// Local Store (IndexedDB-like minimal wrapper using localStorage)
// - الهدف: Offline fallback + caching
// - ملاحظة: localStorage بسيط، مناسب للـ demo
// ============================================================

export const Store = (() => {
  const NS = "cp:v1";

  function key(k){ return `${NS}:${k}`; }

  function get(k, fallback = null){
    try{
      const raw = localStorage.getItem(key(k));
      if (raw == null) return fallback;
      return JSON.parse(raw);
    }catch(_){
      return fallback;
    }
  }

  function set(k, v){
    localStorage.setItem(key(k), JSON.stringify(v));
    return v;
  }

  function del(k){
    localStorage.removeItem(key(k));
  }

  function clearAll(){
    const ks = [];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (k && k.startsWith(NS+":")) ks.push(k);
    }
    ks.forEach(k => localStorage.removeItem(k));
  }

  return { get, set, del, clearAll };
})();
