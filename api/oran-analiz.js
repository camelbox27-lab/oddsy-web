import { readFile } from 'node:fs/promises';
import path from 'node:path';

const GUNLUK_PATH = path.join(process.cwd(), 'oddsy-data', 'iddaa', 'gunluk', 'gunlukmaclar.json');
const GECMIS_PATH = path.join(process.cwd(), 'oddsy-data', 'iddaa', 'gecmis', 'iddaagecmis.json');

async function readJson(filePath) {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
}

function extractColumns(records) {
    const columns = new Set();
    records.forEach((record) => Object.keys(record).forEach((key) => columns.add(key)));
    return [...columns];
}

function normalizeFilters(filters) {
    if (!filters || typeof filters !== 'object') return {};
    return Object.fromEntries(
        Object.entries(filters)
            .filter(([column, value]) => column && value !== null && value !== undefined && String(value).trim() !== '')
            .map(([column, value]) => [column, String(value)])
    );
}

function matchExactly(row, filters) {
    return Object.entries(filters).every(([column, value]) => {
        if (column === '__team') {
            return String(row?.['Ev Sahibi'] ?? '') === value || String(row?.['Deplasman'] ?? '') === value;
        }
        return String(row?.[column] ?? '') === value;
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            const dailyMatches = await readJson(GUNLUK_PATH);
            res.status(200).json({
                data: dailyMatches,
                columns: extractColumns(dailyMatches),
                totalRows: dailyMatches.length,
                source: 'gunlukmaclar.json',
            });
            return;
        }

        if (req.method === 'POST') {
            const filters = normalizeFilters(req.body?.filters);
            const historyMatches = await readJson(GECMIS_PATH);
            const matched = Object.keys(filters).length
                ? historyMatches.filter((row) => matchExactly(row, filters))
                : [];

            res.status(200).json({
                filters,
                totalMatches: matched.length,
                data: matched,
                source: 'iddaagecmis.json',
            });
            return;
        }

        res.status(405).json({ error: 'Method not allowed.' });
    } catch (error) {
        res.status(500).json({ error: 'Oran analiz verisi okunamadi.', detail: error.message });
    }
}
