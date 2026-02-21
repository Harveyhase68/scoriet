/**
 * Scoriet Push Notification Service Worker
 * Handles Web Push events and notification clicks
 */

self.addEventListener('push', function (event) {
    if (!event.data) {
        return;
    }

    var data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Scoriet',
            body: event.data.text(),
            url: '/',
            icon: '/icons/icon-192x192.png',
        };
    }

    var options = {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-96x96.png',
        tag: data.tag || 'scoriet-notification',
        renotify: true,
        data: {
            url: data.url || '/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Scoriet', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    var targetUrl = event.notification.data && event.notification.data.url
        ? event.notification.data.url
        : '/';

    // Try to focus an existing Scoriet tab, or open a new one
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
                    client.focus();
                    if (targetUrl !== '/') {
                        client.navigate(targetUrl);
                    }
                    return;
                }
            }
            // No existing tab found, open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
