const CACHE_NAME = 'ksa-lending-v1.0.0';
const STATIC_CACHE = 'ksa-lending-static-v1.0.0';
const DYNAMIC_CACHE = 'ksa-lending-dynamic-v1.0.0';

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/individual',
  '/company', 
  '/institution',
  '/login',
  '/register',
  '/offline',
  '/manifest.json',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/v1\/assessments/,
  /^\/api\/v1\/entities/,
  /^\/api\/v1\/auth/,
];

// Resources that should always be fetched fresh
const NEVER_CACHE = [
  /^\/api\/v1\/auth\/token/,
  /^\/api\/v1\/scoring/,
  /^\/api\/v1\/fraud/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Never cache certain endpoints
  if (NEVER_CACHE.some(pattern => pattern.test(url.pathname))) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (url.pathname.startsWith('/api/')) {
    // Other API requests - network only
    return;
  } else {
    // Pages - stale while revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'assessment-submission') {
    event.waitUntil(syncAssessmentSubmissions());
  } else if (event.tag === 'entity-update') {
    event.waitUntil(syncEntityUpdates());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from KSA Lending',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification('KSA Lending System', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Caching strategies
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first error:', error);
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    console.log('[SW] Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    console.log('[SW] Network failed for:', request.url);
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }

  // Otherwise wait for network
  console.log('[SW] No cache, waiting for network:', request.url);
  return fetchPromise;
}

// Background sync functions
async function syncAssessmentSubmissions() {
  try {
    const db = await openIndexedDB();
    const pendingSubmissions = await getPendingSubmissions(db);
    
    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/v1/assessments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${submission.token}`
          },
          body: JSON.stringify(submission.data)
        });

        if (response.ok) {
          await removePendingSubmission(db, submission.id);
          console.log('[SW] Synced assessment submission:', submission.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync submission:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

async function syncEntityUpdates() {
  try {
    const db = await openIndexedDB();
    const pendingUpdates = await getPendingEntityUpdates(db);
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/v1/entities/${update.entityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${update.token}`
          },
          body: JSON.stringify(update.data)
        });

        if (response.ok) {
          await removePendingEntityUpdate(db, update.id);
          console.log('[SW] Synced entity update:', update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync entity update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Entity sync error:', error);
  }
}

// IndexedDB helpers for offline storage
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KSALendingDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingSubmissions')) {
        db.createObjectStore('pendingSubmissions', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingEntityUpdates')) {
        db.createObjectStore('pendingEntityUpdates', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('cachedAssessments')) {
        db.createObjectStore('cachedAssessments', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingSubmissions(db) {
  const transaction = db.transaction(['pendingSubmissions'], 'readonly');
  const store = transaction.objectStore('pendingSubmissions');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingEntityUpdates(db) {
  const transaction = db.transaction(['pendingEntityUpdates'], 'readonly');
  const store = transaction.objectStore('pendingEntityUpdates');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingSubmission(db, id) {
  const transaction = db.transaction(['pendingSubmissions'], 'readwrite');
  const store = transaction.objectStore('pendingSubmissions');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function removePendingEntityUpdate(db, id) {
  const transaction = db.transaction(['pendingEntityUpdates'], 'readwrite');
  const store = transaction.objectStore('pendingEntityUpdates');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}