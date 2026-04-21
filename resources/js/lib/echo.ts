import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally (required by Echo with reverb broadcaster)
(window as unknown as Record<string, unknown>).Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

/**
 * Get or create the Laravel Echo instance for WebSocket communication.
 * Uses Laravel Reverb as the WebSocket server with Passport Bearer token auth.
 */
export function getEcho(): Echo<'reverb'> {
    if (echoInstance) {
        return echoInstance;
    }

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY as string,
        wsHost: import.meta.env.VITE_REVERB_HOST as string,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME as string) === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/api/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });

    return echoInstance;
}

/**
 * Disconnect and reset the Echo instance.
 * Call this when the user logs in/out to refresh the auth token.
 */
export function resetEcho(): void {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
}
