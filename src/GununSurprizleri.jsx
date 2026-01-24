import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { getTeamLogo, handleLogoError } from './helper';

function GununSurprizleri() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'predictions'),
            where('categoryKey', '==', 'gunun-surprizleri')
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
                color: '#10B981', // Changed from Pink to Green
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                💣 Günün Sürprizleri
            </h2>

            <div style={{
                display: 'flex', // Changed from grid to flex
                flexDirection: 'column', // Stack vertically
                gap: '20px',
                maxWidth: '800px', // Limit width to look like the screenshot (centered list)
                margin: '0 auto' // Center the list
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
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <img src={getTeamLogo(homeTeam)} alt={homeTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{homeTeam}</span>
                                    </div>

                                    {/* Ortada Sadece VS */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#FDB913', fontStyle: 'italic' }}>VS</span>
                                    </div>

                                    {/* Deplasman */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <img src={getTeamLogo(awayTeam)} alt={awayTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{awayTeam}</span>
                                    </div>
                                </div>

                                {/* Oranlar - Single Row Enforcement */}
                                <div style={{ marginTop: '20px' }}>
                                    {(() => {
                                        // Determine the SINGLE best prediction to show
                                        // Priority: Specific keys with values => Generic prediction
                                        let label = '';
                                        let odds = '';

                                        // Check specific keys first (where value is the odds)
                                        if (match['2_5_ust']) { label = '2.5 Üst'; odds = match['2_5_ust']; }
                                        else if (match['3_5_ust']) { label = '3.5 Üst'; odds = match['3_5_ust']; }
                                        else if (match['ms_5_5_ust']) { label = 'MS 5.5 Üst'; odds = match['ms_5_5_ust']; }
                                        // Check generic keys
                                        else if (match.prediction) { label = match.prediction; odds = match.odds || '-'; }
                                        else if (match.kategori) { label = match.kategori; odds = match.odds || '-'; }

                                        if (!label) return null;

                                        return (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                {/* Left: TAHMİN */}
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    padding: '12px', // Slightly compacted padding to match aspect ratio better
                                                    borderRadius: '12px',
                                                    textAlign: 'center',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>TAHMİN</div>
                                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10B981' }}>{label}</div>
                                                </div>

                                                {/* Right: ORAN */}
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
                        <p style={{ color: 'rgba(253, 185, 19, 0.6)', fontWeight: '700' }}>Henüz sürpriz tahmin bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GununSurprizleri;
