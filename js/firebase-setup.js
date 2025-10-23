// firebase-setup.js - Obsługa początkowej konfiguracji Firebase

function checkAndHideSetupScreen() {
    const setupScreen = document.getElementById('firebaseSetupScreen');
    const loginPage = document.getElementById('loginPage');
    
    // Sprawdź czy Firebase jest już skonfigurowany
    const existingConfig = window.loadFirebaseConfig();
    
    if (existingConfig) {
        // Config istnieje - ukryj ekran setupu i pokaż logowanie
        if (setupScreen) {
            setupScreen.style.display = 'none';
        }
        if (loginPage) {
            loginPage.classList.add('active');
        }
        console.log('✅ Firebase already configured - setup screen hidden');
        return true;
    }
    
    // Config nie istnieje - pokaż setup
    if (setupScreen) {
        setupScreen.style.display = 'flex';
    }
    if (loginPage) {
        loginPage.classList.remove('active');
    }
    console.log('⚠️ Firebase not configured - showing setup screen');
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const saveSetupBtn = document.getElementById('saveFirebaseSetupBtn');
    const setupError = document.getElementById('setupError');
    
    // Sprawdź i ukryj setup jeśli już skonfigurowany
    if (checkAndHideSetupScreen()) {
        return; // Firebase już skonfigurowany, koniec
    }
    
    // Setup jeszcze potrzebny - dodaj listener
    if (saveSetupBtn) {
        saveSetupBtn.addEventListener('click', saveFirebaseSetup);
    }
});

function saveFirebaseSetup() {
    const setupError = document.getElementById('setupError');
    
    console.log('🔧 Rozpoczynam zapisywanie konfiguracji Firebase...');
    
    // Pobierz dane z formularza
    const config = {
        apiKey: document.getElementById('setup_apiKey').value.trim(),
        authDomain: document.getElementById('setup_authDomain').value.trim(),
        projectId: document.getElementById('setup_projectId').value.trim(),
        storageBucket: document.getElementById('setup_storageBucket').value.trim(),
        messagingSenderId: document.getElementById('setup_messagingSenderId').value.trim(),
        appId: document.getElementById('setup_appId').value.trim()
    };
    
    const adminUID = document.getElementById('setup_adminUID').value.trim();
    
    console.log('📋 Dane z formularza:', config);
    console.log('👤 Admin UID:', adminUID || '(nie podano)');
    
    // Walidacja
    if (!config.apiKey || !config.authDomain || !config.projectId || 
        !config.storageBucket || !config.messagingSenderId || !config.appId) {
        console.error('❌ Walidacja nie powiodła się - puste pola');
        setupError.textContent = '❌ Wszystkie pola są wymagane!';
        setupError.style.display = 'block';
        return;
    }
    
    console.log('✅ Walidacja OK');
    
    try {
        // Zapisz konfigurację
        console.log('💾 Zapisuję konfigurację do localStorage...');
        window.saveFirebaseConfig(config);
        console.log('✅ Konfiguracja zapisana');
        
        // Zapisz Admin UID jeśli podano
        if (adminUID) {
            localStorage.setItem('adminUID', adminUID);
            console.log('✅ Admin UID zapisany');
        }
        
        // Inicjalizuj Firebase
        console.log('🔥 Inicjalizuję Firebase...');
        const success = window.initializeFirebase(config);
        console.log('🔥 Wynik inicjalizacji:', success);
        
        if (success) {
            setupError.style.display = 'none';
            
            console.log('✅ Firebase zainicjalizowany pomyślnie!');
            console.log('🔄 Ukrywam ekran setupu i pokazuję logowanie...');
            
            // Ukryj ekran setupu
            document.getElementById('firebaseSetupScreen').style.display = 'none';
            
            // Pokaż ekran logowania
            document.getElementById('loginPage').classList.add('active');
            
            console.log('⏱️ Odświeżam stronę za 1 sekundę...');
            
            // Odśwież stronę za 1 sekundę
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } else {
            console.error('❌ Inicjalizacja Firebase zwróciła false');
            setupError.textContent = '❌ Błąd inicjalizacji Firebase. Sprawdź dane.';
            setupError.style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ Błąd podczas zapisywania:', error);
        setupError.textContent = '❌ ' + error.message;
        setupError.style.display = 'block';
    }
}

console.log('✅ Firebase setup module loaded');
