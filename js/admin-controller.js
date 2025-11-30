// Admin Controller
const AdminController = {
  // Cached pricing config
  pricingConfig: null,

  init: async function() {
    console.log('Admin Controller initialized');
    await this.loadAllData();
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

  // Load all saved data from Supabase
  loadAllData: async function() {
    try {
      // Load pricing config from DB
      const { data, error } = await window.supabaseClient
        .from('pricing_config')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) {
        console.error('Error loading pricing config:', error);
        return;
      }
      
      this.pricingConfig = data;
      console.log('Loaded pricing config from DB:', data);
      
      // Fill form fields
      if (data.bar_price) {
        document.getElementById('bar-price').value = data.bar_price;
      }
      if (data.glass_triple_price) {
        document.getElementById('triple-price').value = data.glass_triple_price;
      }
      if (data.glass_passive_price) {
        document.getElementById('passive-price').value = data.glass_passive_price;
      }
      if (data.glass_frosted_price) {
        document.getElementById('frosted-price').value = data.glass_frosted_price;
      }
      
    } catch (err) {
      console.error('Error in loadAllData:', err);
    }
  },

  // Save price to DB
  async updatePricingConfig(updates) {
    try {
      const { error } = await window.supabaseClient
        .from('pricing_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', 1);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating pricing config:', err);
      alert('Error saving to database: ' + err.message);
      return false;
    }
  },

  // SECTION 2: Bars Price
  saveBarsPrice: async function() {
    const price = parseFloat(document.getElementById('bar-price').value);
    if (!price || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    const success = await this.updatePricingConfig({ bar_price: price });
    if (success) {
      alert('Bars price saved successfully!');
    }
  },

  // SECTION 5: Glass Prices
  saveGlassPrices: async function() {
    const triple = parseFloat(document.getElementById('triple-price').value);
    const passive = parseFloat(document.getElementById('passive-price').value);
    
    if (!triple || !passive || triple <= 0 || passive <= 0) {
      alert('Please enter valid prices for both glass types');
      return;
    }

    const success = await this.updatePricingConfig({ 
      glass_triple_price: triple,
      glass_passive_price: passive
    });
    if (success) {
      alert('Glass prices saved successfully!');
    }
  },

  // SECTION 6: Opening Prices - keeping for future use
  saveOpeningPrices: function() {
    alert('Opening prices are set in code. Contact developer to change.');
  },

  // SECTION 9: Frosted Price
  saveFrostedPrice: async function() {
    const price = parseFloat(document.getElementById('frosted-price').value);
    if (!price || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    const success = await this.updatePricingConfig({ glass_frosted_price: price });
    if (success) {
      alert('Frosted glass price saved successfully!');
    }
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
    const description = document.getElementById('product-description').value;
    const isPAS24 = document.getElementById('product-pas24').checked;
    const recommended = document.getElementById('product-recommended').checked;
    const mandatory = document.getElementById('product-mandatory').checked;
    const imageFile = document.getElementById('product-image').files[0];

    // Validation
    if (!category || !name || !color || !priceNet) {
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
        prices: { net: priceNet, vat: 0 },
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
          prices: { net: priceNet, vat: 0 },
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
        prices: { net: priceNet, vat: 0 },
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
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No products added yet</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(product => `
      <tr>
        <td><img src="${product.image}" alt="${product.name}"></td>
        <td>${this.getCategoryName(product.category)}</td>
        <td>${product.name}</td>
        <td>${this.getColorName(product.color)}</td>
        <td>£${product.prices.net.toFixed(2)}</td>
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