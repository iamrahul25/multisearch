// Drives the Search tab in headless Chrome with a stubbed chrome.* API and checks the URLs it opens.
const puppeteer = require("puppeteer-core");
const path = require("path");
const stub = () => {
  window.__created = []; window.__group = null;
  let id = 1;
  window.chrome = {
    storage: { local: { get: async () => ({}), set: async () => {} } },
    runtime: { sendMessage: async () => ({ results: [] }) },
    tabs: {
      create: async ({ url, active }) => { const t = { id: id++, url, active }; window.__created.push(t); return t; },
      group: async ({ tabIds }) => { window.__group = { tabIds }; return 99; },
      update: async () => {}
    },
    tabGroups: { update: async (gid, props) => { window.__group.props = props; } }
  };
};
(async () => {
  const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 700, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(stub);
  await page.goto("file:///" + path.resolve(__dirname, "..", "popup.html").replace(/\\/g, "/"));
  await page.click('.tab[data-tab="search"]');
  const visible = await page.evaluate(() => [!document.getElementById("panel-search").hidden, document.getElementById("panel-ai").hidden]);
  await page.type("#q", "cats & dogs?");
  await page.screenshot({ path: path.join(__dirname, "search-light.png") });
  let fail = 0;
  const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, extra); if (!ok) fail++; };
  check("search panel shown, AI panel hidden", visible[0] && visible[1]);

  await page.click("#search-go"); // web mode, default engines
  await new Promise((r) => setTimeout(r, 300));
  let res = await page.evaluate(() => ({ urls: window.__created.map((t) => t.url), active: window.__created.map((t) => t.active), group: window.__group }));
  check("web: 3 default engines opened", res.urls.length === 3, JSON.stringify(res.urls));
  check("web: query URL-encoded", res.urls[0] === "https://www.google.com/search?q=cats%20%26%20dogs%3F");
  check("web: tabs opened inactive", res.active.every((a) => a === false));
  check("web: grouped as green 'Search: ...'", res.group && res.group.tabIds.length === 3 && res.group.props.color === "green" && res.group.props.title.startsWith("Search:"));

  await page.evaluate(() => { window.__created.length = 0; });
  await page.click('.seg button[data-mode="images"]');
  await page.click("#search-go");
  await new Promise((r) => setTimeout(r, 300));
  res = await page.evaluate(() => window.__created.map((t) => t.url));
  check("images: google images URL", res[0] === "https://www.google.com/search?tbm=isch&q=cats%20%26%20dogs%3F", res[0]);
  check("images: bing images URL", res[1].startsWith("https://www.bing.com/images/search?q="), res[1]);

  await page.evaluate(() => { window.__created.length = 0; });
  await page.$$eval("#engines input", (els) => els.forEach((e) => (e.checked = false)));
  await page.click("#search-go");
  const none = await page.evaluate(() => [window.__created.length, document.getElementById("search-status").textContent]);
  check("no engine selected: nothing opened + message", none[0] === 0 && /at least one/i.test(none[1]));

  await browser.close();
  process.exit(fail ? 1 : 0);
})();
