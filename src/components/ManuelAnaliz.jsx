import { ArrowLeft, Search, Star, Trophy, Zap, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getTeamLogo, handleLogoError } from '../helper';
const iddaaGecmisUrl = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/iddaa/gecmis/iddaagecmis.json';

// Lig listesi - YapayZeka ile aynı
const LEAGUES = [
    { name: "🇹🇷 Türkiye Süper Lig", file: "Süper Lig" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 İngiltere Premier League", file: "Premier League" },
    { name: "🇪🇸 İspanya La Liga", file: "La Liga" },
    { name: "🇩🇪 Almanya Bundesliga", file: "Bundesliga" },
    { name: "🇮🇹 İtalya Serie A", file: "Serie A" },
    { name: "🇫🇷 Fransa Ligue 1", file: "Ligue 1" },
    { name: "🇳🇱 Hollanda Eredivisie", file: "Eredivisie" },
    { name: "🇵🇹 Portekiz Primeira Liga", file: "PORTUGAL PRIMEIRA LIGA" },
    { name: "⭐ UEFA Şampiyonlar Ligi", file: "EUROPE CHAMPIONS LEAGUE" },
    { name: "⭐ UEFA Avrupa Ligi", file: "EUROPE EUROPA LEAGUE" },
    { name: "⭐ UEFA Konferans Ligi", file: "EUROPE CONFERENCE LEAGUE" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 İngiltere Championship", file: "Championship" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 İngiltere League One", file: "League One" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 İngiltere League Two", file: "League Two" },
    { name: "🇪🇸 İspanya La Liga 2", file: "La Liga 2" },
    { name: "🇩🇪 Almanya 2. Bundesliga", file: "Bundesliga 2" },
    { name: "🇮🇹 İtalya Serie B", file: "Serie B" },
    { name: "🇫🇷 Fransa Ligue 2", file: "Ligue 2" },
    { name: "🇧🇪 Belçika Jupiler League", file: "Jupiler League" },
    { name: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 İskoçya Premiership", file: "Premiership" },
    { name: "🇨🇭 İsviçre Super League", file: "SWITZERLAND SUPER LEAGUE" },
    { name: "🇦🇹 Avusturya Bundesliga", file: "AUSTRIA BUNDESLIGA" },
    { name: "🇷🇺 Rusya Premier Lig", file: "RUSSIA PREMIER LEAGUE" },
    { name: "🇵🇱 Polonya Ekstraklasa", file: "POLAND EKSTRAKLASA" },
    { name: "🇷🇴 Romanya Liga 1", file: "ROMANIA LIGA 1" },
    { name: "🇭🇺 Macaristan NB I", file: "HUNGARY OTP BANK LIGA" },
    { name: "🇸🇪 İsveç Allsvenskan", file: "SWEDEN ALLSVENSKAN" },
    { name: "🇳🇴 Norveç Eliteserien", file: "NORWAY ELITESERIEN" },
    { name: "🇫🇮 Finlandiya Veikkausliiga", file: "FINLAND VEIKKAUSLIIGA" },
    { name: "🇧🇷 Brezilya Serie A", file: "BRAZIL SERIE A" },
    { name: "🇦🇷 Arjantin Primera Division", file: "ARGENTINA PRIMERA DIVISION" },
    { name: "🇺🇸 ABD MLS", file: "USA MLS" },
    { name: "🇦🇺 Avustralya A-League", file: "AUSTRALIA A" },
    { name: "🌍 Dünya Kupası", file: "EUROPE WORLD CUP" },
    { name: "🇪🇺 EURO Şampiyonası", file: "EUROPE EURO" },
    { name: "🇪🇺 UEFA Uluslar Ligi", file: "EUROPE UEFA NATIONS LEAGUE" },
];

const normalizeOdds = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return (Math.round(num * 100) / 100).toFixed(2);
};

const formatScore = (score) => {
    if (!score || score === '-') return '-';
    const scoreStr = String(score).trim();
    return scoreStr.replace(/(\d+)\.0\.?-?/g, '$1-').replace(/-(\d+)\.0/g, '-$1').replace(/--/g, '-');
};

const formatIYMS = (iyms) => {
    if (!iyms || iyms === '-') return '-';
    const iymsStr = String(iyms).trim();
    if (iymsStr.startsWith('/')) return '0' + iymsStr;
    if (iymsStr.endsWith('/')) return iymsStr + '0';
    if (!iymsStr.includes('/')) return iymsStr + '/0';
    return iymsStr;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(String(dateStr).trim())) return dateStr.trim();
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return String(dateStr);
        return date.toLocaleDateString('tr-TR');
    } catch {
        return String(dateStr);
    }
};

function ManuelIddaa({ onBack }) {
    const [oran1, setOran1] = useState('');
    const [oran0, setOran0] = useState('');
    const [oran2, setOran2] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    // Güncel maç verileri
    const [guncelMatches, setGuncelMatches] = useState([]);
    const [matchLoading, setMatchLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showFeatured, setShowFeatured] = useState(false);
    const [showReady, setShowReady] = useState(false);
    const [pendingFeaturedAnalysis, setPendingFeaturedAnalysis] = useState(false);
    const [pendingReadyAnalysis, setPendingReadyAnalysis] = useState(false);

    // Güncel JSON dosyasını yükle
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/bet365/gunlukmaclar.json');
                if (res.ok) {
                    const text = await res.text();
                    const data = JSON.parse(text.replace(/:\s*NaN/g, ': null').replace(/:\s*-NaN/g, ': null'));
                    setGuncelMatches(data);
                }
            } catch(e) {}
            setMatchLoading(false);
        };
        load();
    }, []);

    // Maç seçildiğinde açılış oranlarını otomatik doldur
    const handleMatchSelect = (matchId) => {
        if (!matchId) { setSelectedMatch(null); setOran1(''); setOran0(''); setOran2(''); return; }
        const match = guncelMatches.find(m => m.Id === parseInt(matchId));
        if (match) {
            setSelectedMatch(match);
            setOran1(match['MS1 A'] ? String(match['MS1 A']) : '');
            setOran0(match['MS0 A'] ? String(match['MS0 A']) : '');
            setOran2(match['MS2 A'] ? String(match['MS2 A']) : '');
        }
    };

    const handleFeaturedSelect = (match) => {
        setShowFeatured(false);
        handleMatchSelect(String(match.Id));
        setPendingFeaturedAnalysis(true);
    };

    const handleReadySelect = (match) => {
        setShowReady(false);
        handleMatchSelect(String(match.Id));
        setPendingReadyAnalysis(true);
    };

    // Featured maç seçildikten sonra oranlar dolunca analizi başlat
    useEffect(() => {
        if (pendingFeaturedAnalysis && selectedMatch && (oran1 || oran0 || oran2)) {
            setPendingFeaturedAnalysis(false);
            startAnalysis();
        }
    }, [pendingFeaturedAnalysis, selectedMatch, oran1, oran0, oran2]);

    // Hazır analiz maç seçildikten sonra oranlar dolunca analizi başlat
    useEffect(() => {
        if (pendingReadyAnalysis && selectedMatch && (oran1 || oran0 || oran2)) {
            setPendingReadyAnalysis(false);
            startAnalysis();
        }
    }, [pendingReadyAnalysis, selectedMatch, oran1, oran0, oran2]);

    const norm = (v) => {
        if (!v) return null;
        const n = parseFloat(String(v).replace(',', '.'));
        return isNaN(n) ? null : (Math.round(n * 100) / 100).toFixed(2);
    };

    const parseScore = (score) => {
        if (!score || score === '-') return null;
        const parts = String(score).split('-');
        if (parts.length !== 2) return null;
        const home = parseInt(parts[0]);
        const away = parseInt(parts[1]);
        if (isNaN(home) || isNaN(away)) return null;
        return { home, away, total: home + away };
    };

    const analyzeBettingMarketsIddaa = (matches) => {
        if (!matches || matches.length === 0) return {};
        const total = matches.length;
        let ms1c = 0, ms0c = 0, ms2c = 0, kgVar = 0, kgYok = 0, ust25 = 0, alt25 = 0;
        let iy15ust = 0, ust35 = 0;
        let tg01 = 0, tg23 = 0, tg45 = 0, tg6p = 0;
        const scoreCounts = {};

        matches.forEach(m => {
            const ms = parseScore(m['MS Skor']);
            const iy = parseScore(m['IY Skor']);
            if (!ms) return;
            if (ms.home > ms.away) ms1c++;
            else if (ms.home === ms.away) ms0c++;
            else ms2c++;
            if (ms.home > 0 && ms.away > 0) kgVar++; else kgYok++;
            if (ms.total >= 3) ust25++; else alt25++;
            if (ms.total >= 4) ust35++;
            if (ms.total <= 1) tg01++;
            else if (ms.total <= 3) tg23++;
            else if (ms.total <= 5) tg45++;
            else tg6p++;
            if (iy && iy.total >= 2) iy15ust++;
            const scoreKey = `${ms.home}-${ms.away}`;
            scoreCounts[scoreKey] = (scoreCounts[scoreKey] || 0) + 1;
        });

        const msPercentages = {
            ms1: Math.round((ms1c / total) * 100),
            ms0: Math.round((ms0c / total) * 100),
            ms2: Math.round((ms2c / total) * 100),
        };
        const altUstPercentages = {
            ust: Math.round((ust25 / total) * 100),
            alt: Math.round((alt25 / total) * 100),
        };
        const kgPercentages = {
            var: Math.round((kgVar / total) * 100),
            yok: Math.round((kgYok / total) * 100),
        };

        const araliklar = [
            { aralik: '0-1 Gol', count: tg01 },
            { aralik: '2-3 Gol', count: tg23 },
            { aralik: '4-5 Gol', count: tg45 },
            { aralik: '6+ Gol', count: tg6p },
        ].map(a => ({ ...a, yuzde: Math.round((a.count / total) * 100) })).sort((a, b) => b.yuzde - a.yuzde);

        const birinci = araliklar[0];
        const ikinci = araliklar[1];
        let guc = birinci.yuzde >= 50 ? 'guclu' : 'normal';
        if (birinci.yuzde - ikinci.yuzde <= 5) guc = 'belirsiz';
        const toplamGolOnerisi = { oneri: birinci.aralik, yuzde: birinci.yuzde, guc, detay: araliklar };

        const topScores = Object.entries(scoreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([score, count]) => ({ score, count }));

        const recommendations = [];
        const iy15p = Math.round((iy15ust / total) * 100);
        if (iy15p >= 60) recommendations.push({ market: 'İlk Yarı 1.5 Üst', percentage: iy15p });
        const ust35p = Math.round((ust35 / total) * 100);
        if (ust35p >= 60) recommendations.push({ market: 'MS 3.5 Üst', percentage: ust35p });

        return { msPercentages, altUstPercentages, kgPercentages, toplamGolOnerisi, topScores, recommendations, total };
    };

    const startAnalysis = async () => {
        if (!oran1 && !oran0 && !oran2) {
            setError('Lütfen en az bir oran girin!');
            return;
        }
        setError('');
        setAnalyzing(true);
        setResults(null);

        try {
            const response = await fetch(iddaaGecmisUrl);
            if (!response.ok) throw new Error('İddaa verisi yüklenemedi.');
            const data = await response.json();

            const inputOran1 = norm(oran1);
            const inputOran0 = norm(oran0);
            const inputOran2 = norm(oran2);

            const matched = data.filter(m => {
                let score = 0;
                if (inputOran1 && norm(m['MS1']) === inputOran1) score++;
                if (inputOran0 && norm(m['MS0']) === inputOran0) score++;
                if (inputOran2 && norm(m['MS2']) === inputOran2) score++;
                return score > 0;
            }).sort((a, b) => {
                const sA = [inputOran1 && norm(a['MS1']) === inputOran1, inputOran0 && norm(a['MS0']) === inputOran0, inputOran2 && norm(a['MS2']) === inputOran2].filter(Boolean).length;
                const sB = [inputOran1 && norm(b['MS1']) === inputOran1, inputOran0 && norm(b['MS0']) === inputOran0, inputOran2 && norm(b['MS2']) === inputOran2].filter(Boolean).length;
                return sB - sA;
            });

            const stats = analyzeBettingMarketsIddaa(matched);
            setResults({ ...stats, matches: matched });
        } catch (err) {
            setError('Hata: ' + err.message);
        }
        setAnalyzing(false);
    };

    if (analyzing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#333]">
                <div className="flex flex-col items-center gap-6 p-8">
                    <div className="relative flex items-center justify-center w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-4 border-[#FDB913]/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border-2 border-[#FDB913]/40 animate-pulse" />
                        <Zap className="w-12 h-12 text-[#FDB913] drop-shadow-[0_0_12px_rgba(253,185,19,0.8)]" />
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-[#FDB913] tracking-wide">İddaa Verisi Taranıyor...</p>
                        <p className="text-sm text-gray-400 mt-1">Lütfen bekleyin...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (results) {
        const { msPercentages, altUstPercentages, kgPercentages, toplamGolOnerisi, topScores = [], recommendations = [], total = 0, matches = [] } = results;
        const top10 = matches.slice(0, 10);
        return (
            <div className="min-h-screen p-4 bg-[#333] text-white font-sans">
                <div className="max-w-5xl mx-auto space-y-6">
                    <button onClick={() => setResults(null)} className="flex items-center gap-2 bg-[#404040] px-6 py-3 rounded-lg border-2 border-[#FDB913] hover:bg-[#505050] transition-all">
                        <ArrowLeft size={20} /> Yeni Analiz Yap
                    </button>

                    {/* Sonuç özeti */}
                    <div className="bg-[#404040] p-6 rounded-xl border-2 border-[#FDB913]">
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="text-[#FDB913]" size={28} />
                            <h2 className="text-xl font-bold text-[#FDB913]">Analiz Sonuçları</h2>
                        </div>
                        {selectedMatch && (
                            <div className="mb-4 p-4 bg-[#333] rounded-lg border-2 border-[#FDB913]">
                                <div className="flex items-center justify-center gap-4 text-lg font-bold">
                                    <img src={getTeamLogo(selectedMatch.Ev)} alt={selectedMatch.Ev} onError={handleLogoError} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                    <span className="text-white">🏠 {selectedMatch.Ev}</span>
                                    <span className="text-[#FDB913]">VS</span>
                                    <span className="text-white">✈️ {selectedMatch.Dep}</span>
                                    <img src={getTeamLogo(selectedMatch.Dep)} alt={selectedMatch.Dep} onError={handleLogoError} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">İddaa Aranan Oranlar:</span>
                                <p className="font-bold text-[#FDB913]">{oran1 || '-'} / {oran0 || '-'} / {oran2 || '-'}</p>
                            </div>
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">Toplam Eşleşen:</span>
                                <p className="font-bold text-white">{total} maç</p>
                            </div>
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">Gösterilen:</span>
                                <p className="font-bold text-[#006A4E]">{top10.length} maç</p>
                            </div>
                        </div>
                    </div>

                    {/* Önerilen Bahis Türleri */}
                    {(msPercentages || toplamGolOnerisi) && (
                        <div className="bg-[#404040] p-3 sm:p-4 rounded-lg border-2 border-[#FDB913] shadow-[0_0_15px_rgba(253,185,19,0.3)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="text-[#FDB913]" size={20} />
                                <h2 className="text-base sm:text-lg font-bold text-[#FDB913]">Önerilen Bahis Türleri</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">

                                {/* Toplam Gol */}
                                {toplamGolOnerisi && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-red-400 font-bold text-xs whitespace-nowrap">Toplam Gol</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-black text-white">{toplamGolOnerisi.oneri}</span>
                                                {toplamGolOnerisi.guc === 'guclu' && <span className="text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">Güçlü</span>}
                                                <span className="text-xs font-bold text-gray-300">%{toplamGolOnerisi.yuzde}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-[#222] rounded-full h-2 mb-3">
                                            <div className={`h-2 rounded-full ${toplamGolOnerisi.guc === 'guclu' ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${toplamGolOnerisi.yuzde}%` }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-gray-700">
                                            {toplamGolOnerisi.detay.sort((a, b) => {
                                                const order = { '0-1 Gol': 1, '2-3 Gol': 2, '4-5 Gol': 3, '6+ Gol': 4 };
                                                return order[a.aralik] - order[b.aralik];
                                            }).map((item, idx) => (
                                                <div key={idx} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[10px] text-gray-400">
                                                        <span>{item.aralik}</span>
                                                        <span className={item.yuzde >= 35 ? 'text-white font-bold' : ''}>%{item.yuzde}</span>
                                                    </div>
                                                    <div className="w-full bg-[#222] rounded-full h-1">
                                                        <div className={`h-1 rounded-full ${item.yuzde >= 50 ? 'bg-red-500' : item.yuzde >= 35 ? 'bg-orange-400' : 'bg-gray-600'}`} style={{ width: `${item.yuzde}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Maç Sonucu */}
                                {msPercentages && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-[#006A4E] hover:border-[#FDB913] transition-all">
                                        <span className="text-[#FDB913] font-bold text-xs sm:text-sm">Maç Sonucu</span>
                                        <div className="grid grid-cols-3 gap-1 mt-2">
                                            {[{ label: 'MS 1', val: msPercentages.ms1 }, { label: 'MS 0', val: msPercentages.ms0 }, { label: 'MS 2', val: msPercentages.ms2 }].map(({ label, val }) => (
                                                <div key={label} className={`text-center p-1.5 rounded-lg ${val >= 50 ? 'bg-[#006A4E] border border-[#FDB913]/40' : 'bg-[#404040]'}`}>
                                                    <div className="text-white font-black text-xs">{label}</div>
                                                    <div className="text-[#FDB913] font-bold text-sm">%{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2.5 Gol */}
                                {altUstPercentages && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-[#006A4E] hover:border-[#FDB913] transition-all">
                                        <span className="text-[#FDB913] font-bold text-xs sm:text-sm">2.5 Gol</span>
                                        <div className="grid grid-cols-2 gap-1 mt-2">
                                            {[{ label: '2.5 Üst', val: altUstPercentages.ust }, { label: '2.5 Alt', val: altUstPercentages.alt }].map(({ label, val }) => (
                                                <div key={label} className={`text-center p-1.5 rounded-lg ${val >= 60 ? 'bg-[#006A4E] border border-[#FDB913]/40' : 'bg-[#404040]'}`}>
                                                    <div className="text-white font-black text-xs">{label}</div>
                                                    <div className="text-[#FDB913] font-bold text-sm">%{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* KG Var/Yok */}
                                {kgPercentages && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-[#006A4E] hover:border-[#FDB913] transition-all">
                                        <span className="text-[#FDB913] font-bold text-xs sm:text-sm">KG Var / Yok</span>
                                        <div className="grid grid-cols-2 gap-1 mt-2">
                                            {[{ label: 'KG Var', val: kgPercentages.var }, { label: 'KG Yok', val: kgPercentages.yok }].map(({ label, val }) => (
                                                <div key={label} className={`text-center p-1.5 rounded-lg ${val >= 60 ? 'bg-[#006A4E] border border-[#FDB913]/40' : 'bg-[#404040]'}`}>
                                                    <div className="text-white font-black text-xs">{label}</div>
                                                    <div className="text-[#FDB913] font-bold text-sm">%{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Diğer öneriler */}
                                {recommendations.map((rec, i) => (
                                    <div key={i} className="bg-[#333] p-2 sm:p-3 rounded-lg border border-[#006A4E] hover:border-[#FDB913] transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-bold text-xs">{rec.market}</span>
                                            <span className={`text-xl font-black ${rec.percentage >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>%{rec.percentage}</span>
                                        </div>
                                        <div className="w-full bg-[#222] rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full ${rec.percentage >= 80 ? 'bg-green-400' : 'bg-yellow-400'}`} style={{ width: `${rec.percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* En çok tekrarlanan skorlar */}
                    {topScores.length > 0 && (
                        <div className="bg-[#404040] p-3 sm:p-4 rounded-lg border-2 border-[#FDB913] shadow-[0_0_15px_rgba(253,185,19,0.2)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy className="text-[#FDB913]" size={18} />
                                <h3 className="text-sm sm:text-base font-bold text-[#FDB913]">En Çok Tekrarlanan Skorlar</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {topScores.map(({ score, count }, i) => (
                                    <div key={i} className={`bg-[#333] p-3 rounded-lg text-center border-2 transition-all ${i === 0 ? 'border-[#FDB913] shadow-[0_0_8px_rgba(253,185,19,0.3)]' : 'border-[#555]'}`}>
                                        <div className="text-[#FDB913] font-black text-xl sm:text-2xl">{score}</div>
                                        <div className="text-gray-400 text-xs mt-1">{count}x tekrar</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sonuç tablosu */}
                    {top10.length > 0 ? (
                        <div className="bg-[#404040] rounded-lg overflow-hidden border-2 border-[#FDB913] shadow-[0_0_15px_rgba(253,185,19,0.3)]">
                            <div className="p-2 sm:p-3 bg-[#006A4E] font-bold text-left flex items-center gap-2">
                                <Zap size={16} />
                                <span className="text-sm sm:text-base">Benzer Oranlarla Oynanan Maçlar (İlk 10)</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead className="bg-[#333] text-gray-400 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-2 sm:p-3">Lig</th>
                                            <th className="p-2 sm:p-3">Ev Sahibi</th>
                                            <th className="p-2 sm:p-3">Deplasman</th>
                                            <th className="p-2 sm:p-3 text-center">İY</th>
                                            <th className="p-2 sm:p-3 text-center">MS</th>
                                            <th className="p-2 sm:p-3 text-center">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#555]">
                                        {top10.map((m, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className="p-2 sm:p-3 text-xs text-gray-400 whitespace-nowrap">{m['Lig'] || '-'}</td>
                                                <td className="p-2 sm:p-3 font-medium text-sm whitespace-nowrap">{m['Ev Sahibi'] || '-'}</td>
                                                <td className="p-2 sm:p-3 font-medium text-sm whitespace-nowrap">{m['Deplasman'] || '-'}</td>
                                                <td className="p-2 sm:p-3 text-center text-gray-300 text-sm">{m['IY Skor'] || '-'}</td>
                                                <td className="p-2 sm:p-3 text-center font-black text-[#FDB913] text-lg sm:text-xl">{m['MS Skor'] || '-'}</td>
                                                <td className="p-2 sm:p-3 text-center text-gray-400 text-xs whitespace-nowrap">{m['Tarih'] || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#404040] p-8 rounded-xl border-2 border-[#FDB913] text-center">
                            <div className="text-4xl mb-4">🔍</div>
                            <p className="text-xl text-gray-400">Bu kriterlere uygun maç bulunamadı.</p>
                            <p className="text-sm text-gray-500 mt-2">Farklı oranlar deneyin.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 bg-[#333] text-white font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <button className="category-back-btn" onClick={onBack} style={{ marginBottom: 8 }}>←</button>
                <div className="bg-gradient-to-br from-[#404040] via-[#4a4a4a] to-[#404040] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Edit3 className="text-[#FFD700] w-10 h-10" />
                        <h1 className="text-2xl font-black bg-gradient-to-r from-[#FFD700] to-[#FDB913] bg-clip-text text-transparent">İDDAA MANUEL ANALİZ</h1>
                        <p className="text-sm text-gray-300">MS1 / MS0 / MS2 oranlarını girerek geçmiş İddaa maçlarını analiz et</p>
                    </div>
                </div>

                {/* Öne Çıkan Eşleşmeler + Hazır Analizler Butonları */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => { setShowReady(!showReady); setShowFeatured(false); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${showReady
                            ? 'bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                            : 'bg-[#404040] text-[#10B981] border border-[#10B981] hover:bg-[#4a4a4a]'
                            }`}
                    >
                        ⚡ HAZIR ANALİZLER
                    </button>
                    <button
                        onClick={() => { setShowFeatured(!showFeatured); setShowReady(false); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${showFeatured
                            ? 'bg-[#FDB913] text-[#333] shadow-[0_0_15px_rgba(253,185,19,0.4)]'
                            : 'bg-[#404040] text-[#FDB913] border border-[#FDB913] hover:bg-[#4a4a4a]'
                            }`}
                    >
                        <Star size={18} fill={showFeatured ? '#333' : 'none'} />
                        ÖNE ÇIKAN EŞLEŞMELER
                    </button>
                </div>

                {/* Hazır Analizler Kartları */}
                {showReady && (
                    <div className="bg-[#404040] p-4 rounded-xl border-2 border-[#10B981] space-y-3">
                        <h3 className="text-[#10B981] font-bold text-center text-sm mb-3">
                            ⚡ Hazır Analizler — Analiz için bir maç seçin
                        </h3>
                        {guncelMatches.filter(m => m.Ready === 2).length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {guncelMatches.filter(m => m.Ready === 2).map(match => (
                                    <button
                                        key={match.Id}
                                        onClick={() => handleReadySelect(match)}
                                        className="flex items-center justify-between gap-4 bg-[#333] p-4 rounded-xl border border-[#555] hover:border-[#10B981] hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all cursor-pointer"
                                    >
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <img src={getTeamLogo(match.Ev)} alt={match.Ev} onError={handleLogoError} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                            <span className="text-white font-bold text-sm text-center">{match.Ev}</span>
                                        </div>
                                        <span className="text-[#10B981] font-black text-lg">VS</span>
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <img src={getTeamLogo(match.Dep)} alt={match.Dep} onError={handleLogoError} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                            <span className="text-white font-bold text-sm text-center">{match.Dep}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center text-sm py-4">Bugün hazır analiz bulunmuyor.</p>
                        )}
                    </div>
                )}

                {/* Featured Maç Kartları */}
                {showFeatured && (
                    <div className="bg-[#404040] p-4 rounded-xl border-2 border-[#FDB913] space-y-3">
                        <h3 className="text-[#FDB913] font-bold text-center text-sm mb-3">
                            Günün Öne Çıkan Maçları — Analiz için birini seçin
                        </h3>
                        {guncelMatches.filter(m => m.Featured === 1).length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {guncelMatches.filter(m => m.Featured === 1).map(match => (
                                    <button
                                        key={match.Id}
                                        onClick={() => handleFeaturedSelect(match)}
                                        className="flex items-center justify-between gap-4 bg-[#333] p-4 rounded-xl border border-[#555] hover:border-[#FDB913] hover:shadow-[0_0_10px_rgba(253,185,19,0.2)] transition-all cursor-pointer"
                                    >
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <img src={getTeamLogo(match.Ev)} alt={match.Ev} onError={handleLogoError} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                            <span className="text-white font-bold text-sm text-center">{match.Ev}</span>
                                        </div>
                                        <span className="text-[#FDB913] font-black text-lg">VS</span>
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <img src={getTeamLogo(match.Dep)} alt={match.Dep} onError={handleLogoError} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                            <span className="text-white font-bold text-sm text-center">{match.Dep}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center text-sm py-4">Bugün öne çıkan eşleşme bulunmuyor.</p>
                        )}
                    </div>
                )}

                {error && <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400">{error}</div>}

                <div className="bg-[#404040] p-6 rounded-xl border-2 border-[#FDB913] space-y-6">
                    {/* Maç Seçimi */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Maç Seçin (opsiyonel)</label>
                        <select
                            value={selectedMatch?.Id || ''}
                            onChange={e => handleMatchSelect(e.target.value)}
                            className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white outline-none focus:border-[#FDB913] transition-colors"
                            disabled={matchLoading}
                        >
                            <option value="">
                                {matchLoading ? '⏳ Yükleniyor...' : '-- Maç seçin veya oranları elle girin --'}
                            </option>
                            {guncelMatches.map(match => (
                                <option key={match.Id} value={match.Id}>
                                    🏠 {match.Ev} vs ✈️ {match.Dep}
                                </option>
                            ))}
                        </select>
                        {selectedMatch && (
                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                                <img src={getTeamLogo(selectedMatch.Ev)} alt={selectedMatch.Ev} onError={handleLogoError} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                <span className="text-[#FDB913] font-bold">{selectedMatch.Ev}</span>
                                <span>vs</span>
                                <img src={getTeamLogo(selectedMatch.Dep)} alt={selectedMatch.Dep} onError={handleLogoError} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                <span className="text-[#FDB913] font-bold">{selectedMatch.Dep}</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">İddaa Oranları (MS1 - MS0 - MS2)</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'MS1 (Ev Sahibi)', val: oran1, set: setOran1, ph: '1.50' },
                                { label: 'MS0 (Beraberlik)', val: oran0, set: setOran0, ph: '4.00' },
                                { label: 'MS2 (Deplasman)', val: oran2, set: setOran2, ph: '5.50' },
                            ].map(item => (
                                <div key={item.label}>
                                    <label className="block text-xs text-[#FDB913] mb-1 text-center">{item.label}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.val}
                                        onChange={e => item.set(e.target.value)}
                                        className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none focus:border-[#FDB913] font-bold text-lg"
                                        placeholder={item.ph}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">En az bir oran girilmelidir.</p>
                    </div>
                    <button
                        onClick={startAnalysis}
                        className="w-full bg-[#006A4E] py-5 rounded-xl font-black text-xl hover:bg-[#00815E] transition-all flex items-center justify-center gap-3"
                    >
                        <Search size={24} /> İDDAA ANALİZİNİ BAŞLAT
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ManuelAnaliz() {
    const [source, setSource] = useState(null); // null=seçim, 'bet365', 'iddaa'
    const [evSahibi, setEvSahibi] = useState('');
    const [deplasman, setDeplasman] = useState('');
    const [oranTuru, setOranTuru] = useState('acilis');
    const [oran1, setOran1] = useState('');
    const [oran0, setOran0] = useState('');
    const [oran2, setOran2] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState([]);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState('');
    const isIddaaSource = source === 'iddaa';
    const sourceLabel = isIddaaSource ? 'İddaa' : 'Bet365';

    const analyzeBettingMarkets = (matches) => {
        if (!matches || matches.length === 0) return [];

        const totalMatches = matches.length;

        const marketStats = {
            'Ev Sahibi 1.5 Üst': 0,
            'Deplasman 1.5 Üst': 0,
            'MS 2.5 Üst': 0,
            'MS 2.5 Alt': 0,
            'MS 3.5 Üst': 0,
            'İlk Yarı 1.5 Üst': 0,
            'İlk Yarı KG Var': 0,
            'KG Var': 0,
            'KG Yok': 0,
            'MS 1': 0,
            'MS 0': 0,
            'MS 2': 0
        };

        let tg_0_1 = 0;
        let tg_2_3 = 0;
        let tg_4_5 = 0;
        let tg_6_plus = 0;

        matches.forEach(match => {
            const msScore = match.macSonucu || match['Maç Sonucu Skor'] || '-';
            const iyScore = match.ilkYari || match['İlk Yarı Skor'] || '-';

            const parseScore = (score) => {
                if (!score || score === '-') return null;
                const parts = String(score).split('-');
                if (parts.length !== 2) return null;
                const home = parseInt(parts[0]);
                const away = parseInt(parts[1]);
                if (isNaN(home) || isNaN(away)) return null;
                return { home, away, total: home + away };
            };

            const ms = parseScore(msScore);
            const iy = parseScore(iyScore);

            if (!ms) return;

            if (ms.home >= 2) marketStats['Ev Sahibi 1.5 Üst']++;
            if (ms.away >= 2) marketStats['Deplasman 1.5 Üst']++;
            if (ms.total >= 3) marketStats['MS 2.5 Üst']++;
            else marketStats['MS 2.5 Alt']++;
            if (ms.total >= 4) marketStats['MS 3.5 Üst']++;

            if (ms.total <= 1) tg_0_1++;
            else if (ms.total === 2 || ms.total === 3) tg_2_3++;
            else if (ms.total === 4 || ms.total === 5) tg_4_5++;
            else if (ms.total >= 6) tg_6_plus++;

            if (ms.home > 0 && ms.away > 0) marketStats['KG Var']++;
            else marketStats['KG Yok']++;
            if (ms.home > ms.away) marketStats['MS 1']++;
            else if (ms.home === ms.away) marketStats['MS 0']++;
            else marketStats['MS 2']++;

            if (iy) {
                if (iy.total >= 2) marketStats['İlk Yarı 1.5 Üst']++;
                if (iy.home > 0 && iy.away > 0) marketStats['İlk Yarı KG Var']++;
            }
        });

        let toplamGolOnerisi = null;
        if (totalMatches > 0) {
            const araliklar = [
                { aralik: "0-1 Gol", count: tg_0_1 },
                { aralik: "2-3 Gol", count: tg_2_3 },
                { aralik: "4-5 Gol", count: tg_4_5 },
                { aralik: "6+ Gol", count: tg_6_plus }
            ].map(a => ({
                ...a,
                yuzde: Math.round((a.count / totalMatches) * 100)
            })).sort((a, b) => b.yuzde - a.yuzde);

            const birinci = araliklar[0];
            const ikinci = araliklar[1];
            let guc, oneriText;

            if (birinci.yuzde >= 50) {
                guc = "guclu";
                oneriText = `${birinci.aralik}`;
            } else if (birinci.yuzde >= 35) {
                guc = "normal";
                oneriText = `${birinci.aralik}`;
            } else if (birinci.yuzde - ikinci.yuzde <= 5) {
                guc = "belirsiz";
                oneriText = `${birinci.aralik} / ${ikinci.aralik}`;
            } else {
                guc = "normal";
                oneriText = `${birinci.aralik}`;
            }

            toplamGolOnerisi = {
                oneri: oneriText,
                label: oneriText,
                yuzde: birinci.yuzde,
                percentage: birinci.yuzde,
                guc: guc,
                detay: araliklar
            };
        }

        const msPercentages = {
            ms1: totalMatches ? Math.round((marketStats['MS 1'] / totalMatches) * 100) : 0,
            ms0: totalMatches ? Math.round((marketStats['MS 0'] / totalMatches) * 100) : 0,
            ms2: totalMatches ? Math.round((marketStats['MS 2'] / totalMatches) * 100) : 0
        };

        const altUstPercentages = {
            ust: totalMatches ? Math.round((marketStats['MS 2.5 Üst'] / totalMatches) * 100) : 0,
            alt: totalMatches ? Math.round((marketStats['MS 2.5 Alt'] / totalMatches) * 100) : 0
        };

        const rawPercentages = {};
        Object.entries(marketStats).forEach(([market, count]) => {
            rawPercentages[market] = totalMatches ? Math.round((count / totalMatches) * 100) : 0;
        });

        const suppressedMarkets = new Set(['MS 1', 'MS 0', 'MS 2', 'MS 2.5 Üst', 'MS 2.5 Alt', 'MS 3.5 Üst', 'MS 1.5 Alt', 'MS 5.5 Üst', 'KG Var', 'KG Yok']);

        const kgPercentages = {
            var: totalMatches ? Math.round((marketStats['KG Var'] / totalMatches) * 100) : 0,
            yok: totalMatches ? Math.round((marketStats['KG Yok'] / totalMatches) * 100) : 0
        };

        return {
            recommendations: Object.entries(marketStats)
                .filter(([market]) => !suppressedMarkets.has(market))
                .map(([market, count]) => ({
                    market,
                    count,
                    percentage: rawPercentages[market]
                }))
                .filter(item => item.percentage >= 60)
                .sort((a, b) => b.percentage - a.percentage),
            toplamGolOnerisi,
            msPercentages,
            altUstPercentages,
            kgPercentages
        };
    };

    const startAnalysis = async () => {
        if (!evSahibi.trim() || !deplasman.trim()) {
            setError('Lütfen ev sahibi ve deplasman takım isimlerini girin!');
            return;
        }
        if (!oran1 && !oran0 && !oran2) {
            setError('Lütfen en az bir oran girin!');
            return;
        }

        setError('');
        setAnalyzing(true);
        setResults([]);
        setShowResults(false);

        const msgs = ["Sistem Hazırlanıyor...", isIddaaSource ? "İddaa Verileri Taranıyor..." : "Tüm Ligler Taranıyor...", "Oranlar Karşılaştırılıyor...", "Bahis Türleri Analiz Ediliyor..."];
        for (let i = 0; i < msgs.length; i++) {
            setLoadingMsg(msgs[i]);
            await new Promise(r => setTimeout(r, 150));
        }

        const oranKey1 = isIddaaSource
            ? ['MS1']
            : oranTuru === 'acilis'
                ? ['Bet365 Açılış 1', 'Bet365 AÃ§Ä±lÄ±ÅŸ 1', 'Bet365 Acilis 1']
                : ['Bet365 Kapanış 1', 'Bet365 KapanÄ±ÅŸ 1', 'Bet365 Kapanis 1'];
        const oranKey0 = isIddaaSource
            ? ['MS0']
            : oranTuru === 'acilis'
                ? ['Bet365 Açılış 0', 'Bet365 AÃ§Ä±lÄ±ÅŸ 0', 'Bet365 Acilis 0']
                : ['Bet365 Kapanış 0', 'Bet365 KapanÄ±ÅŸ 0', 'Bet365 Kapanis 0'];
        const oranKey2 = isIddaaSource
            ? ['MS2']
            : oranTuru === 'acilis'
                ? ['Bet365 Açılış 2', 'Bet365 AÃ§Ä±lÄ±ÅŸ 2', 'Bet365 Acilis 2']
                : ['Bet365 Kapanış 2', 'Bet365 KapanÄ±ÅŸ 2', 'Bet365 Kapanis 2'];

        const getOddsValue = (match, keys) => {
            for (const key of keys) {
                if (match[key] !== undefined && match[key] !== null) return match[key];
            }
            return null;
        };

        const loadLeagueData = async (leagueFile) => {
            try {
                const response = await fetch(`https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/ligler_json/${encodeURIComponent(leagueFile)}.json`);
                if (!response.ok) return null;
                const text = await response.text();
                const cleanedText = text.replace(/:\s*NaN/g, ': null').replace(/:\s*-NaN/g, ': null');
                return JSON.parse(cleanedText);
            } catch { return null; }
        };

        try {
            let allMatches = [];
            const inputOran1 = normalizeOdds(oran1);
            const inputOran0 = normalizeOdds(oran0);
            const inputOran2 = normalizeOdds(oran2);

            if (isIddaaSource) {
                const response = await fetch(iddaaGecmisUrl);
                if (!response.ok) throw new Error('İddaa geçmiş verisi yüklenemedi.');
                const text = await response.text();
                const iddaaData = JSON.parse(text.replace(/:\s*NaN/g, ': null').replace(/:\s*-NaN/g, ': null'));
                const scoredMatches = iddaaData.map((m) => {
                    // Sonucu olmayan maçları atla
                    const msRaw = m['MS Skor'];
                    if (!msRaw || msRaw === '-' || String(msRaw).trim() === '-') return null;

                    let score = 0;
                    const mOran1 = normalizeOdds(getOddsValue(m, oranKey1));
                    const mOran0 = normalizeOdds(getOddsValue(m, oranKey0));
                    const mOran2 = normalizeOdds(getOddsValue(m, oranKey2));

                    if (inputOran1 && mOran1 === inputOran1) score += 30;
                    if (inputOran0 && mOran0 === inputOran0) score += 30;
                    if (inputOran2 && mOran2 === inputOran2) score += 30;

                    if (score > 0) {
                        return { ...m, _matchScore: score, _ligAdi: m.Lig || 'İddaa' };
                    }
                    return null;
                }).filter(Boolean);
                allMatches = scoredMatches;
            } else {
                for (const league of LEAGUES) {
                    const data = await loadLeagueData(league.file);
                    if (data && Array.isArray(data)) {
                        const scoredMatches = data.map(m => {
                            let score = 0;
                            const mOran1 = normalizeOdds(getOddsValue(m, oranKey1));
                            const mOran0 = normalizeOdds(getOddsValue(m, oranKey0));
                            const mOran2 = normalizeOdds(getOddsValue(m, oranKey2));

                            if (inputOran1 && mOran1 === inputOran1) score += 30;
                            if (inputOran0 && mOran0 === inputOran0) score += 30;
                            if (inputOran2 && mOran2 === inputOran2) score += 30;

                            if (score > 0) {
                                return { ...m, _matchScore: score, _ligAdi: league.name };
                            }
                            return null;
                        }).filter(Boolean);
                        allMatches = allMatches.concat(scoredMatches);
                    }
                }
            }

            const parseTarih = (t) => {
                if (!t) return 0;
                const p = String(t).split('.');
                if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime() || 0;
                return new Date(t).getTime() || 0;
            };
            allMatches.sort((a, b) => {
                if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
                return parseTarih(b.Tarih) - parseTarih(a.Tarih);
            });

            const topResults = allMatches.slice(0, 10).map(match => {
                const rawIY = match['IY Skor'] || match['İlk Yarı Skor'] || '-';
                const cleanIY = String(rawIY).replace(/^[İI]Y\s*/i, '').trim() || '-';
                const rawMS = match['MS Skor'] || match['Maç Sonucu Skor'] || '-';
                return {
                evSahibi: match['Ev Sahibi'] || match['Ev'] || '-',
                deplasman: match['Deplasman'] || match['Konuk Ekip'] || match['Dep'] || '-',
                ilkYari: cleanIY,
                macSonucu: String(rawMS).trim() || '-',
                iyms: formatIYMS(match['İY/MS']),
                tarih: formatDate(match['Tarih']),
                oran1: getOddsValue(match, oranKey1),
                oran0: getOddsValue(match, oranKey0),
                oran2: getOddsValue(match, oranKey2),
                lig: match._ligAdi
                };
            });

            const analysisResult = analyzeBettingMarkets(topResults);
            const recommendations = analysisResult?.recommendations || [];
            const toplamGolOnerisi = analysisResult?.toplamGolOnerisi || null;
            const msPercentages = analysisResult?.msPercentages || null;
            const altUstPercentages = analysisResult?.altUstPercentages || null;
            const kgPercentages = analysisResult?.kgPercentages || null;

            setResults({ matches: topResults, recommendations, toplamGolOnerisi, msPercentages, altUstPercentages, kgPercentages, totalAnalyzed: allMatches.length });
            setShowResults(true);
        } catch (err) {
            console.error('ManuelAnaliz hata:', err);
            setError('Hata: ' + (err?.message || String(err)));
        }

        setAnalyzing(false);
    };

    const resetAnalysis = () => {
        setShowResults(false);
        setResults([]);
        setEvSahibi('');
        setDeplasman('');
        setOran1('');
        setOran0('');
        setOran2('');
        setError('');
    };

    if (source === null) {
        return (
            <div className="category-page">
                <div className="category-header">
                    <h1 className="category-title">MANUEL ANALİZ</h1>
                </div>
                <div className="predictions-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 15, maxWidth: 600, margin: '0 auto' }}>
                    <div className="menu-selection-card" onClick={() => setSource('bet365')}>
                        <img src="/1.webp" style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt="Bet365" />
                        <h3 style={{ color: 'var(--gold)', fontSize: 18, marginBottom: 6 }}>Bet365 Oran Analizi</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                            Bet365 oran analizi için tıklayınız
                        </p>
                    </div>
                    <div className="menu-selection-card" onClick={() => setSource('iddaa')}>
                        <img src="/2.png" style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt="İddaa" />
                        <h3 style={{ color: '#4ade80', fontSize: 18, marginBottom: 6 }}>İddaa Oran Analizi</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                            İddaa oran analizi için tıklayınız
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (analyzing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#333] text-white">
                <div className="text-6xl mb-6 animate-[pulse_1.5s_ease-in-out_infinite] scale-110 transition-all opacity-90 text-[#FDB913] drop-shadow-[0_0_15px_rgba(253,185,19,0.5)]">⚡</div>
                <div className="text-2xl font-bold text-[#FDB913] mb-2">{loadingMsg}</div>
                <div className="text-sm text-gray-400 mb-6">Lütfen bekleyin...</div>
                <div className="flex gap-2">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full bg-[#FDB913] animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (showResults) {
        const { matches = [], recommendations = [], toplamGolOnerisi = null, msPercentages = null, altUstPercentages = null, kgPercentages = null, totalAnalyzed = 0 } = results || {};

        return (
            <div className="min-h-screen p-4 bg-[#333] text-white font-sans">
                <div className="max-w-5xl mx-auto space-y-6">
                    <button
                        onClick={resetAnalysis}
                        className="flex items-center gap-2 bg-[#404040] px-6 py-3 rounded-lg border-2 border-[#FDB913] hover:bg-[#505050] transition-all"
                    >
                        <ArrowLeft size={20} />
                        Yeni Manuel Analiz
                    </button>

                    {/* Sonuç Özeti */}
                    <div className="bg-[#404040] p-6 rounded-xl border-2 border-[#FDB913]">
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="text-[#FDB913]" size={28} />
                            <h2 className="text-xl font-bold text-[#FDB913]">Manuel Analiz Sonuçları</h2>
                        </div>

                        {/* Seçilen Takımlar */}
                        <div className="mb-4 p-4 bg-[#333] rounded-lg border-2 border-[#FDB913]">
                            <div className="flex items-center justify-center gap-4 text-lg font-bold">
                                <div className="flex flex-col items-center gap-2">
                                    <img src={getTeamLogo(evSahibi)} alt={evSahibi} onError={handleLogoError} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                    <span className="text-white">{evSahibi}</span>
                                </div>
                                <span className="text-[#FDB913]">VS</span>
                                <div className="flex flex-col items-center gap-2">
                                    <img src={getTeamLogo(deplasman)} alt={deplasman} onError={handleLogoError} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                    <span className="text-white">{deplasman}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">{sourceLabel} Oran Türü:</span>
                                <p className="font-bold text-white">{isIddaaSource ? 'İddaa Oranı' : (oranTuru === 'acilis' ? 'Açılış' : 'Kapanış')}</p>
                            </div>
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">Girilen Oranlar:</span>
                                <p className="font-bold text-[#FDB913]">
                                    {oran1 || '-'} / {oran0 || '-'} / {oran2 || '-'}
                                </p>
                            </div>
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">Gösterilen:</span>
                                <p className="font-bold text-[#006A4E]">{matches.length} maç</p>
                            </div>
                        </div>
                    </div>

                    {/* Bahis Türü Önerileri */}
                    {(recommendations.length > 0 || toplamGolOnerisi) && (
                        <div className="bg-[#404040] p-3 sm:p-4 rounded-lg border-2 border-[#FDB913] shadow-[0_0_15px_rgba(253,185,19,0.3)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="text-[#FDB913]" size={20} />
                                <h2 className="text-base sm:text-lg font-bold text-[#FDB913]">Önerilen Bahis Türleri</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">


                                {recommendations.find(r => r.market === 'İlk Yarı KG Var') && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-red-400 font-bold text-[11px] sm:text-xs xl:text-sm whitespace-nowrap">İlk Yarı KG Var</span>
                                            <span className="text-base sm:text-lg font-black text-white">
                                                %{recommendations.find(r => r.market === 'İlk Yarı KG Var').percentage}
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#222] rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${recommendations.find(r => r.market === 'İlk Yarı KG Var').percentage}%` }} />
                                        </div>
                                    </div>
                                )}

                                {/* Toplam Gol Önerisi - Detaylı Görünüm */}
                                {toplamGolOnerisi && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-red-400 font-bold text-[11px] sm:text-xs xl:text-sm whitespace-nowrap">Toplam Gol</span>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <span className="text-sm sm:text-base md:text-lg font-black text-white whitespace-nowrap leading-none">{toplamGolOnerisi.oneri}</span>
                                                {toplamGolOnerisi.guc === 'guclu' && <span className="text-[9px] sm:text-[10px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">Güçlü</span>}
                                                <span className="text-xs sm:text-sm font-bold text-gray-300">%{toplamGolOnerisi.yuzde}</span>
                                            </div>
                                        </div>

                                        <div className="w-full bg-[#222] rounded-full h-2 mb-3">
                                            <div className={`h-2 rounded-full ${toplamGolOnerisi.guc === 'guclu' ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${toplamGolOnerisi.yuzde}%` }} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 pt-2 border-t border-gray-700">
                                            {toplamGolOnerisi.detay.sort((a, b) => {
                                                const order = { "0-1 Gol": 1, "2-3 Gol": 2, "4-5 Gol": 3, "6+ Gol": 4 };
                                                return order[a.aralik] - order[b.aralik];
                                            }).map((item, idx) => (
                                                <div key={idx} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs text-gray-400">
                                                        <span>{item.aralik}</span>
                                                        <span className={item.yuzde >= 35 ? "text-white font-bold" : ""}>%{item.yuzde}</span>
                                                    </div>
                                                    <div className="w-full bg-[#222] rounded-full h-1">
                                                        <div
                                                            className={`h-1 rounded-full ${item.yuzde >= 50 ? 'bg-red-500' : item.yuzde >= 35 ? 'bg-orange-400' : 'bg-gray-600'}`}
                                                            style={{ width: `${item.yuzde}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {recommendations.filter(r => r.market !== 'İlk Yarı KG Var').map((rec, i) => (
                                    <div key={i} className="bg-[#333] p-2 sm:p-3 rounded-lg border border-[#006A4E] hover:border-[#FDB913] hover:shadow-[0_0_10px_rgba(253,185,19,0.4)] transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-bold text-[11px] sm:text-xs xl:text-sm whitespace-nowrap">{rec.market}</span>
                                            <span className={`text-base sm:text-lg font-black ${rec.percentage >= 80 ? 'text-green-400' : rec.percentage >= 65 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                                %{rec.percentage}
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#222] rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full ${rec.percentage >= 80 ? 'bg-green-400' : rec.percentage >= 65 ? 'bg-yellow-400' : 'bg-orange-400'}`} style={{ width: `${rec.percentage}%` }} />
                                        </div>
                                    </div>
                                ))}

                                {/* Maç Sonucu */}
                                {msPercentages && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-[#006A4E] hover:border-[#FDB913] transition-all">
                                        <span className="text-[#FDB913] font-bold text-xs sm:text-sm">Maç Sonucu</span>
                                        <div className="grid grid-cols-3 gap-1 mt-2">
                                            {[{ label: 'MS 1', val: msPercentages.ms1 }, { label: 'MS 0', val: msPercentages.ms0 }, { label: 'MS 2', val: msPercentages.ms2 }].map(({ label, val }) => (
                                                <div key={label} className={`text-center p-1.5 rounded-lg ${val >= 50 ? 'bg-[#006A4E] border border-[#FDB913]/40' : 'bg-[#404040]'}`}>
                                                    <div className="text-white font-black text-xs">{label}</div>
                                                    <div className="text-[#FDB913] font-bold text-sm">%{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2.5 Alt / Üst */}
                                {altUstPercentages && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-[#006A4E] hover:border-[#FDB913] transition-all">
                                        <span className="text-[#FDB913] font-bold text-xs sm:text-sm">2.5 Gol</span>
                                        <div className="grid grid-cols-2 gap-1 mt-2">
                                            {[{ label: '2.5 Üst', val: altUstPercentages.ust }, { label: '2.5 Alt', val: altUstPercentages.alt }].map(({ label, val }) => (
                                                <div key={label} className={`text-center p-1.5 rounded-lg ${val >= 60 ? 'bg-[#006A4E] border border-[#FDB913]/40' : 'bg-[#404040]'}`}>
                                                    <div className="text-white font-black text-xs">{label}</div>
                                                    <div className="text-[#FDB913] font-bold text-sm">%{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* KG Var / KG Yok */}
                                {kgPercentages && (
                                    <div className="bg-[#333] p-2 sm:p-3 rounded-lg border-2 border-[#006A4E] hover:border-[#FDB913] transition-all">
                                        <span className="text-[#FDB913] font-bold text-xs sm:text-sm">KG Var / Yok</span>
                                        <div className="grid grid-cols-2 gap-1 mt-2">
                                            {[{ label: 'KG Var', val: kgPercentages.var }, { label: 'KG Yok', val: kgPercentages.yok }].map(({ label, val }) => (
                                                <div key={label} className={`text-center p-1.5 rounded-lg ${val >= 60 ? 'bg-[#006A4E] border border-[#FDB913]/40' : 'bg-[#404040]'}`}>
                                                    <div className="text-white font-black text-xs">{label}</div>
                                                    <div className="text-[#FDB913] font-bold text-sm">%{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sonuç Tablosu */}
                    {matches.length > 0 ? (
                        <div className="bg-[#404040] rounded-lg overflow-hidden border-2 border-[#FDB913] shadow-[0_0_15px_rgba(253,185,19,0.3)]">
                            <div className="p-2 sm:p-3 bg-[#006A4E] font-bold text-left flex items-center gap-2">
                                <Zap size={16} />
                                <span className="text-sm sm:text-base">Benzer Oranlarla Oynanan Maçlar (İlk 10)</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead className="bg-[#333] text-gray-400 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-2 sm:p-3">Lig</th>
                                            <th className="p-2 sm:p-3">Ev Sahibi</th>
                                            <th className="p-2 sm:p-3">Deplasman</th>
                                            <th className="p-2 sm:p-3 text-center">İY</th>
                                            <th className="p-2 sm:p-3 text-center">MS</th>
                                            <th className="p-2 sm:p-3 text-center">İY/MS</th>
                                            <th className="p-2 sm:p-3 text-center">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#555]">
                                        {matches.map((match, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className="p-2 sm:p-3 text-xs text-gray-400 whitespace-nowrap">{match.lig}</td>
                                                <td className="p-2 sm:p-3 font-medium text-sm whitespace-nowrap">{match.evSahibi}</td>
                                                <td className="p-2 sm:p-3 font-medium text-sm whitespace-nowrap">{match.deplasman}</td>
                                                <td className="p-2 sm:p-3 text-center text-gray-300 text-sm">{match.ilkYari}</td>
                                                <td className="p-2 sm:p-3 text-center font-black text-[#FDB913] text-lg sm:text-xl">{match.macSonucu}</td>
                                                <td className="p-2 sm:p-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-bold ${match.iyms === '1/2' || match.iyms === '2/1'
                                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse shadow-lg'
                                                        : 'bg-[#006A4E]'
                                                        }`}>
                                                        {match.iyms}
                                                    </span>
                                                </td>
                                                <td className="p-2 sm:p-3 text-center text-gray-400 text-xs sm:text-sm whitespace-nowrap">{match.tarih}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#404040] p-8 rounded-xl border-2 border-[#FDB913] text-center">
                            <div className="text-4xl mb-4">🔍</div>
                            <p className="text-xl text-gray-400">Bu kriterlere uygun maç bulunamadı.</p>
                            <p className="text-sm text-gray-500 mt-2">Farklı oranlar deneyin.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 bg-[#333] text-white font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <button className="category-back-btn" onClick={() => setSource(null)} style={{ marginBottom: 8 }}>←</button>
                {/* Başlık */}
                <div className="bg-gradient-to-br from-[#404040] via-[#4a4a4a] to-[#404040] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                    <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Edit3 className="text-[#FFD700] w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-[#FFD700] via-[#FDB913] to-[#FFD700] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)]">
                                MANUEL ANALİZ YAP
                            </h1>
                            <Edit3 className="text-[#FFD700] w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 font-semibold">Takım isimlerini ve oranları manuel girerek analiz yapın</p>
                    </div>
                </div>

                {/* Hata Mesajı */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {/* Form */}
                <div className="bg-[#404040] p-6 rounded-xl border-2 border-[#FDB913] space-y-6">
                    {/* Ev Sahibi ve Deplasman Yan Yana */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Ev Sahibi Takım *
                            </label>
                            <input
                                type="text"
                                value={evSahibi}
                                onChange={e => setEvSahibi(e.target.value)}
                                className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white outline-none focus:border-[#FDB913] transition-colors"
                                placeholder="Takım adı yazın..."
                            />
                            {evSahibi && (
                                <div className="mt-2 flex items-center gap-2">
                                    <img src={getTeamLogo(evSahibi)} alt={evSahibi} onError={handleLogoError} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                    <span className="text-xs text-[#FDB913] font-bold">{evSahibi}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Deplasman Takım *
                            </label>
                            <input
                                type="text"
                                value={deplasman}
                                onChange={e => setDeplasman(e.target.value)}
                                className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white outline-none focus:border-[#FDB913] transition-colors"
                                placeholder="Takım adı yazın..."
                            />
                            {deplasman && (
                                <div className="mt-2 flex items-center gap-2">
                                    <img src={getTeamLogo(deplasman)} alt={deplasman} onError={handleLogoError} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                    <span className="text-xs text-[#FDB913] font-bold">{deplasman}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Oran Türü Seçimi */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{sourceLabel} Oran Türü</label>
                        {!isIddaaSource ? <div className="flex gap-4">
                            <button
                                onClick={() => setOranTuru('acilis')}
                                className={`flex-1 py-4 rounded-lg font-bold transition-all ${oranTuru === 'acilis'
                                    ? 'bg-[#006A4E] text-white border-2 border-[#006A4E]'
                                    : 'bg-[#333] text-gray-400 border-2 border-[#555] hover:border-[#FDB913]'
                                    }`}
                            >
                                AÇILIŞ ORANLARI
                            </button>
                            <button
                                onClick={() => setOranTuru('kapanis')}
                                className={`flex-1 py-4 rounded-lg font-bold transition-all ${oranTuru === 'kapanis'
                                    ? 'bg-[#006A4E] text-white border-2 border-[#006A4E]'
                                    : 'bg-[#333] text-gray-400 border-2 border-[#555] hover:border-[#FDB913]'
                                    }`}
                            >
                                KAPANIŞ ORANLARI
                            </button>
                        </div> : (
                            <div className="bg-[#333] p-4 rounded-lg border border-[#555] text-center text-gray-300 font-bold">
                                İddaa oranlarında Açılış/Kapanış ayrımı yoktur.
                            </div>
                        )}
                    </div>

                    {/* Oran Girişi */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            {sourceLabel} {isIddaaSource ? '' : (oranTuru === 'acilis' ? 'Açılış' : 'Kapanış')} Oranları (1 - 0 - 2)
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-[#FDB913] mb-1 text-center">MS1 (Ev Sahibi)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={oran1}
                                    onChange={e => setOran1(e.target.value)}
                                    className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none focus:border-[#FDB913] font-bold text-lg"
                                    placeholder="1.50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#FDB913] mb-1 text-center">MS0 (Beraberlik)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={oran0}
                                    onChange={e => setOran0(e.target.value)}
                                    className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none focus:border-[#FDB913] font-bold text-lg"
                                    placeholder="4.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#FDB913] mb-1 text-center">MS2 (Deplasman)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={oran2}
                                    onChange={e => setOran2(e.target.value)}
                                    className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none focus:border-[#FDB913] font-bold text-lg"
                                    placeholder="5.50"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Oranları manuel olarak girin. En az bir oran girilmelidir.
                        </p>
                    </div>

                    {/* Analiz Butonu */}
                    <button
                        onClick={startAnalysis}
                        className="w-full bg-[#006A4E] py-5 rounded-xl font-black text-xl hover:bg-[#00815E] transition-all flex items-center justify-center gap-3"
                    >
                        <Search size={24} />
                        MANUEL ANALİZİ BAŞLAT
                    </button>
                </div>
            </div>
        </div>
    );
}
