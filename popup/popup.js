// AI MultiSearch - Popup Logic
(async () => {
  // Safe storage wrapper for extension & standalone demo fallback
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

  const promptInput = document.getElementById('prompt-input');
  const fileUpload = document.getElementById('file-upload');
  const chipsContainer = document.getElementById('chips-container');
  const platformGrid = document.getElementById('platform-grid');
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  const searchBtn = document.getElementById('search-btn');
  const searchBtnText = document.getElementById('search-btn-text');
  const settingsBtn = document.getElementById('settings-btn');
  const dropZone = document.getElementById('drop-zone');

  // State
  let attachedFiles = [];
  let selectedPlatforms = new Set();

  // Load saved platform selections or defaults
  const savedConfig = await storage.get(['selectedPlatforms', 'lastPrompt']);
  
  if (savedConfig.selectedPlatforms && Array.isArray(savedConfig.selectedPlatforms)) {
    selectedPlatforms = new Set(savedConfig.selectedPlatforms);
  } else {
    // Default platforms from config
    for (const [key, p] of Object.entries(PLATFORMS)) {
      if (p.defaultEnabled) selectedPlatforms.add(key);
    }
  }

  // Render Platform Grid
  function renderPlatformGrid() {
    platformGrid.innerHTML = '';
    const platformKeys = Object.keys(PLATFORMS);

    platformKeys.forEach(key => {
      const p = PLATFORMS[key];
      const isChecked = selectedPlatforms.has(key);
      const iconSvg = PLATFORM_ICONS[key] || PLATFORM_ICONS.layers;

      const card = document.createElement('label');
      card.className = 'platform-card';
      card.dataset.id = key;

      card.innerHTML = `
        <input type="checkbox" value="${key}" ${isChecked ? 'checked' : ''}>
        <div class="card-content">
          <span class="card-checkbox"></span>
          <div class="platform-icon">${iconSvg}</div>
          <span class="platform-name">${p.name}</span>
        </div>
      `;

      const checkbox = card.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedPlatforms.add(key);
        } else {
          selectedPlatforms.delete(key);
        }
        updateSelectAllState();
        updateSearchButton();
        savePlatformSelections();
      });

      platformGrid.appendChild(card);
    });

    updateSelectAllState();
    updateSearchButton();
  }

  // Save selections to storage
  function savePlatformSelections() {
    storage.set({ selectedPlatforms: Array.from(selectedPlatforms) });
  }

  // Update "Select All" toggle checkbox
  function updateSelectAllState() {
    const totalPlatforms = Object.keys(PLATFORMS).length;
    const isAllChecked = selectedPlatforms.size === totalPlatforms;
    selectAllCheckbox.checked = isAllChecked;
  }

  // Handle Select All click
  selectAllCheckbox.addEventListener('change', (e) => {
    const shouldCheck = e.target.checked;
    const allKeys = Object.keys(PLATFORMS);
    
    if (shouldCheck) {
      allKeys.forEach(k => selectedPlatforms.add(k));
    } else {
      selectedPlatforms.clear();
    }

    // Update checkboxes in DOM
    platformGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = shouldCheck;
    });

    updateSearchButton();
    savePlatformSelections();
  });

  // Update primary button text & state
  function updateSearchButton() {
    const count = selectedPlatforms.size;
    if (count === 0) {
      searchBtn.disabled = true;
      searchBtnText.textContent = 'Select at least 1 AI';
    } else {
      searchBtn.disabled = false;
      searchBtnText.textContent = `Search in Selected AIs (${count})`;
    }
  }

  // Attachment handling
  fileUpload.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
    fileUpload.value = ''; // Reset
  });

  // Drag and drop onto prompt card
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  // Process files to Base64 data URLs
  async function handleFiles(files) {
    for (const file of files) {
      if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        attachedFiles.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: reader.result
        });
        renderFileChips();
      };
      reader.readAsDataURL(file);
    }
  }

  // Render attachment chips
  function renderFileChips() {
    chipsContainer.innerHTML = '';

    attachedFiles.forEach((file, index) => {
      const chip = document.createElement('div');
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
      const isImage = file.type.startsWith('image/');
      
      chip.className = `file-chip ${isPdf ? 'pdf' : isImage ? 'image' : ''}`;

      let iconHtml = '📄';
      if (isPdf) iconHtml = '📕';
      else if (isImage) iconHtml = '🖼️';

      chip.innerHTML = `
        <span class="chip-icon">${iconHtml}</span>
        <span class="chip-name" title="${file.name}">${file.name}</span>
        <button class="chip-remove" title="Remove file" data-index="${index}">×</button>
      `;

      chip.querySelector('.chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        attachedFiles.splice(index, 1);
        renderFileChips();
      });

      chipsContainer.appendChild(chip);
    });
  }

  // Execute Search
  async function executeSearch() {
    const prompt = promptInput.value.trim();
    if (!prompt && attachedFiles.length === 0) {
      promptInput.focus();
      promptInput.placeholder = 'Please enter a prompt or attach a file first!';
      return;
    }

    if (selectedPlatforms.size === 0) {
      return;
    }

    // Disable button & show spinner
    searchBtn.disabled = true;
    searchBtnText.textContent = 'Launching Tabs...';

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'startMultiSearch',
        data: {
          prompt: prompt,
          files: attachedFiles,
          platforms: Array.from(selectedPlatforms)
        }
      }, (response) => {
        if (response && response.success) {
          window.close();
        } else {
          searchBtn.disabled = false;
          searchBtnText.textContent = `Search in Selected AIs (${selectedPlatforms.size})`;
        }
      });
    } else {
      // Demo environment simulation
      setTimeout(() => {
        alert(`[Demo Mode] MultiSearch triggered with ${selectedPlatforms.size} platforms:\n- Prompt: "${prompt}"\n- Files: ${attachedFiles.length}`);
        searchBtn.disabled = false;
        searchBtnText.textContent = `Search in Selected AIs (${selectedPlatforms.size})`;
      }, 600);
    }
  }

  // Search button click
  searchBtn.addEventListener('click', executeSearch);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to search
  promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  });

  // Settings button click
  settingsBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/options.html', '_blank');
    }
  });

  // Initialize
  renderPlatformGrid();
})();
