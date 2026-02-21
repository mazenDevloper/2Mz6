// ============================================================
// Templates (DOM builders)
// ============================================================

export function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

export function itemTemplate({ icon, title, subtitle, badge }){
  return `
    <div class="cp-item">
      <div class="cp-item__meta">
        <i class="${icon}"></i>
        <div class="cp-item__txt">
          <p class="cp-item__t">${escapeHtml(title)}</p>
          <p class="cp-item__s">${escapeHtml(subtitle || "")}</p>
        </div>
      </div>
      <span class="cp-badge">${escapeHtml(badge || "")}</span>
    </div>
  `;
}

export function kvTemplate(k, v){
  return `
    <div class="kv">
      <div class="k">${escapeHtml(k)}</div>
      <div class="v">${escapeHtml(v)}</div>
    </div>
  `;
}
