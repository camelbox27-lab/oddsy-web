import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { getTeamLogo, handleLogoError } from './helper';

const LEAGUES = [
    { id: 'Serie A', name: 'Serie A', image: 'https://i.ibb.co/N6N4CGn5/Whats-App-mage-2025-12-05-at-14-21-54-1.jpg' },
    { id: 'Premier Lig', name: 'Premier Lig', image: 'https://i.ibb.co/cXt6fJdd/Whats-App-mage-2025-12-05-at-14-21-54.jpg' },
    { id: 'La Liga', name: 'La Liga', image: 'https://i.ibb.co/C55n1CFc/spain-la-liga-64x64-football-logos-cc.png' },
    { id: 'Super Lig', name: 'Süper Lig', image: 'https://i.ibb.co/RT40RH3G/turkey-super-lig-64x64-football-logos-cc.png' },
    { id: 'Bundesliga', name: 'Bundesliga', image: 'https://i.ibb.co/fzrPDNQp/germany-bundesliga-64x64-football-logos-cc.png' },
    { id: 'Ligue 1', name: 'Ligue 1', image: 'https://i.ibb.co/cXSXDS45/france-ligue-1-64x64-football-logos-cc.png' }
];

function GununTercihleri({ onBack }) {
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedLeague) {
            setLoading(true);
            const q = query(
                collection(db, 'predictions'),
                where('league', '==', selectedLeague),
                where('categoryKey', '==', 4)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMatches(data);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [selectedLeague]);

    // Lig kartları görünümü
    if (!selectedLeague) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold text-[#ffd800] mb-6 font-display">Günün Tercihleri</h1>
                <p className="text-[#b0b0b0] mb-6">Takip etmek istediğiniz ligi seçin</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {LEAGUES.map(league => (
                        <div
                            key={league.id}
                            onClick={() => setSelectedLeague(league.id)}
                            className="bg-[#242424] rounded-xl p-6 cursor-pointer hover:bg-[#303030] transition-all duration-300 border border-[#404040] hover:border-[#52d858] hover:scale-105 flex flex-col items-center justify-center text-center group"
                        >
                            <img
                                src={league.image}
                                alt={league.name}
                                className="w-16 h-16 object-contain mb-3 group-hover:scale-110 transition-transform"
                            />
                            <p className="text-white font-bold">{league.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Seçilen ligin maçları
    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setSelectedLeague(null)} className="text-[#52d858] text-2xl hover:scale-110 transition-transform">←</button>
                <h1 className="text-2xl font-bold text-[#ffd800]">{selectedLeague} - Tercihler</h1>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-3 border-[#52d858] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : matches.length > 0 ? (
                    matches.map(match => (
                        <div key={match.id} className="bg-[#242424] p-5 rounded-xl border border-[#404040] hover:border-[#52d858] transition-all">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[#999999] text-xs">{match.time || '20:00'}</span>
                                <span className="bg-[#52d858] text-[#1a1a1a] px-2 py-0.5 rounded text-[10px] font-bold">{match.league}</span>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={getTeamLogo(match.homeTeam)}
                                        onError={handleLogoError}
                                        alt={match.homeTeam}
                                        className="w-10 h-10 object-contain"
                                    />
                                    <span className="text-white font-bold">{match.homeTeam}</span>
                                </div>
                                <span className="text-[#b0b0b0] text-xl font-bold">vs</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold">{match.awayTeam}</span>
                                    <img
                                        src={getTeamLogo(match.awayTeam)}
                                        onError={handleLogoError}
                                        alt={match.awayTeam}
                                        className="w-10 h-10 object-contain"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-[#2d2d2d] p-3 rounded-lg">
                                <span className="text-[#52d858] font-bold">{match.prediction}</span>
                                <span className="text-[#ffd800] font-bold text-lg">{match.odds}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">⚽</div>
                        <p className="text-[#999999]">Bu ligde henüz tahmin bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GununTercihleri;
