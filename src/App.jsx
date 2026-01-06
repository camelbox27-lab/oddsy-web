import { initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    getIdTokenResult,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { getTeamLogo } from './utils/logoHelper';

import { getDatabase } from 'firebase/database';

// Firebase Config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// STYLES
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --primary-green: #006A4E;
  --primary-green-light: #00815e;
  --primary-green-dark: #00523c;
  --gold: #FDB913;
  --gold-dark: #ca940f;
  --bg-dark: #333333;
  --bg-card: #404040;
  --text-primary: #FFFFFF;
  --text-secondary: #FFFFFF;
  --border: #555555;
  --success: #4ade80;
  --error: #f87171;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  -webkit-tap-highlight-color: transparent;
}

body {
  background: var(--bg-dark);
  color: var(--text-primary);
  overflow-x: hidden;
}

.auth-loading-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-dark);
  color: var(--gold);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  height: 65px;
  background: var(--bg-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 2000;
  border-bottom: 2px solid var(--primary-green);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  justify-content: center;
  margin: 0 20px;
}

.header-nav-item {
  padding: 8px 12px;
  color: var(--gold);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 10px;
  white-space: nowrap;
  border: 1px solid var(--primary-green);
}

.header-nav-item:hover {
  background: var(--primary-green);
  color: var(--gold);
}

.header-nav-item.active {
  background: var(--primary-green);
  color: var(--gold);
  box-shadow: 0 0 10px rgba(0, 106, 78, 0.4);
}

.header-left, .header-right { display: flex; align-items: center; gap: 10px; }

.logo {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 1px;
  background: linear-gradient(to right, var(--primary-green) 50%, var(--gold) 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: pointer;
}

.menu-btn {
  background: none;
  border: none;
  color: var(--gold);
  font-size: 24px;
  cursor: pointer;
  display: none;
}

.profile-btn {
  background: var(--gold);
  color: var(--primary-green-dark);
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4); }

/* Sidebar */
.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  z-index: 1100;
  display: none;
}
.sidebar-overlay.open { display: block; }
.sidebar {
  position: fixed;
  top: 0; left: -280px; width: 280px; height: 100vh;
  background: var(--bg-card);
  z-index: 1200;
  transition: left 0.3s ease;
  padding: 20px;
  border-right: 1px solid var(--border);
}
.sidebar.open { left: 0; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.sidebar-logo { font-size: 24px; font-weight: 900; color: var(--gold); }
.close-btn { background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer; }
.sidebar-section-title { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
.sidebar-item { display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 12px; color: var(--text-secondary); cursor: pointer; transition: 0.3s; margin-bottom: 5px; }
.sidebar-item:hover, .sidebar-item.active { background: rgba(255, 215, 0, 0.1); color: var(--gold); }
.sidebar-item-icon { font-size: 20px; }
.sidebar-item-text { font-size: 14px; font-weight: 600; }
.sidebar-divider { height: 1px; background: var(--border); margin: 20px 0; }

.main-content { padding-top: 65px; padding-bottom: 0; min-height: calc(100vh - 65px); }

/* Hero Section */
.hero-section {
  position: relative;
  height: 90vh;
  min-height: 600px;
  background-image: url('/stadium.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  overflow: hidden;
}
.hero-section::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(0, 106, 78, 0.5) 0%, rgba(51, 51, 51, 0.3) 50%, rgba(51, 51, 51, 0.9) 100%);
  z-index: 1;
}
.hero-content { max-width: 900px; margin: 0 auto; position: relative; z-index: 2; text-align: center; text-shadow: 0 2px 15px rgba(0,0,0,0.5); }
.hero-title { font-size: 36px; font-weight: 900; color: #FFFFFF; margin-bottom: 15px; line-height: 1.1; letter-spacing: -1px; }
.hero-subtitle { font-size: 15px; color: #EEEEEE; margin-bottom: 30px; line-height: 1.5; max-width: 600px; margin-left: auto; margin-right: auto; font-weight: 500; }
.hero-btn { padding: 12px 30px; font-size: 15px; font-weight: 700; border-radius: 30px; cursor: pointer; transition: all 0.3s ease; border: none; }
.hero-btn.primary { background: var(--primary-green); color: #fff; box-shadow: 0 4px 15px rgba(0, 106, 78, 0.4); }
.hero-btn.secondary { background: rgba(255, 255, 255, 0.1); color: #fff; border: 2px solid var(--gold); backdrop-filter: blur(5px); }

/* Analysis Section */
.analysis-section { padding: 100px 20px; text-align: center; background: var(--bg-card); }
.analysis-title { font-size: 42px; font-weight: 900; color: var(--text-primary); margin-bottom: 20px; }
.analysis-btn { padding: 18px 50px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); border: none; border-radius: 30px; color: var(--primary-green-dark); font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s ease; }

/* Category & Prediction Cards */
.category-header { display: flex; align-items: center; gap: 15px; padding: 20px; background: var(--primary-green-dark); border-bottom: 1px solid var(--border); }
.category-back-btn { background: none; border: none; color: var(--gold); font-size: 24px; cursor: pointer; padding: 5px; }
.category-title { font-size: 18px; font-weight: 900; color: var(--gold); letter-spacing: 2px; }
.predictions-list { padding: 20px; display: grid; gap: 20px; }
.prediction-card { background: var(--bg-card); border-radius: 20px; padding: 15px; border: 1px solid #333; transition: all 0.3s ease; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
.league-badge { color: var(--text-secondary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.status-badge { font-size: 10px; font-weight: 900; padding: 4px 8px; border-radius: 4px; }
.status-badge.won { background: var(--success); color: var(--primary-green-dark); }
.status-badge.lost { background: var(--error); color: #fff; }

.match-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.team { flex: 1; text-align: center; }
.team-logo { width: 50px; height: 50px; margin-bottom: 5px; object-fit: contain; }
.team-name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time-box { width: 60px; text-align: center; }
.time-text { font-size: 18px; font-weight: 800; color: var(--gold); }

.card-footer { display: flex; gap: 10px; }
.footer-item { flex: 1; background: var(--bg-dark); padding: 10px; border-radius: 12px; text-align: center; border: 1px solid var(--border); }
.footer-label { color: #555; font-size: 9px; font-weight: 700; margin-bottom: 2px; text-transform: uppercase; }
.footer-value { font-size: 13px; font-weight: 800; }
.footer-value.prediction { color: var(--success); }
.footer-value.odds { color: var(--gold); }

/* Footer */
.footer-section { padding: 60px 20px 20px; background: var(--bg-dark); border-top: 1px solid var(--border); }
.footer-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 40px; }
.footer-col { flex: 1; min-width: 200px; }
.footer-heading { font-size: 24px; font-weight: 900; color: var(--gold); margin-bottom: 15px; }
.footer-link { display: block; color: var(--text-secondary); margin-bottom: 10px; cursor: pointer; transition: 0.3s; font-size: 14px; text-decoration: none; }
.footer-link:hover { color: var(--gold); }
.footer-divider { height: 1px; background: var(--border); margin: 30px auto; max-width: 1200px; }
.footer-bottom { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.age-badge-small { background: #ff0000; color: #fff; font-weight: 900; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
.copyright { font-size: 12px; color: #666; }

/* Auth */
.auth-container { min-height: calc(100vh - 65px); display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg-dark); }
.auth-card { width: 100%; max-width: 400px; padding: 30px; background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.5); position: relative; }
.back-btn { background: none; border: none; color: var(--gold); cursor: pointer; font-size: 14px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; color: var(--text-secondary); font-size: 11px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
.form-input { width: 100%; padding: 12px 15px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary); font-size: 14px; }
.submit-btn { width: 100%; padding: 14px; background: var(--gold); border: none; border-radius: 10px; color: var(--primary-green-dark); font-size: 15px; font-weight: 800; cursor: pointer; }

/* Profile */
.profile-container { padding: 20px; max-width: 600px; margin: 0 auto; }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--primary-green); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; border: 2px solid var(--gold); }
.profile-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
.logout-btn { width: 100%; padding: 12px; background: transparent; border: 1px solid var(--error); border-radius: 10px; color: var(--error); font-weight: 700; cursor: pointer; margin-top: 20px; }

.loading { display: flex; align-items: center; justify-content: center; padding: 40px; }
.spinner { width: 30px; height: 30px; border: 3px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.alert { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 12px 25px; border-radius: 10px; font-size: 14px; font-weight: 700; z-index: 2000; }
.alert.success { background: var(--success); color: var(--primary-green-dark); }
.alert.error { background: var(--error); color: #fff; }

@media (max-width: 768px) {
  .header-nav { display: none; }
  .menu-btn { display: flex !important; }
  .hero-title { font-size: 32px; }
  .features-section { grid-template-columns: 1fr; }
}
`;

// ICONS
const Icons = {
    menu: '☰',
    close: '✕',
    back: '←',
    user: '👤',
    home: '🏠',
    soccer: '⚽',
    ticket: '🎟️',
    users: '👥',
    cards: '🎴',
    star: '⭐',
    bomb: '💣',
    swap: '🔄',
    pen: '✏️',
    logout: '🚪',
    admin: '🛡️',
    ai: '🤖'
};

// CONSTANTS
const MENU_ITEMS = [
    { id: 'cat_ai', title: "AI ANALİZ", key: 10, icon: Icons.ai, color: "#FFD700", route: 'ai-analysis' },
    { id: 'cat_1', title: "ILK YARI GOL LISTESI", key: 0, icon: Icons.soccer, color: "#10B981", route: 'category' },
    { id: 'cat_2', title: "GUNUN KUPONLARI", key: 1, icon: Icons.ticket, color: "#f87171", route: 'category' },
    { id: 'cat_3', title: "TAHMINCILER", key: 2, icon: Icons.users, color: "#a78bfa", route: 'category' },
    { id: 'cat_4', title: "KART / KORNER", key: 3, icon: Icons.cards, color: "#FBBF24", route: 'category' },
    { id: 'cat_5', title: "GUNUN TERCIHLERI", key: 4, icon: Icons.star, color: "#4ade80", route: 'category' },
    { id: 'cat_7', title: "SURPRIZLER", key: 6, icon: Icons.bomb, color: "#fb7185", route: 'category' },
    { id: 'cat_8', title: "IY / MS TAHMINLERI", key: 7, icon: Icons.swap, color: "#FFD700", route: 'category' },
    { id: 'cat_9', title: "EDITORUN SECIMI", key: 8, icon: Icons.pen, color: "#4ade80", route: 'category' },
];

const LEAGUES = [
    { id: 'Serie A', title: 'Serie A', desc: 'Taktik ve Savunma Sanatı', image: 'https://i.ibb.co/N6N4CGn5/Whats-App-mage-2025-12-05-at-14-21-54-1.jpg' },
    { id: 'Premier Lig', title: 'Premier Lig', desc: 'Ada Futbolu & Yüksek Tempo', image: 'https://i.ibb.co/cXt6fJdd/Whats-App-mage-2025-12-05-at-14-21-54.jpg' },
    { id: 'La Liga', title: 'La Liga', desc: 'Yıldızlar Geçidi & Teknik Futbol', image: 'https://i.ibb.co/C55n1CFc/spain-la-liga-64x64-football-logos-cc.png' },
    { id: 'Super Lig', title: 'Super Lig', desc: 'Bitmeyen Tutku ve Heyecan', image: 'https://i.ibb.co/RT40RH3G/turkey-super-lig-64x64-football-logos-cc.png' },
    { id: 'Bundesliga', title: 'Bundesliga', desc: 'Gol Şöleni & Hücum Futbolu', image: 'https://i.ibb.co/fzrPDNQp/germany-bundesliga-64x64-football-logos-cc.png' },
    { id: 'Ligue 1', title: 'Ligue 1', desc: 'Yetenek Fabrikası & Atletizm', image: 'https://i.ibb.co/cXSXDS45/france-ligue-1-64x64-football-logos-cc.png' },
];

// LEGAL TEXTS
const LEGAL_TEXTS = {
    kvkk: {
        title: "KVKK Aydınlatma Metni",
        content: `### Kişisel Verilerin Korunması ve İşlenmesi
**Veri Sorumlusu:** ODDSY Tahmin Platformu
**İletişim:** oddsydestek@gmail.com

#### 1. Toplanan Kişisel Veriler
Platformumuzda aşağıdaki kişisel verileriniz toplanmaktadır:
- Kimlik Bilgileri: Ad, soyad, kullanıcı adı
- İletişim Bilgileri: E-posta adresi
- İşlem Güvenliği Bilgileri: IP adresi, cihaz bilgileri, tarayıcı bilgileri
- Kullanıcı İşlem Bilgileri: Tahmin geçmişi, platform aktiviteleri

#### 2. Kişisel Verilerin İşlenme Amaçları
Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
- Kullanıcı hesabı oluşturma ve yönetme
- Platform hizmetlerinin sunulması
- Kullanıcı deneyiminin iyileştirilmesi
- İletişim faaliyetlerinin yürütülmesi
- Güvenlik tedbirlerinin uygulanması
- Yasal yükümlülüklerin yerine getirilmesi

#### 3. Kişisel Verilerin Aktarılması
Kişisel verileriniz, yasal zorunluluklar ve hizmet sağlayıcılar dışında üçüncü kişilerle paylaşılmamaktadır. Verileriniz yalnızca:
- Firebase (Google Cloud Platform) altyapısında saklanmaktadır
- Yasal mercilerin talebi halinde yetkili kurumlara aktarılabilir

#### 4. Kişisel Verilerin Saklanma Süresi
Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve yasal saklama yükümlülükleri çerçevesinde saklanmaktadır.

#### 5. KVKK Kapsamındaki Haklarınız
6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca aşağıdaki haklara sahipsiniz:
- Kişisel verilerinizin işlenip işlenmediğini öğrenme
- İşlenmişse bilgi talep etme
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
- Eksik veya yanlış işlenmişse düzeltilmesini isteme
- Kanunda öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme
- Düzeltme, silme ve yok edilme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme
- İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme
- Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme`
    },
    privacy: {
        title: "Gizlilik Politikası",
        content: `**Son Güncelleme:** Ocak 2026

### 1. Genel Bilgiler
ODDSY, kullanıcı gizliliğine önem veren bir tahmin paylaşım platformudur. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi vermektedir.

### 2. Toplanan Bilgiler
Platform kullanımınız sırasında aşağıdaki bilgiler toplanmaktadır:
- Kayıt sırasında verdiğiniz bilgiler (e-posta, kullanıcı adı)
- Platform üzerindeki aktiviteleriniz (tahminler, yorumlar)
- Teknik bilgiler (IP adresi, cihaz türü, tarayıcı bilgileri)
- Çerezler aracılığıyla toplanan bilgiler

### 3. Bilgilerin Kullanımı
Toplanan bilgiler şu amaçlarla kullanılır:
- Hesap oluşturma ve yönetme
- Platform hizmetlerinin sunulması
- Kullanıcı deneyiminin kişiselleştirilmesi
- Platform güvenliğinin sağlanması
- İstatistiksel analizler yapılması

### 4. Bilgi Güvenliği
Kişisel bilgileriniz, endüstri standardı güvenlik önlemleriyle korunmaktadır:
- Şifreli veri iletimi (SSL/TLS)
- Güvenli veri depolama (Firebase)
- Düzenli güvenlik güncellemeleri
- Yetkisiz erişime karşı koruma`
    },
    terms: {
        title: "Kullanım Koşulları",
        content: `### 1. Hizmetin Kapsamı
ODDSY, kullanıcıların spor müsabakalarına yönelik tahminlerini paylaşabilecekleri ücretsiz bir platformdur. Platform:
- Bahis hizmeti sunmaz
- Para kazandırmaz
- Bahis oynamanıza teşvik etmez
- Sadece bilgi paylaşım amaçlıdır

### 2. Kullanıcı Sorumlulukları
Platform kullanıcısı olarak:
- En az 18 yaşında olmalısınız
- Doğru ve güncel bilgiler sağlamalısınız
- Başkalarının haklarına saygı göstermelisiniz
- Yasadışı içerik paylaşmamalısınız
- Platform kurallarına uymalısınız

### 3. Yasak Faaliyetler
Aşağıdaki faaliyetler kesinlikle yasaktır:
- Sahte hesap oluşturma
- Spam veya taciz edici içerik paylaşma
- Yanıltıcı veya aldatıcı bilgi verme
- Platform güvenliğini tehdit edecek eylemler
- Telif hakkı ihlali
- 18 yaş altı kullanıcıların platforma erişimi`
    },
    support: {
        title: "Destek ve Yardım",
        content: `### Nasıl Yardımcı Olabiliriz?
ODDSY ekibi olarak size en iyi hizmeti sunmak için buradayız. 

**E-posta:** oddsydestek@gmail.com
**Yanıt Süresi:** 24-48 saat içinde

### Sık Sorulan Sorular
**S: Hesap nasıl oluşturulur?**
C: Ana sayfadan "Kayıt Ol" butonuna tıklayarak e-posta adresinizle kolayca hesap oluşturabilirsiniz.

**S: Şifremi unuttum, ne yapmalıyım?**
C: Giriş sayfasında "Şifremi Unuttum" bağlantısını kullanarak şifrenizi sıfırlayabilirsiniz.

**S: Platform ücretli mi?**
C: Hayır, ODDSY tamamen ücretsiz bir tahmin paylaşım platformudur.`
    },
    responsibility: {
        title: "Sorumluluk Beyanı",
        content: `### ⚠️ ÖNEMLİ UYARILAR
**🔞 BU PLATFORM 18 YAŞ VE ÜZERİ KİŞİLER İÇİNDİR**
ODDSY, tamamen bilgi ve eğlence amaçlı bir tahmin paylaşım platformudur. 

### 🚫 ODDSY NE DEĞİLDİR?
- ❌ Bahis sitesi değildir
- ❌ Kumar platformu değildir  
- ❌ Para kazandırmaz
- ❌ Bahis hizmeti sunmaz
- ❌ Bahis kuponları satmaz
- ❌ Mali kazanç vaat etmez`
    },
    warning18: {
        title: "🔞 +18 UYARISI",
        content: `**KUMAR BAĞIMLILIK YAPABİLİR VE SOSYAL, PSİKOLOJİK VE MALİ SORUNLARA YOL AÇABİLİR.**

### ⚠️ KUMAR BAĞIMLILIĞI CİDDİ BİR SORUNDUR
Kumar bağımlılığı sadece maddi kayıplara değil, aile içi sorunlara, depresyona ve sosyal izolasyona da yol açabilir.

### 💪 SORUMLU OYUN İLKELERİ
1. **Sadece Eğlence:** Kumar sadece eğlence amaçlı olmalıdır
2. **Bütçe Belirleyin:** Kaybetmeyi göze alabileceğiniz miktarı belirleyin
3. **Zaman Sınırı:** Kendinize zaman limiti koyun ve uyun
4. **Borçlanma:** Asla kumar için borçlanmayın`
    }
};

// Helper Components
function Alert({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return <div className={`alert ${type}`}>{message}</div>;
}

function LegalModal({ type, onClose }) {
    const data = LEGAL_TEXTS[type];
    if (!data) return null;
    return (
        <div className="sidebar-overlay open" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div className="auth-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ color: 'var(--gold)', fontSize: 18 }}>{data.title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>{Icons.close}</button>
                </div>
                <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6, whiteSpace: 'pre-line', textAlign: 'left' }}>
                    {data.content}
                </div>
            </div>
        </div>
    );
}

function Header({ onMenuOpen, user, onProfileClick, onNavigate, currentCategory }) {
    const topCategories = [
        { id: 'cat_ai', title: "AI ANALİZ", key: 10 },
        { id: 'cat_2', title: "İLK YARI GOL LİSTESİ", key: 0 },
        { id: 'cat_8_new', title: "İY / MS TAHMİNLERİ", key: 7 },
        { id: 'cat_3', title: "GÜNÜN KUPONLARI", key: 1 },
        { id: 'cat_4', title: "TAHMİNCİLER", key: 2 },
        { id: 'cat_5', title: "KART/KORNER", key: 3 },
        { id: 'cat_6', title: "GÜNÜN TERCİHLERİ", key: 4 },
        { id: 'cat_7', title: "GÜNÜN SÜRPRİZLERİ", key: 6 },
        { id: 'cat_8', title: "EDİTÖRÜN SEÇİMİ", key: 8 },
    ];

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn" onClick={onMenuOpen}>{Icons.menu}</button>
                <div className="logo" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>ODDSY</div>
            </div>
            <nav className="header-nav">
                {topCategories.map(cat => (
                    <div
                        key={cat.id}
                        className={`header-nav-item ${currentCategory === cat.key ? 'active' : ''}`}
                        onClick={() => onNavigate('category', MENU_ITEMS.find(m => m.key === cat.key))}
                    >
                        {cat.title}
                    </div>
                ))}
            </nav>
            <div className="header-right">
                <button className="profile-btn" onClick={onProfileClick}>
                    {Icons.user}
                    <span>{user ? 'Hesabım' : 'Giriş'}</span>
                </button>
            </div>
        </header>
    );
}

function Sidebar({ isOpen, onClose, onNavigate, currentRoute }) {
    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">ODDSY</div>
                    <button className="close-btn" onClick={onClose}>{Icons.close}</button>
                </div>
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Menu</div>
                    <div className={`sidebar-item ${currentRoute === 'home' ? 'active' : ''}`} onClick={() => { onNavigate('home'); onClose(); }}>
                        <span className="sidebar-item-icon">{Icons.home}</span>
                        <span className="sidebar-item-text">Ana Sayfa</span>
                    </div>
                    {MENU_ITEMS.map(item => (
                        <div key={item.id} className="sidebar-item" onClick={() => { onNavigate('category', { ...item }); onClose(); }}>
                            <span className="sidebar-item-icon">{item.icon}</span>
                            <span className="sidebar-item-text">{item.title}</span>
                        </div>
                    ))}
                </div>
                <div className="sidebar-divider" />
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Hesap</div>
                    <div className="sidebar-item" onClick={() => { onNavigate('profile'); onClose(); }}>
                        <span className="sidebar-item-icon">{Icons.user}</span>
                        <span className="sidebar-item-text">Profilim</span>
                    </div>
                </div>
            </div>
        </>
    );
}

function HomePage({ onLoginClick, onNavigate, onShowLegal }) {
    return (
        <div className="home-page">
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Oddsy ile Akıllı Futbol Tahminleri</h1>
                    <p className="hero-subtitle">Yapay zeka ve Bet365 oran analiz sistemiyle güçlendirilmiş, günün öne çıkan karşılaşmalarını sizin için sadeleştiren yeni nesil tahmin platformu.</p>
                    <div className="hero-buttons">
                        <button className="hero-btn primary" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>Hemen Başla</button>
                        <button className="hero-btn secondary" onClick={onLoginClick}>Giriş Yap</button>
                    </div>
                </div>
            </div>
            <div className="analysis-section">
                <h2 className="analysis-title">Oddsy Günün Analizi</h2>
                <button className="analysis-btn" onClick={() => onNavigate('category', MENU_ITEMS.find(m => m.key === 8))}>Özel Analizleri Görüntüle</button>
            </div>
            <footer className="footer-section">
                <div className="footer-container">
                    <div className="footer-col" style={{ flex: 2 }}>
                        <h3 className="footer-heading">Oddsy</h3>
                        <p style={{ color: '#aaa', fontSize: 13, marginBottom: 20 }}>Profesyonel futbol tahmin platformu. Tüm analizler veri odaklıdır.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span className="age-badge-small">18+</span>
                            <span style={{ fontSize: 11, color: '#666' }}>Lütfen sorumlu oynayınız.</span>
                        </div>
                        <a href="mailto:oddsydestek@gmail.com" className="hero-btn primary" style={{ textDecoration: 'none', display: 'inline-block', fontSize: 12, padding: '10px 20px' }}>
                            Destek Hattı: oddsydestek@gmail.com
                        </a>
                    </div>
                    <div className="footer-col">
                        <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 15 }}>Kurumsal</h4>
                        <a className="footer-link" onClick={() => onShowLegal('kvkk')}>KVKK Aydınlatma</a>
                        <a className="footer-link" onClick={() => onShowLegal('privacy')}>Gizlilik Politikası</a>
                        <a className="footer-link" onClick={() => onShowLegal('terms')}>Kullanım Koşulları</a>
                    </div>
                    <div className="footer-col">
                        <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 15 }}>Yardım</h4>
                        <a className="footer-link" onClick={() => onShowLegal('support')}>Destek ve Yardım</a>
                        <a className="footer-link" onClick={() => onShowLegal('responsibility')}>Sorumluluk Beyanı</a>
                        <a className="footer-link" onClick={() => onShowLegal('warning18')}>+18 Uyarı</a>
                    </div>
                </div>
                <div className="footer-divider" />
                <div className="footer-bottom">
                    <p className="copyright">© 2025 ODDSY. Tüm hakları saklıdır. oddsydestek@gmail.com</p>
                </div>
            </footer>
        </div>
    );
}

function AuthScreen({ onBack, showAlert }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return showAlert('Lütfen bilgileri eksiksiz girin.', 'error');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email.trim(), password.trim());
                showAlert('Giriş başarılı!', 'success');
            } else {
                const { user: newUser } = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
                await updateProfile(newUser, { displayName: email.split('@')[0] });
                await setDoc(doc(db, "users", newUser.uid), {
                    email: newUser.email,
                    username: email.split('@')[0],
                    uid: newUser.uid,
                    createdAt: serverTimestamp(),
                    isAdmin: false,
                    isPremium: false
                });
                showAlert('Kayıt başarılı!', 'success');
            }
        } catch (err) {
            showAlert('İşlem başarısız: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <button className="back-btn" onClick={onBack}>{Icons.back} Geri</button>
                <h1 style={{ marginBottom: 20 }}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">E-Posta</label>
                        <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button className="submit-btn" disabled={loading}>{loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}</button>
                </form>
                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#aaa' }}>
                    {isLogin ? 'Hesabınız yok mu? ' : 'Zaten üye misiniz? '}
                    <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Kaydol' : 'Giriş Yap'}
                    </span>
                </p>
            </div>
        </div>
    );
}

function ProfileScreen({ user, userData, onBack, showAlert }) {
    const handleLogout = async () => {
        await signOut(auth);
        showAlert('Çıkış yapıldı.', 'success');
        onBack();
    };

    if (!user) return <div className="loading">Lütfen giriş yapın.</div>;

    return (
        <div className="profile-container">
            <button className="back-btn" onClick={onBack}>{Icons.back} Geri</button>
            <div className="profile-avatar">{Icons.user}</div>
            <h2 style={{ textAlign: 'center', marginBottom: 30 }}>{userData?.username || 'Kullanıcı'}</h2>
            <div className="profile-row"><span>E-posta</span><span>{user.email}</span></div>
            <div className="profile-row"><span>Üyelik</span><span>{userData?.isPremium ? 'Premium' : 'Standart'}</span></div>
            <div className="profile-row"><span>Rol</span><span>{userData?.isAdmin ? 'Admin' : 'Üye'}</span></div>
            {userData?.isAdmin && <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => onBack('admin')}>Admin Paneli</button>}
            <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
        </div>
    );
}

function AdminScreen({ onBack, showAlert }) {
    const [view, setView] = useState('addMatch');
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 0, status: 'pending' });
    const [notification, setNotification] = useState({ title: '', body: '' });

    const handleAddMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');
            await setDoc(doc(collection(db, 'predictions')), { ...matchData, userId: u.uid, authorId: u.uid, createdAt: serverTimestamp() });
            showAlert('Eklendi!', 'success');
            setMatchData({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 0, status: 'pending' });
        } catch (err) { showAlert(err.message, 'error'); }
        finally { setLoading(false); }
    };

    const handleSendNotif = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');
            await setDoc(doc(collection(db, 'notifications')), { ...notification, userId: u.uid, timestamp: serverTimestamp(), sentBy: u.email });
            showAlert('Bildirim gönderildi!', 'success');
            setNotification({ title: '', body: '' });
        } catch (err) { showAlert(err.message, 'error'); }
        finally { setLoading(false); }
    };

    return (
        <div className="profile-container">
            <button className="back-btn" onClick={() => onBack('home')}>Geri</button>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button className="hero-btn secondary" onClick={() => setView('addMatch')}>Tahmin Ekle</button>
                <button className="hero-btn secondary" onClick={() => setView('notif')}>Bildirim Gönder</button>
            </div>
            {view === 'addMatch' ? (
                <form onSubmit={handleAddMatch}>
                    <div className="form-group"><label className="form-label">Kategori</label><select className="form-input" value={matchData.categoryKey} onChange={e => setMatchData({ ...matchData, categoryKey: parseInt(e.target.value) })}>{MENU_ITEMS.map(m => <option key={m.key} value={m.key}>{m.title}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Ev</label><input className="form-input" value={matchData.homeTeam} onChange={e => setMatchData({ ...matchData, homeTeam: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Deplasman</label><input className="form-input" value={matchData.awayTeam} onChange={e => setMatchData({ ...matchData, awayTeam: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Lig</label><select className="form-input" value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })}>{LEAGUES.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Tahmin</label><input className="form-input" value={matchData.prediction} onChange={e => setMatchData({ ...matchData, prediction: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Oran</label><input className="form-input" value={matchData.odds} onChange={e => setMatchData({ ...matchData, odds: e.target.value })} /></div>
                    <button className="submit-btn" disabled={loading}>Kaydet</button>
                </form>
            ) : (
                <form onSubmit={handleSendNotif}>
                    <div className="form-group"><label className="form-label">Başlık</label><input className="form-input" value={notification.title} onChange={e => setNotification({ ...notification, title: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Mesaj</label><textarea className="form-input" rows="4" value={notification.body} onChange={e => setNotification({ ...notification, body: e.target.value })} /></div>
                    <button className="submit-btn" disabled={loading}>Gönder</button>
                </form>
            )}
        </div>
    );
}

function PredictionCard({ item }) {
    return (
        <div className="prediction-card">
            <div className="card-header">
                <span className="league-badge">{item.league || 'LIG'}</span>
                {item.status && <span className={`status-badge ${item.status}`}>{item.status === 'won' ? 'KAZANDI' : 'KAYBETTI'}</span>}
            </div>
            <div className="match-row">
                <div className="team">
                    <img className="team-logo" src={getTeamLogo(item.homeTeam)} alt={item.homeTeam} />
                    <div className="team-name">{item.homeTeam || 'EV'}</div>
                </div>
                <div className="time-box"><div className="time-text">{item.time || '20:00'}</div></div>
                <div className="team">
                    <img className="team-logo" src={getTeamLogo(item.awayTeam, true)} alt={item.awayTeam} />
                    <div className="team-name">{item.awayTeam || 'DEP'}</div>
                </div>
            </div>
            <div className="card-footer">
                <div className="footer-item"><div className="footer-label">TAHMIN</div><div className="footer-value prediction">{item.prediction || '-'}</div></div>
                <div className="footer-item"><div className="footer-label">ORAN</div><div className="footer-value odds">{item.odds || '-'}</div></div>
            </div>
        </div>
    );
}

function CategoryScreen({ category, onBack }) {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [selectedTipster, setSelectedTipster] = useState(null);

    const tipsters = [
        { id: 'p1', name: 'GuedAus', role: 'Uzman Analist', image: 'https://i.ibb.co/60Tj8jJJ/Whats-App-mage-2025-12-07-at-23-21-34.jpg', stats: { total: 120, win: 85, rate: '%71' } },
        { id: 'p2', name: 'Goalman', role: 'Goal Makinesi', image: 'https://i.ibb.co/5XXgkWSP/Whats-App-mage-2025-12-07-at-23-21-42-1.jpg', stats: { total: 210, win: 140, rate: '%67' } },
        { id: 'p3', name: 'Casa De Luka', role: 'İspanya Ligi', image: 'https://i.ibb.co/2YqjD8BX/Whats-App-mage-2025-12-07-at-23-21-42.jpg', stats: { total: 95, win: 68, rate: '%72' } },
        { id: 'p4', name: 'Nbavipbox', role: 'Basketbol Gurusu', image: 'https://i.ibb.co/xtJDGZhT/Whats-App-mage-2025-12-07-at-23-21-34.jpg', stats: { total: 155, win: 105, rate: '%68' } },
    ];

    const IS_CARDS_MENU = [0, 1, 4, 6].includes(category.key);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'predictions'), where('categoryKey', '==', category.key), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, [category.key]);

    const filtered = selectedTipster ? predictions.filter(p => p.tipster?.toLowerCase().includes(selectedTipster.name.toLowerCase())) : selectedLeague ? predictions.filter(p => p.league === selectedLeague) : predictions;

    if (category.key === 2 && !selectedTipster) {
        return (
            <div className="category-page">
                <div className="category-header"><button className="category-back-btn" onClick={onBack}>{Icons.back}</button><h1 className="category-title">Tahminciler</h1></div>
                <div className="predictions-list">
                    {tipsters.map(t => (
                        <div key={t.id} className="prediction-card" style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }} onClick={() => setSelectedTipster(t)}>
                            <img src={t.image} style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--gold)' }} />
                            <div><h3 style={{ color: 'var(--gold)' }}>{t.name}</h3><p style={{ fontSize: 13, color: '#aaa' }}>{t.role}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="category-page">
            <div className="category-header">
                <button className="category-back-btn" onClick={selectedTipster ? () => setSelectedTipster(null) : selectedLeague ? () => setSelectedLeague(null) : onBack}>{Icons.back}</button>
                <h1 className="category-title">{selectedTipster ? selectedTipster.name : selectedLeague ? selectedLeague : category.title}</h1>
            </div>
            {IS_CARDS_MENU && !selectedLeague ? (
                <>
                    <div className="predictions-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        {LEAGUES.map(l => (
                            <div key={l.id} className="prediction-card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelectedLeague(l.id)}>
                                <img src={l.image} style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--gold)', marginBottom: 10 }} />
                                <h3 style={{ color: 'var(--gold)', fontSize: 15 }}>{l.title}</h3>
                                <p style={{ fontSize: 10, color: '#aaa' }}>{l.desc}</p>
                            </div>
                        ))}
                    </div>
                    <p style={{ textAlign: 'center', fontSize: 11, fontStyle: 'italic', color: '#666', marginTop: 30 }}>* Tüm analizler bet365 oran analizlerine dayalıdır.</p>
                </>
            ) : (
                <div className="predictions-list">
                    {loading ? <div className="loading"><div className="spinner" /></div> : filtered.length > 0 ? filtered.map(p => <PredictionCard key={p.id} item={p} />) : <p style={{ textAlign: 'center', color: '#666' }}>Tahmin bulunamadı.</p>}
                </div>
            )}
        </div>
    );
}

export default function App() {
    const [route, setRoute] = useState('home');
    const [routeParams, setRouteParams] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [legalType, setLegalType] = useState(null);

    useEffect(() => {
        const el = document.createElement('style'); el.textContent = styles; document.head.appendChild(el);
        return () => el.remove();
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setLoading(true);
            if (u) {
                setUser(u);
                try {
                    const d = await getDoc(doc(db, 'users', u.uid));
                    if (d.exists()) {
                        setUserData(d.data());
                    } else {
                        const initData = { uid: u.uid, email: u.email, username: u.email.split('@')[0], isAdmin: false, isPremium: false, createdAt: serverTimestamp() };
                        await setDoc(doc(db, 'users', u.uid), initData);
                        setUserData(initData);
                    }
                } catch (e) {
                    console.error(e);
                    const token = await getIdTokenResult(u);
                    setUserData({ uid: u.uid, email: u.email, username: u.displayName || u.email.split('@')[0], isAdmin: !!token.claims.admin });
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const navigate = useCallback((r, p = {}) => { setRoute(r); setRouteParams(p); }, []);
    const showAlert = useCallback((m, t) => setAlert({ message: m, type: t }), []);

    if (loading) return <div className="auth-loading-screen"><div className="spinner" /><h3>Oddsy Yükleniyor...</h3></div>;

    const render = () => {
        switch (route) {
            case 'auth': return <AuthScreen onBack={() => navigate('home')} showAlert={showAlert} />;
            case 'profile': return <ProfileScreen user={user} userData={userData} onBack={r => navigate(r || 'home')} showAlert={showAlert} />;
            case 'admin': return <AdminScreen onBack={() => navigate('home')} showAlert={showAlert} />;
            case 'category': return <CategoryScreen category={routeParams} onBack={() => navigate('home')} />;
            default: return <HomePage onLoginClick={() => navigate(user ? 'profile' : 'auth')} onNavigate={navigate} onShowLegal={setLegalType} />;
        }
    };

    return (
        <div className="app">
            {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
            {legalType && <LegalModal type={legalType} onClose={() => setLegalType(null)} />}
            <Header onMenuOpen={() => setSidebarOpen(true)} user={user} onProfileClick={() => navigate(user ? 'profile' : 'auth')} onNavigate={navigate} currentCategory={routeParams.key} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={navigate} currentRoute={route} />
            <main className="main-content">{render()}</main>
        </div>
    );
}
