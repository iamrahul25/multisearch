// Tabs + Search panel. Loaded after popup.js, so it reuses $, esc, ICONS, siteIcon, resultRow.
(() => {
  const engEl = $("engines");
  const sStatus = $("search-status");
  let mode = "web";

  // ---- top tabs ----
  function showTab(name) {
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    $("panel-ai").hidden = name !== "ai";
    $("panel-search").hidden = name !== "search";
    try { chrome.storage.local.set({ tab: name }); } catch (_) {}
    if (name === "search") $("q").focus();
  }
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

  // ---- mode (Web / Images) ----
  function setMode(m) {
    mode = m;
    document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
  }
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  function updatePicked() {
    $("eng-picked").textContent = `${engEl.querySelectorAll("input:checked").length} selected`;
  }

  // ---- engine grid ----
  ENGINES.forEach((e) => {
    const l = document.createElement("label");
    l.className = "site";
    l.innerHTML = `<span class="ai" aria-hidden="true"></span><span class="name">${esc(e.name)}</span>
      <input type="checkbox" value="${e.id}"><span class="check">${ICONS.check}</span>`;
    l.querySelector(".ai").appendChild(siteIcon(e));
    engEl.appendChild(l);
  });
  engEl.addEventListener("change", updatePicked);

  // ---- search ----
  async function runSearch() {
    const q = $("q").value.trim();
    const ids = [...engEl.querySelectorAll("input:checked")].map((i) => i.value);
    if (!q) return (sStatus.innerHTML = resultRow({ ok: false, name: "Nothing to search", error: "Type something first." }));
    if (!ids.length) return (sStatus.innerHTML = resultRow({ ok: false, name: "Pick an engine", error: "Select at least one search engine." }));

    try { await chrome.storage.local.set({ engSelected: ids, engMode: mode }); } catch (_) {}
    const btn = $("search-go");
    btn.disabled = true;
    sStatus.innerHTML = "";

    const tabIds = [];
    const rows = [];
    for (const id of ids) {
      const e = ENGINES.find((x) => x.id === id);
      const url = e[mode].replace("{q}", encodeURIComponent(q));
      try {
        const tab = await chrome.tabs.create({ url, active: false });
        tabIds.push(tab.id);
        rows.push({ ok: true, name: e.name });
      } catch (err) {
        rows.push({ ok: false, name: e.name, error: String(err && err.message || err) });
      }
    }
    if (tabIds.length) {
      try {
        const gid = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(gid, { title: `Search: ${q.slice(0, 20)}`, color: "green" });
        await chrome.tabs.update(tabIds[0], { active: true });
      } catch (_) {}
    }
    sStatus.innerHTML = rows.map((r) => resultRow({ ...r, siteId: r.name })).join("");
    btn.disabled = false;
  }
  $("search-go").addEventListener("click", runSearch);
  $("q").addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });

  // ---- restore saved state ----
  (async () => {
    let saved = {};
    try { saved = (await chrome.storage.local.get(["tab", "engSelected", "engMode"])) || {}; } catch (_) {}
    const sel = saved.engSelected || ["google", "bing", "duckduckgo"];
    engEl.querySelectorAll("input").forEach((i) => (i.checked = sel.includes(i.value)));
    setMode(saved.engMode === "images" ? "images" : "web");
    updatePicked();
    showTab(saved.tab === "search" ? "search" : "ai");
  })();
})();
