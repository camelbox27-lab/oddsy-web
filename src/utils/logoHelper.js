// web-version/src/utils/logoHelper.js

const GITHUB_URL = "https://raw.githubusercontent.com/camelbox27-lab/mac-tahmin-logolar/main/";

// EŞLEŞTİRME HARİTASI
const TEAM_MAP = {
    "galatasaray": "galatasaray", "gs": "galatasaray", "cimbom": "galatasaray",
    "fenerbahce": "fenerbahce", "fb": "fenerbahce", "fener": "fenerbahce",
    "besiktas": "besiktas", "bjk": "besiktas",
    "trabzonspor": "trabzonspor", "ts": "trabzonspor",
    "basaksehir": "basaksehir", "ibb": "basaksehir",
    "sivasspor": "sivasspor", "sivas": "sivasspor",
    "adana demirspor": "adanademirspor", "ads": "adanademirspor",
    "manchester city": "manchestercity", "m city": "manchestercity", "city": "manchestercity",
    "manchester united": "manchesterunited", "m united": "manchesterunited", "man utd": "manchesterunited",
    "arsenal": "arsenal", "liverpool": "liverpool", "chelsea": "chelsea",
    "tottenham": "tottenham", "spurs": "tottenham",
    "real madrid": "realmadrid", "r madrid": "realmadrid",
    "barcelona": "barcelona", "barca": "barcelona",
    "atletico madrid": "atleticomadrid", "atm": "atleticomadrid",
    "bayern munih": "bayernmunich", "bayern": "bayernmunich",
    "dortmund": "dortmund",
    "psg": "psg", "paris": "psg",
    "inter": "inter", "milan": "milan", "juventus": "juventus", "napoli": "napoli", "roma": "roma"
};

export const getTeamLogo = (teamName, getSecondTeam = false) => {
    if (!teamName || typeof teamName !== 'string') return "https://i.ibb.co/4P290v0/placeholder.png";

    try {
        let originalText = teamName.toLowerCase().trim();

        // 1. Ayırıcıları kontrol et (Önce tire, sonra vs, sonra x)
        let parts = [originalText];

        if (originalText.includes('-')) {
            parts = originalText.split('-');
        } else if (originalText.includes(' vs ')) {
            parts = originalText.split(' vs ');
        } else if (originalText.includes(' x ')) {
            parts = originalText.split(' x ');
        } else {
            const firstSpaceIndex = originalText.indexOf(' ');
            if (firstSpaceIndex !== -1) {
                parts = [
                    originalText.substring(0, firstSpaceIndex),
                    originalText.substring(firstSpaceIndex + 1)
                ];
            }
        }

        // İstenen takımı seç
        let targetTeamRaw = getSecondTeam && parts.length > 1 ? parts[1] : parts[0];
        targetTeamRaw = targetTeamRaw ? targetTeamRaw.trim() : "";

        // 1. Önce HARİTADA ara
        if (TEAM_MAP[targetTeamRaw]) {
            return `${GITHUB_URL}${TEAM_MAP[targetTeamRaw]}.png`;
        }

        // 2. Bulamazsan temizlik yapıp tekrar dene
        const charMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
        let clean = targetTeamRaw
            .replace(/[çğıöşü]/g, m => charMap[m])
            .replace(/[^a-z0-9]/g, ''); // Sadece harf ve rakam

        if (TEAM_MAP[clean]) {
            return `${GITHUB_URL}${TEAM_MAP[clean]}.png`;
        }

        // 3. Hiçbir şey yoksa temiz ismi dene
        return `${GITHUB_URL}${clean}.png`;

    } catch (e) {
        return "https://i.ibb.co/4P290v0/placeholder.png";
    }
};
