// Runs content.js against mock chat pages in real headless Chrome for each attachment path.
const puppeteer = require("puppeteer-core");
const path = require("path");
const root = path.resolve(__dirname, "..");
const files = [
  { name: "a.png", type: "image/png", dataUrl: "data:image/png;base64,iVBORw0KGgo=" },
  { name: "b.txt", type: "text/plain", dataUrl: "data:text/plain;base64,aGVsbG8=" }
];
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new", args: ["--allow-file-access-from-files"]
  });
  let fail = 0;
  for (const mode of ["input", "paste", "drop"]) {
    const page = await browser.newPage();
    await page.goto("file:///" + root.replace(/\\/g, "/") + "/test/mock.html?mode=" + mode);
    const res = await page.evaluate(async (files) => {
      const site = { input: ["#prompt"], fileInput: ["input[type='file']"], send: ["#send"] };
      const r = await window.__multisearchRun({ site, text: "hello world prompt", files, autoSend: true });
      return { r, log: document.getElementById("log").textContent };
    }, files);
    const okFiles = res.log.includes("ATTACH a.png") && res.log.includes("ATTACH b.txt");
    const okSent = res.log.includes('SENT text="hello world prompt"') && res.log.includes("files=a.png:") ;
    console.log(`[${mode}] ${okFiles && okSent ? "PASS" : "FAIL"}`, JSON.stringify(res.r.steps));
    if (!(okFiles && okSent)) { fail++; console.log(res.log, res.r.error || ""); }
    await page.close();
  }
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
