/**
 * Ironmongery Gallery Overlay
 * Full-screen product selection interface
 */

class IronmongeryGallery {
  constructor() {
    this.overlay = document.getElementById('ironmongeryOverlay');
    this.closeBtn = document.getElementById('galleryClose');
    this.confirmBtn = document.getElementById('confirmSelection');
    this.productsGrid = document.getElementById('productsGrid');
    this.totalElement = document.getElementById('selectionTotal');
    
    this.selectedProducts = new Map(); // category -> product
    this.currentCategory = 'locks';
    this.currentFinish = 'all';
    this.isAdminMode = false; // Tryb zarządzania dla admina
    
    this.init();
  }

  async init() {
    // Check if user is admin
    if (typeof isAdmin === 'function') {
      this.isAdminMode = await isAdmin();
    }
    
    // Close handlers
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Confirm button
    this.confirmBtn?.addEventListener('click', () => this.confirmSelection());

    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.switchCategory(category);
      });
    });

    // Finish filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const finish = e.target.dataset.finish;
        this.filterByFinish(finish);
      });
    });
  }

  open() {
    // Reload products from localStorage (in case admin added new products)
    if (window.IronmongeryHelper) {
      IronmongeryHelper.loadProductsFromStorage();
    }
    
    this.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load current selections from configurator
    this.loadCurrentSelections();
    
    // Render products
    this.renderProducts();
  }

  close() {
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  loadCurrentSelections() {
    // Load from configurator state
    if (window.ConfiguratorCore?.currentWindow?.ironmongery) {
      const ironmongery = window.ConfiguratorCore.currentWindow.ironmongery;
      
      // Map existing selections
      if (ironmongery.lock) {
        this.selectedProducts.set('locks', ironmongery.lock);
      }
      if (ironmongery.fingerLift) {
        this.selectedProducts.set('fingerLifts', ironmongery.fingerLift);
      }
      if (ironmongery.horns) {
        this.selectedProducts.set('horns', ironmongery.horns);
      }
      if (ironmongery.hinges) {
        this.selectedProducts.set('hinges', ironmongery.hinges);
      }
      if (ironmongery.trickleVents) {
        this.selectedProducts.set('trickleVents', ironmongery.trickleVents);
      }
    }
  }

  switchCategory(category) {
    this.currentCategory = category;
    
    // Update tab active state
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    this.renderProducts();
  }

  filterByFinish(finish) {
    this.currentFinish = finish;
    
    // Update filter active state
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.finish === finish);
    });
    
    this.renderProducts();
  }

  renderProducts() {
    if (!this.productsGrid) return;
    
    const categoryData = IRONMONGERY_DATA.categories[this.currentCategory];
    if (!categoryData) return;

    let products = categoryData.products;

    // Filter by finish if not 'all'
    if (this.currentFinish !== 'all') {
      products = products.filter(p => 
        p.color?.toLowerCase() === this.currentFinish.toLowerCase()
      );
    }

    // Render
    this.productsGrid.innerHTML = products.map(product => 
      this.renderProductCard(product)
    ).join('');

    // Add click handlers
    this.productsGrid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const productId = card.dataset.productId;
        this.toggleProduct(productId);
      });
    });

    this.updateTotal();
  }

  renderProductCard(product) {
    const isSelected = this.selectedProducts.get(this.currentCategory)?.id === product.id;
    const price = product.price_net || product.price || 0;
    
    // Admin buttons
    const adminButtons = this.isAdminMode ? `
      <div class="admin-actions" style="position: absolute; top: 5px; right: 5px; display: flex; gap: 5px; z-index: 10;">
        <button onclick="event.stopPropagation(); window.IronmongeryGallery.editProduct('${product.id}')" 
                class="btn-admin-edit" 
                style="padding: 5px 10px; background: #ffc107; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
          ✏️
        </button>
        <button onclick="event.stopPropagation(); window.IronmongeryGallery.deleteProduct('${product.id}')" 
                class="btn-admin-delete"
                style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
          🗑️
        </button>
      </div>
    ` : '';
    
    return `
      <div class="product-card ${isSelected ? 'selected' : ''}" 
           data-product-id="${product.id}">
        ${adminButtons}
        <img src="${product.image || product.image_url || 'img/placeholder-ironmongery.jpg'}" 
             alt="${product.name}"
             class="product-card-image"
             onerror="this.src='img/placeholder-ironmongery.jpg'">
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-price">£${price.toFixed(2)}</div>
        ${product.description ? 
          `<div class="product-card-description">${product.description}</div>` 
          : ''}
      </div>
    `;
  }

  toggleProduct(productId) {
    const categoryData = IRONMONGERY_DATA.categories[this.currentCategory];
    const product = categoryData.products.find(p => p.id === productId);
    
    if (!product) return;

    // Toggle selection
    const currentSelection = this.selectedProducts.get(this.currentCategory);
    
    if (currentSelection?.id === productId) {
      // Deselect
      this.selectedProducts.delete(this.currentCategory);
    } else {
      // Select
      this.selectedProducts.set(this.currentCategory, product);
    }

    this.renderProducts();
  }

  updateTotal() {
    let total = 0;
    
    this.selectedProducts.forEach(product => {
      const price = product.price_net || product.price || 0;
      total += price;
    });

    if (this.totalElement) {
      this.totalElement.textContent = `£${total.toFixed(2)}`;
    }

    // Enable/disable confirm button
    if (this.confirmBtn) {
      this.confirmBtn.disabled = this.selectedProducts.size === 0;
    }
  }

  confirmSelection() {
    // Convert to ironmongery format
    const ironmongery = {
      lock: this.selectedProducts.get('locks') || null,
      fingerLift: this.selectedProducts.get('fingerLifts') || null,
      horns: this.selectedProducts.get('horns') || null,
      hinges: this.selectedProducts.get('hinges') || null,
      trickleVents: this.selectedProducts.get('trickleVents') || null,
      pullHandles: this.selectedProducts.get('pullHandles') || null,
      stoppers: this.selectedProducts.get('stoppers') || null
    };

    // Save to configurator
    if (window.ConfiguratorCore?.currentWindow) {
      window.ConfiguratorCore.currentWindow.ironmongery = ironmongery;
      
      // Trigger update in main configurator
      if (window.IronmongeryController) {
        window.IronmongeryController.updateFromGallery(ironmongery);
      }
    }

    // Update display on main page
    this.updateMainPageDisplay();

    console.log('Selected ironmongery:', ironmongery);
    
    this.close();
  }

  updateMainPageDisplay() {
    const displayContainer = document.getElementById('ironmongery-selection-display');
    const gridContainer = document.getElementById('selected-products-grid');
    const totalElement = document.getElementById('ironmongery-total');

    if (!displayContainer || !gridContainer || !totalElement) return;

    // If no products selected, hide the display
    if (this.selectedProducts.size === 0) {
      displayContainer.style.display = 'none';
      return;
    }

    // Show the display
    displayContainer.style.display = 'block';

    // Generate miniatures
    let html = '';
    let total = 0;

    this.selectedProducts.forEach((product, category) => {
      const price = product.price_net || product.price || 0;
      total += price;

      const categoryName = {
        locks: 'Lock',
        fingerLifts: 'Lifts',
        pullHandles: 'Handle',
        stoppers: 'Stopper',
        horns: 'Horns'
      }[category] || category;

      html += `
        <div style="text-align: center; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
          <img src="${product.image || product.image_url || 'img/placeholder-ironmongery.jpg'}" 
               alt="${product.name}"
               style="width: 100%; height: 60px; object-fit: cover; border-radius: 4px; margin-bottom: 5px;"
               onerror="this.src='img/placeholder-ironmongery.jpg'">
          <div style="font-size: 0.75rem; color: #666; margin-bottom: 3px;">${categoryName}</div>
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--primary-color);">£${price.toFixed(2)}</div>
        </div>
      `;
    });

    gridContainer.innerHTML = html;
    totalElement.textContent = `£${total.toFixed(2)}`;
  }

  // ==========================================
  // ADMIN FUNCTIONS
  // ==========================================

  async addProduct() {
    // Open modal with form
    const modal = this.createProductModal();
    document.body.appendChild(modal);
  }

  async editProduct(productId) {
    console.log('Edit product:', productId);
    const categoryData = IRONMONGERY_DATA.categories[this.currentCategory];
    const product = categoryData.products.find(p => p.id === productId);
    
    if (!product) return;
    
    // Open modal with form pre-filled
    const modal = this.createProductModal(product);
    document.body.appendChild(modal);
  }

  async deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    console.log('Delete product:', productId);
    
    try {
      // Delete from Supabase
      const { error } = await window.supabaseClient
        .from('ironmongery_products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      alert('Product deleted successfully!');
      
      // Reload products
      await this.loadProductsFromDatabase();
      this.renderProducts();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product: ' + error.message);
    }
  }

  createProductModal(existingProduct = null) {
    const isEdit = !!existingProduct;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 20000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h2 style="margin: 0 0 20px 0;">${isEdit ? 'Edit' : 'Add New'} Product</h2>
        
        <form id="productForm" style="display: flex; flex-direction: column; gap: 15px;">
          
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Category *</label>
            <select id="gallery-product-category" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="locks">Sash Locks</option>
              <option value="fingerLifts">Finger Lifts</option>
              <option value="pullHandles">Pull Handles</option>
              <option value="stoppers">Stoppers</option>
              <option value="horns">Sash Horns</option>
            </select>
          </div>

          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Product Name *</label>
            <input type="text" id="gallery-product-name" required 
                   placeholder="e.g. Sash Lock PAS24"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          </div>

          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Color</label>
            <select id="gallery-product-color" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="">-- No Color --</option>
              <option value="chrome">Chrome</option>
              <option value="satin">Satin</option>
              <option value="brass">Brass</option>
              <option value="antique-brass">Antique Brass</option>
              <option value="black">Black</option>
              <option value="white">White</option>
            </select>
          </div>

          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Price (£) *</label>
            <input type="number" id="gallery-product-price" required step="0.01" min="0"
                   placeholder="e.g. 25.00"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          </div>

          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Image</label>
            <input type="file" id="gallery-product-image" accept="image/*"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          </div>

          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Description</label>
            <textarea id="gallery-product-description" rows="3"
                      style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></textarea>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="submit" class="btn" 
                    style="flex: 1; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
              ${isEdit ? 'Update' : 'Add'} Product
            </button>
            <button type="button" class="btn-cancel"
                    style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Handle form submission
    const form = modal.querySelector('#productForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProduct(existingProduct?.id, modal);
    });
    
    // Set default values AFTER modal is in DOM
    if (!existingProduct) {
      // New product - set defaults
      modal.querySelector('#gallery-product-category').value = 'locks';
    } else {
      // Edit product - populate values
      if (existingProduct.category) modal.querySelector('#gallery-product-category').value = existingProduct.category;
      if (existingProduct.name) modal.querySelector('#gallery-product-name').value = existingProduct.name;
      if (existingProduct.color) modal.querySelector('#gallery-product-color').value = existingProduct.color;
      if (existingProduct.price || existingProduct.price_net) {
        modal.querySelector('#gallery-product-price').value = existingProduct.price || existingProduct.price_net;
      }
      if (existingProduct.description) modal.querySelector('#gallery-product-description').value = existingProduct.description;
    }
    
    // Handle cancel
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    return modal;
  }

  async saveProduct(existingId, modal) {
    // Debug - check if elements exist
    const categoryEl = document.getElementById('gallery-product-category');
    const nameEl = document.getElementById('gallery-product-name');
    const colorEl = document.getElementById('gallery-product-color');
    const priceEl = document.getElementById('gallery-product-price');
    
    console.log('🔍 Form elements check:');
    console.log('  category element:', categoryEl, 'value:', categoryEl?.value);
    console.log('  name element:', nameEl, 'value:', nameEl?.value);
    console.log('  color element:', colorEl, 'value:', colorEl?.value);
    console.log('  price element:', priceEl, 'value:', priceEl?.value);
    
    // Validation
    const priceInput = document.getElementById('gallery-product-price');
    const price = parseFloat(priceInput.value);
    
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price!');
      priceInput.focus();
      return;
    }
    
    const formData = {
      category: document.getElementById('gallery-product-category').value,
      name: document.getElementById('gallery-product-name').value,
      color: document.getElementById('gallery-product-color').value || null,
      price_net: price,
      price_vat: price,
      description: document.getElementById('gallery-product-description').value || null
    };
    
    console.log('💾 Saving product with data:', formData);
    console.log('🔌 Supabase client exists:', !!window.supabaseClient);
    
    try {
      // Handle image upload
      const imageFile = document.getElementById('gallery-product-image').files[0];
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
          .from('ironmongery-images')
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = window.supabaseClient.storage
          .from('ironmongery-images')
          .getPublicUrl(fileName);
        
        formData.image_url = publicUrl;
      }
      
      // Save to Supabase
      if (existingId) {
        // Update
        const { error } = await window.supabaseClient
          .from('ironmongery_products')
          .update(formData)
          .eq('id', existingId);
        
        if (error) throw error;
        alert('Product updated successfully!');
      } else {
        // Insert
        const { error } = await window.supabaseClient
          .from('ironmongery_products')
          .insert([formData]);
        
        if (error) throw error;
        alert('Product added successfully!');
      }
      
      // Close modal
      document.body.removeChild(modal);
      
      // Reload products
      await this.loadProductsFromDatabase();
      console.log('🔍 Products in current category:', this.currentCategory, IRONMONGERY_DATA.categories[this.currentCategory]?.products);
      this.renderProducts();
      
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
    }
  }

  async loadProductsFromDatabase() {
    try {
      const { data, error } = await window.supabaseClient
        .from('ironmongery_products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      console.log('📦 Raw data from DB:', data);
      
      // Clear existing products
      Object.keys(IRONMONGERY_DATA.categories).forEach(key => {
        IRONMONGERY_DATA.categories[key].products = [];
      });
      
      // Group by category
      data.forEach(product => {
        console.log('📌 Processing product:', product.name, 'category:', product.category);
        if (IRONMONGERY_DATA.categories[product.category]) {
          IRONMONGERY_DATA.categories[product.category].products.push(product);
          console.log('✅ Added to category:', product.category);
        } else {
          console.log('❌ Category not found:', product.category);
        }
      });
      
      console.log('Loaded products from database:', data.length);
      console.log('📊 Products by category:', Object.keys(IRONMONGERY_DATA.categories).map(key => 
        `${key}: ${IRONMONGERY_DATA.categories[key].products.length}`
      ));
      
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  window.IronmongeryGallery = new IronmongeryGallery();
});

// Function to open gallery (called from configurator)
async function openIronmongeryGallery() {
  if (!window.IronmongeryGallery) {
    window.IronmongeryGallery = new IronmongeryGallery();
  }
  
  // Load products from database
  await window.IronmongeryGallery.loadProductsFromDatabase();
  window.IronmongeryGallery.open();
}

// Function to open gallery in manager mode (called from admin panel)
async function openIronmongeryManager() {
  if (!window.IronmongeryGallery) {
    window.IronmongeryGallery = new IronmongeryGallery();
  }
  
  window.IronmongeryGallery.isAdminMode = true;
  await window.IronmongeryGallery.loadProductsFromDatabase();
  window.IronmongeryGallery.open();
  
  // Add "Add Product" button in gallery header
  const header = document.querySelector('.gallery-header');
  if (header && !document.getElementById('btn-add-product')) {
    const addBtn = document.createElement('button');
    addBtn.id = 'btn-add-product';
    addBtn.textContent = '+ Add New Product';
    addBtn.style.cssText = 'padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-left: 20px;';
    addBtn.onclick = () => window.IronmongeryGallery.addProduct();
    header.appendChild(addBtn);
  }
}