import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

/**
 * Kendi e-posta dogrulama / sifre sifirlama akisimizin istemci tarafi.
 *
 * Firebase'in mail sablonlari bu projede kilitli oldugu icin bu mailleri
 * Cloud Functions uzerinden Resend ile biz gonderiyoruz. Linkler dogrudan
 * wondiyo.com.tr/auth/action adresine gelir.
 */

// Cloud Functions hata kodlarini kullaniciya gosterilecek Turkce mesaja cevirir
const FUNCTION_ERROR_MESSAGES = {
    'invalid-token': 'Bu bağlantı geçersiz.',
    'used-token': 'Bu bağlantı daha önce kullanılmış. Yeni bir bağlantı isteyin.',
    'expired-token': 'Bu bağlantının süresi dolmuş. Yeni bir bağlantı isteyin.'
};

export function describeAuthMailError(err) {
    const raw = err?.message || '';
    for (const [key, message] of Object.entries(FUNCTION_ERROR_MESSAGES)) {
        if (raw.includes(key)) return message;
    }
    if (err?.code === 'functions/resource-exhausted') return raw;
    if (err?.code === 'functions/unauthenticated') return 'Oturumunuz kapanmış. Lütfen tekrar giriş yapın.';
    return raw || 'İşlem sırasında bir hata oluştu.';
}

/** Giris yapmis kullaniciya dogrulama maili gonderir. */
export async function requestEmailVerification() {
    const call = httpsCallable(functions, 'requestEmailVerification');
    const result = await call();
    return result.data;
}

/** Dogrulama token'ini isler. */
export async function confirmEmailVerification(token) {
    const call = httpsCallable(functions, 'confirmEmailVerification');
    const result = await call({ token });
    return result.data;
}

/** Sifre sifirlama maili gonderir. */
export async function requestPasswordReset(email) {
    const call = httpsCallable(functions, 'requestPasswordReset');
    const result = await call({ email });
    return result.data;
}

/** Token ile yeni sifreyi kaydeder. */
export async function confirmPasswordResetWithToken(token, newPassword) {
    const call = httpsCallable(functions, 'confirmPasswordReset');
    const result = await call({ token, newPassword });
    return result.data;
}
