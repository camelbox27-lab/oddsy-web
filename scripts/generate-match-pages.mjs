// Build sonrası, arşivlenmiş bülten verisinden her maç için kalıcı adresli
// statik bir sayfa üretir (dist/mac/<slug>/index.html) ve site haritasını yeniler.
//
// Veri oddsy-data deposundan derleme anında indirilir; bu depoda tutulmaz.
// Ağ hatası build'i düşürmez, üretim atlanır.

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    ARSIV_GUN, ARSIV_INDEKS, GUN_LIMITI, macSlug, maclariTekille, tarihParcalari, yeterliVeriVar,
} from './match-page-data.mjs';
import { SITE, hubSayfasi, macSayfasi } from './match-page-template.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const getir = async (url) => {
    const cevap = await fetch(url, { headers: { 'user-agent': 'wondiyo-build' } });
    if (!cevap.ok) throw new Error(`${cevap.status} ${url}`);
    return cevap.json();
};

// Aynı anda kaç gün indirilsin
const havuzda = async (ogeler, sinir, isle) => {
    const sonuc = [];
    let i = 0;
    const isci = async () => {
        while (i < ogeler.length) {
            const indeks = i++;
            sonuc[indeks] = await isle(ogeler[indeks]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(sinir, ogeler.length) }, isci));
    return sonuc;
};

const siteHaritalariniYaz = (maclar) => {
    // Maç adresleri aya göre bölünür (tek dosyada 50.000 URL sınırı var)
    const aylar = new Map();
    for (const m of maclar) {
        const ay = tarihParcalari(m.Tarih).kisa.slice(3).replace('.', '-'); // AA-YYYY
        if (!aylar.has(ay)) aylar.set(ay, []);
        aylar.get(ay).push(m);
    }

    const haritaDosyalari = [];
    for (const [ay, grup] of aylar) {
        const ad = `sitemap-maclar-${ay}.xml`;
        const govde = grup.map((m) => `  <url>
    <loc>${SITE}/mac/${m.slug}</loc>
    <lastmod>${tarihParcalari(m.Tarih).iso.slice(0, 10)}</lastmod>
    <changefreq>${m.BitmisMac ? 'monthly' : 'daily'}</changefreq>
    <priority>${m.BitmisMac ? '0.5' : '0.7'}</priority>
  </url>`).join('\n');
        writeFileSync(join(distDir, ad),
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${govde}\n</urlset>\n`);
        haritaDosyalari.push(ad);
    }

    // Mevcut statik sayfa haritası yeniden adlandırılır, /sitemap.xml bir indekse dönüşür
    const eski = join(distDir, 'sitemap.xml');
    if (existsSync(eski)) {
        const icerik = readFileSync(eski, 'utf-8');
        if (!icerik.includes('<sitemapindex')) {
            writeFileSync(join(distDir, 'sitemap-sayfalar.xml'), icerik);
        }
    }
    const bugun = new Date().toISOString().slice(0, 10);
    const girdiler = ['sitemap-sayfalar.xml', ...haritaDosyalari]
        .map((ad) => `  <sitemap>\n    <loc>${SITE}/${ad}</loc>\n    <lastmod>${bugun}</lastmod>\n  </sitemap>`)
        .join('\n');
    writeFileSync(eski,
        `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${girdiler}\n</sitemapindex>\n`);

    return haritaDosyalari.length;
};

async function main() {
    if (!existsSync(join(distDir, 'index.html'))) {
        console.error('[mac-sayfalari] dist bulunamadı, önce build alınmalı. Atlanıyor.');
        return;
    }

    let gunListesi;
    try {
        const indeks = await getir(ARSIV_INDEKS);
        gunListesi = (indeks.gunler || []).slice(-GUN_LIMITI);
    } catch (hata) {
        console.warn('[mac-sayfalari] Arşiv indeksi okunamadı, üretim atlanıyor:', hata.message);
        return;
    }
    if (!gunListesi.length) {
        console.warn('[mac-sayfalari] Arşivde gün yok, üretim atlanıyor.');
        return;
    }

    console.log(`[mac-sayfalari] ${gunListesi.length} günlük arşiv indiriliyor...`);
    const gunler = (await havuzda(gunListesi, 8, async (gun) => {
        try {
            return { gun, maclar: await getir(ARSIV_GUN(gun)) };
        } catch (hata) {
            console.warn(`  ${gun} atlandı: ${hata.message}`);
            return null;
        }
    })).filter(Boolean);

    const tekil = maclariTekille(gunler).filter(yeterliVeriVar);
    // Slug çakışması olursa (aynı gün aynı eşleşme) maç koduyla ayrıştırılır
    const gorulen = new Set();
    const maclar = [];
    for (const mac of tekil) {
        let slug = macSlug(mac);
        if (gorulen.has(slug)) slug = `${slug}-${String(mac.MatchCode || mac.Id).toLowerCase()}`;
        if (gorulen.has(slug)) continue;
        gorulen.add(slug);
        maclar.push({ ...mac, slug });
    }
    maclar.sort((a, b) => b.Tarih - a.Tarih);

    // Aynı güne ait maçlar birbirine bağlanır
    const guneGore = new Map();
    for (const m of maclar) {
        const g = tarihParcalari(m.Tarih).kisa;
        if (!guneGore.has(g)) guneGore.set(g, []);
        guneGore.get(g).push(m);
    }

    for (const mac of maclar) {
        const gun = tarihParcalari(mac.Tarih).kisa;
        const ayniGun = (guneGore.get(gun) || []).filter((m) => m.slug !== mac.slug);
        const hedef = join(distDir, 'mac', mac.slug);
        mkdirSync(hedef, { recursive: true });
        writeFileSync(join(hedef, 'index.html'), macSayfasi({ mac, slug: mac.slug, ayniGun }));
    }

    mkdirSync(join(distDir, 'mac'), { recursive: true });
    writeFileSync(join(distDir, 'mac', 'index.html'), hubSayfasi(maclar));

    const haritaSayisi = siteHaritalariniYaz(maclar);
    console.log(`[mac-sayfalari] ${maclar.length} maç sayfası üretildi, ${haritaSayisi} aylık site haritası yazıldı.`);
}

main().catch((hata) => {
    console.warn('[mac-sayfalari] Beklenmeyen hata, üretim atlanıyor:', hata.message);
});
