// AI MultiSearch - Content Script
(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__aiMultiSearchLoaded) return;
  window.__aiMultiSearchLoaded = true;

  let currentPlatformKey = null;
  let sessionData = null;
  let floatingBarEl = null;
  let statusToastEl = null;

  // Initialize
  async function init() {
    currentPlatformKey = identifyPlatform(window.location.href);
    if (!currentPlatformKey) return;

    // Check if this page is part of an active MultiSearch session
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSessionData' });
      if (response && response.success && response.data) {
        sessionData = response.data;
        handleSession(sessionData);
      }
    } catch (err) {
      // Content script may have loaded before background worker is ready
      console.log('[AI MultiSearch] Waiting for session...', err);
    }
  }

  // Handle active session: inject and render switcher bar
  async function handleSession(session) {
    // Render the floating switcher immediately
    renderSwitchBar(session);

    // Check if we should inject (only once per session per tab)
    const injectedKey = `aims_injected_${session.sessionId}_${currentPlatformKey}`;
    const alreadyInjected = sessionStorage.getItem(injectedKey);

    if (!alreadyInjected && session.prompt) {
      sessionStorage.setItem(injectedKey, 'true');
      await executeInjection(session);
    }
  }

  // Execute prompt and attachment injection
  async function executeInjection(session) {
    showToast('AI MultiSearch: Filling prompt...', true);

    const platformConfig = PLATFORMS[currentPlatformKey];
    if (!platformConfig) return;

    const adapter = createAdapter(currentPlatformKey, platformConfig);

    try {
      // Step 1: Wait for input element to be available in the DOM
      const inputEl = await adapter.waitForSelector(platformConfig.inputSelectors, 12000);

      if (!inputEl) {
        showToast('MultiSearch: Ready to paste prompt (input not detected automatically)', false, 4000);
        return;
      }

      // Step 2: Inject attachments first if any exist
      if (session.files && session.files.length > 0) {
        showToast(`Attaching ${session.files.length} file(s)...`, true);
        await adapter.injectFiles(session.files);
        // Short pause to allow upload handlers to process
        await new Promise(r => setTimeout(r, 1200));
      }

      // Step 3: Inject prompt text
      showToast('Pasting prompt...', true);
      const injected = await adapter.injectText(inputEl, session.prompt);

      if (injected) {
        // Step 4: Auto-submit if enabled
        if (session.autoSubmit) {
          showToast('Submitting...', true);
          // Wait briefly for attachment processing / tokenization
          const waitMs = (session.files && session.files.length > 0) ? 2200 : 800;
          await new Promise(r => setTimeout(r, waitMs));

          const submitted = await adapter.submit();
          if (submitted) {
            showToast('Prompt submitted!', false, 2500);
            chrome.runtime.sendMessage({ action: 'updateTabStatus', status: 'submitted' });
          } else {
            showToast('Prompt pasted. Press Enter to send.', false, 3500);
          }
        } else {
          showToast('Prompt pasted. Review and send!', false, 3000);
        }
      } else {
        showToast('Prompt ready. Click input to paste.', false, 3000);
      }
    } catch (err) {
      console.warn('[AI MultiSearch] Injection error:', err);
      showToast('Ready to search', false, 2000);
    }
  }

  // Render the floating "Switch Results" bar
  function renderSwitchBar(session) {
    if (floatingBarEl) {
      floatingBarEl.remove();
    }

    const root = document.createElement('div');
    root.id = 'ai-multisearch-root';

    const bar = document.createElement('div');
    bar.className = 'aims-switch-bar';

    // Status Toast
    statusToastEl = document.createElement('div');
    statusToastEl.className = 'aims-status-toast';
    bar.appendChild(statusToastEl);

    // Left Brand / Switch Results Label
    const brandLabel = document.createElement('div');
    brandLabel.className = 'aims-brand-label';
    brandLabel.title = 'Drag to move AI MultiSearch bar';
    brandLabel.innerHTML = `
      <div class="aims-brand-icon">
        ${PLATFORM_ICONS.layers}
      </div>
      <span class="aims-brand-text">Switch Results</span>
    `;
    bar.appendChild(brandLabel);

    // Platforms container
    const platformsContainer = document.createElement('div');
    platformsContainer.className = 'aims-platforms-container';

    // Render platform buttons
    const platforms = session.platforms || Object.keys(session.tabs || {});
    platforms.forEach(platformKey => {
      const p = PLATFORMS[platformKey];
      if (!p) return;

      const isCurrent = (platformKey === currentPlatformKey);
      const iconSvg = PLATFORM_ICONS[platformKey] || PLATFORM_ICONS.layers;

      const pill = document.createElement('button');
      pill.className = `aims-platform-pill ${isCurrent ? 'active' : ''}`;
      pill.title = isCurrent ? `${p.name} (Current Tab)` : `Switch to ${p.name}`;
      pill.innerHTML = `
        <span class="aims-platform-icon">${iconSvg}</span>
        <span>${p.name}</span>
      `;

      pill.addEventListener('click', () => {
        if (isCurrent) return;

        // Switch to that tab
        const targetTabId = session.tabs ? session.tabs[platformKey] : null;
        chrome.runtime.sendMessage({
          action: 'switchToTab',
          platformKey: platformKey,
          tabId: targetTabId
        });
      });

      platformsContainer.appendChild(pill);
    });

    bar.appendChild(platformsContainer);

    // Right Action / Menu button (popout icon ↗)
    const actionBtn = document.createElement('button');
    actionBtn.className = 'aims-action-btn';
    actionBtn.title = 'MultiSearch Options (Copy prompt, re-run, or minimize)';
    actionBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    `;

    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showActionMenu(actionBtn, session);
    });

    bar.appendChild(actionBtn);

    root.appendChild(bar);
    document.body.appendChild(root);
    floatingBarEl = root;

    // Enable dragging
    makeDraggable(root, brandLabel);
  }

  // Display status toast above the bar
  function showToast(text, isSpinner = false, duration = 0) {
    if (!statusToastEl) return;

    statusToastEl.innerHTML = `
      ${isSpinner ? '<span class="aims-status-spinner"></span>' : ''}
      <span>${text}</span>
    `;
    statusToastEl.classList.add('show');

    if (duration > 0) {
      setTimeout(() => {
        statusToastEl.classList.remove('show');
      }, duration);
    }
  }

  // Action Menu dropdown (Copy prompt, Re-inject, Minimize)
  function showActionMenu(targetBtn, session) {
    const existingMenu = document.getElementById('aims-action-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement('div');
    menu.id = 'aims-action-menu';
    menu.style.cssText = `
      position: absolute;
      bottom: 56px;
      right: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      z-index: 2147483647;
      min-width: 170px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    const createMenuItem = (label, icon, onClick) => {
      const item = document.createElement('button');
      item.style.cssText = `
        background: none;
        border: none;
        padding: 8px 12px;
        text-align: left;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1e293b;
        font-size: 12.5px;
        font-weight: 500;
        transition: background 0.15s;
      `;
      item.innerHTML = `<span>${icon}</span><span>${label}</span>`;
      item.onmouseover = () => item.style.background = '#f1f5f9';
      item.onmouseout = () => item.style.background = 'none';
      item.onclick = (e) => {
        e.stopPropagation();
        menu.remove();
        onClick();
      };
      return item;
    };

    // Copy prompt
    menu.appendChild(createMenuItem('Copy Prompt', '📋', () => {
      if (session.prompt) {
        navigator.clipboard.writeText(session.prompt);
        showToast('Prompt copied to clipboard!', false, 2000);
      }
    }));

    // Re-run injection
    menu.appendChild(createMenuItem('Re-inject Prompt', '🔄', () => {
      executeInjection(session);
    }));

    // Minimize bar
    menu.appendChild(createMenuItem('Minimize Bar', '➖', () => {
      const bar = document.querySelector('.aims-switch-bar');
      if (bar) bar.classList.toggle('minimized');
    }));

    document.getElementById('ai-multisearch-root').appendChild(menu);

    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  // Make the floating switcher draggable
  function makeDraggable(rootEl, handleEl) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialBottom = 0;

    handleEl.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = rootEl.getBoundingClientRect();
      initialLeft = rect.left;
      initialBottom = window.innerHeight - rect.bottom;

      rootEl.style.transform = 'none';
      rootEl.style.left = `${initialLeft}px`;
      rootEl.style.bottom = `${initialBottom}px`;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newLeft = Math.max(10, Math.min(window.innerWidth - 300, initialLeft + dx));
      const newBottom = Math.max(10, Math.min(window.innerHeight - 80, initialBottom - dy));

      rootEl.style.left = `${newLeft}px`;
      rootEl.style.bottom = `${newBottom}px`;
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }

  // Run on start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

