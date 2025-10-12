class SpecificationController {
  constructor() {
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.attachEventListeners();
    this.setupColorPreviews();
    this.setupSectionChangeListeners();
    this.setupFrostedOptions();
  }

  setupSectionChangeListeners() {
    // Sekcja 1: Dimensions
    this.watchSection(['width', 'width-select', 'height', 'height-select', 'measurement-type'], 'apply-dimensions');

    // Sekcja 2: Georgian Bars
    this.watchSection(['upper-bars', 'lower-bars', 'same-bars-both-sashes', 'upper-bar-position', 'lower-bar-position'], 'apply-bars');

    // Sekcja 3: Frame
    this.watchSection(['frame-type'], 'apply-frame');

    // Sekcja 4: Color
    this.watchSection(['color-type'], 'apply-color');
    // Dodatkowe obserwowanie dla color options
    this.watchColorSection();

    // Sekcja 5: Glass
    this.watchSection(['glass-type'], 'apply-glass');

    // Sekcja 6: Opening
    this.watchSection(['opening-type'], 'apply-opening');

    // Sekcja 7: PAS 24
    this.watchSection(['pas24'], 'apply-pas24');

    // Sekcja 8: Details
    this.watchSection(['horns', 'ironmongery'], 'apply-details');

    // Sekcja 9: Glass Spec
    this.watchSection(['glass-spec', 'glass-finish', 'frosted-location'], 'apply-glass-spec');
  }

  watchSection(fieldIds, buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    fieldIds.forEach(fieldId => {
      // Dla radio buttons i checkboxów
      const radios = document.getElementsByName(fieldId);
      if (radios.length > 0) {
        radios.forEach(radio => {
          radio.addEventListener('change', () => {
            button.classList.remove('applied');
          });
        });
      }

      // Dla pojedynczych elementów
      const element = document.getElementById(fieldId);
      if (element) {
        const eventType = element.type === 'checkbox' ? 'change' : 'input';
        element.addEventListener(eventType, () => {
          button.classList.remove('applied');
        });

        // Dla selectów dodaj też change
        if (element.tagName === 'SELECT') {
          element.addEventListener('change', () => {
            button.classList.remove('applied');
          });
        }
      }
    });
  }

  watchColorSection() {
    const button = document.getElementById('apply-color');
    if (!button) return;

    // Single color options
    const singleColorOptions = document.querySelectorAll('#single-color-selector .color-option');
    singleColorOptions.forEach(option => {
      option.addEventListener('click', () => {
        button.classList.remove('applied');
      });
    });

    // Dual color options
    const dualColorOptions = document.querySelectorAll('.interior-color, .exterior-color');
    dualColorOptions.forEach(option => {
      option.addEventListener('click', () => {
        button.classList.remove('applied');
      });
    });
  }

  attachEventListeners() {
    // Apply Dimensions
    const applyDimensionsBtn = document.getElementById('apply-dimensions');
    if (applyDimensionsBtn) {
      applyDimensionsBtn.addEventListener('click', () => this.applyDimensions());
    }

    // Apply Bars
    const applyBarsBtn = document.getElementById('apply-bars');
    if (applyBarsBtn) {
      applyBarsBtn.addEventListener('click', () => this.applyBars());
    }

    // Apply Frame
    const applyFrameBtn = document.getElementById('apply-frame');
    if (applyFrameBtn) {
      applyFrameBtn.addEventListener('click', () => this.applyFrame());
    }

    // Apply Color
    const applyColorBtn = document.getElementById('apply-color');
    if (applyColorBtn) {
      applyColorBtn.addEventListener('click', () => this.applyColor());
    }

    // Apply Glass
    const applyGlassBtn = document.getElementById('apply-glass');
    if (applyGlassBtn) {
      applyGlassBtn.addEventListener('click', () => this.applyGlass());
    }

    // Apply Opening
    const applyOpeningBtn = document.getElementById('apply-opening');
    if (applyOpeningBtn) {
      applyOpeningBtn.addEventListener('click', () => this.applyOpening());
    }

    // Apply PAS 24
    const applyPAS24Btn = document.getElementById('apply-pas24');
    if (applyPAS24Btn) {
      applyPAS24Btn.addEventListener('click', () => this.applyPAS24());
    }

    // Apply Details
    const applyDetailsBtn = document.getElementById('apply-details');
    if (applyDetailsBtn) {
      applyDetailsBtn.addEventListener('click', () => this.applyDetails());
    }

    // Apply Glass Spec
    const applyGlassSpecBtn = document.getElementById('apply-glass-spec');
    if (applyGlassSpecBtn) {
      applyGlassSpecBtn.addEventListener('click', () => this.applyGlassSpec());
    }

    // Frame type radios for warning box
    const frameRadios = document.querySelectorAll('input[name="frame-type"]');
    frameRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const warningBox = document.getElementById('slim-frame-warning');
        if (warningBox) {
          warningBox.style.display = e.target.value === 'slim' ? 'block' : 'none';
        }
      });
    });

    // Opening type radios - immediate update
    const openingRadios = document.querySelectorAll('input[name="opening-type"]');
    openingRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked && window.visualizationManager && window.visualizationManager.updateOpeningIndicators) {
          window.visualizationManager.updateOpeningIndicators(e.target.value);
        }
      });
    });

    const pas24InfoBtn = document.getElementById('pas24-info');
    if (pas24InfoBtn) {
      pas24InfoBtn.addEventListener('click', () => {
        alert('PAS 24 information page will be created soon.\n\nPAS 24 is the UK standard for enhanced security doors and windows.');
      });
    }
  }

  setupColorPreviews() {
    // Single color options
    const singleColorOptions = document.querySelectorAll('#single-color-selector .color-option');
    singleColorOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected from all
        singleColorOptions.forEach(opt => opt.classList.remove('selected'));
        // Add selected to clicked
        option.classList.add('selected');

        const name = option.dataset.name;
        const ral = option.dataset.ral;
        document.getElementById('single-preview-name').textContent = name;
        document.getElementById('single-preview-ral').textContent = ral;
      });
    });

    // Interior color options
    const interiorColorOptions = document.querySelectorAll('.interior-color');
    interiorColorOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected from all interior colors
        interiorColorOptions.forEach(opt => opt.classList.remove('selected'));
        // Add selected to clicked
        option.classList.add('selected');

        const name = option.dataset.name;
        const ral = option.dataset.ral;
        document.getElementById('dual-preview-interior').textContent = `${name} (${ral})`;
      });
    });

    // Exterior color options
    const exteriorColorOptions = document.querySelectorAll('.exterior-color');
    exteriorColorOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected from all exterior colors
        exteriorColorOptions.forEach(opt => opt.classList.remove('selected'));
        // Add selected to clicked
        option.classList.add('selected');

        const name = option.dataset.name;
        const ral = option.dataset.ral;
        document.getElementById('dual-preview-exterior').textContent = `${name} (${ral})`;
      });
    });

    // Color type radio buttons
    const colorTypeRadios = document.querySelectorAll('input[name="color-type"]');
    colorTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'single') {
          document.getElementById('single-color-selector').style.display = 'block';
          document.getElementById('dual-color-selector').style.display = 'none';
          document.getElementById('single-color-preview-info').style.display = 'block';
          document.getElementById('dual-color-preview-info').style.display = 'none';
        } else {
          document.getElementById('single-color-selector').style.display = 'none';
          document.getElementById('dual-color-selector').style.display = 'block';
          document.getElementById('single-color-preview-info').style.display = 'none';
          document.getElementById('dual-color-preview-info').style.display = 'block';
        }
      });
    });
  }

  setupFrostedOptions() {
    const frostedRadio = document.getElementById('frosted-glass');
    const clearRadio = document.getElementById('clear-glass');
    const frostedOptions = document.getElementById('frosted-options');

    if (frostedRadio && clearRadio && frostedOptions) {
      const toggleFrostedOptions = () => {
        frostedOptions.style.display = frostedRadio.checked ? 'block' : 'none';

        // Jeśli zmieniliśmy na clear, resetuj i zaktualizuj natychmiast
        if (clearRadio.checked && window.currentConfig) {
          window.currentConfig.glassFinish = 'clear';
          window.currentConfig.frostedLocation = 'bottom';

          if (window.visualizationManager) {
            window.visualizationManager.updateFrostedGlass(window.currentConfig);
          }
        }
        // Jeśli zmieniliśmy na frosted, ustaw i zaktualizuj natychmiast
        else if (frostedRadio.checked && window.currentConfig) {
          window.currentConfig.glassFinish = 'frosted';
          // Pobierz aktualnie wybraną lokalizację
          const frostedLocationElement = document.querySelector('input[name="frosted-location"]:checked');
          window.currentConfig.frostedLocation = frostedLocationElement ? frostedLocationElement.value : 'bottom';

          if (window.visualizationManager) {
            window.visualizationManager.updateFrostedGlass(window.currentConfig);
          }
        }
      };

      frostedRadio.addEventListener('change', toggleFrostedOptions);
      clearRadio.addEventListener('change', toggleFrostedOptions);

      // WAŻNE: Dodaj listener do frosted location radios dla natychmiastowej aktualizacji
      const frostedLocationRadios = document.querySelectorAll('input[name="frosted-location"]');
      frostedLocationRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          // Natychmiast zaktualizuj jeśli frosted jest wybrane
          if (frostedRadio.checked && window.currentConfig) {
            window.currentConfig.frostedLocation = e.target.value;
            window.currentConfig.glassFinish = 'frosted'; // upewnij się że frosted jest ustawione

            if (window.visualizationManager) {
              window.visualizationManager.updateFrostedGlass(window.currentConfig);
            }
          }
        });
      });

      // Sprawdź początkowy stan
      toggleFrostedOptions();
    }
  }

  applyDimensions() {
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const measurementType = document.querySelector('input[name="measurement-type"]:checked')?.value;

    // Calculate actual frame dimensions
    let frameWidth = width;
    let frameHeight = height;
    
    if (measurementType === 'brick-to-brick') {
      frameWidth = width + 150;
      frameHeight = height + 75;
    }

    // Update specification - ALWAYS show frame dimensions
    document.getElementById('spec-dimensions').style.display = 'block';
    document.getElementById('spec-width').textContent = `${frameWidth}mm`;
    document.getElementById('spec-height').textContent = `${frameHeight}mm`;
    document.getElementById('spec-measurement').textContent = measurementType === 'brick-to-brick' ? 'Structural Opening' : 'Frame Dimensions';

    // Remove old actual size element (nie potrzebujemy już dodatkowego)
    const oldActual = document.querySelector('.spec-item.actual-size');
    if (oldActual) oldActual.remove();

    // Update config with actual frame dimensions for price calculation
    if (window.currentConfig) {
      window.currentConfig.actualFrameWidth = frameWidth;
      window.currentConfig.actualFrameHeight = frameHeight;
      
      // Trigger price recalculation
      if (window.configuratorCore && window.configuratorCore.isInitialized) {
        window.configuratorCore.updateAll();
      }
    }

    // Show success feedback
    this.showAppliedFeedback('apply-dimensions');
  }

  applyBars() {
    const upperBars = document.getElementById('upper-bars').value;
    const lowerBars = document.getElementById('lower-bars').value;

    // Get bar names
    const barNames = {
      'none': 'No Bars',
      '2x2': '2x2 Pattern',
      '3x3': '3x3 Pattern',
      '4x4': '4x4 Pattern',
      '6x6': '6x6 Pattern',
      '9x9': '9x9 Pattern',
      '2-vertical': '2 Vertical Bars',
      '1-vertical': '1 Vertical Bar',
      'custom': 'Custom Design'
    };

    // Update specification
    document.getElementById('spec-bars').style.display = 'block';
    document.getElementById('spec-upper-bars').textContent = barNames[upperBars] || upperBars;
    document.getElementById('spec-lower-bars').textContent = barNames[lowerBars] || lowerBars;

    this.showAppliedFeedback('apply-bars');
  }

  applyFrame() {
    const frameType = document.querySelector('input[name="frame-type"]:checked')?.value;

    document.getElementById('spec-frame').style.display = 'block';
    document.getElementById('spec-frame-type').textContent = frameType === 'standard' ? 'Standard Frame (165mm)' : 'Slim Frame (145mm)';

    this.showAppliedFeedback('apply-frame');
  }

  applyColor() {
    const colorType = document.querySelector('input[name="color-type"]:checked')?.value;

    document.getElementById('spec-color').style.display = 'block';

    if (colorType === 'single') {
      const selectedColor = document.querySelector('#single-color-selector .color-option.selected');
      if (selectedColor) {
        const name = selectedColor.dataset.name;
        const ral = selectedColor.dataset.ral;

        document.getElementById('spec-single-color').style.display = 'block';
        document.getElementById('spec-dual-color').style.display = 'none';
        document.getElementById('spec-color-name').textContent = name;
        document.getElementById('spec-color-ral').textContent = ral;
      }
    } else {
      // Dual color
      const selectedInterior = document.querySelector('.interior-color.selected');
      const selectedExterior = document.querySelector('.exterior-color.selected');

      if (selectedInterior && selectedExterior) {
        const intName = selectedInterior.dataset.name;
        const intRal = selectedInterior.dataset.ral;
        const extName = selectedExterior.dataset.name;
        const extRal = selectedExterior.dataset.ral;

        document.getElementById('spec-single-color').style.display = 'none';
        document.getElementById('spec-dual-color').style.display = 'block';
        document.getElementById('spec-interior-color').textContent = `${intName} (${intRal})`;
        document.getElementById('spec-exterior-color').textContent = `${extName} (${extRal})`;
      }
    }

    this.showAppliedFeedback('apply-color');
  }

  applyGlass() {
    const glassType = document.querySelector('input[name="glass-type"]:checked')?.value;

    const glassNames = {
      'double': 'Double Glazing (U-value: 1.1)',
      'triple': 'Triple Glazing (U-value: 0.7)',
      'passive': 'Passive Glass (U-value: 0.5)'
    };

    document.getElementById('spec-glass').style.display = 'block';
    document.getElementById('spec-glass-type').textContent = glassNames[glassType] || glassType;

    this.showAppliedFeedback('apply-glass');
  }

  applyOpening() {
    const openingType = document.querySelector('input[name="opening-type"]:checked')?.value;

    const openingNames = {
      'both': 'Both Sashes Open',
      'bottom': 'Bottom Sash Only',
      'fixed': 'Fixed Only (Non-opening)'
    };

    document.getElementById('spec-opening').style.display = 'block';
    document.getElementById('spec-opening-type').textContent = openingNames[openingType] || openingType;

    // Update opening indicators
    this.updateOpeningIndicators(openingType);

    this.showAppliedFeedback('apply-opening');
  }

  updateOpeningIndicators(openingType) {
    // This will be handled by visualization-manager.js
    if (window.visualizationManager && window.visualizationManager.updateOpeningIndicators) {
      window.visualizationManager.updateOpeningIndicators(openingType);
    }
  }

  applyPAS24() {
    const pas24 = document.querySelector('input[name="pas24"]:checked')?.value;

    document.getElementById('spec-pas24').style.display = 'block';
    document.getElementById('spec-pas24-value').textContent = pas24 === 'yes' ? 'Yes - PAS 24 Compliant' : 'No - Standard Security';

    this.showAppliedFeedback('apply-pas24');
  }

  applyDetails() {
    const hornsEl = document.getElementById('horns');
    const ironmongeryEl = document.getElementById('ironmongery');
    
    if (!hornsEl || !ironmongeryEl) {
      console.warn('Details elements not found');
      return;
    }
    
    const horns = hornsEl.value;
    const ironmongery = ironmongeryEl.value;

    document.getElementById('spec-details').style.display = 'block';

    // Horns
    if (horns && horns !== 'none') {
      document.getElementById('spec-horns-item').style.display = 'flex';
      document.getElementById('spec-horns').textContent = this.formatName(horns) + ' Horns';
    } else {
      document.getElementById('spec-horns-item').style.display = 'none';
    }

    // Ironmongery
    if (ironmongery && ironmongery !== 'none') {
      document.getElementById('spec-ironmongery-item').style.display = 'flex';
      document.getElementById('spec-ironmongery').textContent = this.formatName(ironmongery) + ' Ironmongery';
    } else {
      document.getElementById('spec-ironmongery-item').style.display = 'none';
    }

    // Hide section if both are none
    if ((!horns || horns === 'none') && (!ironmongery || ironmongery === 'none')) {
      document.getElementById('spec-details').style.display = 'none';
    }

    this.showAppliedFeedback('apply-details');
  }

  applyGlassSpec() {
    const glassSpec = document.querySelector('input[name="glass-spec"]:checked')?.value;
    const glassFinish = document.querySelector('input[name="glass-finish"]:checked')?.value;

    // Pobierz frosted location tylko gdy frosted jest wybrane
    let frostedLocation = 'bottom'; // domyślnie bottom
    if (glassFinish === 'frosted') {
      const frostedLocationElement = document.querySelector('input[name="frosted-location"]:checked');
      if (frostedLocationElement) {
        frostedLocation = frostedLocationElement.value;
      }
    }

    document.getElementById('spec-glass-spec').style.display = 'block';
    document.getElementById('spec-glass-spec-type').textContent = glassSpec === 'toughened' ? 'Toughened' : 'Laminated';

    // Update glass finish display
    let finishText = glassFinish === 'clear' ? 'Clear' : 'Frosted';
    if (glassFinish === 'frosted' && frostedLocation === 'both') {
      finishText = 'Frosted (Both Sashes)';
    } else if (glassFinish === 'frosted') {
      finishText = 'Frosted (Bottom Only)';
    }
    document.getElementById('spec-glass-finish').textContent = finishText;

    // Update configuration
    if (window.currentConfig) {
      window.currentConfig.glassSpec = glassSpec;
      window.currentConfig.glassFinish = glassFinish;
      window.currentConfig.frostedLocation = frostedLocation;

      // Wymuś natychmiastową aktualizację frosted glass
      if (window.visualizationManager) {
        window.visualizationManager.updateFrostedGlass(window.currentConfig);
      }

      // Wymuś pełną aktualizację konfiguratora
      if (window.configuratorCore && window.configuratorCore.isInitialized) {
        window.configuratorCore.updateAll();
      }
    }

    this.showAppliedFeedback('apply-glass-spec');
  }

  formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  showAppliedFeedback(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const originalText = button.textContent;
    button.textContent = '✓ Applied';
    button.classList.add('applied');

    // NIE USUWAMY klasy applied - zostaje aż użytkownik coś zmieni
    // setTimeout został usunięty
  }
}

// Initialize
window.specificationController = new SpecificationController();