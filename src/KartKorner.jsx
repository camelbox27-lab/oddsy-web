import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { getTeamLogo, handleLogoError } from './helper';

// Yüzde hesaplama fonksiyonları
const calculateCardPercentage = (homeAvg, awayAvg, prediction) => {
    if (!homeAvg || !awayAvg || !prediction) return 0;
    const totalAvg = parseFloat(homeAvg) + parseFloat(awayAvg);
    const targetValue = parseFloat(prediction.split('-')[0]);

    if (prediction.includes('ust')) {
        const percentage = Math.min(100, (totalAvg / targetValue) * 100);
        return Math.round(percentage);
    } else {
        const percentage = Math.min(100, (targetValue / totalAvg) * 100);
        return Math.round(percentage);
    }
};

const calculateCornerPercentage = (totalAvg, prediction) => {
    if (!totalAvg || !prediction) return 0;
    const targetValue = parseFloat(prediction.split('-')[0]);

    if (prediction.includes('ust')) {
        const percentage = Math.min(100, (parseFloat(totalAvg) / targetValue) * 100);
        return Math.round(percentage);
    } else {
        const percentage = Math.min(100, (targetValue / parseFloat(totalAvg)) * 100);
        return Math.round(percentage);
    }
};

function KartKorner() {
    const [cardMatches, setCardMatches] = useState([]);
    const [cornerMatches, setCornerMatches] = useState([]);
    const [activeTab, setActiveTab] = useState('card');

    useEffect(() => {
        const cardQuery = query(
            collection(db, 'matches'),
            where('type', '==', 'card')
        );

        const unsubCard = onSnapshot(cardQuery, (snapshot) => {
            const matches = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    cardPercentage: data.cardPercentage || calculateCardPercentage(data.homeTeamCardAvg, data.awayTeamCardAvg, data.cardPrediction)
                };
            });
            setCardMatches(matches);
        });

        const cornerQuery = query(
            collection(db, 'matches'),
            where('type', '==', 'corner')
        );

        const unsubCorner = onSnapshot(cornerQuery, (snapshot) => {
            const matches = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    cornerPercentage: data.cornerPercentage || calculateCornerPercentage(data.totalCornerAvg, data.cornerPrediction)
                };
            });
            setCornerMatches(matches);
        });

        return () => {
            unsubCard();
            unsubCorner();
        };
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* Tab Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setActiveTab('card')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'card'
                        ? 'bg-[#52d858] text-[#1a1a1a]'
                        : 'bg-[#3a3a3a] text-[#b0b0b0] hover:bg-[#4a4a4a]'
                        }`}
                >
                    🟨 Kart Bahisleri
                </button>
                <button
                    onClick={() => setActiveTab('corner')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'corner'
                        ? 'bg-[#52d858] text-[#1a1a1a]'
                        : 'bg-[#3a3a3a] text-[#b0b0b0] hover:bg-[#4a4a4a]'
                        }`}
                >
                    ⚽ Korner Bahisleri
                </button>
            </div>

            {/* KART BAHİSLERİ */}
            {activeTab === 'card' && (
                <div>
                    <h2 className="text-2xl font-bold text-[#ffd800] mb-4 flex items-center gap-2">
                        🟨 Kart Bahisleri
                    </h2>
                    {cardMatches.length > 0 ? cardMatches.map(match => (
                        <div key={match.id} className="bg-[#242424] rounded-xl p-6 mb-4 border border-[#006A4E] hover:border-[#ffd800] transition-all">
                            {/* Takımlar */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={getTeamLogo(match.homeTeam)} onError={handleLogoError} className="w-10 h-10 object-contain" alt="" />
                                    <span className="text-[#ffd800] font-bold">{match.homeTeam}</span>
                                </div>
                                <span className="text-[#b0b0b0] font-bold">vs</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[#ffd800] font-bold">{match.awayTeam}</span>
                                    <img src={getTeamLogo(match.awayTeam)} onError={handleLogoError} className="w-10 h-10 object-contain" alt="" />
                                </div>
                            </div>

                            {/* Tahmin ve Yüzde Bar */}
                            <div className="bg-[#2d2d2d] rounded-lg p-4 mb-4">
                                <p className="text-[#ffd800] font-bold text-lg mb-2">{match.cardPrediction}</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-[#404040] rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-[#52d858] to-[#00ff87] h-full transition-all duration-500"
                                            style={{ width: `${match.cardPercentage}%` }}
                                        />
                                    </div>
                                    <span className="text-[#52d858] font-bold min-w-[50px] text-right">%{match.cardPercentage}</span>
                                </div>
                            </div>

                            {/* Detaylar Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                                    <p className="text-[#999999] text-xs mb-1">Ev Sahibi Ort.</p>
                                    <p className="text-white font-bold text-lg">{match.homeTeamCardAvg || '-'}</p>
                                </div>
                                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                                    <p className="text-[#999999] text-xs mb-1">Deplasman Ort.</p>
                                    <p className="text-white font-bold text-lg">{match.awayTeamCardAvg || '-'}</p>
                                </div>
                                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                                    <p className="text-[#999999] text-xs mb-1">Hakem</p>
                                    <p className="text-white font-bold">{match.refereeName || '-'}</p>
                                </div>
                                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                                    <p className="text-[#999999] text-xs mb-1">Hakem Lig Ort.</p>
                                    <p className="text-white font-bold text-lg">{match.refereeAvg || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">🟨</div>
                            <p className="text-[#999999]">Henüz kart tahmini bulunmuyor.</p>
                        </div>
                    )}
                </div>
            )}

            {/* KORNER BAHİSLERİ */}
            {activeTab === 'corner' && (
                <div>
                    <h2 className="text-2xl font-bold text-[#ffd800] mb-4 flex items-center gap-2">
                        ⚽ Korner Bahisleri
                    </h2>
                    {cornerMatches.length > 0 ? cornerMatches.map(match => (
                        <div key={match.id} className="bg-[#242424] rounded-xl p-6 mb-4 border border-[#006A4E] hover:border-[#ffd800] transition-all">
                            {/* Takımlar */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={getTeamLogo(match.homeTeam)} onError={handleLogoError} className="w-10 h-10 object-contain" alt="" />
                                    <span className="text-[#ffd800] font-bold">{match.homeTeam}</span>
                                </div>
                                <span className="text-[#b0b0b0] font-bold">vs</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[#ffd800] font-bold">{match.awayTeam}</span>
                                    <img src={getTeamLogo(match.awayTeam)} onError={handleLogoError} className="w-10 h-10 object-contain" alt="" />
                                </div>
                            </div>

                            {/* Tahmin ve Yüzde Bar */}
                            <div className="bg-[#2d2d2d] rounded-lg p-4 mb-4">
                                <p className="text-[#ffd800] font-bold text-lg mb-2">{match.cornerPrediction}</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-[#404040] rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-[#52d858] to-[#00ff87] h-full transition-all duration-500"
                                            style={{ width: `${match.cornerPercentage}%` }}
                                        />
                                    </div>
                                    <span className="text-[#52d858] font-bold min-w-[50px] text-right">%{match.cornerPercentage}</span>
                                </div>
                            </div>

                            {/* Detaylar Grid */}
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                                    <p className="text-[#999999] text-xs mb-1">Ev Sahibi Ort.</p>
                                    <p className="text-white font-bold text-lg">{match.homeTeamCornerAvg || '-'}</p>
                                </div>
                                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                                    <p className="text-[#999999] text-xs mb-1">Deplasman Ort.</p>
                                    <p className="text-white font-bold text-lg">{match.awayTeamCornerAvg || '-'}</p>
                                </div>
                                <div className="bg-[#2d2d2d] p-3 rounded-lg">
                                    <p className="text-[#999999] text-xs mb-1">Genel Ort.</p>
                                    <p className="text-white font-bold text-lg">{match.totalCornerAvg || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">⚽</div>
                            <p className="text-[#999999]">Henüz korner tahmini bulunmuyor.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default KartKorner;
