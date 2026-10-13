/**
 * Kendi e-posta dogrulama ve sifre sifirlama akisimiz.
 *
 * Firebase'in sablon sistemi bu projede kilitli oldugu icin (konsol:
 * "Email template updates are currently unavailable for this project")
 * dogrulama ve sifre sifirlama maillerini kendimiz uretip Resend uzerinden
 * gonderiyoruz. Boylece Action URL, gonderen adresi ve mail icerigi
 * tamamen bizim kontrolumuzde.
 *
 * Token'lar Firestore'da authTokens koleksiyonunda SHA-256 ozeti olarak
 * tutulur; duz token sadece mailde gider. Koleksiyona istemci erisimi
 * firestore.rules ile tamamen kapalidir, buraya yalnizca Admin SDK yazar.
 */

const crypto = require('crypto');
const admin = require('firebase-admin');

const SITE_URL = 'https://wondiyo.com.tr';
const ACTION_PATH = '/auth/action';
const FROM_ADDRESS = 'Wondiyo <noreply@wondiyo.com.tr>';
const REPLY_TO = 'wondiyodestek@gmail.com';

// Token gecerlilik sureleri
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;      // 24 saat
const RESET_TTL_MS = 60 * 60 * 1000;            // 1 saat

// Ayni kullaniciya cok sik mail gonderilmesini engelle
const RESEND_COOLDOWN_MS = 60 * 1000;           // 1 dakika

const TOKEN_COLLECTION = 'authTokens';
// Kullanici+tur basina tek kayit: son gonderim zamani ve aktif token ozeti.
// Boylece sorgu yapmadan calisiyoruz, composite index gerekmiyor.
const META_COLLECTION = 'authTokenMeta';

const metaId = (uid, type) => `${uid}__${type}`;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const createToken = () => crypto.randomBytes(32).toString('base64url');

/**
 * Token uretir, ozetini Firestore'a yazar ve duz halini dondurur.
 * Ayni kullanicinin ayni turdeki eski token'lari gecersiz kilinir.
 */
async function issueToken({ uid, email, type, ttlMs }) {
    const db = admin.firestore();
    const now = Date.now();
    const metaRef = db.collection(META_COLLECTION).doc(metaId(uid, type));

    // Onceki aktif token'i gecersiz kil: ayni anda tek gecerli link olsun
    const metaSnap = await metaRef.get();
    const previousHash = metaSnap.exists ? metaSnap.data().activeHash : null;

    const token = createToken();
    const hash = sha256(token);

    const batch = db.batch();
    if (previousHash && previousHash !== hash) {
        batch.delete(db.collection(TOKEN_COLLECTION).doc(previousHash));
    }
    batch.set(db.collection(TOKEN_COLLECTION).doc(hash), {
        uid,
        email,
        type,
        createdAt: now,
        expiresAt: now + ttlMs,
        usedAt: null
    });
    batch.set(metaRef, { uid, type, activeHash: hash, lastSentAt: now });
    await batch.commit();

    return token;
}

/**
 * Token'i dogrular ve tek kullanimlik olacak sekilde isaretler.
 * Gecersiz/suresi dolmus/kullanilmis token'da hata firlatir.
 */
async function consumeToken(token, expectedType) {
    if (!token || typeof token !== 'string') {
        throw new Error('invalid-token');
    }

    const db = admin.firestore();
    const ref = db.collection(TOKEN_COLLECTION).doc(sha256(token));

    return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error('invalid-token');

        const data = snap.data();
        if (data.type !== expectedType) throw new Error('invalid-token');
        if (data.usedAt) throw new Error('used-token');
        if (Date.now() > data.expiresAt) throw new Error('expired-token');

        tx.update(ref, { usedAt: Date.now() });
        return { uid: data.uid, email: data.email };
    });
}

/** Son gonderimden bu yana yeterli sure gecti mi? (tek dokuman okumasi) */
async function isWithinCooldown(uid, type) {
    const snap = await admin.firestore()
        .collection(META_COLLECTION)
        .doc(metaId(uid, type))
        .get();

    if (!snap.exists) return false;
    return Date.now() - (snap.data().lastSentAt || 0) < RESEND_COOLDOWN_MS;
}

// ===== MAIL GONDERIMI =====

/** Resend REST API (Node 18+ global fetch, ek bagimlilik yok) */
async function sendMail({ apiKey, to, subject, html }) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: FROM_ADDRESS,
            reply_to: REPLY_TO,
            to: [to],
            subject,
            html
        })
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`resend-failed: ${response.status} ${detail}`);
    }
}

// ===== SABLONLAR =====

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
        <tr>
          <td style="background:#0f1115;padding:24px;text-align:center;">
            <span style="font-size:26px;font-weight:800;letter-spacing:1px;color:#ffffff;">won<span style="color:#FDB913;">diyo</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
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
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;background:#fafafa;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0 0 4px;font-size:12px;color:#999;">wondiyo.com.tr</p>
            <p style="margin:0;font-size:11px;color:#bbb;">Sorularınız için: ${REPLY_TO}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const buildActionLink = (mode, token) =>
    `${SITE_URL}${ACTION_PATH}?mode=${mode}&token=${encodeURIComponent(token)}`;

function verificationEmail(token) {
    const link = buildActionLink('verifyEmail', token);
    return {
        subject: 'Hesabınızı doğrulayın - Wondiyo',
        html: layout({
            heading: 'Hesabınızı doğrulayın',
            intro: 'Wondiyo hesabınızı kullanmaya başlamak için e-posta adresinizi doğrulamanız gerekiyor.',
            buttonLabel: 'Hesabımı Doğrula',
            link,
            note: 'Bu bağlantı 24 saat geçerlidir. Böyle bir talepte bulunmadıysanız bu e-postayı yok sayabilirsiniz.'
        })
    };
}

function passwordResetEmail(token) {
    const link = buildActionLink('resetPassword', token);
    return {
        subject: 'Şifre sıfırlama - Wondiyo',
        html: layout({
            heading: 'Şifrenizi sıfırlayın',
            intro: 'Wondiyo hesabınızın şifresini sıfırlamak için aşağıdaki butona tıklayın.',
            buttonLabel: 'Yeni Şifre Belirle',
            link,
            note: 'Bu bağlantı 1 saat geçerlidir. Şifre sıfırlama talebinde bulunmadıysanız bu e-postayı yok sayın, şifreniz değişmez.'
        })
    };
}

module.exports = {
    TOKEN_COLLECTION,
    META_COLLECTION,
    VERIFY_TTL_MS,
    RESET_TTL_MS,
    issueToken,
    consumeToken,
    isWithinCooldown,
    sendMail,
    verificationEmail,
    passwordResetEmail
};
