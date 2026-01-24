# ODDSY - Futbol Tahmin Platformu

Modern, güvenli ve performanslı futbol tahmin platformu.

## 🚀 Özellikler

### Güvenlik
- ✅ Input sanitization (XSS koruması)
- ✅ Rate limiting
- ✅ Email validation
- ✅ Secure authentication
- ✅ Error logging

### Performans
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Caching layer
- ✅ Memoization
- ✅ Bundle optimization

### Mimari
- ✅ Modüler yapı
- ✅ Global state management (Zustand)
- ✅ Custom hooks
- ✅ Reusable components
- ✅ Centralized constants

## 📦 Kurulum

```bash
npm install
```

## 🔧 Geliştirme

```bash
npm run dev
```

## 🏗️ Production Build

```bash
npm run build
```

## 📊 Build Analizi

```bash
npm run build:analyze
```

## 🔐 Ortam Değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın ve Firebase bilgilerinizi girin.

## 📁 Proje Yapısı

```
src/
├── components/      # Reusable components
├── pages/          # Page components
├── hooks/          # Custom hooks
├── store/          # Global state (Zustand)
├── utils/          # Utility functions
├── constants/      # App constants
└── styles/         # Global styles
```

## 🛡️ Güvenlik Özellikleri

- Input sanitization with DOMPurify
- Rate limiting (20 req/min)
- XSS protection
- CSRF protection
- Secure headers

## ⚡ Performans Optimizasyonları

- Code splitting by route
- Lazy loading components
- Image lazy loading
- Firebase data caching
- Memoized components
- Optimized bundle size

## 📝 Lisans

© 2025 ODDSY. Tüm hakları saklıdır.
