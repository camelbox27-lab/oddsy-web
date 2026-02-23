import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getAuth } from 'firebase-admin/auth';

let app;
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = initializeApp({ credential: cert(serviceAccount) });
    } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
    }
} else {
    app = getApps()[0];
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!app) {
        return res.status(500).json({ error: 'Firebase Admin başlatılamadı.' });
    }

    const { title, body, route, idToken } = req.body || {};
    if (!title || !body || !idToken) {
        return res.status(400).json({ error: 'Eksik parametre: title, body, idToken zorunlu' });
    }

    // ID Token ile admin kontrolü
    let uid;
    try {
        const decoded = await getAuth().verifyIdToken(idToken);
        uid = decoded.uid;
    } catch (e) {
        return res.status(401).json({ error: 'Geçersiz token: ' + e.message });
    }

    try {
        const userDoc = await getFirestore().collection('users').doc(uid).get();
        if (userDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'Yetkisiz' });
        }
    } catch (e) {
        return res.status(500).json({ error: 'Yetki kontrolü başarısız: ' + e.message });
    }

    // FCM token'ları çek
    let tokens = [];
    try {
        const snap = await getFirestore().collection('users').where('fcmToken', '!=', null).get();
        tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);
    } catch (e) {
        return res.status(500).json({ error: 'Token listesi alınamadı: ' + e.message });
    }

    if (tokens.length === 0) {
        return res.status(200).json({ sent: 0, message: 'Bildirim alacak kullanıcı yok' });
    }

    // Bildirimi gönder
    try {
        const result = await getMessaging().sendEachForMulticast({
            notification: { title, body },
            data: route ? { route } : {},
            tokens,
        });
        return res.status(200).json({ sent: result.successCount, failed: result.failureCount });
    } catch (e) {
        return res.status(500).json({ error: 'Bildirim gönderilemedi: ' + e.message });
    }
}
