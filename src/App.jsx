import {
    createUserWithEmailAndPassword,
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
    onSnapshot,
    query,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useState } from 'react';

import DroppingOddsModal from './components/DroppingOddsModal';
import Kart from './components/Kart';
import Korner from './components/Korner';
import OddsyKGAnaliz from './components/OddsyKGAnaliz';
import { auth, db, functions } from './firebaseConfig';
import GununSurprizleri from './GununSurprizleri';
import GununTercihleri from './GununTercihleri';
import { getTeamLogo, handleLogoError } from './helper';



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
  font-size: 28px;
  font-weight: 900;
  color: var(--gold);
  letter-spacing: 2px;
  cursor: pointer;
  text-transform: uppercase;
  background: linear-gradient(to bottom, var(--gold) 0%, #ca940f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
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
    border: 3px solid #006A4E !important;
    border-radius: 20px !important;
    padding: 24px !important;
    padding-top: 45px !important; /* Space for the top-left label */
    box-shadow: 
        0 15px 40px rgba(0,0,0,0.5),
        inset 0 0 0 1px rgba(0, 106, 78, 0.3),
        0 0 20px rgba(0, 106, 78, 0.2) !important;
    display: flex;
    flex-direction: column;
    min-height: 220px !important;
    height: auto !important;
    position: relative;
    max-width: 850px !important;
    margin: 15px auto !important;
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
        padding: 16px !important;
        padding-top: 35px !important;
        min-height: 180px !important;
        margin: 10px auto !important;
        border-width: 2px !important;
    }
    .premium-logo-large {
        width: 50px !important;
        height: 50px !important;
    }
    .premium-team-name-text {
        font-size: 14px !important;
    }
    .premium-header-teams {
        gap: 20px !important;
        margin-bottom: 15px !important;
        padding-bottom: 10px !important;
    }
    .premium-vs-divider {
        font-size: 18px !important;
    }
    .card-top-left-label {
        font-size: 11px !important;
        left: 15px !important;
        top: 10px !important;
    }
    .premium-badge-box {
        min-width: 80px !important;
        padding: 6px 12px !important;
    }
    .premium-badge-value {
        font-size: 14px !important;
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
    border: 3px solid #006A4E;
    border-radius: 20px;
    padding: 30px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    max-width: 850px !important;
    width: 100%;
    min-height: 280px !important;
    height: auto !important;
    margin: 20px auto;
    position: relative; /* Added for absolute positioning validity */
    box-shadow: 
        0 15px 40px rgba(0,0,0,0.5),
        inset 0 0 0 1px rgba(0, 106, 78, 0.3),
        0 0 20px rgba(0, 106, 78, 0.2);
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
    bottom: 25px;
    left: 30px;
    display: flex;
    gap: 10px;
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
  .menu-btn { display: flex !important; }
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
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
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
    { id: 'cat_1', title: "ILK YARI GOL LISTESI", key: 0, icon: '⚽', color: "#10B981", route: 'category' },
    { id: 'cat_coupons_new', title: "GÜNÜN KUPONLARI", key: 20, icon: '🎫', color: "#f87171", route: 'coupons' },
    { id: 'cat_3', title: "TAHMINCILER", key: 2, icon: '👥', color: "#a78bfa", route: 'category' },
    { id: 'cat_kart_analiz', title: "KART ANALİZ BOTU", key: 31, icon: '🟨', color: "#FFD700", route: 'kart-analizi' },
    { id: 'cat_korner_analiz', title: "KORNER ANALİZ BOTU", key: 32, icon: '🚩', color: "#10B981", route: 'korner-analizi' },
    { id: 'cat_5', title: "GUNUN TERCIHLERI", key: 4, icon: '⭐', color: "#4ade80", route: 'gunun-tercihleri' },
    { id: 'cat_7', title: "SURPRIZLER", key: 6, icon: '💥', color: "#fb7185", route: 'gunun-surprizleri' },
    { id: 'cat_8', title: "IY / MS TAHMINLERI", key: 7, icon: '🔄', color: "#FFD700", route: 'category' },
    { id: 'cat_9', title: "EDITORUN SECIMI", key: 8, icon: '✍️', color: "#4ade80", route: 'category' },
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
    const topCategories = [
        { id: 'cat_ai_new', title: "YAPAY ZEKA ANALİZLERİ", key: 10, route: 'yapay-zeka-analizleri' },
        { id: 'cat_2', title: "İLK YARI GOL LİSTESİ", key: 0, route: 'category' },
        { id: 'cat_8_new', title: "İY / MS TAHMİNLERİ", key: 7, route: 'category' },
        { id: 'cat_coupons', title: "GÜNÜN KUPONLARI", key: 20, route: 'coupons' },
        { id: 'cat_kart_analiz_top', title: "KART ANALİZİ", key: 31, route: 'kart-analizi' },
        { id: 'cat_korner_analiz_top', title: "KORNER ANALİZİ", key: 32, route: 'korner-analizi' },
        { id: 'cat_4', title: "TAHMİNCİLER", key: 2, route: 'category' },
        { id: 'cat_6', title: "GÜNÜN TERCİHLERİ", key: 4, route: 'category' },
        { id: 'cat_7', title: "GÜNÜN SÜRPRİZLERİ", key: 6, route: 'category' },
        { id: 'cat_8', title: "EDİTÖRÜN SEÇİMİ", key: 8, route: 'category' },
    ];

    const handleCategoryClick = (cat) => {
        if (['coupons', 'yapay-zeka-analizleri', 'kart-analizi', 'korner-analizi'].includes(cat.route)) {
            onNavigate(cat.route);
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
                {topCategories.map(cat => (
                    <div
                        key={cat.id}
                        className={`header-nav-item ripple ${currentCategory === cat.key ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(cat)}
                    >
                        {cat.title}
                    </div>
                ))}
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
                    <div className="sidebar-item" onClick={() => { onNavigate('stats'); onClose(); }}>
                        <span className="sidebar-item-icon">📊</span>
                        <span className="sidebar-item-text">İstatistikler</span>
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
        <div className="home-page" style={{ position: 'relative', minHeight: '100vh' }}>
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Oddsy ile Akıllı Futbol Tahminleri</h1>
                    <p className="hero-subtitle">Yapay zeka oran analiz sistemiyle güçlendirilmiş, günün öne çıkan karşılaşmalarını sizin için sadeleştiren yeni nesil tahmin platformu.</p>
                    <div className="hero-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="hero-btn primary" onClick={() => onNavigate('auth', { isLogin: false })}>Hemen Başla</button>
                        <button className="hero-btn secondary" onClick={onLoginClick}>Giriş Yap</button>
                    </div>
                </div>
            </div>

            <div className="analysis-section" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: '100px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 className="analysis-title">Oddsy Günün Analizi</h2>
                    <button className="analysis-btn" onClick={() => onNavigate('category', MENU_ITEMS?.find(m => m.key === 8))}>Özel Analizleri Görüntüle</button>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginTop: '30px',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <DroppingOddsModal />
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

        </div>
    );
}

function AuthScreen({ onBack, showAlert, initialIsLogin = true }) {
    const [isLogin, setIsLogin] = useState(initialIsLogin);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    useEffect(() => {
        setIsLogin(initialIsLogin);
    }, [initialIsLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return showAlert('Lütfen bilgileri eksiksiz girin.', 'error');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email.trim(), password);
                showAlert('Giriş başarılı!', 'success');
                onBack();
            } else {
                const { user: newUser } = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
                await sendEmailVerification(newUser);
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
                showAlert('Kayıt başarılı! Lütfen e-postanızı doğrulayın.', 'success');
                setIsLogin(true);
            }
        } catch (err) {
            console.error('Firebase Auth Error:', err.code, err.message);
            showAlert('İşlem başarısız: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) return showAlert('Lütfen e-posta adresinizi girin.', 'error');
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            showAlert('Şifre sıfırlama linki e-posta adresinize gönderildi.', 'success');
            setShowForgotPassword(false);
        } catch (err) {
            showAlert('Hata: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (showForgotPassword) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <button className="back-btn" onClick={() => setShowForgotPassword(false)}>{Icons.back} Geri</button>
                    <h1 style={{ marginBottom: 20 }}>Şifremi Unuttum</h1>
                    <form onSubmit={handleForgotPassword}>
                        <div className="form-group">
                            <label className="form-label">E-Posta</label>
                            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta adresinizi girin" />
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
                {isLogin && (
                    <p style={{ marginTop: 15, textAlign: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setShowForgotPassword(true)}>
                            Şifremi Unuttum
                        </span>
                    </p>
                )}
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
        try {
            await signOut(auth);
            showAlert('Başarıyla çıkış yapıldı.', 'success');
            onBack('home');
        } catch (err) {
            showAlert('Çıkış yapılırken bir hata oluştu.', 'error');
        }
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
    const [stats, setStats] = useState({
        totalUsers: 0,
        onlineUsers: 0,
        totalPredictions: 0,
        totalCoupons: 0
    });
    const [menuStats, setMenuStats] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [uSnap, pSnap, cSnap] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'predictions')),
                    getDocs(collection(db, 'coupons'))
                ]);

                const uData = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setUsers(uData);

                const mStats = {};
                pSnap.docs.forEach(d => {
                    const p = d.data();
                    const key = p.categoryKey || 'other';
                    if (!mStats[key]) mStats[key] = { total: 0, won: 0, lost: 0, pending: 0 };
                    mStats[key].total++;
                    if (p.status === 'won') mStats[key].won++;
                    else if (p.status === 'lost') mStats[key].lost++;
                    else mStats[key].pending++;
                });

                setMenuStats(mStats);
                setStats({
                    totalUsers: uData.length,
                    onlineUsers: uData.filter(u =>
                        u.lastActive &&
                        (Date.now() - u.lastActive?.toMillis?.() < 300000)
                    ).length,
                    totalPredictions: pSnap.size,
                    totalCoupons: cSnap.size
                });
                setLoading(false);
            } catch (err) {
                console.error('Veri çekme hatası:', err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        // Kendine admin yetkisi veremez kontrolü
        if (userId === userData.uid && newRole !== 'admin' && userData.role === 'admin') {
            if (!confirm('Kendi admin yetkini kaldırmak istediğine emin misin?')) {
                return;
            }
        }

        const userToUpdate = users.find(u => u.id === userId);
        let tipsterName = userToUpdate?.tipsterName || null;

        // Tahminci yapılıyorsa isim iste
        if (newRole === 'tipster') {
            const newName = prompt(
                "Tahminci adını giriniz:",
                tipsterName || userToUpdate?.username || ""
            );
            if (newName === null) return; // İptal
            if (!newName.trim()) {
                alert('Tahminci adı boş olamaz!');
                return;
            }
            tipsterName = newName.trim();
        } else {
            tipsterName = null; // Tahminci değilse sıfırla
        }

        try {
            // ✅ DOĞRU: Firestore users koleksiyonuna kaydet
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                tipsterName: tipsterName,
                updatedAt: new Date()
            });

            // UI'ı güncelle
            setUsers(users.map(u =>
                u.id === userId
                    ? { ...u, role: newRole, tipsterName }
                    : u
            ));

            console.log('✅ Rol güncellendi:', { userId, newRole, tipsterName });
        } catch (err) {
            console.error('❌ Rol güncelleme hatası:', err);
            alert('Yetki değiştirilemedi: ' + err.message);
        }
    };

    if (loading) return (
        <div className="loading">
            <div className="spinner" />
        </div>
    );

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

            <h1 style={{
                color: 'var(--gold)',
                marginTop: 20,
                marginBottom: 30
            }}>
                Admin Dashboard
            </h1>

            {/* İSTATİSTİKLER */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 15,
                marginBottom: 30
            }}>
                <div style={{
                    background: 'var(--bg-card)',
                    padding: 20,
                    borderRadius: 10,
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: 32,
                        color: 'var(--gold)',
                        fontWeight: 'bold'
                    }}>
                        {stats.totalUsers}
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>
                        Toplam Üye
                    </div>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    padding: 20,
                    borderRadius: 10,
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: 32,
                        color: '#4ade80',
                        fontWeight: 'bold'
                    }}>
                        {stats.onlineUsers}
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>
                        Çevrimiçi
                    </div>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    padding: 20,
                    borderRadius: 10,
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: 32,
                        color: '#10B981',
                        fontWeight: 'bold'
                    }}>
                        {stats.totalPredictions}
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>
                        Toplam Tahmin
                    </div>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    padding: 20,
                    borderRadius: 10,
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: 32,
                        color: '#f87171',
                        fontWeight: 'bold'
                    }}>
                        {stats.totalCoupons}
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>
                        Toplam Kupon
                    </div>
                </div>
            </div>

            {/* KATEGORİ İSTATİSTİKLERİ */}
            <div style={{
                background: 'var(--bg-card)',
                padding: 20,
                borderRadius: 10,
                marginBottom: 30
            }}>
                <h2 style={{
                    color: 'var(--gold)',
                    fontSize: 18,
                    marginBottom: 20
                }}>
                    Kategori İstatistikleri
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 15
                }}>
                    {MENU_ITEMS.map(item => {
                        const s = menuStats[item.key] || {
                            total: 0,
                            won: 0,
                            lost: 0
                        };
                        const winRate = s.total > 0
                            ? ((s.won / (s.won + s.lost || 1)) * 100).toFixed(1)
                            : 0;

                        return (
                            <div
                                key={item.id}
                                style={{
                                    border: '1px solid #444',
                                    padding: 15,
                                    borderRadius: 10
                                }}
                            >
                                <div style={{
                                    color: item.color,
                                    fontWeight: 'bold',
                                    marginBottom: 10,
                                    fontSize: 12
                                }}>
                                    {item.title}
                                </div>
                                <div style={{ fontSize: 11, color: '#aaa' }}>
                                    Toplam: {s.total}
                                </div>
                                <div style={{ fontSize: 11, color: '#4ade80' }}>
                                    Kazanan: {s.won}
                                </div>
                                <div style={{ fontSize: 11, color: '#f87171' }}>
                                    Kaybeden: {s.lost}
                                </div>
                                <div style={{
                                    fontSize: 14,
                                    color: 'var(--gold)',
                                    fontWeight: 'bold',
                                    marginTop: 5
                                }}>
                                    Başarı: %{winRate}
                                </div>
                            </div>
                        );
                    })}
                </div>
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
                    <table style={{
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
                                    E-posta
                                </th>
                                <th style={{
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
                                    Tahminci Adı
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
                            {users.map(u => (
                                <tr
                                    key={u.id}
                                    style={{ borderBottom: '1px solid #333' }}
                                >
                                    <td style={{ padding: 10, fontSize: 12 }}>
                                        {u.email}
                                    </td>
                                    <td style={{ padding: 10, fontSize: 12 }}>
                                        {u.username || '-'}
                                    </td>
                                    <td style={{ padding: 10, fontSize: 12 }}>
                                        {u.role || 'user'}
                                    </td>
                                    <td style={{ padding: 10, fontSize: 12 }}>
                                        {u.tipsterName || '-'}
                                    </td>
                                    <td style={{ padding: 10, fontSize: 12 }}>
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
                                            <option value="editor">Editör</option>
                                            <option value="admin">Admin</option>
                                            <option value="tipster">Tahminci</option>
                                        </select>
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

function PublicStats({ onBack }) {
    const [menuStats, setMenuStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const snap = await getDocs(collection(db, 'predictions'));
            const mStats = {};
            snap.docs.forEach(d => {
                const p = d.data();
                const key = p.categoryKey || 0;
                if (!mStats[key]) mStats[key] = { total: 0, won: 0, lost: 0 };
                mStats[key].total++;
                if (p.status === 'won') mStats[key].won++;
                else if (p.status === 'lost') mStats[key].lost++;
            });
            setMenuStats(mStats);
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /></div>;

    return (
        <div className="category-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="category-header"><button className="category-back-btn" onClick={onBack}>{Icons.back}</button><h1 className="category-title">SİTE İSTATİSTİKLERİ</h1></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 15 }}>
                {MENU_ITEMS.map(item => {
                    const s = menuStats[item.key] || { total: 0, won: 0, lost: 0 };
                    const winRate = s.total > 0 ? ((s.won / (s.won + s.lost || 1)) * 100).toFixed(1) : 0;
                    return (
                        <div key={item.id} className="prediction-card" style={{ minHeight: 'auto', padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: item.color, fontWeight: 'bold' }}>{item.title}</div>
                                <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 900 }}>%{winRate} BAŞARI</div>
                            </div>
                            <div style={{ display: 'flex', gap: 20, marginTop: 15, fontSize: 13, color: '#aaa' }}>
                                <span>Toplam: {s.total}</span>
                                <span style={{ color: '#4ade80' }}>Kazanan: {s.won}</span>
                                <span style={{ color: '#f87171' }}>Kaybeden: {s.lost}</span>
                            </div>
                        </div>
                    );
                })}
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

            const submitFn = httpsCallable(functions, 'submitPrediction');
            await submitFn({ ...matchData, isPremium: matchData.isPremium || false });
            console.log('EditorScreen: Prediction added via Cloud Function');
            showAlert('Editör tahmini eklendi!', 'success');
            // Form alanlarını temizle
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
                        <div className="form-group" style={{ marginBottom: 10 }}><label className="form-label" style={{ fontSize: 10 }}>Lig</label><select className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.league} onChange={e => setMatchData({ ...matchData, league: e.target.value })}>{LEAGUES.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
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

            const submitFn = httpsCallable(functions, 'submitPrediction');
            await submitFn({ ...matchData, tipster: userData.tipsterName });
            console.log('TipsterScreen: Prediction added via Cloud Function');
            showAlert('Tahmin eklendi!', 'success');
            // Form alanlarını temizle
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
        setCouponData(prev => {
            const newMatches = [...prev.matches];
            newMatches[index] = { ...newMatches[index], [field]: value };
            return { ...prev, matches: newMatches };
        });
    };

    const handleSaveCoupon = async (e) => {
        e.preventDefault();
        setLoading(true);
        console.log('AdminScreen: Starting coupon save...', couponData);
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

            console.log('AdminScreen: Saving coupon to Firestore:', finalCouponData);
            const docRef = await addDoc(collection(db, 'coupons'), finalCouponData);
            console.log('AdminScreen: Coupon successfully added with ID:', docRef.id);

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
            } else if (view === 'addCorner') {
                finalData.cardHomeAvg = ''; finalData.cardAwayAvg = ''; finalData.refereeInfo = '';
            } else if (view === 'addMatch' && matchData.categoryKey !== 3) {
                finalData.cardHomeAvg = ''; finalData.cardAwayAvg = ''; finalData.refereeInfo = '';
                finalData.cornerHomeAvg = ''; finalData.cornerAwayAvg = ''; finalData.cornerGenAvg = '';
            }

            const submitFn = httpsCallable(functions, 'submitPrediction');
            await submitFn(finalData);
            console.log(`AdminScreen: ${view} - Prediction added via Cloud Function`);

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
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 65px)' }}>
            <button className="back-btn" onClick={() => onBack('home')}>Geri</button>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginTop: 20 }}>
                {/* Sol Taraf - Input Listesi */}
                <div style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 10, height: 'fit-content' }}>
                    <h3 style={{ color: 'var(--gold)', fontSize: 14, marginBottom: 15, textAlign: 'center' }}>INPUT</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className={`hero-btn secondary ${view === 'addMatch' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('addMatch')}>Tahmin Ekle</button>
                        <button className={`hero-btn secondary ${view === 'addCard' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => { setView('addCard'); setMatchData({ ...matchData, categoryKey: 3 }); }}>Kart Ekle</button>
                        <button className={`hero-btn secondary ${view === 'addCorner' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => { setView('addCorner'); setMatchData({ ...matchData, categoryKey: 3 }); }}>Korner Ekle</button>
                        <button className={`hero-btn secondary ${view === 'addCoupon' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('addCoupon')}>Kupon Ekle</button>
                        <button className={`hero-btn secondary ${view === 'notif' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '8px 12px', width: '100%' }} onClick={() => setView('notif')}>Bildirim Gönder</button>
                    </div>
                </div>

                {/* Sağ Taraf - Form Alanı */}
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                    {(view === 'addMatch') && (
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
        console.log('CouponScreen: Setting up onSnapshot listener for coupons...');
        const q = query(collection(db, 'coupons'));
        const unsub = onSnapshot(q, (snap) => {
            const allCoupons = snap.docs.map(d => {
                const data = d.data();
                return { id: d.id, ...data };
            });
            console.log(`CouponScreen: Total fetched coupons from Firestore: ${allCoupons.length}`);

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
        return () => unsub();
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
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            padding: 0,
                            marginBottom: '25px',
                            background: '#2e3335',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                            maxWidth: '800px',
                            margin: '0 auto 25px auto',
                            transition: 'all 0.3s ease',
                            borderColor: isWon ? '#4ade80' : isLost ? '#f87171' : 'rgba(255,255,255,0.05)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(253, 185, 19, 0.3), 0 0 30px rgba(253, 185, 19, 0.4)`;
                                e.currentTarget.style.borderColor = 'var(--gold)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
                                e.currentTarget.style.borderColor = isWon ? '#4ade80' : isLost ? '#f87171' : 'rgba(255,255,255,0.05)';
                            }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '12px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <span style={{
                                    color: selectedType.color,
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    textTransform: 'none'
                                }}>{c.type}</span>
                                {c.status && (
                                    <span className={`status-badge ${c.status}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
                                        {isWon ? 'KAZANDI' : isLost ? 'KAYBETTİ' : ''}
                                    </span>
                                )}
                            </div>
                            {c.matches.map((m, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '15px 20px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            border: '1px solid #aaa'
                                        }}></div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '700',
                                            color: '#fff',
                                            marginRight: '20px'
                                        }}>{m.prediction}</div>
                                        <div style={{
                                            color: '#fff',
                                            fontWeight: '400',
                                            fontSize: '14px'
                                        }}>{m.odds}</div>
                                    </div>
                                    <div style={{
                                        paddingLeft: '16px',
                                        fontSize: '13px',
                                        color: '#aaa',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        <div style={{ color: '#fff', fontSize: '14px' }}>{m.home}</div>
                                        <div style={{ color: '#fff', fontSize: '14px' }}>{m.away}</div>
                                    </div>
                                </div>
                            ))}
                            <div style={{
                                background: selectedType.color,
                                marginTop: 0,
                                padding: '15px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'filter 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}>
                                <span style={{
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: '700'
                                }}>Toplam Oran</span>
                                <span style={{
                                    color: '#fff',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    textShadow: 'none'
                                }}>{c.totalOdds}</span>
                            </div>

                            {/* ADMIN ACTIONS */}
                            {isAdmin && (
                                <div style={{
                                    padding: '15px',
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    background: 'rgba(0,0,0,0.2)'
                                }}>
                                    <button className="admin-btn delete" onClick={() => handleDeleteCoupon(c.id)} style={{ flex: 1, padding: '8px', fontSize: '12px' }}>SİL</button>
                                    <div style={{ display: 'flex', gap: '10px', flex: 2 }}>
                                        <button className="admin-btn won" onClick={() => updateCouponStatus(c.id, 'won')} style={{ flex: 1, padding: '8px', fontSize: '12px' }}>KAZANDI</button>
                                        <button className="admin-btn lost" onClick={() => updateCouponStatus(c.id, 'lost')} style={{ flex: 1, padding: '8px', fontSize: '12px' }}>KAYBETTİ</button>
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
            await deleteDoc(doc(db, 'predictions', item.id));
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
                minHeight: 'auto'
            }}
        >
            {/* Top Right Badges (Floating) */}
            <div className="card-header-overlay" style={{ top: 10, right: 10 }}>
                {item.status && <span className={`status-badge ${item.status}`}>{item.status === 'won' ? 'WON' : item.status === 'lost' ? 'LOST' : ''}</span>}
                {isPremium && <span className="premium-badge-icon">★</span>}
            </div>

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

            {/* Admin Actions */}
            {isAdmin && (
                <div className="admin-actions-premium" style={{ marginTop: 20 }}>
                    <button className="admin-btn delete" onClick={handleDelete}>SİL</button>
                    <button className="admin-btn won" onClick={() => updateStatus('won')}>WON</button>
                    <button className="admin-btn lost" onClick={() => updateStatus('lost')}>LOST</button>
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
    const [selectedTipster, setSelectedTipster] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedTipsterStats, setSelectedTipsterStats] = useState(null);

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
        console.log(`CategoryScreen: Fetching for category ${category?.title} (key: ${category?.key})`);
        setLoading(true);

        const q = query(collection(db, 'predictions'));

        const unsub = onSnapshot(q, (snap) => {
            const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log(`CategoryScreen: Total documents fetched: ${allDocs.length}`);

            let filtered = allDocs.filter(item => {
                const dbKeyMap = { 0: 'ilk-yari-gol', 4: 'gunun-tercihleri', 6: 'gunun-surprizleri' };
                if (IS_BOT_MENU) {
                    const botKey = dbKeyMap[category.key];
                    const matches = item.categoryKey === botKey || parseInt(item.categoryKey) === category.key;
                    if (matches) console.log(`CategoryScreen: BOT_MENU match found:`, item.id, 'categoryKey:', item.categoryKey);
                    return matches;
                } else {
                    const matches = parseInt(item.categoryKey) === category.key || item.categoryKey === category.key;
                    if (matches) console.log(`CategoryScreen: Match found:`, item.id, 'categoryKey:', item.categoryKey);
                    return matches;
                }
            });

            console.log(`CategoryScreen: Filtered to ${filtered.length} items for category key ${category.key}`);

            if (IS_CARD_KORNER_MENU && selectedSubCategory) {
                filtered = filtered.filter(p => {
                    if (selectedSubCategory === 'card') return p.cardHomeAvg || p.cardAwayAvg || p.refereeInfo;
                    if (selectedSubCategory === 'corner') return p.cornerHomeAvg || p.cornerAwayAvg || p.cornerGenAvg;
                    return true;
                });
                console.log(`CategoryScreen: After sub-category filter (${selectedSubCategory}): ${filtered.length} items`);
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

        return () => unsub();
    }, [category.key, selectedSubCategory, IS_BOT_MENU, IS_CARD_KORNER_MENU]);

    const filtered = selectedTipster ? predictions.filter(p => p.tipster?.toLowerCase().includes(selectedTipster.name.toLowerCase())) : (selectedLeague ? predictions.filter(p => p.league === selectedLeague) : predictions);

    if (category.key === 2 && !selectedTipster) {
        return (
            <div className="category-page">
                <div className="category-header"><button className="category-back-btn" onClick={onBack}>{Icons.back}</button><h1 className="category-title">Tahminciler</h1></div>
                <div className="predictions-list" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800, margin: '0 auto' }}>
                    {tipsters.map(t => (
                        <div key={t.id} className="menu-selection-card prediction-card" style={{ flexDirection: 'column', gap: 15, padding: 20, minHeight: 200 }} onClick={() => setSelectedTipster(t)}>
                            <img src={t.image} style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--gold)', objectFit: 'cover' }} />
                            <div><h3 style={{ color: 'var(--gold)', fontSize: 20, fontWeight: '800' }}>{t.name}</h3><p style={{ fontSize: 13, color: '#aaa', marginTop: 5 }}>{t.role}</p></div>
                            <button
                                className="tipster-stats-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTipsterStats(t);
                                    setShowStatsModal(true);
                                }}
                            >
                                📊 İstatistik
                            </button>
                        </div>
                    ))}
                </div>

                {/* Stats Modal */}
                {showStatsModal && selectedTipsterStats && (
                    <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
                        <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setShowStatsModal(false)}>✕</button>
                            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                                <img src={selectedTipsterStats.image} style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid var(--gold)', marginBottom: 15 }} />
                                <h2 style={{ color: 'var(--gold)', fontSize: 24, marginBottom: 5 }}>{selectedTipsterStats.name}</h2>
                                <p style={{ color: '#aaa', fontSize: 14 }}>{selectedTipsterStats.role}</p>
                            </div>

                            <div className="stats-content">
                                <div className="stat-row">
                                    <span className="stat-label">Toplam Tahmin</span>
                                    <span className="stat-value" style={{ color: 'var(--gold)' }}>{selectedTipsterStats.stats.total}</span>
                                </div>

                                <div className="stat-row">
                                    <span className="stat-label">Kazanan</span>
                                    <div style={{ flex: 1, marginLeft: 20 }}>
                                        <div className="stat-bar-container">
                                            <div className="stat-bar" style={{ width: `${(selectedTipsterStats.stats.win / selectedTipsterStats.stats.total) * 100}%`, background: '#006A4E' }}></div>
                                        </div>
                                        <span className="stat-value" style={{ color: '#006A4E', marginLeft: 10 }}>{selectedTipsterStats.stats.win}</span>
                                    </div>
                                </div>

                                <div className="stat-row">
                                    <span className="stat-label">Kaybeden</span>
                                    <div style={{ flex: 1, marginLeft: 20 }}>
                                        <div className="stat-bar-container">
                                            <div className="stat-bar" style={{ width: `${((selectedTipsterStats.stats.total - selectedTipsterStats.stats.win) / selectedTipsterStats.stats.total) * 100}%`, background: '#dc2626' }}></div>
                                        </div>
                                        <span className="stat-value" style={{ color: '#dc2626', marginLeft: 10 }}>{selectedTipsterStats.stats.total - selectedTipsterStats.stats.win}</span>
                                    </div>
                                </div>

                                <div className="stat-row" style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span className="stat-label" style={{ fontSize: 18, fontWeight: 700 }}>Başarı Oranı</span>
                                    <span className="stat-value" style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 900 }}>{selectedTipsterStats.stats.rate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="category-page">
            <div className="category-header">
                <button className="category-back-btn" onClick={selectedTipster ? () => setSelectedTipster(null) : selectedLeague ? () => setSelectedLeague(null) : onBack}>{Icons.back}</button>
                <h1 className="category-title">
                    {selectedTipster ? selectedTipster.name :
                        selectedLeague ? selectedLeague :
                            category.title}
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
    console.log('App rendering...');
    const [route, setRoute] = useState('home');
    const [routeParams, setRouteParams] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [legalType, setLegalType] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

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
            case 'category': return <CategoryScreen category={routeParams} onBack={() => navigate('home')} userData={userData} onNavigate={navigate} />;
            case 'coupons': return <CouponScreen onBack={() => navigate('home')} showAlert={showAlert} userData={userData} />;
            case 'stats': return <PublicStats onBack={() => navigate('home')} />;
            case 'yapay-zeka-analizleri': return <OddsyKGAnaliz onBack={() => navigate('home')} />;
            case 'kart-analizi': return <Kart onBack={() => navigate('home')} />;
            case 'korner-analizi': return <Korner onBack={() => navigate('home')} />;
            case 'gunun-surprizleri': return (
                <div style={{ paddingTop: '20px' }}>
                    <div className="category-header">
                        <button className="category-back-btn" onClick={() => navigate('home')}>{Icons.back}</button>
                    </div>
                    <GununSurprizleri />
                </div>
            );
            case 'gunun-tercihleri': return (
                <div style={{ paddingTop: '20px' }}>
                    <div className="category-header">
                        <button className="category-back-btn" onClick={() => navigate('home')}>{Icons.back}</button>
                    </div>
                    <GununTercihleri />
                </div>
            );
            default: return <HomePage onLoginClick={() => navigate(user ? 'profile' : 'auth')} onNavigate={navigate} onShowLegal={setLegalType} />;
        }
    };

    return (
        <div className="app">
            {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
            {legalType && <LegalModal type={legalType} onClose={() => setLegalType(null)} />}
            <Header
                onMenuOpen={() => setSidebarOpen(true)}
                user={user}
                onProfileClick={() => navigate(user ? 'profile' : 'auth')}
                onNavigate={navigate}
                currentCategory={routeParams.key}
                theme={theme}
                onThemeToggle={toggleTheme}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={navigate} currentRoute={route} />
            <main className="main-content">{render()}</main>
        </div>
    );
}
