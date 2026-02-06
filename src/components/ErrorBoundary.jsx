import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorCount: 0,
            lastErrorTime: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        const now = Date.now();

        this.setState(prevState => ({
            errorCount: prevState.errorCount + 1,
            lastErrorTime: now
        }));

        // Log error for debugging (production'da console kapalı)
        if (import.meta.env.DEV) {
            console.error('Error caught by boundary:', error, errorInfo);
        }

        // Store error locally for debugging
        try {
            const errorLog = {
                message: error?.message || 'Unknown error',
                stack: error?.stack,
                componentStack: errorInfo?.componentStack,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            storedErrors.push(errorLog);

            // Keep only last 10 errors
            if (storedErrors.length > 10) storedErrors.shift();
            localStorage.setItem('app_errors', JSON.stringify(storedErrors));
        } catch (e) {
            // Ignore storage errors
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null
        });
    }

    handleReload = () => {
        // Clear any stale data before reload
        try {
            sessionStorage.clear();
        } catch (e) { }
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            // If more than 3 errors in 1 minute, suggest clearing cache
            const shouldSuggestClear = this.state.errorCount > 3 &&
                (Date.now() - this.state.lastErrorTime) < 60000;

            return (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #1a1d1e 0%, #2e3335 100%)',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '40px',
                        borderRadius: '20px',
                        border: '1px solid #FDB913',
                        maxWidth: '500px'
                    }}>
                        <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
                        <h1 style={{
                            color: '#FDB913',
                            marginBottom: '15px',
                            fontFamily: 'Outfit, sans-serif'
                        }}>
                            Bir Hata Oluştu
                        </h1>
                        <p style={{
                            color: '#ccc',
                            marginBottom: '25px',
                            lineHeight: '1.6'
                        }}>
                            Beklenmeyen bir sorunla karşılaştık.
                            Lütfen sayfayı yenileyin veya ana sayfaya dönün.
                        </p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '12px 24px',
                                    background: 'transparent',
                                    color: '#FDB913',
                                    border: '2px solid #FDB913',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    transition: 'all 0.3s'
                                }}
                            >
                                Tekrar Dene
                            </button>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '12px 24px',
                                    background: '#FDB913',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    transition: 'all 0.3s'
                                }}
                            >
                                Sayfayı Yenile
                            </button>
                        </div>

                        {shouldSuggestClear && (
                            <p style={{
                                color: '#f87171',
                                marginTop: '20px',
                                fontSize: '13px'
                            }}>
                                Tekrarlayan hatalar tespit edildi.
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        window.location.href = '/';
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#FDB913',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        marginLeft: '5px'
                                    }}
                                >
                                    Önbelleği temizle
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
