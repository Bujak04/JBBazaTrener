// firebase-setup.js - Obsługa początkowej konfiguracji Firebase

document.addEventListener('DOMContentLoaded', () => {
    const saveSetupBtn = document.getElementById('saveFirebaseSetupBtn');
    const setupError = document.getElementById('setupError');
    
    if (saveSetupBtn) {
        saveSetupBtn.addEventListener('click', saveFirebaseSetup);
    }
});

function saveFirebaseSetup() {
    const setupError = document.getElementById('setupError');
    
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
    
    // Walidacja
    if (!config.apiKey || !config.authDomain || !config.projectId || 
        !config.storageBucket || !config.messagingSenderId || !config.appId) {
        setupError.textContent = '❌ Wszystkie pola są wymagane!';
        setupError.style.display = 'block';
        return;
    }
    
    try {
        // Zapisz konfigurację
        window.saveFirebaseConfig(config);
        
        // Zapisz Admin UID jeśli podano
        if (adminUID) {
            localStorage.setItem('adminUID', adminUID);
        }
        
        // Inicjalizuj Firebase
        const success = window.initializeFirebase(config);
        
        if (success) {
            setupError.style.display = 'none';
            
            // Ukryj ekran setupu
            document.getElementById('firebaseSetupScreen').style.display = 'none';
            
            // Pokaż ekran logowania
            document.getElementById('loginPage').classList.add('active');
            
            // Odśwież stronę za 1 sekundę
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } else {
            setupError.textContent = '❌ Błąd inicjalizacji Firebase. Sprawdź dane.';
            setupError.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error saving Firebase setup:', error);
        setupError.textContent = '❌ ' + error.message;
        setupError.style.display = 'block';
    }
}

console.log('✅ Firebase setup module loaded');
