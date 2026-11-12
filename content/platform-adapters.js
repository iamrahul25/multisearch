// AI MultiSearch - Platform Adapters
// Handles text injection and attachment processing for each specific AI website

class PlatformAdapter {
  constructor(platformKey, config) {
    this.key = platformKey;
    this.config = config;
  }

  // Poll and wait for a selector to appear in DOM
  async waitForSelector(selectors, timeout = 12000) {
    const startTime = Date.now();
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    return new Promise((resolve) => {
      const check = () => {
        for (const sel of selectorList) {
          const el = document.querySelector(sel);
          if (el && this.isVisible(el)) {
            return resolve(el);
          }
        }

        if (Date.now() - startTime >= timeout) {
          // One final attempt matching without visibility check
          for (const sel of selectorList) {
            const el = document.querySelector(sel);
            if (el) return resolve(el);
          }
          return resolve(null);
        }

        setTimeout(check, 250);
      };

      check();
    });
  }

  isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  // Insert prompt text into an input or contenteditable element
  async injectText(element, text) {
    if (!element || !text) return false;

    element.focus();

    // Check if it's a textarea or input
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(element, text);
      } else {
        element.value = text;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // For contenteditable elements (ProseMirror, Quill, DraftJS, Lexical)
    if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
      // Clear existing default placeholder if any
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);

      // Method 1: execCommand (triggers native undo/redo & rich text editor events)
      const success = document.execCommand('insertText', false, text);

      if (!success || element.textContent.trim() !== text.trim()) {
        // Method 2: InputEvent simulation
        element.textContent = text;
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        });
        element.dispatchEvent(inputEvent);
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  }

  // Convert Base64 dataURL to File object
  async dataUrlToFile(fileData) {
    const { name, type, dataUrl } = fileData;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type: type || blob.type || 'application/octet-stream' });
  }

  // Inject attached files into the platform's file input or drop target
  async injectFiles(files) {
    if (!files || files.length === 0) return true;

    try {
      const fileObjects = [];
      for (const f of files) {
        const fileObj = await this.dataUrlToFile(f);
        fileObjects.push(fileObj);
      }

      const dt = new DataTransfer();
      fileObjects.forEach(f => dt.items.add(f));

      // Strategy 1: Find file input
      let fileInput = null;
      if (this.config.fileInputSelectors) {
        for (const sel of this.config.fileInputSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            fileInput = el;
            break;
          }
        }
      }

      if (fileInput) {
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Strategy 2: Drop on chat input area / container
      const inputEl = await this.waitForSelector(this.config.inputSelectors, 2000);
      const dropTarget = inputEl?.closest('form') || inputEl?.parentElement || document.body;

      if (dropTarget) {
        const dragEnterEvent = new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt });
        const dragOverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
        const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });

        dropTarget.dispatchEvent(dragEnterEvent);
        dropTarget.dispatchEvent(dragOverEvent);
        dropTarget.dispatchEvent(dropEvent);

        // Also dispatch paste event with files
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dt
        });
        dropTarget.dispatchEvent(pasteEvent);
      }

      return true;
    } catch (err) {
      console.warn('[AI MultiSearch] Attachment injection warning:', err);
      return false;
    }
  }

  // Submit the prompt
  async submit() {
    // Look for submit button
    const submitBtn = await this.waitForSelector(this.config.submitSelectors, 3000);

    if (submitBtn && !submitBtn.disabled && submitBtn.getAttribute('aria-disabled') !== 'true') {
      submitBtn.click();
      return true;
    }

    // Fallback: Dispatch Enter key on active input
    const inputEl = await this.waitForSelector(this.config.inputSelectors, 1000);
    if (inputEl) {
      inputEl.focus();
      const enterDown = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      inputEl.dispatchEvent(enterDown);
      return true;
    }

    return false;
  }
}

// Specializations for particular platforms if needed
class ChatGPTAdapter extends PlatformAdapter {
  async injectFiles(files) {
    const success = await super.injectFiles(files);
    // ChatGPT often has a hidden file input under form
    const chatgptFileInput = document.querySelector('input[type="file"]');
    if (chatgptFileInput && files && files.length > 0) {
      try {
        const dt = new DataTransfer();
        for (const f of files) {
          dt.items.add(await this.dataUrlToFile(f));
        }
        chatgptFileInput.files = dt.files;
        chatgptFileInput.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {}
    }
    return success;
  }
}

class GeminiAdapter extends PlatformAdapter {
  async injectText(element, text) {
    element.focus();
    // Gemini's rich-textarea uses Quill or custom contenteditable
    const editor = element.querySelector('.ql-editor') || element;
    editor.focus();
    
    // Set paragraph content
    editor.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
}

class ClaudeAdapter extends PlatformAdapter {
  async injectText(element, text) {
    element.focus();
    // Claude ProseMirror editor
    document.execCommand('insertText', false, text);
    if (!element.textContent.includes(text)) {
      element.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
      element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
    return true;
  }
}

// Factory to create appropriate adapter
function createAdapter(platformKey, config) {
  if (platformKey === 'chatgpt') return new ChatGPTAdapter(platformKey, config);
  if (platformKey === 'gemini') return new GeminiAdapter(platformKey, config);
  if (platformKey === 'claude') return new ClaudeAdapter(platformKey, config);
  return new PlatformAdapter(platformKey, config);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createAdapter, PlatformAdapter };
}

