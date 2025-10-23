// Autentykacja Firebase - Jakub Bujakiewicz Trener Personalny

// Sprawdzanie stanu autentykacji
window.auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User logged in:', user.uid);
        
        // Sprawdź czy to admin
        if (user.uid === window.ADMIN_UID) {
            console.log('✅ Admin verified');
            showMainPanel();
            
            // Zainicjalizuj aplikację
            if (typeof initializeApp === 'function') {
                initializeApp();
            }
            
            // Rozpocznij licznik nieaktywności
            if (typeof window.startInactivityTimer === 'function') {
                window.startInactivityTimer();
            }
        } else {
            console.error('❌ User is not admin');
            alert('Brak uprawnień administratora!');
            window.auth.signOut();
        }
    } else {
        console.log('User logged out');
        showLoginPage();
    }
});

// Logowanie
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');

    if (loginBtn && emailInput && passwordInput) {
        // Obsługa przycisku logowania
        loginBtn.addEventListener('click', handleLogin);
        
        // Logowanie po Enter
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    async function handleLogin() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            if (loginError) loginError.textContent = 'Wypełnij wszystkie pola';
            return;
        }

        // Pokaż loading
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logowanie...';
        }
        if (loginError) loginError.textContent = '';

        try {
            console.log('Attempting login...');
            await window.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Login successful');
        } catch (error) {
            console.error('❌ Login error:', error.code, error.message);
            
            if (loginError) {
                loginError.textContent = getAuthErrorMessage(error.code);
            }
            
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Zaloguj się';
            }
        }
    }

    // Wylogowanie
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Czy na pewno chcesz się wylogować?')) {
                try {
                    await window.auth.signOut();
                    console.log('✅ Logged out successfully');
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Błąd wylogowania');
                }
            }
        });
    }
});

// Pokazywanie strony logowania
function showLoginPage() {
    const loginPage = document.getElementById('loginPage');
    const mainPanel = document.getElementById('mainPanel');
    
    if (loginPage) loginPage.classList.add('active');
    if (mainPanel) mainPanel.classList.remove('active');
}

// Pokazywanie głównego panelu
function showMainPanel() {
    const loginPage = document.getElementById('loginPage');
    const mainPanel = document.getElementById('mainPanel');
    
    if (loginPage) loginPage.classList.remove('active');
    if (mainPanel) mainPanel.classList.add('active');
}

// Tłumaczenie błędów Firebase Auth
function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'Nieprawidłowy adres email',
        'auth/user-disabled': 'Konto zostało wyłączone',
        'auth/user-not-found': 'Nie znaleziono użytkownika - sprawdź email',
        'auth/wrong-password': 'Nieprawidłowe hasło',
        'auth/invalid-credential': 'Nieprawidłowy email lub hasło',
        'auth/too-many-requests': 'Zbyt wiele prób. Spróbuj za 15 minut',
        'auth/network-request-failed': 'Błąd połączenia. Sprawdź internet',
        'auth/missing-password': 'Wprowadź hasło',
        'auth/weak-password': 'Hasło za słabe (min. 6 znaków)'
    };
    return errorMessages[errorCode] || `Błąd: ${errorCode}`;
}

console.log('✅ Auth.js loaded');
