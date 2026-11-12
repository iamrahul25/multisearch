// Central platform configuration for AI MultiSearch
const PLATFORMS = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    matchPatterns: ['*://chatgpt.com/*', '*://chat.openai.com/*'],
    themeColor: '#10a37f',
    textColor: '#ffffff',
    defaultEnabled: true,
    inputSelectors: [
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'div#prompt-textarea',
      'div[contenteditable="true"][id="prompt-textarea"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    fileInputSelectors: [
      'input[type="file"][tabindex="-1"]',
      'input[type="file"]'
    ],
    submitSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[data-testid="fruitjuice-send-button"]',
      'form button[type="submit"]'
    ]
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    matchPatterns: ['*://gemini.google.com/*'],
    themeColor: '#7356FF',
    textColor: '#ffffff',
    defaultEnabled: true,
    inputSelectors: [
      'rich-textarea .ql-editor',
      'div.ql-editor',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    fileInputSelectors: [
      'input[type="file"][accept*="image"]',
      'input[type="file"]'
    ],
    submitSelectors: [
      'button.send-button',
      'button[aria-label*="Send"]',
      'button[aria-label*="Submit"]',
      '.send-button-container button'
    ]
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new',
    matchPatterns: ['*://claude.ai/*'],
    themeColor: '#D97706',
    textColor: '#ffffff',
    defaultEnabled: true,
    inputSelectors: [
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"]',
      'fieldset div[contenteditable="true"]',
      'textarea'
    ],
    fileInputSelectors: [
      'input[type="file"]'
    ],
    submitSelectors: [
      'button[aria-label="Send Message"]',
      'button[aria-label="Send message"]',
      'fieldset button:has(svg)',
      'button:has(svg[data-icon="arrow-up"])'
    ]
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    matchPatterns: ['*://chat.deepseek.com/*'],
    themeColor: '#0066FF',
    textColor: '#ffffff',
    defaultEnabled: true,
    inputSelectors: [
      'textarea#chat-input',
      'textarea[placeholder*="DeepSeek"]',
      'textarea[placeholder*="Type"]',
      'textarea'
    ],
    fileInputSelectors: [
      'input[type="file"]'
    ],
    submitSelectors: [
      'div[role="button"][aria-label*="Send"]',
      '.chat-input-send-button',
      'div[role="button"]:has(svg)',
      'button:has(svg)'
    ]
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    matchPatterns: ['*://www.perplexity.ai/*', '*://perplexity.ai/*'],
    themeColor: '#13B5B1',
    textColor: '#ffffff',
    defaultEnabled: false,
    inputSelectors: [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Follow up"]',
      'textarea',
      'div[contenteditable="true"]'
    ],
    fileInputSelectors: [
      'input[type="file"]'
    ],
    submitSelectors: [
      'button[aria-label="Submit"]',
      'button[aria-label*="Send"]',
      'button:has(svg)'
    ]
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral',
    url: 'https://chat.mistral.ai/chat',
    matchPatterns: ['*://chat.mistral.ai/*'],
    themeColor: '#FF5722',
    textColor: '#ffffff',
    defaultEnabled: false,
    inputSelectors: [
      'textarea[placeholder*="Ask"]',
      'textarea',
      'div[contenteditable="true"]'
    ],
    fileInputSelectors: [
      'input[type="file"]'
    ],
    submitSelectors: [
      'button[type="submit"]',
      'button:has(svg)'
    ]
  }
};

// Helper to identify platform by current URL
function identifyPlatform(url) {
  if (!url) return null;
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    for (const pattern of platform.matchPatterns) {
      const reg = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (reg.test(url)) return key;
    }
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLATFORMS, identifyPlatform };
}

