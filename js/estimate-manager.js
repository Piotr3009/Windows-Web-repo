// estimate-manager.js - Zarządzanie wycenami według nowej logiki

class EstimateManager {
    constructor() {
        this.currentEstimate = null; // Aktualna wycena
        this.currentCustomer = null; // Zalogowany klient
        this.init();
    }

    async init() {
        // Pobierz zalogowanego użytkownika
        const user = await getCurrentUser();
        if (user) {
            await this.loadCustomer(user.id);
            await this.loadOrCreateDraftEstimate();
        }

        // Inicjalizuj przyciski
        this.initializeButtons();
    }

    // Pobierz dane klienta
    async loadCustomer(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('customers')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            this.currentCustomer = data;
            console.log('Customer loaded:', data.customer_code);
        } catch (error) {
            console.error('Error loading customer:', error);
        }
    }

    // Załaduj lub utwórz draft estimate
    async loadOrCreateDraftEstimate() {
        try {
            // Sprawdź czy jest już draft
            const { data: drafts, error: draftError } = await supabaseClient
                .from('estimates')
                .select('*')
                .eq('customer_id', this.currentCustomer.id)
                .eq('status', 'draft')
                .order('created_at', { ascending: false })
                .limit(1);

            if (draftError) throw draftError;

            if (drafts && drafts.length > 0) {
                // Mamy już draft - użyj go
                this.currentEstimate = drafts[0];
                console.log('Using existing draft:', this.currentEstimate.estimate_number);
            } else {
                // Nie ma draftu - pytaj czy utworzyć nowy
                console.log('No draft estimate found. User needs to create one.');
                this.currentEstimate = null;
            }

            this.updateUI();
        } catch (error) {
            console.error('Error loading draft estimate:', error);
        }
    }

    // Utwórz nową wycenę
    async createNewEstimate(projectName, deliveryAddress) {
        try {
            if (!this.currentCustomer) {
                throw new Error('Customer not loaded');
            }

            // Pobierz nowy estimate_number z funkcji SQL
            const { data: numberData, error: numberError } = await supabaseClient
                .rpc('generate_estimate_number', { 
                    cust_id: this.currentCustomer.id 
                });

            if (numberError) throw numberError;

            const estimateNumber = numberData;
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 30); // 30 dni ważności

            // Utwórz estimate
            const { data: estimate, error: estimateError } = await supabaseClient
                .from('estimates')
                .insert([{
                    estimate_number: estimateNumber,
                    customer_id: this.currentCustomer.id,
                    project_name: projectName,
                    delivery_address: deliveryAddress,
                    status: 'draft',
                    valid_until: validUntil.toISOString().split('T')[0]
                }])
                .select()
                .single();

            if (estimateError) throw estimateError;

            this.currentEstimate = estimate;
            console.log('New estimate created:', estimateNumber);

            this.updateUI();
            this.showToast(`✅ New estimate created: ${estimateNumber}`, 'success');

            return estimate;
        } catch (error) {
            console.error('Error creating estimate:', error);
            this.showToast('❌ Error creating estimate', 'error');
            throw error;
        }
    }

    // Dodaj okno do wyceny
    async addWindowToEstimate(windowConfig, price) {
        try {
            // SPRAWDŹ CZY ZALOGOWANY
            const user = await getCurrentUser();
            
            if (!user) {
                // NIEZALOGOWANY - zapisz do localStorage
                this.saveToLocalStorage(windowConfig, price);
                return;
            }
            
            // ZALOGOWANY - kontynuuj z bazą danych
            if (!this.currentEstimate) {
                // Nie ma aktualnej wyceny - pokaż modal tworzenia
                this.showCreateEstimateModal();
                return;
            }

            // Pobierz liczbę okien w tej wycenie
            const { data: items, error: countError } = await supabaseClient
                .from('estimate_items')
                .select('window_number')
                .eq('estimate_id', this.currentEstimate.id)
                .order('window_number', { ascending: false })
                .limit(1);

            if (countError) throw countError;

            // Wygeneruj numer okna (W1, W2, W3...)
            let windowNumber = 'W1';
            if (items && items.length > 0) {
                const lastNumber = parseInt(items[0].window_number.substring(1));
                windowNumber = `W${lastNumber + 1}`;
            }

            // Zapisz okno
            const { data: item, error: itemError } = await supabaseClient
                .from('estimate_items')
                .insert([{
                    estimate_id: this.currentEstimate.id,
                    window_number: windowNumber,
                    width: windowConfig.width,
                    height: windowConfig.height,
                    measurement_type: windowConfig.measurementType,
                    
                    // NOWE: Oryginalne wymiary (przed brick-to-brick adjustment)
                    original_width: windowConfig.originalWidth,
                    original_height: windowConfig.originalHeight,
                    
                    frame_type: windowConfig.frameType,
                    glass_type: windowConfig.glassType,
                    
                    // NOWE: Glass specification
                    glass_spec: windowConfig.glassSpec,
                    glass_finish: windowConfig.glassFinish,
                    frosted_location: windowConfig.frostedLocation,
                    
                    opening_type: windowConfig.openingType,
                    color_type: windowConfig.colorType,
                    color_single: windowConfig.colorSingle,
                    color_interior: windowConfig.colorInterior,
                    color_exterior: windowConfig.colorExterior,
                    
                    // NOWE: Custom exterior color
                    custom_exterior_color: windowConfig.customExteriorColor,
                    
                    upper_bars: windowConfig.upperBars ? JSON.stringify(windowConfig.upperBars) : null,
                    lower_bars: windowConfig.lowerBars ? JSON.stringify(windowConfig.lowerBars) : null,
                    horns: windowConfig.horns,
                    
                    // ZMIENIONE: ironmongery jako JSONB (nie VARCHAR)
                    ironmongery: windowConfig.ironmongery ? JSON.stringify(windowConfig.ironmongery) : null,
                    
                    // NOWE: Ironmongery finish
                    ironmongery_finish: windowConfig.ironmongeryFinish,
                    
                    pas24: windowConfig.pas24 || false,
                    quantity: windowConfig.quantity || 1,
                    unit_price: price.unitPrice,
                    total_price: price.totalPrice,
                    specification: JSON.stringify(windowConfig)
                }])
                .select()
                .single();

            if (itemError) throw itemError;

            console.log('Window added:', windowNumber);
            this.showToast(`✅ ${windowNumber} added to ${this.currentEstimate.estimate_number}`, 'success');

            // Odśwież estimate (total_price zmieni się przez trigger)
            await this.refreshCurrentEstimate();

            return item;
        } catch (error) {
            console.error('Error adding window:', error);
            this.showToast('❌ Error adding window', 'error');
            throw error;
        }
    }

    // Odśwież aktualną wycenę
    async refreshCurrentEstimate() {
        if (!this.currentEstimate) return;

        try {
            const { data, error } = await supabaseClient
                .from('estimates')
                .select('*')
                .eq('id', this.currentEstimate.id)
                .single();

            if (error) throw error;

            this.currentEstimate = data;
            this.updateUI();
        } catch (error) {
            console.error('Error refreshing estimate:', error);
        }
    }

    // Pokaż modal tworzenia nowej wyceny
    showCreateEstimateModal() {
        const modal = document.getElementById('create-estimate-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Zamknij modal
    closeCreateEstimateModal() {
        const modal = document.getElementById('create-estimate-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Obsługa formularza tworzenia wyceny
    async handleCreateEstimateForm(event) {
        event.preventDefault();

        const projectName = document.getElementById('estimate-project-name').value.trim();
        const deliveryAddress = document.getElementById('estimate-delivery-address').value.trim();

        if (!projectName) {
            this.showToast('Project name is required', 'error');
            return;
        }

        try {
            await this.createNewEstimate(projectName, deliveryAddress);
            this.closeCreateEstimateModal();

            // Reset formularza
            document.getElementById('create-estimate-form').reset();
        } catch (error) {
            console.error('Error in form submission:', error);
        }
    }

    // Inicjalizuj przyciski
    initializeButtons() {
        // Przycisk "Add to Estimate"
        const addBtn = document.getElementById('add-to-estimate');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                // Pobierz konfigurację okna z konfiguratora
                const windowConfig = this.getCurrentWindowConfig();
                const price = this.getCurrentPrice();

                await this.addWindowToEstimate(windowConfig, price);
            });
        }

        // Przycisk "Create New Estimate"
        const createBtn = document.getElementById('create-new-estimate-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateEstimateModal();
            });
        }

        // Przycisk "View My Estimates"
        const viewBtn = document.getElementById('view-my-estimates');
        if (viewBtn) {
            viewBtn.addEventListener('click', async () => {
                const user = await getCurrentUser();
                
                if (user) {
                    // ZALOGOWANY - idź do dashboardu
                    window.location.href = 'customer-dashboard.html';
                } else {
                    // NIEZALOGOWANY - sprawdź localStorage
                    const savedEstimates = JSON.parse(localStorage.getItem('windowEstimates') || '[]');
                    
                    if (savedEstimates.length > 0) {
                        // Ma zapisane okna - zaproponuj logowanie
                        if (confirm(`You have ${savedEstimates.length} window(s) saved locally.\n\nLogin to sync your estimates and access full features?`)) {
                            localStorage.setItem('redirect_after_login', 'customer-dashboard.html');
                            window.location.href = 'login.html';
                        }
                    } else {
                        // Nie ma nic - zaproponuj logowanie
                        if (confirm('Login to create and manage your estimates?')) {
                            localStorage.setItem('redirect_after_login', 'customer-dashboard.html');
                            window.location.href = 'login.html';
                        }
                    }
                }
            });
            
            // Zaktualizuj licznik przy inicjalizacji
            this.updateLocalStorageCounter();
        }

        // Formularz tworzenia wyceny
        const form = document.getElementById('create-estimate-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateEstimateForm(e));
        }

        // Zamknięcie modala
        const closeBtn = document.querySelector('#create-estimate-modal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCreateEstimateModal());
        }

        // Click outside modal
        const modal = document.getElementById('create-estimate-modal');
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCreateEstimateModal();
                }
            });
        }
    }

    // Pobierz aktualną konfigurację okna
    getCurrentWindowConfig() {
        // Użyj window.currentConfig który ma WSZYSTKIE dane ze specyfikacji
        if (window.currentConfig) {
            return {
                // Wymiary - ZAWSZE wymiar okna (nie brick-to-brick)
                width: window.currentConfig.actualFrameWidth || window.currentConfig.width,
                height: window.currentConfig.actualFrameHeight || window.currentConfig.height,
                
                // Informacja o pomiarze (do wyświetlenia)
                measurementType: window.currentConfig.measurementType,
                originalWidth: window.currentConfig.width,  // Oryginalny pomiar (brick-to-brick)
                originalHeight: window.currentConfig.height,
                
                // Typ ramy
                frameType: window.currentConfig.frameType,
                
                // Szkło
                glassType: window.currentConfig.glassType,
                glassSpec: window.currentConfig.glassSpec,
                glassFinish: window.currentConfig.glassFinish,
                frostedLocation: window.currentConfig.frostedLocation,
                
                // Opening
                openingType: window.currentConfig.openingType,
                
                // Kolory
                colorType: window.currentConfig.colorType,
                colorSingle: window.currentConfig.colorSingle,
                colorInterior: window.currentConfig.colorInterior,
                colorExterior: window.currentConfig.colorExterior,
                customExteriorColor: window.currentConfig.customExteriorColor,
                
                // Bary - KOMPLETNE dane z bars manager
                upperBars: window.barsUnifiedManager ? {
                    pattern: window.barsUnifiedManager.getState().upper.pattern,
                    bars: window.barsUnifiedManager.getState().upper.bars,
                    details: window.barsUnifiedManager.getBarDetails('upper')
                } : null,
                
                lowerBars: window.barsUnifiedManager ? {
                    pattern: window.barsUnifiedManager.getState().lower.pattern,
                    bars: window.barsUnifiedManager.getState().lower.bars,
                    details: window.barsUnifiedManager.getBarDetails('lower')
                } : null,
                
                // Detale
                horns: window.currentConfig.horns,
                
                // Ironmongery - KOMPLETNA lista produktów
                ironmongery: window.ironmongeryController ? 
                    window.ironmongeryController.selectedProducts : null,
                ironmongeryFinish: window.ironmongeryController ? 
                    window.ironmongeryController.selectedFinish : null,
                
                // PAS24
                pas24: window.currentConfig.pas24,
                
                // Quantity
                quantity: window.currentConfig.quantity || 1,
                
                // FULL BACKUP - cała konfiguracja
                fullConfig: { ...window.currentConfig }
            };
        }

        // Fallback - jeśli window.currentConfig nie istnieje
        console.warn('window.currentConfig not found - using fallback');
        return null;
    }

    // Pobierz aktualną cenę
    getCurrentPrice() {
        const totalPrice = parseFloat(document.getElementById('total-price')?.textContent) || 0;
        const quantity = parseInt(document.getElementById('window-quantity')?.value) || 1;
        const unitPrice = quantity > 1 ? totalPrice / quantity : totalPrice;

        return {
            unitPrice: unitPrice,
            totalPrice: totalPrice
        };
    }

    // Aktualizuj UI
    updateUI() {
        // Pokaż aktualną wycenę w nagłówku
        const estimateInfo = document.getElementById('current-estimate-info');
        if (estimateInfo) {
            if (this.currentEstimate) {
                estimateInfo.innerHTML = `
                    <strong>Current Estimate:</strong> ${this.currentEstimate.estimate_number} 
                    - ${this.currentEstimate.project_name}
                    <span style="color: #666; margin-left: 10px;">Total: £${this.currentEstimate.total_price || 0}</span>
                `;
                estimateInfo.style.display = 'block';
            } else {
                estimateInfo.innerHTML = `
                    <span style="color: #999;">No active estimate. Click "Create New Estimate" to start.</span>
                `;
                estimateInfo.style.display = 'block';
            }
        }

        // Zmień tekst przycisku "Add to Estimate"
        const addBtn = document.getElementById('add-to-estimate');
        if (addBtn) {
            if (this.currentEstimate) {
                addBtn.textContent = `Add to ${this.currentEstimate.estimate_number}`;
                addBtn.disabled = false;
            } else {
                addBtn.textContent = 'Create Estimate First';
                addBtn.disabled = false; // Po kliknięciu pokaże modal
            }
        }
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;

        switch (type) {
            case 'success':
                toast.style.background = '#10b981';
                break;
            case 'error':
                toast.style.background = '#ef4444';
                break;
            case 'warning':
                toast.style.background = '#f59e0b';
                break;
            default:
                toast.style.background = '#3b82f6';
        }

        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Zapisz do localStorage (dla niezalogowanych użytkowników)
    saveToLocalStorage(windowConfig, price) {
        try {
            // Pobierz istniejące wyceny z localStorage
            const savedEstimates = JSON.parse(localStorage.getItem('windowEstimates') || '[]');
            
            // Wygeneruj numer okna (W1, W2, W3...)
            const windowNumber = `W${savedEstimates.length + 1}`;
            
            // Dodaj nowe okno
            const newWindow = {
                id: Date.now(),
                windowNumber: windowNumber,
                config: windowConfig,
                price: price,
                timestamp: new Date().toISOString()
            };
            
            savedEstimates.push(newWindow);
            
            // Zapisz z powrotem do localStorage
            localStorage.setItem('windowEstimates', JSON.stringify(savedEstimates));
            
            console.log('Window saved to localStorage:', windowNumber);
            this.showToast(`✅ ${windowNumber} saved locally. Login to sync your estimates.`, 'warning');
            
            // Zaktualizuj licznik w przycisku "View My Estimates"
            this.updateLocalStorageCounter();
            
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showToast('❌ Error saving window', 'error');
        }
    }

    // Zaktualizuj licznik okien w localStorage
    updateLocalStorageCounter() {
        const savedEstimates = JSON.parse(localStorage.getItem('windowEstimates') || '[]');
        const viewBtn = document.getElementById('view-my-estimates');
        
        if (viewBtn && savedEstimates.length > 0) {
            viewBtn.textContent = `View My Estimates (${savedEstimates.length})`;
        }
    }
}

// Inicjalizuj gdy strona jest gotowa
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.estimateManager = new EstimateManager();
    });
} else {
    window.estimateManager = new EstimateManager();
}