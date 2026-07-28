// Build sonrası, misafire açık her route için gerçek render edilmiş DOM içeriğini
// (React component'lerinin ürettiği gerçek HTML - başlıklar, tablolar, metinler) statik
// dist/<route>/index.html dosyasının <div id="root"> içine "dondurup" yazar.
//
// Bu script inject-seo-meta.mjs'den SONRA çalışmalı: o script zaten dist/<route>/index.html
// dosyalarını doğru <head> meta etiketleriyle üretmiş olur, biz sadece <body> içindeki
// #root'un içeriğini dolduruyoruz. Script tag'lerine dokunmuyoruz, SPA/hydration davranışı
// aynen devam eder - tek fark JS çalıştırmayan bot/crawler'ların artık gerçek sayfa
// içeriğini de görebilmesi.
//
// NOT: PUBLIC_ROUTES listesi inject-seo-meta.mjs ve src/App.jsx içindeki ROUTE_META/ROUTE_PATHS
// ile senkron tutulmalı. Yeni bir public route eklenince buraya da eklenmesi gerekir.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Ana sayfa + inject-seo-meta.mjs'de üretilen 12 misafire-açık route.
const PUBLIC_ROUTES = [
    '/',
    '/oran-analiz',
    '/manuel-analiz',
    '/kart-analizi',
    '/korner-analizi',
    '/yapay-zeka-analizleri',
    '/iy-ms-tahminleri',
    '/ilk-yari-gol-listesi',
    '/gunun-kuponlari',
    '/gunun-tercihleri',
    '/gunun-surprizleri',
    '/orani-dusen-maclar',
    '/abonelik',
];

const PORT = 4173 + Math.floor(Math.random() * 500); // çakışmayı azaltmak için rastgele-ish port
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
};

// vite.config.js içindeki apiDevPlugin ile aynı mantık: /api/<name> isteğini
// api/<name>.js modülüne yönlendirip Vercel-benzeri (req,res) handler'ı çalıştırır.
// vite preview bu middleware'i içermediği için burada kendi basit static+api server'ımızı yazıyoruz.
async function handleApi(req, res) {
    try {
        const name = req.url.split('/api/')[1].split('?')[0];
        const mod = await import(`file://${join(rootDir, 'api', `${name}.js`)}?t=${Date.now()}`);
        const handler = mod.default;
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', async () => {
            try {
                if (chunks.length) {
                    try { req.body = JSON.parse(Buffer.concat(chunks).toString()); } catch (_) { req.body = undefined; }
                }
                const mockRes = {
                    _status: 200, _headers: {}, _body: '',
                    status(c) { this._status = c; return this; },
                    setHeader(k, v) { this._headers[k] = v; return this; },
                    json(d) { this._body = JSON.stringify(d); this._done = true; },
                    send(d) { this._body = d; this._done = true; },
                    end(d) { if (d) this._body = d; this._done = true; },
                };
                await handler(req, mockRes);
                res.writeHead(mockRes._status, { 'Content-Type': 'application/json', ...mockRes._headers });
                res.end(mockRes._body);
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

function serveStatic(req, res) {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';

    let filePath = join(distDir, decodeURIComponent(urlPath));

    // Dosya yoksa ve klasörse index.html dene (route klasörleri: dist/oran-analiz/index.html)
    try {
        const st = statSync(filePath);
        if (st.isDirectory()) filePath = join(filePath, 'index.html');
    } catch (_) {
        // Dosya da klasör de yoksa SPA fallback: kök index.html döndür
        if (!extname(urlPath)) {
            filePath = join(distDir, 'index.html');
        }
    }

    if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
    }

    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    createReadStream(filePath).pipe(res);
}

function startServer() {
    return new Promise((resolve, reject) => {
        const server = createServer((req, res) => {
            if (req.url.startsWith('/api/')) {
                handleApi(req, res);
            } else {
                serveStatic(req, res);
            }
        });
        server.on('error', reject);
        server.listen(PORT, '127.0.0.1', () => resolve(server));
    });
}

// Sayfanın gerçekten "hazır" olmasını bekler:
// 1) .auth-loading-screen DOM'dan kaybolana kadar bekle (App.jsx'te en fazla 3sn sonra
//    onAuthStateChanged sonucu ne olursa olsun loading=false oluyor, biz cömert davranıp
//    10sn'ye kadar bekliyoruz).
// 2) Ardından component'lerin kendi fetch'lerinin (örn. /api/bet365-backend) oturması için
//    kısa bir network-idle + ek bekleme uyguluyoruz.
async function waitForReady(page) {
    // Auth loading ekranı hiç çıkmamış olabilir (auth ekranına düşen route'larda olmayabilir)
    // bu yüzden hata fırlatmasını yok sayıyoruz.
    await page.waitForSelector('.auth-loading-screen', { state: 'detached', timeout: 10000 }).catch(() => {});

    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    // React state güncellemelerinin/re-render'ların oturması için küçük ek bekleme.
    await page.waitForTimeout(800);
}

async function prerenderRoute(browser, route) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await waitForReady(page);

        const rootHtml = await page.evaluate(() => {
            const el = document.getElementById('root');
            return el ? el.innerHTML : null;
        });

        if (!rootHtml || !rootHtml.trim()) {
            throw new Error('#root boş döndü');
        }

        return rootHtml;
    } finally {
        await page.close();
        await context.close();
    }
}

function injectRootHtml(route, rootHtml) {
    const routeDir = route === '/' ? distDir : join(distDir, route);
    const filePath = join(routeDir, 'index.html');

    if (!existsSync(filePath)) {
        throw new Error(`${filePath} bulunamadı (önce inject-seo-meta.mjs çalışmalı)`);
    }

    const html = readFileSync(filePath, 'utf8');
    const rootOpenRegex = /<div id="root"><\/div>/;

    if (!rootOpenRegex.test(html)) {
        throw new Error(`${filePath} içinde boş <div id="root"></div> bulunamadı (belki zaten dolu)`);
    }

    const newHtml = html.replace(rootOpenRegex, `<div id="root">${rootHtml}</div>`);
    writeFileSync(filePath, newHtml, 'utf8');
}

async function main() {
    if (!existsSync(join(distDir, 'index.html'))) {
        console.error('[prerender-routes] dist/index.html bulunamadı, önce build alınmalı. Atlanıyor.');
        return;
    }

    console.log(`[prerender-routes] Statik sunucu başlatılıyor: ${BASE_URL}`);
    const server = await startServer();

    const browser = await chromium.launch({ headless: true });

    let successCount = 0;
    let failCount = 0;
    const startedAt = Date.now();

    try {
        for (const route of PUBLIC_ROUTES) {
            const label = route === '/' ? '/ (ana sayfa)' : route;
            try {
                const rootHtml = await prerenderRoute(browser, route);
                injectRootHtml(route, rootHtml);
                console.log(`[prerender-routes] OK  ${label} (${rootHtml.length} karakter)`);
                successCount++;
            } catch (err) {
                console.warn(`[prerender-routes] ATLANDI  ${label}: ${err.message}`);
                failCount++;
            }
        }
    } finally {
        await browser.close();
        server.close();
    }

    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[prerender-routes] Tamamlandı: ${successCount} başarılı, ${failCount} atlandı. Süre: ${elapsedSec}s`);
}

main().catch(err => {
    // Prerender build'i asla kırmasın - hata olsa bile process 0 ile çıkar.
    console.error('[prerender-routes] Beklenmeyen hata, build kırılmıyor:', err);
});
