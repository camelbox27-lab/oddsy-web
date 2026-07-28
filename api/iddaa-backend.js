import { readFile } from 'node:fs/promises';
import path from 'node:path';

const GUNLUK_PATH = path.join(process.cwd(), 'oddsy-data', 'iddaa', 'gunluk', 'gunlukmaclar.json');
const GECMIS_PATH = path.join(process.cwd(), 'oddsy-data', 'iddaa', 'gecmis', 'iddaagecmis.json');

async function readJson(filePath) {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
}

function normalizeOdds(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(String(value).replace(',', '.'));
    if (Number.isNaN(num)) return null;
    return (Math.round(num * 100) / 100).toFixed(2);
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

function buildAiMatches(historyMatches, odds) {
    const inputOran1 = normalizeOdds(odds?.MS1);
    const inputOran0 = normalizeOdds(odds?.MS0);
    const inputOran2 = normalizeOdds(odds?.MS2);

    return historyMatches
        .map((match) => {
            let score = 0;
            const matchOran1 = normalizeOdds(match?.MS1);
            const matchOran0 = normalizeOdds(match?.MS0);
            const matchOran2 = normalizeOdds(match?.MS2);

            if (inputOran1 && matchOran1 === inputOran1) score += 30;
            if (inputOran0 && matchOran0 === inputOran0) score += 30;
            if (inputOran2 && matchOran2 === inputOran2) score += 30;

            if (score <= 0) return null;

            return {
                ...match,
                _matchScore: score,
                _ligAdi: match?.Lig || 'İddaa',
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
            return new Date(b.Tarih) - new Date(a.Tarih);
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
            if (req.body?.mode === 'history-dump') {
                const historyMatches = await readJson(GECMIS_PATH);

                res.status(200).json({
                    totalMatches: historyMatches.length,
                    data: historyMatches,
                    source: 'iddaagecmis.json',
                });
                return;
            }

            if (req.body?.mode === 'ai-analysis') {
                const historyMatches = await readJson(GECMIS_PATH);
                const matched = buildAiMatches(historyMatches, req.body?.odds || {});

                res.status(200).json({
                    odds: {
                        MS1: normalizeOdds(req.body?.odds?.MS1),
                        MS0: normalizeOdds(req.body?.odds?.MS0),
                        MS2: normalizeOdds(req.body?.odds?.MS2),
                    },
                    totalMatches: matched.length,
                    data: matched,
                    source: 'iddaagecmis.json',
                });
                return;
            }

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
