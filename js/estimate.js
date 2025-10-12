document.addEventListener('DOMContentLoaded', function() {
 // DOM elements
 const referenceElem = document.getElementById('estimate-reference');
 const dateElem = document.getElementById('estimate-date');
 const windowsList = document.getElementById('window-list');
 const totalWindows = document.getElementById('total-windows');
 const totalPrice = document.getElementById('total-price');

 // PDF generation object
 let pdfDocObject = null;

 // Initialize page
 function init() {
 // Generate random reference number if not already set
 if (referenceElem && referenceElem.textContent === 'EST-25051823') {
 const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
 referenceElem.textContent = `EST-2505${randomPart}`;
 }

 // Set current date
 if (dateElem) {
 const today = new Date();
 const options = { year: 'numeric', month: 'long', day: 'numeric' };
 dateElem.textContent = today.toLocaleDateString('en-GB', options);
 }

 // Load windows from localStorage
 loadEstimate();

 // Add event listeners to buttons
 addEventListeners();
 }

 function loadEstimate() {
 // Get saved windows from localStorage
 const windows = JSON.parse(localStorage.getItem('windowEstimates') || '[]');

 if (!windowsList) return;

 // Clear loading message
 windowsList.innerHTML = '';

 if (windows.length === 0) {
 windowsList.innerHTML = '<p>No windows added to your estimate yet. <a href="build-your-own-windows.html">Go back to configure your windows</a>.</p>';
 if (totalWindows) totalWindows.textContent = '0';
 if (totalPrice) totalPrice.textContent = '0.00';
 return;
 }

 let sumTotal = 0;

 // Add each window to the list
 windows.forEach((window, index) => {
 const windowItem = document.createElement('div');
 windowItem.className = 'window-item';

 const colorInfo = window.colorType === 'single'
 ? `<p><strong>Color:</strong> ${window.singleColor}</p>`
 : `<p><strong>Interior Color:</strong> ${window.interiorColor}</p>
 <p><strong>Exterior Color:</strong> ${window.exteriorColor}</p>`;

 let glassTypeText = '';
 switch(window.glassType) {
 case 'double': glassTypeText = 'Double Glazing (U-value: 1.1)'; break;
 case 'triple': glassTypeText = 'Triple Glazing (U-value: 0.7)'; break;
 case 'passive': glassTypeText = 'Passive Glass (U-value: 0.5)'; break;
 default: glassTypeText = window.glassType;
 }

 let frameTypeText = window.frameType === 'standard' ? 'Standard Frame (165mm)' : 'Slim Frame (145mm)';

 let openingText = '';
 switch(window.openingType) {
 case 'both': openingText = 'Both Sashes'; break;
 case 'top': openingText = 'Top Sash Only'; break;
 case 'bottom': openingText = 'Bottom Sash Only'; break;
 case 'fixed': openingText = 'Fixed (Non-opening)'; break;
 default: openingText = window.openingType;
 }

 windowItem.innerHTML = `
 <h4>Window ${index + 1}</h4>
 <div class="window-details">
 <div>
 <p><strong>Dimensions:</strong> ${window.width}mm × ${window.height}mm</p>
 <p><strong>Frame:</strong> ${frameTypeText}</p>
 <p><strong>Glass:</strong> ${glassTypeText}</p>
 ${colorInfo}
 </div>
 <div>
 <p><strong>Opening:</strong> ${openingText}</p>
 <p><strong>Horns:</strong> ${window.horns === 'none' ? 'No Horns' : window.horns.charAt(0).toUpperCase() + window.horns.slice(1) + ' Horns'}</p>
 <p><strong>Ironmongery:</strong> ${window.ironmongery === 'none' ? 'No Ironmongery' : window.ironmongery.charAt(0).toUpperCase() + window.ironmongery.slice(1)}</p>
 </div>
 </div>
 ${window.quantity && window.quantity > 1 ?
 `<p><strong>Quantity:</strong> ${window.quantity} identical windows</p>
 <p class="window-price"><strong>Unit Price:</strong> £${window.unitPrice ? window.unitPrice.toFixed(2) : 'N/A'}</p>` : ''}
 <p class="window-price"><strong>Price:</strong> £${window.price.toFixed(2)}</p>
 <button class="btn-remove" onclick="removeWindow(${index})">Remove</button>
 `;

 windowsList.appendChild(windowItem);

 sumTotal += window.price;
 });

 // Update totals
 if (totalWindows) totalWindows.textContent = windows.length.toString();
 if (totalPrice) totalPrice.textContent = sumTotal.toFixed(2);
 }

 function removeWindow(index) {
 let estimates = JSON.parse(localStorage.getItem('windowEstimates') || '[]');
 estimates.splice(index, 1);
 localStorage.setItem('windowEstimates', JSON.stringify(estimates));
 // Refresh view
 loadEstimate();
 }

 function addEventListeners() {
 const proceedPaymentBtn = document.getElementById('proceed-payment');
 const downloadPdfBtn = document.getElementById('download-pdf');
 const emailEstimateBtn = document.getElementById('email-estimate');
 const continueShoppingBtn = document.getElementById('continue-shopping');

 if (proceedPaymentBtn) {
 proceedPaymentBtn.addEventListener('click', proceedToPayment);
 }

 if (downloadPdfBtn) {
 downloadPdfBtn.addEventListener('click', generateAndDownloadPDF);
 }

 if (emailEstimateBtn) {
 emailEstimateBtn.addEventListener('click', emailEstimate);
 }

 if (continueShoppingBtn) {
 continueShoppingBtn.addEventListener('click', function() {
 window.location.href = 'build-your-own-windows.html';
 });
 }
 }

 function proceedToPayment() {
 // In a real implementation, this would redirect to a payment processor
 alert('This would redirect to the payment gateway in a production environment.');
 // Simulate redirect to payment page
 // window.location.href = 'payment.html';
 }

 function generateAndDownloadPDF() {
 const estimates = JSON.parse(localStorage.getItem('windowEstimates') || '[]');

 if (estimates.length === 0) {
 alert('No windows in your estimate to generate PDF.');
 return;
 }

 alert('Generating PDF... In a production environment, this would create a detailed PDF of your estimate.');

 // In a real implementation, this would use a library like jsPDF to generate the PDF
 // For now, we'll just show the PDF modal with a message

 const pdfPreview = document.getElementById('pdf-preview');
 const pdfModal = document.getElementById('pdf-modal');

 if (pdfPreview && pdfModal) {
 // Show some default content in the iframe
 pdfPreview.srcdoc = `
 <html>
 <body style="font-family: Arial, sans-serif; padding: 20px;">
 <h1 style="color: #0F3124;">Skylon Timber & Glazing House</h1>
 <h2>Window Estimate</h2>
 <p>Your estimate would be rendered as a PDF here in the production version.</p>
 <p>Total: £${totalPrice ? totalPrice.textContent : '0.00'}</p>
 </body>
 </html>
 `;

 // Show modal
 pdfModal.style.display = 'block';
 }
 }

 /**
 * Email the estimate
 */
 function emailEstimate() {
 const email = prompt('Please enter your email address to receive this estimate:');
 if (email && validateEmail(email)) {
 alert(`Your estimate will be sent to ${email}. Thank you!`);
 // In a real implementation, this would send the data to a server
 // that would generate and email the PDF
 } else if (email) {
 alert('Please enter a valid email address.');
 }
 }

 /**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
 function validateEmail(email) {
 const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 return re.test(email);
 }

 /**
 * Close PDF modal
 */
 function closePdfModal() {
 const pdfModal = document.getElementById('pdf-modal');
 if (pdfModal) {
 pdfModal.style.display = 'none';
 }
 }

 /**
 * Download PDF
 */
 function downloadPDF() {
 alert('Downloading PDF... In a production environment, this would download the actual PDF file.');
 // In a real implementation, this would trigger the download
 // using the PDF object generated earlier
 }

 // Initialize the page
 init();

 // Export functions for global access
 window.removeWindow = removeWindow;
 window.closePdfModal = closePdfModal;
 window.downloadPDF = downloadPDF;
});