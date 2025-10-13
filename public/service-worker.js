const CACHE_NAME = 'trener-panel-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/firebase-config.js',
    '/js/auth.js',
    '/js/app.js',
    '/js/clients.js',
    '/js/services.js',
    '/js/notes.js',
    '/js/measurements.js',
    '/js/charts.js',
    '/js/notifications.js',
    '/manifest.json'
];

// Instalacja Service Workera
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// Aktywacja Service Workera
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Obsługa requestów
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Zwróć z cache jeśli dostępne
                if (response) {
                    return response;
                }
                
                // Lub pobierz z sieci
                return fetch(event.request).then((response) => {
                    // Nie cache'uj jeśli nie OK
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Sklonuj response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                });
            })
            .catch(() => {
                // Fallback dla offline
                return caches.match('/index.html');
            })
    );
});