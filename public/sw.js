const CACHE_NAME = 'food-tracker-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/style.css',
  '/src/components/App.js',
  '/src/components/HomePage.js',
  '/src/components/AddMealPage.js',
  '/src/components/StatsPage.js',
  '/src/components/SettingsPage.js',
  '/src/services/StorageService.js',
  '/src/services/OpenFoodFactsService.js',
  '/src/utils/Router.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Error caching resources:', error);
      })
  );
});

// Activate event - clean up old caches
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

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream that can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream that can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache GET requests
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(() => {
          // If both cache and network fail, provide fallback for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Handle background sync for offline meal creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // This would sync any offline-created meals when connection is restored
  // For now, we'll just log that sync occurred
  console.log('Background sync triggered - syncing offline data');
  
  // In a real implementation, you'd:
  // 1. Check for offline-created meals in IndexedDB
  // 2. Try to sync them to remote storage if configured
  // 3. Update local storage with sync status
}