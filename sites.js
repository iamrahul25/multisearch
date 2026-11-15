// Shared site registry (used by popup, background and content script).
// `input`: candidate selectors for the prompt box. `fileInput`: file <input> selectors.
// `send`: candidate send-button selectors. Selectors are best-effort; sites change their DOM.
const SITES = [
  {
    id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/",
    input: ["#prompt-textarea", "div[contenteditable='true'][role='textbox']", "textarea"],
    fileInput: ["input[type='file']"],
    send: ["button[data-testid='send-button']", "button[aria-label*='Send']"]
  },
  {
    id: "gemini", name: "Gemini", url: "https://gemini.google.com/app",
    input: ["rich-textarea div.ql-editor", "div.ql-editor[contenteditable='true']", "div[contenteditable='true']"],
    fileInput: ["input[type='file']"],
    send: ["button.send-button", "button[aria-label*='Send']"]
  },
  {
    id: "claude", name: "Claude", url: "https://claude.ai/new",
    input: ["div[contenteditable='true'].ProseMirror", "div[contenteditable='true']"],
    fileInput: ["input[type='file']"],
    send: ["button[aria-label*='Send']"]
  },
  {
    id: "deepseek", name: "DeepSeek", url: "https://chat.deepseek.com/",
    input: ["textarea#chat-input", "textarea"],
    fileInput: ["input[type='file']"],
    send: ["div[role='button'][aria-disabled='false']", "button[type='submit']"]
  },
  {
    id: "grok", name: "Grok", url: "https://grok.com/",
    input: ["textarea", "div[contenteditable='true']"],
    fileInput: ["input[type='file']"],
    send: ["button[type='submit']", "button[aria-label*='Submit']", "button[aria-label*='Send']"]
  },
  {
    id: "perplexity", name: "Perplexity", url: "https://www.perplexity.ai/",
    input: ["div#ask-input[contenteditable='true']", "div[contenteditable='true']", "textarea"],
    fileInput: ["input[type='file']"],
    send: ["button[aria-label*='Submit']", "button[aria-label*='Send']"]
  },
  {
    id: "copilot", name: "Copilot", url: "https://copilot.microsoft.com/",
    input: ["textarea#userInput", "textarea"],
    fileInput: ["input[type='file']"],
    send: ["button[aria-label*='Submit']", "button[data-testid='submit-button']"]
  },
  {
    id: "mistral", name: "Le Chat", url: "https://chat.mistral.ai/chat",
    input: ["div[contenteditable='true']", "textarea"],
    fileInput: ["input[type='file']"],
    send: ["button[type='submit']", "button[aria-label*='Send']"]
  }
];
if (typeof self !== "undefined") self.SITES = SITES;
