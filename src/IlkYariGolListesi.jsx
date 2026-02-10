import { useEffect, useState } from 'react';
import { getTeamLogo, handleLogoError } from './helper';

function IlkYariGolListesi() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/data/halfTimeGoals.json?t=' + Date.now())
            .then(res => res.json())
            .then(data => {
                setMatches(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('IlkYariGolListesi error:', error);
                setMatches([]);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #333',
                    borderTopColor: '#10B981',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
            </div>
        );
    }

    return (
        <div style={{ padding: '16px' }}>
            <h2 style={{
                fontSize: '20px',
                fontWeight: '900',
                color: '#10B981',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                ⚽ İlk Yarı Gol Listesi
            </h2>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                {matches.length > 0 ? (
                    matches.map(match => {
                        const homeTeam = match.homeTeam || match.home_team || 'Ev Sahibi';
                        const awayTeam = match.awayTeam || match.away_team || 'Deplasman';

                        return (
                            <div
                                key={match.id}
                                className="prediction-card"
                            >
                                {/* Saat */}
                                {match.saat && (
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: 'rgba(253, 185, 19, 0.6)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        marginBottom: '16px',
                                        textAlign: 'center'
                                    }}>
                                        {match.saat}
                                    </div>
                                )}

                                {/* Takımlar */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px'
                                }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <img src={getTeamLogo(homeTeam)} alt={homeTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{homeTeam}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#FDB913', fontStyle: 'italic' }}>VS</span>
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <img src={getTeamLogo(awayTeam)} alt={awayTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{awayTeam}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(253, 185, 19, 0.6)', fontWeight: '700' }}>Henüz ilk yarı gol maçı bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IlkYariGolListesi;
