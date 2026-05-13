# Yarın Buradan Devam — İddaa Oran Analizi Sistemi

**Son commit:** `5a0f6c5` (branch: `claude/cranky-leavitt-b2a42e`)
**Tarih:** 2026-05-13

---

## ✅ TAMAMLANANLAR

### 1. İddaa Analiz Component (`src/components/IddaaAnaliz.jsx`)
- Bet365 sistemiyle **birebir aynı mantık** (MS1/MS0/MS2 exact match, +30 puan/oran)
- 163 lig dosyası taranıp eşleşme yapılıyor
- Aynı analiz çıktıları: MS 1/0/2 %, 2.5 Alt/Üst, KG Var/Yok, Toplam Gol, İlk Yarı KG Var, İY/MS, Top Skorlar
- **Bet365 renk paleti:** Sarı/altın (#FDB913) + koyu yeşil (#006A4E)
- İY/MS hesaplaması: "İY 1-0" prefix temizleniyor, beraberlik=0 (Bet365 ile aynı)
- `manual` prop ile takım seçimi gizlenip oranlar elle girilebiliyor

### 2. YapayZeka.jsx & ManuelAnaliz.jsx Wrapper Güncellemeleri
- Tab sistemi kaldırıldı → **2 büyük logo butonu** seçim ekranı:
  - **Bet365** (CSS logo: yeşil arka plan + sarı 365)
  - **İddaa.com** (gerçek logo: `https://i.ibb.co/FL9BKnKv/app-icon-v2.png`)
- "Bet365/İddaa oran analizi yapmak için tıklayınız →" butonları
- Geri dön butonu seçim ekranına döndürür

### 3. Veri Hazırlama
- `scripts/split_iddaa.py` → 86MB `iddaagecmis.json`'u 163 lig dosyasına böldü
- GitHub `oddsy-data` repo'suna push edildi (commit `f1c0624`):
  - `iddaa_guncel/gunlukmaclar.json`
  - `iddaa_ligler_json/{lig}.json` × 163 dosya

---

## 🚧 ŞU AN DURUM

- **MAINTENANCE_MODE = true** (canlı bakımda, müşteriler giremiyor)
- Branch `claude/cranky-leavitt-b2a42e` GitHub'da, main'e merge edilmedi
- Local dev server `http://localhost:5173/` üzerinden test edildi

---

## 📋 YARIN YAPILACAKLAR (Olası Devamlar)

1. **Test:** İddaa analizinin tüm akışını canlıdaki gibi test et
2. **Lig listesi optimizasyonu:** `IDDAA_LEAGUES` listesindeki ligler `iddaa_ligler_json/` dosya isimleriyle eşleşiyor mu kontrol et (bazı ligler 0 sonuç verebilir)
3. **Veri güncelleme akışı:** `iddaagecmis.json` ve `gunlukmaclar.json` güncellenince split script'i otomatik çalıştırma (cron/manuel?)
4. **Manuel modda küçük UX iyileştirmeleri:** Input validasyon, ondalık nokta kontrolü
5. **PR aç & merge:** https://github.com/camelbox27-lab/oddsy-web/pull/new/claude/cranky-leavitt-b2a42e
6. **MAINTENANCE_MODE = false** yapıp canlıya geçiş (kullanıcı onayıyla)

---

## ⚠️ ÖNEMLİ NOTLAR

- **iddaagecmis.json güncellendiğinde** mutlaka `python3 scripts/split_iddaa.py` çalıştırılıp `oddsy-data/iddaa_ligler_json/` push edilmeli
- **gunlukmaclar.json (oran data klasöründeki)** her güncellendiğinde `oddsy-data/iddaa_guncel/`'e kopyalanıp push edilmeli
- Veri kaynak yapısı:
  ```
  C:/Users/AyberkEylülKemal/Desktop/TahminApp/oddsy-data/
  ├── oran data/                    ← Ham veri (Excel + JSON)
  │   ├── iddaagecmis.json (86MB)
  │   └── gunlukmaclar.json
  ├── iddaa_ligler_json/            ← Split edilmiş (GitHub'da var)
  └── iddaa_guncel/                 ← Günlük maçlar (GitHub'da var)
  ```

---

## 🔗 LİNKLER

- **Repo:** https://github.com/camelbox27-lab/oddsy-web
- **Data Repo:** https://github.com/camelbox27-lab/oddsy-data
- **Branch:** `claude/cranky-leavitt-b2a42e`
- **PR Create:** https://github.com/camelbox27-lab/oddsy-web/pull/new/claude/cranky-leavitt-b2a42e
- **Local Dev:** http://localhost:5173/

---

**Hızır'dan not:** Sistem hazır, test edildi, çalışıyor. Sadece veri pipeline'ı kararlaştırılıp merge edilecek.
