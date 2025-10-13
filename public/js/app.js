// Main logic for the personal trainer panel application

let currentClient = null;

// Inicjalizacja aplikacji
function initializeApp() {
    console.log('Initializing app...');
    
    // Załaduj cennik usług
    if (typeof window.loadPricing === 'function') {
        window.loadPricing();
    }
    
    // Nasłuchiwanie na zmiany w klientach
    window.db.collection('clients').onSnapshot((snapshot) => {
        allClients = [];
        snapshot.forEach((doc) => {
            allClients.push({ id: doc.id, ...doc.data() });
        });
        window.allClients = allClients;
        
        updateDashboard();
        renderClientsList();
        updateServicesTab();
        updateMeasurementClientSelect();
    });

    // Nasłuchiwanie na notatki
    window.db.collection('notes').orderBy('createdAt', 'desc').onSnapshot(() => {
        renderNotesList();
    });

    // Inicjalizacja zakładek
    initializeTabs();
    
    // Inicjalizacja modali
    initializeModals();
    
    // Inicjalizacja formularzy
    initializeForms();
    
    // Inicjalizacja filtrów
    initializeFilters();
}

// System zakładek
function initializeTabs() {
    console.log('🔧 INITIALIZING TABS...');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    console.log('Found tab buttons:', tabButtons.length);
    
    if (tabButtons.length === 0) {
        console.error('❌ NO TAB BUTTONS FOUND!');
        return;
    }
    
    tabButtons.forEach((button, index) => {
        console.log(`Adding listener to button ${index}:`, button.dataset.tab);
        
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const tabName = this.dataset.tab;
            
            console.log('✅ TAB CLICKED:', tabName);
            
            // Usuń active ze wszystkich zakładek
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Dodaj active do wybranej zakładki
            this.classList.add('active');
            const targetTab = document.getElementById(`${tabName}-tab`);
            
            if (targetTab) {
                targetTab.classList.add('active');
                console.log('✅ Activated tab:', tabName);
            } else {
                console.error('❌ Tab not found:', `${tabName}Tab`);
            }
            
            // Odśwież dane w zakładce
            try {
                if (tabName === 'home') {
                    console.log('Calling updateDashboard...');
                    if (typeof window.updateDashboard === 'function') {
                        window.updateDashboard();
                    }
                }
                if (tabName === 'clients') {
                    console.log('Calling renderClientsList...');
                    if (typeof window.renderClientsList === 'function') {
                        window.renderClientsList();
                    }
                }
                if (tabName === 'services') {
                    console.log('Calling updateServicesTab...');
                    if (typeof window.updateServicesTab === 'function') {
                        window.updateServicesTab();
                    }
                }
                if (tabName === 'finances') {
                    console.log('Calling loadPayments...');
                    if (typeof window.loadPayments === 'function') {
                        window.loadPayments();
                    }
                }
                if (tabName === 'notes') {
                    console.log('Calling renderNotesList...');
                    if (typeof window.renderNotesList === 'function') {
                        window.renderNotesList();
                    }
                }
            } catch (error) {
                console.error('❌ Error refreshing tab data:', error);
            }
        };
    });
    
    console.log('✅ TABS INITIALIZED!');
}

// System modali
function initializeModals() {
    // Zamykanie modali przez X
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // Zamykanie modali przez przycisk Anuluj
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // Zamykanie modali przez kliknięcie w tło
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Przycisk dodaj klienta
    document.getElementById('addClientBtn').addEventListener('click', () => {
        openClientModal();
    });

    // Przycisk dodaj notatkę
    document.getElementById('addNoteBtn').addEventListener('click', () => {
        openNoteModal();
    });
    
    // Przycisk dodaj płatność
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', () => {
            openPaymentModal();
        });
    }
    
    // Przycisk zapisz cennik
    const savePricingBtn = document.getElementById('savePricingBtn');
    if (savePricingBtn) {
        savePricingBtn.addEventListener('click', () => {
            if (typeof window.savePricing === 'function') {
                window.savePricing();
            }
        });
    }
}

// Inicjalizacja formularzy
function initializeForms() {
    // Formularz klienta
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', handleClientSubmit);
    }
    
    // Formularz notatki
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', handleNoteSubmit);
    }
    
    // Formularz pomiaru
    const measurementForm = document.getElementById('measurementForm');
    if (measurementForm) {
        measurementForm.addEventListener('submit', handleMeasurementSubmit);
    }
    
    // Formularz usługi
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
        serviceForm.addEventListener('submit', handleServiceSubmit);
    }
    
    // Formularz płatności
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
    
    // Formularz upload pliku - pomijamy jeśli nie istnieje (Storage wyłączony)
    const fileUploadForm = document.getElementById('fileUploadForm');
    if (fileUploadForm && typeof handleFileUpload === 'function') {
        fileUploadForm.addEventListener('submit', handleFileUpload);
    }
    
    // Checkbox usług - dynamiczna zmiana etykiet i pól
    const serviceCheckboxes = document.querySelectorAll('input[name="serviceType"]');
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async () => {
            const checkedBoxes = Array.from(serviceCheckboxes).filter(cb => cb.checked);
            const dietaChecked = checkedBoxes.find(cb => cb.value === 'dieta');
            const planChecked = checkedBoxes.find(cb => cb.value === 'plan_treningowy');
            const prowadzenieChecked = checkedBoxes.find(cb => cb.value === 'prowadzenie');
            const prywatnaChecked = checkedBoxes.find(cb => cb.value === 'wspolpraca_prywatna');
            
            const startDateLabel = document.getElementById('startDateLabel');
            const endDateLabel = document.getElementById('endDateLabel');
            const endDateGroup = document.getElementById('endDateGroup');
            const endDateInput = document.getElementById('serviceEndDate');
            const priceInput = document.getElementById('servicePrice');
            const paymentDescInput = document.getElementById('servicePaymentDescription');
            
            // Oblicz sugerowaną cenę na podstawie zaznaczonych usług
            let suggestedPrice = 0;
            let isFirstProwadzenie = false;
            
            if (typeof window.servicePricing !== 'undefined') {
                for (const cb of checkedBoxes) {
                    const priceKey = cb.value;
                    
                    // Sprawdź czy to pierwszy miesiąc prowadzenia
                    if (priceKey === 'prowadzenie') {
                        const form = document.getElementById('serviceForm');
                        const clientId = form?.dataset?.clientId;
                        
                        if (clientId) {
                            try {
                                const clientDoc = await window.db.collection('clients').doc(clientId).get();
                                if (clientDoc.exists) {
                                    const clientData = clientDoc.data();
                                    const hasProwadzenie = (clientData.services || []).some(s => 
                                        s.type === 'prowadzenie' && 
                                        (s.status === 'aktywny' || s.status === 'wygasajacy')
                                    );
                                    
                                    if (!hasProwadzenie) {
                                        isFirstProwadzenie = true;
                                        suggestedPrice += window.servicePricing.prowadzenie_pierwszy || 0;
                                        if (paymentDescInput) {
                                            paymentDescInput.value = 'Pierwszy miesiąc';
                                        }
                                    } else {
                                        suggestedPrice += window.servicePricing.prowadzenie || 0;
                                    }
                                }
                            } catch (error) {
                                console.error('Error checking prowadzenie:', error);
                                suggestedPrice += window.servicePricing.prowadzenie || 0;
                            }
                        } else {
                            suggestedPrice += window.servicePricing.prowadzenie || 0;
                        }
                    } else {
                        suggestedPrice += window.servicePricing[priceKey] || 0;
                    }
                }
            }
            
            // Ustaw sugerowaną cenę
            if (priceInput && checkedBoxes.length > 0) {
                priceInput.value = suggestedPrice;
            }
            
            // Dla diety i planu treningowego - to jest "data kupna" i nie ma końca
            if ((dietaChecked || planChecked) && !prowadzenieChecked && !prywatnaChecked) {
                startDateLabel.textContent = 'Data kupna *';
                endDateGroup.style.display = 'none';
                endDateInput.removeAttribute('required');
            }
            // Dla prowadzenia - ma datę rozpoczęcia i zakończenia
            else if (prowadzenieChecked && !dietaChecked && !planChecked && !prywatnaChecked) {
                startDateLabel.textContent = 'Data rozpoczęcia *';
                endDateGroup.style.display = 'none';
                endDateInput.removeAttribute('required');
            }
            // Dla współpracy prywatnej - pokaż pole ceny
            else if (prywatnaChecked) {
                startDateLabel.textContent = 'Data rozpoczęcia *';
                endDateGroup.style.display = 'none';
                endDateInput.removeAttribute('required');
            }
            // Inne kombinacje
            else {
                startDateLabel.textContent = 'Data rozpoczęcia *';
                endDateGroup.style.display = 'none';
                endDateInput.removeAttribute('required');
            }
        });
    });
}

// Inicjalizacja filtrów
function initializeFilters() {
    const searchInput = document.getElementById('clientSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderClientsList);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', renderClientsList);
    }
}

// Pomocnicze funkcje UI
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Usuń toast po 4 sekundach
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function formatDate(date) {
    if (!date) return 'Brak daty';
    
    if (date.toDate) {
        date = date.toDate();
    } else if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}

function calculateAge(birthYear) {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
}

function getDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

// Otwieranie modala klienta (dodawanie/edycja)
function openClientModal(clientData = null) {
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const title = document.getElementById('clientModalTitle');
    
    form.reset();
    
    if (clientData) {
        // Edycja klienta
        title.textContent = 'Edytuj klienta';
        document.getElementById('clientId').value = clientData.id;
        document.getElementById('clientFirstName').value = clientData.firstName || '';
        document.getElementById('clientLastName').value = clientData.lastName || '';
        document.getElementById('clientGender').value = clientData.gender || '';
        document.getElementById('clientAge').value = clientData.age || '';
        document.getElementById('clientPhone').value = clientData.phone || '';
        document.getElementById('clientEmail').value = clientData.email || '';
    } else {
        // Nowy klient
        title.textContent = 'Dodaj klienta';
        document.getElementById('clientId').value = '';
    }
    
    modal.classList.add('active');
}

// Otwieranie modala notatki
function openNoteModal(clientId = null) {
    const modal = document.getElementById('noteModal');
    const form = document.getElementById('noteForm');
    const select = document.getElementById('noteClientSelect');
    
    form.reset();
    
    // Wypełnij listę klientów
    select.innerHTML = '<option value="">Ogólna notatka</option>';
    allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.firstName} ${client.lastName}`;
        if (clientId && client.id === clientId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    modal.classList.add('active');
}

console.log('? App.js loaded');
