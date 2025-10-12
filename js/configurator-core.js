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
      { id: 'apply-dimensions', handler: () => this.applySection('dimensions') },
      { id: 'apply-bars', handler: () => this.applySection('bars') },
      { id: 'apply-frame', handler: () => this.applySection('frame') },
      { id: 'apply-color', handler: () => this.applySection('color') },
      { id: 'apply-glass', handler: () => this.applySection('glass') },
      { id: 'apply-opening', handler: () => this.applySection('opening') },
      { id: 'apply-pas24', handler: () => this.applySection('pas24') },
      { id: 'apply-details', handler: () => this.applySection('details') },
      { id: 'apply-glass-spec', handler: () => this.applySection('glassSpec') }
    ];
    
    applyButtons.forEach(({ id, handler }) => {
      UIHelpers.onClick(`#${id}`, handler);
    });
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