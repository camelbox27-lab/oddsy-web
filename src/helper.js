
export const normalizeTeamName = (name) => {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

const TEAM_NAME_ABBREVIATIONS = {
    'dundee-utd': 'dundee-united',
    'psv': 'psv-eindhoven',
    'psv-eindhoven': 'psv-eindhoven',
    'b-leverkusen': 'bayer-04-leverkusen',
    'st-gilloise': 'union-saint-gilloise',
    'm-city': 'manchester-city',
    'm-united': 'manchester-united',
    'wolves': 'wolverhampton-wanderers',
    'spurs': 'tottenham-hotspur',
    'm-gladbach': 'borussia-monchengladbach',
    'p-st-germain': 'paris-saint-germain',
    'clermont': 'clermont-foot',
    'st-etienne': 'saint-etienne',
    'milan': 'ac-milan',
    'inter': 'inter-milan',
    'groningen': 'groningen',
    'fc-groningen': 'groningen',
    'az': 'az-alkmaar',
    'az-alkmaar': 'az-alkmaar',
    'vfb-stuttgart': 'vfb-stuttgart',
    'fc-volendam': 'fc-volendam',
    'fc-utrecht': 'fc-utrecht',
    'fc-twente': 'fc-twente',
    'sc-heerenveen': 'sc-heerenveen',
    'sc-cambuur': 'sc-cambuur',
    'sc-freiburg': 'sc-freiburg',
    'sc-paderborn': 'sc-paderborn',
    'afc-ajax': 'afc-ajax',
    'ajax': 'afc-ajax',
    'rb-leipzig': 'rb-leipzig',
    'rb-salzburg': 'rb-salzburg',
    'fc-porto': 'fc-porto',
    'porto': 'fc-porto',
    'sl-benfica': 'sl-benfica',
    'benfica': 'sl-benfica',
    'sporting-cp': 'sporting-cp',
    'sporting': 'sporting-cp',
    'sc-braga': 'sc-braga',
    'braga': 'sc-braga',
    'fc-famalicao': 'fc-famalicao',
    'fc-vizela': 'fc-vizela',
    'sc-gil-vicente': 'sc-gil-vicente',
    'fc-pacos-de-ferreira': 'fc-pacos-de-ferreira',
    'fc-arouca': 'fc-arouca',
    'fc-santa-clara': 'fc-santa-clara',
    'sc-farense': 'sc-farense',
    'fc-rio-ave': 'fc-rio-ave',
    'atalanta': 'atalanta',
    'torino': 'torino',
    'excelsior': 'excelsior',
    'breda': 'breda',
    'nac-breda': 'nac-breda',
};

const tryAlternativeNames = (normalized) => {
    if (TEAM_NAME_ABBREVIATIONS[normalized]) {
        return TEAM_NAME_ABBREVIATIONS[normalized];
    }
    return normalized;
};

export const getTeamLogo = (teamName) => {
    if (!teamName) {
        console.log('Logo aranıyor: Takım ismi boş');
        return '/logos/default-team-logo.png';
    }

    let normalized = normalizeTeamName(teamName);
    console.log(`Logo aranıyor: "${teamName}" → normalized: "${normalized}"`);

    // Manuel eşleşmeleri kontrol et
    const mappedName = tryAlternativeNames(normalized);
    if (mappedName !== normalized) {
        console.log(`Logo mapping: "${normalized}" → "${mappedName}"`);
        normalized = mappedName;
    }

    const logoPath = `/logos/${normalized}.png`;
    console.log(`Logo path: ${logoPath}`);

    return logoPath;
};

// Logo yüklenemezse default logo göster (asla gizleme!)
export const handleLogoError = (e) => {
    const src = e.target.src;
    console.log('Logo BULUNAMADI, default kullanılıyor:', src);

    // Sonsuz döngüyü önle
    if (src.includes('default-team') || src.includes('data:image') || src.includes('placeholder')) {
        e.target.onerror = null;
        return;
    }

    // Default futbol topu logosu (SVG data URL)
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iIzJlMzMzNSIgc3Ryb2tlPSIjRkRCOTEzIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNNTAgMTBMNjUgMzBMODUgMzVMNzUgNTVMODAgNzVMNTAgODBMMjAgNzVMMjUgNTVMMTUgMzVMMzUgMzBaIiBmaWxsPSIjRkRCOTEzIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkRCOTEzIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
    e.target.onerror = null;
};

export const LEAGUE_LOGOS = {
    'Serie A': 'https://i.ibb.co/N6N4CGn5/Whats-App-mage-2025-12-05-at-14-21-54-1.jpg',
    'Premier Lig': 'https://i.ibb.co/cXt6fJdd/Whats-App-mage-2025-12-05-at-14-21-54.jpg',
    'La Liga': 'https://i.ibb.co/C55n1CFc/spain-la-liga-64x64-football-logos-cc.png',
    'Super Lig': 'https://i.ibb.co/RT40RH3G/turkey-super-lig-64x64-football-logos-cc.png',
    'Bundesliga': 'https://i.ibb.co/fzrPDNQp/germany-bundesliga-64x64-football-logos-cc.png',
    'Ligue 1': 'https://i.ibb.co/cXSXDS45/france-ligue-1-64x64-football-logos-cc.png'
};

export const calculatePercentage = (home, away) => {
    if (!home || !away) return 0;
    const total = parseFloat(home) + parseFloat(away);
    return Math.round((parseFloat(home) / total) * 100);
};

export const getLeagueLogo = (leagueName) => {
    return LEAGUE_LOGOS[leagueName] || 'https://i.ibb.co/RT40RH3G/turkey-super-lig-64x64-football-logos-cc.png';
};
