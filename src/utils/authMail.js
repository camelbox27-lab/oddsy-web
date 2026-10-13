import { auth } from '../firebaseConfig';

/**
 * Kendi e-posta dogrulama / sifre sifirlama akisimizin istemci tarafi.
 *
 * Firebase'in mail sablonlari bu projede kilitli oldugu icin bu mailleri
 * /api/auth-mail (Vercel) uzerinden Resend ile biz gonderiyoruz.
 * Linkler dogrudan wondiyo.com.tr/auth/action adresine gelir.
 */

const ENDPOINT = '/api/auth-mail';

// Sunucudan donen hata kodlarini kullaniciya gosterilecek Turkce mesaja cevirir
const ERROR_MESSAGES = {
    'invalid-token': 'Bu bağlantı geçersiz.',
    'used-token': 'Bu bağlantı daha önce kullanılmış. Yeni bir bağlantı isteyin.',
    'expired-token': 'Bu bağlantının süresi dolmuş. Yeni bir bağlantı isteyin.',
    unauthenticated: 'Oturumunuz kapanmış. Lütfen tekrar giriş yapın.'
};

export function describeAuthMailError(err) {
    const raw = err?.message || '';
    return ERROR_MESSAGES[raw] || raw || 'İşlem sırasında bir hata oluştu.';
}

async function call(action, payload = {}) {
    let response;
    try {
        response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload })
        });
    } catch (networkErr) {
        throw new Error('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
}

/** Giris yapmis kullanicinin kimlik tokenini alir. */
async function currentIdToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('unauthenticated');
    return user.getIdToken();
}

/** Giris yapmis kullaniciya dogrulama maili gonderir. */
export async function requestEmailVerification() {
    const idToken = await currentIdToken();
    return call('requestEmailVerification', { idToken });
}

/** Dogrulama token'ini isler. */
export async function confirmEmailVerification(token) {
    return call('confirmEmailVerification', { token });
}

/** Sifre sifirlama maili gonderir. */
export async function requestPasswordReset(email) {
    return call('requestPasswordReset', { email });
}

/** Token ile yeni sifreyi kaydeder. */
export async function confirmPasswordResetWithToken(token, newPassword) {
    return call('confirmPasswordReset', { token, newPassword });
}
