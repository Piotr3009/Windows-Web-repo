// Estimate Handler - obsługa zapisywania wycen
class EstimateHandler {
    constructor() {
        this.initializeButtons();
    }

    initializeButtons() {
        const addToEstimateBtn = document.getElementById('add-to-estimate');
        const viewMyEstimatesBtn = document.getElementById('view-my-estimates');

        console.log('EstimateHandler initialized');
        console.log('Add to Estimate button:', addToEstimateBtn);
        console.log('View My Estimates button:', viewMyEstimatesBtn);

        if (addToEstimateBtn) {
            addToEstimateBtn.addEventListener('click', () => {
                console.log('Add to Estimate clicked');
                this.handleAddToEstimate();
            });
        }

        if (viewMyEstimatesBtn) {
            viewMyEstimatesBtn.addEventListener('click', () => {
                console.log('View My Estimates clicked');
                this.handleViewMyEstimates();
            });
        }
    }

    // Główna funkcja - dodaj do wyceny
    async handleAddToEstimate() {
        try {
            // Pobierz aktualną konfigurację okna
            const config = this.getCurrentConfiguration();
            
            if (!config) {
                this.showToast('Please configure your window first', 'error');
                return;
            }

            // Sprawdź czy użytkownik jest zalogowany
            const user = await getCurrentUser();

            if (user) {
                // ZALOGOWANY - zapisz w Supabase
                await this.saveToDatabase(user, config);
            } else {
                // NIEZALOGOWANY - zapisz w localStorage
                this.saveToLocalStorage(config);
            }
        } catch (error) {
            console.error('Error adding to estimate:', error);
            this.showToast('Error saving estimate. Please try again.', 'error');
        }
    }

    // Funkcja - pokaż moje wyceny
    async handleViewMyEstimates() {
        console.log('handleViewMyEstimates called');
        try {
            // Sprawdź czy użytkownik jest zalogowany
            const user = await getCurrentUser();
            console.log('Current user:', user);

            if (user) {
                // ZALOGOWANY - przekieruj do dashboardu
                console.log('User logged in, redirecting to dashboard');
                window.location.href = 'customer-dashboard.html';
            } else {
                // NIEZALOGOWANY - przekieruj do logowania
                console.log('User not logged in, redirecting to login');
                // Po zalogowaniu automatycznie przeniesie do dashboardu
                localStorage.setItem('redirect_after_login', 'customer-dashboard.html');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error viewing estimates:', error);
            this.showToast('Error loading estimates. Please try again.', 'error');
        }
    }

    // Zapisz w bazie danych (dla zalogowanych)
    async saveToDatabase(user, config) {
        try {
            // Pobierz customer_id z tabeli customers
            const { data: customer, error: customerError } = await supabaseClient
                .from('customers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (customerError) {
                throw customerError;
            }

            // Zapisz zamówienie ze statusem 'saved'
            const { data, error } = await supabaseClient
                .from('orders')
                .insert([{
                    customer_id: customer.id,
                    status: 'saved',
                    configuration: config,
                    total_price: config.price || 0,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            this.showToast('✓ Added to your estimates', 'success');
        } catch (error) {
            console.error('Database save error:', error);
            throw error;
        }
    }

    // Zapisz w localStorage (dla niezalogowanych)
    saveToLocalStorage(config) {
        try {
            // Pobierz istniejące wyceny
            const savedEstimates = JSON.parse(localStorage.getItem('savedEstimates') || '[]');
            
            // Dodaj nową wycenę
            savedEstimates.push({
                ...config,
                savedAt: new Date().toISOString(),
                id: Date.now() // tymczasowe ID
            });

            // Zapisz z powrotem
            localStorage.setItem('savedEstimates', JSON.stringify(savedEstimates));

            this.showToast('✓ Saved locally. Login to sync your estimates.', 'warning');
        } catch (error) {
            console.error('localStorage save error:', error);
            throw error;
        }
    }

    // Pobierz aktualną konfigurację okna z formularza
    getCurrentConfiguration() {
        try {
            // Sprawdź czy istnieje globalny obiekt z konfiguracją
            if (window.currentConfiguration) {
                return window.currentConfiguration;
            }

            // Jeśli nie ma globalnego obiektu, zbierz dane z formularza
            const config = {
                // Wymiary
                width: document.getElementById('width')?.value || 1000,
                height: document.getElementById('height')?.value || 1500,
                quantity: parseInt(document.getElementById('window-quantity')?.value) || 1,
                
                // Typ pomiaru
                measurementType: document.querySelector('input[name="measurement-type"]:checked')?.value || 'brick-to-brick',
                
                // Typ ramy
                frameType: document.querySelector('input[name="frame-type"]:checked')?.value || 'hardwood',
                
                // Kolory
                colorType: document.querySelector('input[name="color-type"]:checked')?.value || 'single',
                
                // Szkło
                glassType: document.querySelector('input[name="glass-type"]:checked')?.value || 'double',
                
                // Ironmongery
                ironmongery: document.getElementById('ironmongery')?.value || 'none',
                
                // Horns
                horns: document.getElementById('horns')?.value || 'none',
                
                // Cena - pobierz z displayu jeśli istnieje
                price: this.getCurrentPrice(),
                
                // Timestamp
                timestamp: new Date().toISOString()
            };

            return config;
        } catch (error) {
            console.error('Error getting configuration:', error);
            return null;
        }
    }

    // Pobierz aktualną cenę
    getCurrentPrice() {
        const priceElement = document.getElementById('total-price');
        if (priceElement) {
            const priceText = priceElement.textContent.replace(/[£,]/g, '');
            return parseFloat(priceText) || 0;
        }
        return 0;
    }

    // Pokaż powiadomienie toast
    showToast(message, type = 'info') {
        // Usuń istniejące toasty
        const existingToast = document.querySelector('.estimate-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Stwórz nowy toast
        const toast = document.createElement('div');
        toast.className = `estimate-toast estimate-toast-${type}`;
        toast.textContent = message;
        
        // Dodaj style inline (żeby nie zależeć od CSS)
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        // Kolory w zależności od typu
        switch(type) {
            case 'success':
                toast.style.background = '#10b981';
                toast.style.color = 'white';
                break;
            case 'error':
                toast.style.background = '#ef4444';
                toast.style.color = 'white';
                break;
            case 'warning':
                toast.style.background = '#f59e0b';
                toast.style.color = 'white';
                break;
            default:
                toast.style.background = '#3b82f6';
                toast.style.color = 'white';
        }

        // Dodaj do strony
        document.body.appendChild(toast);

        // Usuń po 4 sekundach
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Dodaj animacje CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicjalizuj gdy strona jest gotowa
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.estimateHandler = new EstimateHandler();
    });
} else {
    window.estimateHandler = new EstimateHandler();
}
