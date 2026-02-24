import { useRef, useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, functions } from '../firebaseConfig';

const MENU_ITEMS = [
    { id: 'cat_ai_new', title: "YAPAY ZEKA ANALİZ BOTU", key: 10, icon: '🤖', color: "#FFD700", route: 'yapay-zeka-analizleri' },
    { id: 'cat_1', title: "ILK YARI GOL LISTESI", key: 0, icon: '⚽', color: "#10B981", route: 'category' },
    { id: 'cat_coupons_new', title: "GÜNÜN KUPONLARI", key: 20, icon: '🎫', color: "#f87171", route: 'coupons' },
    { id: 'cat_3', title: "TAHMINCILER", key: 2, icon: '👥', color: "#a78bfa", route: 'category' },
    { id: 'cat_kart_analiz', title: "KART ANALİZ BOTU", key: 31, icon: '🟨', color: "#FFD700", route: 'kart-analizi' },
    { id: 'cat_korner_analiz', title: "KORNER ANALİZ BOTU", key: 32, icon: '🚩', color: "#10B981", route: 'korner-analizi' },
    { id: 'cat_5', title: "GUNUN TERCIHLERI", key: 4, icon: '⭐', color: "#4ade80", route: 'gunun-tercihleri' },
    { id: 'cat_7', title: "SURPRIZLER", key: 6, icon: '💥', color: "#fb7185", route: 'gunun-surprizleri' },
    { id: 'cat_8', title: "IY / MS TAHMINLERI", key: 7, icon: '🔄', color: "#FFD700", route: 'iy-ms-tahminleri' },
    { id: 'cat_9', title: "EDITORUN SECIMI", key: 8, icon: '✍️', color: "#4ade80", route: 'category' },
];

const COUPON_TYPES = [
    { id: 'banko', name: 'Banko Kupon', dbName: 'Günün Banko Kuponu', color: 'var(--gold)', image: 'https://i.ibb.co/3mb3dcx0/banko.png', desc: 'Günün en güvenilir tahminleri' },
    { id: 'ideal', name: 'İdeal Kupon', dbName: 'Günün İdeal Kuponu', color: '#4ade80', image: 'https://i.ibb.co/LFNHb81/ideal.png', desc: 'Dengeli oran ve güven kombinasyonu' },
    { id: 'surpriz', name: 'Sürpriz Kupon', dbName: 'Günün Sürpriz Kuponu', color: '#f87171', image: 'https://i.ibb.co/JFWTPs0y/s-priz.png', desc: 'Yüksek oranlı cesur tahminler' }
];

const LEAGUES = [
    { id: 'Premier Lig', title: 'Premier Lig' },
    { id: 'La Liga', title: 'La Liga' },
    { id: 'Bundesliga', title: 'Bundesliga' },
    { id: 'Serie A', title: 'Serie A' },
    { id: 'Ligue 1', title: 'Ligue 1' },
    { id: 'Süper Lig', title: 'Süper Lig' },
    { id: 'Eredivisie', title: 'Eredivisie' },
    { id: 'Championship', title: 'Championship' },
    { id: 'Primeira Liga', title: 'Primeira Liga' },
    { id: 'Serie B', title: 'Serie B' },
    { id: 'Diğer', title: 'Diğer' }
];

// X (Twitter) paylaşım seçenekleri
const SHARE_OPTIONS = [
    {
        id: 'gunun-kuponu',
        label: 'Günün Kuponları',
        metin: "Oddsy'de Günün Banko Kuponu yayında!\n\noddsw.com.tr",
        imageUrl: 'https://i.ibb.co/3mb3dcx0/banko.png',
    },
    {
        id: 'gunun-tercihleri',
        label: 'Günün Tercihleri',
        metin: "Oddsy'de Günün Tercihleri yayında!\n\noddsw.com.tr",
        imageUrl: null,
    },
    {
        id: 'kupon-kazandi',
        label: 'Günün Kuponu Kazandı',
        metin: "Oddsy Günün Kuponu KAZANDI!\n\noddsw.com.tr",
        imageUrl: null,
    },
    {
        id: 'editor-tercihleri',
        label: 'Editör Tercihleri',
        metin: "Oddsy'de Editör Tercihleri yayında!\n\noddsw.com.tr",
        imageUrl: null,
    },
    {
        id: 'editor-kazandi',
        label: "Editörün tercihi kazandı",
        metin: "Oddsy Editörün Tercihi KAZANDI!\n\noddsw.com.tr",
        imageUrl: null,
    },
];

function AdminPanel({ onBack, showAlert, userData }) {
    const [view, setView] = useState('addMatch');
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: '', awayTeam: '', league: 'Premier Lig', time: '20:00', prediction: '', odds: '', categoryKey: 6, status: 'pending', analysis: '', cardHomeAvg: '', cardAwayAvg: '', refereeInfo: '', cornerHomeAvg: '', cornerAwayAvg: '', cornerGenAvg: '' });
    const [couponData, setCouponData] = useState({ type: 'Günün Banko Kuponu', matches: [{ home: '', away: '', prediction: '', odds: '' }] });
    const [notification, setNotification] = useState({ title: '', body: '' });

    // Paylaş dropdown state
    const [shareOpen, setShareOpen] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const shareRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (shareRef.current && !shareRef.current.contains(e.target)) {
                setShareOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleShare = async (option) => {
        setShareLoading(true);
        setShareOpen(false);
        try {
            const token = import.meta.env.VITE_GITHUB_TOKEN;
            const repo  = import.meta.env.VITE_GITHUB_REPO;   // "kullanici/repo-adi"
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
                    body: JSON.stringify({
                        ref: branch,
                        inputs: {
                            tur: option.id,
                            metin: option.metin,
                            image_url: option.imageUrl || '',
                        },
                    }),
                }
            );

            // GitHub workflow_dispatch başarıda 204 döner (body yok)
            if (res.status === 204) {
                showAlert(`"${option.label}" paylaşımı başlatıldı! (~30-60 sn içinde yayınlanır)`, 'success');
            } else {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || `GitHub API hatası: ${res.status}`);
            }
        } catch (err) {
            showAlert('Paylaşım hatası: ' + err.message, 'error');
        } finally {
            setShareLoading(false);
        }
    };

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

        try {
            const u = auth.currentUser;
            if (!u) throw new Error('Oturum kapalı');

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

            await addDoc(collection(db, 'coupons'), finalCouponData);

            showAlert('Kupon eklendi!', 'success');
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

            showAlert('Eklendi!', 'success');

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

                        {/* Paylaş Butonu + Dropdown */}
                        <div ref={shareRef} style={{ position: 'relative', marginTop: 8 }}>
                            <button
                                onClick={() => setShareOpen(prev => !prev)}
                                disabled={shareLoading}
                                style={{
                                    fontSize: '11px',
                                    padding: '8px 12px',
                                    width: '100%',
                                    background: shareLoading ? '#555' : 'var(--primary-green)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: shareLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                }}
                            >
                                {shareLoading ? 'Paylaşılıyor...' : <>X'te Paylaş <span style={{ fontSize: 9 }}>{shareOpen ? '▲' : '▼'}</span></>}
                            </button>

                            {shareOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 4px)',
                                    left: 0,
                                    minWidth: '100%',
                                    width: 'max-content',
                                    background: '#1e1e1e',
                                    border: '1px solid var(--primary-green)',
                                    borderRadius: 8,
                                    zIndex: 200,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                                }}>
                                    {SHARE_OPTIONS.map((opt, idx) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleShare(opt)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '9px 14px',
                                                background: 'transparent',
                                                color: '#e0e0e0',
                                                border: 'none',
                                                borderBottom: idx < SHARE_OPTIONS.length - 1 ? '1px solid #2e2e2e' : 'none',
                                                textAlign: 'left',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf - Form Alanı */}
                <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 10 }}>
                    {(view === 'addMatch' || view === 'addCard' || view === 'addCorner') && (
                        <form onSubmit={handleAddMatch}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {view === 'addMatch' && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 10 }}>
                                        <label className="form-label" style={{ fontSize: 10 }}>Kategori</label>
                                        <select className="form-input" style={{ padding: 8, fontSize: 12 }} value={matchData.categoryKey} onChange={e => setMatchData({ ...matchData, categoryKey: parseInt(e.target.value) })}>
                                            <option value={6}>Sürprizler</option>
                                            <option value={4}>Günün Tercihleri</option>
                                            <option value={7}>İY/MS Tahminleri</option>
                                            <option value={0}>İlk Yarı Gol Listesi</option>
                                            {MENU_ITEMS.filter(m => ![0, 4, 6, 7].includes(m.key)).map(m => <option key={m.key} value={m.key}>{m.title}</option>)}
                                        </select>
                                    </div>
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

export default AdminPanel;
