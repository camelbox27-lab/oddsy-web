import pkg from 'pg';
const { Pool } = pkg;

const NEON_DSN = process.env.NEON_DSN || 'postgresql://neondb_owner:npg_pBvPtI2fy5Le@ep-holy-smoke-alg1bxgp.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const TABLE = 'bet365_maclar';
// Gunluk bulten GitHub'daki oddsy-data reposundan okunur (oddsy-data klasoru .vercelignore'da,
// yani Vercel'e yuklenmiyor; ayrica boylece veri guncellemesi icin yeni deploy gerekmiyor).
const FRONTEND_JSON_URL = 'https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/main/bet365/gunlukmaclar.json';

const pool = new Pool({ connectionString: NEON_DSN, max: 5 });

// Frontend kolon adi -> DB kolon adi
const KOLON_MAP = {
    'Ev': 'ev', 'Dep': 'dep', 'Lig': 'lig', 'Tarih': 'tarih',
    'IYSkor': 'iyskor', 'MSSkor': 'msskor',
    'MS1 A': 'ms1_a', 'MS1 K': 'ms1_k',
    'MS0 A': 'ms0_a', 'MS0 K': 'ms0_k',
    'MS2 A': 'ms2_a_son', 'MS2 K': 'ms2_k',
    'IY1 A': 'iy1_a', 'IY1 K': 'iy1_k',
    'IY0 A': 'iy0_a', 'IY0 K': 'iy0_k',
    'IY2 A': 'iy2_a', 'IY2 K': 'iy2_k',
    'IIY1 A': 'iiy1_a', 'IIY1 K': 'iiy1_k',
    'IIY0 A': 'iiy0_a', 'IIY0 K': 'iiy0_k',
    'IIY2 A': 'iiy2_a', 'IIY2 K': 'iiy2_k',
    'CS10 A': 'cs10_a', 'CS10 K': 'cs10_k',
    'CS12 A': 'cs12_a', 'CS12 K': 'cs12_k',
    'CS02 A': 'cs02_a', 'CS02 K': 'cs02_k',
    'IYCS10 A': 'iycs10_a', 'IYCS10 K': 'iycs10_k',
    'IYCS12 A': 'iycs12_a', 'IYCS12 K': 'iycs12_k',
    'IYCS02 A': 'iycs02_a', 'IYCS02 K': 'iycs02_k',
    'KGVAR A': 'kgvar_a_fitre', 'KGVAR K': 'kgvar_k',
    'KGYOK A': 'kgyok_a', 'KGYOK K': 'kgyok_k',
    'IY KGVAR A': 'iy_kgvar_a', 'IY KGVAR K': 'iy_kgvar_k',
    'IY KGYOK A': 'iy_kgyok_a', 'IY KGYOK K': 'iy_kgyok_k',
    'IIY KGVAR A': 'iiy_kgvar_a', 'IIY KGVAR K': 'iiy_kgvar_k',
    'IIY KGYOK A': 'iiy_kgyok_a', 'IIY KGYOK K': 'iiy_kgyok_k',
    'ALT05 A': 'alt05_a', 'ALT05 K': 'alt05_k',
    'UST05 A': 'ust05_a', 'UST05 K': 'ust05_k',
    'ALT15 A': 'alt15_a', 'ALT15 K': 'alt15_k',
    'UST15 A': 'ust15_a', 'UST15 K': 'ust15_k',
    'ALT25 A': 'alt25_a', 'ALT25 K': 'alt25_k',
    'UST25 A': 'ust25_a', 'UST25 K': 'ust25_k',
    'ALT35 A': 'alt35_a', 'ALT35 K': 'alt35_k',
    'UST35 A': 'ust35_a', 'UST35 K': 'ust35_k',
    'ALT45 A': 'alt45_a', 'ALT45 K': 'alt45_k',
    'UST45 A': 'ust45_a', 'UST45 K': 'ust45_k',
    'ALT55 A': 'alt55_a', 'ALT55 K': 'alt55_k',
    'UST55 A': 'ust55_a', 'UST55 K': 'ust55_k',
    'ALT65 A': 'alt65_a', 'ALT65 K': 'alt65_k',
    'UST65 A': 'ust65_a', 'UST65 K': 'ust65_k',
    'ALT75 A': 'alt75_a', 'ALT75 K': 'alt75_k',
    'UST75 A': 'ust75_a', 'UST75 K': 'ust75_k',
    'ALT85 A': 'alt85_a', 'ALT85 K': 'alt85_k',
    'UST85 A': 'ust85_a', 'UST85 K': 'ust85_k',
    'IYALT05 A': 'iyalt05_a', 'IYALT05 K': 'iyalt05_k',
    'IYUST05 A': 'iyust05_a', 'IYUST05 K': 'iyust05_k',
    'IYALT15 A': 'iyalt15_a', 'IYALT15 K': 'iyalt15_k',
    'IYUST15 A': 'iyust15_a', 'IYUST15 K': 'iyust15_k',
    'IYALT25 A': 'iyalt25_a', 'IYALT25 K': 'iyalt25_k',
    'IYUST25 A': 'iyust25_a', 'IYUST25 K': 'iyust25_k',
    'IYALT35 A': 'iyalt35_a', 'IYALT35 K': 'iyalt35_k',
    'IYUST35 A': 'iyust35_a', 'IYUST35 K': 'iyust35_k',
    'IYALT45 A': 'iyalt45_a', 'IYALT45 K': 'iyalt45_k',
    'IYUST45 A': 'iyust45_a', 'IYUST45 K': 'iyust45_k',
    'IYMS 1E1 A': 'iyms_1e1_a', 'IYMS 1E1 K': 'iyms_1e1_k',
    'IYMS 1E0 A': 'iyms_1e0_a', 'IYMS 1E0 K': 'iyms_1e0_k',
    'IYMS 1E2 A': 'iyms_1e2_a', 'IYMS 1E2 K': 'iyms_1e2_k',
    'IYMS 0E1 A': 'iyms_0e1_a', 'IYMS 0E1 K': 'iyms_0e1_k',
    'IYMS 0E0 A': 'iyms_0e0_a', 'IYMS 0E0 K': 'iyms_0e0_k',
    'IYMS 0E2 A': 'iyms_0e2_a', 'IYMS 0E2 K': 'iyms_0e2_k',
    'IYMS 2E1 A': 'iyms_2e1_a', 'IYMS 2E1 K': 'iyms_2e1_k',
    'IYMS 2E0 A': 'iyms_2e0_a', 'IYMS 2E0 K': 'iyms_2e0_k',
    'IYMS 2E2 A': 'iyms_2e2_a', 'IYMS 2E2 K': 'iyms_2e2_k',
};

const SONUC_KOLONLAR = ['lig', 'tarih', 'ev', 'dep', 'iyskor', 'msskor'];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }

    try {
        if (req.method === 'GET') {
            const response = await fetch(FRONTEND_JSON_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Gunluk bulten indirilemedi (HTTP ${response.status})`);
            const data = await response.json();
            res.status(200).json({ data, totalRows: data.length, source: 'gunlukmaclar.json' });
            return;
        }

        if (req.method === 'POST') {
            const filters = req.body?.filters || {};
            const aktif = Object.fromEntries(
                Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
            );

            if (!Object.keys(aktif).length) {
                res.status(200).json({ totalMatches: 0, data: [], filters: aktif });
                return;
            }

            // Parametreli sorgu olustur
            const conditions = [];
            const params = [];
            for (const [frontKey, val] of Object.entries(aktif)) {
                const col = KOLON_MAP[frontKey] || frontKey.toLowerCase().replace(/ /g, '_');
                const num = parseFloat(val);
                if (!isNaN(num)) {
                    params.push(num);
                    conditions.push(`${col} = $${params.length}`);
                } else {
                    params.push(val);
                    conditions.push(`${col} = $${params.length}`);
                }
            }

            const whereClause = conditions.join(' AND ');
            // id disinda tum kolonlar donuluyor (Alt/Ust, CS, IYMS gibi genis oran gruplari dahil)
            const sql = `SELECT * FROM ${TABLE} WHERE ${whereClause} LIMIT 50000`;

            const client = await pool.connect();
            try {
                const start = Date.now();
                // Tek filtreli sorgularda önce count al, 5000'den fazla ise veri döndürme
                const countResult = await client.query(
                    `SELECT COUNT(*) FROM ${TABLE} WHERE ${whereClause}`, params
                );
                const totalMatches = parseInt(countResult.rows[0].count);
                const elapsed1 = Date.now() - start;

                const result = await client.query(sql, params);
                const elapsed = Date.now() - start;
                res.status(200).json({
                    filters: aktif,
                    totalMatches,
                    data: result.rows,
                    source: 'neon',
                    queryMs: elapsed
                });
            } finally {
                client.release();
            }
            return;
        }

        res.status(405).json({ error: 'Method not allowed.' });
    } catch (error) {
        res.status(500).json({ error: 'Bet365 backend hatasi.', detail: error.message });
    }
}
