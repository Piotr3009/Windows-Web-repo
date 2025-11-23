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
    
    this.init();
  }

  init() {
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
        p.finishColor?.toLowerCase() === this.currentFinish.toLowerCase()
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
    
    return `
      <div class="product-card ${isSelected ? 'selected' : ''}" 
           data-product-id="${product.id}">
        <img src="${product.image || 'img/placeholder-ironmongery.jpg'}" 
             alt="${product.name}"
             class="product-card-image"
             onerror="this.src='img/placeholder-ironmongery.jpg'">
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-price">£${product.price.toFixed(2)}</div>
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
      total += product.price;
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
      const price = product.prices?.vat || product.price || 0;
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
          <img src="${product.image || 'img/placeholder-ironmongery.jpg'}" 
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
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.IronmongeryGallery = new IronmongeryGallery();
});

// Function to open gallery (called from configurator)
function openIronmongeryGallery() {
  window.IronmongeryGallery?.open();
}