// This file handles push notifications using Firebase Cloud Messaging (FCM) for subscription reminders.

const messaging = firebase.messaging();

function initializeFCM() {
    messaging.requestPermission()
        .then(() => {
            console.log('Notification permission granted.');
            return messaging.getToken();
        })
        .then((token) => {
            console.log('FCM Token:', token);
            // Save the token to your database if needed
        })
        .catch((error) => {
            console.error('Error getting notification permission or token:', error);
        });
}

messaging.onMessage((payload) => {
    console.log('Message received. ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/icons/icon-192x192.png'
    };

    new Notification(notificationTitle, notificationOptions);
});

// Call this function to initialize FCM
initializeFCM();

// Aktualizacja licznika powiadomień
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    
    if (!badge) return;
    
    let count = 0;
    const today = new Date();
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            if (client.services) {
                client.services.forEach(service => {
                    if (service.type === 'prowadzenie' && 
                        service.status === 'aktywny' && 
                        service.endDate) {
                        
                        const endDate = service.endDate.toDate();
                        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                        
                        // Powiadomienia dla prowadzeń kończących się w ciągu 7 dni
                        if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
                            count++;
                        }
                    }
                });
            }
        });
    }
    
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

// Przycisk powiadomień
document.addEventListener('DOMContentLoaded', () => {
    const notificationsBtn = document.getElementById('notificationsBtn');
    
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            showNotificationsModal();
        });
    }
    
    // Przycisk czyszczenia powiadomień
    const clearBtn = document.getElementById('clearNotificationsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearNotifications();
        });
    }
});

// Modal powiadomień
function showNotificationsModal() {
    const expiringClients = [];
    const today = new Date();
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            if (client.services) {
                client.services.forEach(service => {
                    if (service.type === 'prowadzenie' && 
                        service.status === 'aktywny' && 
                        service.endDate) {
                        
                        const endDate = service.endDate.toDate();
                        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
                            expiringClients.push({
                                client: client,
                                endDate: endDate,
                                daysUntilEnd: daysUntilEnd
                            });
                        }
                    }
                });
            }
        });
    }
    
    const modal = document.getElementById('notificationsModal');
    const notificationsList = document.getElementById('notificationsList');
    
    if (!modal || !notificationsList) {
        console.error('Notifications modal elements not found');
        return;
    }
    
    if (expiringClients.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>Brak wygasających prowadzeń</p>
                <p style="color: var(--text-gray); font-size: 14px; margin-top: 10px;">
                    Wszystkie prowadzenia są aktualne
                </p>
            </div>
        `;
        modal.classList.add('active');
        return;
    }
    
    // Sortuj po czasie
    expiringClients.sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
    
    notificationsList.innerHTML = expiringClients.map(item => {
        const urgencyClass = item.daysUntilEnd === 0 ? 'urgent' : 
                            item.daysUntilEnd <= 2 ? 'warning' : 'info';
        const timeText = item.daysUntilEnd === 0 ? '🔴 Wygasa dziś!' : 
                        item.daysUntilEnd === 1 ? '🟠 Wygasa jutro' : 
                        `🟡 Wygasa za ${item.daysUntilEnd} dni`;
        
        return `
            <div class="notification-item ${urgencyClass}" style="padding: 15px; margin-bottom: 10px; background: var(--card-bg); border-radius: 8px; border-left: 4px solid var(--primary-green); cursor: pointer;" onclick="openClientDetails('${item.client.id}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; font-size: 16px; margin-bottom: 5px;">
                            ${item.client.firstName} ${item.client.lastName}
                        </div>
                        <div style="color: var(--text-gray); font-size: 14px;">
                            📊 Prowadzenie kończy się: ${formatDate(item.endDate)}
                        </div>
                    </div>
                    <div style="font-size: 14px; font-weight: 600; white-space: nowrap; margin-left: 15px;">
                        ${timeText}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    modal.classList.add('active');
}

// Przycisk czyszczenia powiadomień
function clearNotifications() {
    if (!confirm('Czy na pewno chcesz wyczyścić wszystkie powiadomienia? To nie usunie klientów ani usług.')) {
        return;
    }
    
    // Po prostu zamknij modal - powiadomienia są generowane dynamicznie z aktywnych usług
    document.getElementById('notificationsModal').classList.remove('active');
    showToast('Powiadomienia zostały ukryte', 'info');
}

// Aktualizuj badge przy każdej zmianie danych
if (window.db) {
    db.collection('clients').onSnapshot(() => {
        updateNotificationBadge();
    });
}

// Eksporty globalne
window.updateNotificationBadge = updateNotificationBadge;
window.showNotificationsModal = showNotificationsModal;
window.clearNotifications = clearNotifications;

console.log('Notifications.js loaded');