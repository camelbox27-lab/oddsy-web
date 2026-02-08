import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { getTeamLogo, handleLogoError } from './helper';

function IYMSTahminleri() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'predictions'),
            where('categoryKey', '==', 'iy-ms-tahminleri')
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
                    borderTopColor: '#fb7185',
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
                IY/MS Tahminleri
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
                        const homeTeam = match.home_team || match.homeTeam || 'Ev Sahibi';
                        const awayTeam = match.away_team || match.awayTeam || 'Deplasman';

                        return (
                            <div
                                key={match.id}
                                className="prediction-card"
                            >
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

                                <div style={{ marginTop: '20px' }}>
                                    {(() => {
                                        let label = '';
                                        let odds = '';

                                        if (match.prediction) { label = match.prediction; odds = match.odds || '-'; }
                                        else if (match.kategori) { label = match.kategori; odds = match.odds || '-'; }

                                        if (!label) return null;

                                        return (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    textAlign: 'center',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>TAHMİN</div>
                                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10B981' }}>{label}</div>
                                                </div>

                                                <div style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    textAlign: 'center',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>ORAN</div>
                                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#FDB913' }}>{odds}</div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(253, 185, 19, 0.6)', fontWeight: '700' }}>Henüz IY/MS tahmini bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IYMSTahminleri;
