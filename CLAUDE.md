# TahminApp - Oran Analiz Uygulaması

## Proje Tanımı
Futbol maçları için oran analizi yapan Next.js tabanlı fullstack uygulama. Kullanıcı günlük bülten maçlarını filtreler, backend geçmiş maçlarla birebir eşleştirir, sonuçları gösterir.

## Teknoloji Stack
- **Framework:** Next.js 14+ (App Router)
- **Dil:** TypeScript (strict mode)
- **Stil:** Tailwind CSS
- **State:** React hooks
- **Veri:** JSON dosyaları (veritabanı yok)

## Veri Dosyaları
- **Frontend (günlük maçlar):** `oddsy-data/oran data/gunlukmaclar.json`
- **Backend (geçmiş maçlar):** `oddsy-data/oran data/iddaagecmis.json`
- Her iki JSON'un sütun yapısı aynı, backend dosyasında ek olarak sonuç bilgileri var
- JSON içeriğine müdahale etme, olduğu gibi oku ve kullan
- Dosya path'inde boşluk var ("oran data"), handle et

## Eşleştirme Mantığı
- Kullanıcı frontend'de gunlukmaclar.json üzerinde filtre yapar
- Filtrelenen kriterlere göre backend iddaagecmis.json'da birebir eşleşme aranır
- Tolerans YOK, oran değerleri birebir eşleşecek
- Çoklu filtre AND mantığıyla çalışır

## Tasarım
- Sitenin mevcut renk şemasını kullan
- Hardcode renk belirtme, site renklerine uy
- Mobil responsive
- Dark mode destekli

## Kod Kuralları
- Değişken adları İngilizce, yorumlar Türkçe
- `any` tipi yasak
- fs modülü sadece API route'larda
- Console.log bırakma

## Komutlar
```bash
npm run dev
npm run build
npm run lint
```
