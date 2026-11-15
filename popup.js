const $ = (id) => document.getElementById(id);
const sitesEl = $("sites");
const filesEl = $("files");

const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
  spin: '<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.55"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>'
};

// Generic, outline-style glyphs per AI (not brand logos), keyed by site id.
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SITE_ICONS = {
  chatgpt: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),          // chat bubble
  gemini: svg('<path d="M12 3c.5 4.6 2.4 6.5 9 9-6.6 2.5-8.5 4.4-9 9-.5-4.6-2.4-6.5-9-9 6.6-2.5 8.5-4.4 9-9Z"/>'), // sparkle
  claude: svg('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>'),                               // asterisk
  deepseek: svg('<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>'), // waves
  grok: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>'),                                      // bolt
  perplexity: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),                     // search
  copilot: svg('<path d="M4 8h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z"/><path d="M8 8V5M16 8V5"/>'),    // robot head
  mistral: svg('<path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3"/>')                          // wind
};
// Real site icon from Chrome's own favicon cache (needs the "favicon" permission).
// No external requests are made. If Chrome has no icon for the site yet, fall back to the glyph.
function siteIcon(site) {
  const glyph = () => {
    const span = document.createElement("span");
    span.className = "glyph";
    span.innerHTML = SITE_ICONS[site.id] || SITE_ICONS.perplexity; // search glyph as the generic fallback
    return span;
  };
  // Sites Chrome has no cached favicon for: bundled copies of the official icon.
  const BUNDLED = { copilot: "icons/sites/copilot.ico", mistral: "icons/sites/mistral.ico" };
  let src = "";
  if (BUNDLED[site.id]) {
    src = BUNDLED[site.id];
  } else {
    try {
      src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(site.url)}&size=32`;
    } catch (_) {}
  }
  if (!src) return glyph();
  const img = document.createElement("img");
  img.alt = "";
  img.width = 18;
  img.height = 18;
  img.src = src;
  img.addEventListener("error", () => img.replaceWith(glyph()));
  return img;
}

let files = []; // { name, type, size, dataUrl, preview }

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function updateCount() {
  const picked = sitesEl.querySelectorAll("input:checked").length;
  $("picked").textContent = `${picked} selected`;
  $("count").textContent = `${files.length} ${files.length === 1 ? "file" : "files"}`;
}

function renderFiles() {
  filesEl.innerHTML = files
    .map((f, i) => {
      const thumb = f.preview
        ? `<img src="${f.preview}" alt="">`
        : `<span class="ico">${f.type.startsWith("image/") ? ICONS.image : ICONS.file}</span>`;
      return `<span class="chip">${thumb}<span title="${esc(f.name)}">${esc(f.name)}</span>
        <button type="button" data-i="${i}" aria-label="Remove ${esc(f.name)}">${ICONS.close}</button></span>`;
    })
    .join("");
  updateCount();
}

filesEl.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-i]");
  if (!b) return;
  files.splice(Number(b.dataset.i), 1);
  renderFiles();
});

const readAsDataUrl = (f) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

(async () => {
  SITES.forEach((s, i) => {
    const l = document.createElement("label");
    l.className = "site";
    l.innerHTML = `<span class="ai" aria-hidden="true"></span><span class="name">${esc(s.name)}</span>
      <input type="checkbox" value="${s.id}"><span class="check">${ICONS.check}</span>`;
    l.querySelector(".ai").appendChild(siteIcon(s));
    sitesEl.appendChild(l);
  });
  const saved = (await chrome.storage.local.get(["selected", "autosend"])) || {};
  const selected = saved.selected || ["chatgpt", "gemini", "claude"];
  sitesEl.querySelectorAll("input").forEach((i) => (i.checked = selected.includes(i.value)));
  if (saved.autosend === false) $("autosend").checked = false;
  sitesEl.addEventListener("change", updateCount);
  updateCount();
})();

$("file").addEventListener("change", async () => {
  for (const f of $("file").files) {
    const dataUrl = await readAsDataUrl(f);
    const isImg = f.type.startsWith("image/");
    files.push({ name: f.name, type: f.type, size: f.size, dataUrl, preview: isImg ? dataUrl : null });
  }
  $("file").value = "";
  renderFiles();
});

function setStatus(html) { $("status").innerHTML = html; }

function resultRow(r) {
  const ok = r.ok;
  const detail = ok ? "Sent" : esc(r.error || "Failed");
  return `<div class="result ${ok ? "ok" : "bad"}">${ok ? ICONS.ok : ICONS.err}
    <div><div class="who">${esc(r.name || r.siteId)}</div><div class="msg">${detail}</div></div></div>`;
}

$("go").addEventListener("click", async () => {
  const sites = [...sitesEl.querySelectorAll("input:checked")].map((i) => i.value);
  const text = $("prompt").value.trim();
  if (!sites.length) return setStatus(resultRow({ ok: false, name: "Pick a site", error: "Select at least one AI site." }));
  if (!text && !files.length) return setStatus(resultRow({ ok: false, name: "Nothing to send", error: "Add a prompt or an attachment." }));

  await chrome.storage.local.set({ selected: sites, autosend: $("autosend").checked });
  const btn = $("go");
  btn.disabled = true;
  btn.innerHTML = `${ICONS.spin} Sending to ${sites.length}…`;
  setStatus(`<div class="result"><span>${ICONS.spin}</span><div class="msg">Opening tabs and attaching files…</div></div>`);

  const resp = await chrome.runtime.sendMessage({
    type: "multisearch:send",
    job: { sites, text, files: files.map((f) => ({ name: f.name, type: f.type, dataUrl: f.dataUrl })), autoSend: $("autosend").checked }
  });
  setStatus(resp.results.map(resultRow).join(""));
  btn.disabled = false;
  btn.innerHTML = `${ICONS.send} Send to selected`;
});
