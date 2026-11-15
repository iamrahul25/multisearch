// Renders popup.html in headless Chrome with a chrome.* stub and saves screenshots (light + dark).
const puppeteer = require("puppeteer-core");
const path = require("path");
const out = path.resolve(__dirname, "..", "..");
const stub = () => {
  window.chrome = {
    storage: { local: { get: async () => ({ selected: ["chatgpt", "gemini"], autosend: true }), set: async () => {} } },
    runtime: { sendMessage: async () => ({ results: [
      { ok: true, name: "ChatGPT", siteId: "chatgpt" },
      { ok: false, name: "Gemini", siteId: "gemini", error: "Prompt box not found (are you logged in?)" }] }) }
  };
};
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 900, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(stub);
  await page.goto("file:///" + path.resolve(__dirname, "..", "popup.html").replace(/\\/g, "/"));
  await page.waitForSelector("#sites .site");
  await page.click("#sites .site:nth-child(3)");
  await page.screenshot({ path: path.join(__dirname, "popup-light.png"), fullPage: true });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await new Promise((r) => setTimeout(r, 600)); // let color transitions finish before capture
  await page.screenshot({ path: path.join(__dirname, "popup-dark.png"), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log("horizontal overflow:", overflow);
  await browser.close();
})();
