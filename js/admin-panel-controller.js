// Admin Panel Controller

class AdminPanel {
    constructor() {
        this.currentView = 'dashboard';
        this.currentUser = null;
        this.customers = [];
        this.orders = [];
        this.orderFilter = 'all';
        this.init();
    }

    async init() {
        try {
            console.log('Admin Panel initializing...');
            
            // Check if user is admin
            const user = await getCurrentUser();
            console.log('Current user:', user);
            
            if (!user) {
                console.log('No user logged in, redirecting to index');
                window.location.href = 'index.html';
                return;
            }

            const isAdminUser = await isAdmin();
            console.log('Is admin:', isAdminUser);
            
            if (!isAdminUser) {
                alert('Access denied. Admin privileges required.');
                window.location.href = 'index.html';
                return;
            }

            this.currentUser = user;
            console.log('Loading dashboard data...');
            await this.loadDashboardData();
            console.log('Dashboard data loaded, attaching listeners...');
            this.attachEventListeners();
            console.log('Admin Panel initialized successfully');
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            alert('Error loading admin panel: ' + error.message);
        }
    }

    // Attach event listeners
    attachEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
            });
        });

        // Logout
        document.getElementById('admin-logout').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });

        // Order filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.orderFilter = btn.dataset.status;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderOrdersTable();
            });
        });

        // Customer search
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCustomers(e.target.value);
            });
        }
    }

    // Switch between views
    switchView(view) {
        // Hide all views
        document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
        
        // Remove active from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Show selected view
        document.getElementById(`${view}-view`).classList.add('active');
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update title
        const titles = {
            dashboard: 'Dashboard',
            customers: 'Customers Management',
            orders: 'Orders Management',
            analytics: 'Analytics & Reports',
            pricing: 'Pricing Configuration'
        };
        document.getElementById('view-title').textContent = titles[view];
        
        this.currentView = view;
        
        // Load view-specific data
        switch(view) {
            case 'customers':
                this.loadCustomers();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'pricing':
                this.loadPricingConfig();
                break;
        }
    }

    // Load dashboard data
    async loadDashboardData() {
        try {
            // Load stats
            await this.loadStats();
            
            // Load recent orders
            await this.loadRecentOrders();
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    // Load statistics
    async loadStats() {
        try {
            console.log('Loading stats...');
            
            // Total customers
            const { count: customersCount, error: customersError } = await supabaseClient
                .from('customers')
                .select('*', { count: 'exact', head: true });
            
            if (customersError) {
                console.error('Error loading customers count:', customersError);
            }
            document.getElementById('total-customers').textContent = customersCount || 0;
            console.log('Customers count:', customersCount);

            // Total estimates
            const { count: estimatesCount, error: estimatesError } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'saved');
            
            if (estimatesError) {
                console.error('Error loading estimates count:', estimatesError);
            }
            document.getElementById('total-estimates').textContent = estimatesCount || 0;
            console.log('Estimates count:', estimatesCount);

            // Active orders
            const { count: activeCount, error: activeError } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'confirmed', 'in_production']);
            
            if (activeError) {
                console.error('Error loading active orders count:', activeError);
            }
            document.getElementById('active-orders').textContent = activeCount || 0;
            console.log('Active orders count:', activeCount);

            // Total revenue
            const { data: revenueData, error: revenueError } = await supabaseClient
                .from('orders')
                .select('total_price')
                .in('status', ['confirmed', 'production', 'transport', 'completed']);
            
            if (revenueError) {
                console.error('Error loading revenue:', revenueError);
            }
            const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
            document.getElementById('total-revenue').textContent = `£${this.formatPrice(totalRevenue)}`;
            console.log('Total revenue:', totalRevenue);

        } catch (error) {
            console.error('Error loading stats:', error);
            alert('Error loading dashboard statistics. Check console for details.');
        }
    }

    // Load recent orders for dashboard
    async loadRecentOrders() {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    customers (full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            const container = document.getElementById('recent-orders-list');
            
            if (!data || data.length === 0) {
                container.innerHTML = '<p class="no-data">No recent orders</p>';
                return;
            }

            container.innerHTML = data.map(order => `
                <div class="recent-order-item">
                    <div class="order-info">
                        <strong>#${order.id.substring(0, 8).toUpperCase()}</strong>
                        <span>${order.customers?.full_name || 'Unknown'}</span>
                    </div>
                    <div class="order-meta">
                        <span class="status-badge status-${order.status}">${this.formatStatus(order.status)}</span>
                        <span class="price">£${this.formatPrice(order.total_price)}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    // Load customers
    async loadCustomers() {
        try {
            const { data, error } = await supabaseClient
                .from('customers')
                .select(`
                    *,
                    orders (id, status)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.customers = data || [];
            this.renderCustomersTable();

        } catch (error) {
            console.error('Error loading customers:', error);
            document.getElementById('customers-tbody').innerHTML = 
                '<tr><td colspan="7" class="error">Failed to load customers</td></tr>';
        }
    }

    // Render customers table
    renderCustomersTable() {
        const tbody = document.getElementById('customers-tbody');
        
        if (this.customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No customers found</td></tr>';
            return;
        }

        tbody.innerHTML = this.customers.map(customer => {
            const orders = customer.orders || [];
            const totalOrders = orders.filter(o => o.status !== 'saved').length;
            const estimates = orders.filter(o => o.status === 'saved').length;
            const registeredDate = new Date(customer.created_at).toLocaleDateString('en-GB');

            return `
                <tr>
                    <td><strong>${customer.full_name}</strong></td>
                    <td>${customer.email}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${registeredDate}</td>
                    <td>${totalOrders}</td>
                    <td>${estimates}</td>
                    <td>
                        <button class="btn-small" onclick="adminPanel.viewCustomer('${customer.id}')">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Filter customers
    filterCustomers(query) {
        const filtered = this.customers.filter(c => 
            c.full_name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())
        );

        const tbody = document.getElementById('customers-tbody');
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No customers match your search</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(customer => {
            const orders = customer.orders || [];
            const totalOrders = orders.filter(o => o.status !== 'saved').length;
            const estimates = orders.filter(o => o.status === 'saved').length;
            const registeredDate = new Date(customer.created_at).toLocaleDateString('en-GB');

            return `
                <tr>
                    <td><strong>${customer.full_name}</strong></td>
                    <td>${customer.email}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${registeredDate}</td>
                    <td>${totalOrders}</td>
                    <td>${estimates}</td>
                    <td>
                        <button class="btn-small" onclick="adminPanel.viewCustomer('${customer.id}')">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Load orders
    async loadOrders() {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    customers (full_name, email),
                    order_items (id)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.orders = data || [];
            this.renderOrdersTable();

        } catch (error) {
            console.error('Error loading orders:', error);
            document.getElementById('orders-tbody').innerHTML = 
                '<tr><td colspan="8" class="error">Failed to load orders</td></tr>';
        }
    }

    // Render orders table
    renderOrdersTable() {
        const tbody = document.getElementById('orders-tbody');
        
        // Filter orders
        let filtered = this.orders;
        if (this.orderFilter !== 'all') {
            filtered = this.orders.filter(o => o.status === this.orderFilter);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');
            const itemCount = order.order_items?.length || 0;
            const depositStatus = order.deposit_paid ? 
                `<span class="paid">✓ £${this.formatPrice(order.deposit_amount)}</span>` : 
                `<span class="unpaid">⚠ £${this.formatPrice(order.deposit_amount || 0)}</span>`;

            return `
                <tr>
                    <td><strong>#${order.id.substring(0, 8).toUpperCase()}</strong></td>
                    <td>${order.customers?.full_name || 'Unknown'}</td>
                    <td>${orderDate}</td>
                    <td>${itemCount}</td>
                    <td>£${this.formatPrice(order.total_price)}</td>
                    <td>${order.deposit_amount ? depositStatus : 'N/A'}</td>
                    <td><span class="status-badge status-${order.status}">${this.formatStatus(order.status)}</span></td>
                    <td>
                        <button class="btn-small" onclick="adminPanel.editOrder('${order.id}')">Edit</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Edit order - show modal with status update options
    async editOrder(orderId) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    customers (full_name, email, phone),
                    order_items (*),
                    order_timeline (*)
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            this.showOrderEditModal(data);

        } catch (error) {
            console.error('Error loading order:', error);
            alert('Failed to load order details');
        }
    }

    // Show order edit modal
    showOrderEditModal(order) {
        const modal = document.getElementById('order-edit-modal');
        const content = document.getElementById('order-edit-content');

        content.innerHTML = `
            <h2>Edit Order #${order.id.substring(0, 8).toUpperCase()}</h2>
            
            <div class="order-edit-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${order.customers.full_name}</p>
                <p><strong>Email:</strong> ${order.customers.email}</p>
                <p><strong>Phone:</strong> ${order.customers.phone || 'N/A'}</p>
            </div>

            <div class="order-edit-section">
                <h3>Order Status</h3>
                <select id="order-status-select" class="status-select">
                    <option value="saved" ${order.status === 'saved' ? 'selected' : ''}>Saved Estimate</option>
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="in_production" ${order.status === 'in_production' ? 'selected' : ''}>In Production</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>

            <div class="order-edit-section">
                <h3>Deposit Status</h3>
                <label class="checkbox-label">
                    <input type="checkbox" id="deposit-paid-checkbox" ${order.deposit_paid ? 'checked' : ''}>
                    Deposit Paid (£${this.formatPrice(order.deposit_amount || 0)})
                </label>
            </div>

            <div class="order-edit-section">
                <h3>Add Note</h3>
                <textarea id="order-note" placeholder="Add a note to order timeline..." rows="3"></textarea>
            </div>

            <div class="modal-actions">
                <button class="btn" onclick="adminPanel.saveOrderChanges('${order.id}')">Save Changes</button>
                <button class="btn-secondary" onclick="adminPanel.closeOrderModal()">Cancel</button>
            </div>
        `;

        modal.style.display = 'block';
    }

    // Save order changes
    async saveOrderChanges(orderId) {
        const newStatus = document.getElementById('order-status-select').value;
        const depositPaid = document.getElementById('deposit-paid-checkbox').checked;
        const note = document.getElementById('order-note').value.trim();

        try {
            // Update order
            const { error: orderError } = await supabaseClient
                .from('orders')
                .update({
                    status: newStatus,
                    deposit_paid: depositPaid,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (orderError) throw orderError;

            // Add timeline entry if note provided
            if (note) {
                await supabaseClient
                    .from('order_timeline')
                    .insert([{
                        order_id: orderId,
                        status_change: `Status updated to: ${newStatus}`,
                        notes: note,
                        created_at: new Date().toISOString()
                    }]);
            }

            alert('Order updated successfully!');
            this.closeOrderModal();
            await this.loadOrders();

        } catch (error) {
            console.error('Error saving order:', error);
            alert('Failed to update order');
        }
    }

    // Close order modal
    closeOrderModal() {
        document.getElementById('order-edit-modal').style.display = 'none';
    }

    // Format price
    formatPrice(price) {
        return new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    // Format status for display
    formatStatus(status) {
        const statusLabels = {
            'saved': 'Saved Estimate',
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'in_production': 'In Production',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusLabels[status] || status;
    }

    // Export customers to CSV
    exportCustomers() {
        const csv = [
            ['Name', 'Email', 'Phone', 'Registered', 'Total Orders', 'Estimates'],
            ...this.customers.map(c => [
                c.full_name,
                c.email,
                c.phone || '',
                new Date(c.created_at).toLocaleDateString('en-GB'),
                c.orders?.filter(o => o.status !== 'saved').length || 0,
                c.orders?.filter(o => o.status === 'saved').length || 0
            ])
        ].map(row => row.join(',')).join('\n');

        this.downloadCSV(csv, 'customers.csv');
    }

    // Export orders to CSV
    exportOrders() {
        const csv = [
            ['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Deposit Paid', 'Status'],
            ...this.orders.map(o => [
                o.id.substring(0, 8).toUpperCase(),
                o.customers?.full_name || 'Unknown',
                new Date(o.created_at).toLocaleDateString('en-GB'),
                o.order_items?.length || 0,
                o.total_price,
                o.deposit_paid ? 'Yes' : 'No',
                o.status
            ])
        ].map(row => row.join(',')).join('\n');

        this.downloadCSV(csv, 'orders.csv');
    }

    // Download CSV helper
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Continue in part 2...

    // Load Analytics
    async loadAnalytics() {
        try {
            // Load funnel data
            await this.loadConversionFunnel();
            
            // Load revenue data
            await this.loadRevenueData();
            
            // Load popular products
            await this.loadPopularProducts();

        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    // Load conversion funnel
    async loadConversionFunnel() {
        try {
            // Get total visitors (from analytics_events)
            const { count: visitors } = await supabaseClient
                .from('analytics_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_name', 'page_visit');

            // Get registrations
            const { count: registrations } = await supabaseClient
                .from('customers')
                .select('*', { count: 'exact', head: true });

            // Get estimates
            const { count: estimates } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true });

            // Get confirmed orders
            const { count: orders } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'confirmed', 'in_production', 'completed']);

            // Update UI
            document.getElementById('analytics-visitors').textContent = visitors || 0;
            document.getElementById('analytics-registrations').textContent = registrations || 0;
            document.getElementById('analytics-estimates').textContent = estimates || 0;
            document.getElementById('analytics-orders').textContent = orders || 0;

            // Calculate percentages
            if (visitors > 0) {
                const regPercent = ((registrations / visitors) * 100).toFixed(1);
                document.getElementById('reg-percent').textContent = `${regPercent}%`;
            }

            if (registrations > 0) {
                const estPercent = ((estimates / registrations) * 100).toFixed(1);
                document.getElementById('est-percent').textContent = `${estPercent}%`;
            }

            if (estimates > 0) {
                const ordPercent = ((orders / estimates) * 100).toFixed(1);
                document.getElementById('ord-percent').textContent = `${ordPercent}%`;
            }

        } catch (error) {
            console.error('Error loading funnel:', error);
        }
    }

    // Load revenue data
    async loadRevenueData() {
        try {
            // Total revenue
            const { data: allOrders } = await supabaseClient
                .from('orders')
                .select('total_price')
                .in('status', ['confirmed', 'production', 'transport', 'completed']);

            const totalRevenue = allOrders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
            const avgOrder = allOrders?.length > 0 ? totalRevenue / allOrders.length : 0;

            // This month revenue
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            
            const { data: monthOrders } = await supabaseClient
                .from('orders')
                .select('total_price')
                .in('status', ['confirmed', 'production', 'transport', 'completed'])
                .gte('created_at', firstDay);

            const monthRevenue = monthOrders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

            // Update UI
            document.getElementById('revenue-total').textContent = `£${this.formatPrice(totalRevenue)}`;
            document.getElementById('revenue-avg').textContent = `£${this.formatPrice(avgOrder)}`;
            document.getElementById('revenue-month').textContent = `£${this.formatPrice(monthRevenue)}`;

        } catch (error) {
            console.error('Error loading revenue:', error);
        }
    }

    // Load popular products
    async loadPopularProducts() {
        try {
            const { data, error } = await supabaseClient
                .from('order_items')
                .select('window_type');

            if (error) throw error;

            // Count window types
            const counts = {};
            data?.forEach(item => {
                const type = item.window_type || 'Custom';
                counts[type] = (counts[type] || 0) + 1;
            });

            // Sort by count
            const sorted = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            // Display
            const container = document.getElementById('popular-products');
            
            if (sorted.length === 0) {
                container.innerHTML = '<p class="no-data">No product data available</p>';
                return;
            }

            container.innerHTML = sorted.map(([type, count]) => `
                <div class="product-item" style="display: flex; justify-content: space-between; padding: 12px; background: #f9f9f9; margin: 8px 0; border-radius: 5px;">
                    <span style="font-weight: 600;">${type}</span>
                    <span style="color: var(--secondary-color);">${count} orders</span>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading popular products:', error);
        }
    }

    // Load pricing config
    async loadPricingConfig() {
        try {
            // Load current config from database or use default
            const { data, error } = await supabaseClient
                .from('pricing_config')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                throw error;
            }

            const config = data || {
                base_price: 300,
                sqm_price: 150,
                multipliers: {
                    frame: { standard: 1, slim: 1.05 },
                    glass: { double: 1, triple: 1.15, passive: 1.25 },
                    opening: { both: 1, top: 0.95, bottom: 0.95, fixed: 0.9 },
                    color: { single: 1, dual: 1.1 },
                    bars: { none: 1, '2x2': 1.04, '3x3': 1.06, '6x6': 1.08 }
                }
            };

            // Populate base pricing
            document.getElementById('config-base-price').value = config.base_price;
            document.getElementById('config-sqm-price').value = config.sqm_price;

            // Populate multipliers
            this.renderMultipliersConfig(config.multipliers);

        } catch (error) {
            console.error('Error loading pricing config:', error);
        }
    }

    // Render multipliers config
    renderMultipliersConfig(multipliers) {
        const container = document.getElementById('multipliers-config');
        
        let html = '';
        
        for (const [category, options] of Object.entries(multipliers)) {
            html += `
                <div class="multiplier-category" style="margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px;">
                    <h4 style="color: var(--primary-color); margin-bottom: 15px; text-transform: capitalize;">${category}</h4>
                    <div class="config-grid">
            `;
            
            for (const [option, value] of Object.entries(options)) {
                html += `
                    <div class="config-item">
                        <label>${option}:</label>
                        <input type="number" 
                               step="0.01" 
                               value="${value}" 
                               data-category="${category}" 
                               data-option="${option}"
                               class="multiplier-input">
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    // Save pricing config
    async savePricingConfig() {
        try {
            const basePrice = parseFloat(document.getElementById('config-base-price').value);
            const sqmPrice = parseFloat(document.getElementById('config-sqm-price').value);

            // Collect all multipliers
            const multipliers = {};
            document.querySelectorAll('.multiplier-input').forEach(input => {
                const category = input.dataset.category;
                const option = input.dataset.option;
                const value = parseFloat(input.value);

                if (!multipliers[category]) {
                    multipliers[category] = {};
                }
                multipliers[category][option] = value;
            });

            // Save to database
            const { error } = await supabaseClient
                .from('pricing_config')
                .upsert({
                    id: 1, // Single config row
                    base_price: basePrice,
                    sqm_price: sqmPrice,
                    multipliers: multipliers,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            alert('Pricing configuration saved successfully!');

            // Also update the config.js file (would need backend endpoint)
            // For now, just show success

        } catch (error) {
            console.error('Error saving pricing config:', error);
            alert('Failed to save pricing configuration');
        }
    }

    // Reset pricing config
    async resetPricingConfig() {
        if (!confirm('Are you sure you want to reset pricing to default values?')) {
            return;
        }

        try {
            const defaultConfig = {
                id: 1,
                base_price: 300,
                sqm_price: 150,
                multipliers: {
                    frame: { standard: 1, slim: 1.05 },
                    glass: { double: 1, triple: 1.15, passive: 1.25 },
                    opening: { both: 1, top: 0.95, bottom: 0.95, fixed: 0.9 },
                    color: { single: 1, dual: 1.1 },
                    bars: { none: 1, '2x2': 1.04, '3x3': 1.06, '6x6': 1.08 }
                },
                updated_at: new Date().toISOString()
            };

            const { error } = await supabaseClient
                .from('pricing_config')
                .upsert(defaultConfig);

            if (error) throw error;

            alert('Pricing reset to default values!');
            await this.loadPricingConfig();

        } catch (error) {
            console.error('Error resetting pricing:', error);
            alert('Failed to reset pricing');
        }
    }

    // View customer details
    viewCustomer(customerId) {
        // Switch to orders view and filter by customer
        this.switchView('orders');
        
        // Filter orders for this customer
        const filteredOrders = this.orders.filter(o => o.customer_id === customerId);
        
        const tbody = document.getElementById('orders-tbody');
        
        if (filteredOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">This customer has no orders yet</td></tr>';
            return;
        }

        tbody.innerHTML = filteredOrders.map(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');
            const itemCount = order.order_items?.length || 0;
            const depositStatus = order.deposit_paid ? 
                `<span class="paid">✓ £${this.formatPrice(order.deposit_amount)}</span>` : 
                `<span class="unpaid">⚠ £${this.formatPrice(order.deposit_amount || 0)}</span>`;

            return `
                <tr>
                    <td><strong>#${order.id.substring(0, 8).toUpperCase()}</strong></td>
                    <td>${order.customers?.full_name || 'Unknown'}</td>
                    <td>${orderDate}</td>
                    <td>${itemCount}</td>
                    <td>£${this.formatPrice(order.total_price)}</td>
                    <td>${order.deposit_amount ? depositStatus : 'N/A'}</td>
                    <td><span class="status-badge status-${order.status}">${this.formatStatus(order.status)}</span></td>
                    <td>
                        <button class="btn-small" onclick="adminPanel.editOrder('${order.id}')">Edit</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});