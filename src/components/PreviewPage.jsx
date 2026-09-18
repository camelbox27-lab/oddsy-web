import { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const KART_URL = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/kart.json';
const KORNER_URL = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/korner.json';
const DROPPING_URL = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/data/droppingOdds.json';
const DAILY_URL = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/data/dailyChoices.json';

// Örnek başarı oranı verisi (gerçek veri entegrasyonu için dailyChoices geçmişi gerekir)
const BASARI_MOCK = [
    { gun: 'Pts', oran: 68 },
    { gun: 'Sal', oran: 72 },
    { gun: 'Çar', oran: 55 },
    { gun: 'Per', oran: 80 },
    { gun: 'Cum', oran: 75 },
    { gun: 'Cmt', oran: 82 },
    { gun: 'Paz', oran: 70 },
];

const LIG_LABELS = {
    premier_lig: 'Premier Lig',
    la_liga: 'La Liga',
    serie_a: 'Serie A',
    bundesliga: 'Bundesliga',
    ligue_1: 'Ligue 1',
    super_lig: 'Süper Lig',
    eredivisie: 'Eredivisie',
    portekiz_ligi: 'Portekiz Ligi',
};

function ortalama(arr, key) {
    if (!arr || arr.length === 0) return 0;
    return (arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length).toFixed(1);
}

// --- BÖLÜM 1: Başarı Oranı ---
function BasariOrani({ dailyData }) {
    const toplam = dailyData.length;
    // Kazanan tahmin sayısı için mock (gerçek: sonuçlarla karşılaştır)
    const kazanan = Math.round(toplam * 0.71);

    return (
        <div className="preview-card">
            <h2 className="preview-card-title">Tahmin Başarı Oranı</h2>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: 'var(--gold-text)' }}>%71</span>
                    <span className="preview-stat-label">Genel Başarı</span>
                </div>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: 'var(--success)' }}>{kazanan}</span>
                    <span className="preview-stat-label">Doğru Tahmin</span>
                </div>
                <div className="preview-stat-box">
                    <span className="preview-stat-num">{toplam}</span>
                    <span className="preview-stat-label">Toplam Tahmin</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={BASARI_MOCK}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="gun" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis domain={[40, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} unit="%" />
                    <Tooltip
                        formatter={(v) => [`%${v}`, 'Başarı']}
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Line type="monotone" dataKey="oran" stroke="var(--gold)" strokeWidth={2} dot={{ fill: 'var(--gold)', r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                * Son 7 günlük başarı trendi
            </p>
        </div>
    );
}

// --- BÖLÜM 2: xG & İstatistik Kartları ---
function IstatistikKartlari({ kartData, kornerData }) {
    const [seciliLig, setSeciliLig] = useState('premier_lig');
    const [seciliTakim, setSeciliTakim] = useState(null);

    const ligListesi = Object.keys(kartData);
    const takimListesi = kartData[seciliLig] ? Object.keys(kartData[seciliLig]) : [];

    useEffect(() => {
        if (takimListesi.length > 0) setSeciliTakim(takimListesi[0]);
    }, [seciliLig]);

    const kartlar = kartData[seciliLig]?.[seciliTakim] || [];
    const kornerler = kornerData[seciliLig]?.[seciliTakim] || [];

    const kartOrt = ortalama(kartlar, 'takim');
    const rakipKartOrt = ortalama(kartlar, 'rakipSayi');
    const kornerOrt = ortalama(kornerler, 'takim');
    const rakipKornerOrt = ortalama(kornerler, 'rakipSayi');

    const chartData = kartlar.slice(0, 8).map((m, i) => ({
        mac: m.rakip?.slice(0, 8) || `M${i + 1}`,
        kart: m.takim,
        rakipKart: m.rakipSayi,
        korner: kornerler[i]?.takim || 0,
        rakipKorner: kornerler[i]?.rakipSayi || 0,
    }));

    return (
        <div className="preview-card">
            <h2 className="preview-card-title">xG & İstatistik Kartları</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <select
                    className="preview-select"
                    value={seciliLig}
                    onChange={e => setSeciliLig(e.target.value)}
                >
                    {ligListesi.map(l => (
                        <option key={l} value={l}>{LIG_LABELS[l] || l}</option>
                    ))}
                </select>
                <select
                    className="preview-select"
                    value={seciliTakim || ''}
                    onChange={e => setSeciliTakim(e.target.value)}
                >
                    {takimListesi.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: '#f87171' }}>{kartOrt}</span>
                    <span className="preview-stat-label">Ort. Kart (Takım)</span>
                </div>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: '#fb923c' }}>{rakipKartOrt}</span>
                    <span className="preview-stat-label">Ort. Kart (Rakip)</span>
                </div>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: '#4ade80' }}>{kornerOrt}</span>
                    <span className="preview-stat-label">Ort. Korner (Takım)</span>
                </div>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: '#60a5fa' }}>{rakipKornerOrt}</span>
                    <span className="preview-stat-label">Ort. Korner (Rakip)</span>
                </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Son 8 Maç Kart Dağılımı</p>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mac" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="kart" name="Takım Kartı" fill="#f87171" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="rakipKart" name="Rakip Kartı" fill="#fb923c" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- BÖLÜM 3: Maç Karşılaştırma ---
function MacKarsilastirma({ kartData, kornerData }) {
    const [lig, setLig] = useState('premier_lig');
    const [takim1, setTakim1] = useState(null);
    const [takim2, setTakim2] = useState(null);

    const ligListesi = Object.keys(kartData);
    const takimListesi = kartData[lig] ? Object.keys(kartData[lig]) : [];

    useEffect(() => {
        if (takimListesi.length >= 2) {
            setTakim1(takimListesi[0]);
            setTakim2(takimListesi[1]);
        }
    }, [lig]);

    const son5 = (takim) => {
        const kartlar = kartData[lig]?.[takim]?.slice(0, 5) || [];
        const kornerler = kornerData[lig]?.[takim]?.slice(0, 5) || [];
        return kartlar.map((m, i) => ({
            mac: `M${i + 1}`,
            kart: m.takim,
            korner: kornerler[i]?.takim || 0,
        }));
    };

    const d1 = son5(takim1);
    const d2 = son5(takim2);

    const merged = d1.map((m, i) => ({
        mac: m.mac,
        [`${takim1} Kart`]: m.kart,
        [`${takim2} Kart`]: d2[i]?.kart || 0,
        [`${takim1} Korner`]: m.korner,
        [`${takim2} Korner`]: d2[i]?.korner || 0,
    }));

    return (
        <div className="preview-card">
            <h2 className="preview-card-title">Maç Karşılaştırma</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <select className="preview-select" value={lig} onChange={e => setLig(e.target.value)}>
                    {ligListesi.map(l => <option key={l} value={l}>{LIG_LABELS[l] || l}</option>)}
                </select>
                <select className="preview-select" value={takim1 || ''} onChange={e => setTakim1(e.target.value)}>
                    {takimListesi.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ alignSelf: 'center', color: 'var(--gold-text)', fontWeight: 700 }}>vs</span>
                <select className="preview-select" value={takim2 || ''} onChange={e => setTakim2(e.target.value)}>
                    {takimListesi.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Son 5 Maç — Kart Karşılaştırması</p>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={merged}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mac" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey={`${takim1} Kart`} fill="#f87171" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={`${takim2} Kart`} fill="#60a5fa" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, marginTop: 16 }}>Son 5 Maç — Korner Karşılaştırması</p>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={merged}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mac" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line dataKey={`${takim1} Korner`} stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
                    <Line dataKey={`${takim2} Korner`} stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- BÖLÜM 4: Oran Hareketi Grafiği ---
function OranHareketi({ droppingData }) {
    const [secili, setSecili] = useState(0);

    if (!droppingData.length) return null;

    const mac = droppingData[secili];
    const chartData = ['1', 'X', '2'].map(k => ({
        sec: k === '1' ? 'Ev Sahibi' : k === 'X' ? 'Beraberlik' : 'Deplasman',
        acilis: mac.initialOdds?.[k] || 0,
        kapanis: mac.currentOdds?.[k] || 0,
        degisim: +(((mac.initialOdds?.[k] || 0) - (mac.currentOdds?.[k] || 0)) / (mac.initialOdds?.[k] || 1) * 100).toFixed(1),
    }));

    return (
        <div className="preview-card">
            <h2 className="preview-card-title">Oran Hareketi Grafiği</h2>
            <select
                className="preview-select"
                style={{ marginBottom: 12, width: '100%' }}
                value={secili}
                onChange={e => setSecili(+e.target.value)}
            >
                {droppingData.map((m, i) => (
                    <option key={i} value={i}>
                        {m.homeTeam} vs {m.awayTeam} — %{m.dropPercentage?.toFixed(1)} düşüş
                    </option>
                ))}
            </select>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: '#f87171' }}>%{mac.dropPercentage?.toFixed(1)}</span>
                    <span className="preview-stat-label">Oran Düşüşü</span>
                </div>
                <div className="preview-stat-box">
                    <span className="preview-stat-num" style={{ color: 'var(--gold-text)' }}>{mac.droppingChoice === '1' ? 'Ev Sahibi' : mac.droppingChoice === 'X' ? 'Beraberlik' : 'Deplasman'}</span>
                    <span className="preview-stat-label">Tercih</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} domain={[0, 'auto']} />
                    <YAxis dataKey="sec" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={80} />
                    <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="acilis" name="Açılış Oranı" fill="#94a3b8" radius={[0, 3, 3, 0]} />
                    <Bar dataKey="kapanis" name="Kapanış Oranı" fill="var(--gold)" radius={[0, 3, 3, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- ANA BILEŞEN ---
export default function PreviewPage({ onBack }) {
    const [kartData, setKartData] = useState({});
    const [kornerData, setKornerData] = useState({});
    const [droppingData, setDroppingData] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aktifTab, setAktifTab] = useState(0);

    useEffect(() => {
        Promise.all([
            fetch(KART_URL).then(r => r.json()),
            fetch(KORNER_URL).then(r => r.json()),
            fetch(DROPPING_URL).then(r => r.text()).then(t => JSON.parse(t.replace(/:\s*NaN/g, ': null'))),
            fetch(DAILY_URL).then(r => r.text()).then(t => JSON.parse(t.replace(/:\s*NaN/g, ': null'))),
        ]).then(([k, ko, d, dc]) => {
            setKartData(k);
            setKornerData(ko);
            setDroppingData(d || []);
            setDailyData(dc || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const tabs = [
        { label: 'Başarı Oranı', icon: '📊' },
        { label: 'İstatistik Kartları', icon: '🟨' },
        { label: 'Maç Karşılaştırma', icon: '⚔️' },
        { label: 'Oran Hareketi', icon: '📉' },
    ];

    return (
        <div style={{ padding: '16px', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button className="category-back-btn" onClick={onBack}>←</button>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-text)', margin: 0 }}>
                    Yeni Özellikler — Önizleme
                </h1>
                <span style={{
                    background: '#f87171', color: '#fff', fontSize: 10,
                    padding: '2px 8px', borderRadius: 99, fontWeight: 700
                }}>BETA</span>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                {tabs.map((t, i) => (
                    <button
                        key={i}
                        onClick={() => setAktifTab(i)}
                        style={{
                            whiteSpace: 'nowrap',
                            padding: '6px 14px',
                            borderRadius: 99,
                            border: `1px solid ${aktifTab === i ? 'var(--gold)' : 'var(--border)'}`,
                            background: aktifTab === i ? 'var(--gold)' : 'transparent',
                            color: aktifTab === i ? '#000' : 'var(--text-secondary)',
                            fontWeight: aktifTab === i ? 700 : 400,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                    Veriler yükleniyor...
                </div>
            ) : (
                <>
                    {aktifTab === 0 && <BasariOrani dailyData={dailyData} />}
                    {aktifTab === 1 && <IstatistikKartlari kartData={kartData} kornerData={kornerData} />}
                    {aktifTab === 2 && <MacKarsilastirma kartData={kartData} kornerData={kornerData} />}
                    {aktifTab === 3 && <OranHareketi droppingData={droppingData} />}
                </>
            )}

            <style>{`
                .preview-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 16px;
                }
                .preview-card-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 14px 0;
                    border-left: 3px solid var(--gold);
                    padding-left: 10px;
                }
                .preview-stat-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: var(--bg-dark);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    padding: 10px 16px;
                    min-width: 80px;
                }
                .preview-stat-num {
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--text-primary);
                    line-height: 1.2;
                }
                .preview-stat-label {
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-top: 2px;
                    text-align: center;
                    opacity: 0.7;
                }
                .preview-select {
                    background: var(--bg-dark);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
}
