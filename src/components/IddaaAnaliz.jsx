import { ArrowLeft, Search, Star, Trophy, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTeamLogo, handleLogoError } from '../helper';

const IDDAA_LEAGUES = [
    { name: "🇹🇷 Süper Lig", file: "Süper Lig" },
    { name: "🇹🇷 Trendyol Süper Lig", file: "Trendyol Süper Lig" },
    { name: "🇹🇷 1. Lig", file: "1. Lig" },
    { name: "🇹🇷 Trendyol 1. Lig", file: "Trendyol 1. Lig" },
    { name: "🇹🇷 2. Lig", file: "2. Lig" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier Lig", file: "Premier Lig" },
    { name: "🇪🇸 LaLiga", file: "LaLiga" },
    { name: "🇪🇸 LaLiga 2", file: "LaLiga 2" },
    { name: "🇩🇪 Bundesliga", file: "Bundesliga" },
    { name: "🇩🇪 2. Bundesliga", file: "2. Bundesliga" },
    { name: "🇮🇹 Serie A", file: "Serie A" },
    { name: "🇮🇹 Serie B", file: "Serie B" },
    { name: "🇫🇷 Ligue 1", file: "Ligue 1" },
    { name: "🇫🇷 Ligue 2", file: "Ligue 2" },
    { name: "🇳🇱 Eredivisie", file: "Eredivisie" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Championship", file: "Championship" },
    { name: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Premiership", file: "Premiership" },
    { name: "🇧🇪 Pro Lig", file: "Pro Lig" },
    { name: "🇵🇱 Ekstraklasa", file: "Ekstraklasa" },
    { name: "🇳🇴 Eliteserien", file: "Eliteserien" },
    { name: "🇸🇪 Allsvenskan", file: "Allsvenskan" },
    { name: "🇸🇪 Superettan", file: "Superettan" },
    { name: "🇫🇮 Veikkausliiga", file: "Veikkausliiga" },
    { name: "🇭🇺 NB I", file: "NB I" },
    { name: "🇺🇸 MLS", file: "MLS" },
    { name: "🇰🇷 K-Lig", file: "K-Lig" },
    { name: "🇷🇺 FNL", file: "FNL" },
    { name: "⭐ Şampiyonlar Ligi", file: "Şampiyonlar Ligi" },
    { name: "⭐ Avrupa Ligi", file: "Avrupa Ligi" },
    { name: "⭐ Konferans Ligi", file: "Konferans Ligi" },
    { name: "🇹🇷 Kupa", file: "Kupa" },
    { name: "🇹🇷 Ligler Kupası", file: "Ligler Kupası" },
    { name: "🌍 Dünya Kupası", file: "Dünya Kupası" },
    { name: "🇪🇺 UEFA Uluslar Ligi", file: "UEFA Uluslar Ligi" },
    { name: "🇧🇷 Serie A (Brezilya)", file: "Serie A" },
    { name: "🇦🇷 Primera Division", file: "ARGENTINA PRIMERA DIVISION" },
    { name: "🇦🇺 A-Lig", file: "A-Lig" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 FA Cup", file: "FA Cup" },
    { name: "🇪🇸 Kral Kupası", file: "Kral Kupası" },
    { name: "🇳🇱 Eerste Divisie", file: "Eerste Divisie" },
    { name: "🇭🇷 1. HNL", file: "1. HNL" },
    { name: "🇧🇪 Challenger Pro Lig", file: "Challenger Pro Lig" },
    { name: "🇧🇪 Challenge Lig", file: "Challenge Lig" },
    { name: "🇮🇱 Toto Kupası Ligat Al", file: "Toto Kupası Ligat Al" },
    { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Non Lig Premier", file: "Non Lig Premier" },
    { name: "🇹🇷 Ziraat Türkiye Kupası", file: "Ziraat Türkiye Kupası" },
    { name: "🇦🇹 Ulusal Lig", file: "Ulusal Lig" },
    { name: "🇳🇱 Lig Kupası", file: "Lig Kupası" },
];

const normalizeOdds = (value) => {
    if (value === null || value === undefined || value === '' || value === '-') return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return (Math.round(num * 100) / 100).toFixed(2);
};

const formatScore = (score) => {
    if (!score || score === '-' || score === 'İY') return '-';
    let scoreStr = String(score).trim();
    // "İY 1-0" → "1-0" prefix temizle
    scoreStr = scoreStr.replace(/^İY\s*/i, '').replace(/^MS\s*/i, '').trim();
    if (!scoreStr || scoreStr === '-') return '-';
    return scoreStr.replace(/(\d+)\.0\.?-?/g, '$1-').replace(/-(\d+)\.0/g, '-$1').replace(/--/g, '-');
};

const formatIYMS = (iyms) => {
    if (!iyms || iyms === '-' || iyms === 'İY') return '-';
    const iymsStr = String(iyms).trim();
    if (iymsStr.startsWith('/')) return '0' + iymsStr;
    if (iymsStr.endsWith('/')) return iymsStr + '0';
    if (!iymsStr.includes('/')) return iymsStr + '/0';
    return iymsStr;
};

const parseIddaaScore = (score) => {
    if (!score || score === '-' || score === 'İY') return null;
    let scoreStr = String(score).trim();
    // "İY 1-0" → "1-0" prefix temizle
    scoreStr = scoreStr.replace(/^İY\s*/i, '').replace(/^MS\s*/i, '').trim();
    if (!scoreStr || scoreStr === '-') return null;
    const parts = scoreStr.split('-');
    if (parts.length !== 2) return null;
    const home = parseInt(parts[0]);
    const away = parseInt(parts[1]);
    if (isNaN(home) || isNaN(away)) return null;
    return { home, away, total: home + away };
};

export default function IddaaAnaliz({ manual = false }) {
    const [oran1, setOran1] = useState('');
    const [oran0, setOran0] = useState('');
    const [oran2, setOran2] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState([]);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState('');

    const [guncelMatches, setGuncelMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [matchLoading, setMatchLoading] = useState(true);
    const [showFeatured, setShowFeatured] = useState(false);
    const [pendingFeaturedAnalysis, setPendingFeaturedAnalysis] = useState(false);

    useEffect(() => {
        const loadGuncelData = async () => {
            try {
                setMatchLoading(true);
                const response = await fetch('https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/iddaa_guncel/gunlukmaclar.json');
                if (response.ok) {
                    const text = await response.text();
                    const cleanedText = text.replace(/:\s*NaN/g, ': null').replace(/:\s*-NaN/g, ': null');
                    const data = JSON.parse(cleanedText);
                    setGuncelMatches(data);
                }
            } catch (err) {
                console.error('İddaa güncel maç verileri yüklenemedi:', err);
            } finally {
                setMatchLoading(false);
            }
        };
        loadGuncelData();
    }, []);

    const handleMatchSelect = (matchId) => {
        if (!matchId) {
            setSelectedMatch(null);
            setOran1('');
            setOran0('');
            setOran2('');
            return;
        }

        const match = guncelMatches.find((m, i) => String(i) === matchId);
        setSelectedMatch(match);

        if (match) {
            setOran1(match['MS1'] ? String(match['MS1']) : '');
            setOran0(match['MS0'] ? String(match['MS0']) : '');
            setOran2(match['MS2'] ? String(match['MS2']) : '');
        }
    };

    const handleFeaturedSelect = (match, idx) => {
        setShowFeatured(false);
        handleMatchSelect(String(idx));
        setPendingFeaturedAnalysis(true);
    };

    useEffect(() => {
        if (pendingFeaturedAnalysis && selectedMatch && (oran1 || oran0 || oran2)) {
            setPendingFeaturedAnalysis(false);
            startAnalysis();
        }
    }, [pendingFeaturedAnalysis, selectedMatch, oran1, oran0, oran2]);

    const analyzeBettingMarkets = (matches) => {
        if (!matches || matches.length === 0) {
            return { recommendations: [], toplamGolOnerisi: null, msPercentages: null, altUstPercentages: null, kgPercentages: null };
        }

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

        let tg_0_1 = 0, tg_2_3 = 0, tg_4_5 = 0, tg_6_plus = 0;
        let totalMatches = matches.length;
        let scoredMatches = 0;

        matches.forEach(match => {
            const ms = parseIddaaScore(match.macSonucu);
            const iy = parseIddaaScore(match.ilkYari);

            if (!ms) return;
            scoredMatches++;

            if (ms.home >= 2) marketStats['Ev Sahibi 1.5 Üst']++;
            if (ms.away >= 2) marketStats['Deplasman 1.5 Üst']++;
            if (ms.total >= 3) marketStats['MS 2.5 Üst']++;
            else marketStats['MS 2.5 Alt']++;
            if (ms.total >= 4) marketStats['MS 3.5 Üst']++;

            if (ms.total <= 1) tg_0_1++;
            else if (ms.total <= 3) tg_2_3++;
            else if (ms.total <= 5) tg_4_5++;
            else tg_6_plus++;

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

        const effTotal = scoredMatches || 1;

        let toplamGolOnerisi = null;
        if (scoredMatches > 0) {
            const araliklar = [
                { aralik: "0-1 Gol", count: tg_0_1 },
                { aralik: "2-3 Gol", count: tg_2_3 },
                { aralik: "4-5 Gol", count: tg_4_5 },
                { aralik: "6+ Gol", count: tg_6_plus }
            ].map(a => ({ ...a, yuzde: Math.round((a.count / effTotal) * 100) }))
                .sort((a, b) => b.yuzde - a.yuzde);

            const birinci = araliklar[0];
            const ikinci = araliklar[1];

            let guc = "normal";
            let oneriText = "";

            if (birinci.yuzde >= 50) { guc = "guclu"; oneriText = birinci.aralik; }
            else if (birinci.yuzde >= 35) { guc = "normal"; oneriText = birinci.aralik; }
            else if (birinci.yuzde - ikinci.yuzde <= 5) { guc = "belirsiz"; oneriText = `${birinci.aralik} / ${ikinci.aralik}`; }
            else { guc = "normal"; oneriText = birinci.aralik; }

            toplamGolOnerisi = { oneri: oneriText, label: oneriText, yuzde: birinci.yuzde, percentage: birinci.yuzde, detay: araliklar, guc };
        }

        const msPercentages = {
            ms1: Math.round((marketStats['MS 1'] / effTotal) * 100),
            ms0: Math.round((marketStats['MS 0'] / effTotal) * 100),
            ms2: Math.round((marketStats['MS 2'] / effTotal) * 100)
        };

        const altUstPercentages = {
            ust: Math.round((marketStats['MS 2.5 Üst'] / effTotal) * 100),
            alt: Math.round((marketStats['MS 2.5 Alt'] / effTotal) * 100)
        };

        const kgPercentages = {
            var: Math.round((marketStats['KG Var'] / effTotal) * 100),
            yok: Math.round((marketStats['KG Yok'] / effTotal) * 100)
        };

        const rawPercentages = {};
        Object.entries(marketStats).forEach(([market, count]) => {
            rawPercentages[market] = Math.round((count / effTotal) * 100);
        });

        const suppressedMarkets = new Set(['MS 1', 'MS 0', 'MS 2', 'MS 2.5 Üst', 'MS 2.5 Alt', 'MS 3.5 Üst', 'KG Var', 'KG Yok']);
        const THRESHOLD = 60;
        const recommendations = Object.entries(marketStats)
            .filter(([market]) => !suppressedMarkets.has(market))
            .map(([market, count]) => ({ market, count, percentage: rawPercentages[market] }))
            .filter(item => item.percentage >= THRESHOLD)
            .sort((a, b) => b.percentage - a.percentage);

        return { recommendations, toplamGolOnerisi, msPercentages, altUstPercentages, kgPercentages };
    };

    const analyzeIYMS = (matches) => {
        if (!matches || matches.length === 0) return null;

        const ALLOWED_IYMS = ['1/0', '2/0', '1/2', '2/1'];
        const iymsStats = {};
        let validCount = 0;

        matches.forEach(match => {
            const iyms = match.iyms || '-';
            const formatted = typeof iyms === 'string' ? iyms.trim() : String(iyms).trim();
            if (ALLOWED_IYMS.includes(formatted)) {
                iymsStats[formatted] = (iymsStats[formatted] || 0) + 1;
                validCount++;
            }
        });

        if (Object.keys(iymsStats).length === 0) return null;

        let maxCount = 0;
        let topIYMS = null;

        Object.entries(iymsStats).forEach(([iyms, count]) => {
            if (count > maxCount) { maxCount = count; topIYMS = iyms; }
        });

        if (!topIYMS) return null;

        const percentage = Math.round((maxCount / matches.length) * 100);
        const allPercentages = {};
        ['1/0', '2/0', '1/2', '2/1'].forEach(combo => {
            allPercentages[combo] = Math.round(((iymsStats[combo] || 0) / matches.length) * 100);
        });

        return { iyms: topIYMS, count: maxCount, percentage, showPercentage: true, allPercentages };
    };

    const calculateTopScores = (matches) => {
        const scoreCounts = {};
        matches.forEach(m => {
            const score = m.macSonucu || '-';
            if (score !== '-') scoreCounts[score] = (scoreCounts[score] || 0) + 1;
        });
        return Object.entries(scoreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([score, count]) => ({ score, count }));
    };

    const startAnalysis = async () => {
        if (!oran1 && !oran0 && !oran2) {
            setError('Lütfen en az bir oran girin!');
            return;
        }

        setError('');
        setResults([]);
        setShowResults(false);
        setAnalyzing(true);

        const msgs = ["Sistem Hazırlanıyor...", "Tüm Ligler Taranıyor...", "Eşleşmeler Hazırlanıyor...", "Bahis Türleri Analiz Ediliyor..."];
        for (let i = 0; i < msgs.length; i++) {
            setLoadingMsg(msgs[i]);
            await new Promise(r => setTimeout(r, 150));
        }

        const loadLeagueData = async (leagueFile) => {
            try {
                const response = await fetch(`https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/iddaa_ligler_json/${encodeURIComponent(leagueFile)}.json`);
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

            for (const league of IDDAA_LEAGUES) {
                const data = await loadLeagueData(league.file);
                if (data && Array.isArray(data)) {
                    const scoredMatches = data.map(m => {
                        let score = 0;
                        const mOran1 = normalizeOdds(m['MS1']);
                        const mOran0 = normalizeOdds(m['MS0']);
                        const mOran2 = normalizeOdds(m['MS2']);

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

            allMatches.sort((a, b) => {
                if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
                return 0;
            });

            const topResults = allMatches.slice(0, 10).map(match => {
                const msRaw = match['MS Skor'] || '-';
                const iyRaw = match['IY Skor'] || '-';

                let iymsVal = '-';
                const msP = parseIddaaScore(msRaw);
                const iyP = parseIddaaScore(iyRaw);
                if (msP && iyP) {
                    const iyResult = iyP.home > iyP.away ? '1' : iyP.home === iyP.away ? '0' : '2';
                    const msResult = msP.home > msP.away ? '1' : msP.home === msP.away ? '0' : '2';
                    iymsVal = `${iyResult}/${msResult}`;
                }

                return {
                    evSahibi: match['Ev Sahibi'] || '-',
                    deplasman: match['Deplasman'] || match['Konuk Ekip'] || '-',
                    ilkYari: formatScore(iyRaw),
                    macSonucu: formatScore(msRaw),
                    iyms: iymsVal,
                    tarih: match['Tarih'] || '-',
                    oran1: match['MS1'],
                    oran0: match['MS0'],
                    oran2: match['MS2'],
                    lig: match._ligAdi
                };
            });

            const { recommendations, toplamGolOnerisi, msPercentages, altUstPercentages, kgPercentages } = analyzeBettingMarkets(topResults);
            const iymsRecommendation = analyzeIYMS(topResults);
            const topScores = calculateTopScores(topResults);

            setResults({ matches: topResults, recommendations, iymsRecommendation, toplamGolOnerisi, msPercentages, altUstPercentages, kgPercentages, topScores, totalAnalyzed: allMatches.length });
            setShowResults(true);
        } catch (err) {
            console.error(err);
            setError('Veri işlenirken hata oluştu.');
        }

        setAnalyzing(false);
    };

    const resetAnalysis = () => {
        setShowResults(false);
        setResults([]);
        setOran1('');
        setOran0('');
        setOran2('');
        setError('');
        setSelectedMatch(null);
    };

    const loadingMsgs = ["Sistem Hazırlanıyor...", "Tüm Ligler Taranıyor...", "Eşleşmeler Hazırlanıyor...", "Bahis Türleri Analiz Ediliyor..."];
    const loadingStep = loadingMsgs.indexOf(loadingMsg);

    if (analyzing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#333]">
                <div className="flex flex-col items-center gap-6 p-8">
                    <div className="relative flex items-center justify-center w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-4 border-[#FDB913]/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border-2 border-[#FDB913]/40 animate-pulse" />
                        <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(253,185,19,0.8)]" style={{ animation: 'bolt-pop 0.6s ease-in-out infinite alternate' }}>
                            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="url(#boltGradIddaa)" stroke="#FDB913" strokeWidth="0.5" />
                            <defs>
                                <linearGradient id="boltGradIddaa" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#FFD700" />
                                    <stop offset="100%" stopColor="#006A4E" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-[#FDB913] tracking-wide">{loadingMsg}</p>
                        <p className="text-sm text-gray-400 mt-1">Lütfen bekleyin...</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {loadingMsgs.map((_, i) => (
                            <div key={i} className={`rounded-full transition-all duration-300 ${i <= loadingStep ? 'w-8 h-2 bg-[#FDB913]' : 'w-2 h-2 bg-[#555]'}`} />
                        ))}
                    </div>
                </div>
                <style>{`@keyframes bolt-pop { from { transform: scale(0.92) rotate(-3deg); } to { transform: scale(1.08) rotate(3deg); } }`}</style>
            </div>
        );
    }

    if (showResults) {
        const { matches = [], recommendations = [], iymsRecommendation = null, toplamGolOnerisi = null, msPercentages = null, altUstPercentages = null, kgPercentages = null, topScores = [], totalAnalyzed = 0 } = results || {};

        return (
            <div className="min-h-screen p-4 bg-[#333] text-white font-sans">
                <div className="max-w-5xl mx-auto space-y-6">
                    <button onClick={resetAnalysis} className="flex items-center gap-2 bg-[#404040] px-6 py-3 rounded-lg border-2 border-[#FDB913] hover:bg-[#505050] transition-all">
                        <ArrowLeft size={20} />
                        Yeni Analiz Yap
                    </button>

                    <div className="bg-[#404040] p-6 rounded-xl border-2 border-[#FDB913]">
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="text-[#FDB913]" size={28} />
                            <h2 className="text-xl font-bold text-[#FDB913]">Analiz Sonuçları</h2>
                        </div>

                        {!manual && selectedMatch && (
                            <div className="mb-4 p-4 bg-[#333] rounded-lg border-2 border-[#FDB913]">
                                <div className="flex items-center justify-center gap-4 text-lg font-bold">
                                    <span className="text-white">🏠 {selectedMatch['Ev Sahibi']}</span>
                                    <span className="text-[#FDB913]">VS</span>
                                    <span className="text-white">✈️ {selectedMatch['Konuk Ekip'] || selectedMatch['Deplasman']}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">Oran Kaynağı:</span>
                                <p className="font-bold text-white">İddaa Oranları</p>
                            </div>
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">Aranan Oranlar:</span>
                                <p className="font-bold text-[#FDB913]">
                                    {oran1 || '-'} / {oran0 || '-'} / {oran2 || '-'}
                                </p>
                            </div>
                            <div className="bg-[#333] p-3 rounded-lg">
                                <span className="text-gray-400">Gösterilen:</span>
                                <p className="font-bold text-[#FDB913]">{matches.length} maç</p>
                            </div>
                        </div>
                    </div>

                    {/* Bahis Türü Önerileri - Bet365 layout */}
                    {(recommendations.length > 0 || toplamGolOnerisi) && (
                        <div className="bg-[#404040] p-3 sm:p-4 rounded-lg border-2 border-[#FDB913] shadow-[0_0_15px_rgba(253,185,19,0.3)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="text-[#FDB913]" size={20} />
                                <h2 className="text-base sm:text-lg font-bold text-[#FDB913]">Önerilen Bahis Türleri</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">

                                {/* İlk Yarı KG Var - Kırmızı Çerçeveli */}
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

                                {/* Toplam Gol Önerisi - Detaylı */}
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
                                                        <div className={`h-1 rounded-full ${item.yuzde >= 50 ? 'bg-red-500' : item.yuzde >= 35 ? 'bg-orange-400' : 'bg-gray-600'}`} style={{ width: `${item.yuzde}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Maç Sonucu - MS 1/0/2 */}
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

                                {/* Diğer Öneriler (İlk Yarı 1.5 Üst vs.) */}
                                {recommendations.filter(r => !['İlk Yarı KG Var', 'MS 1', 'MS 0', 'MS 2', 'MS 2.5 Üst', 'MS 2.5 Alt'].includes(r.market)).map((rec, i) => (
                                    <div key={i} className="bg-[#333] p-2 sm:p-3 rounded-lg border border-[#006A4E] hover:border-[#FDB913] hover:shadow-[0_0_10px_rgba(253,185,19,0.4)] transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-bold text-xs sm:text-sm">{rec.market}</span>
                                            <span className={`text-lg sm:text-xl font-black ${rec.percentage >= 80 ? 'text-green-400' : rec.percentage >= 65 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                                %{rec.percentage}
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#222] rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full ${rec.percentage >= 80 ? 'bg-green-400' : rec.percentage >= 65 ? 'bg-yellow-400' : 'bg-orange-400'}`} style={{ width: `${rec.percentage}%` }} />
                                        </div>
                                    </div>
                                ))}

                                {/* KG Var / Yok */}
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

                    {/* En Çok Tekrarlanan Skorlar */}
                    {topScores && topScores.length > 0 && (
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

                    {/* Sonuç Tablosu - Bet365 layout */}
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
                            <p className="text-gray-400 text-lg">Eşleşen maç bulunamadı</p>
                            <p className="text-sm text-gray-500 mt-2">Farklı oranlarla tekrar deneyin.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 bg-[#333] text-white font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-gradient-to-br from-[#404040] via-[#4a4a4a] to-[#404040] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#FDB913] shadow-[0_0_20px_rgba(253,185,19,0.4)]">
                    <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Zap className="text-[#FDB913] w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_10px_rgba(253,185,19,0.5)] animate-pulse" />
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-[#FDB913] via-[#FFD700] to-[#FDB913] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(253,185,19,0.3)]">
                                ODDSY İDDAA ORAN ANALİZ SİSTEMİ
                            </h1>
                            <Zap className="text-[#FDB913] w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_10px_rgba(253,185,19,0.5)] animate-pulse" />
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 font-semibold">İddaa oranlarına dayalı geçmiş maç analiz sistemi</p>
                    </div>
                </div>

                {!manual && (
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setShowFeatured(!showFeatured)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${showFeatured
                            ? 'bg-[#FDB913] text-white shadow-[0_0_15px_rgba(253,185,19,0.4)]'
                            : 'bg-[#404040] text-[#FDB913] border border-[#FDB913] hover:bg-[#4a4a4a]'
                            }`}
                    >
                        <Star size={18} fill={showFeatured ? '#fff' : 'none'} />
                        GÜNÜN MAÇLARI
                    </button>
                </div>
                )}

                {!manual && showFeatured && (
                    <div className="bg-[#404040] p-4 rounded-xl border-2 border-[#FDB913] space-y-3">
                        <h3 className="text-[#FDB913] font-bold text-center text-sm mb-3">
                            Günün İddaa Maçları - Analiz için birini seçin
                        </h3>
                        {matchLoading ? (
                            <p className="text-gray-400 text-center text-sm py-4">Yükleniyor...</p>
                        ) : guncelMatches.length > 0 ? (
                            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                                {guncelMatches.map((match, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleFeaturedSelect(match, idx)}
                                        className="flex items-center justify-between gap-4 bg-[#333] p-4 rounded-xl border border-[#555] hover:border-[#FDB913] hover:shadow-[0_0_10px_rgba(253,185,19,0.2)] transition-all cursor-pointer"
                                    >
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <img src={getTeamLogo(match['Ev Sahibi'])} alt={match['Ev Sahibi']} onError={handleLogoError} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                            <span className="text-white font-bold text-xs text-center">{match['Ev Sahibi']}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[#FDB913] font-black text-lg">VS</span>
                                            <span className="text-gray-500 text-[10px]">{match['Saat']}</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <img src={getTeamLogo(match['Konuk Ekip'] || match['Deplasman'])} alt={match['Konuk Ekip'] || match['Deplasman']} onError={handleLogoError} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                            <span className="text-white font-bold text-xs text-center">{match['Konuk Ekip'] || match['Deplasman']}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center text-sm py-4">Bugün maç bulunmuyor.</p>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                <div className="bg-[#404040] p-6 rounded-xl border-2 border-[#FDB913] space-y-6">
                    {!manual && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Ev Sahibi Takım Seçin *</label>
                            <select
                                value={selectedMatch ? String(guncelMatches.indexOf(selectedMatch)) : ''}
                                onChange={e => handleMatchSelect(e.target.value)}
                                className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white outline-none focus:border-[#FDB913] transition-colors"
                                disabled={matchLoading}
                            >
                                <option value="">{matchLoading ? 'Yükleniyor...' : '-- Ev Sahibi --'}</option>
                                {guncelMatches.map((match, idx) => (
                                    <option key={idx} value={idx}>
                                        {match['Ev Sahibi']}
                                    </option>
                                ))}
                            </select>
                            {selectedMatch && (
                                <div className="mt-2 text-xs text-gray-400">
                                    <span className="text-[#FDB913] font-bold">{selectedMatch['Ev Sahibi']}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Deplasman Takım</label>
                            <input
                                type="text"
                                value={selectedMatch ? (selectedMatch['Konuk Ekip'] || selectedMatch['Deplasman'] || '') : ''}
                                readOnly
                                className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white outline-none"
                                placeholder="Otomatik gelir"
                            />
                            {selectedMatch && (
                                <div className="mt-2 text-xs text-gray-400">
                                    <span className="text-[#FDB913] font-bold">{selectedMatch['Konuk Ekip'] || selectedMatch['Deplasman']}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">İddaa Oranları (MS1 - MS0 - MS2)</label>
                        {manual ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-[#FDB913] mb-1 text-center">MS1 (Ev Sahibi)</label>
                                    <input type="text" inputMode="decimal" value={oran1} onChange={e => setOran1(e.target.value)} className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none focus:border-[#FDB913] font-bold text-lg" placeholder="Örn: 2.10" />
                                    <div className="text-xs text-center mt-1 text-gray-500">İddaa Oranı</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#FDB913] mb-1 text-center">MS0 (Beraberlik)</label>
                                    <input type="text" inputMode="decimal" value={oran0} onChange={e => setOran0(e.target.value)} className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none focus:border-[#FDB913] font-bold text-lg" placeholder="Örn: 3.30" />
                                    <div className="text-xs text-center mt-1 text-gray-500">İddaa Oranı</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#FDB913] mb-1 text-center">MS2 (Deplasman)</label>
                                    <input type="text" inputMode="decimal" value={oran2} onChange={e => setOran2(e.target.value)} className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none focus:border-[#FDB913] font-bold text-lg" placeholder="Örn: 3.50" />
                                    <div className="text-xs text-center mt-1 text-gray-500">İddaa Oranı</div>
                                </div>
                            </div>
                        ) : selectedMatch ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-[#FDB913] mb-1 text-center">MS1 (Ev Sahibi)</label>
                                    <input type="text" value={oran1} readOnly className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none font-bold text-lg" placeholder="-" />
                                    <div className="text-xs text-center mt-1 text-gray-500">İddaa Oranı</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#FDB913] mb-1 text-center">MS0 (Beraberlik)</label>
                                    <input type="text" value={oran0} readOnly className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none font-bold text-lg" placeholder="-" />
                                    <div className="text-xs text-center mt-1 text-gray-500">İddaa Oranı</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#FDB913] mb-1 text-center">MS2 (Deplasman)</label>
                                    <input type="text" value={oran2} readOnly className="w-full bg-[#333] p-4 rounded-lg border border-[#555] text-white text-center outline-none font-bold text-lg" placeholder="-" />
                                    <div className="text-xs text-center mt-1 text-gray-500">İddaa Oranı</div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#333] p-6 rounded-lg border border-[#555] text-center text-gray-400">
                                Önce bir maç seçin, oranlar otomatik doldurulacak
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => startAnalysis()}
                        className="w-full bg-[#006A4E] py-5 rounded-xl font-black text-xl hover:bg-[#FDB913] transition-all flex items-center justify-center gap-3"
                    >
                        <Search size={24} />
                        ANALİZİ BAŞLAT
                    </button>
                </div>
            </div>
        </div>
    );
}
