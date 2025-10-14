// Konfiguracja Firebase - Jakub Bujakiewicz Trener Personalny
const firebaseConfig = {
  apiKey: "AIzaSyADUmqVCn3Vyo0M7hvV-RvKRHSydZKgGQw",
  authDomain: "trener-personalny-panel.firebaseapp.com",
  projectId: "trener-personalny-panel",
  storageBucket: "trener-personalny-panel.firebasestorage.app",
  messagingSenderId: "453926032781",
  appId: "1:453926032781:web:6505f971d37ab6719119c4"
};

// Admin UID - zmień na swoje
const ADMIN_UID = "SuU7wSzrXIMbmWboRJNhOIxvN4x1";

// Inicjalizacja Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
}

// Inicjalizacja usług Firebase
const auth = firebase.auth();
const db = firebase.firestore();

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

window.startInactivityTimer = startInactivityTimer;

console.log('✅ Firebase config loaded');

