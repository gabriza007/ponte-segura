// firebase-messaging-sw.js
// Este é o Service Worker para habilitar Notificações Push offline usando o Firebase Cloud Messaging.
// Para ativá-lo completamente, um projeto Firebase deve ter a Cloud Messaging API ativada
// e a configuração (firebaseConfig) deve ser adicionada abaixo com o seu Key Server.

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// INSIRA SUAS CREDENCIAIS AQUI SE DESEJA UTILIZAR:
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_DOMINIO",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_BUCKET",
    messagingSenderId: "SUA_MESSAGING_ID",
    appId: "SEU_APP_ID"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification.title || 'Novo Alerta de Segurança!';
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/vite.svg', // Substitua pelo ícone oficial do aplicativo
            vibrate: [200, 100, 200, 100, 200],
            data: payload.data
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.warn("Firebase Messaging Service Worker requires valid config to run:", e);
}
