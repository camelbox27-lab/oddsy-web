import { useEffect, useMemo, useState } from 'react';
const dailyMatchesUrl = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/oran%20data/gunlukmaclar.json';
const historyMatchesUrl = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/oran%20data/iddaagecmis.json';

const TEAM_FILTER_KEY = '__team';

// Bet365 ligler_json dosyaları
const BET365_LEAGUES = [
    '2. Bundesliga', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
];

function extractColumns(records) {
    const columns = new Set();
    records.slice(0, 200).forEach((record) => Object.keys(record).forEach((key) => columns.add(key)));
    return [...columns];
}

function sortColumns(columns) {
    const firstColumns = ['Tarih', 'Saat', 'Lig', 'Ev Sahibi', 'Deplasman', 'MS Kodu'];
    const ordered = firstColumns.filter((column) => columns.includes(column));
    const rest = columns.filter((column) => !ordered.includes(column));
    return [...ordered, ...rest];
}

function sortBet365Columns(columns) {
    const firstColumns = ['Ülke', 'Lig', 'Sezon', 'Tarih', 'Ev Sahibi', 'Deplasman', 'İlk Yarı Skor', 'Maç Sonucu Skor'];
    const ordered = firstColumns.filter((column) => columns.includes(column));
    const rest = columns.filter((column) => !ordered.includes(column));
    return [...ordered, ...rest];
}

function sanitizeFilterValue(value) {
    return value.replace(/\s+/g, ' ').trim();
}

function extractFilters(filterValues) {
    return Object.fromEntries(
        Object.entries(filterValues).filter(([, value]) => value && value.trim() !== '')
    );
}

function matchesFilters(row, filters) {
    return Object.entries(filters).every(([column, value]) => {
        if (column === TEAM_FILTER_KEY) {
            return String(row?.['Ev Sahibi'] ?? '') === value || String(row?.['Deplasman'] ?? '') === value;
        }
        return String(row?.[column] ?? '') === value;
    });
}

// --- İddaa veri yükleme ---
async function loadLocalDailyMatches() {
    const response = await fetch(dailyMatchesUrl);
    if (!response.ok) throw new Error('Gunluk json okunamadi.');
    return await response.json();
}

async function loadLocalHistoryMatches() {
    const response = await fetch(historyMatchesUrl);
    if (!response.ok) throw new Error('Gecmis json okunamadi.');
    return await response.json();
}

async function fetchIddaaDailyMatches() {
    try {
        const response = await fetch('/api/iddaa-backend');
        if (!response.ok) throw new Error('backend yok');
        return await response.json();
    } catch (_) {
        const localData = await loadLocalDailyMatches();
        return { data: localData, columns: extractColumns(localData), totalRows: localData.length, source: 'local-json' };
    }
}

async function fetchIddaaAnalysis(activeFilters) {
    try {
        const response = await fetch('/api/iddaa-backend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters: activeFilters }),
        });
        if (!response.ok) throw new Error('backend yok');
        return await response.json();
    } catch (_) {
        const localHistory = await loadLocalHistoryMatches();
        const matched = localHistory.filter((row) => matchesFilters(row, activeFilters));
        return { filters: activeFilters, totalMatches: matched.length, data: matched, source: 'local-json' };
    }
}

// --- Bet365 veri yükleme ---
async function fetchBet365Analysis(activeFilters) {
    const response = await fetch('/api/bet365-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: activeFilters }),
    });
    if (!response.ok) throw new Error('Bet365 backend hatası.');
    return await response.json();
}

// --- İddaa Paneli ---
function IddaaPanel({ onBack }) {
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [filters, setFilters] = useState({});
    const [resultFilters, setResultFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisError, setAnalysisError] = useState('');
    const [analysis, setAnalysis] = useState({ filters: {}, totalMatches: 0, data: [], source: '' });

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const payload = await fetchIddaaDailyMatches();
                if (cancelled) return;
                setRows(Array.isArray(payload.data) ? payload.data : []);
                setColumns(sortColumns(payload.columns || []));
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const activeFilters = useMemo(() => extractFilters(filters), [filters]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!Object.keys(activeFilters).length) {
                setAnalysis({ filters: {}, totalMatches: 0, data: [], source: '' });
                setAnalysisError('');
                setAnalysisLoading(false);
                return;
            }
            setAnalysisLoading(true);
            setAnalysisError('');
            try {
                const payload = await fetchIddaaAnalysis(activeFilters);
                if (!cancelled) setAnalysis(payload);
            } catch (e) {
                if (!cancelled) setAnalysisError(e.message);
            } finally {
                if (!cancelled) setAnalysisLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [activeFilters]);

    const visibleRows = useMemo(() => {
        if (!Object.keys(activeFilters).length) return rows;
        return rows.filter((row) => matchesFilters(row, activeFilters));
    }, [activeFilters, rows]);

    const orderedResultColumns = useMemo(() => {
        const priority = ['Tarih', 'Saat', 'Lig', 'Ev Sahibi', 'Deplasman', 'IY Skor', 'MS Skor', 'MS Kodu'];
        const available = extractColumns(analysis.data);
        const ordered = priority.filter((c) => available.includes(c));
        const rest = available.filter((c) => !ordered.includes(c));
        return [...ordered, ...rest];
    }, [analysis.data]);

    const activeResultFilters = useMemo(() => extractFilters(resultFilters), [resultFilters]);
    const visibleAnalysisRows = useMemo(() => {
        if (!Object.keys(activeResultFilters).length) return analysis.data;
        return analysis.data.filter((row) => matchesFilters(row, activeResultFilters));
    }, [activeResultFilters, analysis.data]);

    const handleFilterChange = (column, value) => {
        setFilters((current) => ({ ...current, [column]: sanitizeFilterValue(value) }));
    };

    const clearFilters = () => { setFilters({}); setResultFilters({}); };
    const totalFilterCount = Object.keys(activeFilters).length;

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        Gunluk maclari filtrele, birebir eslesen gecmis mac sonuclarini aninda gor.
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '10px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                        {visibleRows.length} / {rows.length} gunluk mac
                    </div>
                    <button onClick={clearFilters} style={{ background: 'var(--primary-green)', color: 'var(--gold)', border: '1px solid var(--primary-green-light)', padding: '10px 14px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>
                        Filtreleri Temizle
                    </button>
                </div>
            </div>

            {/* Takım filtresi */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'grid', gap: 8 }}>
                <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 15 }}>Takim Filtresi</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Bu alan gecmis maclarda takimi hem ev sahibi hem deplasman tarafinda arar.</div>
                <input
                    value={filters[TEAM_FILTER_KEY] || ''}
                    onChange={(e) => handleFilterChange(TEAM_FILTER_KEY, e.target.value)}
                    placeholder="Orn: Fenerbahçe"
                    list="iddaa-team-filter"
                    style={{ width: '100%', maxWidth: 320, background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none' }}
                />
                <datalist id="iddaa-team-filter">
                    {Array.from(new Set([...rows.map((r) => r['Ev Sahibi']), ...rows.map((r) => r['Deplasman'])].filter(Boolean))).map((v) => (
                        <option key={v} value={v} />
                    ))}
                </datalist>
            </div>

            {/* Günlük maç tablosu */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 16 }}>Gunluk Mac Tablosu</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>Filtre degeri neyse gecmis veri de ayni kolonlarda birebir onunla eslestirilir.</div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {totalFilterCount ? `${totalFilterCount} aktif filtre` : 'Henuz filtre uygulanmadi'}
                    </div>
                </div>
                {loading ? (
                    <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Gunluk maclar yukleniyor...</div>
                ) : error ? (
                    <div style={{ padding: 32, color: 'var(--error)' }}>{error}</div>
                ) : (
                    <div style={{ overflow: 'auto', maxHeight: '65vh' }} className="custom-scrollbar">
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                <tr>
                                    {columns.map((column) => (
                                        <th key={column} style={{ minWidth: 180, background: 'var(--primary-green-dark)', color: 'var(--gold)', borderBottom: '1px solid var(--border)', padding: 12, textAlign: 'left', verticalAlign: 'top' }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>{column}</div>
                                            <input
                                                value={filters[column] || ''}
                                                onChange={(e) => handleFilterChange(column, e.target.value)}
                                                placeholder="Filtre"
                                                list={`iddaa-col-${column}`}
                                                style={{ width: '100%', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none' }}
                                            />
                                            <datalist id={`iddaa-col-${column}`}>
                                                {Array.from(new Set(rows.map((r) => r[column]).filter(Boolean))).map((v) => (
                                                    <option key={v} value={v} />
                                                ))}
                                            </datalist>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((row, i) => (
                                    <tr key={`${row['MS Kodu'] || i}-${row['Ev Sahibi'] || 'match'}`}>
                                        {columns.map((column) => (
                                            <td key={`${i}-${column}`} style={{ minWidth: 180, background: i % 2 === 0 ? 'var(--bg-dark)' : 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', padding: '12px 10px', fontSize: 13, whiteSpace: 'nowrap' }}>
                                                {row[column] ?? '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {!visibleRows.length ? (
                                    <tr><td colSpan={columns.length} style={{ padding: 18, color: 'var(--text-secondary)' }}>Gunluk tabloda bu filtrelerle birebir eslesen mac yok.</td></tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Eşleşen geçmiş maçlar */}
            <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Eslesen Gecmis Maclar</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            {totalFilterCount ? 'Secili filtrelerle birebir eslesen gecmis maclar listelenir.' : 'Listeyi doldurmak icin ust tablodan en az bir filtre gir.'}
                        </p>
                    </div>
                    {analysisLoading ? <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Gecmis maclar yukleniyor...</div> : null}
                </div>
                {analysisError ? <div style={{ color: 'var(--error)' }}>{analysisError}</div> : null}
                {totalFilterCount > 0 && !analysisLoading && analysis.totalMatches === 0 ? (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, color: 'var(--text-secondary)' }}>
                        Bu filtre kombinasyonu icin birebir eslesen gecmis mac bulunamadi.
                    </div>
                ) : null}
                {analysis.data.length > 0 ? (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', color: 'var(--gold)', fontWeight: 800, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span>Eslesen Gecmis Maclar</span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12 }}>{visibleAnalysisRows.length} / {analysis.totalMatches} kayit</span>
                        </div>
                        <div style={{ overflow: 'auto', maxHeight: '45vh' }} className="custom-scrollbar">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--primary-green-dark)' }}>
                                        {orderedResultColumns.map((column) => (
                                            <th key={column} style={{ color: 'var(--gold)', textAlign: 'left', padding: 12, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{column}</th>
                                        ))}
                                    </tr>
                                    <tr style={{ background: 'var(--primary-green-dark)' }}>
                                        {orderedResultColumns.map((column) => (
                                            <th key={`rf-${column}`} style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
                                                <input
                                                    value={resultFilters[column] || ''}
                                                    onChange={(e) => setResultFilters((cur) => ({ ...cur, [column]: sanitizeFilterValue(e.target.value) }))}
                                                    placeholder="Filtre"
                                                    list={`iddaa-res-${column}`}
                                                    style={{ width: '100%', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none' }}
                                                />
                                                <datalist id={`iddaa-res-${column}`}>
                                                    {Array.from(new Set(analysis.data.map((r) => r[column]).filter(Boolean))).map((v) => (
                                                        <option key={v} value={v} />
                                                    ))}
                                                </datalist>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleAnalysisRows.map((row, i) => (
                                        <tr key={`${i}-${row['MS Kodu'] || row['Ev Sahibi']}`}>
                                            {orderedResultColumns.map((column) => (
                                                <td key={`${i}-${column}`} style={{ color: column === 'MS Skor' || column === 'IY Skor' ? 'var(--gold)' : 'var(--text-primary)', fontWeight: column === 'MS Skor' || column === 'IY Skor' ? 800 : 500, padding: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: 13 }}>
                                                    {row[column] ?? '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {!visibleAnalysisRows.length ? (
                                        <tr><td colSpan={orderedResultColumns.length} style={{ padding: 18, color: 'var(--text-secondary)' }}>Eslesen gecmis maclar icinde bu filtrelerle birebir kayit bulunamadi.</td></tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// --- Bet365 Paneli ---
function Bet365Panel() {
    const [filters, setFilters] = useState({});
    const [resultFilters, setResultFilters] = useState({});
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [analysis, setAnalysis] = useState({ filters: {}, totalMatches: 0, data: [], source: '' });

    const activeFilters = useMemo(() => extractFilters(filters), [filters]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!Object.keys(activeFilters).length) {
                setAnalysis({ filters: {}, totalMatches: 0, data: [], source: '' });
                setAnalysisError('');
                setAnalysisLoading(false);
                return;
            }
            setAnalysisLoading(true);
            setAnalysisError('');
            try {
                const payload = await fetchBet365Analysis(activeFilters);
                if (!cancelled) setAnalysis(payload);
            } catch (e) {
                if (!cancelled) setAnalysisError(e.message);
            } finally {
                if (!cancelled) setAnalysisLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [activeFilters]);

    const orderedResultColumns = useMemo(() => {
        if (!analysis.data.length) return [];
        return sortBet365Columns(extractColumns(analysis.data));
    }, [analysis.data]);

    const activeResultFilters = useMemo(() => extractFilters(resultFilters), [resultFilters]);
    const visibleAnalysisRows = useMemo(() => {
        if (!Object.keys(activeResultFilters).length) return analysis.data;
        return analysis.data.filter((row) => matchesFilters(row, activeResultFilters));
    }, [activeResultFilters, analysis.data]);

    const handleFilterChange = (column, value) => {
        setFilters((cur) => ({ ...cur, [column]: sanitizeFilterValue(value) }));
    };

    const clearFilters = () => { setFilters({}); setResultFilters({}); };
    const totalFilterCount = Object.keys(activeFilters).length;

    // Bet365 filtre kolonları (sabit — günlük maç yoktur)
    const filterColumns = ['Ülke', 'Lig', 'Sezon', 'Ev Sahibi', 'Deplasman'];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Bet365 gecmis mac veritabaninda filtre ile ara.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={clearFilters} style={{ background: 'var(--primary-green)', color: 'var(--gold)', border: '1px solid var(--primary-green-light)', padding: '10px 14px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>
                        Filtreleri Temizle
                    </button>
                </div>
            </div>

            {/* Filtreler */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'grid', gap: 12 }}>
                <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 15 }}>Filtreler</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {filterColumns.map((column) => (
                        <div key={column} style={{ display: 'grid', gap: 4 }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>{column}</label>
                            <input
                                value={filters[column] || ''}
                                onChange={(e) => handleFilterChange(column, e.target.value)}
                                placeholder={`${column} filtrele...`}
                                style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none' }}
                            />
                        </div>
                    ))}
                    {/* Takım filtresi */}
                    <div style={{ display: 'grid', gap: 4 }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>Takim (Ev veya Deplasman)</label>
                        <input
                            value={filters[TEAM_FILTER_KEY] || ''}
                            onChange={(e) => handleFilterChange(TEAM_FILTER_KEY, e.target.value)}
                            placeholder="Orn: Arsenal"
                            style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none' }}
                        />
                    </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {totalFilterCount ? `${totalFilterCount} aktif filtre` : 'En az bir filtre girince arama baslar.'}
                </div>
            </div>

            {/* Sonuçlar */}
            {analysisLoading ? (
                <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Bet365 verisi aranıyor...</div>
            ) : null}
            {analysisError ? <div style={{ color: 'var(--error)' }}>{analysisError}</div> : null}
            {totalFilterCount > 0 && !analysisLoading && analysis.totalMatches === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, color: 'var(--text-secondary)' }}>
                    Bu filtre kombinasyonu icin Bet365 verisinde eslesen mac bulunamadi.
                </div>
            ) : null}
            {analysis.data.length > 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', color: 'var(--gold)', fontWeight: 800, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <span>Bet365 Eslesen Maclar</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12 }}>{visibleAnalysisRows.length} / {analysis.totalMatches} kayit</span>
                    </div>
                    <div style={{ overflow: 'auto', maxHeight: '55vh' }} className="custom-scrollbar">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--primary-green-dark)' }}>
                                    {orderedResultColumns.map((column) => (
                                        <th key={column} style={{ color: 'var(--gold)', textAlign: 'left', padding: 12, fontSize: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{column}</th>
                                    ))}
                                </tr>
                                <tr style={{ background: 'var(--primary-green-dark)' }}>
                                    {orderedResultColumns.map((column) => (
                                        <th key={`rf-${column}`} style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
                                            <input
                                                value={resultFilters[column] || ''}
                                                onChange={(e) => setResultFilters((cur) => ({ ...cur, [column]: sanitizeFilterValue(e.target.value) }))}
                                                placeholder="Filtre"
                                                list={`b365-res-${column}`}
                                                style={{ width: '100%', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none' }}
                                            />
                                            <datalist id={`b365-res-${column}`}>
                                                {Array.from(new Set(analysis.data.map((r) => r[column]).filter(Boolean))).map((v) => (
                                                    <option key={String(v)} value={String(v)} />
                                                ))}
                                            </datalist>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleAnalysisRows.map((row, i) => (
                                    <tr key={i}>
                                        {orderedResultColumns.map((column) => (
                                            <td key={`${i}-${column}`} style={{ color: column === 'Maç Sonucu Skor' || column === 'İlk Yarı Skor' ? 'var(--gold)' : 'var(--text-primary)', fontWeight: column === 'Maç Sonucu Skor' || column === 'İlk Yarı Skor' ? 800 : 500, padding: 12, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: 13 }}>
                                                {row[column] != null ? String(row[column]) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {!visibleAnalysisRows.length ? (
                                    <tr><td colSpan={orderedResultColumns.length} style={{ padding: 18, color: 'var(--text-secondary)' }}>Sonuclar icinde bu filtrelerle kayit bulunamadi.</td></tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

// --- Ana bileşen ---
export default function OranAnaliz({ onBack, defaultSource = null }) {
    const [source, setSource] = useState(defaultSource); // null = seçim ekranı, 'iddaa' | 'bet365'

    // Seçim ekranı
    if (source === null) {
        return (
            <div className="category-page">
                <div className="category-header">
                    <button className="category-back-btn" onClick={onBack}>←</button>
                    <h1 className="category-title">ORAN ANALİZ</h1>
                </div>
                <div className="predictions-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 15, maxWidth: 600, margin: '0 auto' }}>
                    <div className="menu-selection-card" onClick={() => setSource('iddaa')}>
                        <img src="https://i.ibb.co/3mb3dcx0/banko.png" style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt="İddaa" />
                        <h3 style={{ color: 'var(--gold)', fontSize: 18, marginBottom: 6 }}>İddaa Oran Analizi</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                            İddaa oran analizi için tıklayınız
                        </p>
                    </div>
                    <div className="menu-selection-card" onClick={() => setSource('bet365')}>
                        <img src="https://i.ibb.co/LFNHb81/ideal.png" style={{ width: 100, height: 100, marginBottom: 15, objectFit: 'contain' }} alt="Bet365" />
                        <h3 style={{ color: '#4ade80', fontSize: 18, marginBottom: 6 }}>Bet365 Oran Analizi</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                            Bet365 oran analizi için tıklayınız
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, display: 'grid', gap: 20 }}>
            {/* Başlık + geri + kaynak switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="category-back-btn" onClick={() => setSource(null)}>←</button>
                    <div>
                        <h1 style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 900, marginBottom: 2 }}>Oran Analiz</h1>
                    </div>
                </div>
                {/* Kaynak seçici */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {['iddaa', 'bet365'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setSource(s)}
                            style={{
                                background: source === s ? 'var(--primary-green)' : 'var(--bg-card)',
                                color: source === s ? 'var(--gold)' : 'var(--text-secondary)',
                                border: `1px solid ${source === s ? 'var(--primary-green-light)' : 'var(--border)'}`,
                                borderRadius: 999,
                                padding: '8px 20px',
                                fontWeight: 800,
                                fontSize: 14,
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            {s === 'iddaa' ? 'İddaa' : 'Bet365'}
                        </button>
                    ))}
                </div>
            </div>

            {source === 'iddaa' ? <IddaaPanel /> : <Bet365Panel />}
        </div>
    );
}
