// helper.js - Takım Logoları Sistemi

export const getTeamLogo = (teamName) => {
    if (!teamName) return '/default-team-logo.png';

    // Takım adını normalize et (Türkçe karakterler, boşluklar vs.)
    const normalizedName = teamName
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '-') // boşlukları tire yap
        .replace(/[^a-z0-9-]/g, ''); // özel karakterleri temizle

    // GitHub repo linki
    const logoUrl = `https://raw.githubusercontent.com/camelbox27-lab/mac-tahmin-logolar/main/${normalizedName}.png`;

    return logoUrl;
};

// Hata durumunda varsayılan logo göster
export const handleLogoError = (e) => {
    e.target.src = '/default-team-logo.png';
    e.target.onerror = null; // Sonsuz döngüyü önle
};

// Kart yüzdesi hesaplama
export const calculateCardPercentage = (homeAvg, awayAvg, prediction) => {
    if (!homeAvg || !awayAvg || !prediction) return 0;
    const totalAvg = parseFloat(homeAvg) + parseFloat(awayAvg);
    const targetValue = parseFloat(prediction.split('-')[0]);

    if (prediction.includes('ust')) {
        const percentage = Math.min(100, (totalAvg / targetValue) * 100);
        return Math.round(percentage);
    } else {
        const percentage = Math.min(100, (targetValue / totalAvg) * 100);
        return Math.round(percentage);
    }
};

// Korner yüzdesi hesaplama
export const calculateCornerPercentage = (totalAvg, prediction) => {
    if (!totalAvg || !prediction) return 0;
    const targetValue = parseFloat(prediction.split('-')[0]);

    if (prediction.includes('ust')) {
        const percentage = Math.min(100, (parseFloat(totalAvg) / targetValue) * 100);
        return Math.round(percentage);
    } else {
        const percentage = Math.min(100, (targetValue / parseFloat(totalAvg)) * 100);
        return Math.round(percentage);
    }
};

// Lig logoları
export const LEAGUE_LOGOS = {
    'Serie A': 'https://i.ibb.co/N6N4CGn5/Whats-App-mage-2025-12-05-at-14-21-54-1.jpg',
    'Premier Lig': 'https://i.ibb.co/cXt6fJdd/Whats-App-mage-2025-12-05-at-14-21-54.jpg',
    'La Liga': 'https://i.ibb.co/C55n1CFc/spain-la-liga-64x64-football-logos-cc.png',
    'Super Lig': 'https://i.ibb.co/RT40RH3G/turkey-super-lig-64x64-football-logos-cc.png',
    'Bundesliga': 'https://i.ibb.co/fzrPDNQp/germany-bundesliga-64x64-football-logos-cc.png',
    'Ligue 1': 'https://i.ibb.co/cXSXDS45/france-ligue-1-64x64-football-logos-cc.png'
};

export const getLeagueLogo = (leagueName) => {
    return LEAGUE_LOGOS[leagueName] || '/default-league-logo.png';
};
