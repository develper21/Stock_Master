'use client';

import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service worker registered:', reg);
          setRegistration(reg);
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showNotification = (title, options = {}) => {
    if (registration && 'Notification' in window && Notification.permission === 'granted') {
      registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    }
  };

  const subscribeToPush = async () => {
    if (!registration) return null;

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  };

  return {
    isSupported,
    isOnline,
    requestNotificationPermission,
    showNotification,
    subscribeToPush,
  };
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  };

  return {
    isInstallable,
    install,
  };
}

export function useOfflineQueue() {
  const [isQueueActive, setIsQueueActive] = useState(false);

  const addToQueue = async (request) => {
    try {
      const db = await openDB();
      const tx = db.transaction(['pendingRequests'], 'readwrite');
      const store = tx.objectStore('pendingRequests');
      
      await store.add({
        url: request.url,
        options: {
          method: request.method,
          headers: request.headers,
          body: request.body,
        },
        timestamp: Date.now(),
      });
      
      setIsQueueActive(true);
      
      // Register for background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      }
    } catch (error) {
      console.error('Failed to add to queue:', error);
    }
  };

  const processQueue = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(['pendingRequests'], 'readwrite');
      const store = tx.objectStore('pendingRequests');
      const requests = await store.getAll();
      
      for (const request of requests) {
        try {
          await fetch(request.url, request.options);
          await store.delete(request.id);
        } catch (error) {
          console.error('Failed to process queued request:', error);
        }
      }
      
      setIsQueueActive(false);
    } catch (error) {
      console.error('Failed to process queue:', error);
    }
  };

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StockMasterOffline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pendingRequests')) {
          db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  return {
    isQueueActive,
    addToQueue,
    processQueue,
  };
}
