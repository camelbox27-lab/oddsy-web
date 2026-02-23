import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app;
let credential;
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = cert(serviceAccount);
        app = initializeApp({ credential });
    } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
    }
} else {
    app = getApps()[0];
    credential = app.options.credential;
}

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'oddsy-778d7';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAccessToken() {
    const token = await credential.getAccessToken();
    return token.access_token;
}

async function firestoreGet(path, accessToken) {
    const res = await fetch(`${FIRESTORE_BASE}/${path}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Firestore GET failed: ${res.status}`);
    return res.json();
}

async function firestoreQuery(collectionPath, filters, accessToken) {
    const body = {
        structuredQuery: {
            from: [{ collectionId: collectionPath }],
            where: {
                fieldFilter: {
                    field: { fieldPath: filters.field },
                    op: filters.op,
                    value: filters.value,
                }
            }
        }
    };
    const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Firestore query failed: ${res.status}`);
    return res.json();
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!app) return res.status(500).json({ error: 'Firebase Admin başlatılamadı.' });

    const { title, body, route, idToken } = req.body || {};
    if (!title || !body || !idToken) {
        return res.status(400).json({ error: 'Eksik parametre: title, body, idToken zorunlu' });
    }

    // 1. Token doğrula
    let uid;
    try {
        const decoded = await getAuth().verifyIdToken(idToken);
        uid = decoded.uid;
    } catch (e) {
        return res.status(401).json({ error: 'Geçersiz token: ' + e.message });
    }

    // 2. Firestore REST ile admin kontrolü
    let accessToken;
    try {
        accessToken = await getAccessToken();
    } catch (e) {
        return res.status(500).json({ error: 'Access token alınamadı: ' + e.message });
    }

    try {
        const userDoc = await firestoreGet(`users/${uid}`, accessToken);
        const role = userDoc.fields?.role?.stringValue;
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Yetkisiz' });
        }
    } catch (e) {
        return res.status(500).json({ error: 'Yetki kontrolü başarısız: ' + e.message });
    }

    // 3. FCM token'ları Firestore REST ile çek
    let tokens = [];
    try {
        const results = await firestoreQuery('users', {
            field: 'fcmToken',
            op: 'IS_NOT_NULL',
            value: { nullValue: 'NULL_VALUE' },
        }, accessToken);

        tokens = results
            .filter(r => r.document)
            .map(r => r.document.fields?.fcmToken?.stringValue)
            .filter(Boolean);
    } catch (e) {
        return res.status(500).json({ error: 'Token listesi alınamadı: ' + e.message });
    }

    if (tokens.length === 0) {
        return res.status(200).json({ sent: 0, message: 'Bildirim alacak kullanıcı yok' });
    }

    // 4. FCM ile bildirim gönder (FCM HTTP v1 REST API)
    try {
        const fcmResults = await Promise.allSettled(
            tokens.map(token =>
                fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: {
                            token,
                            notification: { title, body },
                            data: route ? { route } : {},
                        }
                    }),
                })
            )
        );

        const sent = fcmResults.filter(r => r.status === 'fulfilled').length;
        const failed = fcmResults.filter(r => r.status === 'rejected').length;
        return res.status(200).json({ sent, failed });
    } catch (e) {
        return res.status(500).json({ error: 'Bildirim gönderilemedi: ' + e.message });
    }
}
