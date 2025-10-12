document.addEventListener('DOMContentLoaded', function() {
 // DOM elements
 const variantsList = document.getElementById('variants-list');
 const noVariantsMessage = document.getElementById('no-variants');

 // Initialize page
 function init() {
 // Load saved variants from localStorage
 loadVariants();
 }

 function loadVariants() {
 // Get saved variants from localStorage
 const savedVariants = JSON.parse(localStorage.getItem('savedWindowVariants') || '[]');

 // Check if there are saved variants
 if (savedVariants.length === 0) {
 if (variantsList) {
 variantsList.innerHTML = '';
 }
 if (noVariantsMessage) {
 noVariantsMessage.style.display = 'block';
 }
 return;
 }

 // Hide no variants message
 if (noVariantsMessage) {
 noVariantsMessage.style.display = 'none';
 }

 // Clear variants list
 if (variantsList) {
 variantsList.innerHTML = '';
 }

 // Add each variant to the list
 savedVariants.forEach((variant, index) => {
 const variantCard = document.createElement('div');
 variantCard.className = 'variant-card';

 // Format date
 const date = new Date(variant.date);
 const formattedDate = date.toLocaleDateString('en-GB', {
 day: 'numeric',
 month: 'short',
 year: 'numeric'
 });

 // Get frame type name from config if available
 let frameTypeName = 'Standard Frame';
 if (window.config && window.config.options && window.config.options.frame) {
 frameTypeName = window.config.options.frame[variant.frameType]?.name || variant.frameType;
 }

 // Get glass type name from config if available
 let glassTypeName = 'Double Glazing';
 if (window.config && window.config.options && window.config.options.glass) {
 glassTypeName = window.config.options.glass[variant.glassType]?.name || variant.glassType;
 }

 // Get opening type name from config if available
 let openingTypeName = 'Both Sashes Open';
 if (window.config && window.config.options && window.config.options.opening) {
 openingTypeName = window.config.options.opening[variant.openingType]?.name || variant.openingType;
 }

 // Build color information
 const colorInfo = variant.colorType === 'single'
 ? variant.singleColor.charAt(0).toUpperCase() + variant.singleColor.slice(1)
 : `Interior: ${variant.interiorColor.charAt(0).toUpperCase() + variant.interiorColor.slice(1)},
 Exterior: ${variant.exteriorColor.charAt(0).toUpperCase() + variant.exteriorColor.slice(1)}`;

 // Create card HTML
 variantCard.innerHTML = `
 <div class="variant-header">
 <h3>${variant.name}</h3>
 <span class="variant-date">${formattedDate}</span>
 </div>

 <div class="variant-preview">
 <img src="img/renders/${variant.frameType}-front-${variant.colorType === 'single' ? variant.singleColor : variant.exteriorColor}.png" alt="Front View">
 <img src="img/renders/${variant.frameType}-back-${variant.colorType === 'single' ? variant.singleColor : variant.interiorColor}.png" alt="Back View">
 </div>

 <div class="variant-details">
 <p><span>Dimensions:</span> <span>${variant.width}mm × ${variant.height}mm</span></p>
 <p><span>Frame:</span> <span>${frameTypeName}</span></p>
 <p><span>Glass:</span> <span>${glassTypeName}</span></p>
 <p><span>Opening:</span> <span>${openingTypeName}</span></p>
 <p><span>Color:</span> <span>${colorInfo}</span></p>
 </div>

 <div class="variant-price">
 Price: £${variant.price ? variant.price.toFixed(2) : '0.00'}
 </div>

 <div class="variant-actions">
 <button class="btn" onclick="loadVariant(${index})">Load Configuration</button>
 <button class="btn btn-secondary" onclick="deleteVariant(${index})">Delete</button>
 </div>
 `;

 variantsList.appendChild(variantCard);
 });
 }

 function loadVariant(index) {
 const savedVariants = JSON.parse(localStorage.getItem('savedWindowVariants') || '[]');

 if (index >= 0 && index < savedVariants.length) {
 // Save variant as last configuration
 localStorage.setItem('savedWindowConfig', JSON.stringify(savedVariants[index]));

 // Redirect to configurator
 window.location.href = 'build-your-own-windows.html';
 }
 }

 function deleteVariant(index) {
 if (!confirm('Are you sure you want to delete this variant?')) return;

 let savedVariants = JSON.parse(localStorage.getItem('savedWindowVariants') || '[]');

 if (index >= 0 && index < savedVariants.length) {
 // Remove variant
 savedVariants.splice(index, 1);

 // Save updated list of variants
 localStorage.setItem('savedWindowVariants', JSON.stringify(savedVariants));

 // Refresh page
 loadVariants();
 }
 }

 // Initialize the page
 init();

 // Export functions for global access
 window.loadVariant = loadVariant;
 window.deleteVariant = deleteVariant;
});