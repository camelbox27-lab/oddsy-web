import { collection, getDocs, query, where } from 'firebase/firestore';
import { TrendingDown, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';

const DroppingOddsModal = ({ onClose }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDroppingOdds();
    }, []);

    const fetchDroppingOdds = async () => {
        setLoading(true);
        try {
            const ts = new Date().getTime();
            const response = await fetch(`https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/data/droppingOdds.json?t=${ts}`);
            if (!response.ok) throw new Error('Data fetch failed');
            let data = await response.json();

            // ✅ SAATE GÖRE SIRALA
            data = data.sort((a, b) => {
                const timeA = a.saat || a.time || '00:00';
                const timeB = b.saat || b.time || '00:00';

                const [hourA, minA] = timeA.split(':').map(Number);
                const [hourB, minB] = timeB.split(':').map(Number);

                if (hourA !== hourB) {
                    return hourA - hourB;
                }
                return (minA || 0) - (minB || 0);
            });

            // Map data items to match standard fields
            data = data.map((d, index) => ({
                id: `dropping_json_${index}`,
                homeTeam: d.homeTeam || d.home_team || d.Ev || '',
                awayTeam: d.awayTeam || d.away_team || d.Dep || '',
                saat: d.saat || d.time,
                category: d.category || d.league || d.Lig || '',
                tournament: d.tournament || '',
                dropPercentage: d.dropPercentage || d.drop_percentage || d['Düşüş Yüzdesi'] || 0,
                droppingChoice: d.droppingChoice || d.choice_name || d.Tercih || '',
                currentOdds: d.currentOdds || d.Güncel || { '1': d.ms1_guncel, 'X': d.ms0_guncel, '2': d.ms2_guncel },
                initialOdds: d.initialOdds || d.İlk || { '1': d.ms1_ilk, 'X': d.ms0_ilk, '2': d.ms2_ilk },
                ...d
            }));

            setMatches(data);

        } catch (error) {
            console.error('❌ Veri çekme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="category-page">
            {/* HEADER */}
            <div className="category-header">
                <button className="category-back-btn" onClick={onClose}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="category-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingDown className="text-[#FDB913]" size={24} />
                    ORANI DÜŞEN MAÇLAR
                </h1>
            </div>

            {/* CONTENT */}
            <div className="predictions-list" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
                {loading ? (
                    <div className="loading">
                        <div className="spinner" />
                    </div>
                ) : matches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                        <TrendingDown size={60} style={{ marginBottom: '20px', opacity: 0.5, color: '#FDB913' }} />
                        <p style={{ fontSize: '18px' }}>Henüz oran düşüşü bulunmuyor</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                style={{
                                    background: '#2e3335',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    border: '2px solid #006A4E',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#FDB913';
                                    e.currentTarget.style.boxShadow = '0 0 20px rgba(253, 185, 19, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#006A4E';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* SAAT VE LİG */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                    <span style={{ color: '#FDB913', fontWeight: '700', fontSize: '16px' }}>{match.saat || match.time}</span>
                                    <span style={{ color: '#888' }}>{match.category || match.league} {match.tournament ? `- ${match.tournament}` : ''}</span>
                                </div>

                                {/* TAKIMLAR */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '17px', marginBottom: '4px' }}>{match.homeTeam || match.home_team}</div>
                                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '17px' }}>{match.awayTeam || match.away_team}</div>
                                </div>

                                {/* ORANLAR TABLOSU */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                                    {/* HEADER */}
                                    <div style={{ fontSize: '12px', color: '#666' }}>-</div>
                                    <div style={{ fontSize: '12px', color: '#FDB913', fontWeight: '700' }}>1</div>
                                    <div style={{ fontSize: '12px', color: '#FDB913', fontWeight: '700' }}>X</div>
                                    <div style={{ fontSize: '12px', color: '#FDB913', fontWeight: '700' }}>2</div>

                                    {/* İLK ORANLAR */}
                                    <div style={{ fontSize: '12px', color: '#888' }}>İlk</div>
                                    <div style={{ background: 'rgba(0, 106, 78, 0.3)', border: '1px solid #006A4E', borderRadius: '6px', padding: '8px', color: '#fff', fontWeight: '500' }}>
                                        {match.initialOdds?.['1'] || match.initialOdds?.home || '-'}
                                    </div>
                                    <div style={{ background: 'rgba(0, 106, 78, 0.3)', border: '1px solid #006A4E', borderRadius: '6px', padding: '8px', color: '#fff', fontWeight: '500' }}>
                                        {match.initialOdds?.X || match.initialOdds?.draw || '-'}
                                    </div>
                                    <div style={{ background: 'rgba(0, 106, 78, 0.3)', border: '1px solid #006A4E', borderRadius: '6px', padding: '8px', color: '#fff', fontWeight: '500' }}>
                                        {match.initialOdds?.['2'] || match.initialOdds?.away || '-'}
                                    </div>

                                    {/* GÜNCEL ORANLAR */}
                                    <div style={{ fontSize: '12px', color: '#888' }}>Şuan</div>
                                    <div style={{ background: '#006A4E', border: '1px solid #FDB913', borderRadius: '6px', padding: '8px', color: '#fff', fontWeight: '700' }}>
                                        {match.currentOdds?.['1'] || match.currentOdds?.home || '-'}
                                    </div>
                                    <div style={{ background: '#006A4E', border: '1px solid #FDB913', borderRadius: '6px', padding: '8px', color: '#fff', fontWeight: '700' }}>
                                        {match.currentOdds?.X || match.currentOdds?.draw || '-'}
                                    </div>
                                    <div style={{ background: '#006A4E', border: '1px solid #FDB913', borderRadius: '6px', padding: '8px', color: '#fff', fontWeight: '700' }}>
                                        {match.currentOdds?.['2'] || match.currentOdds?.away || '-'}
                                    </div>
                                </div>

                                {/* DÜŞÜŞ YÜZDE */}
                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#888' }}>Düşüş:</span>
                                    <span style={{ color: '#FDB913', fontWeight: '700', fontSize: '18px' }}>
                                        -{match.dropPercentage ? Number(match.dropPercentage).toFixed(1) : '0.0'}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DroppingOddsModal;