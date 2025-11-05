// Service Worker para receber notificações em background
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js');

// Configuração do Firebase
firebase.initializeApp({
    apiKey: "AIzaSyBifj2D6aLhocaRtge5CiipgZVRnJam4_s",
    authDomain: "pascomhub-pdes.firebaseapp.com",
    projectId: "pascomhub-pdes",
    storageBucket: "pascomhub-pdes.firebasestorage.app",
    messagingSenderId: "1025128801675",
    appId: "1:1025128801675:web:bc25e801c65bf8b9e8fb8e"
});

const messaging = firebase.messaging();

// Recebe notificações em background
messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Notificação recebida em background:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/pascomWhite.png',
        badge: '/assets/pascomWhite.png',
        tag: payload.data?.eventoId || 'pascomhub-notification',
        requireInteraction: true
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});