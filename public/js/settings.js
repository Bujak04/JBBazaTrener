// settings.js - Zarządzanie ustawieniami aplikacji

// Domyślne ustawienia
const defaultSettings = {
    general: {
        appName: 'Trener Personalny - Panel',
        trainerName: '',
        contactEmail: '',
        contactPhone: ''
    },
    appearance: {
        theme: 'dark',
        accentColor: 'green',
        compactMode: false,
        animationsEnabled: true
    }
};

// ============================================
// OTWIERANIE/ZAMYKANIE MODALU
// ============================================

function openSettings() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'flex';
    loadAllSettings();
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'none';
}

// ============================================
// ZAKŁADKI USTAWIEŃ
// ============================================

function initSettingsTabs() {
    const tabBtns = document.querySelectorAll('.settings-tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-settings-tab');
            
            // Usuń aktywną klasę ze wszystkich
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.settings-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Dodaj aktywną klasę do wybranego
            btn.classList.add('active');
            document.getElementById(`settings-${targetTab}`).classList.add('active');
        });
    });
}

// ============================================
// ŁADOWANIE USTAWIEŃ
// ============================================

async function loadAllSettings() {
    try {
        showLoading(true);
        
        // Załaduj ustawienia z Firebase
        const settingsDoc = await window.db.collection('settings').doc('app').get();
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            
            // Ogólne
            if (settings.general) {
                document.getElementById('appName').value = settings.general.appName || defaultSettings.general.appName;
                document.getElementById('trainerName').value = settings.general.trainerName || '';
                document.getElementById('contactEmail').value = settings.general.contactEmail || '';
                document.getElementById('contactPhone').value = settings.general.contactPhone || '';
            }
            
            // Wygląd
            if (settings.appearance) {
                selectTheme(settings.appearance.theme || 'dark', false);
                selectAccentColor(settings.appearance.accentColor || 'green', false);
                document.getElementById('compactMode').checked = settings.appearance.compactMode || false;
                document.getElementById('animationsEnabled').checked = settings.appearance.animationsEnabled !== false;
            }
        } else {
            // Użyj domyślnych wartości
            document.getElementById('appName').value = defaultSettings.general.appName;
            selectTheme('dark', false);
            selectAccentColor('green', false);
        }
        
        // Załaduj cennik
        await loadPricingIntoSettings();
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Błąd ładowania ustawień: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function loadPricingIntoSettings() {
    try {
        const pricingDoc = await window.db.collection('settings').doc('pricing').get();
        
        if (pricingDoc.exists) {
            const pricing = pricingDoc.data();
            
            document.getElementById('settings_priceDieta').value = pricing.dieta || 0;
            document.getElementById('settings_pricePlanTreningowy').value = pricing.plan_treningowy || 0;
            document.getElementById('settings_priceProwadzenie').value = pricing.prowadzenie || 0;
            document.getElementById('settings_priceProwadzeniePierwszy').value = pricing.prowadzenie_pierwszy || 0;
            document.getElementById('settings_priceWspolpracaPrywatna').value = pricing.wspolpraca_prywatna || 0;
        }
    } catch (error) {
        console.error('Error loading pricing into settings:', error);
    }
}

// ============================================
// ZAPISYWANIE USTAWIEŃ OGÓLNYCH
// ============================================

async function saveGeneralSettings() {
    const settings = {
        appName: document.getElementById('appName').value,
        trainerName: document.getElementById('trainerName').value,
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value
    };
    
    showLoading(true);
    
    try {
        await window.db.collection('settings').doc('app').set({
            general: settings,
            updatedAt: firebase.firestore.Timestamp.now()
        }, { merge: true });
        
        // Zaktualizuj nazwę aplikacji w nagłówku
        const appTitle = document.querySelector('.app-title');
        if (appTitle) {
            appTitle.textContent = settings.appName || defaultSettings.general.appName;
        }
        
        showToast('Ustawienia ogólne zapisane!', 'success');
        
    } catch (error) {
        console.error('Error saving general settings:', error);
        showToast('Błąd zapisywania ustawień: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// ZAPISYWANIE CENNIKA
// ============================================

async function savePricingSettings() {
    const pricing = {
        dieta: parseFloat(document.getElementById('settings_priceDieta').value) || 0,
        plan_treningowy: parseFloat(document.getElementById('settings_pricePlanTreningowy').value) || 0,
        prowadzenie: parseFloat(document.getElementById('settings_priceProwadzenie').value) || 0,
        prowadzenie_pierwszy: parseFloat(document.getElementById('settings_priceProwadzeniePierwszy').value) || 0,
        wspolpraca_prywatna: parseFloat(document.getElementById('settings_priceWspolpracaPrywatna').value) || 0
    };
    
    showLoading(true);
    
    try {
        await window.db.collection('settings').doc('pricing').set(pricing);
        
        // Zaktualizuj globalny obiekt cennika
        window.servicePricing = pricing;
        
        showToast('Cennik zapisany!', 'success');
        
    } catch (error) {
        console.error('Error saving pricing:', error);
        showToast('Błąd zapisywania cennika: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// WYGLĄD - MOTYW
// ============================================

function selectTheme(theme, save = true) {
    // Usuń aktywną klasę z wszystkich przycisków
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Dodaj aktywną klasę do wybranego
    const selectedBtn = document.querySelector(`.theme-option[data-theme="${theme}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Zastosuj motyw
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    
    // Zapisz jeśli potrzeba
    if (save) {
        saveAppearanceSettings();
    }
}

// ============================================
// WYGLĄD - KOLOR AKCENTU
// ============================================

function selectAccentColor(color, save = true) {
    // Usuń aktywną klasę z wszystkich przycisków
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Dodaj aktywną klasę do wybranego
    const selectedBtn = document.querySelector(`.color-option[data-color="${color}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Zastosuj kolor
    document.body.setAttribute('data-accent', color);
    
    // Zapisz jeśli potrzeba
    if (save) {
        saveAppearanceSettings();
    }
}

// ============================================
// ZAPISYWANIE USTAWIEŃ WYGLĄDU
// ============================================

async function saveAppearanceSettings() {
    const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const accentColor = document.body.getAttribute('data-accent') || 'green';
    const compactMode = document.getElementById('compactMode').checked;
    const animationsEnabled = document.getElementById('animationsEnabled').checked;
    
    const settings = {
        theme,
        accentColor,
        compactMode,
        animationsEnabled
    };
    
    // Zastosuj tryb kompaktowy
    if (compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    
    // Zastosuj animacje
    if (!animationsEnabled) {
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }
    
    showLoading(true);
    
    try {
        await window.db.collection('settings').doc('app').set({
            appearance: settings,
            updatedAt: firebase.firestore.Timestamp.now()
        }, { merge: true });
        
        showToast('Ustawienia wyglądu zapisane!', 'success');
        
    } catch (error) {
        console.error('Error saving appearance settings:', error);
        showToast('Błąd zapisywania ustawień: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// ŁADOWANIE USTAWIEŃ PRZY STARCIE
// ============================================

async function loadAppSettingsOnStartup() {
    try {
        const settingsDoc = await window.db.collection('settings').doc('app').get();
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            
            // Zastosuj nazwę aplikacji
            if (settings.general && settings.general.appName) {
                const appTitle = document.querySelector('.app-title');
                if (appTitle) {
                    appTitle.textContent = settings.general.appName;
                }
            }
            
            // Zastosuj ustawienia wyglądu
            if (settings.appearance) {
                selectTheme(settings.appearance.theme || 'dark', false);
                selectAccentColor(settings.appearance.accentColor || 'green', false);
                
                if (settings.appearance.compactMode) {
                    document.body.classList.add('compact-mode');
                }
                
                if (!settings.appearance.animationsEnabled) {
                    document.body.classList.add('no-animations');
                }
            }
        }
    } catch (error) {
        console.error('Error loading app settings on startup:', error);
    }
}

// ============================================
// INICJALIZACJA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Przycisk ustawień
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }
    
    // Modal ustawień
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        const closeBtn = settingsModal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSettings);
        }
        
        // Zamknij po kliknięciu poza modal
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettings();
            }
        });
    }
    
    // Inicjalizuj zakładki
    initSettingsTabs();
    
    // Checkboxy wyglądu
    const compactModeCheckbox = document.getElementById('compactMode');
    if (compactModeCheckbox) {
        compactModeCheckbox.addEventListener('change', () => {
            if (compactModeCheckbox.checked) {
                document.body.classList.add('compact-mode');
            } else {
                document.body.classList.remove('compact-mode');
            }
        });
    }
    
    const animationsCheckbox = document.getElementById('animationsEnabled');
    if (animationsCheckbox) {
        animationsCheckbox.addEventListener('change', () => {
            if (!animationsCheckbox.checked) {
                document.body.classList.add('no-animations');
            } else {
                document.body.classList.remove('no-animations');
            }
        });
    }
    
    // Załaduj ustawienia przy starcie
    if (window.db) {
        loadAppSettingsOnStartup();
    }
});

// ============================================
// ZARZĄDZANIE DANYMI - USUWANIE HISTORII
// ============================================

// Usuń wszystkie zakończone usługi
async function deleteAllCompletedServices() {
    const confirmation = confirm(
        '⚠️ UWAGA!\n\n' +
        'Czy na pewno chcesz usunąć WSZYSTKIE ZAKOŃCZONE USŁUGI dla wszystkich klientów?\n\n' +
        'Ta operacja:\n' +
        '• Usunie usługi ze statusem "zakonczone"\n' +
        '• Jest NIEODWRACALNA\n' +
        '• Może zająć kilka sekund\n\n' +
        'Kliknij OK aby kontynuować.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading(true);
        
        const clientsSnapshot = await window.db.collection('clients').get();
        let deletedCount = 0;
        
        for (const clientDoc of clientsSnapshot.docs) {
            const clientData = clientDoc.data();
            const services = clientData.services || [];
            
            // Filtruj tylko aktywne usługi
            const activeServices = services.filter(s => s.status !== 'zakonczone');
            deletedCount += services.length - activeServices.length;
            
            if (activeServices.length !== services.length) {
                await window.db.collection('clients').doc(clientDoc.id).update({
                    services: activeServices
                });
            }
        }
        
        showToast(`Usunięto ${deletedCount} zakończonych usług`, 'success');
        
        // Odśwież widok jeśli jesteśmy w panelu klientów
        if (typeof window.loadClients === 'function') {
            window.loadClients();
        }
    } catch (error) {
        console.error('Error deleting completed services:', error);
        showToast('Błąd usuwania usług: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Usuń wszystkie opłacone płatności
async function deleteAllPaidPayments() {
    const confirmation = confirm(
        '⚠️ UWAGA!\n\n' +
        'Czy na pewno chcesz usunąć WSZYSTKIE OPŁACONE PŁATNOŚCI?\n\n' +
        'Ta operacja:\n' +
        '• Usunie płatności ze statusem "oplacone"\n' +
        '• Jest NIEODWRACALNA\n' +
        '• Może zająć kilka sekund\n\n' +
        'Kliknij OK aby kontynuować.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading(true);
        
        const paymentsSnapshot = await window.db.collection('payments')
            .where('status', '==', 'oplacone')
            .get();
        
        const batch = window.db.batch();
        paymentsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        showToast(`Usunięto ${paymentsSnapshot.size} opłaconych płatności`, 'success');
        
        // Odśwież widok jeśli jesteśmy w panelu finansów
        if (typeof window.loadPayments === 'function') {
            window.loadPayments();
        }
    } catch (error) {
        console.error('Error deleting paid payments:', error);
        showToast('Błąd usuwania płatności: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Usuń wszystkie notatki
async function deleteAllNotes() {
    const confirmation = confirm(
        '⚠️ UWAGA!\n\n' +
        'Czy na pewno chcesz usunąć WSZYSTKIE NOTATKI dla wszystkich klientów?\n\n' +
        'Ta operacja:\n' +
        '• Usunie wszystkie notatki\n' +
        '• Jest NIEODWRACALNA\n' +
        '• Może zająć kilka sekund\n\n' +
        'Kliknij OK aby kontynuować.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading(true);
        
        const clientsSnapshot = await window.db.collection('clients').get();
        let deletedCount = 0;
        
        for (const clientDoc of clientsSnapshot.docs) {
            const clientData = clientDoc.data();
            const notes = clientData.notes || [];
            deletedCount += notes.length;
            
            if (notes.length > 0) {
                await window.db.collection('clients').doc(clientDoc.id).update({
                    notes: []
                });
            }
        }
        
        showToast(`Usunięto ${deletedCount} notatek`, 'success');
        
        // Odśwież widok jeśli mamy otwartego klienta
        if (typeof window.loadClientDetails === 'function' && window.currentClientId) {
            window.loadClientDetails(window.currentClientId);
        }
    } catch (error) {
        console.error('Error deleting notes:', error);
        showToast('Błąd usuwania notatek: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Usuń wszystkie pomiary
async function deleteAllMeasurements() {
    const confirmation = confirm(
        '⚠️ UWAGA!\n\n' +
        'Czy na pewno chcesz usunąć WSZYSTKIE POMIARY dla wszystkich klientów?\n\n' +
        'Ta operacja:\n' +
        '• Usunie wszystkie pomiary\n' +
        '• Jest NIEODWRACALNA\n' +
        '• Może zająć kilka sekund\n\n' +
        'Kliknij OK aby kontynuować.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading(true);
        
        const clientsSnapshot = await window.db.collection('clients').get();
        let deletedCount = 0;
        
        for (const clientDoc of clientsSnapshot.docs) {
            const clientData = clientDoc.data();
            const measurements = clientData.measurements || [];
            deletedCount += measurements.length;
            
            if (measurements.length > 0) {
                await window.db.collection('clients').doc(clientDoc.id).update({
                    measurements: []
                });
            }
        }
        
        showToast(`Usunięto ${deletedCount} pomiarów`, 'success');
        
        // Odśwież widok jeśli mamy otwartego klienta
        if (typeof window.loadClientDetails === 'function' && window.currentClientId) {
            window.loadClientDetails(window.currentClientId);
        }
    } catch (error) {
        console.error('Error deleting measurements:', error);
        showToast('Błąd usuwania pomiarów: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// RESET WSZYSTKIEGO - opcja nuklearna
async function resetAllData() {
    const firstConfirmation = confirm(
        '☢️ NIEBEZPIECZNA OPERACJA!\n\n' +
        'Czy NA PEWNO chcesz usunąć WSZYSTKICH KLIENTÓW i CAŁĄ HISTORIĘ DANYCH?\n\n' +
        'Ta operacja usunie:\n' +
        '• Wszystkich klientów\n' +
        '• Wszystkie usługi\n' +
        '• Wszystkie płatności\n' +
        '• Wszystkie notatki\n' +
        '• Wszystkie pomiary\n' +
        '• Wszystkie ankiety\n\n' +
        'ZOSTANIE TYLKO: Cennik i ustawienia aplikacji\n\n' +
        'Ta operacja jest NIEODWRACALNA!\n\n' +
        'Kliknij OK aby kontynuować do ostatecznego potwierdzenia.'
    );
    
    if (!firstConfirmation) return;
    
    const finalConfirmation = prompt(
        '☢️ OSTATNIE OSTRZEŻENIE!\n\n' +
        'To usunie WSZYSTKO!\n\n' +
        'Wpisz "RESET" (wielkimi literami) aby potwierdzić:'
    );
    
    if (finalConfirmation !== 'RESET') {
        showToast('Operacja anulowana', 'info');
        return;
    }
    
    try {
        showLoading(true);
        
        // Usuń wszystkich klientów
        const clientsSnapshot = await window.db.collection('clients').get();
        const clientBatch = window.db.batch();
        clientsSnapshot.docs.forEach(doc => {
            clientBatch.delete(doc.ref);
        });
        await clientBatch.commit();
        
        // Usuń wszystkie płatności
        const paymentsSnapshot = await window.db.collection('payments').get();
        const paymentBatch = window.db.batch();
        paymentsSnapshot.docs.forEach(doc => {
            paymentBatch.delete(doc.ref);
        });
        await paymentBatch.commit();
        
        showToast(
            `RESET ZAKOŃCZONY!\n\nUsunięto:\n• ${clientsSnapshot.size} klientów\n• ${paymentsSnapshot.size} płatności`,
            'success'
        );
        
        // Odśwież aplikację
        setTimeout(() => {
            location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Error resetting data:', error);
        showToast('Błąd resetowania danych: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Eksport funkcji
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveGeneralSettings = saveGeneralSettings;
window.savePricingSettings = savePricingSettings;
window.saveAppearanceSettings = saveAppearanceSettings;
window.selectTheme = selectTheme;
window.selectAccentColor = selectAccentColor;
window.deleteAllCompletedServices = deleteAllCompletedServices;
window.deleteAllPaidPayments = deleteAllPaidPayments;
window.deleteAllNotes = deleteAllNotes;
window.deleteAllMeasurements = deleteAllMeasurements;
window.resetAllData = resetAllData;

console.log('✅ Settings.js loaded');
