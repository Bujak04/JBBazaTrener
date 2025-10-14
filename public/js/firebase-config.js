// Konfiguracja Firebase - dynamiczna inicjalizacja
let firebaseConfig = null;
let auth = null;
let db = null;
let ADMIN_UID = null;

// Funkcja do załadowania konfiguracji z localStorage
function loadFirebaseConfig() {
    const savedConfig = localStorage.getItem('firebaseConfig');
    
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            return {
                apiKey: config.apiKey,
                authDomain: config.authDomain,
                projectId: config.projectId,
                storageBucket: config.storageBucket,
                messagingSenderId: config.messagingSenderId,
                appId: config.appId
            };
        } catch (error) {
            console.error('Error parsing Firebase config:', error);
            return null;
        }
    }
    
    return null;
}

// Funkcja do zapisania konfiguracji
function saveFirebaseConfig(config) {
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
}

// Funkcja do inicjalizacji Firebase
function initializeFirebase(config) {
    if (firebase.apps.length > 0) {
        console.log('Firebase already initialized');
        return;
    }
    
    try {
        // Inicjalizacja Firebase
        firebase.initializeApp(config);
        
        // Inicjalizacja usług Firebase
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Załaduj ADMIN_UID z localStorage
        ADMIN_UID = localStorage.getItem('adminUID') || '';
        
        // Włączenie persystencji offline dla Firestore
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Persistence: Multiple tabs open');
                } else if (err.code === 'unimplemented') {
                    console.warn('Persistence not available');
                }
            });
        
        // Export globalny
        window.auth = auth;
        window.db = db;
        window.ADMIN_UID = ADMIN_UID;
        
        // Rozpocznij monitorowanie sesji
        startInactivityTimer();
        
        console.log('✅ Firebase initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
        return false;
    }
}

// Sprawdź czy konfiguracja istnieje i zainicjalizuj
firebaseConfig = loadFirebaseConfig();

if (firebaseConfig) {
    const initialized = initializeFirebase(firebaseConfig);
    if (initialized) {
        console.log('✅ Firebase initialized from saved config');
    }
} else {
    console.log('⚠️ Firebase config not found - please configure in settings');
    // Pokaż ekran konfiguracji tylko jeśli DOM jest gotowy
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            showFirebaseSetupScreen();
        });
    } else {
        showFirebaseSetupScreen();
    }
}

// Sesja - automatyczne wylogowanie po 5 minutach nieaktywności
let inactivityTimer;

function startInactivityTimer() {
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (auth && auth.currentUser) {
                console.log('Session expired due to inactivity');
                auth.signOut();
            }
        }, 5 * 60 * 1000); // 5 minut = 300000ms
    }
    
    // Monitoruj aktywność użytkownika
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    resetInactivityTimer();
}

// Funkcja do wyświetlenia ekranu konfiguracji Firebase
function showFirebaseSetupScreen() {
    const setupScreen = document.getElementById('firebaseSetupScreen');
    if (setupScreen) {
        setupScreen.style.display = 'flex';
    }
}

// Export funkcji
window.loadFirebaseConfig = loadFirebaseConfig;
window.saveFirebaseConfig = saveFirebaseConfig;
window.initializeFirebase = initializeFirebase;

console.log('✅ Firebase config module loaded');

console.log('✅ Firebase initialized successfully');
console.log('Admin UID:', ADMIN_UID);
