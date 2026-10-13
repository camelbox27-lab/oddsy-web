import {
    applyActionCode,
    confirmPasswordReset,
    signInWithEmailAndPassword,
    signOut,
    verifyPasswordResetCode
} from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { auth } from '../firebaseConfig';
import {
    confirmEmailVerification,
    confirmPasswordResetWithToken,
    describeAuthMailError,
    requestEmailVerification
} from '../utils/authMail';

// Firebase hata kodu -> kullaniciya gosterilecek Turkce mesaj
const ACTION_ERROR_MESSAGES = {
    'auth/expired-action-code': 'Bu bağlantının süresi dolmuş.',
    'auth/invalid-action-code': 'Bu bağlantı geçersiz veya daha önce kullanılmış.',
    'auth/user-disabled': 'Bu hesap devre dışı bırakılmış. Lütfen destek ile iletişime geçin.',
    'auth/user-not-found': 'Bu bağlantıya ait hesap bulunamadı.',
};

const SIGN_IN_ERROR_MESSAGES = {
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/wrong-password': 'E-posta veya şifre hatalı.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/user-disabled': 'Bu hesap devre dışı bırakılmış. Lütfen destek ile iletişime geçin.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-dark)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box'
};

function AuthAction({ mode, oobCode, token, onNavigate }) {
    // loading | form (sifre sifirlama) | success | error | resend (yeni mail iste) | resent
    const [phase, setPhase] = useState('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [resendPassword, setResendPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // StrictMode effect'i iki kez calistirir; oobCode tek kullanimlik oldugu icin
    // ikinci cagri "invalid-action-code" dondurur. Bu ref tek calismayi garanti eder.
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const isVerify = mode === 'verifyEmail';

        // Kendi mail akisimiz: link ?token=... ile gelir
        if (token) {
            if (isVerify) {
                confirmEmailVerification(token)
                    .then(() => setPhase('success'))
                    .catch((err) => {
                        setPhase('resend');
                        setInfoMsg(describeAuthMailError(err));
                    });
            } else if (mode === 'resetPassword') {
                // Token'i simdi tuketmiyoruz; yeni sifreyle birlikte gonderilecek
                setPhase('form');
            } else {
                setPhase('error');
                setErrorMsg('Bilinmeyen işlem türü.');
            }
            return;
        }

        // Link eksik/bozuk geldiyse olu bir hata yerine kurtarma ekrani goster
        if (!oobCode) {
            if (isVerify || !mode) {
                setPhase('resend');
                setInfoMsg('Doğrulama bağlantısı eksik veya artık geçerli değil. Aşağıdan yeni bir doğrulama maili isteyebilirsiniz.');
            } else {
                setPhase('error');
                setErrorMsg('Geçersiz bağlantı. Lütfen tekrar deneyin.');
            }
            return;
        }

        if (isVerify) {
            applyActionCode(auth, oobCode)
                .then(() => setPhase('success'))
                .catch(async (err) => {
                    // Link tuketilmis olabilir (mail tarayicilari linkleri onceden acar).
                    // Hesap aslinda dogrulanmissa kullaniciyi bosuna uyarma.
                    const current = auth.currentUser;
                    if (current) {
                        try { await current.reload(); } catch (_) { /* yok say */ }
                        if (current.emailVerified) {
                            setPhase('success');
                            return;
                        }
                    }
                    setPhase('resend');
                    setInfoMsg(ACTION_ERROR_MESSAGES[err?.code] || 'Bu doğrulama bağlantısı geçersiz veya süresi dolmuş.');
                });
        } else if (mode === 'resetPassword') {
            verifyPasswordResetCode(auth, oobCode)
                .then(() => setPhase('form'))
                .catch((err) => {
                    setPhase('error');
                    setErrorMsg(ACTION_ERROR_MESSAGES[err?.code] || 'Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.');
                });
        } else if (mode === 'recoverEmail') {
            applyActionCode(auth, oobCode)
                .then(() => setPhase('success'))
                .catch((err) => {
                    setPhase('error');
                    setErrorMsg(ACTION_ERROR_MESSAGES[err?.code] || 'Bu bağlantı geçersiz veya süresi dolmuş.');
                });
        } else {
            setPhase('error');
            setErrorMsg('Bilinmeyen işlem türü.');
        }
    }, [mode, oobCode, token]);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setErrorMsg('Şifre en az 6 karakter olmalıdır.');
            return;
        }
        setErrorMsg('');
        setSubmitting(true);
        try {
            if (token) {
                await confirmPasswordResetWithToken(token, newPassword);
            } else {
                await confirmPasswordReset(auth, oobCode, newPassword);
            }
            setPhase('success');
        } catch (err) {
            const message = token
                ? describeAuthMailError(err)
                : (ACTION_ERROR_MESSAGES[err?.code] || 'Şifre değiştirilemedi. Bağlantı süresi dolmuş olabilir, lütfen tekrar talep edin.');
            setErrorMsg(message);
        } finally {
            setSubmitting(false);
        }
    };

    // Doğrulama maili tekrar gönder: mail linkiyle gelen kullanici giris yapmis olmayabilir,
    // bu yuzden once kimlik dogrulayip sonra yeni link gonderiyoruz.
    const handleResend = async (e) => {
        e.preventDefault();
        if (!resendEmail.trim() || !resendPassword) {
            setErrorMsg('Lütfen e-posta ve şifrenizi girin.');
            return;
        }
        setErrorMsg('');
        setSubmitting(true);
        try {
            const credential = await signInWithEmailAndPassword(auth, resendEmail.trim(), resendPassword);
            try { await credential.user.reload(); } catch (_) { /* yok say */ }

            if (credential.user.emailVerified) {
                await signOut(auth);
                setPhase('success');
                return;
            }

            await requestEmailVerification();
            await signOut(auth);
            setResendPassword('');
            setPhase('resent');
        } catch (err) {
            setErrorMsg(SIGN_IN_ERROR_MESSAGES[err?.code] || 'Doğrulama maili gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setSubmitting(false);
        }
    };

    const goToLogin = () => {
        if (onNavigate) {
            onNavigate('auth', { isLogin: true });
        } else {
            window.location.href = '/';
        }
    };

    const isVerifyEmail = mode === 'verifyEmail' || !mode;
    const isResetPassword = mode === 'resetPassword';

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                {/* Logo */}
                <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--gold-text)', letterSpacing: -1 }}>
                        Wondiyo
                    </span>
                </div>

                {/* Loading */}
                {phase === 'loading' && (
                    <>
                        <div style={{
                            width: 40, height: 40,
                            border: '3px solid rgba(253,185,19,0.2)',
                            borderTopColor: 'var(--gold)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }} />
                        {isResetPassword ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                                Şifre sıfırlama isteğiniz işleniyor,<br />lütfen bekleyin...
                            </p>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                                Wondiyo ailesine hoş geldiniz!<br />
                                E-posta adresiniz doğrulanıyor, lütfen bekleyin...
                            </p>
                        )}
                    </>
                )}

                {/* Success */}
                {phase === 'success' && (
                    <>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                        {isResetPassword ? (
                            <>
                                <h2 style={{ color: '#4ade80', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
                                    Şifreniz güncellendi!
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                                    Yeni şifreniz başarıyla kaydedildi. Artık hesabınıza giriş yapabilirsiniz.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 style={{ color: '#4ade80', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
                                    E-posta adresiniz doğrulandı!
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                                    Harika! Hesabınız artık aktif. Giriş yaparak Wondiyo'nun tüm özelliklerinden yararlanabilirsiniz.
                                </p>
                            </>
                        )}
                        <button className="hero-btn primary" style={{ width: '100%' }} onClick={goToLogin}>
                            Giriş Yap
                        </button>
                    </>
                )}

                {/* Yeni dogrulama maili gonderildi */}
                {phase === 'resent' && (
                    <>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
                        <h2 style={{ color: 'var(--gold-text)', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
                            Yeni doğrulama maili gönderildi
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{resendEmail.trim()}</strong> adresine yeni bir doğrulama bağlantısı gönderdik.
                            Mailinizi göremiyorsanız spam/gereksiz klasörünü de kontrol edin.
                        </p>
                        <button className="hero-btn secondary" style={{ width: '100%' }} onClick={goToLogin}>
                            Giriş Ekranına Dön
                        </button>
                    </>
                )}

                {/* Error */}
                {phase === 'error' && (
                    <>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
                        <h2 style={{ color: '#f87171', fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                            Bağlantı Geçersiz
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                            {errorMsg || 'Bu bağlantı geçersiz veya süresi dolmuş olabilir. Lütfen yeni bir bağlantı talep edin.'}
                        </p>
                        <button className="hero-btn secondary" style={{ width: '100%' }} onClick={goToLogin}>
                            Ana Sayfaya Dön
                        </button>
                    </>
                )}

                {/* Dogrulama maili tekrar gonderme formu */}
                {phase === 'resend' && (
                    <>
                        <div style={{ fontSize: 44, marginBottom: 16 }}>📨</div>
                        <h2 style={{ color: 'var(--gold-text)', fontSize: 19, fontWeight: 800, marginBottom: 10 }}>
                            Yeni Doğrulama Maili Gönder
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 22, lineHeight: 1.7 }}>
                            {infoMsg} Hesap bilgilerinizi girin, size hemen yeni bir doğrulama bağlantısı gönderelim.
                        </p>
                        <form onSubmit={handleResend} style={{ textAlign: 'left' }}>
                            <div className="form-group">
                                <label className="form-label">E-Posta</label>
                                <input
                                    type="email"
                                    value={resendEmail}
                                    onChange={e => setResendEmail(e.target.value)}
                                    placeholder="ornek@mail.com"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Şifre</label>
                                <input
                                    type="password"
                                    value={resendPassword}
                                    onChange={e => setResendPassword(e.target.value)}
                                    placeholder="Hesap şifreniz"
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            {errorMsg && (
                                <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                                    {errorMsg}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="hero-btn primary"
                                style={{ width: '100%' }}
                                disabled={submitting}
                            >
                                {submitting ? 'Gönderiliyor...' : 'Doğrulama Maili Gönder'}
                            </button>
                        </form>
                        <button
                            type="button"
                            className="hero-btn secondary"
                            style={{ width: '100%', marginTop: 12 }}
                            onClick={goToLogin}
                        >
                            Ana Sayfaya Dön
                        </button>
                    </>
                )}

                {/* Password Reset Form */}
                {phase === 'form' && isResetPassword && (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
                        <h2 style={{ color: 'var(--gold-text)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                            Yeni Şifre Belirle
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                            Aşağıya yeni şifrenizi girin. Şifreniz en az 6 karakter olmalıdır.
                        </p>
                        <form onSubmit={handlePasswordReset} style={{ textAlign: 'left' }}>
                            <div className="form-group">
                                <label className="form-label">Yeni Şifre</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="En az 6 karakter"
                                    required
                                    minLength={6}
                                    style={inputStyle}
                                />
                            </div>
                            {errorMsg && (
                                <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                                    {errorMsg}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="hero-btn primary"
                                style={{ width: '100%' }}
                                disabled={submitting}
                            >
                                {submitting ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default AuthAction;
