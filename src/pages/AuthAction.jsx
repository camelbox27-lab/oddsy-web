import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';

function AuthAction({ mode, oobCode, onNavigate }) {
    const [phase, setPhase] = useState('loading'); // loading | form | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!oobCode) {
            setPhase('error');
            setErrorMsg('Geçersiz bağlantı. Lütfen tekrar deneyin.');
            return;
        }

        if (mode === 'verifyEmail') {
            applyActionCode(auth, oobCode)
                .then(() => setPhase('success'))
                .catch(() => {
                    setPhase('error');
                    setErrorMsg('Bu doğrulama bağlantısı geçersiz veya süresi dolmuş.');
                });
        } else if (mode === 'resetPassword') {
            verifyPasswordResetCode(auth, oobCode)
                .then(() => setPhase('form'))
                .catch(() => {
                    setPhase('error');
                    setErrorMsg('Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.');
                });
        } else {
            setPhase('error');
            setErrorMsg('Bilinmeyen işlem türü.');
        }
    }, [mode, oobCode]);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setErrorMsg('Şifre en az 6 karakter olmalıdır.');
            return;
        }
        setErrorMsg('');
        setSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setPhase('success');
        } catch {
            setErrorMsg('Şifre değiştirilemedi. Bağlantı süresi dolmuş olabilir, lütfen tekrar talep edin.');
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

    const isVerifyEmail = mode === 'verifyEmail';
    const isResetPassword = mode === 'resetPassword';

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                {/* Logo */}
                <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--gold)', letterSpacing: -1 }}>
                        Oddsy
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
                        {isVerifyEmail ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                                Oddsy ailesine hoş geldiniz!<br />
                                E-posta adresiniz doğrulanıyor, lütfen bekleyin...
                            </p>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                                Şifre sıfırlama isteğiniz işleniyor,<br />lütfen bekleyin...
                            </p>
                        )}
                    </>
                )}

                {/* Success */}
                {phase === 'success' && (
                    <>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                        {isVerifyEmail ? (
                            <>
                                <h2 style={{ color: '#4ade80', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
                                    E-posta adresiniz doğrulandı!
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                                    Harika! Hesabınız artık aktif. Giriş yaparak Oddsy'nin tüm özelliklerinden yararlanabilirsiniz.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 style={{ color: '#4ade80', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
                                    Şifreniz güncellendi!
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                                    Yeni şifreniz başarıyla kaydedildi. Artık hesabınıza giriş yapabilirsiniz.
                                </p>
                            </>
                        )}
                        <button className="hero-btn primary" style={{ width: '100%' }} onClick={goToLogin}>
                            Giriş Yap
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

                {/* Password Reset Form */}
                {phase === 'form' && isResetPassword && (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
                        <h2 style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
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
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 12,
                                        color: '#fff',
                                        fontSize: 14,
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
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
