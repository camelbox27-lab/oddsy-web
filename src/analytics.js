// Google Analytics 4 (gtag.js) yardımcıları.
// Etiket index.html içinde yükleniyor. Sayfa geçişleri history.pushState ile yapıldığı için
// otomatik sayfa görüntülemesi kapalıdır (send_page_view: false) ve görüntülemeler buradan
// elle gönderilir; böylece hiçbir sayfa iki kez sayılmaz.

// Android uygulamasının içindeki web görünümü ve ön-render (headless tarayıcı) istatistiklere
// karışmasın (@capacitor/core web derlemesinde harici bırakıldığı için global window.Capacitor kullanılır)
const isTrackable = () =>
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    !window.Capacitor?.isNativePlatform?.() &&
    !navigator.webdriver;

// Olay gönderir; etiket yüklenmediyse ya da hata olursa sessizce geçer
export const trackEvent = (name, params = {}) => {
    if (!isTrackable()) return;
    try {
        window.gtag('event', name, params);
    } catch (_) { /* yok say */ }
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
    if (!isTrackable()) return;
    try {
        window.gtag('set', { user_id: uid || null });
        window.gtag('set', 'user_properties', properties);
    } catch (_) { /* yok say */ }
};
