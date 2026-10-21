// Google Analytics (Firebase Analytics) yardımcıları.
// Sayfa geçişleri history.pushState ile yapıldığı için sayfa görüntülemeleri elle gönderilir;
// otomatik ilk sayfa görüntülemesi kapalıdır, böylece hiçbir sayfa iki kez sayılmaz.
import { initializeAnalytics, isSupported, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from './firebaseConfig';

// Android uygulamasının içindeki web görünümü ve ön-render (headless tarayıcı) istatistiklere karışmasın
// (@capacitor/core web derlemesinde harici bırakıldığı için global window.Capacitor kullanılır)
const isTrackable = () =>
    typeof window !== 'undefined' &&
    !window.Capacitor?.isNativePlatform?.() &&
    !navigator.webdriver;

let analyticsPromise = null;

const getAnalyticsInstance = () => {
    if (!analyticsPromise) {
        analyticsPromise = isTrackable()
            ? isSupported()
                .then((ok) => (ok ? initializeAnalytics(app, { config: { send_page_view: false } }) : null))
                .catch(() => null)
            : Promise.resolve(null);
    }
    return analyticsPromise;
};

// Olay gönderir; Analytics yoksa ya da hata olursa sessizce geçer
export const trackEvent = (name, params = {}) => {
    getAnalyticsInstance()
        .then((analytics) => { if (analytics) logEvent(analytics, name, params); })
        .catch(() => {});
};

export const trackPageView = (path, title, params = {}) => {
    trackEvent('page_view', {
        page_location: window.location.origin + path,
        page_path: path,
        page_title: title,
        ...params,
    });
};

// Giriş yapan kullanıcıyı (Firebase uid) ve üyelik tipini raporlara ekler
export const identifyUser = (uid, properties = {}) => {
    getAnalyticsInstance()
        .then((analytics) => {
            if (!analytics) return;
            setUserId(analytics, uid || null);
            setUserProperties(analytics, properties);
        })
        .catch(() => {});
};
