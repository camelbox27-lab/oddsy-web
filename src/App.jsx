// Capacitor modülleri: sadece native Android'de dynamic import ile yüklenir
const isNative = () => typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
let CapApp = null;
let PushNotifications = null;
if (isNative()) {
    import('@capacitor/app').then(m => { CapApp = m.App; }).catch(() => {});
    import('@capacitor/push-notifications').then(m => { PushNotifications = m.PushNotifications; }).catch(() => {});
}
import {
    createUserWithEmailAndPassword,
    deleteUser,
    getIdTokenResult,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
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
    increment,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useState, useMemo, memo } from 'react';

import AuthAction from './pages/AuthAction';
import DroppingOddsModal from './components/DroppingOddsModal';
import ErrorBoundary from './components/ErrorBoundary';
import Kart from './components/Kart';
import Korner from './components/Korner';
import ManuelAnaliz from './components/ManuelAnaliz';
import YapayZeka from './components/YapayZeka';
import { auth, db, functions, rtdb } from './firebaseConfig';
import { ref as dbRef, set as dbSet } from 'firebase/database';
import GununSurprizleri from './GununSurprizleri';
import GununTercihleri from './GununTercihleri';
import IYMSTahminleri from './IYMSTahminleri';
import IlkYariGolListesi from './IlkYariGolListesi';
import { getTeamLogo, handleLogoError } from './helper';
import { getNextUserId, ensureUserDisplayId } from './utils/userId';
import { debounce, throttle, listenerRegistry, connectionMonitor } from './utils/performanceUtils';
import { dataCache } from './utils/cache';

const VIP_TRIAL_DAYS = 0;

// Firebase email action link ayarları — linke tıklayınca oddsy.com.tr/auth/action sayfası açılır
const AUTH_ACTION_SETTINGS = {
    url: 'https://oddsy.com.tr/auth/action',
    handleCodeInApp: false,
};
const VIP_ADMIN_DAYS = 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const IP_API_URL = 'https://api64.ipify.org?format=json';

const sanitizeIpForDocId = (ip = '') => ip.replace(/[^0-9a-zA-Z]/g, '_');

const getPublicIpAddress = async () => {
    const response = await fetch(IP_API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('IP bilgisi alınamadı.');
    const payload = await response.json();
    if (!payload?.ip) throw new Error('Geçersiz IP cevabı.');
    return payload.ip;
};

const reserveIpForUser = async (uid, providedIp = null) => {
    try {
        const ip = providedIp || await getPublicIpAddress();
        const ipDocId = sanitizeIpForDocId(ip);
        const ipRef = doc(db, 'ipRegistrations', ipDocId);
        // Bypassing IP block logic so users can register from the same network
        await setDoc(ipRef, {
            uid,
            ip,
            createdAt: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.warn('IP Registration warning (bypassed):', e);
    }
};

const parseDateSafe = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateTR = (value) => {
    const d = parseDateSafe(value);
    return d ? d.toLocaleDateString('tr-TR') : '-';
};

const getVipMeta = (userData) => {
    const start = parseDateSafe(userData?.vipStartAt);
    const end = parseDateSafe(userData?.vipEndAt);
    const now = new Date();
    const expired = !!end && now > end;
    const remainingDays = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / ONE_DAY_MS)) : null;
    const isVipActive = !!userData?.isVip && !expired;

    return {
        start,
        end,
        expired,
        remainingDays,
        isVipActive,
        startText: formatDateTR(userData?.vipStartAt),
        endText: formatDateTR(userData?.vipEndAt)
    };
};

const buildTrialVipFields = () => {
    if (VIP_TRIAL_DAYS <= 0) {
        return {
            isVip: false,
            vipTier: null,
            vipSource: null,
            vipTrialUsed: false,
            vipStartAt: null,
            vipEndAt: null,
            vipUpdatedAt: null
        };
    }
    const start = new Date();
    const end = new Date(start.getTime() + VIP_TRIAL_DAYS * ONE_DAY_MS);
    return {
        isVip: true,
        vipTier: 'gold',
        vipSource: 'trial',
        vipTrialUsed: true,
        vipStartAt: start.toISOString(),
        vipEndAt: end.toISOString(),
        vipUpdatedAt: start.toISOString()
    };
};


// STYLES
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@700;900&display=swap');

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
  --font-logo: 'Outfit', sans-serif;
}

/* Light Mode */
[data-theme="light"] {
  --bg-dark: #f5f5f5;
  --bg-card: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #333333;
  --border: #e0e0e0;
}

/* Theme Toggle Button */
.theme-toggle {
  background: rgba(255,255,255,0.1);
  border: 1px solid var(--gold);
  color: var(--gold);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
}
.theme-toggle:hover {
  background: var(--gold);
  color: var(--bg-dark);
  transform: rotate(180deg);
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(90deg, var(--bg-card) 25%, rgba(255,255,255,0.1) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 8px;
}
.skeleton-text { height: 16px; margin-bottom: 8px; }
.skeleton-text.short { width: 60%; }
.skeleton-text.medium { width: 80%; }
.skeleton-title { height: 24px; width: 70%; margin-bottom: 16px; }
.skeleton-avatar { width: 60px; height: 60px; border-radius: 50%; }
.skeleton-card { height: 200px; border-radius: 20px; }

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Ripple Effect */
.ripple {
  position: relative;
  overflow: hidden;
}
.ripple::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, var(--gold) 10%, transparent 10%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 0.5s;
}
.ripple:active::after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}

/* Page Transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.page-exit {
  opacity: 1;
  transform: translateY(0);
}
.page-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Fade In Animation */
.fade-in {
  animation: fadeIn 0.5s ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide In Animation */
.slide-in-left {
  animation: slideInLeft 0.4s ease forwards;
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

.slide-in-right {
  animation: slideInRight 0.4s ease forwards;
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Stagger Animation for Lists */
.stagger-item {
  opacity: 0;
  animation: fadeIn 0.4s ease forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0.05s; }
.stagger-item:nth-child(2) { animation-delay: 0.1s; }
.stagger-item:nth-child(3) { animation-delay: 0.15s; }
.stagger-item:nth-child(4) { animation-delay: 0.2s; }
.stagger-item:nth-child(5) { animation-delay: 0.25s; }
.stagger-item:nth-child(6) { animation-delay: 0.3s; }
.stagger-item:nth-child(7) { animation-delay: 0.35s; }
.stagger-item:nth-child(8) { animation-delay: 0.4s; }

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
  height: 85px;
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
  flex-direction: column;
  gap: 2px;
  flex: 1;
  justify-content: center;
  margin: 0 20px;
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.header-nav-item {
  padding: 6px 10px;
  color: var(--gold);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
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
  font-family: var(--font-logo);
  font-size: 32px;
  font-weight: 900;
  color: var(--gold);
  letter-spacing: 3px;
  cursor: pointer;
  text-transform: uppercase;
  background: linear-gradient(135deg, #FDB913 0%, #ffffff 25%, #FDB913 50%, #ffffff 75%, #FDB913 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(253, 185, 19, 0.3));
  animation: logoShine 4s linear infinite;
  transition: all 0.3s ease;
}

.logo:hover {
  filter: drop-shadow(0 0 20px rgba(253, 185, 19, 0.6));
  transform: scale(1.05);
  letter-spacing: 4px;
}

@keyframes logoShine {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
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

.main-content { padding-top: 85px; padding-bottom: 0; min-height: calc(100vh - 85px); background: var(--bg-dark); }

/* Bottom Navigation Bar */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 72px;
  background: #0a0a12;
  border-top: 1px solid rgba(255,215,0,0.18);
  z-index: 1100;
  align-items: center;
  justify-content: space-around;
  padding: 0 2px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.bottom-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 1;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,215,0,0.38);
  transition: color 0.15s;
  padding: 0;
  min-width: 0;
}
.bottom-nav-btn.active { color: #FFD700; }
.bottom-nav-btn-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
.bottom-nav-btn-icon svg { width: 26px; height: 26px; }
.bottom-nav-btn-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; color: inherit; }
.bottom-nav-center-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  padding-bottom: 2px;
}
.bottom-nav-center {
  width: 54px; height: 54px;
  border-radius: 50%;
  background: linear-gradient(145deg, #FFD700 0%, #c8960a 100%);
  color: #0a0a12;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer;
  box-shadow: 0 0 18px rgba(255,215,0,0.45), 0 0 0 2px rgba(255,215,0,0.2);
  transition: transform 0.15s;
  margin-top: -14px;
}
.bottom-nav-center:active { transform: scale(0.9); }
.bottom-nav-center-label { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,215,0,0.6); }

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
.hero-btn { padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 16px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; }
.hero-btn.primary { background: var(--primary-green); color: #fff; box-shadow: 0 4px 15px rgba(0, 106, 78, 0.4); border: 1px solid rgba(255,255,255,0.1); }
.hero-btn.secondary { background: rgba(51, 51, 51, 0.6); color: #fff; border: 2px solid var(--gold); backdrop-filter: blur(8px); }
.hero-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

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
    border: 1px solid rgba(255,255,255,0.05); /* Start with subtle border */
    border-radius: 8px;
    padding: 0;
    margin-bottom: 25px;
    background: #2e3335;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    overflow: hidden;
    /* Added for sizing and centering */
    max-width: 800px;
    margin: 0 auto 25px auto;
    transition: all 0.3s ease;
}

.coupon-card:hover {
    transform: translateY(-5px);
    box-shadow: 
        0 20px 50px rgba(0,0,0,0.6),
        inset 0 0 0 1px rgba(253, 185, 19, 0.3),
        0 0 30px rgba(253, 185, 19, 0.4);
    border-color: var(--gold);
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
    /* Removed flex: 1 to bring odds closer */
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    margin-right: 20px; /* Space between prediction and odds */
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

/* Unified Prediction Card Design - Standard for all menus */
.prediction-card {
    background: #2e3335 !important;
    border: 2px solid #006A4E !important;
    border-radius: 16px !important;
    padding: 18px !important;
    padding-top: 38px !important; /* Space for the top-left label */
    box-shadow: 
        0 10px 30px rgba(0,0,0,0.4),
        inset 0 0 0 1px rgba(0, 106, 78, 0.3),
        0 0 15px rgba(0, 106, 78, 0.2) !important;
    display: flex;
    flex-direction: column;
    min-height: 180px !important;
    height: auto !important;
    position: relative;
    max-width: 750px !important;
    margin: 12px auto !important;
    overflow: hidden;
    width: 100%;
    transition: all 0.3s ease;
}

.prediction-card:hover {
    transform: translateY(-3px);
    box-shadow: 
        0 20px 50px rgba(0,0,0,0.6),
        inset 0 0 0 1px rgba(253, 185, 19, 0.3),
        0 0 30px rgba(0, 106, 78, 0.4) !important;
    border-color: rgba(253, 185, 19, 0.6) !important;
}

@media (max-width: 768px) {
    .prediction-card {
        padding: 12px !important;
        padding-top: 30px !important;
        min-height: 150px !important;
        margin: 8px auto !important;
        border-width: 2px !important;
    }
    .premium-logo-large {
        width: 45px !important;
        height: 45px !important;
    }
    .premium-team-name-text {
        font-size: 13px !important;
    }
    .premium-header-teams {
        gap: 15px !important;
        margin-bottom: 12px !important;
        padding-bottom: 8px !important;
    }
    .premium-vs-divider {
        font-size: 16px !important;
    }
    .card-top-left-label {
        font-size: 10px !important;
        left: 12px !important;
        top: 8px !important;
    }
    .premium-badge-box {
        min-width: 70px !important;
        padding: 5px 10px !important;
    }
    .premium-badge-value {
        font-size: 13px !important;
    }
}

.card-top-left-label {
    position: absolute;
    top: 15px;
    left: 25px;
    font-size: 14px;
    font-weight: 900;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    z-index: 5;
}

/* Menu Selection Cards (Tipsters, Kart/Korner choices etc.) */
.menu-selection-card {
    background: #2e3335;
    border: 2px solid #006A4E;
    border-radius: 16px;
    padding: 22px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    max-width: 750px !important;
    width: 100%;
    min-height: 220px !important;
    height: auto !important;
    margin: 15px auto;
    position: relative;
    box-shadow: 
        0 10px 30px rgba(0,0,0,0.4),
        inset 0 0 0 1px rgba(0, 106, 78, 0.3),
        0 0 15px rgba(0, 106, 78, 0.2);
}
.menu-selection-card:hover {
    transform: translateY(-5px);
    box-shadow: 
        0 20px 50px rgba(0,0,0,0.6),
        inset 0 0 0 1px rgba(253, 185, 19, 0.3),
        0 0 30px rgba(253, 185, 19, 0.4);
    border-color: var(--gold);
}

.tipster-stats-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 106, 78, 0.2);
    border: 1px solid #006A4E;
    color: #fff;
    padding: 8px 15px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 10;
}

.tipster-stats-btn:hover {
    background: #006A4E;
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 106, 78, 0.4);
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.stats-modal {
    background: #2e3335;
    border: 3px solid #006A4E;
    border-radius: 30px;
    padding: 40px;
    width: 100%;
    max-width: 500px;
    position: relative;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 30px rgba(0, 106, 78, 0.2);
    animation: modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modalPop {
    from { opacity: 0; transform: scale(0.8) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255,255,255,0.05);
    border: none;
    color: #fff;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.modal-close-btn:hover {
    background: #dc2626;
    transform: rotate(90deg);
}

.stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.stat-label {
    color: #ccc;
    font-size: 14px;
    font-weight: 600;
    min-width: 110px;
}

.stat-value {
    font-weight: 800;
}

.stat-bar-container {
    height: 10px;
    background: rgba(255,255,255,0.05);
    border-radius: 5px;
    overflow: hidden;
    position: relative;
}

.stat-bar {
    height: 100%;
    border-radius: 5px;
    transition: width 1s ease-out;
}

.premium-header-teams {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.premium-team-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.premium-logo-large {
    width: 80px;
    height: 80px;
    object-fit: contain;
    filter: drop-shadow(0 0 10px rgba(0, 106, 78, 0.4));
}

.premium-team-name-text {
    font-size: 18px;
    font-weight: 800;
    color: #ffffff;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.premium-vs-divider {
    font-size: 24px;
    font-weight: 900;
    color: var(--gold);
    opacity: 0.9;
    text-shadow: 0 0 15px rgba(253, 185, 19, 0.3);
}

.premium-analysis-container {
    padding: 0 10px;
    margin-bottom: 80px;
}

.premium-analysis-text {
    font-size: 16px;
    line-height: 1.8;
    color: #e0e0e0;
    text-align: justify;
}

.premium-bottom-right-info {
    position: absolute;
    bottom: 25px;
    right: 30px;
    display: flex;
    gap: 15px;
}

.premium-badge-box {
    border: 1px solid #10B981;
    padding: 8px 20px;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 100px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.admin-actions-premium {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    gap: 6px;
    z-index: 10;
}

.premium-badge-label {
    font-size: 9px;
    color: #aaa;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 2px;
}

.premium-badge-value {
    font-size: 16px;
    font-weight: 900;
    color: #ffffff;
}

.premium-badge-value.gold { color: var(--gold); }
.premium-badge-value.green { color: #10B981; }

.premium-badge-icon {
    position: absolute;
    top: 15px;
    right: 15px;
    color: var(--gold);
    font-size: 20px;
    filter: drop-shadow(0 0 5px var(--gold));
    animation: pulse-gold 2s infinite;
}

.card-header-overlay {
    position: absolute;
    top: 15px;
    right: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.league-badge-standard {
    background: rgba(0,0,0,0.3);
    color: var(--gold);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
}

@keyframes pulse-gold {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
}

.alert { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 12px 25px; border-radius: 10px; font-size: 14px; font-weight: 700; z-index: 2000; }
.alert.success { background: var(--success); color: var(--primary-green-dark); }
.alert.error { background: var(--error); color: #fff; }


/* Tablet Breakpoint */
@media (max-width: 1024px) and (min-width: 769px) {
  .header-nav { gap: 3px; }
  .header-nav-item { font-size: 9px; padding: 5px 8px; }
  .hero-title { font-size: 32px; }
  .hero-subtitle { font-size: 14px; }
  .prediction-card { max-width: 95% !important; }
  .predictions-list { padding: 15px; }
  .premium-header-teams { gap: 25px; }
  .premium-logo-large { width: 60px; height: 60px; }
}

/* Mobile Breakpoint */
@media (max-width: 768px) {
  .header-nav { display: none; }
  .menu-btn { display: none !important; }
  .bottom-nav { display: flex; }
  .main-content { padding-bottom: 70px; }
  .hero-title { font-size: 30px; padding: 0 10px; }
  .hero-subtitle { font-size: 14px; padding: 0 20px; }
  .logo { font-size: 24px; }
  .features-section { grid-template-columns: 1fr; }
  .hero-buttons {
    flex-direction: column !important;
    width: 100%;
    padding: 0 20px;
    gap: 12px !important;
  }
  .hero-btn { width: 100%; }
}

/* Landscape Mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .hero-section { 
    height: auto; 
    min-height: 100vh; 
    padding: 80px 20px 40px;
  }
  .hero-title { font-size: 24px; margin-bottom: 10px; }
  .hero-subtitle { font-size: 12px; margin-bottom: 15px; }
  .hero-buttons { flex-direction: row !important; gap: 10px !important; }
  .hero-btn { padding: 10px 20px; font-size: 12px; }
  .header { height: 50px; }
  .main-content { padding-top: 50px; }
  .prediction-card { 
    min-height: 150px !important; 
    padding: 15px !important; 
    padding-top: 35px !important;
  }
  .premium-logo-large { width: 45px; height: 45px; }
  .premium-team-name-text { font-size: 12px; }
}

/* Small Mobile */
@media (max-width: 380px) {
  .logo { font-size: 20px; letter-spacing: 1px; }
  .profile-btn { padding: 5px 10px; font-size: 12px; }
  .hero-title { font-size: 26px; }
  .prediction-card { padding: 12px !important; padding-top: 30px !important; }
}

/* Mobile App Banner - sadece mobilde göster */
.mobile-app-banner { display: flex !important; }
@media (min-width: 769px) {
  .mobile-app-banner { display: none !important; }
}
/* Banner açıkken header ve content aşağı kayar - sadece mobilde */
@media (max-width: 768px) {
  .app.banner-visible .header { top: 45px; }
  .app.banner-visible .main-content { padding-top: calc(85px + 45px); }
}

/* Admin Action Buttons */
.admin-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.1);
  justify-content: center;
}

.admin-btn {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 800;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-transform: uppercase;
}

.admin-btn.delete { background: #ff4d4d; color: white; }
.admin-btn.won { background: #00c853; color: white; }
.admin-btn.lost { background: #ff1744; color: white; }
.admin-btn:hover { opacity: 0.8; transform: scale(1.05); }

/* Admin Panel Mobile Responsive */
@media (max-width: 768px) {
  .admin-dashboard-stats {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
  }
  .admin-dashboard-stats > div {
    padding: 12px !important;
  }
  .admin-dashboard-stats .stat-number {
    font-size: 22px !important;
  }
  .admin-category-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px !important;
  }
  .admin-category-grid > div {
    padding: 10px !important;
  }
  .admin-user-table th,
  .admin-user-table td {
    padding: 6px 4px !important;
    font-size: 10px !important;
  }
  .admin-user-table .admin-col-hide-mobile {
    display: none !important;
  }
  .admin-tab-buttons {
    gap: 4px !important;
  }
  .admin-tab-buttons button {
    font-size: 10px !important;
    padding: 8px 10px !important;
  }
  .admin-content-grid {
    grid-template-columns: 1fr !important;
  }
  .admin-content-grid .admin-sidebar-buttons {
    flex-direction: row !important;
    flex-wrap: wrap !important;
  }
  .admin-content-grid .admin-sidebar-buttons button {
    flex: 1 !important;
    min-width: 80px !important;
  }
  .admin-form-grid {
    grid-template-columns: 1fr !important;
  }
  .admin-route-wrapper {
    padding: 10px !important;
  }
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
    { id: 'cat_ai_new', title: "YAPAY ZEKA ANALİZ BOTU", key: 10, icon: '🤖', color: "#FFD700", route: 'yapay-zeka-analizleri' },
    { id: 'cat_manuel_analiz', title: "MANUEL ANALİZ YAP", key: 33, icon: '✏️', color: "#FFD700", route: 'manuel-analiz' },
    { id: 'cat_1', title: "ILK YARI GOL LISTESI", key: 0, icon: '⚽', color: "#10B981", route: 'ilk-yari-gol' },
    { id: 'cat_coupons_new', title: "GÜNÜN KUPONLARI", key: 20, icon: '🎫', color: "#f87171", route: 'coupons' },
    { id: 'cat_kart_analiz', title: "KART ANALİZ BOTU", key: 31, icon: '🟨', color: "#FFD700", route: 'kart-analizi' },
    { id: 'cat_korner_analiz', title: "KORNER ANALİZ BOTU", key: 32, icon: '🚩', color: "#10B981", route: 'korner-analizi' },

    { id: 'cat_5', title: "GUNUN TERCIHLERI", key: 4, icon: '⭐', color: "#4ade80", route: 'gunun-tercihleri' },
    { id: 'cat_7', title: "SURPRIZLER", key: 6, icon: '💥', color: "#fb7185", route: 'gunun-surprizleri' },
    { id: 'cat_8', title: "IY / MS TAHMINLERI", key: 7, icon: '🔄', color: "#FFD700", route: 'iy-ms-tahminleri' },
    { id: 'cat_9', title: "EDITORUN SECIMI", key: 8, icon: '✍️', color: "#4ade80", route: 'category' }
];

const COUPON_TYPES = [
    { id: 'banko', name: 'Banko Kupon', dbName: 'Günün Banko Kuponu', color: 'var(--gold)', image: 'https://i.ibb.co/3mb3dcx0/banko.png', desc: 'Günün en güvenilir tahminleri' },
    { id: 'ideal', name: 'İdeal Kupon', dbName: 'Günün İdeal Kuponu', color: '#4ade80', image: 'https://i.ibb.co/LFNHb81/ideal.png', desc: 'Dengeli oran ve güven kombinasyonu' },
    { id: 'surpriz', name: 'Sürpriz Kupon', dbName: 'Günün Sürpriz Kuponu', color: '#f87171', image: 'https://i.ibb.co/JFWTPs0y/s-priz.png', desc: 'Yüksek oranlı cesur tahminler' }
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
    }, []);
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

function Header({ onMenuOpen, user, onProfileClick, onNavigate, currentCategory, theme, onThemeToggle }) {
    const topRowCategories = [
        { id: 'cat_2', title: "İLK YARI GOL LİSTESİ", key: 0, route: 'category' },
        { id: 'cat_8_new', title: "İY / MS TAHMİNLERİ", key: 7, route: 'iy-ms-tahminleri' },
        { id: 'cat_coupons', title: "GÜNÜN KUPONLARI", key: 20, route: 'coupons' },
        { id: 'cat_6', title: "GÜNÜN TERCİHLERİ", key: 4, route: 'category' },
        { id: 'cat_7', title: "GÜNÜN SÜRPRİZLERİ", key: 6, route: 'category' },
        { id: 'cat_8', title: "EDİTÖRÜN SEÇİMİ", key: 8, route: 'category' },
        { id: 'cat_dropping', title: "ORANI DÜŞEN MAÇLAR", key: 99, route: 'dropping-odds' },
    ];

    const bottomRowCategories = [
        { id: 'cat_ai_new', title: "YAPAY ZEKA ANALİZLERİ", key: 10, route: 'yapay-zeka-analizleri' },
        { id: 'cat_manuel_analiz_top', title: "MANUEL ANALİZ", key: 33, route: 'manuel-analiz' },
        { id: 'cat_kart_analiz_top', title: "KART ANALİZİ", key: 31, route: 'kart-analizi' },
        { id: 'cat_korner_analiz_top', title: "KORNER ANALİZİ", key: 32, route: 'korner-analizi' },
    ];

    const handleCategoryClick = (cat) => {
        if (['coupons', 'yapay-zeka-analizleri', 'manuel-analiz', 'kart-analizi', 'korner-analizi', 'iy-ms-tahminleri', 'ilk-yari-gol', 'dropping-odds', 'abonelik'].includes(cat.route)) {
            onNavigate(cat.route, cat);
        } else {
            const menuItem = MENU_ITEMS.find(m => m.key === cat.key);
            onNavigate(menuItem?.route || 'category', menuItem);
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn" onClick={onMenuOpen}>{Icons.menu}</button>
                <div className="logo" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>ODDSY</div>
            </div>
            <nav className="header-nav">
                <div className="nav-row">
                    {topRowCategories.map(cat => (
                        <div
                            key={cat.id}
                            className={`header-nav-item ripple ${currentCategory === cat.key ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                        >
                            {cat.title}
                        </div>
                    ))}
                </div>
                <div className="nav-row">
                    {bottomRowCategories.map(cat => (
                        <div
                            key={cat.id}
                            className={`header-nav-item ripple ${currentCategory === cat.key ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                        >
                            {cat.title}
                        </div>
                    ))}
                    <div
                        className="header-nav-item ripple"
                        onClick={() => onNavigate('abonelik')}
                        style={{
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            color: '#000',
                            border: '1px solid #FFD700',
                            fontWeight: 800
                        }}
                    >
                        👑 ODDSY VIP
                    </div>
                </div>
            </nav>
            <div className="header-right">
                <button
                    className="theme-toggle"
                    onClick={onThemeToggle}
                    title={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <button className="profile-btn ripple" onClick={onProfileClick}>
                    {Icons.user}
                    <span>{user ? 'Hesabım' : 'Giriş'}</span>
                </button>
            </div>
        </header>
    );
}

function Sidebar({ isOpen, onClose, onNavigate, currentRoute, userData }) {
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
                            <span className="sidebar-item-text">{item.title}{item.vipOnly && !userData?.isVip && userData?.role !== 'admin' ? ' 🔒' : ''}</span>
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
                    <div className={`sidebar-item ${currentRoute === 'abonelik' ? 'active' : ''}`} onClick={() => { onNavigate('abonelik'); onClose(); }}>
                        <span className="sidebar-item-icon">👑</span>
                        <span className="sidebar-item-text">Abonelik Planları</span>
                    </div>
                    {userData?.role === 'admin' && (
                        <div className={`sidebar-item ${currentRoute === 'admin' ? 'active' : ''}`} onClick={() => { onNavigate('admin'); onClose(); }}>
                            <span className="sidebar-item-icon">{Icons.admin}</span>
                            <span className="sidebar-item-text">Admin Paneli</span>
                        </div>
                    )}
                    {userData?.role === 'editor' && (
                        <div className={`sidebar-item ${currentRoute === 'editor' ? 'active' : ''}`} onClick={() => { onNavigate('editor'); onClose(); }}>
                            <span className="sidebar-item-icon">{Icons.pen}</span>
                            <span className="sidebar-item-text">Editör Paneli</span>
                        </div>
                    )}
                    {userData?.role === 'moderator' && (
                        <div className={`sidebar-item ${currentRoute === 'moderator' ? 'active' : ''}`} onClick={() => { onNavigate('moderator'); onClose(); }}>
                            <span className="sidebar-item-icon">🛡️</span>
                            <span className="sidebar-item-text">Moderatör Paneli</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}



const NAV_ICONS = {
    kupon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5H3a1 1 0 0 0-1 1v4a1 1 0 0 1 0 2v4a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-4a1 1 0 0 1 0-2V6a1 1 0 0 0-1-1zm-1 6.5a2.5 2.5 0 0 0 0 3V15H4v-.5a2.5 2.5 0 0 0 0-3V7h16v.5z"/>
            <circle cx="12" cy="12" r="1.5"/>
            <path d="M9 9h1v6H9zM14 9h1v6h-1z" opacity="0.6"/>
        </svg>
    ),
    iygol: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="3" width="20" height="18" rx="2" opacity="0.15"/>
            <path d="M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M2 8h20M2 16h20M8 5v14M16 5v14" stroke="currentColor" strokeWidth="1.4" opacity="0.7"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
        </svg>
    ),
    yzeka: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="8" y="8" width="8" height="8" rx="1.5" opacity="0.9"/>
            <line x1="8" y1="2" x2="8" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="16" y1="2" x2="16" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="8" y1="19" x2="8" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="16" y1="19" x2="16" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="2" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="2" y1="16" x2="5" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="19" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="19" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    ),
    editor: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            <path d="M15 13l4 4" stroke="#0a0a12" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
            <circle cx="17" cy="17" r="3" fill="currentColor" opacity="0.9"/>
            <path d="M16 17h2M17 16v2" stroke="#0a0a12" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
    ),
    menu: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#0a0a12" strokeWidth="2.3" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="17" x2="14" y2="17"/>
        </svg>
    ),
};

function BottomNav({ onNavigate, onMenuOpen, currentRoute }) {
    const items = [
        { icon: NAV_ICONS.kupon,  label: 'Kuponlar', route: 'coupons' },
        { icon: NAV_ICONS.iygol,  label: 'İY Gol',   route: 'ilk-yari-gol' },
        null,
        { icon: NAV_ICONS.yzeka,  label: 'Y. Zeka',  route: 'yapay-zeka-analizleri' },
        { icon: NAV_ICONS.editor, label: 'Editör',   route: 'manuel-analiz' },
    ];
    return (
        <nav className="bottom-nav">
            {items.map((item, i) =>
                item === null ? (
                    <div key="menu" className="bottom-nav-center-wrap">
                        <button className="bottom-nav-center" onClick={onMenuOpen}>
                            {NAV_ICONS.menu}
                        </button>
                        <span className="bottom-nav-center-label">Bülten</span>
                    </div>
                ) : (
                    <button
                        key={item.route}
                        className={`bottom-nav-btn${currentRoute === item.route ? ' active' : ''}`}
                        onClick={() => onNavigate(item.route)}
                    >
                        <span className="bottom-nav-btn-icon">{item.icon}</span>
                        <span className="bottom-nav-btn-label">{item.label}</span>
                    </button>
                )
            )}
        </nav>
    );
}

function HomePage({ onLoginClick, onNavigate, onShowLegal, user, userData }) {

    return (
        <div className="home-page" style={{ position: 'relative', minHeight: '100vh' }}>
            <div className="hero-section">
                <div className="hero-content" style={{ paddingTop: '160px' }}>
                    <h1 className="hero-title">Oddsy ile Akıllı Futbol Tahminleri</h1>
                    <p className="hero-subtitle">Yapay zeka oran analiz sistemiyle güçlendirilmiş, günün öne çıkan karşılaşmalarını sizin için sadeleştiren yeni nesil tahmin platformu.</p>
                    <div className="hero-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {user ? (
                            <div style={{ padding: '8px 20px', background: 'rgba(0,0,0,0.6)', borderRadius: '15px', border: '1px solid var(--gold)', backdropFilter: 'blur(10px)' }}>
                                <h2 style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '18px', margin: 0 }}>
                                    Hoş geldin, {userData?.username || user.displayName || 'Kullanıcı'}
                                </h2>
                            </div>
                        ) : (
                            <>
                                <button className="hero-btn primary" onClick={() => onNavigate('auth', { isLogin: false })}>Hemen Başla</button>
                                <button className="hero-btn secondary" onClick={onLoginClick}>Giriş Yap</button>
                            </>
                        )}
                    </div>
                    {/* Store Download Buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
                        <a
                            href="https://github.com/camelbox27-lab/oddsy-web/releases/download/v1.0/Oddsy.apk"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.75)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '9px 18px', textDecoration: 'none', backdropFilter: 'blur(10px)' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3.18 23a1 1 0 0 1-.68-1.71L15.29 8.5l-2.83-2.83L3.5 14.63a1 1 0 1 1-1.41-1.41L12.46 2.84a1 1 0 0 1 1.41 0l4.24 4.24a1 1 0 0 1 0 1.41L3.86 22.74A1 1 0 0 1 3.18 23z" fill="#ea4335"/>
                                <path d="M2.5 2.09v19.82L14.09 12 2.5 2.09z" fill="#4285f4"/>
                                <path d="M2.5 2.09L14.09 12l3.54-3.54-12-6.91a1 1 0 0 0-3.13.54z" fill="#34a853"/>
                                <path d="M2.5 21.91l12-6.91-3.54-3.54L2.5 21.91z" fill="#fbbc05"/>
                            </svg>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', lineHeight: 1 }}>MOBİL UYGULAMA İNDİR</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>Google Play</div>
                            </div>
                        </a>
                        <button
                            onClick={() => showAlert('App Store yakında sizlerle! 🍎', 'info')}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.75)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '9px 18px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', lineHeight: 1 }}>ÇOK YAKINDA</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>App Store</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="analysis-section" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: '100px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 className="analysis-title">Oddsy Günün Analizi</h2>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="analysis-btn" onClick={() => onNavigate('category', MENU_ITEMS?.find(m => m.key === 8))}>Özel Analizleri Görüntüle</button>
                        <button className="analysis-btn" onClick={() => onNavigate('performance-summary')} style={{ background: 'linear-gradient(135deg, #4ade80, #10B981)', color: '#000' }}>Tahmin Sonuçları</button>
                    </div>
                </div>
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
                        <a className="footer-link" style={{ cursor: 'pointer' }} onClick={() => onShowLegal('about')}>Hakkında</a>
                        <a className="footer-link" style={{ cursor: 'pointer' }} onClick={() => onShowLegal('kvkk')}>KVKK Aydınlatma</a>
                        <a className="footer-link" style={{ cursor: 'pointer' }} onClick={() => onShowLegal('privacy')}>Gizlilik Politikası</a>
                        <a className="footer-link" style={{ cursor: 'pointer' }} onClick={() => onShowLegal('terms')}>Kullanım Koşulları</a>
                    </div>
                    <div className="footer-col">
                        <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 15 }}>Yardım</h4>
                        <a className="footer-link" style={{ cursor: 'pointer' }} onClick={() => onShowLegal('support')}>Destek ve Yardım</a>
                        <a className="footer-link" style={{ cursor: 'pointer' }} onClick={() => onShowLegal('responsibility')}>Sorumluluk Beyanı</a>
                        <a className="footer-link" style={{ cursor: 'pointer' }} onClick={() => onShowLegal('warning18')}>+18 Uyarı</a>
                    </div>
                </div>
                <div className="footer-divider" />
                <div className="footer-bottom">
                    <p className="copyright">© 2025 ODDSY. Tüm hakları saklıdır. oddsydestek@gmail.com</p>
                </div>
            </footer>

        </div >
    );
}

function AuthScreen({ onBack, showAlert, initialIsLogin = true }) {
    const [mode, setMode] = useState(initialIsLogin ? 'login' : 'register'); // login, register, forgot, verify
    const [loginIdentifier, setLoginIdentifier] = useState(''); // kullanıcı adı veya email
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const resolveEmail = async (identifier) => {
        const trimmed = identifier.trim();
        if (trimmed.includes('@')) return trimmed;
        const q = query(collection(db, 'users'), where('username', '==', trimmed));
        const snap = await getDocs(q);
        if (snap.empty) {
            const qLower = query(collection(db, 'users'), where('username', '==', trimmed.toLowerCase()));
            const snapLower = await getDocs(qLower);
            if (snapLower.empty) throw new Error('Bu kullanıcı adı ile kayıtlı hesap bulunamadı.');
            return snapLower.docs[0].data().email;
        }
        return snap.docs[0].data().email;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (mode === 'forgot') {
            if (!loginIdentifier.trim()) return showAlert('Lütfen kullanıcı adınızı veya email adresinizi girin.', 'error');
            setLoading(true);
            try {
                const resolvedEmail = await resolveEmail(loginIdentifier);
                await sendPasswordResetEmail(auth, resolvedEmail, AUTH_ACTION_SETTINGS);
                showAlert('Şifre sıfırlama linki e-posta adresinize gönderildi.', 'success');
                setMode('login');
            } catch (err) {
                showAlert('Hata: ' + err.message, 'error');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (mode === 'login') {
            if (!loginIdentifier.trim() || !password) return showAlert('Lütfen bilgileri eksiksiz girin.', 'error');
        } else {
            if (!email.trim() || !password) return showAlert('Lütfen bilgileri eksiksiz girin.', 'error');
        }
        if (mode === 'register' && !username.trim()) return showAlert('Kullanıcı adı boş olamaz.', 'error');
        if (mode === 'register' && username.trim().length < 3) return showAlert('Kullanıcı adı en az 3 karakter olmalıdır.', 'error');
        if (password.length < 6) return showAlert('Şifre en az 6 karakter olmalıdır.', 'error');

        setLoading(true);
        try {
            if (mode === 'login') {
                const resolvedEmail = await resolveEmail(loginIdentifier);
                const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, password);

                // Sunucudan taze emailVerified state'i çek (verification başka tab/cihazda yapıldıysa stale olabilir)
                try { await userCredential.user.reload(); } catch (_) {}

                if (!userCredential.user.emailVerified) {
                    await sendEmailVerification(userCredential.user, AUTH_ACTION_SETTINGS);
                    await signOut(auth);
                    showAlert('Email adresiniz henüz doğrulanmamış. Yeni bir doğrulama linki gönderildi.', 'error');
                    setEmail(resolvedEmail);
                    setMode('verify');
                    return;
                }
                showAlert('Giriş başarılı!', 'success');
                onBack();
            } else if (mode === 'register') {
                const cleanEmail = email.trim();
                // Kayıt İşlemi
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                const newUser = userCredential.user;
                const registerIp = await getPublicIpAddress();

                try {
                    await reserveIpForUser(newUser.uid, registerIp);
                } catch (ipErr) {
                    try { await deleteUser(newUser); } catch (delErr) { console.error('IP engeli sonrası kullanıcı silinemedi:', delErr); }
                    try { await signOut(auth); } catch (outErr) { console.error('IP engeli sonrası çıkış yapılamadı:', outErr); }
                    throw ipErr;
                }

                // Profil güncelleme
                try { await updateProfile(newUser, { displayName: username.trim() }); } catch (e) { console.error('Profile update failed:', e); }

                // Doğrulama maili gönder
                try { await sendEmailVerification(newUser, AUTH_ACTION_SETTINGS); } catch (e) { console.error('Email verification send failed:', e); }

                // Firestore dökümanını oluştur - hata olursa bile kayıt devam etsin
                let nextDisplayId = null;
                try {
                    nextDisplayId = await getNextUserId();
                } catch (idErr) {
                    console.error('DisplayId oluşturulamadı:', idErr);
                    nextDisplayId = Math.floor(20260000 + Math.random() * 9999);
                }

                try {
                    const trialVip = buildTrialVipFields();
                    await setDoc(doc(db, "users", newUser.uid), {
                        email: newUser.email,
                        registerIp,
                        username: username.trim(),
                        uid: newUser.uid,
                        displayId: nextDisplayId,
                        createdAt: serverTimestamp(),
                        isAdmin: false,
                        isPremium: false,
                        role: 'user',
                        ...trialVip
                    });
                } catch (firestoreErr) {
                    console.error('Firestore user doc oluşturulamadı:', firestoreErr);
                    // Firestore hatası olsa bile kayıt başarılı sayılır - onAuthStateChanged'de tekrar denenecek
                }

                // ÖNEMLİ: Firebase kayıt sonrası otomatik giriş yapar.
                // Biz bunu istemiyoruz çünkü email doğrulanmadı.
                await signOut(auth);

                showAlert('Kayıt işlemi başarılı. Lütfen e-posta adresinize gönderilen link ile hesabınızı doğrulayın.', 'success');
                setMode('verify');
                setPassword('');
            }
        } catch (err) {
            console.error('Firebase Auth Hatası:', err.code, err.message);
            let msg = 'İşlem sırasında bir hata oluştu.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') msg = 'Kullanıcı adı/email veya şifre hatalı. Kayıtlı değilseniz önce Kaydolun.';
            else if (err.code === 'auth/email-already-in-use') msg = 'Bu email zaten kullanımda.';
            else if (err.code === 'auth/weak-password') msg = 'Şifre çok zayıf.';
            else msg = err.message;
            showAlert(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!loginIdentifier.trim()) return showAlert('Lütfen kullanıcı adınızı veya e-posta adresinizi girin.', 'error');
        setLoading(true);
        try {
            const resolvedEmail = await resolveEmail(loginIdentifier);
            await sendPasswordResetEmail(auth, resolvedEmail);
            showAlert('Şifre sıfırlama linki e-posta adresinize gönderildi.', 'success');
            setShowForgotPassword(false);
        } catch (err) {
            showAlert('Hata: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === 'login';

    // Email Doğrulama Ekranı
    if (mode === 'verify') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{
                            fontSize: '60px',
                            marginBottom: '20px',
                            animation: 'pulse 2s infinite'
                        }}>
                            📧
                        </div>
                        <h2 style={{ color: 'var(--gold)', marginBottom: '15px' }}>
                            Email Doğrulama Gerekli
                        </h2>
                        <p style={{ color: '#aaa', marginBottom: '20px', lineHeight: '1.6' }}>
                            <strong style={{ color: '#fff' }}>{email}</strong> adresine bir doğrulama linki gönderdik.
                        </p>
                        <p style={{ color: '#aaa', marginBottom: '25px', lineHeight: '1.6' }}>
                            Lütfen email kutunuzu kontrol edin ve gelen linke tıklayarak hesabınızı doğrulayın.
                        </p>

                        <div style={{
                            background: 'rgba(255, 193, 7, 0.1)',
                            border: '1px solid var(--gold)',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ color: 'var(--gold)', fontSize: '13px', margin: 0 }}>
                                ⚠️ Email'i göremiyorsanız spam/gereksiz klasörünü de kontrol edin.
                            </p>
                        </div>

                        <button
                            className="submit-btn"
                            onClick={() => {
                                setMode('login');
                                showAlert('Email adresinizi doğruladıktan sonra giriş yapabilirsiniz.', 'success');
                            }}
                            style={{
                                marginBottom: '10px',
                                width: '100%',
                                background: 'linear-gradient(135deg, #28a745, #20c997)'
                            }}
                        >
                            ✅ Doğruladım, Giriş Yapmak İstiyorum
                        </button>

                        <button
                            className="back-btn"
                            onClick={onBack}
                            style={{ marginTop: '10px' }}
                        >
                            ← Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                `}</style>
            </div>
        );
    }

    if (showForgotPassword) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <button className="back-btn" onClick={() => setShowForgotPassword(false)}>{Icons.back} Geri</button>
                    <h1 style={{ marginBottom: 20 }}>Şifremi Unuttum</h1>
                    <form onSubmit={handleForgotPassword}>
                        <div className="form-group">
                            <label className="form-label">Kullanıcı Adı veya E-Posta</label>
                            <input className="form-input" type="text" autoCapitalize="none" autoCorrect="off" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} placeholder="Kullanıcı adı veya e-posta" />
                        </div>
                        <button className="submit-btn" disabled={loading}>{loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}</button>
                    </form>
                    <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#aaa' }}>
                        Şifrenizi hatırladınız mı?
                        <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 700, marginLeft: 5 }} onClick={() => setShowForgotPassword(false)}>
                            Giriş Yap
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <button className="back-btn" onClick={onBack}>{Icons.back} Geri</button>
                <h1 style={{ marginBottom: 20 }}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</h1>
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Kullanıcı Adı</label>
                            <input className="form-input" type="text" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Kullanıcı adınızı girin" />
                        </div>
                    )}
                    {isLogin ? (
                        <div className="form-group">
                            <label className="form-label">Kullanıcı Adı veya E-Posta</label>
                            <input className="form-input" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} placeholder="Kullanıcı adı veya e-posta" />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label">E-Posta</label>
                            <input className="form-input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <input className="form-input" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" />
                    </div>
                    <button
                        className="submit-btn"
                        disabled={loading}
                        style={{ background: isLogin ? 'var(--gold)' : '#28a745', color: isLogin ? '#000' : '#fff' }}
                    >
                        {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Hemen Kayıt Ol')}
                    </button>
                </form>
                {isLogin && (
                    <p style={{ marginTop: 15, textAlign: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setShowForgotPassword(true)}>
                            Şifremi Unuttum
                        </span>
                    </p>
                )}
                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#aaa' }}>
                    {isLogin ? 'Hesabınız yok mu? ' : 'Zaten üye misiniz? '}
                    <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setMode(isLogin ? 'register' : 'login')}>
                        {isLogin ? 'Kaydol' : 'Giriş Yap'}
                    </span>
                </p>
            </div>
        </div>
    );
}

function ProfileScreen({ user, userData, onBack, showAlert }) {
    const [resending, setResending] = useState(false);
    const [notifStatus, setNotifStatus] = useState(null); // 'enabled' | 'disabled' | 'loading'

    const handleEnableNotifications = async () => {
        if (!isNative() || !PushNotifications) {
            showAlert('Bu özellik sadece Android uygulamasında kullanılabilir.', 'info');
            return;
        }
        setNotifStatus('loading');
        try {
            const permResult = await PushNotifications.requestPermissions();
            if (permResult.receive === 'granted') {
                await PushNotifications.register();
                const regListener = await PushNotifications.addListener('registration', async (token) => {
                    try {
                        await updateDoc(doc(db, 'users', user.uid), { fcmToken: token.value });
                        await dbSet(dbRef(rtdb, 'fcmTokens/' + user.uid), token.value);
                        regListener.remove();
                    } catch (_) {}
                });
                setNotifStatus('enabled');
                showAlert('Bildirimler etkinleştirildi!', 'success');
            } else {
                setNotifStatus('disabled');
                showAlert('Bildirim izni verilmedi. Ayarlardan etkinleştirebilirsiniz.', 'error');
            }
        } catch (err) {
            setNotifStatus('disabled');
            showAlert('Hata: ' + err.message, 'error');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            showAlert('Başarıyla çıkış yapıldı.', 'success');
            onBack('home');
        } catch (err) {
            showAlert('Çıkış yapılırken bir hata oluştu.', 'error');
        }
    };

    const handleResendVerification = async () => {
        if (resending) return;
        setResending(true);
        try {
            await sendEmailVerification(auth.currentUser, AUTH_ACTION_SETTINGS);
            showAlert('Doğrulama linki tekrar gönderildi. Lütfen mailinizi kontrol edin.', 'success');
        } catch (err) {
            showAlert('Hata: ' + err.message, 'error');
        } finally {
            setResending(false);
        }
    };

    if (!user) return <div className="loading">Lütfen giriş yapın.</div>;

    const vipMeta = getVipMeta(userData);

    return (
        <div className="profile-container">
            <button className="back-btn" onClick={() => onBack('home')}>{Icons.back} Geri</button>
            <div className="profile-avatar">{Icons.user}</div>
            <h2 style={{ textAlign: 'center', marginBottom: 10 }}>{userData?.username || 'Kullanıcı'}</h2>
            <p style={{ textAlign: 'center', color: 'var(--gold)', fontSize: '18px', fontWeight: '800', marginBottom: 30, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>
                KULLANICI ID: {userData?.displayId || 'Atanıyor...'}
            </p>

            <div className="profile-row"><span>E-posta</span><span>{user.email}</span></div>
            <div className="profile-row">
                <span>Doğrulama</span>
                <span style={{ color: user.emailVerified ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>
                    {user.emailVerified ? 'Doğrulandı ✓' : 'Doğrulanmadı ✗'}
                </span>
            </div>
            {!user.emailVerified && (
                <button
                    className="submit-btn"
                    style={{ marginTop: 10, background: 'rgba(248, 113, 113, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '11px', padding: '8px' }}
                    onClick={handleResendVerification}
                    disabled={resending}
                >
                    {resending ? 'Gönderiliyor...' : 'Doğrulama Linkini Tekrar Gönder'}
                </button>
            )}

            <div className="profile-row"><span>Üyelik</span><span style={{ color: vipMeta.isVipActive ? (userData?.vipTier === 'platinum' ? '#B0C4DE' : userData?.vipTier === 'silver' ? '#C0C0C0' : 'var(--gold)') : '#aaa', fontWeight: vipMeta.isVipActive ? 'bold' : 'normal' }}>{vipMeta.isVipActive ? (userData?.vipTier === 'platinum' ? '💎 Platin VIP' : userData?.vipTier === 'silver' ? '🥈 Gümüş VIP' : '👑 Altın VIP') : 'Standart'}</span></div>
            <div className="profile-row"><span>VIP Başlangıç</span><span>{vipMeta.startText}</span></div>
            <div className="profile-row"><span>VIP Bitiş</span><span>{vipMeta.endText}</span></div>
            <div className="profile-row"><span>Kalan Gün</span><span>{vipMeta.remainingDays === null ? '-' : `${vipMeta.remainingDays} gün`}</span></div>
            <div className="profile-row"><span>VIP Durumu</span><span style={{ color: vipMeta.isVipActive ? 'var(--success)' : '#aaa', fontWeight: 'bold' }}>{vipMeta.isVipActive ? 'Aktif' : (vipMeta.expired ? 'Süresi Doldu' : 'Pasif')}</span></div>
            <div className="profile-row"><span>Rol</span><span>{userData?.role === 'admin' ? 'Admin' : userData?.role === 'editor' ? 'Editör' : userData?.role === 'moderator' ? 'Moderatör' : 'Üye'}</span></div>

            {!vipMeta.isVipActive && (
                <button className="submit-btn" style={{ marginTop: 20, background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000', fontWeight: 'bold' }} onClick={() => onBack('abonelik')}>👑 VIP Üye Ol</button>
            )}
            {userData?.role === 'admin' && <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => onBack('admin')}>Admin Paneli</button>}
            {userData?.role === 'editor' && <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => onBack('editor')}>Editör Paneli</button>}
            {userData?.role === 'moderator' && <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => onBack('moderator')}>Moderatör Paneli</button>}

            {isNative() && (
                <div style={{ marginTop: 24, padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid #333' }}>
                    <div style={{ color: '#aaa', fontSize: 12, marginBottom: 10, fontWeight: 'bold', letterSpacing: 0.5 }}>🔔 BİLDİRİM AYARLARI</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>Push Bildirimler</div>
                            <div style={{ color: userData?.fcmToken ? '#4ade80' : '#f87171', fontSize: 12, marginTop: 2 }}>
                                {userData?.fcmToken ? '✓ Etkin' : '✗ Devre dışı'}
                            </div>
                        </div>
                        <button
                            className="hero-btn secondary"
                            style={{ fontSize: 12, padding: '8px 16px', opacity: notifStatus === 'loading' ? 0.6 : 1 }}
                            onClick={handleEnableNotifications}
                            disabled={notifStatus === 'loading'}
                        >
                            {notifStatus === 'loading' ? 'Yükleniyor...' : userData?.fcmToken ? '🔄 Yenile' : '🔔 Etkinleştir'}
                        </button>
                    </div>
                </div>
            )}

            <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
        </div>
    );
}

const ROUTE_LABELS = {
    'yapay-zeka-analizleri': { label: 'Yapay Zeka Analiz Botu', icon: '🤖' },
    'manuel-analiz':         { label: 'Manuel Analiz Yap', icon: '✏️' },
    'ilk-yari-gol':          { label: 'İlk Yarı Gol Listesi', icon: '⚽' },
    'coupons':               { label: 'Günün Kuponları', icon: '🎫' },
    'kart-analizi':          { label: 'Kart Analiz Botu', icon: '🟨' },
    'korner-analizi':        { label: 'Korner Analiz Botu', icon: '🚩' },
    'gunun-tercihleri':      { label: 'Günün Tercihleri', icon: '⭐' },
    'gunun-surprizleri':     { label: 'Sürprizler', icon: '💥' },
    'iy-ms-tahminleri':      { label: 'İY/MS Tahminleri', icon: '🔄' },
    'category':              { label: 'Editörün Seçimi', icon: '✍️' },
    'performance-summary':   { label: 'Tahmin Sonuçları', icon: '📊' },
    'abonelik':              { label: 'Abonelik', icon: '💳' },
    'profile':               { label: 'Profil', icon: '👤' },
    'dropping-odds':         { label: 'Dropping Odds', icon: '📉' },
};

function AdminDashboard({ onBack, userData }) {
    const [users, setUsers] = useState([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [totalPredictions, setTotalPredictions] = useState(0);
    const [totalCoupons, setTotalCoupons] = useState(0);
    const [menuVisits, setMenuVisits] = useState({});
    const [loading, setLoading] = useState(true);

    // Kullanıcılar: canlı onSnapshot (çevrimiçi sayısı için)
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            const uData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(uData);
            const now = Date.now();
            const online = uData.filter(u =>
                u.lastActive && (now - (u.lastActive?.toMillis?.() ?? 0) < 300000)
            ).length;
            setOnlineCount(online);
            setLoading(false);
        }, (err) => {
            console.error('Kullanıcı veri hatası:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Menü analitikleri: canlı onSnapshot
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'analytics', 'menuStats'), (snap) => {
            if (snap.exists()) setMenuVisits(snap.data());
        });
        return () => unsub();
    }, []);

    // Tahmin ve kupon sayıları: bir kez çek
    useEffect(() => {
        Promise.all([
            getDocs(collection(db, 'predictions')),
            getDocs(collection(db, 'coupons'))
        ]).then(([pSnap, cSnap]) => {
            setTotalPredictions(pSnap.size);
            setTotalCoupons(cSnap.size);
        }).catch(err => console.error('Sayım hatası:', err));
    }, []);

    const handlePasswordReset = async (email) => {
        if (!email) return alert('Bu kullanıcının e-posta adresi yok!');
        if (!confirm(`${email} adresine şifre sıfırlama maili gönderilsin mi?`)) return;
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`Şifre sıfırlama maili gönderildi: ${email}`);
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    const handleDeleteUser = async (userId, email) => {
        if (!confirm(`${email || 'Bu kullanıcı'} Firestore'dan silinecek. Emin misiniz?`)) return;
        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(users.filter(u => u.id !== userId));
            alert(`${email || 'Kullanıcı'} silindi. (Firebase Auth kaydı Firebase konsolundan silinmeli)`);
        } catch (err) {
            alert('Silme hatası: ' + err.message);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        // Kendine admin yetkisi veremez kontrolü
        if (userId === userData.uid && newRole !== 'admin' && userData.role === 'admin') {
            if (!confirm('Kendi admin yetkini kaldırmak istediğine emin misin?')) {
                return;
            }
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                updatedAt: new Date()
            });

            setUsers(users.map(u =>
                u.id === userId
                    ? { ...u, role: newRole }
                    : u
            ));
        } catch (err) {
            console.error('Rol güncelleme hatası:', err);
            alert('Yetki değiştirilemedi: ' + err.message);
        }
    };

    const handleVipTierChange = async (userId, newTier) => {
        try {
            const isVip = newTier !== 'none';
            const now = new Date();
            const nextVipEnd = new Date(now.getTime() + VIP_ADMIN_DAYS * ONE_DAY_MS);

            const targetUser = users.find(u => u.id === userId);
            const existingStart = parseDateSafe(targetUser?.vipStartAt);
            const existingEnd = parseDateSafe(targetUser?.vipEndAt);

            const payload = {
                isVip: isVip,
                vipTier: isVip ? newTier : null,
                vipUpdatedAt: now.toISOString(),
                vipSource: isVip ? 'manual' : null
            };

            if (isVip) {
                payload.vipStartAt = (existingStart || now).toISOString();
                payload.vipEndAt = (existingEnd && existingEnd > now ? existingEnd : nextVipEnd).toISOString();
            } else {
                payload.vipEndAt = now.toISOString();
            }

            await updateDoc(doc(db, 'users', userId), {
                ...payload
            });

            setUsers(users.map(u =>
                u.id === userId
                    ? { ...u, ...payload }
                    : u
            ));
            const tierNames = { silver: 'Gümüş VIP', gold: 'Altın VIP', platinum: 'Platin VIP', none: 'Standart' };
            alert(`Üyelik "${tierNames[newTier]}" olarak güncellendi!`);
        } catch (err) {
            console.error('VIP güncelleme hatası:', err);
            alert('VIP değiştirilemedi: ' + err.message);
        }
    };

    if (loading) return (
        <div className="loading">
            <div className="spinner" />
        </div>
    );

    // Menü ziyaretlerini sırala
    const sortedVisits = Object.entries(menuVisits)
        .map(([route, count]) => ({
            route,
            count: typeof count === 'number' ? count : 0,
            ...(ROUTE_LABELS[route] || { label: route, icon: '📌' })
        }))
        .sort((a, b) => b.count - a.count);
    const maxVisit = sortedVisits[0]?.count || 1;

    return (
        <div style={{
            padding: '20px',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 65px)'
        }}>
            <button className="back-btn" onClick={() => onBack('home')}>
                Geri
            </button>

            <h1 style={{ color: 'var(--gold)', marginTop: 20, marginBottom: 30 }}>
                Admin Dashboard
            </h1>

            {/* İSTATİSTİKLER */}
            <div className="admin-dashboard-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 15,
                marginBottom: 30
            }}>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: 'var(--gold)', fontWeight: 'bold' }}>{users.length}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Toplam Üye</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: 32, color: '#4ade80', fontWeight: 'bold' }}>{onlineCount}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Çevrimiçi</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: '#10B981', fontWeight: 'bold' }}>{totalPredictions}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Toplam Tahmin</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: '#f87171', fontWeight: 'bold' }}>{totalCoupons}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Toplam Kupon</div>
                </div>
            </div>

            {/* MENÜ ZİYARET SIRALAMALARI */}
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, marginBottom: 30 }}>
                <h2 style={{ color: 'var(--gold)', fontSize: 18, marginBottom: 6 }}>Menü Ziyaret Sıralaması</h2>
                <p style={{ color: '#666', fontSize: 12, marginBottom: 20, margin: '0 0 20px 0' }}>
                    Kullanıcıların her menüye toplam kaç kez girdiği (canlı)
                </p>
                {sortedVisits.length === 0 ? (
                    <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 20 }}>
                        Henüz ziyaret verisi yok. Kullanıcılar menülere girdikçe burada görünecek.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sortedVisits.map((item, idx) => (
                            <div key={item.route} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: '#555', fontSize: 12, width: 20, textAlign: 'right', flexShrink: 0 }}>
                                    {idx + 1}.
                                </span>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                                <span style={{ fontSize: 13, color: '#ddd', width: 180, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.label}
                                </span>
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 18, overflow: 'hidden', minWidth: 60 }}>
                                    <div style={{
                                        width: `${Math.round((item.count / maxVisit) * 100)}%`,
                                        height: '100%',
                                        background: idx === 0
                                            ? 'linear-gradient(90deg, #FDB913, #f59e0b)'
                                            : idx === 1
                                                ? 'linear-gradient(90deg, #60a5fa, #3b82f6)'
                                                : 'linear-gradient(90deg, #4ade80, #22c55e)',
                                        borderRadius: 6,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 'bold', width: 50, textAlign: 'right', flexShrink: 0 }}>
                                    {item.count.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* KULLANICI YÖNETİMİ */}
            <div style={{
                background: 'var(--bg-card)',
                padding: 20,
                borderRadius: 10
            }}>
                <h2 style={{
                    color: 'var(--gold)',
                    fontSize: 18,
                    marginBottom: 20
                }}>
                    Kullanıcı Yönetimi
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-user-table" style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    ID No
                                </th>
                                <th style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    E-posta
                                </th>
                                <th className="admin-col-hide-mobile" style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    Kullanıcı Adı
                                </th>
                                <th style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    Rol
                                </th>
                                <th style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    VIP Tier
                                </th>
                                <th className="admin-col-hide-mobile" style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    VIP Başlangıç
                                </th>
                                <th className="admin-col-hide-mobile" style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    VIP Bitiş
                                </th>
                                <th style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    Kalan
                                </th>
                                <th style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    fontSize: 12,
                                    color: '#aaa'
                                }}>
                                    İşlem
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const vipMeta = getVipMeta(u);
                                return (
                                    <tr
                                        key={u.id}
                                        style={{ borderBottom: '1px solid #333' }}
                                    >
                                        <td style={{ padding: 10, fontSize: 13, color: 'var(--gold)', fontWeight: '700' }}>
                                            {u.displayId || '-'}
                                        </td>
                                        <td style={{ padding: 10, fontSize: 12 }}>
                                            {u.email}
                                        </td>
                                        <td className="admin-col-hide-mobile" style={{ padding: 10, fontSize: 12 }}>
                                            {u.username || '-'}
                                        </td>
                                        <td style={{ padding: 10, fontSize: 12 }}>
                                            {u.role || 'user'}
                                        </td>
                                        <td style={{ padding: 10, fontSize: 12 }}>
                                            <select
                                                value={u.vipTier || (u.isVip ? 'gold' : 'none')}
                                                onChange={(e) => handleVipTierChange(u.id, e.target.value)}
                                                style={{
                                                    background: u.vipTier === 'platinum' ? '#7B68EE' : u.vipTier === 'gold' || (u.isVip && !u.vipTier) ? '#B8860B' : u.vipTier === 'silver' ? '#808080' : '#333',
                                                    color: u.isVip || u.vipTier ? '#fff' : '#aaa',
                                                    border: 'none',
                                                    padding: '4px 8px',
                                                    borderRadius: 5,
                                                    fontSize: 11,
                                                    cursor: 'pointer',
                                                    fontWeight: u.isVip || u.vipTier ? 'bold' : 'normal'
                                                }}
                                            >
                                                <option value="none">Standart</option>
                                                <option value="silver">🥈 Gümüş VIP</option>
                                                <option value="gold">👑 Altın VIP</option>
                                                <option value="platinum">💎 Platin VIP</option>
                                            </select>
                                        </td>
                                        <td className="admin-col-hide-mobile" style={{ padding: 10, fontSize: 12 }}>
                                            {vipMeta.startText}
                                        </td>
                                        <td className="admin-col-hide-mobile" style={{ padding: 10, fontSize: 12 }}>
                                            {vipMeta.endText}
                                        </td>
                                        <td style={{ padding: 10, fontSize: 12, color: vipMeta.isVipActive ? 'var(--success)' : '#aaa', fontWeight: 'bold' }}>
                                            {vipMeta.remainingDays === null ? '-' : `${vipMeta.remainingDays}g`}
                                        </td>
                                        <td style={{ padding: 10, fontSize: 12 }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <select
                                                    style={{
                                                        background: '#222',
                                                        color: '#fff',
                                                        border: '1px solid #444',
                                                        padding: 5,
                                                        borderRadius: 5,
                                                        fontSize: 11
                                                    }}
                                                    value={u.role || 'user'}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                >
                                                    <option value="user">Üye</option>
                                                    <option value="moderator">Moderatör</option>
                                                    <option value="editor">Editör</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    onClick={() => handlePasswordReset(u.email)}
                                                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer' }}
                                                    title="Şifre sıfırlama maili gönder"
                                                >
                                                    Şifre
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer' }}
                                                    title="Kullanıcıyı sil"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AbonelikScreen({ onBack, userData, user, onNavigate }) {
    const TELEGRAM_BOT_USERNAME = 'OddsyAbonelikBot';

    const handleSubscribe = (planName) => {
        const userId = userData?.displayId || '';
        const username = userData?.username || '';
        const message = encodeURIComponent(`Merhaba! Oddsy ${planName} abonelik almak istiyorum.\n\nKullanıcı Adı: ${username}\nKullanıcı ID: ${userId}`);
        window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}?text=${message}`, '_blank');
    };

    const userTier = userData?.vipTier || (userData?.isVip ? 'gold' : null);

    const plans = [
        {
            id: 'silver',
            name: 'Gümüş',
            icon: '🥈',
            price: '499',
            duration: '1 Aylık',
            gradient: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
            borderColor: 'rgba(192, 192, 192, 0.4)',
            glowColor: 'rgba(192, 192, 192, 0.15)',
            textColor: '#C0C0C0',
            features: [
                'Yapay Zeka ile Günün Tahminleri sayfasına erişim',
                'Seçilen maçlar için detaylı algoritma analizi',
                'Kart Analiz Botu ekranına erişim',
                'Korner Analiz Botu ekranına erişim',
                'Editörün Seçimi özel analizlerine erişim',
                '1 Aylık üyelik süresince erişim'
            ]
        },
        {
            id: 'gold',
            name: 'Altın',
            icon: '👑',
            price: '1299',
            duration: '3 Aylık',
            gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
            borderColor: 'rgba(255, 215, 0, 0.4)',
            glowColor: 'rgba(255, 215, 0, 0.15)',
            textColor: '#FFD700',
            popular: true,
            features: [
                'Yapay Zeka ile Günün Tahminleri sayfasına erişim',
                'Seçilen maçlar için detaylı algoritma analizi',
                'Kart Analiz Botu ekranına erişim',
                'Korner Analiz Botu ekranına erişim',
                'Editörün Seçimi özel analizlerine erişim',
                'Canlı tercihler içeren özel Telegram kanalına erişim',
                '3 Aylık üyelik süresince erişim'
            ]
        },
        {
            id: 'platinum',
            name: 'Platin',
            icon: '💎',
            price: '2499',
            duration: '6 Aylık',
            gradient: 'linear-gradient(135deg, #E5E4E2, #B0C4DE, #7B68EE)',
            borderColor: 'rgba(123, 104, 238, 0.4)',
            glowColor: 'rgba(123, 104, 238, 0.15)',
            textColor: '#B0C4DE',
            features: [
                'Yapay Zeka ile Günün Tahminleri sayfasına erişim',
                'Seçilen maçlar için detaylı algoritma analizi',
                'Kart Analiz Botu ekranına erişim',
                'Korner Analiz Botu ekranına erişim',
                'Editörün Seçimi özel analizlerine erişim',
                'Canlı tercihler içeren özel Telegram kanalına erişim',
                'Özel birebir analiz desteği',
                '6 Aylık üyelik süresince erişim'
            ]
        }
    ];

    const tierOrder = { silver: 1, gold: 2, platinum: 3 };

    return (
        <div className="category-page" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <div className="category-header">
                <button className="category-back-btn" onClick={onBack}>{Icons.back}</button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
                <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 900, marginBottom: 10 }}>
                    Oddsy Abonelik Planları
                </h1>
                <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6 }}>
                    Gelişmiş analiz özelliklerinden ve yapay zeka tahminlerinden faydalanmak için size uygun planı seçin.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 20,
                marginBottom: 30
            }}>
                {plans.map(plan => {
                    const isActive = userTier === plan.id;
                    const hasHigherTier = userTier && tierOrder[userTier] >= tierOrder[plan.id];

                    return (
                        <div key={plan.id} style={{
                            background: 'var(--bg-card)',
                            borderRadius: 20,
                            padding: '30px 24px',
                            border: `2px solid ${plan.borderColor}`,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: plan.popular ? `0 0 30px ${plan.glowColor}` : 'none',
                            transform: plan.popular ? 'scale(1.03)' : 'none',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}>
                            {plan.popular && (
                                <div style={{
                                    position: 'absolute',
                                    top: -12,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: plan.gradient,
                                    color: '#000',
                                    padding: '4px 16px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap'
                                }}>
                                    En Popüler
                                </div>
                            )}

                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>{plan.icon}</div>
                                <h3 style={{ color: plan.textColor, fontSize: 22, fontWeight: 800, margin: 0 }}>
                                    {plan.name}
                                </h3>
                                <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{plan.duration} Plan</p>
                            </div>

                            <div style={{
                                textAlign: 'center',
                                marginBottom: 20,
                                padding: '15px 0',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <span style={{ fontSize: 36, fontWeight: 900, color: plan.textColor }}>{plan.price}</span>
                                <span style={{ fontSize: 16, color: '#888', marginLeft: 4 }}>TL</span>
                            </div>

                            <div style={{ flex: 1, marginBottom: 20 }}>
                                {plan.features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                                        <span style={{ color: plan.textColor, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✔</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.4 }}>{f}</span>
                                    </div>
                                ))}
                            </div>

                            {isActive ? (
                                <div style={{
                                    background: `linear-gradient(135deg, ${plan.glowColor}, ${plan.glowColor})`,
                                    border: `2px solid ${plan.textColor}`,
                                    borderRadius: 12,
                                    padding: '14px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ color: plan.textColor, fontSize: 15, fontWeight: 'bold' }}>
                                        {plan.icon} Aktif Planınız
                                    </span>
                                </div>
                            ) : hasHigherTier ? (
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 12,
                                    padding: '14px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ color: '#666', fontSize: 14 }}>Mevcut planınız bu planı kapsar</span>
                                </div>
                            ) : !user ? (
                                <button
                                    onClick={() => onNavigate('auth', { isLogin: false })}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: plan.gradient,
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: 12,
                                        fontSize: 15,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Önce Kayıt Ol / Giriş Yap
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubscribe(plan.name + ' VIP')}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: plan.gradient,
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: 12,
                                        fontSize: 15,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease, transform 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                >
                                    {plan.name} Üyelik Satın Al
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
}

function VipGate({ children }) {
    // VIP gate is currently disabled. Return children directly.
    return children;
}

function EditorScreen({ onBack, showAlert, userData }) {
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 8, status: 'pending', analysis: '', isPremium: false });

    const handleAddMatch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');

            await addDoc(collection(db, 'predictions'), {
                ...matchData,
                isPremium: matchData.isPremium || false,
                authorId: u.uid,
                authorEmail: u.email,
                createdAt: serverTimestamp(),
                status: matchData.status || 'pending',
            });

            showAlert('Editör tahmini eklendi!', 'success');
            setMatchData({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 8, status: 'pending', analysis: '', isPremium: false });
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
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Lig</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="Premier Lig" value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Saat</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="20:45" value={matchData.time} onChange={e => setMatchData({ ...matchData, time: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Tahmin</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.prediction} onChange={e => setMatchData({ ...matchData, prediction: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Oran</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.odds} onChange={e => setMatchData({ ...matchData, odds: e.target.value })} /></div>
                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Maç Analizi</label><textarea className="form-input" style={{ padding: 8, fontSize: 12 }} rows="2" value={matchData.analysis} onChange={e => setMatchData({ ...matchData, analysis: e.target.value })} placeholder="Bu maç için analizini buraya yaz..." /></div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <input type="checkbox" id="premium-check-editor" checked={matchData.isPremium} onChange={e => setMatchData({ ...matchData, isPremium: e.target.checked })} />
                            <label htmlFor="premium-check-editor" style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 'bold' }}>⭐ Premium (Özel Çerçeveli) Olarak İşaretle</label>
                        </div>
                    </div>
                    <button className="submit-btn" disabled={loading} style={{ marginTop: 15, padding: 10, fontSize: 13 }}>Kaydet</button>
                </form>
            </div>
        </div>
    );
}


function PerformanceSummaryScreen({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [predictionSummary, setPredictionSummary] = useState([]);
    const [couponSummary, setCouponSummary] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [predSnap, couponSnap] = await Promise.all([
                    getDocs(collection(db, 'predictions')),
                    getDocs(collection(db, 'coupons'))
                ]);

                const menuDefs = [
                    { key: 0, label: 'İlk Yarı Gol Listesi' },
                    { key: 4, label: 'Günün Tercihleri' },
                    { key: 6, label: 'Günün Sürprizleri' },
                    { key: 7, label: 'İY/MS Tahminleri' },
                    { key: 8, label: 'Editörün Seçimi' },
                ];

                const predictions = predSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const predStats = menuDefs.map(menu => {
                    const list = predictions.filter(p => {
                        const ck = typeof p.categoryKey === 'string' ? parseInt(p.categoryKey) : p.categoryKey;
                        return ck === menu.key;
                    });
                    const decided = list.filter(p => p.status === 'won' || p.status === 'lost');
                    const won = decided.filter(p => p.status === 'won').length;
                    const total = decided.length;
                    const rate = total > 0 ? Math.round((won / total) * 100) : 0;
                    return {
                        ...menu,
                        total,
                        won,
                        lost: total - won,
                        rate,
                        text: total > 0
                            ? `${menu.label} ${total} maçta ${won} kazanan, %${rate} başarı.`
                            : `${menu.label} için henüz sonuçlandırılmış veri yok.`
                    };
                }).filter(x => x.total > 0);

                const coupons = couponSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const grouped = {};
                coupons.forEach(c => {
                    const type = c.type || 'Kupon';
                    if (!grouped[type]) grouped[type] = [];
                    grouped[type].push(c);
                });

                const cpStats = Object.entries(grouped).map(([type, items]) => {
                    const decided = items.filter(c => c.status === 'won' || c.status === 'lost');
                    const won = decided.filter(c => c.status === 'won').length;
                    const total = decided.length;
                    const rate = total > 0 ? Math.round((won / total) * 100) : 0;
                    const oddsList = items
                        .map(c => parseFloat((c.totalOdds || '').toString().replace(',', '.')))
                        .filter(v => !Number.isNaN(v));
                    const avgOdds = oddsList.length ? (oddsList.reduce((a, b) => a + b, 0) / oddsList.length).toFixed(2) : null;

                    return {
                        type,
                        total,
                        won,
                        lost: total - won,
                        rate,
                        avgOdds,
                        text: total > 0
                            ? `${type} ${total} kuponda ${won} kazanan, %${rate} başarı${avgOdds ? ` (Ort. Oran ${avgOdds})` : ''}.`
                            : `${type} için henüz sonuçlandırılmış kupon yok.`
                    };
                }).filter(x => x.total > 0);

                setPredictionSummary(predStats);
                setCouponSummary(cpStats);
            } catch (err) {
                console.error('PerformanceSummaryScreen error:', err);
                setPredictionSummary([]);
                setCouponSummary([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="category-page" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <div className="category-header">
                <button className="category-back-btn" onClick={onBack}>{Icons.back}</button>
                <h1 className="category-title">Tahmin Sonuçları</h1>
            </div>
            {loading ? (
                <div className="loading"><div className="spinner" /></div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {predictionSummary.length > 0 && (
                        <h3 style={{ color: 'var(--gold)', margin: 0, fontSize: 16, letterSpacing: 0.5 }}>Menü Başarı Kartları</h3>
                    )}
                    {predictionSummary.map(item => (
                        <div key={`pred-${item.key}`} className="prediction-card" style={{ border: '2px solid #FDB913', borderRadius: 16, padding: 16, transition: 'all 0.3s ease', cursor: 'pointer', ':hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(253,185,19,0.35)', borderColor: '#ffd700' }, background: 'linear-gradient(145deg, rgba(30,30,30,0.9), rgba(20,20,20,0.95))', boxShadow: '0 4px 15px rgba(253,185,19,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ fontWeight: 800, color: '#fff' }}>{item.label}</div>
                                <div style={{ fontWeight: 900, color: '#FDB913', textShadow: '0 0 10px rgba(253,185,19,0.5)' }}>%{item.rate}</div>
                            </div>

                            <div style={{
                                width: '100%',
                                height: 10,
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: 999,
                                overflow: 'hidden',
                                marginBottom: 12
                            }}>
                                <div style={{
                                    width: `${item.rate}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #22c55e, #10b981)',
                                    boxShadow: '0 0 12px rgba(16,185,129,0.5)'
                                }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 10, textAlign: 'center' }}><div style={{ color: '#aaa', fontSize: 11 }}>Toplam</div><div style={{ color: '#fff', fontWeight: 800 }}>{item.total}</div></div>
                                <div style={{ background: 'rgba(74,222,128,0.08)', padding: 8, borderRadius: 10, textAlign: 'center' }}><div style={{ color: '#86efac', fontSize: 11 }}>Kazandı</div><div style={{ color: '#4ade80', fontWeight: 800 }}>{item.won}</div></div>
                                <div style={{ background: 'rgba(248,113,113,0.08)', padding: 8, borderRadius: 10, textAlign: 'center' }}><div style={{ color: '#fca5a5', fontSize: 11 }}>Kaybetti</div><div style={{ color: '#f87171', fontWeight: 800 }}>{item.lost}</div></div>
                            </div>
                        </div>
                    ))}

                    {couponSummary.length > 0 && (
                        <h3 style={{ color: 'var(--gold)', margin: '6px 0 0', fontSize: 16, letterSpacing: 0.5 }}>Kupon Başarı Kartları</h3>
                    )}
                    {couponSummary.map((item, idx) => (
                        <div key={`coupon-${idx}`} className="prediction-card" style={{ border: '2px solid #FDB913', borderRadius: 16, padding: 16, transition: 'all 0.3s ease', cursor: 'pointer', background: 'linear-gradient(145deg, rgba(30,30,30,0.9), rgba(20,20,20,0.95))', boxShadow: '0 4px 15px rgba(253,185,19,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ fontWeight: 800, color: '#fff' }}>{item.type}</div>
                                <div style={{ fontWeight: 900, color: '#FDB913', textShadow: '0 0 10px rgba(253,185,19,0.5)' }}>%{item.rate}</div>
                            </div>

                            <div style={{
                                width: '100%',
                                height: 10,
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: 999,
                                overflow: 'hidden',
                                marginBottom: 12
                            }}>
                                <div style={{
                                    width: `${item.rate}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #facc15, #f59e0b)',
                                    boxShadow: '0 0 12px rgba(245,158,11,0.45)'
                                }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: item.avgOdds ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 10, textAlign: 'center' }}><div style={{ color: '#aaa', fontSize: 11 }}>Toplam</div><div style={{ color: '#fff', fontWeight: 800 }}>{item.total}</div></div>
                                <div style={{ background: 'rgba(74,222,128,0.08)', padding: 8, borderRadius: 10, textAlign: 'center' }}><div style={{ color: '#86efac', fontSize: 11 }}>Kazandı</div><div style={{ color: '#4ade80', fontWeight: 800 }}>{item.won}</div></div>
                                <div style={{ background: 'rgba(248,113,113,0.08)', padding: 8, borderRadius: 10, textAlign: 'center' }}><div style={{ color: '#fca5a5', fontSize: 11 }}>Kaybetti</div><div style={{ color: '#f87171', fontWeight: 800 }}>{item.lost}</div></div>
                                {item.avgOdds && <div style={{ background: 'rgba(253,185,19,0.08)', padding: 8, borderRadius: 10, textAlign: 'center' }}><div style={{ color: 'var(--gold)', fontSize: 11 }}>Ort. Oran</div><div style={{ color: 'var(--gold)', fontWeight: 800 }}>{item.avgOdds}</div></div>}
                            </div>
                        </div>
                    ))}
                    {predictionSummary.length === 0 && couponSummary.length === 0 && (
                        <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>Henüz sonuçlandırılmış veri bulunmuyor.</div>
                    )}
                </div>
            )}
        </div>
    );
}


function ModeratorScreen({ onBack, showAlert }) {
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [matches, setMatches] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(7);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 7, status: 'pending', analysis: '' });

    const categoryTitle = selectedCategory === 7 ? 'İY/MS Tahminleri' : 'Günün Sürprizleri';

    useEffect(() => {
        setListLoading(true);
        const q = query(collection(db, 'predictions'), where('categoryKey', '==', selectedCategory));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setMatches(list);
            setListLoading(false);
        }, () => setListLoading(false));

        listenerRegistry.register('moderator-iymst', unsub);
        return () => listenerRegistry.unregister('moderator-iymst');
    }, [selectedCategory]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');

            await addDoc(collection(db, 'predictions'), {
                ...matchData,
                categoryKey: selectedCategory,
                authorId: u.uid,
                authorEmail: u.email,
                createdAt: serverTimestamp(),
                status: 'pending'
            });

            showAlert(`${categoryTitle} için tahmin eklendi!`, 'success');
            setMatchData({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: selectedCategory, status: 'pending', analysis: '' });
        } catch (err) {
            showAlert('Hata: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu tahmini silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDoc(doc(db, 'predictions', id));
            setMatches(prev => prev.filter(m => m.id !== id));
            showAlert('Tahmin silindi.', 'success');
        } catch (err) {
            showAlert('Silme başarısız: ' + err.message, 'error');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
            <button className="back-btn" onClick={() => onBack('home')}>Geri</button>
            <h1 style={{ color: 'var(--gold)', marginTop: 20, marginBottom: 20 }}>Moderatör Paneli - {categoryTitle}</h1>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button className={`hero-btn secondary ${selectedCategory === 7 ? 'active' : ''}`} onClick={() => { setSelectedCategory(7); setMatchData(prev => ({ ...prev, categoryKey: 7 })); }} style={{ fontSize: 12, padding: '8px 12px' }}>İY/MS</button>
                <button className={`hero-btn secondary ${selectedCategory === 6 ? 'active' : ''}`} onClick={() => { setSelectedCategory(6); setMatchData(prev => ({ ...prev, categoryKey: 6 })); }} style={{ fontSize: 12, padding: '8px 12px' }}>Günün Sürprizleri</button>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10, marginBottom: 20 }}>
                <form onSubmit={handleAdd}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.homeTeam} onChange={e => setMatchData({ ...matchData, homeTeam: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.awayTeam} onChange={e => setMatchData({ ...matchData, awayTeam: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Lig</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="Premier Lig" value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Saat</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="20:45" value={matchData.time} onChange={e => setMatchData({ ...matchData, time: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Tahmin</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.prediction} onChange={e => setMatchData({ ...matchData, prediction: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Oran</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.odds} onChange={e => setMatchData({ ...matchData, odds: e.target.value })} /></div>
                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Maç Analizi</label><textarea className="form-input" style={{ padding: 8, fontSize: 12 }} rows="2" value={matchData.analysis} onChange={e => setMatchData({ ...matchData, analysis: e.target.value })} placeholder="Bu maç için analizini buraya yaz..." /></div>
                    </div>
                    <button className="submit-btn" disabled={loading} style={{ marginTop: 15, padding: 10, fontSize: 13 }}>Kaydet</button>
                </form>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: 12 }}>{categoryTitle} Liste</h3>
                {listLoading ? <div className="loading"><div className="spinner" /></div> : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {matches.map(m => (
                            <div key={m.id} style={{ border: '1px solid #3a3a3a', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                <div style={{ fontSize: 13, color: '#fff' }}><strong>{m.homeTeam}</strong> - <strong>{m.awayTeam}</strong> | {m.prediction || '-'} | {m.odds || '-'}</div>
                                <button className="admin-btn delete" onClick={() => handleDelete(m.id)} style={{ padding: '8px 10px', borderRadius: 6 }}>SİL</button>
                            </div>
                        ))}
                        {matches.length === 0 && <div style={{ color: '#aaa' }}>Henüz tahmin yok.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}


function AdminScreen({ onBack, showAlert, userData }) {
    const [view, setView] = useState('addMatch');
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 6, status: 'pending', analysis: '', cardHomeAvg: '', cardAwayAvg: '', refereeInfo: '', cornerHomeAvg: '', cornerAwayAvg: '', cornerGenAvg: '' });
    const [couponData, setCouponData] = useState({ type: 'Günün Banko Kuponu', matches: [{ home: '', away: '', prediction: '', odds: '' }] });
    const [notification, setNotification] = useState({ title: '', body: '' });
    const [adminCoupons, setAdminCoupons] = useState([]);
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [editCouponData, setEditCouponData] = useState(null);

    const handleAddMatchToCoupon = () => {
        setCouponData({ ...couponData, matches: [...couponData.matches, { home: '', away: '', prediction: '', odds: '' }] });
    };

    // Kupon düzenleme: adminCoupons'ı yükle
    useEffect(() => {
        if (view !== 'editCoupon') return;
        getDocs(query(collection(db, 'coupons'))).then(snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
            setAdminCoupons(list);
        }).catch(() => {});
    }, [view]);

    const handleStartEditCoupon = (coupon) => {
        setEditingCouponId(coupon.id);
        setEditCouponData({
            type: coupon.type,
            matches: coupon.matches || [{ home: '', away: '', prediction: '', odds: '' }],
        });
    };

    const handleUpdateEditMatch = (index, field, value) => {
        setEditCouponData(prev => {
            const newMatches = [...prev.matches];
            newMatches[index] = { ...newMatches[index], [field]: value };
            return { ...prev, matches: newMatches };
        });
    };

    const handleSaveEditCoupon = async (e) => {
        e.preventDefault();
        if (!editingCouponId || !editCouponData) return;
        setLoading(true);
        try {
            const safeParse = (v) => {
                if (!v) return 1;
                const cleaned = v.toString().replace(',', '.');
                const parsed = parseFloat(cleaned);
                return isNaN(parsed) ? 1 : parsed;
            };
            const totalOdds = editCouponData.matches.reduce((acc, curr) => acc * safeParse(curr.odds), 1).toFixed(2);
            await updateDoc(doc(db, 'coupons', editingCouponId), { ...editCouponData, totalOdds });
            showAlert('Kupon güncellendi!', 'success');
            // Listeyi yenile
            getDocs(query(collection(db, 'coupons'))).then(snap => {
                const list = snap.docs.map(d2 => ({ id: d2.id, ...d2.data() }));
                list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                setAdminCoupons(list);
            });
            setEditingCouponId(null);
            setEditCouponData(null);
        } catch (err) {
            showAlert('Hata: ' + err.message, 'error');
        } finally { setLoading(false); }
    };

    const handleUpdateCouponMatch = (index, field, value) => {
        setCouponData(prev => {
            const newMatches = [...prev.matches];
            newMatches[index] = { ...newMatches[index], [field]: value };
            return { ...prev, matches: newMatches };
        });
    };

    const handleSaveCoupon = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');

            // Oranlardaki virgülleri noktaya çevir ve güvenli hesapla
            const safeParse = (v) => {
                if (!v) return 1;
                const cleaned = v.toString().replace(',', '.');
                const parsed = parseFloat(cleaned);
                return isNaN(parsed) ? 1 : parsed;
            };

            const totalOdds = couponData.matches.reduce((acc, curr) => acc * safeParse(curr.odds), 1).toFixed(2);

            const finalCouponData = {
                ...couponData,
                totalOdds,
                createdAt: serverTimestamp(),
                authorId: u.uid
            };


            const docRef = await addDoc(collection(db, 'coupons'), finalCouponData);


            showAlert('Kupon eklendi!', 'success');
            // Form alanlarını temizle
            setCouponData({ type: 'Günün Banko Kuponu', matches: [{ home: '', away: '', prediction: '', odds: '' }] });
        } catch (err) {
            console.error('AdminScreen: Coupon Save Error:', err);
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
                finalData.categoryKey = 3;
            } else if (view === 'addCorner') {
                finalData.cardHomeAvg = ''; finalData.cardAwayAvg = ''; finalData.refereeInfo = '';
                finalData.categoryKey = 3;
            } else if (view === 'addMatch' && matchData.categoryKey !== 3) {
                finalData.cardHomeAvg = ''; finalData.cardAwayAvg = ''; finalData.refereeInfo = '';
                finalData.cornerHomeAvg = ''; finalData.cornerAwayAvg = ''; finalData.cornerGenAvg = '';
            }

            // Doğrudan Firestore'a kaydet
            await addDoc(collection(db, 'predictions'), {
                ...finalData,
                authorId: u.uid,
                authorEmail: u.email,
                createdAt: serverTimestamp(),
                status: finalData.status || 'pending'
            });
            console.log(`AdminScreen: ${view} - Prediction added to Firestore`);

            showAlert('Eklendi!', 'success');

            // Sadece form alanlarını temizle, categoryKey'i view'e göre koru
            setMatchData({
                ...matchData,
                homeTeam: '', awayTeam: '', prediction: '', odds: '', analysis: '',
                isPremium: false,
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
        <div>
            <div className="admin-content-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
                {/* Sol Taraf - Input Listesi */}
                <div style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 10, height: 'fit-content' }}>
                    <h3 style={{ color: 'var(--gold)', fontSize: 14, marginBottom: 15, textAlign: 'center' }}>INPUT</h3>
                    <div className="admin-sidebar-buttons" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className={`hero-btn secondary ${view === 'addMatch' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('addMatch')}>Tahmin Ekle</button>
                        <button className={`hero-btn secondary ${view === 'addCoupon' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('addCoupon')}>Kupon Ekle</button>
                        <button className={`hero-btn secondary ${view === 'editCoupon' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%', borderColor: '#f59e0b' }} onClick={() => { setView('editCoupon'); setEditingCouponId(null); setEditCouponData(null); }}>✏️ Kupon Düzenle</button>
                    </div>
                </div>

                {/* Sağ Taraf - Form Alanı */}
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                    {(view === 'addMatch' || view === 'addCard' || view === 'addCorner') && (
                        <form onSubmit={handleAddMatch}>
                            <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {view === 'addMatch' && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}>
                                        <label className="form-label" style={{ fontSize: 10 }}>Kategori</label>
                                        <select className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.categoryKey} onChange={e => setMatchData({ ...matchData, categoryKey: parseInt(e.target.value) })}>
                                            <option value={6}>Sürprizler</option>
                                            <option value={4}>Günün Tercihleri</option>
                                            <option value={7}>İY/MS Tahminleri</option>
                                            <option value={0}>İlk Yarı Gol Listesi</option>
                                            <option value={8}>Editörün Seçimi</option>
                                            <option value={2}>Tahminciler</option>
                                        </select>
                                    </div>
                                )}
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.homeTeam} onChange={e => setMatchData({ ...matchData, homeTeam: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.awayTeam} onChange={e => setMatchData({ ...matchData, awayTeam: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Lig</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="Premier Lig" value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Saat</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} placeholder="20:45" value={matchData.time} onChange={e => setMatchData({ ...matchData, time: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Tahmin</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.prediction} onChange={e => setMatchData({ ...matchData, prediction: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Oran</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.odds} onChange={e => setMatchData({ ...matchData, odds: e.target.value })} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Maç Analizi</label><textarea className="form-input" style={{ padding: 8, fontSize: 12 }} rows="2" value={matchData.analysis} onChange={e => setMatchData({ ...matchData, analysis: e.target.value })} placeholder="Bu maç için analizini buraya yaz..." /></div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <input type="checkbox" id="premium-check-admin" checked={matchData.isPremium} onChange={e => setMatchData({ ...matchData, isPremium: e.target.checked })} />
                                    <label htmlFor="premium-check-admin" style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 'bold' }}>⭐ Premium Tahmin Olarak İşaretle</label>
                                </div>

                                {view === 'addCard' && (
                                    <>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi Kart Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cardHomeAvg} onChange={e => setMatchData({ ...matchData, cardHomeAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman Kart Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cardAwayAvg} onChange={e => setMatchData({ ...matchData, cardAwayAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Hakem Bilgisi</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.refereeInfo} onChange={e => setMatchData({ ...matchData, refereeInfo: e.target.value })} /></div>
                                    </>
                                )}

                                {view === 'addCorner' && (
                                    <>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Ev Sahibi Korner Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cornerHomeAvg} onChange={e => setMatchData({ ...matchData, cornerHomeAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Deplasman Korner Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cornerAwayAvg} onChange={e => setMatchData({ ...matchData, cornerAwayAvg: e.target.value })} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Genel Korner Ort</label><input className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.cornerGenAvg} onChange={e => setMatchData({ ...matchData, cornerGenAvg: e.target.value })} /></div>
                                    </>
                                )}
                            </div>

                            <button className="submit-btn" disabled={loading} style={{ marginTop: 15, padding: 10, fontSize: 13 }}>Kaydet</button>
                        </form>
                    )}

                    {view === 'addCoupon' && (
                        <form onSubmit={handleSaveCoupon}>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="form-label" style={{ fontSize: 10 }}>Kupon Türü</label>
                                <select className="form-input" style={{ padding: 8, fontSize: 12 }} value={couponData.type} onChange={e => setCouponData({ ...couponData, type: e.target.value })}>
                                    {COUPON_TYPES.map(t => <option key={t.id} value={t.dbName}>{t.dbName}</option>)}
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

                    {view === 'editCoupon' && !editingCouponId && (
                        <div>
                            <h3 style={{ color: 'var(--gold)', fontSize: 14, marginBottom: 12 }}>✏️ Düzenlenecek Kuponu Seç</h3>
                            {adminCoupons.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>Henüz kupon yok.</div>}
                            {adminCoupons.map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2a2a2a', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid #444' }}>
                                    <div>
                                        <div style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 'bold' }}>{c.type}</div>
                                        <div style={{ color: '#aaa', fontSize: 11 }}>{c.matches?.length || 0} maç • Oran: {c.totalOdds || '-'}</div>
                                    </div>
                                    <button className="hero-btn secondary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => handleStartEditCoupon(c)}>Düzenle</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'editCoupon' && editingCouponId && editCouponData && (
                        <form onSubmit={handleSaveEditCoupon}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                                <button type="button" className="hero-btn secondary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => { setEditingCouponId(null); setEditCouponData(null); }}>← Geri</button>
                                <h3 style={{ color: 'var(--gold)', fontSize: 13, margin: 0 }}>Kuponu Düzenle</h3>
                            </div>
                            <div className="form-group" style={{ marginBottom: 15 }}>
                                <label className="form-label" style={{ fontSize: 10 }}>Kupon Türü</label>
                                <select className="form-input" style={{ padding: 8, fontSize: 12 }} value={editCouponData.type} onChange={e => setEditCouponData({ ...editCouponData, type: e.target.value })}>
                                    {COUPON_TYPES.map(t => <option key={t.id} value={t.dbName}>{t.dbName}</option>)}
                                </select>
                            </div>
                            {editCouponData.matches.map((m, i) => (
                                <div key={i} style={{ border: '2px solid #f59e0b', padding: 12, borderRadius: 10, marginBottom: 12, background: '#3a3a3a' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 'bold' }}>Maç {i + 1}</span>
                                        {editCouponData.matches.length > 1 && (
                                            <button type="button" style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 13 }} onClick={() => setEditCouponData(prev => ({ ...prev, matches: prev.matches.filter((_, idx) => idx !== i) }))}>✕ Sil</button>
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                        <input placeholder="Ev Sahibi" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.home} onChange={e => handleUpdateEditMatch(i, 'home', e.target.value)} />
                                        <input placeholder="Deplasman" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.away} onChange={e => handleUpdateEditMatch(i, 'away', e.target.value)} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <input placeholder="Tahmin" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.prediction} onChange={e => handleUpdateEditMatch(i, 'prediction', e.target.value)} />
                                        <input placeholder="Oran (1.50)" className="form-input" style={{ padding: 8, fontSize: 12 }} value={m.odds} onChange={e => handleUpdateEditMatch(i, 'odds', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="hero-btn secondary" onClick={() => setEditCouponData(prev => ({ ...prev, matches: [...prev.matches, { home: '', away: '', prediction: '', odds: '' }] }))} style={{ width: '100%', marginBottom: 12, padding: 10, fontSize: 12 }}>+ Maç Ekle</button>
                            <button className="submit-btn" disabled={loading} style={{ padding: 10, fontSize: 13, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>💾 Kuponu Güncelle</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function CouponScreen({ onBack, showAlert, userData }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState(null);

    const isAdmin = userData?.role === 'admin';

    useEffect(() => {

        const q = query(collection(db, 'coupons'));
        const unsub = onSnapshot(q, (snap) => {
            const allCoupons = snap.docs.map(d => {
                const data = d.data();
                return { id: d.id, ...data };
            });


            // Sıralama
            allCoupons.sort((a, b) => {
                const getMs = (ts) => {
                    if (!ts) return Date.now();
                    if (ts.toMillis) return ts.toMillis();
                    if (ts.seconds) return ts.seconds * 1000;
                    return 0;
                };
                return getMs(b.createdAt) - getMs(a.createdAt);
            });

            setCoupons(allCoupons);
            setLoading(false);
        }, (err) => {
            console.error('CouponScreen: Snapshot Error:', err);
            showAlert('Veri çekilemedi: ' + err.message, 'error');
            setLoading(false);
        });

        // Register listener for cleanup
        listenerRegistry.register('coupon-screen', unsub);

        return () => {
            listenerRegistry.unregister('coupon-screen');
        };
    }, []);

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDoc(doc(db, 'coupons', id));
            showAlert('Kupon silindi.', 'success');
        } catch (err) {
            console.error(err);
            showAlert('Silme başarısız: ' + err.message, 'error');
        }
    };

    const updateCouponStatus = async (id, status) => {
        try {
            await setDoc(doc(db, 'coupons', id), { status }, { merge: true });
            showAlert(`Kupon durumu güncellendi: ${status}`, 'success');
        } catch (err) {
            console.error(err);
            showAlert('Güncelleme başarısız: ' + err.message, 'error');
        }
    };

    const couponTypes = COUPON_TYPES;

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
                        // En son eklenen kuponu göster, tercihen sonucu belli olmayan
                        const latestCoupon = typeCoupons[0];

                        return (
                            <div key={type.id} className="menu-selection-card" onClick={() => setSelectedType(type)}>
                                <img src={type.image} style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt={type.name} />
                                <h3 style={{ color: type.color, fontSize: 18, marginBottom: 10 }}>{type.name}</h3>
                                {/* İstatistikler kaldırıldı, sadece kart ismi ve görsel kalacak */}
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
                {filteredCoupons.length > 0 ? filteredCoupons.map(c => {
                    const isWon = c.status === 'won';
                    const isLost = c.status === 'lost';

                    return (
                        <div key={c.id} style={{
                            borderRadius: '16px',
                            padding: 0,
                            marginBottom: '30px',
                            background: '#1e2122',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                            overflow: 'hidden',
                            maxWidth: '700px',
                            margin: '0 auto 30px auto',
                            transition: 'all 0.3s ease',
                            border: `2px solid ${isWon ? '#4ade80' : isLost ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
                            position: 'relative'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.7), 0 0 20px ${selectedType.color}33`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
                            }}>

                            {/* Header Section */}
                            <div style={{
                                background: `linear-gradient(135deg, ${selectedType.color}cc 0%, ${selectedType.color}99 100%)`,
                                padding: '15px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={selectedType.image} style={{ width: '30px', height: '30px', filter: 'brightness(0) invert(1)' }} alt="" />
                                    <span style={{
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontWeight: '800',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase'
                                    }}>{selectedType.name}</span>
                                </div>
                                {c.status && (
                                    <div style={{
                                        background: isWon ? '#22c55e' : '#ef4444',
                                        color: 'white',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}>
                                        {isWon ? '✓' : '✗'}
                                    </div>
                                )}
                            </div>

                            {/* Match Items */}
                            <div style={{ padding: '10px 0' }}>
                                {c.matches.map((m, idx) => {
                                    const homeTeam = m.home || 'Ev Sahibi';
                                    const awayTeam = m.away || 'Deplasman';

                                    return (
                                        <div key={idx}>
                                            <div style={{
                                                padding: '15px 25px',
                                                position: 'relative'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '16px'
                                                }}>
                                                    {/* Ev Sahibi */}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        <img src={getTeamLogo(homeTeam)} alt={homeTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{homeTeam}</span>
                                                    </div>

                                                    {/* Ortada Sadece VS */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#FDB913', fontStyle: 'italic' }}>VS</span>
                                                    </div>

                                                    {/* Deplasman */}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        <img src={getTeamLogo(awayTeam)} alt={awayTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{awayTeam}</span>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '15px', alignItems: 'center' }}>
                                                        <div style={{
                                                            background: 'rgba(0,0,0,0.3)',
                                                            padding: '8px 16px',
                                                            borderRadius: '8px',
                                                            textAlign: 'center',
                                                            border: '1px solid rgba(255,255,255,0.05)'
                                                        }}>
                                                            <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>TAHMİN</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#10B981' }}>{m.prediction}</div>
                                                        </div>
                                                        <div style={{
                                                            background: 'rgba(0,0,0,0.3)',
                                                            padding: '8px 16px',
                                                            borderRadius: '8px',
                                                            textAlign: 'center',
                                                            border: '1px solid rgba(255,255,255,0.05)'
                                                        }}>
                                                            <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>ORAN</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#FDB913' }}>{m.odds}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {idx !== c.matches.length - 1 && (
                                                <div style={{
                                                    borderBottom: '2px dotted rgba(255,255,255,0.1)',
                                                    margin: '0 25px'
                                                }}></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer Section */}
                            <div style={{
                                padding: '20px 25px',
                                background: 'rgba(255,255,255,0.03)',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ color: '#aaa', fontSize: '13px', fontWeight: '600' }}>TOPLAM ORAN</div>
                                <div style={{
                                    color: selectedType.color,
                                    fontSize: '24px',
                                    fontWeight: '900',
                                    textShadow: `0 0 15px ${selectedType.color}66`
                                }}>{c.totalOdds}</div>
                            </div>

                            {/* ADMIN ACTIONS */}
                            {isAdmin && (
                                <div style={{
                                    padding: '15px',
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    background: 'rgba(0,0,0,0.3)'
                                }}>
                                    <button className="admin-btn delete" onClick={() => handleDeleteCoupon(c.id)} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>SİL</button>
                                    <div style={{ display: 'flex', gap: '10px', flex: 2 }}>
                                        <button className="admin-btn won" onClick={() => updateCouponStatus(c.id, 'won')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>KAZANDI</button>
                                        <button className="admin-btn lost" onClick={() => updateCouponStatus(c.id, 'lost')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>KAYBETTİ</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }) : <p style={{ textAlign: 'center', color: '#666' }}>Henüz {selectedType.name} eklenmedi.</p>}
            </div>
        </div>
    );
}

function PredictionCard({ item, userData }) {
    const [showAnalysis, setShowAnalysis] = useState(false);

    const isAdmin = userData?.role === 'admin';

    const handleDelete = async () => {
        if (!window.confirm('Bu tahmini silmek istediğinize emin misiniz?')) return;
        try {
            await setDoc(doc(db, 'predictions', item.id), { hiddenFromDaily: true }, { merge: true });
            alert('Tahmin başarıyla silindi.');
        } catch (e) {
            console.error(e);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const updateStatus = async (status) => {
        try {
            await setDoc(doc(db, 'predictions', item.id), { status }, { merge: true });
        } catch (e) {
            console.error(e);
            alert('Durum güncelleme başarısız oldu.');
        }
    };

    const homeTeam = item.homeTeam || item.home_team || 'Ev Sahibi';
    const awayTeam = item.awayTeam || item.away_team || 'Deplasman';
    const isPremium = item.isPremium || item.categoryKey === 8 || item.categoryKey === '8';
    const hasAnalysis = !!item.analysis;
    const hasOddsGrid = item['2_5_ust'] || item['3_5_ust'] || item['ms_5_5_ust'] || item.kategori;

    return (
        <div
            className="prediction-card"
            style={{
                // Explicitly overriding styles to match IlkYariGol exactly
                background: '#2e3335',
                border: '3px solid #006A4E',
                borderRadius: '20px',
                padding: '24px',
                transition: 'all 0.3s ease',
                display: 'block', // Reset flex from generic class if needed
                minHeight: 'auto',
                position: 'relative'
            }}
        >
            {/* Top Right Badges (Floating) */}
            <div className="card-header-overlay" style={{ top: 10, right: 10, position: 'absolute' }}>
                {isPremium && <span className="premium-badge-icon">★</span>}
            </div>

            {/* Kazandı / Kaybetti Icon Top Left */}
            {item.status && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: item.status === 'won' ? '#22c55e' : '#ef4444',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 10
                }}>
                    {item.status === 'won' ? '✓' : '✗'}
                </div>
            )}

            {/* Lig Bilgisi */}
            {item.league && (
                <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'rgba(253, 185, 19, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    textAlign: 'center'
                }}>
                    {item.league}
                </div>
            )}

            {/* Takımlar ve Bugün - ILK YARI GOL STYLE */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
            }}>
                {/* Ev Sahibi */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img src={getTeamLogo(homeTeam)} alt={homeTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{homeTeam}</span>
                </div>

                {/* Ortada */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                    {(item.categoryKey === 0 || item.categoryKey === '0') ? (
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#FDB913', fontStyle: 'italic' }}>VS</span>
                    ) : (
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#FDB913', textTransform: 'uppercase' }}>
                            {item.time && item.time !== '20:00' ? item.time : 'BUGÜN'}
                        </span>
                    )}
                </div>

                {/* Deplasman */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img src={getTeamLogo(awayTeam)} alt={awayTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{awayTeam}</span>
                </div>
            </div>

            {/* Content Area - HIDDEN FOR ILK YARI GOL (Cat 0) */}
            {!(item.categoryKey === 0 || item.categoryKey === '0') && (
                <div style={{ marginTop: '20px' }}>
                    {hasAnalysis ? (
                        <div className="premium-analysis-container">
                            <p className="premium-analysis-text">{item.analysis}</p>
                        </div>
                    ) : null}

                    {/* Odds / Predictions Area - 2-Column List */}
                    {hasOddsGrid ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '10px' }}>
                            {[
                                { key: '2_5_ust', label: '2.5 Üst' },
                                { key: '3_5_ust', label: '3.5 Üst' },
                                { key: 'ms_5_5_ust', label: 'MS 5.5 Üst' },
                                { key: 'kategori', label: 'Tahmin', isGeneric: true }
                            ].map(prop => {
                                const val = item[prop.key];
                                if (!val) return null;

                                let predName = prop.label;
                                let oddsVal = val;
                                if (prop.isGeneric) {
                                    predName = val;
                                    oddsVal = item.odds || '-';
                                } else {
                                    predName = prop.label;
                                    oddsVal = val;
                                }

                                return (
                                    <div key={prop.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>TAHMİN</div>
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#4ade80' }}>{predName}</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>ORAN</div>
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--gold)' }}>{oddsVal}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Default Fallback for generic items without specific keys */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>TAHMİN</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#4ade80' }}>{item.prediction || '-'}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>ORAN</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--gold)' }}>{item.odds || '-'}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Card & Corner Stats (If needed, keep them but styled nicely) */}
            {item.categoryKey === 3 && (
                <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {/* ... (Existing logic for Card stats kept simple or refactored if requested, but user said EXCLUDE Kart Analiz etc. from this request) */}
                    {/* Actually, user said: "kart analiz-korner analiz ... HARİÇ. diğer menülerde ki kart boyutu ..." 
                        So I should probably NOT render this component style for category 3 at all? 
                        App.jsx uses 'Kart' and 'Korner' components for those routes now. 
                        So PredictionCard is likely only used for generic categories (Tahminciler, etc).
                        So I can keep this block or ignore it safely as Kart/Korner have their own components.
                        I'll leave it but ensure it doesn't break layout.
                     */}
                </div>
            )}

            {/* Sonuçlandırma Butonları */}
            {isAdmin && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '12px'
                }}>
                    <button className="admin-btn delete" onClick={handleDelete} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>SİL</button>
                    <button className="admin-btn won" onClick={() => updateStatus('won')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>KAZANDI</button>
                    <button className="admin-btn lost" onClick={() => updateStatus('lost')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>KAYBETTİ</button>
                </div>
            )}
        </div>
    );
}






function CategoryScreen({ category, onBack, userData, onNavigate }) {
    if (!category || category.key === undefined || category.key === null) return <div className="loading"><div className="spinner" /></div>;
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const isVipCategory = category.key === 8;
    // VIP checks removed temporarily
    const IS_BOT_MENU = [0, 4, 6, 7].includes(category.key);
    const IS_CARD_KORNER_MENU = category.key === 3;
    const IS_COUPON_MENU = category.key === 20;

    useEffect(() => {

        setLoading(true);

        const q = query(collection(db, 'predictions'));

        const unsub = onSnapshot(q, (snap) => {
            const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));


            let filtered = allDocs.filter(item => {
                // categoryKey'i her zaman integer olarak karşılaştır (admin integer kaydediyor)
                const itemKey = typeof item.categoryKey === 'string' ? parseInt(item.categoryKey) : item.categoryKey;
                return itemKey === category.key && !item.hiddenFromDaily;
            });

            console.log(`CategoryScreen: Filtered to ${filtered.length} items for category key ${category.key}`);

            if (IS_CARD_KORNER_MENU && selectedSubCategory) {
                filtered = filtered.filter(p => {
                    if (selectedSubCategory === 'card') return p.cardHomeAvg || p.cardAwayAvg || p.refereeInfo;
                    if (selectedSubCategory === 'corner') return p.cornerHomeAvg || p.cornerAwayAvg || p.cornerGenAvg;
                    return true;
                });

            }

            filtered.sort((a, b) => {
                const getMs = (ts) => {
                    if (!ts) return Date.now();
                    if (ts.toMillis) return ts.toMillis();
                    if (ts.seconds) return ts.seconds * 1000;
                    return 0;
                };
                return getMs(b.createdAt) - getMs(a.createdAt);
            });

            setPredictions(filtered);
            setLoading(false);
        }, (error) => {
            console.error('Firebase Error:', error);
            setLoading(false);
        });

        // Register listener for cleanup
        listenerRegistry.register(`category-${category.key}`, unsub);

        return () => {
            listenerRegistry.unregister(`category-${category.key}`);
        };
    }, [category.key, selectedSubCategory, IS_BOT_MENU, IS_CARD_KORNER_MENU]);

    const filtered = selectedLeague ? predictions.filter(p => p.league === selectedLeague) : predictions;

    return (
        <div className="category-page">
            <div className="category-header">
                <button className="category-back-btn" onClick={selectedLeague ? () => setSelectedLeague(null) : onBack}>{Icons.back}</button>
                <h1 className="category-title">
                    {selectedLeague ? selectedLeague : category.title}
                </h1>
            </div>
            <div className="predictions-list">
                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : filtered.length > 0 ? (
                    filtered.map(p => <PredictionCard key={p.id} item={{ ...p, categoryKey: category.key }} userData={userData} />)
                ) : (
                    <p style={{ textAlign: 'center', color: '#666', padding: '50px' }}>Tahmin bulunamadı.</p>
                )}
            </div>
        </div>
    );
}

const Skeleton = ({ type }) => {
    if (type === 'card') return <div className="skeleton skeleton-card" />;
    if (type === 'text-short') return <div className="skeleton skeleton-text short" />;
    if (type === 'text-medium') return <div className="skeleton skeleton-text medium" />;
    if (type === 'title') return <div className="skeleton skeleton-title" />;
    if (type === 'avatar') return <div className="skeleton skeleton-avatar" />;
    return <div className="skeleton skeleton-text" />;
};

export default function App() {

    const [route, setRoute] = useState(() => {
        if (window.location.pathname === '/auth/action') {
            const p = new URLSearchParams(window.location.search);
            if (p.get('mode') && p.get('oobCode')) return 'auth-action';
        }
        return 'home';
    });
    const [routeParams, setRouteParams] = useState(() => {
        if (window.location.pathname === '/auth/action') {
            const p = new URLSearchParams(window.location.search);
            const mode = p.get('mode');
            const oobCode = p.get('oobCode');
            if (mode && oobCode) return { mode, oobCode };
        }
        return {};
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [legalType, setLegalType] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [appBannerDismissed, setAppBannerDismissed] = useState(() => sessionStorage.getItem('appBannerDismissed') === '1');

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const el = document.createElement('style'); el.textContent = styles; document.head.appendChild(el);
        return () => el.remove();
    }, []);

    useEffect(() => {
        // 3 saniye timeout - loading takılmasını önle
        const loadingTimeout = setTimeout(() => {
            console.warn('Auth loading timeout - forcing load complete');
            setLoading(false);
        }, 3000);

        const unsub = onAuthStateChanged(auth, async (u) => {
            try {
                if (u) {
                    // Sunucudan taze emailVerified state'i çek (stale local cache'i önlemek için)
                    try { await u.reload(); } catch (_) {}
                    // KRİTİK: Email doğrulanmadıysa kullanıcıyı session'a alma
                    /* 
                    if (!u.emailVerified) {
                        setUser(null);
                        setUserData(null);
                        clearTimeout(loadingTimeout);
                        setLoading(false);
                        return;
                    }
                    */

                    setUser(u);
                    try {
                        const d = await getDoc(doc(db, 'users', u.uid));
                        if (d.exists()) {
                            let data = d.data();

                            const vipMeta = getVipMeta(data);
                            if (data.isVip && vipMeta.expired) {
                                try {
                                    await setDoc(doc(db, 'users', u.uid), {
                                        isVip: false,
                                        vipTier: null,
                                        vipExpiredAt: serverTimestamp(),
                                        vipUpdatedAt: serverTimestamp()
                                    }, { merge: true });
                                } catch (vipErr) {
                                    console.error('VIP expiry update failed:', vipErr);
                                }
                                data = { ...data, isVip: false, vipTier: null };
                            }

                            // Sequential ID Assignment if missing
                            if (!data.displayId) {
                                try {
                                    const isUserAdmin = data.role === 'admin' || data.isAdmin;
                                    const assignedId = await ensureUserDisplayId(u.uid, isUserAdmin ? 20260001 : null);
                                    data.displayId = assignedId;
                                } catch (idErr) {
                                    console.error('DisplayId atanamadı:', idErr);
                                    data.displayId = Math.floor(20260000 + Math.random() * 9999);
                                }
                            }

                            // Eski isAdmin alanını yeni role sistemine çevir
                            if (data.isAdmin && !data.role) {
                                try { await setDoc(doc(db, 'users', u.uid), { role: 'admin' }, { merge: true }); } catch (e2) { console.error('Role update failed:', e2); }
                                setUserData({ ...data, role: 'admin' });
                            } else if (!data.role) {
                                try { await setDoc(doc(db, 'users', u.uid), { role: 'user' }, { merge: true }); } catch (e2) { console.error('Role update failed:', e2); }
                                setUserData({ ...data, role: 'user' });
                            } else {
                                setUserData(data);
                            }
                        } else {
                            // User doc yok - oluştur
                            let nextDisplayId = null;
                            try { nextDisplayId = await getNextUserId(); } catch (idErr) { console.error('DisplayId oluşturulamadı:', idErr); nextDisplayId = Math.floor(20260000 + Math.random() * 9999); }
                            const initData = { uid: u.uid, email: u.email, username: u.displayName || u.email.split('@')[0], displayId: nextDisplayId, isAdmin: false, isPremium: false, role: 'user', createdAt: serverTimestamp(), ...buildTrialVipFields() };
                            try { await setDoc(doc(db, 'users', u.uid), initData); } catch (setErr) { console.error('User doc oluşturulamadı:', setErr); }
                            setUserData(initData);
                        }
                    } catch (e) {
                        console.error('Auth flow hatası:', e);
                        // Fallback: Firestore'a erişilemese bile kullanıcıyı giriş yaptır
                        setUserData({ uid: u.uid, email: u.email, username: u.displayName || u.email.split('@')[0], isAdmin: false, isVip: false, role: 'user', displayId: null });
                    }
                } else {
                    setUser(null);
                    setUserData(null);
                }
            } catch (fatalErr) {
                console.error('onAuthStateChanged fatal error:', fatalErr);
                setUser(null);
                setUserData(null);
            }
            clearTimeout(loadingTimeout);
            setLoading(false);
        });
        return () => { unsub(); clearTimeout(loadingTimeout); };
    }, []);

    useEffect(() => {
        const handlePopState = (event) => {
            if (event.state && event.state.route) {
                setRoute(event.state.route);
                setRouteParams(event.state.params || {});
            } else {
                setRoute('home');
                setRouteParams({});
            }
        };

        window.addEventListener('popstate', handlePopState);

        // İlk yüklemede mevcut route'u tarihe işle
        if (!window.history.state) {
            window.history.replaceState({ route: 'home', params: {} }, '');
        }

        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Çevrimiçi kullanıcı takibi: lastActive'i her 2 dakikada güncelle
    useEffect(() => {
        if (!user) return;
        const updateActive = () => {
            try {
                updateDoc(doc(db, 'users', user.uid), { lastActive: serverTimestamp() });
            } catch (_) {}
        };
        updateActive();
        const interval = setInterval(updateActive, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    // Push Notification kurulumu (sadece native Capacitor'da çalışır)
    useEffect(() => {
        if (!user || !isNative()) return;
        const setupPush = async () => {
            try {
                if (!PushNotifications) return;
                const permResult = await PushNotifications.requestPermissions();
                if (permResult.receive !== 'granted') return;
                await PushNotifications.register();
                const regListener = await PushNotifications.addListener('registration', async (token) => {
                    try {
                        await updateDoc(doc(db, 'users', user.uid), { fcmToken: token.value });
                        await dbSet(dbRef(rtdb, 'fcmTokens/' + user.uid), token.value);
                    } catch (_) {}
                });
                const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    const data = action.notification.data;
                    if (data?.route) {
                        setRoute(data.route);
                        setRouteParams({});
                    }
                });
                return () => {
                    regListener.remove();
                    actionListener.remove();
                };
            } catch (_) {}
        };
        const cleanup = setupPush();
        return () => { cleanup.then(fn => fn && fn()); };
    }, [user]);

    const navigate = useCallback((r, p = {}, push = true) => {
        if (r === 'about_modal') {
            setLegalType('about');
            return;
        }

        setRoute(r);
        setRouteParams(p);

        // Eğer geri butonu ile gelmediysek tarihe ekle
        if (push !== false) {
            window.history.pushState({ route: r, params: p }, '');
        }

        // Menü ziyaret analitik takibi
        if (user && r && !['auth', 'admin', 'home'].includes(r)) {
            try {
                setDoc(doc(db, 'analytics', 'menuStats'), { [r]: increment(1) }, { merge: true });
            } catch (_) {}
        }
    }, [user]);
    const showAlert = useCallback((m, t) => setAlert({ message: m, type: t }), []);

    // Android geri tuşu yönetimi
    useEffect(() => {
        let backHandler;
        try {
            if (CapApp) {
                backHandler = CapApp.addListener('backButton', () => {
                    if (window.history.state && window.history.length > 1) {
                        window.history.back();
                    } else {
                        CapApp.exitApp();
                    }
                });
            }
        } catch (_) {}
        const onPopState = (e) => {
            if (e.state?.route) {
                setRoute(e.state.route);
                setRouteParams(e.state.params || {});
            } else {
                setRoute('home');
                setRouteParams({});
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => {
            window.removeEventListener('popstate', onPopState);
            if (backHandler?.remove) backHandler.remove();
        };
    }, []);

    if (loading && route !== 'auth' && route !== 'auth-action') return <div className="auth-loading-screen"><div className="spinner" /><h3>Oddsy Yükleniyor...</h3></div>;

    const render = () => {
        // Giriş gerektiren sayfalar - kullanıcı giriş yapmamışsa auth ekranını göster
        const publicRoutes = ['home', 'auth', 'auth-action', 'abonelik', 'performance-summary',
            'dropping-odds', 'category', 'ilk-yari-gol', 'iy-ms-tahminleri',
            'gunun-surprizleri', 'gunun-tercihleri'];
        if (!user && !publicRoutes.includes(route)) {
            return <AuthScreen onBack={() => navigate('home')} showAlert={showAlert} initialIsLogin={true} />;
        }

        switch (route) {
            case 'auth-action': return <AuthAction mode={routeParams.mode} oobCode={routeParams.oobCode} onNavigate={navigate} />;
            case 'auth': return <AuthScreen onBack={() => navigate('home')} showAlert={showAlert} initialIsLogin={routeParams.isLogin !== undefined ? routeParams.isLogin : true} />;
            case 'profile': return <ProfileScreen user={user} userData={userData} onBack={r => navigate(r || 'home')} showAlert={showAlert} />;
            case 'admin':
                if (userData?.role === 'admin') {
                    const AdminPanel = () => {
                        const [adminView, setAdminView] = useState('content');
                        const [notifTitle, setNotifTitle] = useState('');
                        const [notifBody, setNotifBody] = useState('');
                        const [notifRoute, setNotifRoute] = useState('');
                        const [notifLoading, setNotifLoading] = useState(false);
                        const [notifMsg, setNotifMsg] = useState(null); // { text, type }
                        const [shareLoading, setShareLoading] = useState(null); // option id

                        const SHARE_OPTIONS = [
                            { id: 'gunun-kuponu',      label: 'Günün Kuponları',        metin: "Oddsy'de Günün Banko Kuponu yayında!\n\noddsw.com.tr", imageUrl: 'https://i.ibb.co/3mb3dcx0/banko.png' },
                            { id: 'gunun-tercihleri',  label: 'Günün Tercihleri',       metin: "Oddsy'de Günün Tercihleri yayında!\n\noddsw.com.tr",   imageUrl: null },
                            { id: 'kupon-kazandi',     label: 'Günün Kuponu Kazandı',   metin: "Oddsy Günün Kuponu KAZANDI!\n\noddsw.com.tr",           imageUrl: null },
                            { id: 'editor-tercihleri', label: 'Editör Tercihleri',      metin: "Oddsy'de Editör Tercihleri yayında!\n\noddsw.com.tr",   imageUrl: null },
                            { id: 'editor-kazandi',    label: "Editörün tercihi kazandı", metin: "Oddsy Editörün Tercihi KAZANDI!\n\noddsw.com.tr",     imageUrl: null },
                        ];

                        const handleShare = async (option) => {
                            setShareLoading(option.id);
                            try {
                                const token  = import.meta.env.VITE_GITHUB_TOKEN;
                                const repo   = import.meta.env.VITE_GITHUB_REPO;
                                const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';
                                if (!token || !repo) throw new Error('VITE_GITHUB_TOKEN veya VITE_GITHUB_REPO tanımlı değil');
                                const res = await fetch(
                                    `https://api.github.com/repos/${repo}/actions/workflows/paylas.yml/dispatches`,
                                    {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Accept': 'application/vnd.github.v3+json',
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ ref: branch, inputs: { tur: option.id, metin: option.metin, image_url: option.imageUrl || '' } }),
                                    }
                                );
                                if (res.status === 204) {
                                    showAlert(`"${option.label}" paylaşımı başlatıldı! (~30-60 sn içinde yayınlanır)`, 'success');
                                } else {
                                    const data = await res.json().catch(() => ({}));
                                    throw new Error(data.message || `GitHub API hatası: ${res.status}`);
                                }
                            } catch (err) {
                                showAlert('Paylaşım hatası: ' + err.message, 'error');
                            } finally {
                                setShareLoading(null);
                            }
                        };

                        const sendNotification = async () => {
                            if (!notifTitle.trim() || !notifBody.trim()) return;
                            setNotifLoading(true);
                            setNotifMsg(null);
                            try {
                                const idToken = await auth.currentUser.getIdToken(true);
                                const resp = await fetch('/api/send-notification', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ title: notifTitle, body: notifBody, route: notifRoute, idToken }),
                                });
                                let result;
                                try { result = await resp.json(); } catch { result = {}; }
                                if (!resp.ok) throw new Error(result.error || `HTTP ${resp.status}`);
                                if (result.sent > 0) {
                                    setNotifMsg({ text: `✅ Gönderildi! ${result.sent}/${result.total} kullanıcı`, type: 'success' });
                                    setNotifTitle(''); setNotifBody(''); setNotifRoute('');
                                } else {
                                    setNotifMsg({ text: `⚠️ Alıcı yok (${result.message || 'FCM tokeni olan kullanıcı bulunamadı'})`, type: 'warning' });
                                }
                            } catch (e) {
                                setNotifMsg({ text: '❌ Hata: ' + e.message, type: 'error' });
                            }
                            setNotifLoading(false);
                        };

                        return (
                            <div className="admin-route-wrapper" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
                                <button className="back-btn" onClick={() => navigate('home')}>Geri</button>
                                <div className="admin-tab-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, marginBottom: 20 }}>
                                    <button className={`hero-btn secondary ${adminView === 'dashboard' ? 'active' : ''}`} style={{ fontSize: '12px', padding: '10px 16px' }} onClick={() => setAdminView('dashboard')}>Dashboard</button>
                                    <button className={`hero-btn secondary ${adminView === 'content' ? 'active' : ''}`} style={{ fontSize: '12px', padding: '10px 16px' }} onClick={() => setAdminView('content')}>İçerik Yönetimi</button>
                                    <button className={`hero-btn secondary ${adminView === 'bildirim' ? 'active' : ''}`} style={{ fontSize: '12px', padding: '10px 16px' }} onClick={() => setAdminView('bildirim')}>🔔 Bildirim Gönder</button>
                                    <button className={`hero-btn secondary ${adminView === 'paylas' ? 'active' : ''}`} style={{ fontSize: '12px', padding: '10px 16px' }} onClick={() => setAdminView('paylas')}>𝕏 Paylaş</button>
                                </div>
                                <div style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 10 }}>
                                    {adminView === 'dashboard' && <AdminDashboard onBack={navigate} userData={userData} />}
                                    {adminView === 'content' && <AdminScreen onBack={() => navigate('home')} showAlert={showAlert} userData={userData} />}
                                    {adminView === 'paylas' && (
                                        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <h3 style={{ color: 'var(--gold)', marginBottom: 8 }}>𝕏 X'te Paylaş</h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Seçtiğin içerik ~30-60 saniye içinde X hesabında yayınlanır.</p>
                                            {SHARE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleShare(opt)}
                                                    disabled={shareLoading !== null}
                                                    style={{
                                                        padding: '12px 16px',
                                                        borderRadius: 8,
                                                        border: '1px solid var(--primary-green)',
                                                        background: shareLoading === opt.id ? 'var(--primary-green)' : 'transparent',
                                                        color: shareLoading === opt.id ? '#000' : 'var(--text-primary)',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: shareLoading !== null ? 'not-allowed' : 'pointer',
                                                        textAlign: 'left',
                                                        opacity: shareLoading !== null && shareLoading !== opt.id ? 0.5 : 1,
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {shareLoading === opt.id ? '⏳ Paylaşılıyor...' : `↗ ${opt.label}`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {adminView === 'bildirim' && (
                                        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <h3 style={{ color: 'var(--gold)', marginBottom: 8 }}>🔔 Push Bildirim Gönder</h3>
                                            <input
                                                placeholder="Başlık"
                                                value={notifTitle}
                                                onChange={e => setNotifTitle(e.target.value)}
                                                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontSize: 14 }}
                                            />
                                            <textarea
                                                placeholder="Mesaj"
                                                value={notifBody}
                                                onChange={e => setNotifBody(e.target.value)}
                                                rows={3}
                                                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
                                            />
                                            <input
                                                placeholder="Yönlendirme (opsiyonel, örn: gunun-tercihleri)"
                                                value={notifRoute}
                                                onChange={e => setNotifRoute(e.target.value)}
                                                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontSize: 14 }}
                                            />
                                            <button
                                                className="hero-btn primary"
                                                onClick={sendNotification}
                                                disabled={notifLoading || !notifTitle.trim() || !notifBody.trim()}
                                                style={{ opacity: notifLoading ? 0.6 : 1 }}
                                            >
                                                {notifLoading ? 'Gönderiliyor...' : '🚀 Tüm Kullanıcılara Gönder'}
                                            </button>
                                            {notifMsg && (
                                                <div style={{
                                                    padding: '10px 14px',
                                                    borderRadius: 8,
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    wordBreak: 'break-word',
                                                    background: notifMsg.type === 'success' ? 'rgba(74,222,128,0.15)' : notifMsg.type === 'warning' ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                                                    color: notifMsg.type === 'success' ? '#4ade80' : notifMsg.type === 'warning' ? '#fbbf24' : '#f87171',
                                                    border: `1px solid ${notifMsg.type === 'success' ? '#4ade80' : notifMsg.type === 'warning' ? '#fbbf24' : '#f87171'}`,
                                                }}>
                                                    {notifMsg.text}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
            case 'moderator':
                if (userData?.role === 'moderator') return <ModeratorScreen onBack={navigate} showAlert={showAlert} />;
                return <div className="loading">Yetkisiz erişim</div>;
            case 'performance-summary': return <PerformanceSummaryScreen onBack={() => navigate('home')} />;
            case 'abonelik': return <AbonelikScreen onBack={() => navigate('home')} userData={userData} user={user} onNavigate={navigate} />;
            case 'category': return <CategoryScreen category={routeParams} onBack={() => navigate('home')} userData={userData} onNavigate={navigate} />;
            case 'coupons': return (
                <VipGate userData={userData} user={user} onNavigate={navigate}>
                    <CouponScreen onBack={() => navigate('home')} showAlert={showAlert} userData={userData} />
                </VipGate>
            );
            case 'yapay-zeka-analizleri': return (
                <VipGate userData={userData} user={user} onNavigate={navigate}>
                    <YapayZeka />
                </VipGate>
            );
            case 'manuel-analiz': return (
                <VipGate userData={userData} user={user} onNavigate={navigate}>
                    <ManuelAnaliz />
                </VipGate>
            );
            case 'kart-analizi': return (
                <VipGate userData={userData} user={user} onNavigate={navigate}>
                    <Kart onBack={() => navigate('home')} />
                </VipGate>
            );
            case 'korner-analizi': return (
                <VipGate userData={userData} user={user} onNavigate={navigate}>
                    <Korner onBack={() => navigate('home')} />
                </VipGate>
            );
            case 'dropping-odds': return <DroppingOddsModal onClose={() => navigate('home')} />;
            case 'ilk-yari-gol': return (
                <div style={{ paddingTop: '20px' }}>
                    <div className="category-header">
                        <button className="category-back-btn" onClick={() => navigate('home')}>{Icons.back}</button>
                    </div>
                    <IlkYariGolListesi userData={userData} />
                </div>
            );
            case 'iy-ms-tahminleri': return (
                <div style={{ paddingTop: '20px' }}>
                    <div className="category-header">
                        <button className="category-back-btn" onClick={() => navigate('home')}>{Icons.back}</button>
                    </div>
                    <IYMSTahminleri userData={userData} />
                </div>
            );
            case 'gunun-surprizleri': return (
                <div style={{ paddingTop: '20px' }}>
                    <div className="category-header">
                        <button className="category-back-btn" onClick={() => navigate('home')}>{Icons.back}</button>
                    </div>
                    <GununSurprizleri userData={userData} />
                </div>
            );
            case 'gunun-tercihleri': return (
                <div style={{ paddingTop: '20px' }}>
                    <div className="category-header">
                        <button className="category-back-btn" onClick={() => navigate('home')}>{Icons.back}</button>
                    </div>
                    <GununTercihleri userData={userData} />
                </div>
            );

            default: return <HomePage user={user} userData={userData} onLoginClick={() => navigate(user ? 'profile' : 'auth')} onNavigate={navigate} onShowLegal={setLegalType} />;
        }
    };

    return (
        <ErrorBoundary>
            <div className={`app${!appBannerDismissed ? ' banner-visible' : ''}`}>
                {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
                {legalType && <LegalModal type={legalType} onClose={() => setLegalType(null)} />}
                {!appBannerDismissed && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)',
                        borderBottom: '1px solid rgba(253,185,19,0.3)',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                    }} className="mobile-app-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <img src="/oddsylogo.png" alt="Oddsy" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>Oddsy Uygulaması</div>
                                <div style={{ fontSize: '10px', color: 'rgba(253,185,19,0.8)', lineHeight: 1.2 }}>Daha iyi deneyim için indir</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a
                                href="https://github.com/camelbox27-lab/oddsy-web/releases/download/v1.0/Oddsy.apk"
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FDB913', borderRadius: '8px', padding: '5px 10px', textDecoration: 'none' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M3.18 23a1 1 0 0 1-.68-1.71L15.29 8.5l-2.83-2.83L3.5 14.63a1 1 0 1 1-1.41-1.41L12.46 2.84a1 1 0 0 1 1.41 0l4.24 4.24a1 1 0 0 1 0 1.41L3.86 22.74A1 1 0 0 1 3.18 23z" fill="#333"/>
                                    <path d="M2.5 2.09v19.82L14.09 12 2.5 2.09z" fill="#333"/>
                                </svg>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#333' }}>Android</span>
                            </a>
                            <button
                                onClick={() => { setAppBannerDismissed(true); sessionStorage.setItem('appBannerDismissed', '1'); }}
                                style={{ background: 'none', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}
                            >×</button>
                        </div>
                    </div>
                )}
                <Header
                    onMenuOpen={() => setSidebarOpen(true)}
                    user={user}
                    onProfileClick={() => navigate(user ? 'profile' : 'auth')}
                    onNavigate={navigate}
                    currentCategory={routeParams.key}
                    theme={theme}
                    onThemeToggle={toggleTheme}
                />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={navigate} currentRoute={route} userData={userData} />
                <main className="main-content">{render()}</main>
                <BottomNav onNavigate={navigate} onMenuOpen={() => setSidebarOpen(true)} currentRoute={route} />
            </div>
        </ErrorBoundary>
    );
}
