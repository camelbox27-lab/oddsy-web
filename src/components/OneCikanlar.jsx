import { useEffect, useState } from 'react';

// Ana sayfa "Günün Öne Çıkanları": Oto-BOT'un sabah seçtiği sürprizler
// (İY/MS ve 6+ gol). Veri, botun canli-kayit dalındaki günlük arşivinden
// okunur; bu dal siteyi yeniden derletmez. Veri yoksa bileşen hiçbir şey
// göstermez (ana sayfa eskisi gibi kalır).
const ARSIV_URL = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/canli-kayit/oncesi/';

// Türkiye saatine göre bugünün tarihi: GG.AA.YYYY
function bugunTR() {
    const parcalar = new Intl.DateTimeFormat('tr-TR', {
        timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric',
    }).formatToParts(new Date());
    const al = (tur) => parcalar.find(p => p.type === tur)?.value || '';
    return `${al('day')}.${al('month')}.${al('year')}`;
}

function skorAyikla(metin) {
    const m = String(metin || '').match(/(\d+)\s*-\s*(\d+)/);
    return m ? [Number(m[1]), Number(m[2])] : null;
}

function tarihKisa(t) {
    const m = String(t || '').match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}.${m[2]}.${m[1].slice(2)}` : '';
}

const stil = {
    bolum: { width: '100%', maxWidth: 1100, margin: '0 auto 26px', textAlign: 'left', textShadow: 'none' },
    baslik: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 16px', marginBottom: 12 },
    baslikYazi: { color: '#fff', fontSize: 15, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' },
    ipucu: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700 },
    serit: { display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '4px 16px 14px', WebkitOverflowScrolling: 'touch' },
    kart: { flex: '0 0 300px', scrollSnapAlign: 'start', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: 22, padding: 16, border: '1px solid var(--border)', boxShadow: '0 10px 28px rgba(22,38,27,0.22)' },
    etiket: { display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: '#fff', background: 'var(--primary-green-dark)', borderRadius: 99, padding: '4px 10px' },
    ust: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' },
    saat: { color: '#fff', background: 'var(--primary-green)', borderRadius: 8, padding: '2px 8px', fontWeight: 800, fontSize: 12 },
    govde: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 },
    takimlar: { flex: 1, minWidth: 0 },
    takim: { fontSize: 17, fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    vs: { fontSize: 9, fontWeight: 800, letterSpacing: 2, color: 'var(--text-muted)', margin: '2px 0' },
    tahmin: { flex: '0 0 auto', minWidth: 86, textAlign: 'center', borderRadius: 16, padding: '8px 10px', color: '#fff', background: 'linear-gradient(160deg, var(--primary-green-light), var(--primary-green-dark))', boxShadow: '0 6px 16px rgba(30,138,69,0.35)' },
    tahminBuyuk: { fontSize: 32, fontWeight: 900, lineHeight: 1, fontFamily: 'var(--font-logo)' },
    tahminAlt: { fontSize: 9, fontWeight: 800, letterSpacing: 1.6, opacity: 0.85, marginTop: 3 },
    ornekBaslik: { fontSize: 9.5, fontWeight: 800, letterSpacing: 1.6, color: 'var(--primary-green)', margin: '14px 0 6px' },
    satir: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10, background: 'var(--bg-sunken)', marginBottom: 5, fontSize: 11.5 },
    satirTarih: { width: 52, color: 'var(--text-muted)', fontWeight: 700, flex: '0 0 auto' },
    satirTakim: { flex: 1, minWidth: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    chip: { flex: '0 0 auto', minWidth: 34, textAlign: 'center', fontWeight: 800, borderRadius: 7, padding: '2px 6px', background: 'var(--bg-card)', color: 'var(--text-secondary)' },
    chipVurgu: { background: 'var(--primary-green)', color: '#fff' },
};

function Kart({ m, tur }) {
    const g = m.goster || {};
    const tahmin = tur === 'iyms' ? m.iyms : '6+';
    // Yer dar: 2 tutan + 1 farklı biten örnek (tarih sırası korunur)
    const tutti = (o) => {
        if (tur === 'iyms') return o.iyms === m.iyms;
        const sk = skorAyikla(o.ms);
        return !!sk && sk[0] + sk[1] >= 6;
    };
    const tum = m.ornek || [];
    const secilen = new Set([...tum.filter(tutti).slice(0, 2), ...tum.filter(o => !tutti(o)).slice(0, 1)]);
    const ornekler = tum.filter(o => secilen.has(o)).slice(0, 3);
    return (
        <div style={stil.kart}>
            <span style={stil.etiket}>{tur === 'iyms' ? 'İY/MS SÜRPRİZİ' : 'GOL SÜRPRİZİ'}</span>
            <div style={stil.ust}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 8 }}>{g.lig || ''}</span>
                <span style={stil.saat}>{m.saat}</span>
            </div>
            <div style={stil.govde}>
                <div style={stil.takimlar}>
                    <div style={stil.takim}>{g.ev || m.ev}</div>
                    <div style={stil.vs}>VS</div>
                    <div style={stil.takim}>{g.dep || m.dep}</div>
                </div>
                <div style={stil.tahmin}>
                    <div style={stil.tahminBuyuk}>{tahmin}</div>
                    <div style={stil.tahminAlt}>{tur === 'iyms' ? 'İY / MS' : 'GOL'}</div>
                </div>
            </div>
            {ornekler.length > 0 && (
                <>
                    <div style={stil.ornekBaslik}>BENZER AÇILIŞ ORANLI MAÇLARDAN</div>
                    {ornekler.map((o, i) => {
                        const ms = skorAyikla(o.ms);
                        const tuttu = tutti(o);
                        return (
                            <div key={i} style={stil.satir}>
                                <span style={stil.satirTarih}>{tarihKisa(o.tarih)}</span>
                                <span style={stil.satirTakim}>{o.ev} – {o.dep}</span>
                                <span style={{ ...stil.chip, ...(tur === 'alti' && tuttu ? stil.chipVurgu : {}) }}>{ms ? `${ms[0]}-${ms[1]}` : '–'}</span>
                                {tur === 'iyms' && (
                                    <span style={{ ...stil.chip, ...(tuttu ? stil.chipVurgu : {}) }}>{o.iyms}</span>
                                )}
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}

export default function OneCikanlar() {
    const [veri, setVeri] = useState(null);

    useEffect(() => {
        let iptal = false;
        fetch(`${ARSIV_URL}${bugunTR()}.json?t=${Date.now()}`)
            .then(y => (y.ok ? y.json() : null))
            .then(d => { if (!iptal) setVeri(d?.surpriz || null); })
            .catch(() => { if (!iptal) setVeri(null); });
        return () => { iptal = true; };
    }, []);

    const kartlar = [
        ...((veri?.iyms) || []).map(m => ({ m, tur: 'iyms' })),
        ...((veri?.alti) || []).map(m => ({ m, tur: 'alti' })),
    ];
    if (kartlar.length === 0) return null;

    return (
        <section style={stil.bolum} aria-label="Günün öne çıkanları">
            <div style={stil.baslik}>
                <span style={stil.baslikYazi}>💥 Günün Öne Çıkanları</span>
                <span style={stil.ipucu}>kaydır →</span>
            </div>
            <div style={stil.serit}>
                {kartlar.map(({ m, tur }) => <Kart key={`${tur}-${m.kod}`} m={m} tur={tur} />)}
            </div>
        </section>
    );
}
