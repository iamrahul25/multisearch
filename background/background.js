// AI MultiSearch - Background Service Worker
importScripts('/utils/platforms.js');

// In-memory session tracking
let currentSession = null;
const tabSessionMap = new Map(); // tabId -> { sessionId, platformKey }

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startMultiSearch') {
    handleStartMultiSearch(message.data)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (message.action === 'getSessionData') {
    handleGetSessionData(sender.tab)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'switchToTab') {
    handleSwitchToTab(message.platformKey, message.tabId)
      .then(res => sendResponse({ success: true, ...res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'updateTabStatus') {
    handleUpdateTabStatus(sender.tab.id, message.status);
    sendResponse({ success: true });
    return false;
  }
});

// Start multi-search: create tabs and register session
async function handleStartMultiSearch({ prompt, files, platforms }) {
  const sessionId = 'session_' + Date.now();
  const settings = await chrome.storage.local.get(['autoSubmit', 'openInBackground']);
  const autoSubmit = settings.autoSubmit !== false; // Default true

  currentSession = {
    sessionId,
    prompt,
    files,
    platforms,
    tabs: {},
    tabStatuses: {},
    createdAt: Date.now(),
    autoSubmit
  };

  // Get current active tab/window to open new tabs adjacent to it
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const windowId = activeTab ? activeTab.windowId : undefined;
  let baseIndex = activeTab ? activeTab.index + 1 : undefined;

  // Open a tab for each selected platform
  for (let i = 0; i < platforms.length; i++) {
    const platformKey = platforms[i];
    const platform = PLATFORMS[platformKey];
    if (!platform) continue;

    // Open first platform as active tab, subsequent ones in background
    const shouldBeActive = (i === 0);

    const tab = await chrome.tabs.create({
      url: platform.url,
      active: shouldBeActive,
      windowId: windowId,
      index: baseIndex !== undefined ? baseIndex + i : undefined
    });

    currentSession.tabs[platformKey] = tab.id;
    tabSessionMap.set(tab.id, { sessionId, platformKey });
  }

  // Persist session to local storage for persistence across worker restarts
  await chrome.storage.local.set({
    latestSession: currentSession,
    lastPrompt: prompt
  });

  return { sessionId, openedTabs: currentSession.tabs };
}

// Check session data for a content script requesting it
async function handleGetSessionData(tab) {
  if (!tab || !tab.id) return null;

  // Check in-memory mapping first
  let mapping = tabSessionMap.get(tab.id);

  // If service worker restarted, restore from storage
  if (!currentSession) {
    const data = await chrome.storage.local.get(['latestSession']);
    if (data.latestSession) {
      currentSession = data.latestSession;
      // Rebuild tabSessionMap
      for (const [key, tId] of Object.entries(currentSession.tabs)) {
        tabSessionMap.set(tId, { sessionId: currentSession.sessionId, platformKey: key });
      }
      mapping = tabSessionMap.get(tab.id);
    }
  }

  // If still not matched, check if tab URL belongs to a platform in current session
  if (!mapping && currentSession && tab.url) {
    const platformKey = identifyPlatform(tab.url);
    if (platformKey && currentSession.platforms.includes(platformKey)) {
      // Re-link tab
      currentSession.tabs[platformKey] = tab.id;
      mapping = { sessionId: currentSession.sessionId, platformKey };
      tabSessionMap.set(tab.id, mapping);
    }
  }

  if (!mapping || !currentSession) {
    return null;
  }

  return {
    sessionId: currentSession.sessionId,
    prompt: currentSession.prompt,
    files: currentSession.files,
    platforms: currentSession.platforms,
    currentPlatform: mapping.platformKey,
    tabs: currentSession.tabs,
    autoSubmit: currentSession.autoSubmit
  };
}

// Switch active tab when user clicks a platform in the floating switcher
async function handleSwitchToTab(platformKey, targetTabId) {
  let tabId = targetTabId;

  // If targetTabId not specified or not existing, look up in current session
  if (!tabId && currentSession && currentSession.tabs[platformKey]) {
    tabId = currentSession.tabs[platformKey];
  }

  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab) {
        await chrome.tabs.update(tabId, { active: true });
        if (tab.windowId) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        return { switched: true, tabId };
      }
    } catch (e) {
      // Tab may have been closed, recreate it
    }
  }

  // Fallback: Re-open the tab if it was closed
  const platform = PLATFORMS[platformKey];
  if (platform) {
    const newTab = await chrome.tabs.create({ url: platform.url, active: true });
    if (currentSession) {
      currentSession.tabs[platformKey] = newTab.id;
      tabSessionMap.set(newTab.id, { sessionId: currentSession.sessionId, platformKey });
      await chrome.storage.local.set({ latestSession: currentSession });
    }
    return { switched: true, newTabId: newTab.id };
  }

  throw new Error(`Platform ${platformKey} not found`);
}

// Update status of tab injection/submission
function handleUpdateTabStatus(tabId, status) {
  if (currentSession && tabSessionMap.has(tabId)) {
    const { platformKey } = tabSessionMap.get(tabId);
    currentSession.tabStatuses[platformKey] = status;
  }
}

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabSessionMap.has(tabId)) {
    const { platformKey } = tabSessionMap.get(tabId);
    tabSessionMap.delete(tabId);
    if (currentSession && currentSession.tabs[platformKey] === tabId) {
      delete currentSession.tabs[platformKey];
    }
  }
});

// Support keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'switch-next-ai' || command === 'switch-prev-ai') {
    if (!currentSession || !currentSession.platforms || currentSession.platforms.length === 0) return;

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) return;

    const mapping = tabSessionMap.get(activeTab.id);
    if (!mapping) return;

    const platforms = currentSession.platforms;
    const currentIndex = platforms.indexOf(mapping.platformKey);
    if (currentIndex === -1) return;

    let nextIndex;
    if (command === 'switch-next-ai') {
      nextIndex = (currentIndex + 1) % platforms.length;
    } else {
      nextIndex = (currentIndex - 1 + platforms.length) % platforms.length;
    }

    const nextPlatform = platforms[nextIndex];
    handleSwitchToTab(nextPlatform, currentSession.tabs[nextPlatform]);
  }
});
