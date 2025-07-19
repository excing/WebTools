// 编写一个 sveltekit api, 动态生成 Firebase Cloud Message Service Worker

import { env } from "$env/dynamic/public";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
    const swContent = `importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

firebase.initializeApp(${env.PUBLIC_GOOGLE_FIREBASE_CONFIG});

console.log('Get firebase initialized app on sw');

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title;
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/icon-192x192.png', // 添加图标
        badge: '/badge-72x72.png', // 添加徽章
        tag: 'firebase-notification'
    };

    // 使用 self.registration.showNotification 而不是 new Notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 处理通知点击事件
self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    // 打开或聚焦到应用
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // 如果应用已经打开，就聚焦到它
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // 如果应用没有打开，就打开它
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});`;

    return new Response(swContent, {
        headers: {
            'Content-Type': 'application/javascript',
            'Service-Worker-Allowed': '/'
        }
    });
}