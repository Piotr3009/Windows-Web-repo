// Ironmongery Controller
const IronmongeryController = {
  selectedFinish: null,
  selectedProducts: {},
  selectedStopperType: null, // 'stopper' lub 'weekes' - tylko jeden
  hasPAS24: false,
  windowWidth: 800,
  hasBars: false, // Czy okno ma Georgian bars

  init: function() {
    console.log('Ironmongery Controller initialized');
    this.bindEvents();
    this.initAccordion();
    this.loadConfiguration();
  },

  bindEvents: function() {
    // Dropdown wyboru koloru
    const finishSelect = document.getElementById('furniture-finish');
    if (finishSelect) {
      finishSelect.addEventListener('change', (e) => {
        console.log('Finish changed to:', e.target.value);
        this.onFinishChange(e.target.value);
      });
    }

    // Nasłuchuj zmian w konfiguracji okna
    this.listenToWindowConfig();
  },

  initAccordion: function() {
    // Obsługa klikania na nagłówki kategorii
    const headers = document.querySelectorAll('.category-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const toggle = header.querySelector('.category-toggle');
        
        // Toggle open/close
        if (content.classList.contains('open')) {
          content.classList.remove('open');
          toggle.classList.remove('open');
        } else {
          content.classList.add('open');
          toggle.classList.add('open');
        }
      });
    });
  },

  onFinishChange: function(finishId) {
    this.selectedFinish = finishId;
    
    const clientSupplyMsg = document.getElementById('client-supply-message');
    const productsContainer = document.getElementById('ironmongery-products');

    if (finishId === 'client-supply') {
      // Pokaż komunikat, ukryj produkty
      clientSupplyMsg.style.display = 'block';
      productsContainer.style.display = 'none';
      console.log('Client supply selected');
    } else if (finishId === '') {
      // Nic nie wybrano
      clientSupplyMsg.style.display = 'none';
      productsContainer.style.display = 'none';
      console.log('No finish selected');
    } else {
      // Normalny kolor - pokaż produkty
      clientSupplyMsg.style.display = 'none';
      productsContainer.style.display = 'block';
      console.log('Rendering products for color:', finishId);
      this.renderProducts(finishId);
    }
  },

  renderProducts: function(colorId) {
    console.log('Rendering all products for color:', colorId);
    
    // WAŻNE: Przeładuj produkty z localStorage przed renderowaniem
    IronmongeryHelper.loadProductsFromStorage();
    
    // Zamknij wszystkie accordion przed przeładowaniem
    this.closeAllAccordions();
    
    // Renderuj każdą kategorię
    this.renderCategory('fingerLifts', colorId);
    this.renderCategory('locks', colorId);
    this.renderCategory('pullHandles', colorId);
    this.renderCategory('stoppers', colorId);
  },

  closeAllAccordions: function() {
    const contents = document.querySelectorAll('.category-content');
    const toggles = document.querySelectorAll('.category-toggle');
    
    contents.forEach(content => content.classList.remove('open'));
    toggles.forEach(toggle => toggle.classList.remove('open'));
  },

  renderCategory: function(categoryKey, colorId) {
    const container = document.getElementById(`${categoryKey}-list`);
    if (!container) {
      console.warn('Container not found:', categoryKey);
      return;
    }

    const category = IRONMONGERY_DATA.categories[categoryKey];
    if (!category) {
      console.warn('Category not found:', categoryKey);
      return;
    }

    // Filtruj produkty po kolorze
    const products = category.products.filter(p => p.color === colorId);
    console.log(`Rendering ${products.length} products for ${categoryKey}`);
    
    container.innerHTML = '';

    products.forEach(product => {
      const productEl = this.createProductElement(product, category, categoryKey);
      container.appendChild(productEl);
    });
  },

  createProductElement: function(product, category, categoryKey) {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.dataset.productId = product.id;

    // Sprawdź czy produkt jest dostępny
    let canSelect = true;
    let disabledReason = '';

    // Logika PAS24 dla locks
    if (categoryKey === 'locks') {
      canSelect = IronmongeryHelper.canSelectWithPAS24(product, this.hasPAS24);
      if (!canSelect) {
        disabledReason = 'PAS24 certified lock required';
      }
      
      // Sprawdź czy już wybrano lock
      const selectedLock = Object.values(this.selectedProducts).find(item => item.category === 'locks');
      if (selectedLock && selectedLock.product.id !== product.id) {
        canSelect = false;
        disabledReason = `Already selected ${selectedLock.product.name}`;
      }
    }

    // Logika exclusive dla stoppers
    if (categoryKey === 'stoppers' && this.selectedStopperType) {
      if (product.type !== this.selectedStopperType) {
        canSelect = false;
        disabledReason = `Already selected ${this.selectedStopperType === 'stopper' ? 'Window Stopper' : 'Weekes Stop'}`;
      }
    }

    if (!canSelect) {
      div.classList.add('disabled');
      div.title = disabledReason;
    }

    if (product.isPAS24) {
      div.classList.add('pas24-only');
    }

    // Obrazek
    const img = document.createElement('img');
    img.className = 'product-image';
    img.src = product.image || 'img/placeholder.png';
    img.alt = product.name;
    img.style.cursor = 'pointer';
    img.title = 'Click to view larger image';
    img.onerror = function() {
      this.src = 'img/placeholder.png';
    };
    
    // Click handler dla powiększenia zdjęcia
    img.addEventListener('click', () => {
      const modal = document.getElementById('ironmongery-image-modal');
      const modalTitle = document.getElementById('ironmongery-modal-title');
      const modalImage = document.getElementById('ironmongery-modal-image');
      const modalDesc = document.getElementById('ironmongery-modal-description');
      
      modalTitle.textContent = product.name;
      modalImage.src = product.image || 'img/placeholder.png';
      modalImage.alt = product.name;
      modalDesc.textContent = product.description;
      
      modal.style.display = 'block';
    });

    // Info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'product-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'product-name';
    nameEl.textContent = product.name;
    
    if (product.recommended) {
      const badge = document.createElement('span');
      badge.className = 'recommended-badge';
      badge.textContent = 'recommended';
      nameEl.appendChild(badge);
    }

    const descEl = document.createElement('div');
    descEl.className = 'product-description';
    descEl.textContent = product.description;

    const priceEl = document.createElement('div');
    priceEl.className = 'product-price';
    priceEl.innerHTML = `£${product.prices.net.toFixed(2)}`;

    infoDiv.appendChild(nameEl);
    infoDiv.appendChild(descEl);
    infoDiv.appendChild(priceEl);

    // Actions section
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'product-actions';

    // Wylicz ilość
    let quantity = 0;
    let quantityDisabled = false;

    if (category.mandatory) {
      // Finger lifts - obowiązkowe, zawsze 2
      quantity = 2;
      quantityDisabled = true;
    } else if (category.autoQuantity === true) {
      // Locks - wylicz automatycznie
      quantity = IronmongeryHelper.calculateLocksQuantity(this.windowWidth, this.hasBars);
      quantityDisabled = true;
    } else if (typeof category.autoQuantity === 'number') {
      // Stoppers - zawsze 2
      quantity = category.autoQuantity;
      quantityDisabled = true;
    } else {
      // Pull handles - user wybiera
      quantity = 0;
      quantityDisabled = false;
    }

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.className = 'quantity-input';
    quantityInput.value = quantity;
    quantityInput.min = 0;
    quantityInput.max = 10;
    quantityInput.disabled = quantityDisabled;

    if (quantityDisabled) {
      quantityInput.title = 'Quantity set automatically';
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-product';
    addBtn.textContent = category.mandatory ? 'ADDED' : 'ADD';
    addBtn.disabled = !canSelect || category.mandatory;

    if (category.mandatory) {
      addBtn.title = 'Automatically added to all windows';
    }

    addBtn.addEventListener('click', () => {
      if (!canSelect) {
        if (categoryKey === 'locks') {
          this.showPAS24Warning(product);
        } else if (categoryKey === 'stoppers') {
          alert(`You have already selected a ${this.selectedStopperType === 'stopper' ? 'Window Stopper' : 'Weekes Stop'}. Please remove it first if you want to change.`);
        }
        return;
      }

      const qty = parseInt(quantityInput.value) || 0;
      if (qty > 0) {
        this.addProduct(product, qty, categoryKey);
      } else {
        alert('Please select quantity greater than 0');
      }
    });

    actionsDiv.appendChild(quantityInput);
    actionsDiv.appendChild(addBtn);

    // Składaj element
    div.appendChild(img);
    div.appendChild(infoDiv);
    div.appendChild(actionsDiv);

    return div;
  },

  showPAS24Warning: function(product) {
    alert(`This product (${product.name}) is not PAS24 certified and cannot be used with your current window configuration.\n\nPlease select a PAS24 certified product or change your window security settings.`);
  },

  addProduct: function(product, quantity, categoryKey) {
    // Sprawdź czy locks już dodany
    if (categoryKey === 'locks') {
      const hasLock = Object.values(this.selectedProducts).some(item => item.category === 'locks');
      if (hasLock) {
        alert('Lock already selected. You can only choose one lock type per window.');
        return;
      }
    }
    
    // Dla stoppers - ustaw wybrany typ
    if (categoryKey === 'stoppers') {
      this.selectedStopperType = product.type;
      console.log('Selected stopper type:', this.selectedStopperType);
    }

    // Dodaj do wybranych produktów
    this.selectedProducts[product.id] = {
      product: product,
      quantity: quantity,
      category: categoryKey,
      totalPrice: product.prices.net * quantity
    };

    console.log('Product added:', product.name, 'Quantity:', quantity);
    
    // Odśwież renderowanie (żeby zablokować drugi typ stoppera lub drugi lock)
    if (categoryKey === 'stoppers' || categoryKey === 'locks') {
      this.renderCategory(categoryKey, this.selectedFinish);
    }
    
    this.updateTotalPrice();
    this.updateSpecification();

    alert(`Added ${quantity}x ${product.name} to your window configuration`);
  },

  updateTotalPrice: function() {
    let ironmongeryTotal = 0;
    Object.values(this.selectedProducts).forEach(item => {
      ironmongeryTotal += item.totalPrice;
    });
    
    console.log('Ironmongery total price:', ironmongeryTotal);
    
    // Wywołaj przeliczenie ceny
    if (typeof window.updatePrice === 'function') {
      window.updatePrice();
    }
  },

  updateSpecification: function() {
    // Wywołaj applyDetails z SpecificationController
    if (window.SpecificationController) {
      window.SpecificationController.applyDetails();
    }
  },

  listenToWindowConfig: function() {
    // Nasłuchuj zmian szerokości okna
    const widthInput = document.getElementById('width');
    if (widthInput) {
      widthInput.addEventListener('change', () => {
        this.windowWidth = parseInt(widthInput.value) || 800;
        console.log('Window width changed:', this.windowWidth);
        if (this.selectedFinish && this.selectedFinish !== 'client-supply') {
          this.renderProducts(this.selectedFinish);
        }
      });
    }

    // Nasłuchuj zmian PAS24
    const pas24Inputs = document.querySelectorAll('input[name="pas24"]');
    if (pas24Inputs.length > 0) {
      pas24Inputs.forEach(input => {
        input.addEventListener('change', () => {
          this.hasPAS24 = document.querySelector('input[name="pas24"]:checked')?.value === 'yes';
          console.log('PAS24 changed:', this.hasPAS24);
          if (this.selectedFinish && this.selectedFinish !== 'client-supply') {
            this.renderProducts(this.selectedFinish);
          }
        });
      });
    }

    // Nasłuchuj zmian Georgian bars
    const upperBarsSelect = document.getElementById('upper-bars');
    const lowerBarsSelect = document.getElementById('lower-bars');
    
    const checkBars = () => {
      const upperBars = upperBarsSelect?.value || 'none';
      const lowerBars = lowerBarsSelect?.value || 'none';
      this.hasBars = (upperBars !== 'none' || lowerBars !== 'none');
      console.log('Bars changed - hasBars:', this.hasBars);
      if (this.selectedFinish && this.selectedFinish !== 'client-supply') {
        this.renderProducts(this.selectedFinish);
      }
    };
    
    if (upperBarsSelect) {
      upperBarsSelect.addEventListener('change', checkBars);
    }
    if (lowerBarsSelect) {
      lowerBarsSelect.addEventListener('change', checkBars);
    }
  },

  loadConfiguration: function() {
    // Załaduj zapisaną konfigurację
    if (typeof storageManager !== 'undefined') {
      const savedConfig = storageManager.loadConfig();
      if (savedConfig && savedConfig.ironmongery) {
        this.selectedFinish = savedConfig.ironmongery.finish;
        this.selectedProducts = savedConfig.ironmongery.products || {};
        this.selectedStopperType = savedConfig.ironmongery.stopperType;
        
        const finishSelect = document.getElementById('furniture-finish');
        if (finishSelect && this.selectedFinish) {
          finishSelect.value = this.selectedFinish;
          this.onFinishChange(this.selectedFinish);
        }
      }
    }
  },

  saveConfiguration: function() {
    return {
      finish: this.selectedFinish,
      products: this.selectedProducts,
      stopperType: this.selectedStopperType
    };
  },

  getSelectedProducts: function() {
    return this.selectedProducts;
  },

  getTotalPrice: function() {
    let total = 0;
    Object.values(this.selectedProducts).forEach(item => {
      total += item.totalPrice;
    });
    return total;
  },

  reset: function() {
    this.selectedFinish = null;
    this.selectedProducts = {};
    this.selectedStopperType = null;
    
    const finishSelect = document.getElementById('furniture-finish');
    if (finishSelect) {
      finishSelect.value = '';
    }
    
    document.getElementById('client-supply-message').style.display = 'none';
    document.getElementById('ironmongery-products').style.display = 'none';
  }
};

// Eksportuj do window żeby inne moduły mogły używać
window.IronmongeryController = IronmongeryController;

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing Ironmongery Controller');
  IronmongeryController.init();
});