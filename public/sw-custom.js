// Custom service worker enhancements
// This file will be included by next-pwa

self.addEventListener('message', (event) => {
  console.log('🔧 Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🚀 Service worker: Skipping waiting and taking control...');
    self.skipWaiting();
    
    // Force clients to claim the new service worker
    self.clients.claim().then(() => {
      console.log('✅ Service worker: Successfully claimed all clients');
      
      // Notify all clients that the service worker has been updated
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            message: 'Service worker updated successfully'
          });
        });
      });
    });
  }
});

// Enhanced install handler
self.addEventListener('install', (event) => {
  console.log('🔧 Service worker: Installing...');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Enhanced activate handler
self.addEventListener('activate', (event) => {
  console.log('🔧 Service worker: Activating...');
  
  event.waitUntil(
    // Take control of all pages under this SW's scope immediately,
    // instead of waiting for reload/navigation
    self.clients.claim().then(() => {
      console.log('✅ Service worker: Activated and claimed all clients');
      
      // Notify all clients that the new service worker is active
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          message: 'New service worker is now active'
        });
      });
    })
  );
});

// Handle fetch events for better caching
self.addEventListener('fetch', (event) => {
  // Let next-pwa handle the fetch events
  // This is just here for debugging if needed
});

console.log('🔧 Custom service worker loaded successfully'); 