'use client';

import { useEffect } from 'react';

/**
 * Clears any leftover service worker registrations for this origin.
 * The app does not use offline/PWA caching.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    });
  }, []);

  return null;
}
