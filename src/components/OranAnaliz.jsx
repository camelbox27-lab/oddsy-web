import { useEffect, useMemo, useRef, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const SONUC_ONCE = ['lig', 'tarih', 'ev', 'dep', 'iyskor', 'msskor'];
const GIZLI = new Set(['Id', 'BitmisMac', 'MatchCode', '_gunTarihi']);

// Günlük maç kolon adı (büyük) -> DB kolon adı (küçük)
const GUNLUK_TO_DB = {
    'Lig': 'lig', 'Tarih': 'tarih', 'Ev': 'ev', 'Dep': 'dep',
    'IYSkor': 'iyskor', 'MSSkor': 'msskor',
    'MS1 A': 'ms1_a', 'MS1 K': 'ms1_k',
    'MS0 A': 'ms0_a', 'MS0 K': 'ms0_k',
    'MS2 A': 'ms2_a_son', 'MS2 K': 'ms2_k',
    'IY1 A': 'iy1_a', 'IY1 K': 'iy1_k', 'IY0 A': 'iy0_a', 'IY0 K': 'iy0_k',
    'IY2 A': 'iy2_a', 'IY2 K': 'iy2_k',
    'IIY1 A': 'iiy1_a', 'IIY1 K': 'iiy1_k', 'IIY0 A': 'iiy0_a', 'IIY0 K': 'iiy0_k',
    'IIY2 A': 'iiy2_a', 'IIY2 K': 'iiy2_k',
    'CS10 A': 'cs10_a', 'CS10 K': 'cs10_k', 'CS12 A': 'cs12_a', 'CS12 K': 'cs12_k',
    'CS02 A': 'cs02_a', 'CS02 K': 'cs02_k',
    'IYCS10 A': 'iycs10_a', 'IYCS10 K': 'iycs10_k',
    'IYCS12 A': 'iycs12_a', 'IYCS12 K': 'iycs12_k',
    'IYCS02 A': 'iycs02_a', 'IYCS02 K': 'iycs02_k',
    'KGVAR A': 'kgvar_a_fitre', 'KGVAR K': 'kgvar_k',
    'KGYOK A': 'kgyok_a', 'KGYOK K': 'kgyok_k',
    'IY KGVAR A': 'iy_kgvar_a', 'IY KGVAR K': 'iy_kgvar_k',
    'IY KGYOK A': 'iy_kgyok_a', 'IY KGYOK K': 'iy_kgyok_k',
    'IIY KGVAR A': 'iiy_kgvar_a', 'IIY KGVAR K': 'iiy_kgvar_k',
    'IIY KGYOK A': 'iiy_kgyok_a', 'IIY KGYOK K': 'iiy_kgyok_k',
    'ALT05 A': 'alt05_a', 'ALT05 K': 'alt05_k', 'UST05 A': 'ust05_a', 'UST05 K': 'ust05_k',
    'ALT15 A': 'alt15_a', 'ALT15 K': 'alt15_k', 'UST15 A': 'ust15_a', 'UST15 K': 'ust15_k',
    'ALT25 A': 'alt25_a', 'ALT25 K': 'alt25_k', 'UST25 A': 'ust25_a', 'UST25 K': 'ust25_k',
    'ALT35 A': 'alt35_a', 'ALT35 K': 'alt35_k', 'UST35 A': 'ust35_a', 'UST35 K': 'ust35_k',
    'ALT45 A': 'alt45_a', 'ALT45 K': 'alt45_k', 'UST45 A': 'ust45_a', 'UST45 K': 'ust45_k',
    'ALT55 A': 'alt55_a', 'ALT55 K': 'alt55_k', 'UST55 A': 'ust55_a', 'UST55 K': 'ust55_k',
    'ALT65 A': 'alt65_a', 'ALT65 K': 'alt65_k', 'UST65 A': 'ust65_a', 'UST65 K': 'ust65_k',
    'ALT75 A': 'alt75_a', 'ALT75 K': 'alt75_k', 'UST75 A': 'ust75_a', 'UST75 K': 'ust75_k',
    'ALT85 A': 'alt85_a', 'ALT85 K': 'alt85_k', 'UST85 A': 'ust85_a', 'UST85 K': 'ust85_k',
    'IYALT05 A': 'iyalt05_a', 'IYALT05 K': 'iyalt05_k', 'IYUST05 A': 'iyust05_a', 'IYUST05 K': 'iyust05_k',
    'IYALT15 A': 'iyalt15_a', 'IYALT15 K': 'iyalt15_k', 'IYUST15 A': 'iyust15_a', 'IYUST15 K': 'iyust15_k',
    'IYALT25 A': 'iyalt25_a', 'IYALT25 K': 'iyalt25_k', 'IYUST25 A': 'iyust25_a', 'IYUST25 K': 'iyust25_k',
    'IYALT35 A': 'iyalt35_a', 'IYALT35 K': 'iyalt35_k', 'IYUST35 A': 'iyust35_a', 'IYUST35 K': 'iyust35_k',
    'IYALT45 A': 'iyalt45_a', 'IYALT45 K': 'iyalt45_k', 'IYUST45 A': 'iyust45_a', 'IYUST45 K': 'iyust45_k',
    'IYMS 1E1 A': 'iyms_1e1_a', 'IYMS 1E1 K': 'iyms_1e1_k',
    'IYMS 1E0 A': 'iyms_1e0_a', 'IYMS 1E0 K': 'iyms_1e0_k',
    'IYMS 1E2 A': 'iyms_1e2_a', 'IYMS 1E2 K': 'iyms_1e2_k',
    'IYMS 0E1 A': 'iyms_0e1_a', 'IYMS 0E1 K': 'iyms_0e1_k',
    'IYMS 0E0 A': 'iyms_0e0_a', 'IYMS 0E0 K': 'iyms_0e0_k',
    'IYMS 0E2 A': 'iyms_0e2_a', 'IYMS 0E2 K': 'iyms_0e2_k',
    'IYMS 2E1 A': 'iyms_2e1_a', 'IYMS 2E1 K': 'iyms_2e1_k',
    'IYMS 2E0 A': 'iyms_2e0_a', 'IYMS 2E0 K': 'iyms_2e0_k',
    'IYMS 2E2 A': 'iyms_2e2_a', 'IYMS 2E2 K': 'iyms_2e2_k',
};

const ETIKET = {
    lig: 'Lig', tarih: 'Tarih', ev: 'Ev', dep: 'Dep', iyskor: 'İY Skor', msskor: 'MS Skor',
    ms1_a: 'MS1 A', ms1_k: 'MS1 K', ms0_a: 'MS0 A', ms0_k: 'MS0 K',
    ms2_a_son: 'MS2 A', ms2_k: 'MS2 K',
    iy1_a: 'İY1 A', iy1_k: 'İY1 K', iy0_a: 'İY0 A', iy0_k: 'İY0 K',
    iy2_a: 'İY2 A', iy2_k: 'İY2 K',
    iiy1_a: 'İİY1 A', iiy1_k: 'İİY1 K', iiy0_a: 'İİY0 A', iiy0_k: 'İİY0 K',
    iiy2_a: 'İİY2 A', iiy2_k: 'İİY2 K',
    kgvar_a_fitre: 'KG Var A', kgvar_k: 'KG Var K', kgyok_a: 'KG Yok A', kgyok_k: 'KG Yok K',
    alt25_a: 'Alt 2.5 A', alt25_k: 'Alt 2.5 K', ust25_a: 'Üst 2.5 A', ust25_k: 'Üst 2.5 K',
    alt15_a: 'Alt 1.5 A', alt15_k: 'Alt 1.5 K', ust15_a: 'Üst 1.5 A', ust15_k: 'Üst 1.5 K',
    alt35_a: 'Alt 3.5 A', alt35_k: 'Alt 3.5 K', ust35_a: 'Üst 3.5 A', ust35_k: 'Üst 3.5 K',
    cs10_a: 'CS10 A', cs10_k: 'CS10 K', cs12_a: 'CS12 A', cs12_k: 'CS12 K',
    cs02_a: 'CS02 A', cs02_k: 'CS02 K',
};

export default function OranAnaliz({ onBack, user }) {
    // Günlük maçlar
    const [gunlukRows, setGunlukRows] = useState([]);
    const [gunlukLoading, setGunlukLoading] = useState(true);
    const [gunlukError, setGunlukError] = useState('');

    // Günlük maçlar tablosu üstündeki Excel-tarzı kolon filtreleri (kolon -> seçilen değer)
    const [gunlukFiltre, setGunlukFiltre] = useState({});

    // Geçmiş eşleşmeler
    const [eslesmeler, setEslesmeler] = useState([]);
    const [totalMatches, setTotalMatches] = useState(0);
    const [sorguLoading, setSorguLoading] = useState(false);
    const [sorguError, setSorguError] = useState('');
    const [gosterilen, setGosterilen] = useState(50);

    // Geçmiş tablo dropdown filtreleri
    const [gecmisFiltre, setGecmisFiltre] = useState({});

    // Kayıtlı filtreler (opsiyonel kısayol, sadece giriş yapmış kullanıcılar için)
    const [kaydedilenFiltreler, setKaydedilenFiltreler] = useState([]);
    const [filtrePanelAcik, setFiltrePanelAcik] = useState(false);
    const [kaydetModal, setKaydetModal] = useState(false);
    const [kaydetIsim, setKaydetIsim] = useState('');
    const [kaydedildiMesaj, setKaydedildiMesaj] = useState(false);

    const debounceRef = useRef(null);
    const filtrePanelRef = useRef(null);

    // Auth
    const [uid, setUid] = useState(auth.currentUser?.uid || user?.uid || null);
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => setUid(u?.uid || null));
        return () => unsub();
    }, []);
    useEffect(() => { if (user?.uid) setUid(user.uid); }, [user?.uid]);

    // Günlük maçları yükle
    useEffect(() => {
        fetch('/api/bet365-backend')
            .then(r => { if (!r.ok) throw new Error('Yüklenemedi'); return r.json(); })
            .then(d => setGunlukRows(Array.isArray(d.data) ? d.data : []))
            .catch(e => setGunlukError(e.message))
            .finally(() => setGunlukLoading(false));
    }, []);

    // Kaydedilen filtreleri yükle
    useEffect(() => {
        if (!uid) return;
        const ref = collection(db, 'users', uid, 'savedFilters');
        const unsub = onSnapshot(ref, snap => {
            setKaydedilenFiltreler(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [uid]);

    // Panel dışına tıklayınca kapat
    useEffect(() => {
        if (!filtrePanelAcik) return;
        const handler = (e) => {
            if (filtrePanelRef.current && !filtrePanelRef.current.contains(e.target))
                setFiltrePanelAcik(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [filtrePanelAcik]);

    // Günlük maç kolonları
    const gunlukKolonlar = useMemo(() => {
        if (!gunlukRows.length) return [];
        return Object.keys(gunlukRows[0]).filter(k => !GIZLI.has(k));
    }, [gunlukRows]);

    // Her kolon için günlük maçlardaki benzersiz değerler (Excel-tarzı dropdown seçenekleri)
    const gunlukSecenekler = useMemo(() => {
        const map = {};
        gunlukKolonlar.forEach(k => {
            const vals = [...new Set(gunlukRows.map(r => r[k]).filter(v => v != null && v !== '' && v !== '-').map(v => String(v)))];
            vals.sort((a, b) => isNaN(parseFloat(a)) ? a.localeCompare(b, 'tr') : parseFloat(a) - parseFloat(b));
            map[k] = vals;
        });
        return map;
    }, [gunlukRows, gunlukKolonlar]);

    // Seçilen kolon filtrelerine göre günlük maçlar tablosu daralması
    const filtreliGunlukRows = useMemo(() => {
        const aktif = Object.entries(gunlukFiltre).filter(([, v]) => v !== '');
        if (!aktif.length) return gunlukRows;
        return gunlukRows.filter(row =>
            aktif.every(([k, v]) => {
                let val = row[k];
                if (k === 'Tarih' && typeof val === 'number') val = new Date(val).toLocaleDateString('tr-TR');
                return String(val ?? '') === v;
            })
        );
    }, [gunlukRows, gunlukFiltre]);

    // Neon'a gönderilecek filtreler: Tarih/Skor hariç tüm seçilen kolonlar (Lig/Ev/Dep dahil, oran kolonları dahil)
    const neonFiltreler = useMemo(() => {
        const f = {};
        Object.entries(gunlukFiltre).forEach(([k, v]) => {
            if (v === '' || ['Tarih', 'IYSkor', 'MSSkor'].includes(k)) return;
            f[k] = v;
        });
        return f;
    }, [gunlukFiltre]);

    // Filtrelere uyan ilk günlük maç: geçmiş eşleşmeler tablosunun üstünde sabit referans satırı olarak gösterilir
    const referansMac = useMemo(() => {
        if (!Object.keys(neonFiltreler).length) return null;
        return filtreliGunlukRows[0] || null;
    }, [filtreliGunlukRows, neonFiltreler]);

    // Neon sorgusu
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!Object.keys(neonFiltreler).length) {
            setEslesmeler([]);
            setTotalMatches(0);
            setSorguError('');
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSorguLoading(true);
            setSorguError('');
            try {
                const r = await fetch('/api/bet365-backend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filters: neonFiltreler }),
                });
                if (!r.ok) throw new Error('Backend hatası.');
                const d = await r.json();
                setEslesmeler(Array.isArray(d.data) ? d.data : []);
                setTotalMatches(d.totalMatches || 0);
                setGosterilen(50);
                setGecmisFiltre({});
            } catch (e) {
                setSorguError(e.message);
            } finally {
                setSorguLoading(false);
            }
        }, 400);
    }, [neonFiltreler]);

    // Geçmiş tablo kolonları
    const gecmisKolonlar = useMemo(() => {
        if (!eslesmeler.length) return SONUC_ONCE;
        const all = Object.keys(eslesmeler[0]).filter(c => c !== 'id');
        return [...SONUC_ONCE.filter(c => all.includes(c)), ...all.filter(c => !SONUC_ONCE.includes(c))];
    }, [eslesmeler]);

    // Geçmiş tablo frontend filtresi
    const filtreliEslesmeler = useMemo(() => {
        const aktif = Object.entries(gecmisFiltre).filter(([, v]) => v !== '');
        if (!aktif.length) return eslesmeler;
        return eslesmeler.filter(row =>
            aktif.every(([k, v]) => String(row[k] ?? '') === v)
        );
    }, [eslesmeler, gecmisFiltre]);

    // Geçmiş tablo dropdown seçenekleri (mevcut eşleşmelerden)
    const gecmisSecenekler = useMemo(() => {
        const map = {};
        gecmisKolonlar.forEach(k => {
            const vals = [...new Set(eslesmeler.map(r => r[k]).filter(v => v != null && v !== '').map(v => String(v)))];
            vals.sort((a, b) => isNaN(parseFloat(a)) ? a.localeCompare(b, 'tr') : parseFloat(a) - parseFloat(b));
            map[k] = vals;
        });
        return map;
    }, [eslesmeler, gecmisKolonlar]);

    const aktifSayi = Object.values(gunlukFiltre).filter(v => v !== '').length;

    const filtreKaydet = async () => {
        if (!uid || !kaydetIsim.trim()) return;
        const aktifKolonlar = Object.keys(gunlukFiltre).filter(k => gunlukFiltre[k] !== '');
        await addDoc(collection(db, 'users', uid, 'savedFilters'), {
            isim: kaydetIsim.trim(),
            kolonlar: aktifKolonlar,
            degerler: gunlukFiltre,
            olusturuldu: serverTimestamp(),
        });
        setKaydetIsim('');
        setKaydetModal(false);
        setKaydedildiMesaj(true);
        setTimeout(() => setKaydedildiMesaj(false), 3000);
    };

    const filtreSil = async (id) => {
        if (!uid) return;
        await deleteDoc(doc(db, 'users', uid, 'savedFilters', id));
    };

    const temizle = () => {
        setGunlukFiltre({});
        setEslesmeler([]);
        setTotalMatches(0);
        setGecmisFiltre({});
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 85px)', width: '100%', overflow: 'hidden' }}>

            {/* Başlık */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <button className="category-back-btn" onClick={onBack}>←</button>
                <h1 style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 900 }}>Bet365 Oran Analizi</h1>

                {/* Kayıtlı filtre kısayolları (opsiyonel, sadece giriş yapmış kullanıcılar için) */}
                {uid && kaydedilenFiltreler.length > 0 && (
                    <div style={{ position: 'relative' }} ref={filtrePanelRef}>
                        <button onClick={() => setFiltrePanelAcik(v => !v)} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                        }}>
                            <span>⭐</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 13 }}>Kayıtlı Filtrelerim</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{filtrePanelAcik ? '▲' : '▼'}</span>
                        </button>

                        {filtrePanelAcik && (
                            <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, width: 240, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                                <div style={{ padding: '6px 14px 4px', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Kayıtlı</div>
                                {kaydedilenFiltreler.map(kf => (
                                    <div key={kf.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                        <button onClick={() => { setGunlukFiltre(kf.degerler || {}); setFiltrePanelAcik(false); }} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                            <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 12 }}>{kf.isim}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{(kf.kolonlar || []).join(' · ')}</div>
                                        </button>
                                        <button onClick={() => filtreSil(kf.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {aktifSayi > 0 && uid && (
                        <button onClick={() => setKaydetModal(true)} style={{ padding: '8px 16px', borderRadius: 999, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                            ⭐ Kaydet
                        </button>
                    )}
                    {aktifSayi > 0 && (
                        <button onClick={temizle} style={{ padding: '8px 16px', borderRadius: 999, background: 'var(--primary-green)', color: 'var(--gold)', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                            Temizle
                        </button>
                    )}
                </div>
            </div>

            {/* Filtre Kaydet Modal */}
            {kaydetModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 16 }}>Filtreyi Kaydet</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{Object.entries(gunlukFiltre).filter(([, v]) => v !== '').map(([k, v]) => `${k}=${v}`).join(' · ')}</div>
                        <input autoFocus value={kaydetIsim} onChange={e => setKaydetIsim(e.target.value)} onKeyDown={e => e.key === 'Enter' && filtreKaydet()}
                            placeholder="Filtre adı" style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { setKaydetModal(false); setKaydetIsim(''); }} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>İptal</button>
                            <button onClick={filtreKaydet} disabled={!kaydetIsim.trim()} style={{ flex: 1, padding: '8px', borderRadius: 8, background: kaydetIsim.trim() ? 'var(--primary-green)' : 'var(--bg-dark)', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: kaydetIsim.trim() ? 'pointer' : 'not-allowed', fontSize: 13, opacity: kaydetIsim.trim() ? 1 : 0.5 }}>Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {gunlukError && <div style={{ color: 'var(--error)', padding: '12px 16px', flexShrink: 0 }}>{gunlukError}</div>}
            {gunlukLoading && <div style={{ padding: '20px 16px', color: 'var(--text-secondary)', flexShrink: 0 }}>Yükleniyor...</div>}

            {/* GÜNLÜK MAÇLAR TABLOSU - filtre seçilmemişken tam ekran, kolon başlıklarında Excel-tarzı dropdown filtreler */}
            {!gunlukLoading && Object.keys(neonFiltreler).length === 0 && (
                <div style={{ background: 'var(--bg-card)', overflow: 'hidden', flex: 1, width: '100%', display: 'flex', flexDirection: 'column', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--bg-card)' }}>
                        <span style={{ color: 'var(--gold)', fontWeight: 800 }}>Günlük Maçlar</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{filtreliGunlukRows.length} / {gunlukRows.length} maç</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>· Kolon başlıklarındaki dropdown'lardan filtre seç</span>
                    </div>
                    <div style={{ overflowX: 'auto', overflowY: 'auto', width: '100%', flex: 1 }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
                            <thead>
                                <tr>
                                    {gunlukKolonlar.map(k => (
                                        <th key={k} style={{ background: gunlukFiltre[k] ? 'rgba(255,200,0,0.15)' : 'var(--primary-green-dark)', padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', whiteSpace: 'nowrap', verticalAlign: 'top', position: 'sticky', top: 0, zIndex: 2 }}>
                                            <div style={{ color: gunlukFiltre[k] ? 'var(--gold)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 800, marginBottom: 3 }}>{k}</div>
                                            <select value={gunlukFiltre[k] || ''} onChange={e => setGunlukFiltre(prev => ({ ...prev, [k]: e.target.value }))}
                                                style={{ width: '100%', minWidth: 55, background: 'var(--bg-dark)', color: gunlukFiltre[k] ? 'var(--gold)' : 'var(--text-secondary)', border: gunlukFiltre[k] ? '1px solid var(--gold)' : '1px solid var(--border)', borderRadius: 4, padding: '2px 3px', fontSize: 10, outline: 'none', cursor: 'pointer' }}>
                                                <option value="">Tümü</option>
                                                {(gunlukSecenekler[k] || []).map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtreliGunlukRows.map((row, i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-dark)' : 'rgba(255,255,255,0.02)' }}>
                                        {gunlukKolonlar.map(k => {
                                            let val = row[k];
                                            if (k === 'Tarih' && typeof val === 'number') val = new Date(val).toLocaleDateString('tr-TR');
                                            return <td key={k} style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', color: gunlukFiltre[k] ? 'var(--gold)' : 'var(--text-primary)', fontWeight: gunlukFiltre[k] ? 700 : 400, fontSize: 11, whiteSpace: 'nowrap' }}>{val != null ? String(val) : '-'}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* GEÇMİŞ EŞLEŞMELER TABLOSU - filtre seçilince altta görünür */}
            {!gunlukLoading && (sorguLoading || Object.keys(neonFiltreler).length > 0) && (
                <div style={{ background: 'var(--bg-card)', overflow: 'hidden', flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ color: 'var(--gold)', fontWeight: 800 }}>Geçmiş Eşleşmeler</span>
                        {Object.values(gecmisFiltre).some(v => v) && (
                            <button onClick={() => setGecmisFiltre({})} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                Filtreyi Temizle
                            </button>
                        )}
                        <div style={{ marginLeft: 'auto', background: 'var(--primary-green)', color: 'var(--gold)', padding: '3px 12px', borderRadius: 999, fontWeight: 800, fontSize: 13 }}>
                            {sorguLoading ? '...' : `${filtreliEslesmeler.length} / ${totalMatches} eşleşme`}
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
                            <thead>
                                <tr>
                                    {gecmisKolonlar.map(col => (
                                        <th key={col} style={{ background: 'var(--primary-green-dark)', padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', verticalAlign: 'top', position: 'sticky', top: 0, zIndex: 2 }}>
                                            <div style={{ color: 'var(--gold)', fontSize: 10, fontWeight: 800, marginBottom: 3 }}>{ETIKET[col] || col}</div>
                                            <select value={gecmisFiltre[col] || ''} onChange={e => setGecmisFiltre(prev => ({ ...prev, [col]: e.target.value }))}
                                                style={{ width: '100%', minWidth: 55, background: 'var(--bg-dark)', color: gecmisFiltre[col] ? 'var(--gold)' : 'var(--text-secondary)', border: gecmisFiltre[col] ? '1px solid var(--gold)' : '1px solid var(--border)', borderRadius: 4, padding: '2px 3px', fontSize: 10, outline: 'none', cursor: 'pointer' }}>
                                                <option value="">Tümü</option>
                                                {(gecmisSecenekler[col] || []).map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </th>
                                    ))}
                                </tr>
                                {/* REFERANS MAÇ - filtreye uyan günlük maç, başlıkların hemen altında sabit altın satır */}
                                {referansMac && (
                                    <tr style={{ background: 'rgba(255,200,0,0.12)', borderBottom: '2px solid var(--gold)', position: 'sticky', top: 44, zIndex: 1 }}>
                                        {gecmisKolonlar.map(col => {
                                            const gunlukKey = Object.entries(GUNLUK_TO_DB).find(([, v]) => v === col)?.[0];
                                            let val = gunlukKey ? referansMac[gunlukKey] : undefined;
                                            if (val === undefined) val = referansMac[col];
                                            if (col === 'tarih' && typeof val === 'number') val = new Date(val).toLocaleDateString('tr-TR');
                                            return (
                                                <td key={col} style={{ padding: '6px 8px', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '2px solid var(--gold)', color: 'var(--gold)', fontWeight: 800, textAlign: 'center' }}>
                                                    {val != null && val !== '' ? String(val) : '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {sorguLoading ? (
                                    <tr><td colSpan={gecmisKolonlar.length} style={{ padding: 20, color: 'var(--text-secondary)', textAlign: 'center' }}>Aranıyor...</td></tr>
                                ) : sorguError ? (
                                    <tr><td colSpan={gecmisKolonlar.length} style={{ padding: 20, color: 'var(--error)', textAlign: 'center' }}>{sorguError}</td></tr>
                                ) : eslesmeler.length === 0 ? (
                                    <tr><td colSpan={gecmisKolonlar.length} style={{ padding: 20, color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        Eşleşen geçmiş maç bulunamadı.
                                    </td></tr>
                                ) : (
                                    filtreliEslesmeler.slice(0, gosterilen).map((row, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-dark)' : 'rgba(255,255,255,0.02)' }}>
                                            {gecmisKolonlar.map(col => (
                                                <td key={col} style={{ padding: '6px 8px', fontSize: 12, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)', color: (col === 'msskor' || col === 'iyskor') ? 'var(--gold)' : 'var(--text-primary)', fontWeight: (col === 'msskor' || col === 'iyskor') ? 800 : 400 }}>
                                                    {row[col] != null ? String(row[col]) : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {filtreliEslesmeler.length > gosterilen && (
                            <div style={{ padding: 12, textAlign: 'center' }}>
                                <button onClick={() => setGosterilen(v => v + 50)} style={{ padding: '8px 24px', borderRadius: 999, background: 'var(--primary-green)', border: 'none', color: 'var(--gold)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                    Daha Fazla ({filtreliEslesmeler.length - gosterilen} kaldı)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
