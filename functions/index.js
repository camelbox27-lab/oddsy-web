const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

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
