// Injected into each AI site tab. Exposes window.__multisearchRun(job) -> Promise<{ok, steps, error}>
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(fn, timeout = 20000, step = 250) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(step);
    }
    return null;
  }

  const visible = (el) => !!el && (el.offsetParent !== null || el.getClientRects().length > 0);

  function findFirst(selectors, { needVisible = true } = {}) {
    for (const s of selectors) {
      const els = [...document.querySelectorAll(s)];
      const el = els.find((e) => !needVisible || visible(e));
      if (el) return el;
    }
    return null;
  }

  async function toFile({ name, type, dataUrl }) {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], name, { type: type || blob.type, lastModified: Date.now() });
  }

  // Strategy 1: put files into a (possibly hidden) <input type=file> and fire change.
  function attachViaInput(site, files) {
    const input = findFirst(site.fileInput, { needVisible: false });
    if (!input) return false;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // Strategy 2: simulate a paste of the files into the composer.
  function attachViaPaste(composer, files) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    composer.focus();
    const ev = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
    return composer.dispatchEvent(ev);
  }

  // Strategy 3: simulate drag & drop onto the composer.
  function attachViaDrop(composer, files) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    for (const type of ["dragenter", "dragover", "drop"]) {
      composer.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
    }
  }

  function setText(el, text) {
    el.focus();
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return el.value === text;
    }
    // contenteditable (ProseMirror, Quill, Lexical...)
    const sel = window.getSelection();
    sel.selectAllChildren(el);
    document.execCommand("delete");
    let ok = document.execCommand("insertText", false, text);
    if (!ok || !(el.textContent || "").includes(text.slice(0, 20))) {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
    }
    return (el.textContent || "").includes(text.slice(0, 20));
  }

  function clickSend(site, composer) {
    const btn = findFirst(site.send);
    if (btn && !btn.disabled && btn.getAttribute("aria-disabled") !== "true") {
      btn.click();
      return "button";
    }
    const opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
    composer.dispatchEvent(new KeyboardEvent("keydown", opts));
    composer.dispatchEvent(new KeyboardEvent("keypress", opts));
    composer.dispatchEvent(new KeyboardEvent("keyup", opts));
    return "enter";
  }

  window.__multisearchRun = async function run({ site, text, files: rawFiles, autoSend }) {
    const steps = [];
    try {
      const composer = await waitFor(() => findFirst(site.input), 25000);
      if (!composer) return { ok: false, steps, error: "Prompt box not found (are you logged in?)" };
      steps.push("composer found");

      const files = await Promise.all((rawFiles || []).map(toFile));
      if (files.length) {
        const hadInputBefore = !!findFirst(site.fileInput, { needVisible: false });
        let how = "";
        if (hadInputBefore && attachViaInput(site, files)) how = "file-input";
        else {
          // dispatchEvent returns false when the page handled (preventDefault'ed) the paste.
          const unhandled = attachViaPaste(composer, files);
          how = "paste";
          if (unhandled) { attachViaDrop(composer, files); how = "paste+drop fallback"; }
        }
        steps.push("attach via " + how);
        // give uploads time to finish (send button is typically disabled while uploading)
        await sleep(2500 + files.length * 1000);
      }

      if (text) {
        const ok = setText(composer, text);
        steps.push(ok ? "text set" : "text may not have been set");
        await sleep(400);
      }

      if (autoSend) {
        // wait for send button to become enabled (e.g. after uploads), up to 30s
        const btn = await waitFor(() => {
          const b = findFirst(site.send);
          return b && !b.disabled && b.getAttribute("aria-disabled") !== "true" ? b : null;
        }, 30000);
        steps.push("sent via " + (btn ? (btn.click(), "button") : clickSend(site, composer)));
      }
      return { ok: true, steps };
    } catch (e) {
      return { ok: false, steps, error: String(e && e.message || e) };
    }
  };
})();
