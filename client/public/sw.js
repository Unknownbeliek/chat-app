// Service Worker for Ping Web Push Notifications

self.addEventListener('push', (event) => {
  let data = { title: 'Ping Chat', body: 'New notification received!', url: '/' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    console.error('Error parsing push notification JSON payload:', err);
  }

  const options = {
    body: data.body || 'You have a new message on Ping.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
    tag: 'ping-message-' + Date.now(),
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ping Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
