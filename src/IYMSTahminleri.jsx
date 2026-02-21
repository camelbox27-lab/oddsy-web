import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { auth, db } from './firebaseConfig';
import { getTeamLogo, handleLogoError } from './helper';

function IYMSTahminleri({ userData }) {
    const isAdmin = userData?.role === 'admin';
    const [htMatches, setHtMatches] = useState([]);
    const [firestoreMatches, setFirestoreMatches] = useState([]);
    const [hiddenKeys, setHiddenKeys] = useState(new Set());
    const [htLoading, setHtLoading] = useState(true);
    const [fsLoading, setFsLoading] = useState(true);
    const [showAnalysis, setShowAnalysis] = useState(null);

    const loading = htLoading || fsLoading;

    const buildMatchKey = (match) => {
        const homeTeam = (match.homeTeam || match.home_team || '').toLowerCase().trim();
        const awayTeam = (match.awayTeam || match.away_team || '').toLowerCase().trim();
        const prediction = (match.prediction || match.kategori || '').toLowerCase().trim();
        const odds = (match.odds || match['2_5_ust'] || match['3_5_ust'] || match['ms_5_5_ust'] || '').toString().toLowerCase().trim();
        return `${homeTeam}|${awayTeam}|${prediction}|${odds}`;
    };

    const firestoreKeySet = useMemo(() => new Set(firestoreMatches.map(m => m.matchKey || buildMatchKey(m))), [firestoreMatches]);
    const filteredHtMatches = useMemo(
        () => htMatches.filter(m => {
            const key = buildMatchKey(m);
            return !hiddenKeys.has(key) && !firestoreKeySet.has(key);
        }),
        [htMatches, hiddenKeys, firestoreKeySet]
    );
    const matches = [...firestoreMatches, ...filteredHtMatches];

    // halfTimeGoals koleksiyonundan çek (eski veri kaynağı)
    useEffect(() => {
        const q = query(collection(db, 'halfTimeGoals'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setHtMatches(list);
            setHtLoading(false);
        }, (error) => {
            console.error('IYMSTahminleri halfTimeGoals error:', error);
            setHtLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Firestore'dan admin eklenen maçları çek (categoryKey=7)
    useEffect(() => {
        const q = query(collection(db, 'predictions'), where('categoryKey', '==', 7));
        const unsub = onSnapshot(q, (snap) => {
            let list = snap.docs.map(d => ({ id: d.id, ...d.data(), source: 'admin' }));
            list = list.filter(item => !item.hiddenFromDaily);
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setFirestoreMatches(list);
            setFsLoading(false);
        }, (error) => {
            console.error('IYMSTahminleri Firestore error:', error);
            setFsLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'hiddenMenuItems'), where('categoryKey', '==', 7));
        const unsub = onSnapshot(q, (snap) => {
            const keys = new Set(snap.docs.map(d => d.data()?.matchKey).filter(Boolean));
            setHiddenKeys(keys);
        });
        return () => unsub();
    }, []);

    const upsertFromJsonToPredictions = async (match, status) => {
        const homeTeam = match.homeTeam || match.home_team || 'Ev Sahibi';
        const awayTeam = match.awayTeam || match.away_team || 'Deplasman';
        const prediction = match.prediction || match.kategori || '-';
        const odds = match.odds || match['2_5_ust'] || match['3_5_ust'] || match['ms_5_5_ust'] || '-';
        const matchKey = buildMatchKey(match);

        await addDoc(collection(db, 'predictions'), {
            homeTeam,
            awayTeam,
            league: match.league || 'Diğer',
            time: match.time || match.saat || '20:00',
            prediction,
            odds,
            categoryKey: 7,
            status,
            matchKey,
            importedFrom: 'bot-json',
            authorId: auth.currentUser?.uid || null,
            createdAt: serverTimestamp()
        });
    };

    const hideJsonItem = async (match) => {
        await addDoc(collection(db, 'hiddenMenuItems'), {
            categoryKey: 7,
            matchKey: buildMatchKey(match),
            hiddenBy: auth.currentUser?.uid || null,
            createdAt: serverTimestamp()
        });
    };

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
                🔄 İY/MS Tahminleri
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
                                style={{ position: 'relative' }}
                            >
                                {/* Kazandı / Kaybetti Icon Top Left */}
                                {match.status && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        background: match.status === 'won' ? '#22c55e' : '#ef4444',
                                        color: 'white',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                        zIndex: 10
                                    }}>
                                        {match.status === 'won' ? '✓' : '✗'}
                                    </div>
                                )}
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
                                        {(match.time || match.saat) && (
                                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#aaaaaa', marginTop: '4px' }}>
                                                {match.time || match.saat}
                                            </span>
                                        )}
                                    </div>

                                    {/* Deplasman */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <img src={getTeamLogo(awayTeam)} alt={awayTeam} onError={handleLogoError} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{awayTeam}</span>
                                    </div>
                                </div>

                                {/* Analiz / Tahmin */}
                                <div style={{ marginTop: '20px' }}>
                                    {match.analysis && (
                                        <p style={{
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            color: '#e0e0e0',
                                            textAlign: 'center',
                                            marginBottom: '20px',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '15px',
                                            borderRadius: '12px'
                                        }}>{match.analysis}</p>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        {/* Left: TAHMİN */}
                                        <div style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            textAlign: 'center',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700' }}>TAHMİN</div>
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#10B981' }}>{match.prediction || '-'}</div>
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
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#FDB913' }}>{match.odds || '-'}</div>
                                        </div>
                                    </div>
                                </div>



                                {/* Admin: Kazandı/Kaybetti/Sil */}
                                {isAdmin && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                                        <button className="admin-btn delete" onClick={async () => { if (!window.confirm('Bu tahmini silmek istediğinize emin misiniz?')) return; try { await hideJsonItem(match); setHiddenKeys(prev => new Set([...prev, buildMatchKey(match)])); if (match.source === 'admin') { await setDoc(doc(db, 'predictions', match.id), { hiddenFromDaily: true }, { merge: true }); setFirestoreMatches(prev => prev.filter(m => m.id !== match.id)); } window.alert('Tahmin başarıyla silindi.'); } catch (err) { console.error('Silme hatası:', err); window.alert('Silme hatası: ' + err.message); } }} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>SİL</button>
                                        {match.analysis && (
                                            <button className="admin-btn" onClick={() => setShowAnalysis(showAnalysis === match.id ? null : match.id)} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', background: showAnalysis === match.id ? '#FDB913' : '#6366f1', color: '#fff' }}>YORUM {showAnalysis === match.id ? 'KAPAT' : 'GÖSTER'}</button>
                                        )}
                                        <button className="admin-btn won" onClick={async () => { if (match.source === 'admin') await setDoc(doc(db, 'predictions', match.id), { status: 'won' }, { merge: true }); else await upsertFromJsonToPredictions(match, 'won'); }} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>KAZANDI</button>
                                        <button className="admin-btn lost" onClick={async () => { if (match.source === 'admin') await setDoc(doc(db, 'predictions', match.id), { status: 'lost' }, { merge: true }); else await upsertFromJsonToPredictions(match, 'lost'); }} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}>KAYBETTİ</button>
                                    </div>
                                )}
                                {/* Show analysis for non-admin users */}
                                {!isAdmin && match.analysis && (
                                    <button onClick={() => setShowAnalysis(showAnalysis === match.id ? null : match.id)} style={{ marginTop: '12px', padding: '10px', width: '100%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)', borderRadius: '8px', color: '#a5b4fc', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                                        {showAnalysis === match.id ? 'Yorumu Kapat' : 'Maç Yorumunu Görüntüle'}
                                    </button>
                                )}
                                {/* Analysis Display */}
                                {(showAnalysis === match.id || isAdmin) && match.analysis && (
                                    <div style={{ marginTop: '12px', padding: '15px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px' }}>
                                        <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#e0e0e0', margin: 0 }}>{match.analysis}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(253, 185, 19, 0.6)', fontWeight: '700' }}>Henüz İY/MS tahmini bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IYMSTahminleri;
