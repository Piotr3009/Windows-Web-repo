// Customer Dashboard JavaScript

class CustomerDashboard {
    constructor() {
        this.currentUser = null;
        this.customerData = null;
        this.orders = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        // Check if user is logged in
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = user;
        
        // Import any saved estimates from localStorage (for existing users)
        await this.importLocalStorageEstimates();
        
        await this.loadCustomerData();
        await this.loadEstimates();  // ← Zmienione z loadOrders
        this.attachEventListeners();
    }

    // Import estimates from localStorage to database
    async importLocalStorageEstimates() {
        try {
            const savedEstimates = JSON.parse(localStorage.getItem('savedEstimates') || '[]');
            
            if (savedEstimates.length === 0) {
                return; // Nothing to import
            }

            console.log(`Found ${savedEstimates.length} estimates in localStorage, importing...`);

            // Najpierw pobierz customer_id
            const { data: customer, error: customerError } = await supabaseClient
                .from('customers')
                .select('id')
                .eq('user_id', this.currentUser.id)
                .single();

            if (customerError) throw customerError;

            // Convert each estimate to order format
            const orders = savedEstimates.map(estimate => ({
                customer_id: customer.id,  // ← Używa customer.id!
                status: 'saved',
                total_price: estimate.price || estimate.total_price || 0,
                window_spec: estimate,
                created_at: estimate.timestamp || new Date().toISOString()
            }));

            // Insert into database
            const { data, error } = await supabaseClient
                .from('orders')
                .insert(orders)
                .select();

            if (error) throw error;

            console.log(`Successfully imported ${data.length} estimates`);

            // Clear localStorage after successful import
            localStorage.removeItem('savedEstimates');
            
            // Show success message
            this.showSuccessMessage(`${data.length} saved estimate(s) imported to your account!`);

        } catch (error) {
            console.error('Error importing localStorage estimates:', error);
            // Don't show error to user - it's a background operation
        }
    }

    // Show success message
    showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }

    // Load customer data from database
    async loadCustomerData() {
        try {
            const { data, error } = await supabaseClient
                .from('customers')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error) throw error;

            this.customerData = data;
            console.log('Customer data loaded:', data);  // Debug
            this.updateCustomerInfo();
        } catch (error) {
            console.error('Error loading customer data:', error);
            this.showError('Failed to load customer information');
        }
    }

    // Update customer info in UI
    updateCustomerInfo() {
        if (!this.customerData) return;

        document.getElementById('customer-name').textContent = 
            `Welcome Back, ${this.customerData.full_name.split(' ')[0]}`;
        document.getElementById('customer-fullname').textContent = this.customerData.full_name;
        document.getElementById('customer-email').textContent = this.customerData.email;
        document.getElementById('customer-phone').textContent = this.customerData.phone || 'Not provided';
        
        const memberSince = new Date(this.customerData.created_at);
        document.getElementById('customer-since').textContent = 
            memberSince.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }

    // Load estimates from database
    async loadEstimates() {
        try {
            // Sprawdź czy mamy customer data
            if (!this.customerData || !this.customerData.id) {
                console.error('Customer data not loaded yet');
                return;
            }

            const { data, error } = await supabaseClient
                .from('estimates')
                .select(`
                    *,
                    estimate_items (*)
                `)
                .eq('customer_id', this.customerData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('Estimates loaded:', data);  // Debug
            this.orders = data || [];  // Używamy tej samej zmiennej dla kompatybilności z resztą kodu
            this.updateStats();
            this.renderOrders();
        } catch (error) {
            console.error('Error loading estimates:', error);
            this.showError('Failed to load estimates');
        }
    }

    // Update statistics
    updateStats() {
        const drafts = this.orders.filter(o => o.status === 'draft').length;
        const sent = this.orders.filter(o => o.status === 'sent').length;
        const approved = this.orders.filter(o => o.status === 'approved').length;

        document.getElementById('stat-estimates').textContent = drafts + sent;  // Draft + Sent = Total Estimates
        document.getElementById('stat-orders').textContent = approved;  // Approved = Ready for Production
        document.getElementById('stat-completed').textContent = this.orders.filter(o => o.status === 'ordered').length;  // Ordered
    }

    // Render orders list
    renderOrders() {
        const container = document.getElementById('orders-container');
        
        // Filter orders based on current filter
        let filteredOrders = this.orders;
        if (this.currentFilter !== 'all') {
            filteredOrders = this.orders.filter(o => o.status === this.currentFilter);
        }

        if (filteredOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No orders found</h3>
                    <p>Start by creating a new estimate for your windows</p>
                    <a href="build-your-own-windows.html">
                        <button class="btn">Create Estimate</button>
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.renderOrderCard(order)).join('');
    }

    // Render single order card
    renderOrderCard(order) {
        const statusConfig = this.getStatusConfig(order.status);
        const createdDate = new Date(order.created_at).toLocaleDateString('en-GB');
        const itemCount = order.estimate_items?.length || 0;

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div>
                        <h3>Estimate #${order.estimate_number || order.id.substring(0, 8).toUpperCase()}</h3>
                        <p class="order-date">Created: ${createdDate}</p>
                    </div>
                    <span class="status-badge status-${order.status}">${statusConfig.label}</span>
                </div>

                <div class="order-body">
                    <div class="order-info">
                        <div class="info-row">
                            <span class="info-label">Windows:</span>
                            <span class="info-value">${itemCount} window${itemCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Total:</span>
                            <span class="info-value price">£${this.formatPrice(order.total_price)}</span>
                        </div>
                        ${order.deposit_amount ? `
                        <div class="info-row">
                            <span class="info-label">Deposit:</span>
                            <span class="info-value ${order.deposit_paid ? 'paid' : 'unpaid'}">
                                £${this.formatPrice(order.deposit_amount)} 
                                ${order.deposit_paid ? '✓ Paid' : '⚠ Pending'}
                            </span>
                        </div>
                        ` : ''}
                    </div>

                    ${this.renderOrderProgress(order)}
                </div>

                <div class="order-footer">
                    <button class="btn-secondary" onclick="dashboard.viewOrderDetails('${order.id}')">
                        View Details
                    </button>
                    ${order.status === 'saved' ? `
                        <button class="btn" onclick="dashboard.placeOrder('${order.id}')">
                            Place Order
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Render order progress timeline
    renderOrderProgress(order) {
        const timeline = [
            { status: 'saved', label: 'Saved Estimate', icon: '📋' },
            { status: 'pending', label: 'Pending', icon: '⏳' },
            { status: 'confirmed', label: 'Confirmed', icon: '✓' },
            { status: 'in_production', label: 'Production', icon: '🔨' },
            { status: 'completed', label: 'Completed', icon: '✅' }
        ];

        const currentIndex = timeline.findIndex(t => t.status === order.status);

        return `
            <div class="order-timeline">
                ${timeline.map((step, index) => `
                    <div class="timeline-step ${index <= currentIndex ? 'active' : ''} ${index === currentIndex ? 'current' : ''}">
                        <div class="timeline-icon">${step.icon}</div>
                        <div class="timeline-label">${step.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Get status configuration
    getStatusConfig(status) {
        const configs = {
            draft: { label: 'Draft', color: '#6c757d' },
            sent: { label: 'Sent to Customer', color: '#17a2b8' },
            approved: { label: 'Approved', color: '#28a745' },
            ordered: { label: 'In Production', color: '#007bff' },
            cancelled: { label: 'Cancelled', color: '#dc3545' }
        };
        return configs[status] || configs.draft;
    }

    // Format price
    formatPrice(price) {
        return new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    // View order details
    async viewOrderDetails(orderId) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    order_items (*),
                    order_timeline (*)
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            this.showOrderModal(data);
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('Failed to load order details');
        }
    }

    // Show order detail modal
    showOrderModal(order) {
        const modal = document.getElementById('order-modal');
        const content = document.getElementById('order-detail-content');

        const itemsHTML = order.order_items.map(item => `
            <div class="order-item-detail">
                <h4>${item.window_type || 'Custom Window'}</h4>
                <div class="item-specs">
                    <p><strong>Dimensions:</strong> ${item.width}mm × ${item.height}mm</p>
                    <p><strong>Glazing:</strong> ${item.glazing_type || 'Standard'}</p>
                    <p><strong>Colour:</strong> ${item.colour || 'White'}</p>
                    ${item.hardware ? `<p><strong>Hardware:</strong> ${item.hardware}</p>` : ''}
                    <p class="item-price"><strong>Price:</strong> £${this.formatPrice(item.price)}</p>
                </div>
            </div>
        `).join('');

        const timelineHTML = order.order_timeline?.length > 0 ? `
            <div class="detail-timeline">
                <h3>Order History</h3>
                ${order.order_timeline.map(event => `
                    <div class="timeline-event">
                        <span class="event-date">${new Date(event.created_at).toLocaleString('en-GB')}</span>
                        <span class="event-text">${event.status_change}</span>
                        ${event.notes ? `<p class="event-notes">${event.notes}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : '';

        content.innerHTML = `
            <h2>Order #${order.order_number || order.id.substring(0, 8).toUpperCase()}</h2>
            <div class="detail-status">
                <span class="status-badge status-${order.status}">${this.getStatusConfig(order.status).label}</span>
            </div>
            
            <div class="detail-section">
                <h3>Order Items</h3>
                ${itemsHTML}
            </div>

            <div class="detail-section">
                <h3>Order Summary</h3>
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>£${this.formatPrice(order.total_price)}</span>
                </div>
                ${order.deposit_amount ? `
                <div class="summary-row">
                    <span>Deposit Required:</span>
                    <span class="${order.deposit_paid ? 'paid' : 'unpaid'}">
                        £${this.formatPrice(order.deposit_amount)}
                        ${order.deposit_paid ? '✓' : '⚠'}
                    </span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span><strong>Total:</strong></span>
                    <span><strong>£${this.formatPrice(order.total_price)}</strong></span>
                </div>
            </div>

            ${timelineHTML}

            <div class="modal-actions">
                ${!order.deposit_paid && order.deposit_amount ? `
                    <button class="btn" onclick="dashboard.payDeposit('${order.id}')">
                        Pay Deposit
                    </button>
                ` : ''}
                <button class="btn-secondary" onclick="dashboard.closeModal()">
                    Close
                </button>
            </div>
        `;

        modal.style.display = 'block';
    }

    // Close modal
    closeModal() {
        document.getElementById('order-modal').style.display = 'none';
    }

    // Place order (change status from saved to pending)
    async placeOrder(orderId) {
        if (!confirm('Are you sure you want to place this order? Our team will contact you shortly to arrange measurements.')) {
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('orders')
                .update({ status: 'pending' })
                .eq('id', orderId);

            if (error) throw error;

            // Add timeline event
            await supabaseClient
                .from('order_timeline')
                .insert([{
                    order_id: orderId,
                    status_change: 'Order placed by customer - awaiting contact',
                    created_at: new Date().toISOString()
                }]);

            alert('Order placed successfully! We will contact you soon to arrange measurements.');
            await this.loadOrders();
        } catch (error) {
            console.error('Error placing order:', error);
            this.showError('Failed to place order');
        }
    }

    // Pay deposit (placeholder - would integrate with payment gateway)
    async payDeposit(orderId) {
        alert('Payment integration coming soon. Please contact us to arrange deposit payment.');
        // TODO: Integrate with Stripe/PayPal
    }

    // Attach event listeners
    attachEventListeners() {
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderOrders();
            });
        });

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('order-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    // Show error message
    showError(message) {
        alert(message); // Simple for now, can be improved with toast notifications
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new CustomerDashboard();
});