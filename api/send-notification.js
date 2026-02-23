import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(serviceAccount) });
    } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!getApps().length) {
        return res.status(500).json({ error: 'Firebase Admin başlatılamadı. FIREBASE_SERVICE_ACCOUNT env var eksik.' });
    }

    const { title, body, route, callerUid } = req.body || {};
    if (!title || !body || !callerUid) {
        return res.status(400).json({ error: 'Eksik parametre: title, body, callerUid zorunlu' });
    }

    const firestore = getFirestore();

    try {
        const callerDoc = await firestore.collection('users').doc(callerUid).get();
        if (callerDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'Yetkisiz' });
        }
    } catch (e) {
        return res.status(500).json({ error: 'Yetki kontrolü başarısız: ' + e.message });
    }

    let tokens = [];
    try {
        const snap = await firestore.collection('users').where('fcmToken', '!=', null).get();
        tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);
    } catch (e) {
        return res.status(500).json({ error: 'Token listesi alınamadı: ' + e.message });
    }

    if (tokens.length === 0) {
        return res.status(200).json({ sent: 0, message: 'Bildirim alacak kullanıcı yok' });
    }

    try {
        const messaging = getMessaging();
        const result = await messaging.sendEachForMulticast({
            notification: { title, body },
            data: route ? { route } : {},
            tokens,
        });
        return res.status(200).json({ sent: result.successCount, failed: result.failureCount });
    } catch (e) {
        return res.status(500).json({ error: 'Bildirim gönderilemedi: ' + e.message });
    }
}
