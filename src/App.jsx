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
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { getDatabase } from 'firebase/database';
import OddsyKGAnaliz from './components/OddsyKGAnaliz';
import { getTeamLogo, handleLogoError } from './helper';

// Firebase Config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://oddsy-778d7-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase initializing...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log('Firebase initialized.');
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

html, body, #root, .app {
  background: var(--bg-dark);
  color: var(--text-primary);
  overflow-x: hidden;
  min-height: 100vh;
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
  color: var(--gold);
  letter-spacing: 1px;
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
  background: rgba(51, 51, 51, 0.8);
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

.main-content { padding-top: 65px; padding-bottom: 0; min-height: calc(100vh - 65px); background: var(--bg-dark); }

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
.hero-content { max-width: 900px; margin: 0 auto; position: relative; z-index: 2; text-align: center; text-shadow: 0 2px 15px rgba(51, 51, 51, 0.5); }
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
.category-page { min-height: calc(100vh - 65px); background: var(--bg-dark); }
.category-header { display: flex; align-items: center; gap: 15px; padding: 20px; background: var(--primary-green-dark); border-bottom: 1px solid var(--border); }
.category-back-btn { background: none; border: none; color: var(--gold); font-size: 24px; cursor: pointer; padding: 5px; }
.category-title { font-size: 18px; font-weight: 900; color: var(--gold); letter-spacing: 2px; }
.predictions-list { padding: 20px; display: grid; gap: 20px; }
.prediction-card { 
    background: linear-gradient(145deg, var(--primary-green-dark) 0%, #004d3a 100%); 
    border-radius: 24px; 
    padding: 24px; 
    border: 1px solid rgba(255, 255, 255, 0.1); 
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease;
    position: relative;
    overflow: hidden;
}
.prediction-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    opacity: 0.3;
}
.prediction-card:hover { transform: translateY(-5px); border-color: rgba(253, 185, 19, 0.3); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.league-badge { color: var(--gold); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
.status-badge { font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
.status-badge.won { background: var(--success); color: #000; box-shadow: 0 0 15px rgba(74, 222, 128, 0.3); }
.status-badge.lost { background: var(--error); color: #fff; box-shadow: 0 0 15px rgba(248, 113, 113, 0.3); }

.match-row-modern { display: flex; justify-content: space-around; align-items: center; margin: 25px 0; }
.team-box-modern { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.team-logo-modern { width: 65px; height: 65px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); }
.team-name-modern { font-size: 15px; font-weight: 800; color: #fff; text-align: center; max-width: 120px; line-height: 1.2; }
.scoreboard-box { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 80px; }
.scoreboard-time { font-size: 24px; font-weight: 900; color: var(--gold); letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.scoreboard-date { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 600; text-transform: uppercase; }

.card-footer-modern { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 15px; 
    margin-top: 20px; 
    padding-top: 20px; 
    border-top: 1px solid rgba(255, 255, 255, 0.1); 
}
.footer-pill { 
    background: rgba(0, 0, 0, 0.2); 
    padding: 12px; 
    border-radius: 16px; 
    text-align: center; 
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: 0.3s;
}
.footer-pill:hover { background: rgba(0, 0, 0, 0.3); border-color: var(--gold); }
.pill-label { color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 800; margin-bottom: 4px; text-transform: uppercase; }
.pill-value { font-size: 15px; font-weight: 800; color: #fff; }
.pill-value.prediction { color: var(--success); }
.pill-value.odds { color: var(--gold); }

.analysis-btn-modern {
    grid-column: span 2;
    background: transparent;
    border: 1px solid var(--gold);
    color: var(--gold);
    padding: 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 10px;
    transition: all 0.3s ease;
}
.analysis-btn-modern:hover {
    background: var(--gold);
    color: var(--primary-green-dark);
}

/* Coupon Cards - Bet365 Style */
.coupon-card {
    border: none;
    border-radius: 8px;
    padding: 0;
    margin-bottom: 25px;
    background: #2e3335;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    overflow: hidden;
}
.coupon-header {
    background: rgba(255,255,255,0.05);
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.coupon-title {
    color: var(--success);
    font-size: 14px;
    font-weight: 700;
    text-transform: none;
}
.coupon-match {
    display: flex;
    flex-direction: column;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    position: relative;
}
.coupon-match-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}
.coupon-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1px solid #aaa;
}
.coupon-match-prediction {
    flex: 1;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
}
.coupon-match-odds {
    color: #fff;
    font-weight: 400;
    font-size: 14px;
}
.coupon-match-teams {
    padding-left: 16px;
    font-size: 13px;
    color: #aaa;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.coupon-footer {
    background: var(--success);
    margin-top: 0;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: filter 0.2s;
}
.coupon-footer:hover {
    filter: brightness(1.1);
}
.total-odds-label {
    color: #fff;
    font-size: 15px;
    font-weight: 700;
}
.total-odds-value {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    text-shadow: none;
}
.coupon-type-badge {
    color: #aaa;
    font-size: 11px;
}

.analysis-content-box {
    grid-column: span 2;
    background: rgba(0,0,0,0.3);
    padding: 15px;
    border-radius: 12px;
    margin-top: 10px;
    font-size: 13px;
    color: #e2e8f0;
    line-height: 1.5;
    border-left: 3px solid var(--gold);
}

/* Footer */
.footer-section { padding: 60px 20px 20px; background: var(--bg-dark); border-top: 1px solid var(--border); }
.footer-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 40px; }
.footer-col { flex: 1; min-width: 200px; }
.footer-heading { font-size: 24px; font-weight: 900; color: var(--gold); margin-bottom: 15px; }
.footer-link { display: block; color: var(--text-secondary); margin-bottom: 10px; cursor: pointer; transition: 0.3s; font-size: 14px; text-decoration: none; }
.footer-link:hover { color: var(--gold); }
.footer-logo { font-size: 32px; font-weight: 900; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: 0.3s; }
.footer-logo:hover { opacity: 0.8; }
.about-pill-btn { background: transparent; border: 1.5px solid var(--gold); color: var(--gold); padding: 6px 18px; border-radius: 25px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; }
.about-pill-btn:hover { background: var(--gold); color: var(--bg-dark); box-shadow: 0 0 15px rgba(253, 185, 19, 0.4); }
.footer-divider { height: 1px; background: var(--border); margin: 30px auto; max-width: 1200px; }
.footer-bottom { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.age-badge-small { background: #ff0000; color: #fff; font-weight: 900; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
.copyright { font-size: 12px; color: #666; }

/* Auth */
.auth-container { min-height: calc(100vh - 65px); display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg-dark); }
.auth-card { width: 100%; max-width: 400px; padding: 30px; background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(51, 51, 51, 0.5); position: relative; }
.back-btn { background: none; border: none; color: var(--gold); cursor: pointer; font-size: 14px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; color: var(--text-secondary); font-size: 11px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
.form-input { width: 100%; padding: 12px 15px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary); font-size: 14px; }
.submit-btn { width: 100%; padding: 14px; background: var(--gold); border: none; border-radius: 10px; color: var(--primary-green-dark); font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.3s ease; }
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(253, 185, 19, 0.5); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.submit-btn:active { transform: scale(0.98); }

/* Profile & Admin */
.profile-container { padding: 40px 20px; max-width: 400px; margin: 0 auto; min-height: calc(100vh - 65px); background: var(--bg-dark); }
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
    { id: 'cat_ai_new', title: "YAPAY ZEKA ANALİZ BOTU", key: 10, icon: Icons.ai, color: "#FFD700", route: 'yapay-zeka-analizleri' },
    { id: 'cat_1', title: "ILK YARI GOL LISTESI", key: 0, icon: Icons.soccer, color: "#10B981", route: 'category' },
    { id: 'cat_coupons_new', title: "GÜNÜN KUPONLARI", key: 20, icon: Icons.ticket, color: "#f87171", route: 'coupons' },
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
    },
    about: {
        title: "Hakkında",
        content: `Oddsy, yapay zeka destekli bir futbol analiz platformudur. Amacımız, geçmiş maç verilerini ve algoritmalarımızı kullanarak kullanıcılara güvenilir maç içgörüleri sunmaktır.

Sistemimizde onlarca istatistik ve yapay zeka bazlı analiz algoritmasıyla, her maç için veriye dayalı tahminler oluşturuyoruz. Kullanıcı dostu arayüzümüz ve filtreleme seçeneklerimizle, analizleri kişiselleştirmenizi sağlıyoruz.`
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
        { id: 'cat_ai_new', title: "YAPAY ZEKA ANALİZLERİ", key: 10, route: 'yapay-zeka-analizleri' },
        { id: 'cat_2', title: "İLK YARI GOL LİSTESİ", key: 0, route: 'category' },
        { id: 'cat_8_new', title: "İY / MS TAHMİNLERİ", key: 7, route: 'category' },
        { id: 'cat_coupons', title: "GÜNÜN KUPONLARI", key: 20, route: 'coupons' },
        { id: 'cat_4', title: "TAHMİNCİLER", key: 2, route: 'category' },
        { id: 'cat_5', title: "KART/KORNER", key: 3, route: 'category' },
        { id: 'cat_6', title: "GÜNÜN TERCİHLERİ", key: 4, route: 'category' },
        { id: 'cat_7', title: "GÜNÜN SÜRPRİZLERİ", key: 6, route: 'category' },
        { id: 'cat_8', title: "EDİTÖRÜN SEÇİMİ", key: 8, route: 'category' },
    ];

    const handleCategoryClick = (cat) => {
        // Kuponlar için özel route
        if (cat.key === 20) {
            onNavigate('coupons');
            return;
        }
        // Yapay Zeka için özel route
        if (cat.key === 10) {
            onNavigate('yapay-zeka-analizleri');
            return;
        }
        // Diğer kategoriler için
        const menuItem = MENU_ITEMS.find(m => m.key === cat.key);
        onNavigate(menuItem?.route || 'category', menuItem);
    };

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
                        onClick={() => handleCategoryClick(cat)}
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
                        <div key={item.id} className={`sidebar-item ${currentRoute === item.route ? 'active' : ''}`} onClick={() => { onNavigate(item.route, { ...item }); onClose(); }}>
                            <span className="sidebar-item-icon">{item.icon}</span>
                            <span className="sidebar-item-text">{item.title}</span>
                        </div>
                    ))}
                </div>
                <div className="sidebar-divider" />
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Kurumsal</div>
                    <div className="sidebar-item" onClick={() => { onNavigate('about_modal'); onClose(); }}>
                        <span className="sidebar-item-icon">{Icons.star}</span>
                        <span className="sidebar-item-text">Hakkında</span>
                    </div>
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
                    <div className="hero-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="hero-btn primary" onClick={() => onNavigate('auth', { isLogin: false })}>Hemen Başla</button>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                            <h3 className="footer-logo" onClick={() => onNavigate('home')}>ODDSY</h3>
                            <button className="about-pill-btn" onClick={() => onShowLegal('about')}>Hakkında</button>
                        </div>
                        <p style={{ color: '#aaa', fontSize: 13, marginBottom: 20 }}>
                            Oddsy plaftormunda yer alan tüm bahis tahmin oranlari yasal mevzuatta olup oranlar yasal platformlardan alınmaktadir(iddaa.com vb.)
                        </p>
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
                        <a className="footer-link" onClick={() => onShowLegal('about')}>Hakkında</a>
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

function AuthScreen({ onBack, showAlert, initialIsLogin = true }) {
    const [isLogin, setIsLogin] = useState(initialIsLogin);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIsLogin(initialIsLogin);
    }, [initialIsLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return showAlert('Lütfen bilgileri eksiksiz girin.', 'error');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email.trim(), password.trim());
                showAlert('Giriş başarılı!', 'success');
                onBack();
            } else {
                const { user: newUser } = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
                await updateProfile(newUser, { displayName: email.split('@')[0] });
                await setDoc(doc(db, "users", newUser.uid), {
                    email: newUser.email,
                    username: email.split('@')[0],
                    uid: newUser.uid,
                    createdAt: serverTimestamp(),
                    isAdmin: false,
                    isPremium: false,
                    role: 'user',
                    tipsterName: null
                });
                showAlert('Kayıt başarılı!', 'success');
                onBack();
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
            <div className="profile-row"><span>Rol</span><span>{userData?.role === 'admin' ? 'Admin' : userData?.role === 'editor' ? 'Editör' : userData?.role === 'tipster' ? `Tahminci (${userData?.tipsterName})` : 'Üye'}</span></div>
            {userData?.role === 'admin' && <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => onBack('admin')}>Admin Paneli</button>}
            {userData?.role === 'editor' && <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => onBack('editor')}>Editör Paneli</button>}
            {userData?.role === 'tipster' && <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => onBack('tipster')}>Tahminci Paneli</button>}
            <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
        </div>
    );
}

function AdminDashboard({ onBack, userData }) {
    const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, totalPredictions: 0, totalCoupons: 0 });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const predictionsSnap = await getDocs(collection(db, 'predictions'));
                const couponsSnap = await getDocs(collection(db, 'coupons'));

                const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setUsers(usersData);

                setStats({
                    totalUsers: usersData.length,
                    onlineUsers: usersData.filter(u => u.lastActive && (Date.now() - u.lastActive?.toMillis?.() < 300000)).length,
                    totalPredictions: predictionsSnap.size,
                    totalCoupons: couponsSnap.size
                });
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRoleChange = async (userId, newRole, tipsterName = null) => {
        try {
            await setDoc(doc(db, 'users', userId), { role: newRole, tipsterName }, { merge: true });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, tipsterName } : u));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading"><div className="spinner" /></div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
            <button className="back-btn" onClick={() => onBack('home')}>Geri</button>
            <h1 style={{ color: 'var(--gold)', marginTop: 20, marginBottom: 30 }}>Admin Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 30 }}>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: 'var(--gold)', fontWeight: 'bold' }}>{stats.totalUsers}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Toplam Üye</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: '#4ade80', fontWeight: 'bold' }}>{stats.onlineUsers}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Çevrimiçi</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: '#10B981', fontWeight: 'bold' }}>{stats.totalPredictions}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Toplam Tahmin</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: '#f87171', fontWeight: 'bold' }}>{stats.totalCoupons}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Toplam Kupon</div>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                <h2 style={{ color: 'var(--gold)', fontSize: 18, marginBottom: 20 }}>Kullanıcı Yönetimi</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#aaa' }}>E-posta</th>
                                <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#aaa' }}>Kullanıcı Adı</th>
                                <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#aaa' }}>Rol</th>
                                <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#aaa' }}>Tahminci Adı</th>
                                <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#aaa' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: 10, fontSize: 12 }}>{u.email}</td>
                                    <td style={{ padding: 10, fontSize: 12 }}>{u.username}</td>
                                    <td style={{ padding: 10, fontSize: 12 }}>
                                        <select
                                            value={u.role || 'user'}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value, u.tipsterName)}
                                            style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: 5, borderRadius: 5, fontSize: 11 }}
                                        >
                                            <option value="user">Üye</option>
                                            <option value="admin">Admin</option>
                                            <option value="editor">Editör</option>
                                            <option value="tipster">Tahminci</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: 10, fontSize: 12 }}>
                                        {u.role === 'tipster' && (
                                            <select
                                                value={u.tipsterName || ''}
                                                onChange={(e) => handleRoleChange(u.id, 'tipster', e.target.value)}
                                                style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: 5, borderRadius: 5, fontSize: 11 }}
                                            >
                                                <option value="">Seçiniz</option>
                                                <option value="GuedAus">GuedAus</option>
                                                <option value="Goalman">Goalman</option>
                                                <option value="Casa De Luka">Casa De Luka</option>
                                                <option value="Nbavipbox">Nbavipbox</option>
                                            </select>
                                        )}
                                    </td>
                                    <td style={{ padding: 10, fontSize: 12, color: u.role === 'admin' ? 'var(--gold)' : u.role === 'editor' ? '#10B981' : u.role === 'tipster' ? '#f87171' : '#aaa' }}>
                                        {u.role === 'admin' ? 'Admin' : u.role === 'editor' ? 'Editör' : u.role === 'tipster' ? 'Tahminci' : 'Üye'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function EditorScreen({ onBack, showAlert, userData }) {
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 8, status: 'pending', analysis: '' });

    const handleAddMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');

            const docData = { ...matchData, userId: u.uid, authorId: u.uid, createdAt: serverTimestamp() };
            await addDoc(collection(db, 'predictions'), docData);
            showAlert('Editör tahmini eklendi!', 'success');
            setMatchData({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 8, status: 'pending', analysis: '' });
        } catch (err) {
            console.error('Match Save Error:', err);
            showAlert('Hata: ' + err.message, 'error');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
            <button className="back-btn" onClick={() => onBack('home')}>Geri</button>
            <h1 style={{ color: 'var(--gold)', marginTop: 20, marginBottom: 30 }}>Editör Paneli - Editörün Seçimi</h1>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                <form onSubmit={handleAddMatch}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.homeTeam} onChange={e => setMatchData({ ...matchData, homeTeam: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.awayTeam} onChange={e => setMatchData({ ...matchData, awayTeam: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Lig</label><select className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })}>{LEAGUES.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Saat</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="20:45" value={matchData.time} onChange={e => setMatchData({ ...matchData, time: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Tahmin</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.prediction} onChange={e => setMatchData({ ...matchData, prediction: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Oran</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.odds} onChange={e => setMatchData({ ...matchData, odds: e.target.value })} /></div>
                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Maç Analizi</label><textarea className="form-input" style={{ padding: 8, fontSize: 12 }} rows="2" value={matchData.analysis} onChange={e => setMatchData({ ...matchData, analysis: e.target.value })} placeholder="Bu maç için analizini buraya yaz..." /></div>
                    </div>
                    <button className="submit-btn" disabled={loading} style={{ marginTop: 15, padding: 10, fontSize: 13 }}>Kaydet</button>
                </form>
            </div>
        </div>
    );
}

function TipsterScreen({ onBack, showAlert, userData }) {
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 2, status: 'pending', analysis: '', tipster: userData?.tipsterName || '' });

    const handleAddMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');
            if (!userData?.tipsterName) throw new Error('Tahminci adı atanmamış');

            const docData = { ...matchData, tipster: userData.tipsterName, userId: u.uid, authorId: u.uid, createdAt: serverTimestamp() };
            await addDoc(collection(db, 'predictions'), docData);
            showAlert('Tahmin eklendi!', 'success');
            setMatchData({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 2, status: 'pending', analysis: '', tipster: userData.tipsterName });
        } catch (err) {
            console.error('Match Save Error:', err);
            showAlert('Hata: ' + err.message, 'error');
        } finally { setLoading(false); }
    };

    if (!userData?.tipsterName) {
        return (
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
                <button className="back-btn" onClick={() => onBack('home')}>Geri</button>
                <div style={{ textAlign: 'center', marginTop: 50, color: '#aaa' }}>
                    <h2>Tahminci adınız atanmamış</h2>
                    <p>Lütfen admin ile iletişime geçin.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
            <button className="back-btn" onClick={() => onBack('home')}>Geri</button>
            <h1 style={{ color: 'var(--gold)', marginTop: 20, marginBottom: 30 }}>Tahminci Paneli - {userData.tipsterName}</h1>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                <form onSubmit={handleAddMatch}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.homeTeam} onChange={e => setMatchData({ ...matchData, homeTeam: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.awayTeam} onChange={e => setMatchData({ ...matchData, awayTeam: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Lig</label><select className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })}>{LEAGUES.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Saat</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="20:45" value={matchData.time} onChange={e => setMatchData({ ...matchData, time: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Tahmin</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.prediction} onChange={e => setMatchData({ ...matchData, prediction: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Oran</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.odds} onChange={e => setMatchData({ ...matchData, odds: e.target.value })} /></div>
                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Maç Analizi</label><textarea className="form-input" style={{ padding: 8, fontSize: 12 }} rows="2" value={matchData.analysis} onChange={e => setMatchData({ ...matchData, analysis: e.target.value })} placeholder="Bu maç için analizini buraya yaz..." /></div>
                    </div>
                    <button className="submit-btn" disabled={loading} style={{ marginTop: 15, padding: 10, fontSize: 13 }}>Kaydet</button>
                </form>
            </div>
        </div>
    );
}

function AdminScreen({ onBack, showAlert, userData }) {
    const [view, setView] = useState('addMatch');
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 0, status: 'pending', analysis: '', cardHomeAvg: '', cardAwayAvg: '', refereeInfo: '', cornerHomeAvg: '', cornerAwayAvg: '', cornerGenAvg: '' });
    const [couponData, setCouponData] = useState({ type: 'Günün Banko Kuponu', matches: [{ home: '', away: '', prediction: '', odds: '' }] });
    const [notification, setNotification] = useState({ title: '', body: '' });

    const handleAddMatchToCoupon = () => {
        setCouponData({ ...couponData, matches: [...couponData.matches, { home: '', away: '', prediction: '', odds: '' }] });
    };

    const handleUpdateCouponMatch = (index, field, value) => {
        const newMatches = [...couponData.matches];
        newMatches[index][field] = value;
        setCouponData({ ...couponData, matches: newMatches });
    };

    const handleSaveCoupon = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');
            const totalOdds = couponData.matches.reduce((acc, curr) => acc * parseFloat(curr.odds || 1), 1).toFixed(2);
            await addDoc(collection(db, 'coupons'), {
                ...couponData,
                totalOdds,
                createdAt: serverTimestamp(),
                authorId: u.uid
            });
            showAlert('Kupon eklendi!', 'success');
            setCouponData({ type: 'Günün Banko Kuponu', matches: [{ home: '', away: '', prediction: '', odds: '' }] });
        } catch (err) {
            console.error('Coupon Save Error:', err);
            showAlert('Hata: ' + err.message, 'error');
        } finally { setLoading(false); }
    };

    const handleAddMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');

            let finalData = { ...matchData };
            if (view === 'addCard') {
                finalData.cornerHomeAvg = ''; finalData.cornerAwayAvg = ''; finalData.cornerGenAvg = '';
            } else if (view === 'addCorner') {
                finalData.cardHomeAvg = ''; finalData.cardAwayAvg = ''; finalData.refereeInfo = '';
            } else if (view === 'addMatch' && matchData.categoryKey !== 3) {
                finalData.cardHomeAvg = ''; finalData.cardAwayAvg = ''; finalData.refereeInfo = '';
                finalData.cornerHomeAvg = ''; finalData.cornerAwayAvg = ''; finalData.cornerGenAvg = '';
            }

            const docData = { ...finalData, userId: u.uid, authorId: u.uid, createdAt: serverTimestamp() };
            await addDoc(collection(db, 'predictions'), docData);
            showAlert('Eklendi!', 'success');

            // Sadece form alanlarını temizle, categoryKey'i view'e göre koru
            setMatchData({
                ...matchData,
                homeTeam: '', awayTeam: '', prediction: '', odds: '', analysis: '',
                cardHomeAvg: '', cardAwayAvg: '', refereeInfo: '',
                cornerHomeAvg: '', cornerAwayAvg: '', cornerGenAvg: ''
            });
        } catch (err) {
            console.error('Match Save Error:', err);
            showAlert('Hata: ' + err.message, 'error');
        } finally { setLoading(false); }
    };

    const handleClearCollection = async (collName) => {
        if (!window.confirm(`Tüm ${collName === 'coupons' ? 'kuponları' : 'maçları'} silmek istediğinize emin misiniz?`)) return;
        setLoading(true);
        try {
            const q = query(collection(db, collName));
            const snap = await getDocs(q);
            const promises = snap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(promises);
            showAlert('Temizlendi!', 'success');
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
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
            <button className="back-btn" onClick={() => onBack('home')}>Geri</button>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginTop: 20 }}>
                {/* Sol Taraf - Input Listesi */}
                <div style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 10, height: 'fit-content' }}>
                    <h3 style={{ color: 'var(--gold)', fontSize: 14, marginBottom: 15, textAlign: 'center' }}>INPUT</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className={`hero-btn secondary ${view === 'addMatch' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('addMatch')}>Tahmin Ekle</button>
                        <button className={`hero-btn secondary ${view === 'addCoupon' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('addCoupon')}>Kupon Ekle</button>
                        <button className={`hero-btn secondary ${view === 'addCard' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => { setView('addCard'); setMatchData({ ...matchData, categoryKey: 3 }); }}>Kart Ekle</button>
                        <button className={`hero-btn secondary ${view === 'addCorner' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => { setView('addCorner'); setMatchData({ ...matchData, categoryKey: 3 }); }}>Korner Ekle</button>
                        <button className={`hero-btn secondary ${view === 'notif' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('notif')}>Bildirim Gönder</button>
                    </div>
                </div>

                {/* Sağ Taraf - Form Alanı */}
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                    {(view === 'addMatch' || view === 'addCard' || view === 'addCorner') && (
                        <form onSubmit={handleAddMatch}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {view === 'addMatch' && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Kategori</label><select className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.categoryKey} onChange={e => setMatchData({ ...matchData, categoryKey: parseInt(e.target.value) })}>{MENU_ITEMS.map(m => <option key={m.key} value={m.key}>{m.title}</option>)}</select></div>
                                )}
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.homeTeam} onChange={e => setMatchData({ ...matchData, homeTeam: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.awayTeam} onChange={e => setMatchData({ ...matchData, awayTeam: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Lig</label><select className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })}>{LEAGUES.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Saat</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="20:45" value={matchData.time} onChange={e => setMatchData({ ...matchData, time: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Tahmin</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.prediction} onChange={e => setMatchData({ ...matchData, prediction: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Oran</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.odds} onChange={e => setMatchData({ ...matchData, odds: e.target.value })} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Maç Analizi</label><textarea className="form-input" style={{ padding: 8, fontSize: 12 }} rows="2" value={matchData.analysis} onChange={e => setMatchData({ ...matchData, analysis: e.target.value })} placeholder="Bu maç için analizini buraya yaz..." /></div>
                            </div>

                            {view === 'addCard' && (
                                <details style={{ marginTop: 15, borderTop: '2px solid #444', paddingTop: 15, cursor: 'pointer' }}>
                                    <summary style={{ color: 'var(--gold)', fontWeight: 'bold', marginBottom: 10, listStyle: 'none', userSelect: 'none', fontSize: 12 }}>📊 Kart İstatistikleri (Tıkla)</summary>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cardHomeAvg} onChange={e => setMatchData({ ...matchData, cardHomeAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cardAwayAvg} onChange={e => setMatchData({ ...matchData, cardAwayAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Hakem İsim/Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.refereeInfo} onChange={e => setMatchData({ ...matchData, refereeInfo: e.target.value })} /></div>
                                    </div>
                                </details>
                            )}

                            {view === 'addCorner' && (
                                <details style={{ marginTop: 15, borderTop: '2px solid #444', paddingTop: 15, cursor: 'pointer' }}>
                                    <summary style={{ color: '#10B981', fontWeight: 'bold', marginBottom: 10, listStyle: 'none', userSelect: 'none', fontSize: 12 }}>⚽ Korner İstatistikleri (Tıkla)</summary>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cornerHomeAvg} onChange={e => setMatchData({ ...matchData, cornerHomeAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cornerAwayAvg} onChange={e => setMatchData({ ...matchData, cornerAwayAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Genel Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cornerGenAvg} onChange={e => setMatchData({ ...matchData, cornerGenAvg: e.target.value })} /></div>
                                    </div>
                                </details>
                            )}

                            <button className="submit-btn" disabled={loading} style={{ marginTop: 15, padding: 10, fontSize: 13 }}>Kaydet</button>
                        </form>
                    )}

                    {view === 'addCoupon' && (
                        <form onSubmit={handleSaveCoupon}>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="form-label" style={{ fontSize: 10 }}>Kupon Türü</label>
                                <select className="form-input" style={{ padding: 8, fontSize: 12 }} value={couponData.type} onChange={e => setCouponData({ ...couponData, type: e.target.value })}>
                                    <option value="Günün Banko Kuponu">Günün Banko Kuponu</option>
                                    <option value="Günün İdeal Kuponu">Günün İdeal Kuponu</option>
                                    <option value="Günün Sürpriz Kuponu">Günün Sürpriz Kuponu</option>
                                </select>
                            </div>

                            {couponData.matches.map((m, i) => (
                                <div key={i} style={{ border: '2px solid var(--primary-green)', padding: 12, borderRadius: 10, marginBottom: 12, background: '#3a3a3a' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                        <input placeholder="Ev Sahibi" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.home} onChange={e => handleUpdateCouponMatch(i, 'home', e.target.value)} />
                                        <input placeholder="Deplasman" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.away} onChange={e => handleUpdateCouponMatch(i, 'away', e.target.value)} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <input placeholder="Tahmin" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.prediction} onChange={e => handleUpdateCouponMatch(i, 'prediction', e.target.value)} />
                                        <input placeholder="Oran (1.50)" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.odds} onChange={e => handleUpdateCouponMatch(i, 'odds', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="hero-btn secondary" onClick={handleAddMatchToCoupon} style={{ width: '100%', marginBottom: 12, padding: 10, fontSize: 12 }}>+ Maç Ekle</button>
                            <button className="submit-btn" disabled={loading} style={{ padding: 10, fontSize: 13 }}>Kuponu Kaydet</button>
                        </form>
                    )}

                    {view === 'notif' && (
                        <form onSubmit={handleSendNotif}>
                            <div className="form-group" style={{ marginBottom: 15 }}><label className="form-label" style={{ fontSize: 10 }}>Başlık</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={notification.title} onChange={e => setNotification({ ...notification, title: e.target.value })} /></div>
                            <div className="form-group" style={{ marginBottom: 15 }}><label className="form-label" style={{ fontSize: 10 }}>Mesaj</label><textarea className="form-input" style={{ padding: 8, fontSize: 12 }} rows="3" value={notification.body} onChange={e => setNotification({ ...notification, body: e.target.value })} /></div>
                            <button className="submit-btn" disabled={loading} style={{ padding: 10, fontSize: 13 }}>Gönder</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function CouponScreen({ onBack, showAlert }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'coupons'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            setCoupons(data);
            setLoading(false);
        }, (err) => {
            console.error('Snapshot Error:', err);
            showAlert('Veri çekilemedi: ' + err.message, 'error');
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const couponTypes = [
        { id: 'banko', name: 'Banko Kupon', dbName: 'Günün Banko Kuponu', color: 'var(--gold)', image: '/banko_kupon.png', desc: 'Günün en güvenilir tahminleri' },
        { id: 'ideal', name: 'İdeal Kupon', dbName: 'Günün İdeal Kuponu', color: '#4ade80', image: '/ideal_kupon.png', desc: 'Dengeli oran ve güven kombinasyonu' },
        { id: 'surpriz', name: 'Sürpriz Kupon', dbName: 'Günün Sürpriz Kuponu', color: '#f87171', image: '/surpriz_kupon.png', desc: 'Yüksek oranlı cesur tahminler' }
    ];

    if (loading) return <div className="loading"><div className="spinner" /></div>;

    // Kart seçim ekranı
    if (!selectedType) {
        return (
            <div className="category-page">
                <div className="category-header">
                    <button className="category-back-btn" onClick={onBack}>{Icons.back}</button>
                    <h1 className="category-title">GÜNÜN KUPONLARI</h1>
                </div>
                <div className="predictions-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 15, maxWidth: 600, margin: '0 auto' }}>
                    {couponTypes.map(type => {
                        const typeCoupons = coupons.filter(c => c.type === type.dbName);
                        const latestCoupon = typeCoupons[0];

                        return (
                            <div key={type.id} className="prediction-card" style={{ textAlign: 'center', cursor: 'pointer', padding: 30, position: 'relative' }} onClick={() => setSelectedType(type)}>
                                <img src={type.image} style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt={type.name} />
                                <h3 style={{ color: type.color, fontSize: 18, marginBottom: 10 }}>{type.name}</h3>
                                {latestCoupon && (
                                    <div style={{ marginTop: 15, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                                        <div style={{ fontSize: 11, color: '#aaa' }}>Toplam Oran</div>
                                        <div style={{ fontSize: 24, color: type.color, fontWeight: 'bold' }}>{latestCoupon.totalOdds}</div>
                                        <div style={{ fontSize: 10, color: '#666', marginTop: 5 }}>{latestCoupon.matches?.length || 0} Maç</div>
                                    </div>
                                )}
                                {!latestCoupon && (
                                    <div style={{ marginTop: 15, padding: 10, fontSize: 12, color: '#666' }}>Henüz kupon eklenmedi</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Seçilen kupon türünün detayları
    const filteredCoupons = coupons.filter(c => c.type === selectedType.dbName);

    return (
        <div className="category-page">
            <div className="category-header">
                <button className="category-back-btn" onClick={() => setSelectedType(null)}>{Icons.back}</button>
                <h1 className="category-title">{selectedType.name}</h1>
            </div>

            <div className="predictions-list">
                {filteredCoupons.length > 0 ? filteredCoupons.map(c => (
                    <div key={c.id} className="coupon-card">
                        <div className="coupon-header">
                            <span className="coupon-title">{c.type}</span>
                        </div>
                        {c.matches.map((m, idx) => (
                            <div key={idx} className="coupon-match">
                                <div className="coupon-match-header">
                                    <div className="coupon-dot" style={{ background: selectedType.color }}></div>
                                    <div className="coupon-match-prediction" style={{ color: selectedType.color }}>{m.home} - {m.prediction}</div>
                                    <div className="coupon-match-odds" style={{ color: '#fff', fontWeight: 'bold' }}>{m.odds}</div>
                                </div>
                                <div className="coupon-match-teams">
                                    <span style={{ color: '#fff' }}>{m.home}</span>
                                    <span style={{ color: '#fff' }}>{m.away}</span>
                                </div>
                            </div>
                        ))}
                        <div className="coupon-footer" style={{ borderTop: '2px solid rgba(255,255,255,0.1)', background: 'transparent' }}>
                            <span className="total-odds-label" style={{ color: '#aaa' }}>Toplam Oran</span>
                            <span className="total-odds-value" style={{ color: selectedType.color, fontSize: '24px' }}>{c.totalOdds}</span>
                        </div>
                    </div>
                )) : <p style={{ textAlign: 'center', color: '#666' }}>Henüz {selectedType.name} eklenmedi.</p>}
            </div>
        </div>
    );
}

function PredictionCard({ item }) {
    const [showAnalysis, setShowAnalysis] = useState(false);

    return (
        <div className="prediction-card">
            <div className="card-header">
                <span className="league-badge">{item.league || 'LIG'}</span>
                {item.status && <span className={`status-badge ${item.status}`}>{item.status === 'won' ? 'WON' : 'LOST'}</span>}
            </div>

            <div className="match-row-modern">
                <div className="team-box-modern">
                    <img className="team-logo-modern" src={getTeamLogo(item.homeTeam)} onError={handleLogoError} alt={item.homeTeam} />
                    <div className="team-name-modern">{item.homeTeam || 'HOME'}</div>
                </div>

                <div className="scoreboard-box">
                    <div className="scoreboard-time">{item.time || '20:00'}</div>
                    <div className="scoreboard-date">Bugün</div>
                </div>

                <div className="team-box-modern">
                    <img className="team-logo-modern" src={getTeamLogo(item.awayTeam)} onError={handleLogoError} alt={item.awayTeam} />
                    <div className="team-name-modern">{item.awayTeam || 'AWAY'}</div>
                </div>
            </div>

            <div className="card-footer-modern">
                <div className="footer-pill">
                    <div className="pill-label">Tahmin</div>
                    <div className="pill-value prediction">{item.prediction || '-'}</div>
                </div>
                <div className="footer-pill">
                    <div className="pill-label">Oran</div>
                    <div className="pill-value odds">{item.odds || '-'}</div>
                </div>

                {item.analysis && (
                    <>
                        <button
                            className="analysis-btn-modern"
                            onClick={() => setShowAnalysis(!showAnalysis)}
                        >
                            {showAnalysis ? 'Analizi Kapat' : 'Analiz Gör'}
                        </button>
                        {showAnalysis && (
                            <div className="analysis-content-box">
                                {item.analysis}
                            </div>
                        )}
                    </>
                )}

                {item.categoryKey === 3 && (
                    <div style={{ width: '100%', marginTop: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(item.cardHomeAvg || item.cardAwayAvg || item.refereeInfo) && (
                            <div style={{ background: 'rgba(253, 185, 19, 0.1)', border: '1px solid var(--gold)', borderRadius: 10, padding: 12 }}>
                                <p style={{ color: 'var(--gold)', fontWeight: '800', fontSize: 13, marginBottom: 8, borderBottom: '1px solid rgba(253,185,19,0.2)', paddingBottom: 4 }}>Kart İstatistikleri</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Ev Sahibi Ortalama:</span><span style={{ color: '#fff' }}>{item.cardHomeAvg || '-'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Deplasman Ortalama:</span><span style={{ color: '#fff' }}>{item.cardAwayAvg || '-'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Hakem İsim/Ortalama:</span><span style={{ color: '#fff' }}>{item.refereeInfo || '-'}</span></div>
                                </div>
                            </div>
                        )}
                        {(item.cornerHomeAvg || item.cornerAwayAvg || item.cornerGenAvg) && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: 10, padding: 12 }}>
                                <p style={{ color: '#10B981', fontWeight: '800', fontSize: 13, marginBottom: 8, borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: 4 }}>Korner İstatistikleri</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Ev Sahibi Ort:</span><span style={{ color: '#fff' }}>{item.cornerHomeAvg || '-'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Deplasman Ort:</span><span style={{ color: '#fff' }}>{item.cornerAwayAvg || '-'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#aaa' }}>Genel Ort:</span><span style={{ color: '#fff' }}>{item.cornerGenAvg || '-'}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}






function CategoryScreen({ category, onBack }) {
    if (!category || category.key === undefined || category.key === null) return <div className="loading"><div className="spinner" /></div>;
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [selectedTipster, setSelectedTipster] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const tipsters = [
        { id: 'p1', name: 'GuedAus', role: 'Uzman Analist', image: 'https://i.ibb.co/60Tj8jJJ/Whats-App-mage-2025-12-07-at-23-21-34-1.jpg', stats: { total: 120, win: 85, rate: '%71' } },
        { id: 'p2', name: 'Goalman', role: 'Goal Makinesi', image: 'https://i.ibb.co/5XXgkWSP/Whats-App-mage-2025-12-07-at-23-21-42-1.jpg', stats: { total: 210, win: 140, rate: '%67' } },
        { id: 'p3', name: 'Casa De Luka', role: 'İspanya Ligi', image: 'https://i.ibb.co/2YqjD8BX/Whats-App-mage-2025-12-07-at-23-21-42.jpg', stats: { total: 95, win: 68, rate: '%72' } },
        { id: 'p4', name: 'Nbavipbox', role: 'Basketbol Gurusu', image: 'https://i.ibb.co/xtJDGZhT/Whats-App-mage-2025-12-07-at-23-21-34.jpg', stats: { total: 155, win: 105, rate: '%68' } },
    ];

    const IS_BOT_MENU = [0, 4, 6].includes(category.key);
    const IS_CARD_KORNER_MENU = category.key === 3;
    const IS_COUPON_MENU = category.key === 20;

    useEffect(() => {
        let q;
        const dbKeyMap = { 0: 'ilk-yari-gol', 4: 'gunun-tercihleri', 6: 'gunun-surprizleri' };

        if (IS_BOT_MENU) {
            setLoading(true);
            q = query(
                collection(db, 'predictions'),
                where('categoryKey', '==', dbKeyMap[category.key]),
                orderBy('createdAt', 'desc')
            );
        } else if (selectedSubCategory) {
            setLoading(true);
            q = query(collection(db, 'predictions'), where('categoryKey', '==', category.key), orderBy('createdAt', 'desc'));
        } else if (!IS_CARD_KORNER_MENU && !IS_COUPON_MENU) {
            setLoading(true);
            q = query(collection(db, 'predictions'), where('categoryKey', '==', category.key), orderBy('createdAt', 'desc'));
        }

        if (q) {
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                if (IS_BOT_MENU) {
                    list = list.filter(p => {
                        if (!p.createdAt) return false;
                        const createdDate = p.createdAt.toDate();
                        createdDate.setHours(0, 0, 0, 0);
                        return createdDate.getTime() === today.getTime();
                    });
                }

                if (selectedSubCategory) {
                    list = list.filter(p => {
                        if (selectedSubCategory === 'card') return p.cardHomeAvg || p.cardAwayAvg || p.refereeInfo;
                        if (selectedSubCategory === 'corner') return p.cornerHomeAvg || p.cornerAwayAvg || p.cornerGenAvg;
                        return false;
                    });
                }

                setPredictions(list);
                setLoading(false);
            }, (error) => {
                console.error('Firebase Error:', error);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [category.key, selectedSubCategory, IS_BOT_MENU, IS_CARD_KORNER_MENU, IS_COUPON_MENU]);

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

    if (IS_BOT_MENU) {
        // Logo hata durumunda default logo göster (asla gizleme!)
        const handleImgError = (e) => {
            const src = e.target.src;
            console.log('Logo BULUNAMADI, default kullanılıyor:', src);

            // Sonsuz döngüyü önle
            if (src.includes('default-team') || src.includes('data:image') || src.includes('placeholder')) {
                e.target.onerror = null;
                return;
            }

            // Default futbol topu logosu (SVG data URL - sarı çerçeveli)
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iIzJlMzMzNSIgc3Ryb2tlPSIjRkRCOTEzIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNNTAgMTBMNjUgMzBMODUgMzVMNzUgNTVMODAgNzVMNTAgODBMMjAgNzVMMjUgNTVMMTUgMzVMMzUgMzBaIiBmaWxsPSIjRkRCOTEzIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkRCOTEzIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
            e.target.onerror = null;
        };

        return (
            <div style={{
                minHeight: 'calc(100vh - 65px)',
                background: '#333333',
                paddingTop: '20px'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '20px',
                    background: '#00523c',
                    borderBottom: '1px solid #555'
                }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#FDB913',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '5px'
                        }}
                    >
                        {Icons.back}
                    </button>
                    <h1 style={{
                        fontSize: '18px',
                        fontWeight: '900',
                        color: '#FDB913',
                        letterSpacing: '2px',
                        margin: 0
                    }}>
                        {category.title}
                    </h1>
                </div>

                {/* Kartlar Container - Alt alta, Ortalanmış */}
                <div style={{
                    padding: '30px 20px',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #555',
                                borderTopColor: '#FDB913',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            {filtered.map(p => {
                                const homeTeam = p.homeTeam || p.home_team || 'Ev Sahibi';
                                const awayTeam = p.awayTeam || p.away_team || 'Deplasman';

                                return (
                                    <div
                                        key={p.id}
                                        style={{
                                            background: '#2e3335',
                                            border: '3px solid #006A4E',
                                            borderRadius: '20px',
                                            padding: '24px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {/* Lig Bilgisi */}
                                        {p.league && (
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: 'rgba(253, 185, 19, 0.7)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                marginBottom: '20px',
                                                textAlign: 'center'
                                            }}>
                                                {p.league}
                                            </div>
                                        )}

                                        {/* Takımlar ve BUGÜN */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '20px'
                                        }}>
                                            {/* Ev Sahibi */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <img
                                                    src={getTeamLogo(homeTeam)}
                                                    alt={homeTeam}
                                                    onError={handleImgError}
                                                    style={{
                                                        width: '70px',
                                                        height: '70px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    color: '#ffffff',
                                                    textAlign: 'center',
                                                    lineHeight: '1.2'
                                                }}>
                                                    {homeTeam}
                                                </span>
                                            </div>

                                            {/* Ortada BUGÜN */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                minWidth: '80px'
                                            }}>
                                                <span style={{
                                                    fontSize: '20px',
                                                    fontWeight: '900',
                                                    color: '#FDB913',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    BUGÜN
                                                </span>
                                            </div>

                                            {/* Deplasman */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <img
                                                    src={getTeamLogo(awayTeam)}
                                                    alt={awayTeam}
                                                    onError={handleImgError}
                                                    style={{
                                                        width: '70px',
                                                        height: '70px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    color: '#ffffff',
                                                    textAlign: 'center',
                                                    lineHeight: '1.2'
                                                }}>
                                                    {awayTeam}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Oranlar Grid - Sadece varsa göster */}
                                        {(p['2_5_ust'] || p['3_5_ust'] || p['ms_5_5_ust'] || p.kategori || p.prediction) && (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                                gap: '12px',
                                                marginTop: '24px'
                                            }}>
                                                {p['2_5_ust'] && (
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        padding: '14px',
                                                        borderRadius: '12px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>2.5 Üst</div>
                                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#FDB913' }}>{p['2_5_ust']}</div>
                                                    </div>
                                                )}
                                                {p['3_5_ust'] && (
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        padding: '14px',
                                                        borderRadius: '12px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>3.5 Üst</div>
                                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#FDB913' }}>{p['3_5_ust']}</div>
                                                    </div>
                                                )}
                                                {p['ms_5_5_ust'] && (
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        padding: '14px',
                                                        borderRadius: '12px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>MS 5.5 Üst</div>
                                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#FDB913' }}>{p['ms_5_5_ust']}</div>
                                                    </div>
                                                )}
                                                {p.kategori && (
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        padding: '14px',
                                                        borderRadius: '12px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>Tahmin</div>
                                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#FDB913' }}>{p.kategori}</div>
                                                    </div>
                                                )}
                                                {p.prediction && !p.kategori && (
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        padding: '14px',
                                                        borderRadius: '12px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>Tahmin</div>
                                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#FDB913' }}>{p.prediction}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#888', padding: '50px', fontSize: '16px' }}>
                            Bugün için henüz tahmin bulunamadı.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (IS_CARD_KORNER_MENU && !selectedSubCategory) {
        return (
            <div className="category-page">
                <div className="category-header">
                    <button className="category-back-btn" onClick={onBack}>{Icons.back}</button>
                    <h1 className="category-title">{category.title}</h1>
                </div>
                <div className="predictions-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 15, maxWidth: 600, margin: '0 auto' }}>
                    <div className="prediction-card" style={{ textAlign: 'center', cursor: 'pointer', padding: 30 }} onClick={() => setSelectedSubCategory('card')}>
                        <img src="/kart_istatistik.png" style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt="Kart İstatistikleri" />
                        <h3 style={{ color: 'var(--gold)', fontSize: 18, marginBottom: 10 }}>Kart İstatistikleri</h3>
                    </div>
                    <div className="prediction-card" style={{ textAlign: 'center', cursor: 'pointer', padding: 30 }} onClick={() => setSelectedSubCategory('corner')}>
                        <img src="/korner_istatistik.png" style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt="Korner İstatistikleri" />
                        <h3 style={{ color: '#10B981', fontSize: 18, marginBottom: 10 }}>Korner İstatistikleri</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="category-page">
            <div className="category-header">
                <button className="category-back-btn" onClick={selectedTipster ? () => setSelectedTipster(null) : selectedLeague ? () => setSelectedLeague(null) : selectedSubCategory ? () => setSelectedSubCategory(null) : onBack}>{Icons.back} </button>
                <h1 className="category-title">
                    {selectedTipster ? selectedTipster.name :
                        selectedLeague ? selectedLeague :
                            selectedSubCategory === 'card' ? 'Kart İstatistikleri' :
                                selectedSubCategory === 'corner' ? 'Korner İstatistikleri' :
                                    category.title}
                </h1>
            </div>
            <div className="predictions-list">
                {loading ? <div className="loading"><div className="spinner" /></div> : filtered.length > 0 ? filtered.map(p => <PredictionCard key={p.id} item={p} />) : <p style={{ textAlign: 'center', color: '#666' }}>Tahmin bulunamadı.</p>}
            </div>
        </div>
    );
}

export default function App() {
    console.log('App rendering...');
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
                        const data = d.data();
                        // Eski isAdmin alanını yeni role sistemine çevir
                        if (data.isAdmin && !data.role) {
                            await setDoc(doc(db, 'users', u.uid), { role: 'admin' }, { merge: true });
                            setUserData({ ...data, role: 'admin' });
                        } else if (!data.role) {
                            await setDoc(doc(db, 'users', u.uid), { role: 'user' }, { merge: true });
                            setUserData({ ...data, role: 'user' });
                        } else {
                            setUserData(data);
                        }
                    } else {
                        const initData = { uid: u.uid, email: u.email, username: u.email.split('@')[0], isAdmin: false, isPremium: false, role: 'user', tipsterName: null, createdAt: serverTimestamp() };
                        await setDoc(doc(db, 'users', u.uid), initData);
                        setUserData(initData);
                    }
                } catch (e) {
                    console.error(e);
                    const token = await getIdTokenResult(u);
                    const isAdmin = !!token.claims.admin;
                    setUserData({ uid: u.uid, email: u.email, username: u.displayName || u.email.split('@')[0], isAdmin, role: isAdmin ? 'admin' : 'user' });
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const navigate = useCallback((r, p = {}) => {
        if (r === 'about_modal') {
            setLegalType('about');
            return;
        }
        setRoute(r);
        setRouteParams(p);
    }, []);
    const showAlert = useCallback((m, t) => setAlert({ message: m, type: t }), []);

    if (loading) return <div className="auth-loading-screen"><div className="spinner" /><h3>Oddsy Yükleniyor...</h3></div>;

    const render = () => {
        switch (route) {
            case 'auth': return <AuthScreen onBack={() => navigate('home')} showAlert={showAlert} initialIsLogin={routeParams.isLogin !== undefined ? routeParams.isLogin : true} />;
            case 'profile': return <ProfileScreen user={user} userData={userData} onBack={r => navigate(r || 'home')} showAlert={showAlert} />;
            case 'admin':
                if (userData?.role === 'admin') {
                    const AdminPanel = () => {
                        const [adminView, setAdminView] = useState('content');

                        return (
                            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
                                <button className="back-btn" onClick={() => navigate('home')}>Geri</button>
                                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginTop: 20 }}>
                                    <div style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 10, height: 'fit-content' }}>
                                        <h3 style={{ color: 'var(--gold)', fontSize: 14, marginBottom: 15, textAlign: 'center' }}>ADMIN MENU</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <button
                                                className={`hero-btn secondary ${adminView === 'dashboard' ? 'active' : ''}`}
                                                style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }}
                                                onClick={() => setAdminView('dashboard')}
                                            >
                                                Dashboard
                                            </button>
                                            <button
                                                className={`hero-btn secondary ${adminView === 'content' ? 'active' : ''}`}
                                                style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }}
                                                onClick={() => setAdminView('content')}
                                            >
                                                İçerik Yönetimi
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                                        {adminView === 'dashboard' ? (
                                            <AdminDashboard onBack={navigate} userData={userData} />
                                        ) : (
                                            <AdminScreen onBack={() => navigate('home')} showAlert={showAlert} userData={userData} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    };
                    return <AdminPanel />;
                }
                return <div className="loading">Yetkisiz erişim</div>;
            case 'editor':
                if (userData?.role === 'editor') return <EditorScreen onBack={navigate} showAlert={showAlert} userData={userData} />;
                return <div className="loading">Yetkisiz erişim</div>;
            case 'tipster':
                if (userData?.role === 'tipster') return <TipsterScreen onBack={navigate} showAlert={showAlert} userData={userData} />;
                return <div className="loading">Yetkisiz erişim</div>;
            case 'category': return <CategoryScreen category={routeParams} onBack={() => navigate('home')} />;
            case 'coupons': return <CouponScreen onBack={() => navigate('home')} showAlert={showAlert} />;
            case 'yapay-zeka-analizleri': return <OddsyKGAnaliz onBack={() => navigate('home')} />;
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
