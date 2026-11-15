importScripts("sites.js");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForComplete(tabId, timeout = 45000) {
  return new Promise((resolve) => {
    const done = () => { chrome.tabs.onUpdated.removeListener(l); clearTimeout(t); resolve(); };
    const l = (id, info) => { if (id === tabId && info.status === "complete") done(); };
    const t = setTimeout(done, timeout);
    chrome.tabs.onUpdated.addListener(l);
    chrome.tabs.get(tabId).then((tab) => { if (tab.status === "complete") done(); }).catch(done);
  });
}

async function runOne(siteId, job) {
  const site = SITES.find((s) => s.id === siteId);
  const tab = await chrome.tabs.create({ url: site.url, active: false });
  await waitForComplete(tab.id);
  await sleep(1500); // let SPA hydrate
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (payload) => window.__multisearchRun(payload),
    args: [{ site, text: job.text, files: job.files, autoSend: job.autoSend }]
  });
  return { tabId: tab.id, siteId, name: site.name, ...(res && res.result || { ok: false, error: "no result" }) };
}

async function handleSend(job) {
  const results = await Promise.all(
    job.sites.map((id) => runOne(id, job).catch((e) => ({ siteId: id, ok: false, error: String(e) })))
  );
  const tabIds = results.map((r) => r.tabId).filter(Boolean);
  if (tabIds.length) {
    try {
      const gid = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(gid, { title: "MultiSearch", color: "blue" });
      await chrome.tabs.update(tabIds[0], { active: true });
    } catch (_) {}
  }
  return results;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "multisearch:send") {
    handleSend(msg.job).then((results) => sendResponse({ results }));
    return true; // async
  }
});
