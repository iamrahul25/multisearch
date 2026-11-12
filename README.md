# AI MultiSearch - Chrome Extension

> **Ask once, get answers from multiple AI platforms simultaneously.**  
> Automatically inject prompts and file attachments into ChatGPT, Gemini, Claude, DeepSeek, and more, and seamlessly switch between results with the floating switch bar.

![AI MultiSearch Preview](icons/icon128.png)

---

## ✨ Features

- ⚡ **1-Click MultiSearch**: Type your prompt once, select your AI platforms, and launch them in parallel tabs.
- 📎 **Full Attachment Support**: Attach PDFs, images, code files, and documents. The extension forwards and injects files into each AI web application.
- 🔄 **Floating Switch Results Bar**: A docked, frosted-glass switcher directly on AI web pages (`ChatGPT`, `Gemini`, `Claude`, `DeepSeek`, `Perplexity`, `Mistral`) that allows instant 1-click tab switching.
- ⚙️ **Smart Auto-Fill & Auto-Submit**: Intelligently pastes text and uploads files into React / ProseMirror / Lexical rich text editors and optionally triggers submit after file parsing.
- ⌨️ **Keyboard Shortcuts**:
  - `Ctrl + Enter` (in popup): Run multi-search immediately.
  - `Ctrl + Shift + S` (global): Open the AI MultiSearch extension.
  - `Alt + Right` / `Alt + Left`: Cycle between AI result tabs.

---

## 🚀 How to Install in Google Chrome

1. Open **Google Chrome**.
2. Navigate to: `chrome://extensions`
3. In the top-right corner, enable the **"Developer mode"** toggle switch.
4. Click the **"Load unpacked"** button in the top-left toolbar.
5. In the file picker, select this project directory:
   ```
   C:\all-projects\multisearch
   ```
6. Click **Select Folder**. The **AI MultiSearch** extension is now installed!
7. Pin the extension to your toolbar by clicking Chrome's puzzle piece icon (🧩) and clicking the pin icon next to **AI MultiSearch**.

---

## 🖥️ Supported AI Platforms

| Platform | URL | Text Injection | File Uploads | Auto-Submit |
|---|---|:---:|:---:|:---:|
| **ChatGPT** | `https://chatgpt.com` | ✅ | ✅ | ✅ |
| **Gemini** | `https://gemini.google.com` | ✅ | ✅ | ✅ |
| **Claude** | `https://claude.ai` | ✅ | ✅ | ✅ |
| **DeepSeek** | `https://chat.deepseek.com` | ✅ | ✅ | ✅ |
| **Perplexity** | `https://www.perplexity.ai` | ✅ | ✅ | ✅ |
| **Mistral** | `https://chat.mistral.ai` | ✅ | ✅ | ✅ |

---

## 📁 Project Structure

```
multisearch/
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── popup/
│   ├── popup.html             # MultiSearch popup UI matching design mockup
│   ├── popup.css              # Modern purple theme & card layout styling
│   └── popup.js               # Multi-platform selection & file attachment logic
├── content/
│   ├── content.js             # Content script orchestrator & floating switcher
│   ├── content.css            # Floating 'Switch Results' frosted-glass styling
│   └── platform-adapters.js   # Site-specific DOM injectors & file handlers
├── background/
│   └── background.js          # Background service worker & tab coordinator
├── options/
│   ├── options.html           # Settings page
│   ├── options.css            # Settings styling
│   └── options.js             # User preferences persistence
├── utils/
│   └── platforms.js           # Platform metadata & DOM selectors
├── icons/
│   ├── icon16.png             # Extension icons (16px)
│   ├── icon32.png             # Extension icons (32px)
│   ├── icon48.png             # Extension icons (48px)
│   ├── icon128.png            # Extension icons (128px)
│   └── platform-icons.js      # Crisp SVG platform logos
├── test/
│   └── demo.html              # Interactive visual preview & test bench
└── README.md                  # Installation & usage instructions
```

---

## 🧪 Visual Demo & Testing

You can open `test/demo.html` in any browser to preview the popup layout, simulated AI tab responses, and test the floating "Switch Results" bar interactively!

