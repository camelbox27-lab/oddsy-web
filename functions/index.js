const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const authMail = require('./authMail');

// Resend API anahtari. Deploy oncesi:
//   firebase functions:secrets:set RESEND_API_KEY
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

// Tüm FCM token'lı kullanıcılara push bildirim gönder
exports.sendPushNotification = onCall(async (request) => {
    // Sadece admin gönderebilir
    const callerUid = request.auth?.uid;
    if (!callerUid) throw new HttpsError('unauthenticated', 'Giriş yapılmamış.');

    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (callerDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Yetki yok.');
    }

    const { title, body, route } = request.data;
    if (!title || !body) throw new HttpsError('invalid-argument', 'Başlık ve mesaj zorunlu.');

    // fcmToken olan tüm kullanıcıları çek
    const usersSnap = await admin.firestore()
        .collection('users')
        .where('fcmToken', '!=', null)
        .get();

    const tokens = usersSnap.docs
        .map(d => d.data().fcmToken)
        .filter(Boolean);

    if (tokens.length === 0) return { sent: 0 };

    const message = {
        notification: { title, body },
        data: route ? { route } : {},
        tokens,
    };

    const result = await admin.messaging().sendEachForMulticast(message);
    return { sent: result.successCount, failed: result.failureCount };
});


// ===== E-POSTA DOGRULAMA VE SIFRE SIFIRLAMA =====
// Firebase'in mail sablonlari bu projede kilitli oldugu icin bu akis
// tamamen bizim: token'i biz uretiyoruz, maili Resend ile biz gonderiyoruz.

/** Giris yapmis kullaniciya dogrulama maili gonderir. */
exports.requestEmailVerification = onCall({ secrets: [RESEND_API_KEY] }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Giriş yapılmamış.');

    let user;
    try {
        user = await admin.auth().getUser(uid);
    } catch (err) {
        throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
    }

    if (user.emailVerified) return { alreadyVerified: true };
    if (!user.email) throw new HttpsError('failed-precondition', 'Hesapta e-posta adresi yok.');

    if (await authMail.isWithinCooldown(uid, 'verifyEmail')) {
        throw new HttpsError('resource-exhausted', 'Az önce bir doğrulama maili gönderildi. Lütfen bir dakika bekleyin.');
    }

    const token = await authMail.issueToken({
        uid,
        email: user.email,
        type: 'verifyEmail',
        ttlMs: authMail.VERIFY_TTL_MS
    });

    const mail = authMail.verificationEmail(token);
    try {
        await authMail.sendMail({
            apiKey: RESEND_API_KEY.value(),
            to: user.email,
            subject: mail.subject,
            html: mail.html
        });
    } catch (err) {
        console.error('Doğrulama maili gönderilemedi:', err);
        throw new HttpsError('internal', 'Mail gönderilemedi. Lütfen tekrar deneyin.');
    }

    return { sent: true };
});

/** Dogrulama token'ini isler ve hesabi dogrulanmis yapar. */
exports.confirmEmailVerification = onCall(async (request) => {
    const { token } = request.data || {};

    let payload;
    try {
        payload = await authMail.consumeToken(token, 'verifyEmail');
    } catch (err) {
        throw new HttpsError('invalid-argument', err.message);
    }

    await admin.auth().updateUser(payload.uid, { emailVerified: true });
    return { verified: true, email: payload.email };
});

/**
 * Sifre sifirlama maili gonderir.
 * Hesap olmasa bile ayni cevabi doner: kayitli mail adresi sizdirilmaz.
 */
exports.requestPasswordReset = onCall({ secrets: [RESEND_API_KEY] }, async (request) => {
    const email = String(request.data?.email || '').trim();
    if (!email) throw new HttpsError('invalid-argument', 'E-posta adresi zorunlu.');

    let user = null;
    try {
        user = await admin.auth().getUserByEmail(email);
    } catch (err) {
        // Hesap yok - yine de basarili donuyoruz
        return { sent: true };
    }

    if (await authMail.isWithinCooldown(user.uid, 'resetPassword')) {
        throw new HttpsError('resource-exhausted', 'Az önce bir sıfırlama maili gönderildi. Lütfen bir dakika bekleyin.');
    }

    const token = await authMail.issueToken({
        uid: user.uid,
        email: user.email,
        type: 'resetPassword',
        ttlMs: authMail.RESET_TTL_MS
    });

    const mail = authMail.passwordResetEmail(token);
    try {
        await authMail.sendMail({
            apiKey: RESEND_API_KEY.value(),
            to: user.email,
            subject: mail.subject,
            html: mail.html
        });
    } catch (err) {
        console.error('Şifre sıfırlama maili gönderilemedi:', err);
        throw new HttpsError('internal', 'Mail gönderilemedi. Lütfen tekrar deneyin.');
    }

    return { sent: true };
});

/** Sifre sifirlama token'ini isler ve yeni sifreyi kaydeder. */
exports.confirmPasswordReset = onCall(async (request) => {
    const { token, newPassword } = request.data || {};

    if (!newPassword || String(newPassword).length < 6) {
        throw new HttpsError('invalid-argument', 'Şifre en az 6 karakter olmalıdır.');
    }

    let payload;
    try {
        payload = await authMail.consumeToken(token, 'resetPassword');
    } catch (err) {
        throw new HttpsError('invalid-argument', err.message);
    }

    // Sifresini sifirlayabilen kisi mail adresine erisiyor demektir
    await admin.auth().updateUser(payload.uid, {
        password: String(newPassword),
        emailVerified: true
    });

    return { reset: true, email: payload.email };
});
