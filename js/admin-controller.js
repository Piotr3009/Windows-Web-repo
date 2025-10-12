// Admin Controller
const AdminController = {
  // Storage keys
  STORAGE_KEYS: {
    BARS_PRICE: 'admin_bars_price',
    GLASS_PRICES: 'admin_glass_prices',
    OPENING_PRICES: 'admin_opening_prices',
    FROSTED_PRICE: 'admin_frosted_price',
    IRONMONGERY_PRODUCTS: 'admin_ironmongery_products',
    HORNS: 'admin_horns'
  },

  init: function() {
    console.log('Admin Controller initialized');
    this.loadAllData();
    this.setupEventListeners();
    this.renderIronmongeryTable();
    this.renderHornsGrid();
  },

  setupEventListeners: function() {
    // Product category change - show/hide stopper type
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        const stopperTypeGroup = document.getElementById('stopper-type-group');
        if (e.target.value === 'stoppers') {
          stopperTypeGroup.style.display = 'block';
        } else {
          stopperTypeGroup.style.display = 'none';
        }
      });
    }

    // Add product form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
      addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addProduct();
      });
    }

    // Add horn form
    const addHornForm = document.getElementById('add-horn-form');
    if (addHornForm) {
      addHornForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addHorn();
      });
    }
  },

  // Load all saved data
  loadAllData: function() {
    // Bars price
    const barsPrice = localStorage.getItem(this.STORAGE_KEYS.BARS_PRICE);
    if (barsPrice) {
      document.getElementById('bar-price').value = barsPrice;
    }

    // Glass prices
    const glassPrices = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.GLASS_PRICES) || '{}');
    if (glassPrices.triple) document.getElementById('triple-price').value = glassPrices.triple;
    if (glassPrices.passive) document.getElementById('passive-price').value = glassPrices.passive;

    // Opening prices
    const openingPrices = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.OPENING_PRICES) || '{}');
    if (openingPrices.bottomBase) document.getElementById('bottom-base').value = openingPrices.bottomBase;
    if (openingPrices.bottomPerSqm) document.getElementById('bottom-per-sqm').value = openingPrices.bottomPerSqm;
    if (openingPrices.bothBase) document.getElementById('both-base').value = openingPrices.bothBase;
    if (openingPrices.bothPerSqm) document.getElementById('both-per-sqm').value = openingPrices.bothPerSqm;

    // Frosted price
    const frostedPrice = localStorage.getItem(this.STORAGE_KEYS.FROSTED_PRICE);
    if (frostedPrice) {
      document.getElementById('frosted-price').value = frostedPrice;
    }
  },

  // SECTION 2: Bars Price
  saveBarsPrice: function() {
    const price = document.getElementById('bar-price').value;
    if (!price || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    localStorage.setItem(this.STORAGE_KEYS.BARS_PRICE, price);
    alert('Bars price saved successfully!');
  },

  // SECTION 5: Glass Prices
  saveGlassPrices: function() {
    const triple = document.getElementById('triple-price').value;
    const passive = document.getElementById('passive-price').value;
    
    if (!triple || !passive || triple <= 0 || passive <= 0) {
      alert('Please enter valid prices for both glass types');
      return;
    }

    const prices = { triple, passive };
    localStorage.setItem(this.STORAGE_KEYS.GLASS_PRICES, JSON.stringify(prices));
    alert('Glass prices saved successfully!');
  },

  // SECTION 6: Opening Prices
  saveOpeningPrices: function() {
    const bottomBase = document.getElementById('bottom-base').value;
    const bottomPerSqm = document.getElementById('bottom-per-sqm').value;
    const bothBase = document.getElementById('both-base').value;
    const bothPerSqm = document.getElementById('both-per-sqm').value;

    if (!bottomBase || !bottomPerSqm || !bothBase || !bothPerSqm) {
      alert('Please fill all opening mechanism prices');
      return;
    }

    const prices = { bottomBase, bottomPerSqm, bothBase, bothPerSqm };
    localStorage.setItem(this.STORAGE_KEYS.OPENING_PRICES, JSON.stringify(prices));
    alert('Opening mechanism prices saved successfully!');
  },

  // SECTION 9: Frosted Price
  saveFrostedPrice: function() {
    const price = document.getElementById('frosted-price').value;
    if (!price || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    localStorage.setItem(this.STORAGE_KEYS.FROSTED_PRICE, price);
    alert('Frosted glass price saved successfully!');
  },

  // SECTION 8: IRONMONGERY
  openAddProductModal: function() {
    document.getElementById('add-product-modal').classList.add('active');
  },

  closeAddProductModal: function() {
    const modal = document.getElementById('add-product-modal');
    const form = document.getElementById('add-product-form');
    
    modal.classList.remove('active');
    form.reset();
    
    // Reset tytułu i przycisku
    const titleEl = document.querySelector('#add-product-modal h2');
    if (titleEl) titleEl.textContent = 'Add Ironmongery Product';
    
    const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add Product';
    
    // Usuń editId
    delete form.dataset.editId;
  },

  addProduct: function() {
    const form = document.getElementById('add-product-form');
    const editId = form.dataset.editId; // Sprawdź czy to edycja
    
    const category = document.getElementById('product-category').value;
    const name = document.getElementById('product-name').value;
    const color = document.getElementById('product-color').value;
    const priceNet = parseFloat(document.getElementById('product-price-net').value);
    const priceVat = parseFloat(document.getElementById('product-price-vat').value);
    const description = document.getElementById('product-description').value;
    const isPAS24 = document.getElementById('product-pas24').checked;
    const recommended = document.getElementById('product-recommended').checked;
    const mandatory = document.getElementById('product-mandatory').checked;
    const imageFile = document.getElementById('product-image').files[0];

    // Validation
    if (!category || !name || !color || !priceNet || !priceVat) {
      alert('Please fill all required fields');
      return;
    }

    // Stopper type
    let stopperType = null;
    if (category === 'stoppers') {
      stopperType = document.getElementById('product-stopper-type').value;
      if (!stopperType) {
        alert('Please select stopper type');
        return;
      }
    }
    
    // Jeśli edycja i nie ma nowego zdjęcia, zachowaj stare
    if (editId && !imageFile) {
      const products = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.IRONMONGERY_PRODUCTS) || '[]');
      const oldProduct = products.find(p => p.id === editId);
      
      this.saveProduct({
        id: editId, // Użyj starego ID
        category,
        name,
        color,
        prices: { net: priceNet, vat: priceVat },
        description,
        isPAS24,
        recommended,
        mandatory,
        type: stopperType,
        image: oldProduct?.image || 'img/placeholder.png'
      }, editId);
      return;
    }

    // Read image
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.saveProduct({
          id: editId || Date.now().toString(),
          category,
          name,
          color,
          prices: { net: priceNet, vat: priceVat },
          description,
          isPAS24,
          recommended,
          mandatory,
          type: stopperType,
          image: e.target.result // Base64
        }, editId);
      };
      reader.readAsDataURL(imageFile);
    } else {
      this.saveProduct({
        id: editId || Date.now().toString(),
        category,
        name,
        color,
        prices: { net: priceNet, vat: priceVat },
        description,
        isPAS24,
        recommended,
        mandatory,
        type: stopperType,
        image: 'img/placeholder.png'
      }, editId);
    }
  },

  saveProduct: function(product, editId) {
    // Get existing products
    let products = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.IRONMONGERY_PRODUCTS) || '[]');
    
    if (editId) {
      // Edycja - usuń stary i dodaj nowy
      products = products.filter(p => p.id !== editId);
      products.push(product);
      alert('Product updated successfully!');
    } else {
      // Dodawanie nowego
      products.push(product);
      alert('Product added successfully!');
    }
    
    // Save
    localStorage.setItem(this.STORAGE_KEYS.IRONMONGERY_PRODUCTS, JSON.stringify(products));
    
    this.closeAddProductModal();
    this.renderIronmongeryTable();
  },

  deleteProduct: function(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    let products = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.IRONMONGERY_PRODUCTS) || '[]');
    products = products.filter(p => p.id !== productId);
    localStorage.setItem(this.STORAGE_KEYS.IRONMONGERY_PRODUCTS, JSON.stringify(products));
    
    alert('Product deleted successfully!');
    this.renderIronmongeryTable();
  },

  renderIronmongeryTable: function() {
    const tbody = document.getElementById('ironmongery-tbody');
    const products = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.IRONMONGERY_PRODUCTS) || '[]');

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products added yet</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(product => `
      <tr>
        <td><img src="${product.image}" alt="${product.name}"></td>
        <td>${this.getCategoryName(product.category)}</td>
        <td>${product.name}</td>
        <td>${this.getColorName(product.color)}</td>
        <td>£${product.prices.net.toFixed(2)}</td>
        <td>£${product.prices.vat.toFixed(2)}</td>
        <td>
          <button class="btn-edit" onclick="AdminController.editProduct('${product.id}')">Edit</button>
          <button class="btn-delete" onclick="AdminController.deleteProduct('${product.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  },

  getCategoryName: function(key) {
    const names = {
      fingerLifts: 'Finger Lifts',
      locks: 'Locks',
      pullHandles: 'Pull Handles',
      stoppers: 'Stoppers'
    };
    return names[key] || key;
  },

  getColorName: function(key) {
    const names = {
      'chrome': 'Chrome',
      'satin': 'Satin',
      'brass': 'Brass',
      'antique-brass': 'Antique Brass',
      'black': 'Black',
      'white': 'White'
    };
    return names[key] || key;
  },

  editProduct: function(productId) {
    const products = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.IRONMONGERY_PRODUCTS) || '[]');
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      alert('Product not found');
      return;
    }
    
    // Wypełnij formularz danymi produktu
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-color').value = product.color;
    document.getElementById('product-price-net').value = product.prices.net;
    document.getElementById('product-price-vat').value = product.prices.vat;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-pas24').checked = product.isPAS24 || false;
    document.getElementById('product-recommended').checked = product.recommended || false;
    document.getElementById('product-mandatory').checked = product.mandatory || false;
    
    // Pokaż stopper type jeśli stopper
    if (product.category === 'stoppers') {
      document.getElementById('stopper-type-group').style.display = 'block';
      document.getElementById('product-stopper-type').value = product.type;
    }
    
    // Otwórz modal
    this.openAddProductModal();
    
    // Zmień tytuł i przycisk
    const titleEl = document.querySelector('#add-product-modal h2');
    if (titleEl) titleEl.textContent = 'Edit Product';
    
    const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Product';
    
    // Zapisz ID edytowanego produktu
    document.getElementById('add-product-form').dataset.editId = productId;
  },

  // SECTION 8: HORNS
  openAddHornModal: function() {
    document.getElementById('add-horn-modal').classList.add('active');
  },

  closeAddHornModal: function() {
    document.getElementById('add-horn-modal').classList.remove('active');
    document.getElementById('add-horn-form').reset();
  },

  addHorn: function() {
    const name = document.getElementById('horn-name').value;
    const imageFile = document.getElementById('horn-image').files[0];

    if (!name) {
      alert('Please enter horn name');
      return;
    }

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.saveHorn({
          id: Date.now().toString(),
          name,
          image: e.target.result
        });
      };
      reader.readAsDataURL(imageFile);
    } else {
      this.saveHorn({
        id: Date.now().toString(),
        name,
        image: 'img/placeholder.png'
      });
    }
  },

  saveHorn: function(horn) {
    const horns = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HORNS) || '[]');
    horns.push(horn);
    localStorage.setItem(this.STORAGE_KEYS.HORNS, JSON.stringify(horns));
    
    alert('Horn style added successfully!');
    this.closeAddHornModal();
    this.renderHornsGrid();
  },

  deleteHorn: function(hornId) {
    if (!confirm('Are you sure you want to delete this horn style?')) return;

    let horns = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HORNS) || '[]');
    horns = horns.filter(h => h.id !== hornId);
    localStorage.setItem(this.STORAGE_KEYS.HORNS, JSON.stringify(horns));
    
    alert('Horn style deleted successfully!');
    this.renderHornsGrid();
  },

  renderHornsGrid: function() {
    const grid = document.getElementById('horns-grid');
    const horns = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HORNS) || '[]');

    if (horns.length === 0) {
      grid.innerHTML = '<p>No horn styles added yet</p>';
      return;
    }

    grid.innerHTML = horns.map(horn => `
      <div class="horn-card">
        <img src="${horn.image}" alt="${horn.name}">
        <h4>${horn.name}</h4>
        <button class="btn-delete" onclick="AdminController.deleteHorn('${horn.id}')">Delete</button>
      </div>
    `).join('');
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  AdminController.init();
});