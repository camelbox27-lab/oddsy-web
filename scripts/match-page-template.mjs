// Maç sayfasının HTML şablonu. Sayfalar SPA'dan bağımsız, kendi kendine yeten
// statik sayfalardır: JS çalıştırmayan crawler'lar da içeriği olduğu gibi görür.

import { MARKET_GRUPLARI, hareketCumlesi, oranHareketi, tarihParcalari } from './match-page-data.mjs';

export const SITE = 'https://www.wondiyo.com.tr';

const kacis = (m = '') => String(m)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const oran = (v) => (typeof v === 'number' ? v.toFixed(2) : '—');

const STIL = `
:root{--yesil:#1E8A45;--yesil-koyu:#146B34;--limon:#C8D92E;--zemin:#F4F6F2;--kart:#fff;
--metin:#16261B;--metin-ik:#4A5B4F;--kenar:#DCE3D6;--golge:0 4px 14px rgba(22,38,27,.10)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--zemin);color:var(--metin);line-height:1.6}
a{color:var(--yesil-koyu)}
.ust{background:linear-gradient(180deg,#D8E33F 0%,#A9CF43 55%,#8DC44A 100%);padding:14px 20px;box-shadow:var(--golge)}
.ust-ic{max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px}
.logo{display:inline-flex;align-items:center;gap:6px;background:var(--yesil);padding:6px 12px 6px 6px;border-radius:10px;text-decoration:none}
.logo b{background:#fff;color:var(--yesil);font-size:22px;font-weight:900;padding:3px 9px;border-radius:6px;letter-spacing:-.5px}
.logo span{color:var(--metin);font-size:22px;font-weight:900;letter-spacing:-.5px}
.ust a.bag{font-size:13px;font-weight:700;color:var(--yesil-koyu);text-decoration:none}
main{max-width:900px;margin:0 auto;padding:24px 16px 56px}
.kunye{font-size:13px;color:var(--metin-ik);margin-bottom:6px}
h1{font-size:26px;font-weight:900;letter-spacing:-.5px;margin-bottom:10px;line-height:1.25}
h2{font-size:18px;font-weight:800;margin:28px 0 12px}
.kart{background:var(--kart);border:1px solid var(--kenar);border-radius:16px;padding:18px;box-shadow:var(--golge);margin-bottom:16px}
.skor{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;text-align:center}
.skor .ss{font-size:34px;font-weight:900;color:var(--yesil)}
.skor .et{font-size:12px;color:var(--metin-ik);text-transform:uppercase;letter-spacing:.5px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:9px 8px;text-align:left;border-bottom:1px solid var(--kenar)}
th{font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:var(--metin-ik);font-weight:700}
td.s{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}
td.d{text-align:right;font-variant-numeric:tabular-nums;font-size:13px}
.dusen{color:#1E8A45}.yukselen{color:#D64545}
.cta{display:inline-block;background:var(--yesil);color:#fff;text-decoration:none;font-weight:800;padding:13px 22px;border-radius:14px;margin-top:6px}
.liste{list-style:none;display:grid;gap:8px}
.liste a{display:block;background:var(--kart);border:1px solid var(--kenar);border-radius:12px;padding:11px 14px;text-decoration:none;color:var(--metin);font-size:14px}
.liste a:hover{border-color:var(--yesil)}
.not{font-size:12px;color:var(--metin-ik);border-top:1px solid var(--kenar);margin-top:32px;padding-top:16px}
@media(max-width:600px){h1{font-size:21px}main{padding:18px 14px 44px}.kart{padding:14px}}
`;

const ustBar = `<header class="ust"><div class="ust-ic">
<a class="logo" href="${SITE}/"><b>won</b><span>diyo</span></a>
<a class="bag" href="${SITE}/oran-analiz">Oran Analiz Aracı →</a>
</div></header>`;

const altNot = `<p class="not">Wondiyo bir bahis sitesi değildir; bahis oynatmaz, bahis kabul etmez.
Bu sayfadaki oranlar bilgilendirme amaçlıdır ve istatistiksel analiz için sunulur.
Analizler sonuç garantisi vermez. İçerik 18 yaş ve üzeri içindir.</p>`;

const marketTablosu = (mac) => {
    const bolumler = MARKET_GRUPLARI.map(({ baslik, kodlar }) => {
        const satirlar = kodlar
            .filter(([kod]) => typeof mac[`${kod} A`] === 'number' || typeof mac[`${kod} K`] === 'number')
            .map(([kod, etiket]) => {
                const a = mac[`${kod} A`];
                const k = mac[`${kod} K`];
                let fark = '—';
                if (typeof a === 'number' && typeof k === 'number' && a) {
                    const y = ((k - a) / a) * 100;
                    const sinif = y < 0 ? 'dusen' : y > 0 ? 'yukselen' : '';
                    const isaret = y > 0 ? '+' : '';
                    fark = `<span class="${sinif}">${isaret}${y.toFixed(1)}%</span>`;
                }
                return `<tr><td>${kacis(etiket)}</td><td class="s">${oran(a)}</td><td class="s">${oran(k)}</td><td class="d">${fark}</td></tr>`;
            });
        if (!satirlar.length) return '';
        return `<h2>${kacis(baslik)}</h2><div class="kart"><table>
<thead><tr><th>Seçenek</th><th style="text-align:right">Açılış</th><th style="text-align:right">Kapanış</th><th style="text-align:right">Değişim</th></tr></thead>
<tbody>${satirlar.join('')}</tbody></table></div>`;
    });
    return bolumler.filter(Boolean).join('\n');
};

export const macSayfasi = ({ mac, slug, ayniGun }) => {
    const t = tarihParcalari(mac.Tarih);
    const ev = kacis(mac.Ev);
    const dep = kacis(mac.Dep);
    const lig = kacis(mac.Lig || 'Futbol');
    const url = `${SITE}/mac/${slug}`;
    const baslik = `${ev} - ${dep} Oran Analizi (${t.kisa})`;
    const bitti = Boolean(mac.BitmisMac) && mac.MSSkor;
    const aciklama = bitti
        ? `${ev} - ${dep} maçı ${t.kisa} tarihinde ${kacis(mac.MSSkor)} bitti. Açılış ve kapanış oranları, oran hareketi ve maç detayları.`
        : `${ev} - ${dep} maçının açılış ve kapanış bahis oranları, oran hareketi analizi ve tüm marketler. ${lig}, ${t.kisa} ${t.saat}.`;

    const skorKarti = bitti ? `<div class="kart skor">
<div><div class="et">İlk Yarı</div><div class="ss">${kacis(mac.IYSkor || '—')}</div></div>
<div><div class="et">Maç Sonu</div><div class="ss">${kacis(mac.MSSkor)}</div></div>
</div>` : '';

    const h = oranHareketi(mac);
    const hareketKarti = h ? `<h2>Oran Hareketi</h2><div class="kart"><p>${kacis(hareketCumlesi(mac))}</p></div>` : '';

    const digerleri = ayniGun.length ? `<h2>${t.kisa} Tarihli Diğer Maçlar</h2><ul class="liste">${
        ayniGun.slice(0, 12).map((m) => `<li><a href="${SITE}/mac/${m.slug}">${kacis(m.Ev)} - ${kacis(m.Dep)}</a></li>`).join('')
    }</ul>` : '';

    const ld = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'SportsEvent',
                '@id': url,
                url,
                name: `${mac.Ev} - ${mac.Dep}`,
                description: aciklama.replace(/&#39;/g, "'"),
                startDate: t.iso,
                eventStatus: bitti ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventScheduled',
                sport: 'Football',
                homeTeam: { '@type': 'SportsTeam', name: mac.Ev },
                awayTeam: { '@type': 'SportsTeam', name: mac.Dep },
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
                    { '@type': 'ListItem', position: 2, name: 'Maç Analizleri', item: `${SITE}/mac/` },
                    { '@type': 'ListItem', position: 3, name: `${mac.Ev} - ${mac.Dep}`, item: url },
                ],
            },
        ],
    };

    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${kacis(baslik)} | Wondiyo</title>
<meta name="description" content="${kacis(aciklama)}" />
<link rel="canonical" href="${url}" />
<link rel="icon" type="image/png" href="/icon-192.png" />
<meta name="robots" content="index, follow" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Wondiyo" />
<meta property="og:title" content="${kacis(baslik)}" />
<meta property="og:description" content="${kacis(aciklama)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE}/wondiyo-share.png" />
<meta property="og:locale" content="tr_TR" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${kacis(baslik)}" />
<meta name="twitter:description" content="${kacis(aciklama)}" />
<meta name="twitter:image" content="${SITE}/wondiyo-share.png" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${STIL}</style>
</head>
<body>
${ustBar}
<main>
<p class="kunye">${lig} · ${kacis(t.uzun)} · ${kacis(t.saat)}</p>
<h1>${ev} - ${dep} Oran Analizi</h1>
${skorKarti}
${hareketKarti}
${marketTablosu(mac)}
<h2>Bu Maçı Kendin Analiz Et</h2>
<div class="kart">
<p>Yukarıdaki oranları Wondiyo'nun oran analiz aracına girerek, geçmişte aynı oran yapısına sahip maçların nasıl sonuçlandığını görebilirsin.</p>
<a class="cta" href="${SITE}/oran-analiz">Oran Analiz Aracını Aç</a>
</div>
${digerleri}
${altNot}
</main>
</body>
</html>`;
};

export const hubSayfasi = (maclar) => {
    const url = `${SITE}/mac/`;
    const satirlar = maclar.slice(0, 300).map((m) => {
        const t = tarihParcalari(m.Tarih);
        return `<li><a href="${SITE}/mac/${m.slug}">${kacis(m.Ev)} - ${kacis(m.Dep)} <small>(${t.kisa})</small></a></li>`;
    }).join('');
    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Maç Oran Analizleri | Wondiyo</title>
<meta name="description" content="Günlük bülten maçlarının açılış ve kapanış oranları, oran hareketleri ve sonuçları. Wondiyo maç analizi arşivi." />
<link rel="canonical" href="${url}" />
<link rel="icon" type="image/png" href="/icon-192.png" />
<meta name="robots" content="index, follow" />
<style>${STIL}</style>
</head>
<body>
${ustBar}
<main>
<h1>Maç Oran Analizleri</h1>
<p class="kunye">Bülten maçlarının açılış ve kapanış oranları, oran hareketleri ve sonuçları.</p>
<h2>Son Maçlar</h2>
<ul class="liste">${satirlar}</ul>
${altNot}
</main>
</body>
</html>`;
};
