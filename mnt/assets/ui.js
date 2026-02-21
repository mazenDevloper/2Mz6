// ============================================================
// UI Helpers
// ============================================================

export const UI = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setText(sel, text) {
    const el = $(sel);
    if (el) el.textContent = text;
  }

  function setHtml(sel, html) {
    const el = $(sel);
    if (el) el.innerHTML = html;
  }

  // ---- Toast ----
  function toast(title, msg) {
    const el = $("#toast");
    if (!el) return;

    setText("#toastTitle", title);
    setText("#toastMsg", msg);
    setText("#toastTime", "الآن");

    el.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-show"), 2400);
  }

  // ---- Modal prompt (very lightweight) ----
  // بيستخدم built-in prompt/confirm لسرعة التنفيذ.
  // لو عايز Modal iOS-like داخل الصفحة، قولّي وأنا أعمله.
  async function promptText(label, def = "") {
    return window.prompt(label, def);
  }

  async function confirmBox(msg) {
    return window.confirm(msg);
  }

  return { $, $$, setText, setHtml, toast, promptText, confirmBox };
})();
