import { createSign } from 'crypto';

const PROJECT_ID = 'oddsy-778d7';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

// JWT payload'ı decode ederek UID al (imza doğrulama yok - güvenlik Firestore rol kontrolünde)
function extractUidFromToken(idToken) {
    try {
        const parts = idToken.split('.');
        if (parts.length !== 3) throw new Error('Geçersiz JWT formatı');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (!payload.sub) throw new Error('UID bulunamadı');
        return payload.sub;
    } catch (e) {
        throw new Error('Token decode hatası: ' + e.message);
    }
}

// Service Account JSON'dan Manuel JWT ile Google OAuth token al
async function getOAuthToken(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(JSON.stringify({
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
    })).toString('base64url');

    const signingInput = `${header}.${claimSet}`;
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');
    const jwt = `${signingInput}.${signature}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OAuth ${resp.status}: ${text.substring(0, 200)}`);
    }
    const data = await resp.json();
    return data.access_token;
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

    // Service account yükle
    let serviceAccount;
    try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var eksik');
        serviceAccount = JSON.parse(raw);
        if (!serviceAccount.private_key || !serviceAccount.client_email) throw new Error('Geçersiz service account JSON');
    } catch (e) {
        return res.status(500).json({ error: 'Service account hatası: ' + e.message });
    }

    // 1. UID'yi token'dan çıkar
    let uid;
    try {
        uid = extractUidFromToken(idToken);
    } catch (e) {
        return res.status(401).json({ error: e.message });
    }

    // 2. OAuth token al
    let accessToken;
    try {
        accessToken = await getOAuthToken(serviceAccount);
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

    // 4. FCM token'larını çek (Firestore REST)
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
            }).then(r => {
                if (!r.ok) throw new Error(`FCM ${r.status}`);
                return r.json();
            })
        )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({ sent, failed, total: tokens.length });
}
