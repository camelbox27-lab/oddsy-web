import { createSign } from 'crypto';

const PROJECT_ID = 'oddsy-778d7';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
const RTDB_URL = process.env.VITE_FIREBASE_DATABASE_URL || `https://${PROJECT_ID}-default-rtdb.firebaseio.com`;

function toBase64Url(input) {
    const b64 = Buffer.isBuffer(input)
        ? input.toString('base64')
        : Buffer.from(input).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// JWT payload'ı decode ederek UID al
function extractUidFromToken(idToken) {
    try {
        const parts = idToken.split('.');
        if (parts.length !== 3) throw new Error('Geçersiz JWT formatı');
        // base64url → base64 padding ekle
        const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
        if (!payload.sub) throw new Error('UID bulunamadı');
        return payload.sub;
    } catch (e) {
        throw new Error('Token decode hatası: ' + e.message);
    }
}

// Service Account'tan Google OAuth token üret
async function getOAuthToken(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);
    const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claimSet = toBase64Url(JSON.stringify({
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
    }));

    const signingInput = `${header}.${claimSet}`;
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    const signatureBuffer = sign.sign(serviceAccount.private_key);
    const signature = toBase64Url(signatureBuffer);
    const jwt = `${signingInput}.${signature}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OAuth ${resp.status}: ${text.substring(0, 300)}`);
    }
    const data = await resp.json();
    if (!data.access_token) throw new Error('access_token boş döndü');
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
        if (!serviceAccount.private_key || !serviceAccount.client_email) throw new Error('Geçersiz service account');
    } catch (e) {
        return res.status(500).json({ error: 'Service account hatası: ' + e.message });
    }

    // 1. idToken'ı identitytoolkit ile doğrula - Firestore quota kullanmaz
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'VITE_FIREBASE_API_KEY eksik' });

    let verifiedEmail;
    try {
        const r = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
        );
        if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            throw new Error(e.error?.message || `HTTP ${r.status}`);
        }
        const data = await r.json();
        if (!data.users?.[0]) throw new Error('Kullanıcı bulunamadı');
        verifiedEmail = data.users[0].email;
    } catch (e) {
        return res.status(401).json({ error: 'Token doğrulama başarısız: ' + e.message });
    }

    // 2. Admin email kontrolü (Firestore yok, quota yok)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ error: 'ADMIN_EMAIL env var eksik' });
    if (verifiedEmail !== adminEmail.trim()) {
        return res.status(403).json({ error: `Yetkisiz (${verifiedEmail})` });
    }

    // 3. OAuth token al (FCM ve tüm kullanıcı tokenları için)
    let accessToken;
    try {
        accessToken = await getOAuthToken(serviceAccount);
    } catch (e) {
        return res.status(500).json({ error: 'OAuth token alınamadı: ' + e.message });
    }

    // 4. FCM token'larını RTDB'den çek (Firestore quota kullanmaz)
    let tokens = [];
    try {
        const rtdbUrl = RTDB_URL.replace(/\/$/, '');
        const r = await fetch(`${rtdbUrl}/fcmTokens.json`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error(`RTDB HTTP ${r.status}`);
        const data = await r.json();
        if (data && typeof data === 'object') {
            tokens = Object.values(data).filter(t => typeof t === 'string' && t.length > 10);
        }
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
