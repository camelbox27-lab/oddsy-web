import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { getTeamLogo, handleLogoError } from './helper';

function GununTercihleri() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'predictions'),
            where('categoryKey', '==', 'gunun-tercihleri')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setMatches(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #333',
                    borderTopColor: '#FDB913',
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
                color: '#FDB913',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                ⭐ Günün Tercihleri
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '20px'
            }}>
                {matches.length > 0 ? (
                    matches.map(match => {
                        const homeTeam = match.home_team || match.homeTeam || 'Ev Sahibi';
                        const awayTeam = match.away_team || match.awayTeam || 'Deplasman';

                        return (
                            <div
                                key={match.id}
                                style={{
                                    background: '#2e3335',
                                    border: '3px solid #006A4E',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Lig Bilgisi */}
                                {match.league && (
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: 'rgba(253, 185, 19, 0.6)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        marginBottom: '16px',
                                        textAlign: 'center'
                                    }}>
                                        {match.league}
                                    </div>
                                )}

                                {/* Takımlar ve Bugün */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px'
                                }}>
                                    {/* Ev Sahibi */}
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <img
                                            src={getTeamLogo(homeTeam)}
                                            alt={homeTeam}
                                            onError={handleLogoError}
                                            style={{
                                                width: '70px',
                                                height: '70px',
                                                objectFit: 'contain'
                                            }}
                                        />
                                        <span style={{
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: '#fff',
                                            textAlign: 'center'
                                        }}>
                                            {homeTeam}
                                        </span>
                                    </div>

                                    {/* Ortada Sadece BUGÜN */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: '80px'
                                    }}>
                                        <span style={{
                                            fontSize: '18px',
                                            fontWeight: '900',
                                            color: '#FDB913',
                                            textTransform: 'uppercase'
                                        }}>
                                            BUGÜN
                                        </span>
                                    </div>

                                    {/* Deplasman */}
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <img
                                            src={getTeamLogo(awayTeam)}
                                            alt={awayTeam}
                                            onError={handleLogoError}
                                            style={{
                                                width: '70px',
                                                height: '70px',
                                                objectFit: 'contain'
                                            }}
                                        />
                                        <span style={{
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: '#fff',
                                            textAlign: 'center'
                                        }}>
                                            {awayTeam}
                                        </span>
                                    </div>
                                </div>

                                {/* Oranlar Grid - Sadece varsa göster */}
                                {(match['2_5_ust'] || match['3_5_ust'] || match['ms_5_5_ust'] || match.prediction || match.kategori) && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                                        gap: '10px',
                                        marginTop: '20px'
                                    }}>
                                        {match['2_5_ust'] && (
                                            <div style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>2.5 Üst</div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#FDB913' }}>{match['2_5_ust']}</div>
                                            </div>
                                        )}
                                        {match['3_5_ust'] && (
                                            <div style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>3.5 Üst</div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#FDB913' }}>{match['3_5_ust']}</div>
                                            </div>
                                        )}
                                        {match['ms_5_5_ust'] && (
                                            <div style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>MS 5.5 Üst</div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#FDB913' }}>{match['ms_5_5_ust']}</div>
                                            </div>
                                        )}
                                        {match.prediction && (
                                            <div style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Tahmin</div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#FDB913' }}>{match.prediction}</div>
                                            </div>
                                        )}
                                        {match.kategori && (
                                            <div style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Kategori</div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#FDB913' }}>{match.kategori}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(253, 185, 19, 0.6)', fontWeight: '700' }}>Henüz tahmin bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GununTercihleri;
