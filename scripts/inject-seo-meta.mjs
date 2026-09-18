// Build sonrası, misafirlere açık her route için dist/<route>/index.html kopyası üretir
// ve sadece <head> içindeki title/description/OG/Twitter/canonical etiketlerini o sayfaya
// özel içerikle değiştirir. Gövde (body) aynı SPA shell'i olarak kalır, davranış değişmez —
// tek fark, JS çalıştırmayan bot/crawler'ların artık her sayfada doğru başlık/açıklama görmesi.
//
// NOT: Aşağıdaki ROUTE_META listesi src/App.jsx içindeki ROUTE_META ile senkron tutulmalı.
// Yeni bir public route eklenince buraya da eklenmesi gerekir.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');

const SITE_TITLE = 'Wondiyo - Akıllı Futbol Tahminleri';
const SITE_DESCRIPTION = 'Wondiyo ile yapay zeka destekli oran analiziyle güçlendirilmiş futbol tahminleri. Günlük bülten maçlarını filtrele, geçmiş verilerle karşılaştır, akıllı tahminlere ulaş.';

// Sadece giriş yapmadan da erişilebilen (misafire açık) route'lar için üretilir.
const PUBLIC_ROUTES = [
    { path: '/oran-analiz', title: 'Oran Analiz | Wondiyo', description: 'Günlük bülten maçlarını geçmiş verilerle birebir eşleştiren oran analiz aracı. Filtrele, karşılaştır, sonucu gör.' },
    { path: '/manuel-analiz', title: 'Manuel Analiz | Wondiyo', description: 'Maç istatistiklerini kendi kriterlerinize göre analiz edin, manuel tahmin oluşturun.' },
    { path: '/kart-analizi', title: 'Kart Analizi | Wondiyo', description: 'Takımların sarı/kırmızı kart istatistiklerine dayalı kart analiz botu.' },
    { path: '/korner-analizi', title: 'Korner Analizi | Wondiyo', description: 'Korner istatistiklerine dayalı yapay zeka destekli korner analiz botu.' },
    { path: '/yapay-zeka-analizleri', title: 'Yapay Zeka Analizleri | Wondiyo', description: 'Yapay zeka algoritmalarıyla oluşturulan günlük maç analizleri ve tahminler.' },
    { path: '/iy-ms-tahminleri', title: 'İY / MS Tahminleri | Wondiyo', description: 'İlk yarı / maç sonu kombinasyon tahminleri, güncel bülten maçları üzerinden.' },
    { path: '/ilk-yari-gol-listesi', title: 'İlk Yarı Gol Listesi | Wondiyo', description: 'İlk yarıda gol beklentisi yüksek maçların listesi ve analizleri.' },
    { path: '/gunun-kuponlari', title: 'Günün Kuponları | Wondiyo', description: 'Banko, ideal ve sürpriz kupon önerileri günlük olarak burada.' },
    { path: '/gunun-tercihleri', title: 'Günün Tercihleri | Wondiyo', description: 'Editör ekibinin günün öne çıkan maçları için tercihleri ve yorumları.' },
    { path: '/gunun-surprizleri', title: 'Günün Sürprizleri | Wondiyo', description: 'Yüksek oranlı, sürpriz sonuç beklentisi olan günün maçları.' },
    { path: '/orani-dusen-maclar', title: 'Oranı Düşen Maçlar | Wondiyo', description: 'Bahis oranı hızla düşen, piyasa hareketliliği yüksek maçların takibi.' },
    { path: '/abonelik', title: 'Abonelik Planları | Wondiyo', description: 'Wondiyo VIP abonelik planları ve premium analiz özellikleri.' },
];

function setMetaContent(html, selectorRegex, replacement) {
    return html.replace(selectorRegex, replacement);
}

function buildHtmlFor(baseHtml, { path, title, description }) {
    const canonicalUrl = `https://wondiyo.com.tr${path}`;
    let html = baseHtml;

    html = setMetaContent(html, /<title>.*?<\/title>/, `<title>${title}</title>`);
    html = setMetaContent(html, /(<meta name="description" content=")[^"]*(")/, `$1${description}$2`);
    html = setMetaContent(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${canonicalUrl}$2`);
    html = setMetaContent(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`);
    html = setMetaContent(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`);
    html = setMetaContent(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`);
    html = setMetaContent(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`);
    html = setMetaContent(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`);

    return html;
}

function main() {
    if (!existsSync(indexPath)) {
        console.error('[inject-seo-meta] dist/index.html bulunamadı, önce build alınmalı. Atlanıyor.');
        return;
    }

    const baseHtml = readFileSync(indexPath, 'utf8');
    let count = 0;

    for (const route of PUBLIC_ROUTES) {
        const routeDir = join(distDir, route.path);
        mkdirSync(routeDir, { recursive: true });
        const html = buildHtmlFor(baseHtml, route);
        writeFileSync(join(routeDir, 'index.html'), html, 'utf8');
        count++;
    }

    console.log(`[inject-seo-meta] ${count} route için statik meta HTML üretildi (dist/<route>/index.html).`);
}

main();
