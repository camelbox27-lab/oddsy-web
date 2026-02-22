import { ArrowLeft, Search, Star, Trophy, Zap, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { getTeamLogo, handleLogoError } from '../helper';

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
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR');
    } catch {
        return dateStr;
    }
};

export default function ManuelAnaliz() {
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

    const analyzeBettingMarkets = (matches) => {
        if (!matches || matches.length === 0) return [];

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

        const suppressedMarkets = new Set(['MS 1', 'MS 0', 'MS 2', 'MS 2.5 Üst', 'MS 2.5 Alt', 'MS 3.5 Üst', 'MS 1.5 Alt', 'MS 5.5 Üst']);
        const cgPairs = [['KG Var', 'KG Yok']];
        cgPairs.forEach(([a, b]) => {
            const pA = rawPercentages[a] || 0;
            const pB = rawPercentages[b] || 0;
            if (pA >= pB) suppressedMarkets.add(b);
            else suppressedMarkets.add(a);
        });

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
            altUstPercentages
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

        const msgs = ["Sistem Hazırlanıyor...", "Tüm Ligler Taranıyor...", "Oranlar Karşılaştırılıyor...", "Bahis Türleri Analiz Ediliyor..."];
        for (let i = 0; i < msgs.length; i++) {
            setLoadingMsg(msgs[i]);
            await new Promise(r => setTimeout(r, 150));
        }

        const oranKey1 = oranTuru === 'acilis'
            ? ['Bet365 Açılış 1', 'Bet365 AÃ§Ä±lÄ±ÅŸ 1', 'Bet365 Acilis 1']
            : ['Bet365 Kapanış 1', 'Bet365 KapanÄ±ÅŸ 1', 'Bet365 Kapanis 1'];
        const oranKey0 = oranTuru === 'acilis'
            ? ['Bet365 Açılış 0', 'Bet365 AÃ§Ä±lÄ±ÅŸ 0', 'Bet365 Acilis 0']
            : ['Bet365 Kapanış 0', 'Bet365 KapanÄ±ÅŸ 0', 'Bet365 Kapanis 0'];
        const oranKey2 = oranTuru === 'acilis'
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

            allMatches.sort((a, b) => {
                if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
                return new Date(b.Tarih) - new Date(a.Tarih);
            });

            const formattedAll = allMatches.map(match => ({
                ...match,
                evSahibi: match['Ev Sahibi'] || '-',
                deplasman: match['Deplasman'] || '-',
                ilkYari: formatScore(match['İlk Yarı Skor']),
                macSonucu: formatScore(match['Maç Sonucu Skor']),
                iyms: formatIYMS(match['İY/MS']),
                tarih: formatDate(match['Tarih']),
                oran1: getOddsValue(match, oranKey1),
                oran0: getOddsValue(match, oranKey0),
                oran2: getOddsValue(match, oranKey2)
            }));

            // IY/MS filtresini kaldırdık, sadece ilk 10 maç dönülecek
            const displayMatches = formattedAll.slice(0, 10);
            const topResults = displayMatches;

            // Analizler SADECE gösterilecek 10 maç üzerinden yapılır
            const { recommendations, toplamGolOnerisi, msPercentages, altUstPercentages } = analyzeBettingMarkets(topResults);

            setResults({ matches: topResults, recommendations, toplamGolOnerisi, msPercentages, altUstPercentages, totalAnalyzed: allMatches.length });
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
        setEvSahibi('');
        setDeplasman('');
        setOran1('');
        setOran0('');
        setOran2('');
        setError('');
    };

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
        const { matches = [], recommendations = [], toplamGolOnerisi = null, msPercentages = null, altUstPercentages = null, totalAnalyzed = 0 } = results || {};

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
                                <span className="text-gray-400">Bet365 Oran Türü:</span>
                                <p className="font-bold text-white">{oranTuru === 'acilis' ? 'Açılış' : 'Kapanış'}</p>
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

                                {/* Yeni Eklenen MS Kartı */}
                                {msPercentages && (
                                    <div className="bg-[#333] p-3 rounded-lg border-2 border-[#006A4E] basis-full md:col-span-2 lg:col-span-1">
                                        <span className="text-[#FDB913] font-bold">Maç Sonucu</span>
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <div className={`text-center p-2 rounded ${msPercentages.ms1 >= 60 ? 'bg-[#006A4E]' : 'bg-[#404040]'}`}>
                                                <div className="text-white font-black">MS 1</div>
                                                <div className="text-[#FDB913] font-bold">%{msPercentages.ms1}</div>
                                            </div>
                                            <div className={`text-center p-2 rounded ${msPercentages.ms0 >= 60 ? 'bg-[#006A4E]' : 'bg-[#404040]'}`}>
                                                <div className="text-white font-black">MS 0</div>
                                                <div className="text-[#FDB913] font-bold">%{msPercentages.ms0}</div>
                                            </div>
                                            <div className={`text-center p-2 rounded ${msPercentages.ms2 >= 60 ? 'bg-[#006A4E]' : 'bg-[#404040]'}`}>
                                                <div className="text-white font-black">MS 2</div>
                                                <div className="text-[#FDB913] font-bold">%{msPercentages.ms2}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Yeni Eklenen 2.5 Alt/Üst Kartı */}
                                {altUstPercentages && (
                                    <div className="bg-[#333] p-3 rounded-lg border-2 border-[#006A4E] lg:col-span-1">
                                        <span className="text-[#FDB913] font-bold">2.5 Gol</span>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className={`text-center p-2 rounded ${altUstPercentages.ust >= 60 ? 'bg-[#006A4E]' : 'bg-[#404040]'}`}>
                                                <div className="text-white font-black">2.5 Üst</div>
                                                <div className="text-[#FDB913] font-bold">%{altUstPercentages.ust}</div>
                                            </div>
                                            <div className={`text-center p-2 rounded ${altUstPercentages.alt >= 60 ? 'bg-[#006A4E]' : 'bg-[#404040]'}`}>
                                                <div className="text-white font-black">2.5 Alt</div>
                                                <div className="text-[#FDB913] font-bold">%{altUstPercentages.alt}</div>
                                            </div>
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
                        <label className="block text-sm text-gray-400 mb-2">Bet365 Oran Türü</label>
                        <div className="flex gap-4">
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
                        </div>
                    </div>

                    {/* Oran Girişi */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Bet365 {oranTuru === 'acilis' ? 'Açılış' : 'Kapanış'} Oranları (1 - 0 - 2)
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
