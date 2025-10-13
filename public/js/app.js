// Main logic for the personal trainer panel application

let currentClient = null;
let allClients = [];

// Inicjalizacja aplikacji
function initializeApp() {
    console.log('Initializing app...');
    
    // Nasłuchiwanie na zmiany w klientach
    db.collection('clients').onSnapshot((snapshot) => {
        allClients = [];
        snapshot.forEach((doc) => {
            allClients.push({ id: doc.id, ...doc.data() });
        });
        
        updateDashboard();
        renderClientsList();
        updateServicesTab();
        updateMeasurementClientSelect();
    });

    // Nasłuchiwanie na notatki
    db.collection('notes').orderBy('createdAt', 'desc').onSnapshot(() => {
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
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    console.log('Initializing tabs, found buttons:', tabButtons.length);
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            console.log('Tab clicked:', tabName);
            
            // Usuń active ze wszystkich zakładek
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Dodaj active do wybranej zakładki
            button.classList.add('active');
            const targetTab = document.getElementById(`${tabName}Tab`);
            
            if (targetTab) {
                targetTab.classList.add('active');
                console.log('Activated tab:', tabName);
            } else {
                console.error('Tab not found:', `${tabName}Tab`);
            }
            
            // Odśwież dane w zakładce
            if (tabName === 'home' && typeof updateDashboard === 'function') {
                updateDashboard();
            }
            if (tabName === 'clients' && typeof renderClientsList === 'function') {
                renderClientsList();
            }
            if (tabName === 'services' && typeof updateServicesTab === 'function') {
                updateServicesTab();
            }
            if (tabName === 'notes' && typeof renderNotesList === 'function') {
                renderNotesList();
            }
        });
    });
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
}

// Inicjalizacja formularzy
function initializeForms() {
    // Formularz klienta
    document.getElementById('clientForm').addEventListener('submit', handleClientSubmit);
    
    // Formularz notatki
    document.getElementById('noteForm').addEventListener('submit', handleNoteSubmit);
    
    // Formularz pomiaru
    document.getElementById('measurementForm').addEventListener('submit', handleMeasurementSubmit);
    
    // Formularz usługi
    document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
    
    // Formularz upload pliku
    document.getElementById('fileUploadForm').addEventListener('submit', handleFileUpload);
    
    // Checkbox prowadzenie - pokazuj daty
    const serviceCheckboxes = document.querySelectorAll('input[name="serviceType"]');
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const prowadzenieChecked = Array.from(serviceCheckboxes)
                .find(cb => cb.value === 'prowadzenie' && cb.checked);
            
            document.getElementById('endDateGroup').style.display = 
                prowadzenieChecked ? 'block' : 'none';
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
