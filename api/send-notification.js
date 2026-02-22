import admin from 'firebase-admin';

// Firebase Admin'i bir kez başlat
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, body, route, callerUid } = req.body;

    if (!title || !body || !callerUid) {
        return res.status(400).json({ error: 'Eksik parametre' });
    }

    // Admin kontrolü
    try {
        const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
        if (callerDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'Yetkisiz' });
        }
    } catch (e) {
        return res.status(500).json({ error: 'Yetki kontrolü başarısız' });
    }

    // FCM token'ları çek
    let tokens = [];
    try {
        const snap = await admin.firestore()
            .collection('users')
            .where('fcmToken', '!=', null)
            .get();
        tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);
    } catch (e) {
        return res.status(500).json({ error: 'Token listesi alınamadı' });
    }

    if (tokens.length === 0) {
        return res.status(200).json({ sent: 0, message: 'Bildirim alacak kullanıcı yok' });
    }

    // Bildirimi gönder
    try {
        const message = {
            notification: { title, body },
            data: route ? { route } : {},
            tokens,
        };
        const result = await admin.messaging().sendEachForMulticast(message);
        return res.status(200).json({ sent: result.successCount, failed: result.failureCount });
    } catch (e) {
        return res.status(500).json({ error: 'Bildirim gönderilemedi: ' + e.message });
    }
}
