// Maç sayfalarının veri katmanı: arşivi indirir, maçları tekilleştirir,
// slug ve oran hareketi gibi türetilmiş alanları hesaplar.

// Arşivin okunacağı dal; test için VERI_DALI ile değiştirilebilir
const DAL = process.env.VERI_DALI || 'main';
const RAW = `https://raw.githubusercontent.com/camelbox27-lab/oddsy-data/${DAL}`;
export const ARSIV_INDEKS = `${RAW}/bet365/arsiv/index.json`;
export const ARSIV_GUN = (gun) => `${RAW}/bet365/arsiv/${gun}.json`;

// Kaç günlük arşiv sayfaya dönüştürülsün (derleme süresini sınırlar)
export const GUN_LIMITI = Number(process.env.MAC_SAYFA_GUN_LIMITI || 400);

// Türkçe harfler + takım adlarında sık geçen, NFD ile ayrışmayan Avrupa harfleri
const HARF = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
    ø: 'o', Ø: 'o', æ: 'ae', Æ: 'ae', å: 'a', Å: 'a', ß: 'ss', đ: 'd', Đ: 'd', ð: 'd', Ð: 'd',
    ł: 'l', Ł: 'l', þ: 'th', Þ: 'th', œ: 'oe', Œ: 'oe',
};

export const slugla = (metin = '') =>
    metin
        .replace(/[çÇğĞıİöÖşŞüÜøØæÆåÅßđĐðÐłŁþÞœŒ]/g, (h) => HARF[h])
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Tarih alanı milisaniye epoch; gün ve saat Türkiye saatine göre gösterilir
const TR_TARIH = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric',
});
const TR_SAAT = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit',
});
const TR_UZUN = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
});

export const tarihParcalari = (ms) => {
    const d = new Date(ms);
    const kisa = TR_TARIH.format(d);               // 26.10.2026
    return {
        kisa,
        slugTarih: kisa.replace(/\./g, '-'),       // 26-10-2026
        saat: TR_SAAT.format(d),
        uzun: TR_UZUN.format(d),
        iso: d.toISOString(),
    };
};

// Kaç alanı dolu — aynı maçın iki anlık görüntüsünden zengin olanı seçmek için
const doluSayisi = (mac) => Object.values(mac).filter((v) => v !== null && v !== '' && v !== undefined).length;

export const maclariTekille = (gunler) => {
    const harita = new Map();
    for (const { gun, maclar } of gunler) {
        for (const mac of maclar) {
            const anahtar = mac.MatchCode || `${mac.Ev}|${mac.Dep}|${mac.Tarih}`;
            const mevcut = harita.get(anahtar);
            if (!mevcut) {
                harita.set(anahtar, { ...mac, _gun: gun });
                continue;
            }
            // Bitmiş kayıt skor taşır, her zaman tercih edilir; sonra daha dolu olan
            const yeniDahaIyi = (mac.BitmisMac && !mevcut.BitmisMac)
                || (Boolean(mac.BitmisMac) === Boolean(mevcut.BitmisMac) && doluSayisi(mac) >= doluSayisi(mevcut));
            if (yeniDahaIyi) harita.set(anahtar, { ...mac, _gun: gun });
        }
    }
    return [...harita.values()];
};

// Oranı olan maç sayfası anlamlı; boş kayıtlar indekslenmez
export const yeterliVeriVar = (mac) =>
    Boolean(mac.Ev && mac.Dep && mac.Tarih)
    && ['MS1 A', 'MS1 K', 'MS2 A', 'MS2 K'].some((k) => typeof mac[k] === 'number');

export const macSlug = (mac) => {
    const { slugTarih } = tarihParcalari(mac.Tarih);
    return `${slugla(mac.Ev)}-${slugla(mac.Dep)}-${slugTarih}`;
};

// Açılış -> kapanış hareketini insan diline çevirir
export const oranHareketi = (mac) => {
    const satirlar = [];
    for (const [etiket, kod] of [['Ev sahibi galibiyeti', 'MS1'], ['Beraberlik', 'MS0'], ['Deplasman galibiyeti', 'MS2']]) {
        const acilis = mac[`${kod} A`];
        const kapanis = mac[`${kod} K`];
        if (typeof acilis !== 'number' || typeof kapanis !== 'number' || !acilis) continue;
        const yuzde = ((kapanis - acilis) / acilis) * 100;
        satirlar.push({ etiket, kod, acilis, kapanis, yuzde });
    }
    if (!satirlar.length) return null;
    const enSert = satirlar.reduce((a, b) => (Math.abs(b.yuzde) > Math.abs(a.yuzde) ? b : a));
    return { satirlar, enSert };
};

export const hareketCumlesi = (mac) => {
    const h = oranHareketi(mac);
    if (!h || Math.abs(h.enSert.yuzde) < 3) {
        return 'Açılıştan kapanışa oranlarda kayda değer bir hareket olmadı; piyasa beklentisi sabit kaldı.';
    }
    const { etiket, acilis, kapanis, yuzde } = h.enSert;
    const yon = yuzde < 0 ? 'düştü' : 'yükseldi';
    const anlam = yuzde < 0
        ? 'Oranın düşmesi, bu sonuca gelen para miktarının arttığını gösterir.'
        : 'Oranın yükselmesi, bu sonuca olan beklentinin zayıfladığını gösterir.';
    return `${etiket} oranı ${acilis.toFixed(2)}'den ${kapanis.toFixed(2)}'e ${yon} (%${Math.abs(yuzde).toFixed(0)}). ${anlam}`;
};

// Sayfada gösterilecek market grupları
export const MARKET_GRUPLARI = [
    { baslik: 'Maç Sonucu', kodlar: [['MS1', '1'], ['MS0', 'X'], ['MS2', '2']] },
    { baslik: 'İlk Yarı Sonucu', kodlar: [['IY1', '1'], ['IY0', 'X'], ['IY2', '2']] },
    { baslik: 'İkinci Yarı Sonucu', kodlar: [['IIY1', '1'], ['IIY0', 'X'], ['IIY2', '2']] },
    { baslik: 'Çifte Şans', kodlar: [['CS10', '1-X'], ['CS12', '1-2'], ['CS02', 'X-2']] },
    { baslik: 'Karşılıklı Gol', kodlar: [['KGVAR', 'Var'], ['KGYOK', 'Yok']] },
    {
        baslik: 'Toplam Gol Alt / Üst',
        kodlar: [['ALT15', '1.5 Alt'], ['UST15', '1.5 Üst'], ['ALT25', '2.5 Alt'], ['UST25', '2.5 Üst'],
                 ['ALT35', '3.5 Alt'], ['UST35', '3.5 Üst'], ['ALT45', '4.5 Alt'], ['UST45', '4.5 Üst']],
    },
    {
        baslik: 'İlk Yarı Alt / Üst',
        kodlar: [['IYALT05', '0.5 Alt'], ['IYUST05', '0.5 Üst'], ['IYALT15', '1.5 Alt'], ['IYUST15', '1.5 Üst'],
                 ['IYALT25', '2.5 Alt'], ['IYUST25', '2.5 Üst']],
    },
    {
        baslik: 'İlk Yarı / Maç Sonu',
        kodlar: [['IYMS 1E1', '1/1'], ['IYMS 1E0', '1/X'], ['IYMS 1E2', '1/2'],
                 ['IYMS 0E1', 'X/1'], ['IYMS 0E0', 'X/X'], ['IYMS 0E2', 'X/2'],
                 ['IYMS 2E1', '2/1'], ['IYMS 2E0', '2/X'], ['IYMS 2E2', '2/2']],
    },
];
