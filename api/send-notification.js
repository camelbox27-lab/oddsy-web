import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = 'oddsy-778d7';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

// Modül seviyesinde uygulama ve credential
let firebaseApp = null;
let serviceAccountCredential = null;

function initFirebase() {
    if (getApps().length === 0) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        serviceAccountCredential = cert(serviceAccount);
        firebaseApp = initializeApp({ credential: serviceAccountCredential });
    } else {
        firebaseApp = getApp();
        // credential'ı tekrar oluştur (modül sıcak başlatmada kaybolabilir)
        if (!serviceAccountCredential) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            serviceAccountCredential = cert(serviceAccount);
        }
    }
}

async function getOAuthToken() {
    const token = await serviceAccountCredential.getAccessToken();
    return token.access_token;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { title, body, route, idToken } = req.body || {};
    if (!title || !body || !idToken) {
        return res.status(400).json({ error: 'Eksik parametre: title, body, idToken zorunlu' });
    }

    // Firebase başlat
    try {
        initFirebase();
    } catch (e) {
        return res.status(500).json({ error: 'Firebase başlatılamadı: ' + e.message });
    }

    // 1. ID Token doğrula
    let uid;
    try {
        const decoded = await getAuth(firebaseApp).verifyIdToken(idToken);
        uid = decoded.uid;
    } catch (e) {
        return res.status(401).json({ error: 'Geçersiz token: ' + e.message });
    }

    // 2. OAuth token al
    let accessToken;
    try {
        accessToken = await getOAuthToken();
    } catch (e) {
        return res.status(500).json({ error: 'OAuth token alınamadı: ' + e.message });
    }

    // 3. Admin rolü kontrol et (Firestore REST)
    try {
        const r = await fetch(`${FIRESTORE_URL}/users/${uid}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const doc = await r.json();
        const role = doc.fields?.role?.stringValue;
        if (role !== 'admin') {
            return res.status(403).json({ error: `Yetkisiz (rol: ${role || 'yok'})` });
        }
    } catch (e) {
        return res.status(500).json({ error: 'Rol kontrolü başarısız: ' + e.message });
    }

    // 4. FCM token'larını çek (Firestore REST - tüm users, client'ta filtrele)
    let tokens = [];
    try {
        let nextPageToken = null;
        do {
            const url = `${FIRESTORE_URL}/users?pageSize=300${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            if (data.documents) {
                data.documents.forEach(d => {
                    const token = d.fields?.fcmToken?.stringValue;
                    if (token) tokens.push(token);
                });
            }
            nextPageToken = data.nextPageToken || null;
        } while (nextPageToken);
    } catch (e) {
        return res.status(500).json({ error: 'Token listesi alınamadı: ' + e.message });
    }

    if (tokens.length === 0) {
        return res.status(200).json({ sent: 0, message: 'FCM tokeni olan kullanıcı yok' });
    }

    // 5. FCM ile bildirim gönder
    let sent = 0, failed = 0;
    const results = await Promise.allSettled(
        tokens.map(token =>
            fetch(FCM_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: {
                        token,
                        notification: { title, body },
                        ...(route ? { data: { route } } : {}),
                    },
                }),
            })
        )
    );
    sent = results.filter(r => r.status === 'fulfilled').length;
    failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({ sent, failed, total: tokens.length });
}
