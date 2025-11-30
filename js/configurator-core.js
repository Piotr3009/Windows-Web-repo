// configurator-core-optimized.js - Zoptymalizowany główny kontroler
class ConfiguratorCore {
  constructor() {
    this.state = window.AppState;
    this.modules = {};
    this.isInitialized = false;
  }

  async init() {
    console.log('ConfiguratorCore: Initializing...');
    
    try {
      this.checkDependencies();
      await this.initializeModules();
      this.attachEventHandlers();
      this.loadSavedConfiguration();
      this.updateAll();
      this.isInitialized = true;
      
      // Auto-save przy zamykaniu strony
      window.addEventListener('beforeunload', () => {
        const config = this.state.get();
        this.modules.storage.saveLastConfig(config);
        console.log('💾 Saved configuration before page unload');
      });
      
      console.log('ConfiguratorCore: Ready');
    } catch (error) {
      console.error('ConfiguratorCore: Init failed', error);
      alert('Failed to initialize. Please refresh the page.');
    }
  }

  checkDependencies() {
    const required = ['config', 'priceCalculator', 'storageManager', 'UIHelpers', 'AppState'];
    const missing = required.filter(m => !window[m]);
    if (missing.length) throw new Error(`Missing: ${missing.join(', ')}`);
  }

  async initializeModules() {
    // Inicjalizuj moduły
    this.modules = {
      form: window.formHandler,
      visual: window.visualizationManager,
      bars: window.barsController,
      details: window.detailsController,
      spec: window.specificationController,
      dimension: window.dimensionHandler,
      storage: window.storageManager,
      price: window.priceCalculator
    };
    
    // Inicjalizuj form handler
    if (this.modules.form) {
      this.modules.form.init(this.state.get());
    }
    
    // Inicjalizuj wizualizację
    if (this.modules.visual) {
      this.modules.visual.init();
    }
    
    // Eksportuj dla kompatybilności
    window.currentConfig = this.state.config;
    
    // Subskrybuj zmiany
    this.state.subscribe(() => {
      window.currentConfig = this.state.config;
    });
  }

  attachEventHandlers() {
    const handlers = {
      // Dimensions
      'dimensionChange': (data) => {
        this.state.update(data.dimension, data.value);
        this.updateAll();
      },
      
      // Radio changes
      'radioChange': (data) => {
        const fieldMap = {
          'measurement-type': 'measurementType',
          'frame-type': 'frameType',
          'color-type': 'colorType',
          'glass-type': 'glassType',
          'opening-type': 'openingType',
          'glass-spec': 'glassSpec',
          'glass-finish': 'glassFinish',
          'pas24': 'pas24'
        };
        
        const field = fieldMap[data.name] || data.name;
        this.state.update(field, data.value);
        this.updateAll();
      },
      
      // Colors
      'singleColorSelect': (data) => {
        this.state.update({
          singleColor: data.color,
          color: data.color
        });
        this.updateAll();
      },
      
      'dualColorSelect': (data) => {
        this.state.update({
          interiorColor: data.interior,
          exteriorColor: data.exterior
        });
        this.updateAll();
      },
      
      'customExteriorColor': (data) => {
        this.state.update('exteriorColor', data.color);
        this.updateAll();
      },
      
      // Selects
      'selectChange': (data) => {
        this.state.update(data.name, data.value);
        this.updateAll();
      },
      
      // Quantity
      'quantityChange': (value) => {
        this.state.update('quantity', value);
        this.updateAll();
      },
      
      // Actions
      'addToEstimate': () => this.addToEstimate(),
      'saveConfiguration': () => this.saveConfiguration(),
      'saveVariant': () => this.saveAsVariant()
    };
    
    // Attach all handlers
    if (this.modules.form) {
      Object.entries(handlers).forEach(([event, handler]) => {
        this.modules.form.on(event, handler);
      });
    }
    
    // Apply buttons handlers
    this.attachApplyButtons();
  }

  attachApplyButtons() {
    const applyButtons = [
      { id: 'apply-dimensions', handler: () => this.applySection('dimensions'), order: 1 },
      { id: 'apply-bars', handler: () => this.applySection('bars'), order: 2 },
      { id: 'apply-frame', handler: () => this.applySection('frame'), order: 3 },
      { id: 'apply-color', handler: () => this.applySection('color'), order: 4 },
      { id: 'apply-glass', handler: () => this.applySection('glass'), order: 5 },
      { id: 'apply-opening', handler: () => this.applySection('opening'), order: 6 },
      { id: 'apply-pas24', handler: () => this.applySection('pas24'), order: 7 },
      { id: 'apply-details', handler: () => this.applySection('details'), order: 8 },
      { id: 'apply-glass-spec', handler: () => this.applySection('glassSpec'), order: 9 }
    ];
    
    // Zapamiętaj listę buttonów
    this.applyButtonsOrder = applyButtons;
    
    // Pobierz zapisany stan z localStorage
    this.appliedSections = JSON.parse(localStorage.getItem('byow_applied_sections') || '{}');
    
    // Załaduj zapisaną konfigurację
    this.loadSavedConfiguration();
    
    applyButtons.forEach(({ id, handler, order }) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      
      btn.addEventListener('click', (e) => {
        // Sprawdź czy button jest zablokowany
        if (btn.classList.contains('btn-locked')) {
          e.preventDefault();
          e.stopPropagation();
          this.showLockedMessage();
          return;
        }
        
        handler();
        // Zapisz że ta sekcja została zatwierdzona
        this.appliedSections[id] = true;
        localStorage.setItem('byow_applied_sections', JSON.stringify(this.appliedSections));
        
        // Zapisz całą konfigurację okna
        this.saveConfiguration();
        
        // Odblokuj następny button
        this.updateApplyButtonsState();
      });
    });
    
    // Ustaw początkowy stan buttonów
    this.updateApplyButtonsState();
  }
  
  showLockedMessage() {
    // Usuń poprzedni komunikat jeśli istnieje
    const existing = document.querySelector('.locked-message');
    if (existing) existing.remove();
    
    // Pokaż komunikat
    const msg = document.createElement('div');
    msg.className = 'locked-message';
    msg.innerHTML = '⚠️ Please confirm previous selection first';
    msg.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #fff3cd;
      color: #856404;
      border: 2px solid #ffc107;
      padding: 12px 25px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transition = 'opacity 0.3s';
      setTimeout(() => msg.remove(), 300);
    }, 2500);
  }
  
  saveConfiguration() {
    // Zapisz całą konfigurację do localStorage
    const config = window.currentConfig || this.state?.get() || {};
    localStorage.setItem('byow_saved_config', JSON.stringify(config));
  }
  
  loadSavedConfiguration() {
    // Wczytaj zapisaną konfigurację
    const savedConfig = localStorage.getItem('byow_saved_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (window.currentConfig) {
          Object.assign(window.currentConfig, config);
        }
        console.log('📂 Configuration loaded from localStorage:', config);
        
        // Odtwórz wartości w formularzu
        this.restoreFormValues(config);
      } catch (e) {
        console.error('Error loading saved config:', e);
      }
    }
  }
  
  restoreFormValues(config) {
    // Wymiary
    if (config.width) {
      const widthSelect = document.getElementById('width-select');
      if (widthSelect) widthSelect.value = config.width;
    }
    if (config.height) {
      const heightSelect = document.getElementById('height-select');
      if (heightSelect) heightSelect.value = config.height;
    }
    
    // Measurement type
    if (config.measurementType) {
      const radio = document.getElementById(config.measurementType);
      if (radio) radio.checked = true;
    }
    
    // Bars
    if (config.upperBars) {
      const upperBars = document.getElementById('upper-bars');
      if (upperBars) upperBars.value = config.upperBars;
    }
    if (config.lowerBars) {
      const lowerBars = document.getElementById('lower-bars');
      if (lowerBars) lowerBars.value = config.lowerBars;
    }
    
    // Frame type
    if (config.frameType) {
      const radio = document.querySelector(`input[name="frame-type"][value="${config.frameType}"]`);
      if (radio) radio.checked = true;
    }
    
    // Glass type
    if (config.glassType) {
      const radio = document.querySelector(`input[name="glass-type"][value="${config.glassType}"]`);
      if (radio) radio.checked = true;
    }
    
    // Color type
    if (config.colorType) {
      const radio = document.querySelector(`input[name="color-type"][value="${config.colorType}"]`);
      if (radio) radio.checked = true;
    }
    
    // Opening type
    if (config.openingType) {
      const radio = document.querySelector(`input[name="opening-type"][value="${config.openingType}"]`);
      if (radio) radio.checked = true;
    }
    
    // PAS24
    if (config.pas24) {
      const radio = document.querySelector(`input[name="pas24"][value="${config.pas24}"]`);
      if (radio) radio.checked = true;
    }
    
    // Glass spec
    if (config.glassSpec) {
      const radio = document.querySelector(`input[name="glass-spec"][value="${config.glassSpec}"]`);
      if (radio) radio.checked = true;
    }
    
    // Glass finish
    if (config.glassFinish) {
      const radio = document.querySelector(`input[name="glass-finish"][value="${config.glassFinish}"]`);
      if (radio) radio.checked = true;
    }
    
    // Quantity
    if (config.quantity) {
      const qtyInput = document.getElementById('quantity');
      if (qtyInput) qtyInput.value = config.quantity;
    }
    
    // Ironmongery - przywróć z config
    if (config.ironmongery) {
      window.currentConfig.ironmongery = config.ironmongery;
    }
    
    console.log('📋 Form values restored');
  }
  
  updateApplyButtonsState() {
    this.applyButtonsOrder.forEach(({ id, order }) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      
      // Pierwszy button zawsze odblokowany
      if (order === 1) {
        btn.classList.remove('btn-locked');
        return;
      }
      
      // Sprawdź czy poprzedni jest zatwierdzony
      const prevButton = this.applyButtonsOrder.find(b => b.order === order - 1);
      if (prevButton && this.appliedSections[prevButton.id]) {
        btn.classList.remove('btn-locked');
      } else {
        btn.classList.add('btn-locked');
      }
    });
  }
  
  // Reset sekwencji (np. przy nowej konfiguracji)
  resetApplySequence() {
    this.appliedSections = {};
    localStorage.removeItem('byow_applied_sections');
    localStorage.removeItem('byow_saved_config');
    this.updateApplyButtonsState();
  }

  applySection(section) {
    // Delegate to specification controller
    if (this.modules.spec) {
      switch(section) {
        case 'dimensions': this.modules.spec.applyDimensions(); break;
        case 'bars': this.modules.spec.applyBars(); break;
        case 'frame': this.modules.spec.applyFrame(); break;
        case 'color': this.modules.spec.applyColor(); break;
        case 'glass': this.modules.spec.applyGlass(); break;
        case 'opening': this.modules.spec.applyOpening(); break;
        case 'pas24': this.modules.spec.applyPAS24(); break;
        case 'details': this.modules.spec.applyDetails(); break;
        case 'glassSpec': this.modules.spec.applyGlassSpec(); break;
      }
    }
    
    // Save po Apply
    if (this.modules.storage) {
      const config = this.state.get();
      this.modules.storage.saveLastConfig(config);
      console.log('💾 Saved after Apply:', section);
    }
  }

  updateAll() {
    if (!this.isInitialized) return;
    
    const config = this.state.get();
    
    // Calculate price
    const priceData = this.modules.price.calculate(config);
    
    // Update visualization
    if (this.modules.visual) {
      this.modules.visual.update(config);
      this.modules.visual.updatePrice(priceData.unitPrice, priceData.totalPrice);
    }
    
    // AUTO-SAVE - zapisz do localStorage przy każdej zmianie
    if (this.modules.storage) {
      this.modules.storage.saveLastConfig(config);
      console.log('🔄 Auto-saved configuration');
    }
    
    // Update bars if needed
    if (this.modules.bars) {
      const barsState = this.modules.bars.getState();
      if (barsState.upper.pattern !== config.upperBars || 
          barsState.lower.pattern !== config.lowerBars) {
        // Sync if needed
      }
    }
  }

  loadSavedConfiguration() {
    const urlParams = new URLSearchParams(window.location.search);
    const loadLast = urlParams.get('loadLast');
    
    let savedConfig = loadLast === 'true' 
      ? this.modules.storage.loadLastConfig()
      : this.modules.storage.loadConfig();
    
    if (savedConfig) {
      this.loadConfiguration(savedConfig);
    }
  }

  loadConfiguration(config) {
    this.state.update(config);
    
    if (this.modules.form) {
      this.modules.form.loadConfiguration(config);
    }
    
    if (config.customBars && this.modules.bars) {
      this.modules.bars.setState({
        upper: {
          pattern: config.upperBars || 'none',
          bars: config.customBars.upper || { horizontal: [], vertical: [] }
        },
        lower: {
          pattern: config.lowerBars || 'none',
          bars: config.customBars.lower || { horizontal: [], vertical: [] }
        }
      });
    }
    
    this.updateAll();
  }

  addToEstimate() {
    const validation = this.modules.form.validate();
    if (!validation.isValid) {
      alert('Please complete:\n' + validation.errors.join('\n'));
      return;
    }
    
    const config = this.state.get();
    const priceData = this.modules.price.calculate(config);
    
    const estimate = this.modules.storage.addToEstimates(config, priceData.unitPrice);
    
    if (estimate) {
      this.modules.storage.saveLastConfig(config);
      const count = this.modules.storage.getEstimates().length;
      alert(`${config.quantity} window(s) added!\nTotal in estimate: ${count}`);
    }
  }

  saveConfiguration() {
    const saved = this.modules.storage.saveConfig(this.state.get());
    alert(saved ? 'Configuration saved!' : 'Save failed. Try again.');
  }

  saveAsVariant() {
    const name = prompt('Enter variant name:');
    if (!name) return;
    
    const config = this.state.get();
    const priceData = this.modules.price.calculate(config);
    
    const variant = this.modules.storage.saveVariant(config, name, priceData.unitPrice);
    
    if (variant) {
      const count = this.modules.storage.getVariants().length;
      alert(`Variant "${name}" saved.\n${count} of ${this.modules.storage.maxVariants} variants used.`);
    }
  }

  reset() {
    if (!confirm('Reset all settings?')) return;
    
    this.state.reset();
    
    if (this.modules.form) this.modules.form.reset();
    if (this.modules.visual) this.modules.visual.reset();
    
    if (this.modules.bars) {
      this.modules.bars.setState({
        upper: { pattern: 'none', bars: { horizontal: [], vertical: [] } },
        lower: { pattern: 'none', bars: { horizontal: [], vertical: [] } }
      });
    }
    
    this.updateAll();
    alert('Reset complete.');
  }

  exportConfiguration() {
    const data = {
      configuration: this.state.get(),
      price: this.modules.price.calculate(this.state.get()),
      exportDate: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `skylon-config-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  importConfiguration(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.configuration) {
          this.loadConfiguration(data.configuration);
          alert('Import successful!');
        }
      } catch (error) {
        alert('Import failed: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  }
}

// Initialize on DOM ready
ready(() => {
  window.configuratorCore = new ConfiguratorCore();
  window.configuratorCore.init();
  
  // Export for backward compatibility
  window.updatePrice = () => {
    if (window.configuratorCore?.isInitialized) {
      window.configuratorCore.updateAll();
    }
  };
  
  window.updateVisualDetails = () => {
    if (window.visualizationManager) {
      window.visualizationManager.updateVisualDetails(window.currentConfig);
    }
  };
  
  window.loadConfiguration = (config) => {
    if (window.configuratorCore?.isInitialized) {
      window.configuratorCore.loadConfiguration(config);
    }
  };
});