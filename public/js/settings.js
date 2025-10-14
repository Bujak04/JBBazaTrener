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

// Eksport funkcji
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveGeneralSettings = saveGeneralSettings;
window.savePricingSettings = savePricingSettings;
window.saveAppearanceSettings = saveAppearanceSettings;
window.selectTheme = selectTheme;
window.selectAccentColor = selectAccentColor;

console.log('✅ Settings.js loaded');
