// Crisp, authentic SVG icons for all supported AI platforms
const PLATFORM_ICONS = {
  chatgpt: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M20.5 10.15a5.52 5.52 0 0 0-.46-4.38 5.6 5.6 0 0 0-4.44-2.73 5.49 5.49 0 0 0-4.04 1.25A5.5 5.5 0 0 0 7.8 3.5a5.6 5.6 0 0 0-4.44 2.73 5.5 5.5 0 0 0 .28 6.13 5.52 5.52 0 0 0-.28 4.38 5.6 5.6 0 0 0 4.44 2.73 5.5 5.5 0 0 0 3.76-.79 5.5 5.5 0 0 0 3.76.79 5.6 5.6 0 0 0 4.44-2.73 5.5 5.5 0 0 0-.28-6.13l.02-.43zm-7.66 9.87a3.8 3.8 0 0 1-2.47-.9l.3-.17 4.1-2.37a.87.87 0 0 0 .43-.75v-5.78l1.73 1a.08.08 0 0 1 .04.06v4.75a3.85 3.85 0 0 1-4.13 4.16zm-7.46-3.83a3.83 3.83 0 0 1-.49-2.58l.3.18 4.1 2.36a.87.87 0 0 0 .87 0l5.01-2.89v2a.08.08 0 0 1-.03.07l-4.12 2.38a3.84 3.84 0 0 1-5.64-1.52zm-1.82-7.85a3.84 3.84 0 0 1 1.98-1.68v4.9a.87.87 0 0 0 .43.76l5.01 2.89-1.73 1a.08.08 0 0 1-.07 0l-4.12-2.38a3.85 3.85 0 0 1-1.5-5.49zm13.1 2.05l-5.01-2.89 1.73-1a.08.08 0 0 1 .07 0l4.12 2.38a3.84 3.84 0 0 1 1.5 5.49 3.84 3.84 0 0 1-1.98 1.68v-4.9a.87.87 0 0 0-.43-.76zm2.3 5.78a3.83 3.83 0 0 1 .49 2.58l-.3-.18-4.1-2.36a.87.87 0 0 0-.87 0l-5.01 2.89v-2a.08.08 0 0 1 .03-.07l4.12-2.38a3.84 3.84 0 0 1 5.64 1.52zM8.36 12.87l2.14-1.24 2.14 1.24v2.47l-2.14 1.23-2.14-1.23v-2.47z"/>
    </svg>`,

  gemini: `
    <svg viewBox="0 0 24 24" width="22" height="22">
      <defs>
        <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4E8CFF"/>
          <stop offset="40%" stop-color="#7356FF"/>
          <stop offset="70%" stop-color="#9C52F8"/>
          <stop offset="100%" stop-color="#DE5CDD"/>
        </linearGradient>
      </defs>
      <path fill="url(#gemini-grad)" d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"/>
    </svg>`,

  claude: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#D97706">
      <path d="M13.2 2.5a1.2 1.2 0 0 0-2.4 0v3.4a1.2 1.2 0 0 0 2.4 0V2.5zm-5.4 2.4a1.2 1.2 0 0 0-1.7 1.7l2.4 2.4a1.2 1.2 0 1 0 1.7-1.7L7.8 4.9zm10.1 1.7a1.2 1.2 0 1 0-1.7-1.7l-2.4 2.4a1.2 1.2 0 1 0 1.7 1.7l2.4-2.4zM2.5 10.8a1.2 1.2 0 1 0 0 2.4h3.4a1.2 1.2 0 1 0 0-2.4H2.5zm15.6 0a1.2 1.2 0 1 0 0 2.4h3.4a1.2 1.2 0 1 0 0-2.4h-3.4zM7.8 19.1a1.2 1.2 0 1 0-1.7-1.7l-2.4 2.4a1.2 1.2 0 1 0 1.7 1.7l2.4-2.4zm10.1-1.7a1.2 1.2 0 1 0-1.7 1.7l2.4 2.4a1.2 1.2 0 1 0 1.7-1.7l-2.4-2.4zm-4.7-1.6a1.2 1.2 0 0 0-2.4 0v3.4a1.2 1.2 0 0 0 2.4 0v-3.4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
    </svg>`,

  deepseek: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#0066FF">
      <path d="M18.8 8.4C17.7 5.7 14.8 4 11.8 4 7.5 4 4 7.5 4 11.8c0 3.2 1.8 6 4.5 7.3l-1.3 2.1c-.3.5 0 1.1.6 1.1h9.4c.5 0 .8-.5.6-.9l-1.6-3.2c2.5-1.5 4.1-4.2 4.1-7.2 0-.9-.1-1.7-.5-2.5zm-7 8.6c-2.8 0-5.2-2.3-5.2-5.2S8.9 6.6 11.8 6.6s5.2 2.3 5.2 5.2-2.4 5.2-5.2 5.2z"/>
      <circle cx="11.8" cy="11.8" r="2.4" fill="#0066FF"/>
      <circle cx="17.5" cy="11" r="1.2" fill="#00D2FF"/>
    </svg>`,

  perplexity: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#13B5B1">
      <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm0 2.5l5.5 3.1-5.5 3.1-5.5-3.1L12 4.5zm-6 4.8l5 2.8v5.8l-5-2.8V9.3zm12 5.8l-5 2.8v-5.8l5-2.8v5.8z"/>
    </svg>`,

  mistral: `
    <svg viewBox="0 0 24 24" width="22" height="22">
      <defs>
        <linearGradient id="mistral-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF5722"/>
          <stop offset="100%" stop-color="#FF9800"/>
        </linearGradient>
      </defs>
      <rect x="3" y="4" width="3.5" height="16" rx="1.5" fill="url(#mistral-grad)"/>
      <rect x="17.5" y="4" width="3.5" height="16" rx="1.5" fill="url(#mistral-grad)"/>
      <rect x="10.25" y="9" width="3.5" height="11" rx="1.5" fill="url(#mistral-grad)"/>
      <path d="M4.5 5.5l6.5 5 6.5-5" stroke="#FF5722" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

  layers: `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>`
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLATFORM_ICONS };
}

