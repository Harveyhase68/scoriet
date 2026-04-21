/**
 * Scoriet Web Push Notification Utilities
 *
 * Handles service worker registration, push subscription management,
 * and communication with the backend API.
 */

/**
 * Check if the browser supports push notifications
 */
export function isPushSupported(): boolean {
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

/**
 * Get the current notification permission status
 */
export function getPushPermission(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}

/**
 * Convert a base64 URL-safe string to a Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Register the push service worker
 */
async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
    const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
    });
    // Wait for the service worker to be active
    await navigator.serviceWorker.ready;
    return registration;
}

/**
 * Get the VAPID public key from the backend
 */
async function getVapidKey(): Promise<string | null> {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const response = await fetch('/api/push/vapid-key', {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        console.error('[Push] VAPID key endpoint returned:', response.status, response.statusText);
        return null;
    }
    const data = await response.json();
    if (!data.public_key) {
        console.error('[Push] Server returned empty VAPID public_key. Check VAPID_PUBLIC_KEY in .env');
        return null;
    }
    return data.public_key;
}

/**
 * Subscribe to push notifications
 * Returns true if subscription was successful
 */
export async function subscribeToPush(): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('[Push] Not supported in this browser');
        return false;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.warn('[Push] Permission not granted:', permission);
        return false;
    }

    try {
        // Register service worker
        console.log('[Push] Registering service worker...');
        const registration = await registerPushServiceWorker();
        console.log('[Push] Service worker registered:', registration.scope);

        // Get VAPID key
        console.log('[Push] Fetching VAPID key...');
        const vapidKey = await getVapidKey();
        if (!vapidKey || typeof vapidKey !== 'string' || vapidKey.trim().length === 0) {
            console.error('[Push] VAPID key is missing or invalid! Check VAPID_PUBLIC_KEY in server .env file. Received:', vapidKey);
            return false;
        }
        console.log('[Push] VAPID key received, length:', vapidKey.length);
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);

        // Subscribe to push
        console.log('[Push] Subscribing to PushManager...');
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // TypeScript 5.x narrowed `BufferSource` so a plain `Uint8Array` is
            // typed `Uint8Array<ArrayBufferLike>` (includes SharedArrayBuffer)
            // but the DOM API expects `ArrayBufferView<ArrayBuffer>` only. At
            // runtime our `new Uint8Array(size)` always has a regular
            // ArrayBuffer backing, so the cast is safe.
            applicationServerKey: applicationServerKey as BufferSource,
        });
        console.log('[Push] Browser subscription created:', subscription.endpoint);

        // Send subscription to backend
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        const subscriptionJson = subscription.toJSON();

        console.log('[Push] Sending subscription to backend...');
        const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                endpoint: subscriptionJson.endpoint,
                keys: {
                    p256dh: subscriptionJson.keys?.p256dh,
                    auth: subscriptionJson.keys?.auth,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Push] Backend subscribe failed:', response.status, errorText);
            return false;
        }

        console.log('[Push] Successfully subscribed!');
        return true;
    } catch (error) {
        console.error('[Push] Subscription failed:', error);
        return false;
    }
}

/**
 * Unsubscribe from push notifications
 * Returns true if unsubscription was successful
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    if (!isPushSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration) {
            return true; // No registration means already unsubscribed
        }

        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            return true; // No subscription means already unsubscribed
        }

        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from backend
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        await fetch('/api/push/unsubscribe', {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
            }),
        });

        return true;
    } catch (error) {
        console.error('Push unsubscription failed:', error);
        return false;
    }
}

/**
 * Check if the user currently has an active push subscription
 */
export async function hasPushSubscription(): Promise<boolean> {
    if (!isPushSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration) {
            return false;
        }
        const subscription = await registration.pushManager.getSubscription();
        return subscription !== null;
    } catch {
        return false;
    }
}
