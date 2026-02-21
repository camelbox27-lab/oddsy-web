import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';

const LIG_ISIMLERI = {
    'premier_lig': 'Premier Lig',
    'la_liga': 'La Liga',
    'serie_a': 'Serie A',
    'bundesliga': 'Bundesliga',
    'ligue_1': 'Ligue 1',
    'super_lig': 'Süper Lig',
    'eredivisie': 'Eredivisie',
    'portekiz_ligi': 'Portekiz Ligi'
};

function Kart({ onBack }) {
    const [kartData, setKartData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedLig, setSelectedLig] = useState('');
    const [selectedEvSahibi, setSelectedEvSahibi] = useState('');
    const [selectedDeplasman, setSelectedDeplasman] = useState('');

    const [analiz, setAnaliz] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Kart verileri GitHub üzerinden çekiliyor
                const res = await fetch('https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/data/kart.json?t=' + Date.now());
                const data = await res.json();
                if (data) setKartData(data.data || data);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const normalize = (s) => s ? s.toLowerCase().replace(/\s+/g, '').replace(/_/g, '').trim() : "";

    const getActiveLigData = (allData) => {
        if (!selectedLig || !allData) return null;
        const target = normalize(selectedLig);
        const disp = normalize(LIG_ISIMLERI[selectedLig] || "");
        const key = Object.keys(allData).find(k => normalize(k) === target || normalize(k) === disp);
        return key ? allData[key] : null;
    };

    const getTakimListesi = () => {
        const data = getActiveLigData(kartData);
        return data ? Object.keys(data).sort() : [];
    };

    const hesaplaOrt = (matches, field) => {
        if (!matches || !Array.isArray(matches) || matches.length === 0) return 0;
        const top = matches.reduce((s, m) => s + (parseFloat(m[field]) || 0), 0);
        return (top / matches.length).toFixed(1);
    };

    const getLigOrt = (ligData) => {
        if (!ligData) return 0;
        const tks = Object.keys(ligData);
        let totalSum = 0;
        let totalCount = 0;

        tks.forEach(t => {
            const matches = ligData[t];
            if (matches && Array.isArray(matches)) {
                matches.forEach(m => {
                    totalSum += parseFloat(m['takim']) || 0;
                    totalCount++;
                });
            }
        });

        return totalCount > 0 ? (totalSum / totalCount).toFixed(1) : 0;
    };

    const analiziBaslat = () => {
        if (!selectedLig || !selectedEvSahibi || !selectedDeplasman) return;

        const kaL = getActiveLigData(kartData);

        if (!kaL) return;

        const evKaOrt = parseFloat(hesaplaOrt(kaL[selectedEvSahibi], 'takim'));
        const depKaOrt = parseFloat(hesaplaOrt(kaL[selectedDeplasman], 'takim'));

        const lKaOrt = getLigOrt(kaL);

        const toplamKart = evKaOrt + depKaOrt;
        let tahmin = '';

        if (toplamKart > 4.5) {
            tahmin = '4.5 ÜST';
        } else if (toplamKart > 3.5) {
            tahmin = '3.5 ÜST';
        } else {
            tahmin = '3.5 ALT';
        }

        setAnaliz({
            ev: evKaOrt,
            dep: depKaOrt,
            lig: lKaOrt,
            tahmin: tahmin
        });
    };

    if (loading) return <div className="p-20 text-center text-[#FDB913]">GİRİŞ YAPILIYOR...</div>;

    const takimlar = getTakimListesi();

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 pb-40">
            <button onClick={onBack} className="text-[#FDB913] font-black mb-4">← GERİ DÖN</button>

            {/* SEÇİM KUTUSU */}
            <div className="bg-[#2e3335] rounded-3xl p-8 border-2 border-[#006A4E] shadow-2xl">
                <h2 className="text-[#FDB913] text-2xl font-black mb-8 text-center uppercase tracking-widest">KART ANALİZİ YAP!</h2>

                <div className="space-y-6">
                    <div>
                        <label className="text-[#FDB913] text-[11px] font-black block mb-2 uppercase tracking-widest">LİG SEÇİMİ</label>
                        <select value={selectedLig} onChange={(e) => { setSelectedLig(e.target.value); setSelectedEvSahibi(''); setSelectedDeplasman(''); setAnaliz(null); }} className="w-full bg-[#3a4144] text-white border-2 border-[#006A4E] rounded-xl p-4 outline-none font-bold">
                            <option value="">LİG SEÇİNİZ</option>
                            {Object.entries(LIG_ISIMLERI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[#FDB913] text-[11px] font-black block mb-2 uppercase tracking-widest">EV SAHİBİ</label>
                            <select value={selectedEvSahibi} onChange={(e) => setSelectedEvSahibi(e.target.value)} disabled={!selectedLig} className="w-full bg-[#3a4144] text-white border-2 border-[#006A4E] rounded-xl p-4 outline-none disabled:opacity-30 font-bold">
                                <option value="">TAKIM SEÇİNİZ</option>
                                {takimlar.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[#FDB913] text-[11px] font-black block mb-2 uppercase tracking-widest">DEPLASMAN</label>
                            <select value={selectedDeplasman} onChange={(e) => setSelectedDeplasman(e.target.value)} disabled={!selectedEvSahibi} className="w-full bg-[#3a4144] text-white border-2 border-[#006A4E] rounded-xl p-4 outline-none disabled:opacity-30 font-bold">
                                <option value="">TAKIM SEÇİNİZ</option>
                                {takimlar.filter(t => t !== selectedEvSahibi).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <button onClick={analiziBaslat} disabled={!selectedDeplasman} className="w-full bg-[#006A4E] text-[#FDB913] font-black py-5 rounded-2xl border-b-4 border-[#00523c] text-lg active:border-b-0 active:translate-y-1 transition-all disabled:opacity-30">ANALİZİ BAŞLAT</button>
                </div>
            </div>

            {analiz && (
                <div className="bg-[#2e3335] rounded-3xl p-8 border-2 border-[#006A4E] shadow-xl">
                    <div className="flex items-center gap-3 mb-8 border-b border-[#006A4E]/30 pb-4">
                        <span className="text-3xl">🟨</span>
                        <h3 className="text-[#FDB913] font-black text-xl uppercase">KART ANALİZİ</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="bg-[#3a4144] p-5 rounded-xl border border-[#006A4E]/20">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-[12px] text-white font-bold uppercase">{selectedEvSahibi}</p>
                                        <p className="text-[9px] text-[#FDB913] font-bold">Lig Ortalaması: {analiz.lig}</p>
                                    </div>
                                    <span className="text-[#FDB913] font-black text-4xl">{analiz.ev}</span>
                                </div>
                                <div className="w-full bg-[#2e3335] rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-[#FDB913] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((parseFloat(analiz.ev) / parseFloat(analiz.lig)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="bg-[#3a4144] p-5 rounded-xl border border-[#006A4E]/20">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-[12px] text-white font-bold uppercase">{selectedDeplasman}</p>
                                        <p className="text-[9px] text-[#FDB913] font-bold">Lig Ortalaması: {analiz.lig}</p>
                                    </div>
                                    <span className="text-[#FDB913] font-black text-4xl">{analiz.dep}</span>
                                </div>
                                <div className="w-full bg-[#2e3335] rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-[#FDB913] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((parseFloat(analiz.dep) / parseFloat(analiz.lig)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#006A4E]/20 rounded-2xl p-8 flex flex-col items-center justify-center border-2 border-[#006A4E] text-center">
                            <p className="text-[#FDB913]/60 text-[11px] font-black mb-2 uppercase">ÖNERİLEN TAHMİN</p>
                            <p className="text-[#FDB913] text-5xl font-black">{analiz.tahmin}</p>
                        </div>
                    </div>
                </div>
            )}
            <style>{`select { cursor: pointer; transition: all 0.2s; } select:focus { border-color: #FDB913 !important; }`}</style>
        </div>
    );
}

export default Kart;
