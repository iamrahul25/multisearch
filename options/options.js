// AI MultiSearch - Options Page Logic
(async () => {
  const storage = {
    get: async (keys) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise(resolve => chrome.storage.local.get(keys, resolve));
      }
      const res = {};
      keys.forEach(k => {
        try { res[k] = JSON.parse(localStorage.getItem(k)); } catch(e) {}
      });
      return res;
    },
    set: async (obj) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise(resolve => chrome.storage.local.set(obj, resolve));
      }
      Object.keys(obj).forEach(k => {
        try { localStorage.setItem(k, JSON.stringify(obj[k])); } catch(e) {}
      });
    }
  };

  const autoSubmitToggle = document.getElementById('auto-submit');
  const submitDelaySelect = document.getElementById('submit-delay');
  const defaultsGrid = document.getElementById('defaults-grid');
  const saveStatus = document.getElementById('save-status');

  // Load saved settings
  const settings = await storage.get([
    'autoSubmit',
    'submitDelay',
    'selectedPlatforms'
  ]);

  autoSubmitToggle.checked = settings.autoSubmit !== false;
  if (settings.submitDelay) {
    submitDelaySelect.value = settings.submitDelay;
  }

  const savedPlatforms = new Set(
    settings.selectedPlatforms ||
    Object.keys(PLATFORMS).filter(k => PLATFORMS[k].defaultEnabled)
  );

  // Render Platform Grid
  Object.keys(PLATFORMS).forEach(key => {
    const p = PLATFORMS[key];
    const isChecked = savedPlatforms.has(key);
    const iconSvg = PLATFORM_ICONS[key] || PLATFORM_ICONS.layers;

    const card = document.createElement('label');
    card.className = `default-card ${isChecked ? 'checked' : ''}`;
    card.innerHTML = `
      <input type="checkbox" value="${key}" ${isChecked ? 'checked' : ''}>
      <span class="platform-icon">${iconSvg}</span>
      <span class="default-name">${p.name}</span>
    `;

    const checkbox = card.querySelector('input');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        savedPlatforms.add(key);
        card.classList.add('checked');
      } else {
        savedPlatforms.delete(key);
        card.classList.remove('checked');
      }
      saveSettings();
    });

    defaultsGrid.appendChild(card);
  });

  // Event Listeners
  autoSubmitToggle.addEventListener('change', saveSettings);
  submitDelaySelect.addEventListener('change', saveSettings);

  async function saveSettings() {
    await storage.set({
      autoSubmit: autoSubmitToggle.checked,
      submitDelay: parseInt(submitDelaySelect.value, 10),
      selectedPlatforms: Array.from(savedPlatforms)
    });

    saveStatus.textContent = 'Changes saved!';
    saveStatus.style.opacity = '1';
    setTimeout(() => {
      saveStatus.textContent = 'Settings saved automatically';
    }, 2000);
  }
})();
