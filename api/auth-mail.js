import { createHash, randomBytes, createSign } from 'crypto';

/**
 * E-posta dogrulama ve sifre sifirlama akisi (Vercel serverless).
 *
 * Firebase konsolu bu proje icin mail sablonu guncellemelerini kilitledigi
 * ("Email template updates are currently unavailable for this project") ve
 * Action URL erisime kapali oddsy.com.tr adresinde kaldigi icin bu mailleri
 * Firebase'in sablon sistemiyle degil, kendimiz uretip Resend ile
 * gonderiyoruz. Proje Spark planinda oldugundan Cloud Functions yerine
 * Vercel kullaniliyor; api/send-notification.js ile ayni desen.
 *
 * POST /api/auth-mail  { action, ... }
 *   requestEmailVerification  { idToken }
 *   confirmEmailVerification  { token }
 *   requestPasswordReset      { email }
 *   confirmPasswordReset      { token, newPassword }
 */

const PROJECT_ID = 'oddsy-778d7';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const IDENTITY_URL = 'https://identitytoolkit.googleapis.com/v1';

const SITE_URL = 'https://wondiyo.com.tr';
const FROM_ADDRESS = 'Wondiyo <noreply@wondiyo.com.tr>';
const REPLY_TO = 'wondiyodestek@gmail.com';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;  // 24 saat
const RESET_TTL_MS = 60 * 60 * 1000;        // 1 saat
const RESEND_COOLDOWN_MS = 60 * 1000;       // 1 dakika

const ALLOWED_ORIGINS = [
    'https://wondiyo.com.tr',
    'https://www.wondiyo.com.tr'
];

// ===== GOOGLE KIMLIK DOGRULAMA =====

function toBase64Url(input) {
    const b64 = Buffer.isBuffer(input)
        ? input.toString('base64')
        : Buffer.from(input).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Service account'tan Google OAuth access token uretir. */
async function getOAuthToken(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);
    const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claimSet = toBase64Url(JSON.stringify({
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/cloud-platform'
    }));

    const signingInput = `${header}.${claimSet}`;
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    const jwt = `${signingInput}.${toBase64Url(sign.sign(serviceAccount.private_key))}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });
    if (!resp.ok) throw new Error(`OAuth ${resp.status}: ${(await resp.text()).slice(0, 200)}`);

    const data = await resp.json();
    if (!data.access_token) throw new Error('access_token bos dondu');
    return data.access_token;
}

/** Istemciden gelen idToken'i Google'a dogrulatir, kullaniciyi doner. */
async function verifyIdToken(idToken, apiKey) {
    const r = await fetch(`${IDENTITY_URL}/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
    });
    if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || `HTTP ${r.status}`);
    }
    const data = await r.json();
    const user = data.users?.[0];
    if (!user) throw new Error('Kullanici bulunamadi');
    return {
        uid: user.localId,
        email: user.email,
        emailVerified: user.emailVerified === true
    };
}

/** Admin yetkisiyle e-postadan kullanici arar. Yoksa null doner. */
async function lookupUserByEmail(email, accessToken) {
    const r = await fetch(`${IDENTITY_URL}/projects/${PROJECT_ID}/accounts:lookup`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: [email] })
    });
    if (!r.ok) return null;
    const data = await r.json();
    const user = data.users?.[0];
    return user ? { uid: user.localId, email: user.email } : null;
}

/** Admin yetkisiyle kullaniciyi gunceller (emailVerified / password). */
async function updateUser(fields, accessToken) {
    const r = await fetch(`${IDENTITY_URL}/projects/${PROJECT_ID}/accounts:update`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields)
    });
    if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || `accounts:update HTTP ${r.status}`);
    }
}

// ===== FIRESTORE (REST) =====

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const metaId = (uid, type) => `${uid}__${type}`;

async function firestoreGet(path, accessToken) {
    const r = await fetch(`${FIRESTORE_URL}/${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`Firestore GET ${path}: ${r.status}`);
    return r.json();
}

async function firestoreSet(path, fields, accessToken) {
    const r = await fetch(`${FIRESTORE_URL}/${path}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
    });
    if (!r.ok) throw new Error(`Firestore PATCH ${path}: ${(await r.text()).slice(0, 200)}`);
}

/**
 * Dokumani siler. requireExists ile, dokuman yoksa silme basarisiz olur.
 * Token'i tek kullanimlik yapmak icin bunu kullaniyoruz: ayni anda iki istek
 * gelirse yalnizca biri silebilir, digeri "kullanilmis" hatasi alir.
 */
async function firestoreDelete(path, accessToken, requireExists = false) {
    const url = requireExists
        ? `${FIRESTORE_URL}/${path}?currentDocument.exists=true`
        : `${FIRESTORE_URL}/${path}`;
    const r = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return r.ok;
}

const readString = (doc, key) => doc?.fields?.[key]?.stringValue ?? null;
const readNumber = (doc, key) => Number(doc?.fields?.[key]?.integerValue ?? 0);

// ===== TOKEN =====

/** Yeni token uretir, oncekini gecersiz kilar. Duz token'i doner. */
async function issueToken({ uid, email, type, ttlMs, accessToken }) {
    const now = Date.now();
    const meta = await firestoreGet(`authTokenMeta/${metaId(uid, type)}`, accessToken);
    const previousHash = readString(meta, 'activeHash');

    const token = randomBytes(32).toString('base64url');
    const hash = sha256(token);

    if (previousHash && previousHash !== hash) {
        await firestoreDelete(`authTokens/${previousHash}`, accessToken);
    }

    await firestoreSet(`authTokens/${hash}`, {
        uid: { stringValue: uid },
        email: { stringValue: email },
        type: { stringValue: type },
        createdAt: { integerValue: String(now) },
        expiresAt: { integerValue: String(now + ttlMs) }
    }, accessToken);

    await firestoreSet(`authTokenMeta/${metaId(uid, type)}`, {
        uid: { stringValue: uid },
        type: { stringValue: type },
        activeHash: { stringValue: hash },
        lastSentAt: { integerValue: String(now) }
    }, accessToken);

    return token;
}

/** Token'i dogrular ve tuketir (siler). Gecersizse hata firlatir. */
async function consumeToken(token, expectedType, accessToken) {
    if (!token || typeof token !== 'string') throw new Error('invalid-token');

    const hash = sha256(token);
    const doc = await firestoreGet(`authTokens/${hash}`, accessToken);
    if (!doc) throw new Error('invalid-token');
    if (readString(doc, 'type') !== expectedType) throw new Error('invalid-token');

    if (Date.now() > readNumber(doc, 'expiresAt')) {
        await firestoreDelete(`authTokens/${hash}`, accessToken);
        throw new Error('expired-token');
    }

    // Silme basarisizsa token baska bir istek tarafindan tuketilmis demektir
    const deleted = await firestoreDelete(`authTokens/${hash}`, accessToken, true);
    if (!deleted) throw new Error('used-token');

    return { uid: readString(doc, 'uid'), email: readString(doc, 'email') };
}

/** Son gonderimin uzerinden yeterli sure gecti mi? */
async function isWithinCooldown(uid, type, accessToken) {
    const meta = await firestoreGet(`authTokenMeta/${metaId(uid, type)}`, accessToken);
    if (!meta) return false;
    return Date.now() - readNumber(meta, 'lastSentAt') < RESEND_COOLDOWN_MS;
}

// ===== MAIL =====

const escapeHtml = (text = '') => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function layout({ heading, intro, buttonLabel, link, note }) {
    return `<!doctype html>
<html lang="tr">
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#0f1115;padding:24px;text-align:center;">
          <span style="font-size:26px;font-weight:800;letter-spacing:1px;color:#ffffff;">won<span style="color:#FDB913;">diyo</span></span>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <h1 style="margin:0 0 14px;font-size:20px;color:#0f1115;">${escapeHtml(heading)}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4a4a;">${escapeHtml(intro)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td style="border-radius:10px;background:#FDB913;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#0f1115;text-decoration:none;">${escapeHtml(buttonLabel)}</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#8a8a8a;">Buton çalışmazsa bu adresi tarayıcınıza yapıştırın:</p>
          <p style="margin:0 0 24px;font-size:12px;word-break:break-all;"><a href="${link}" style="color:#1a73e8;">${link}</a></p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8a8a;">${escapeHtml(note)}</p>
        </td></tr>
        <tr><td style="padding:18px 28px;background:#fafafa;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;">wondiyo.com.tr</p>
          <p style="margin:0;font-size:11px;color:#bbb;">Sorularınız için: ${REPLY_TO}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const buildActionLink = (mode, token) =>
    `${SITE_URL}/auth/action?mode=${mode}&token=${encodeURIComponent(token)}`;

function verificationEmail(token) {
    return {
        subject: 'Hesabınızı doğrulayın - Wondiyo',
        html: layout({
            heading: 'Hesabınızı doğrulayın',
            intro: 'Wondiyo hesabınızı kullanmaya başlamak için e-posta adresinizi doğrulamanız gerekiyor.',
            buttonLabel: 'Hesabımı Doğrula',
            link: buildActionLink('verifyEmail', token),
            note: 'Bu bağlantı 24 saat geçerlidir. Böyle bir talepte bulunmadıysanız bu e-postayı yok sayabilirsiniz.'
        })
    };
}

function passwordResetEmail(token) {
    return {
        subject: 'Şifre sıfırlama - Wondiyo',
        html: layout({
            heading: 'Şifrenizi sıfırlayın',
            intro: 'Wondiyo hesabınızın şifresini sıfırlamak için aşağıdaki butona tıklayın.',
            buttonLabel: 'Yeni Şifre Belirle',
            link: buildActionLink('resetPassword', token),
            note: 'Bu bağlantı 1 saat geçerlidir. Şifre sıfırlama talebinde bulunmadıysanız bu e-postayı yok sayın, şifreniz değişmez.'
        })
    };
}

async function sendMail({ apiKey, to, subject, html }) {
    const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: FROM_ADDRESS, reply_to: REPLY_TO, to: [to], subject, html })
    });
    if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

// ===== HANDLER =====

export default async function handler(req, res) {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { action } = req.body || {};
    if (!action) return res.status(400).json({ error: 'action zorunlu' });

    // Ortam degiskenleri
    const resendKey = process.env.RESEND_API_KEY;
    const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!rawServiceAccount) return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT eksik' });
    if (!firebaseApiKey) return res.status(500).json({ error: 'VITE_FIREBASE_API_KEY eksik' });

    let accessToken;
    try {
        accessToken = await getOAuthToken(JSON.parse(rawServiceAccount));
    } catch (e) {
        console.error('OAuth hatasi:', e);
        return res.status(500).json({ error: 'Sunucu kimlik dogrulama hatasi' });
    }

    try {
        // --- Dogrulama maili iste ---
        if (action === 'requestEmailVerification') {
            if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY eksik' });

            const { idToken } = req.body;
            if (!idToken) return res.status(400).json({ error: 'idToken zorunlu' });

            let user;
            try {
                user = await verifyIdToken(idToken, firebaseApiKey);
            } catch (e) {
                return res.status(401).json({ error: 'unauthenticated' });
            }

            if (user.emailVerified) return res.status(200).json({ alreadyVerified: true });
            if (!user.email) return res.status(400).json({ error: 'Hesapta e-posta adresi yok.' });

            if (await isWithinCooldown(user.uid, 'verifyEmail', accessToken)) {
                return res.status(429).json({ error: 'Az önce bir doğrulama maili gönderildi. Lütfen bir dakika bekleyin.' });
            }

            const token = await issueToken({
                uid: user.uid, email: user.email, type: 'verifyEmail',
                ttlMs: VERIFY_TTL_MS, accessToken
            });
            const mail = verificationEmail(token);
            await sendMail({ apiKey: resendKey, to: user.email, subject: mail.subject, html: mail.html });

            return res.status(200).json({ sent: true });
        }

        // --- Dogrulama token'ini isle ---
        if (action === 'confirmEmailVerification') {
            const payload = await consumeToken(req.body.token, 'verifyEmail', accessToken);
            await updateUser({ localId: payload.uid, emailVerified: true }, accessToken);
            return res.status(200).json({ verified: true, email: payload.email });
        }

        // --- Sifre sifirlama maili iste ---
        if (action === 'requestPasswordReset') {
            if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY eksik' });

            const email = String(req.body.email || '').trim();
            if (!email) return res.status(400).json({ error: 'E-posta adresi zorunlu.' });

            const user = await lookupUserByEmail(email, accessToken);
            // Hesap yoksa da basarili donuyoruz: kayitli adresler sizdirilmasin
            if (!user) return res.status(200).json({ sent: true });

            if (await isWithinCooldown(user.uid, 'resetPassword', accessToken)) {
                return res.status(429).json({ error: 'Az önce bir sıfırlama maili gönderildi. Lütfen bir dakika bekleyin.' });
            }

            const token = await issueToken({
                uid: user.uid, email: user.email, type: 'resetPassword',
                ttlMs: RESET_TTL_MS, accessToken
            });
            const mail = passwordResetEmail(token);
            await sendMail({ apiKey: resendKey, to: user.email, subject: mail.subject, html: mail.html });

            return res.status(200).json({ sent: true });
        }

        // --- Yeni sifreyi kaydet ---
        if (action === 'confirmPasswordReset') {
            const { newPassword } = req.body;
            if (!newPassword || String(newPassword).length < 6) {
                return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
            }

            const payload = await consumeToken(req.body.token, 'resetPassword', accessToken);
            // Sifresini sifirlayabilen kisi mail adresine erisiyor demektir
            await updateUser({
                localId: payload.uid,
                password: String(newPassword),
                emailVerified: true
            }, accessToken);

            return res.status(200).json({ reset: true, email: payload.email });
        }

        return res.status(400).json({ error: 'Bilinmeyen action' });
    } catch (e) {
        const known = ['invalid-token', 'used-token', 'expired-token'];
        if (known.includes(e.message)) return res.status(400).json({ error: e.message });

        console.error('auth-mail hatasi:', e);
        return res.status(500).json({ error: 'İşlem tamamlanamadı. Lütfen tekrar deneyin.' });
    }
}
