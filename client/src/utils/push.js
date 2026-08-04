// Utility to convert Base64 URL VAPID key to Uint8Array required by pushManager.subscribe
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Get API Server Base URL
function getApiUrl() {
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:9000';
  }
  return 'https://chat-app-m8ua.onrender.com';
}

// Register Service Worker
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push Messaging & Service Workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

// Subscribe User to Web Push Notifications
export async function subscribeUserToPush(username) {
  if (!username) return { success: false, error: 'User is not authenticated' };

  try {
    const registration = await registerServiceWorker();
    if (!registration) return { success: false, error: 'Service worker not supported' };

    // Request Notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, permission, error: 'Notification permission denied' };
    }

    // Fetch VAPID Public Key from server
    const apiBase = getApiUrl();
    const vapidRes = await fetch(`${apiBase}/api/push/vapid-key`);
    const { vapidPublicKey } = await vapidRes.json();

    if (!vapidPublicKey) {
      return { success: false, error: 'Server VAPID public key not found' };
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe via PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // Send subscription object to backend server
    const subRes = await fetch(`${apiBase}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        subscription
      })
    });

    const subData = await subRes.json();
    if (subData.success) {
      return { success: true, permission: 'granted', subscription };
    } else {
      return { success: false, error: subData.error || 'Failed to save subscription' };
    }
  } catch (err) {
    console.error('Error subscribing to push notifications:', err);
    return { success: false, error: err.message };
  }
}

// Unsubscribe User from Web Push
export async function unsubscribeUserFromPush(username) {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        const apiBase = getApiUrl();
        await fetch(`${apiBase}/api/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, endpoint: subscription.endpoint })
        });
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Error unsubscribing from push:', err);
    return { success: false, error: err.message };
  }
}
