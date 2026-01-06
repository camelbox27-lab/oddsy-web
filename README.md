# Oddsy Web Version - Firebase Authentication Setup

## ✅ Tamamlanan Değişiklikler

### 1. UI/UX Güncellemeleri
- ✅ Bottom navigation kaldırıldı
- ✅ Ana sayfaya Tahmira.com tarzında kategori kartları eklendi (9 kategori, grid düzeninde)
- ✅ Tüm "Tahmira" referansları "Oddsy" olarak güncellendi
- ✅ Responsive tasarım iyileştirildi

### 2. Firebase Entegrasyonu
- ✅ `.env` dosyası oluşturuldu ve Firebase credentials eklendi
- ✅ Firebase config environment variables'dan okunuyor
- ✅ Mobil uygulama ile aynı Firebase projesi kullanılıyor (oddsy-778d7)

## 🔐 Firebase Credentials

`.env` dosyası aşağıdaki bilgileri içeriyor:
- Project ID: `oddsy-778d7`
- Auth Domain: `oddsy-778d7.firebaseapp.com`
- Storage Bucket: `oddsy-778d7.firebasestorage.app`

## 🚀 Çalıştırma

```bash
cd web-version
npm run dev -- --port 5000
```

Tarayıcıda: http://localhost:5000

## 📝 Giriş Yapma

Firebase Authentication kullanarak giriş yapabilirsiniz:

1. Sağ üstteki "Giriş Yap" butonuna tıklayın
2. Firebase'de kayıtlı e-posta ve şifrenizi girin
3. "GİRİŞ YAP" butonuna tıklayın

**Not:** Firebase Console'da kayıtlı bir kullanıcı hesabınız olmalıdır.

## 🔧 Firebase Console

Admin olarak giriş yapmak için:
1. Firebase Console'a gidin: https://console.firebase.google.com
2. `oddsy-778d7` projesini seçin
3. Authentication > Users bölümünden kullanıcıları yönetin
4. Firestore Database > users koleksiyonundan kullanıcı rollerini düzenleyin (isAdmin: true)

## 📂 Proje Yapısı

```
web-version/
├── .env                 # Firebase credentials (gitignore'da)
├── .env.example         # Template dosyası
├── src/
│   ├── App.jsx         # Ana uygulama (Firebase entegrasyonu dahil)
│   └── main.jsx        # Entry point
├── index.html
└── package.json
```

## 🎨 Ana Sayfa Özellikleri

1. **Hero Section**: Merkezi başlık ve CTA butonları
2. **Kategori Kartları**: 9 tahmin kategorisi (grid düzeninde)
3. **Özellikler**: 3 özellik kartı (Gerçek Veriler, Yapay Zeka, Kullanıcı Dostu)
4. **Analiz Bölümü**: Günün analizi
5. **Footer**: 4 kolonlu footer (Oddsy, Bağlantılar, Destek, İletişim)

## 🔒 Güvenlik

- `.env` dosyası `.gitignore`'da - asla commit edilmemeli
- Firebase credentials production'da environment variables olarak saklanmalı
- Firestore rules düzgün yapılandırılmış olmalı
