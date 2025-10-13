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
});

// Modal powiadomień (możesz dodać do HTML jeśli chcesz)
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
    
    if (expiringClients.length === 0) {
        showToast('Brak ważnych powiadomień', 'info');
        return;
    }
    
    // Sortuj po czasie
    expiringClients.sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
    
    let message = 'Wygasające prowadzenia:\n\n';
    expiringClients.forEach(item => {
        message += `${item.client.firstName} ${item.client.lastName} - `;
        message += item.daysUntilEnd === 0 ? 'wygasa dziś!\n' : 
                   item.daysUntilEnd === 1 ? 'wygasa jutro\n' : 
                   `wygasa za ${item.daysUntilEnd} dni\n`;
    });
    
    alert(message);
}

// Aktualizuj badge przy każdej zmianie danych
if (window.db) {
    db.collection('clients').onSnapshot(() => {
        updateNotificationBadge();
    });
}

console.log('Notifications.js loaded');