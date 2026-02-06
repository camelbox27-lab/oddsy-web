# Production Deployment Checklist

## Yapılan İyileştirmeler (06.02.2026)

### ✅ Güvenlik İyileştirmeleri
- [x] Admin panel categoryKey type mismatch düzeltildi (string → number)
- [x] API CORS wildcard (*) kaldırıldı, spesifik domainler eklendi
- [x] Database şifresi environment variable'a taşındı
- [x] API input validation eklendi (Pydantic Field constraints)
- [x] Vercel security headers zaten mevcut

### ✅ Performans İyileştirmeleri
- [x] Vite code splitting yapılandırılmış
- [x] Cache stratejisi mevcut (LRU cache, TTL)
- [x] Lazy loading mevcut (React.lazy, LazyLoadImage)
- [x] Firebase listener registry mevcut (memory leak önleme)

### 📋 Canlıya Almadan Önce Yapılacaklar

#### 1. Vercel Environment Variables Ayarla
Vercel dashboard → Settings → Environment Variables:

```
# API için
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.fpvazvcetymcoszuhptw.supabase.co:5432/postgres
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://yourdomain.vercel.app
```

#### 2. Firebase Console Ayarları
- **API Key Restrictions**:
  - Firebase Console → Project Settings → Web API Key
  - HTTP referrers ekle: `yourdomain.com/*`, `*.vercel.app/*`

- **Firestore Rules**: Zaten yapılandırılmış ✓

#### 3. Custom Domain Bağlama
```bash
# Vercel CLI ile
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com
```

DNS Ayarları:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 4. Production Build Test
```bash
cd web-version
npm run build
npm run preview
```

Kontrol edilecekler:
- [ ] Admin panelinden maç ekle → menülerde görünüyor mu?
- [ ] Tüm kategoriler çalışıyor mu?
- [ ] Firebase auth çalışıyor mu?
- [ ] API çağrıları çalışıyor mu?

#### 5. Performance Monitoring
```javascript
// Sentry zaten yapılandırılmış
// web-version/src/main.jsx içinde
```

#### 6. Rate Limiting (Opsiyonel ama Önerilir)
```bash
# API için slowapi ekle
pip install slowapi
```

```python
# api/index.py'ye ekle
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/filtrele")
@limiter.limit("100/minute")  # 100 request/dakika
def filtrele(req: FiltreRequest):
    ...
```

## Scalability (500-1000 Kullanıcı)

### Firebase Limits (Spark/Free Plan)
- ❌ **50K reads/day** - YETERSİZ (1000 kullanıcı x 100 okuma = 100K/gün)
- ❌ **20K writes/day** - YETERSİZ (admin panel + user actions)

### ⚠️ Firebase Blaze Plan'e Geçilmeli
- **Reads**: $0.06 / 100K
- **Writes**: $0.18 / 100K
- **Storage**: $0.18 / GB
- **Egress**: $0.12 / GB

**Tahmini Maliyet** (1000 aktif kullanıcı/gün):
- Reads: 100K/gün x 30 = 3M/ay → ~$1.80
- Writes: 10K/gün x 30 = 300K/ay → ~$0.54
- **Toplam**: ~$5-10/ay

### Vercel Limits
- **Hobby Plan**: 100 GB bandwidth/ay - YETERLİ
- **Serverless Functions**: 100 GB-Hours/ay - YETERLİ

## Deployment

### Otomatik Deployment
```bash
# Git push ile otomatik deploy
git add .
git commit -m "Production ready: security + performance improvements"
git push origin main
```

Vercel otomatik deploy edecek.

### Manuel Deployment
```bash
cd web-version
vercel --prod
```

## Post-Deployment Monitoring

### 1. Analytics
- Firebase Analytics (zaten aktif)
- Vercel Analytics (enable et)

### 2. Error Tracking
- Sentry (zaten yapılandırılmış)

### 3. Performance
```bash
# Lighthouse audit
npx lighthouse https://yourdomain.com
```

Hedefler:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

## Backup Strategy

### Git
- [x] 06022026 yedek commit yapıldı
- [ ] Her major değişiklik öncesi yedek branch oluştur

### Database
```bash
# Supabase otomatik backup yapıyor
# Manuel backup:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Support & Maintenance

### Daily Checks
- [ ] Firebase quota kullanımı
- [ ] Vercel bandwidth kullanımı
- [ ] Sentry error reports

### Weekly Checks
- [ ] User feedback
- [ ] Performance metrics
- [ ] Security updates

### Monthly Checks
- [ ] Dependency updates: `npm audit`
- [ ] Firebase rules review
- [ ] Backup test

## Emergency Rollback
```bash
# En son working commit'e dön
git revert HEAD
git push origin main

# Veya önceki commit'e reset
git reset --hard 96d8a54  # 06022026 yedek commit
git push --force origin main
```

## Contact & Issues
- Firebase Issues: [Firebase Console](https://console.firebase.google.com)
- Vercel Issues: [Vercel Dashboard](https://vercel.com/dashboard)
- Code Issues: GitHub Issues

---

**Son Güncelleme**: 06.02.2026
**Status**: ✅ Production Ready (Firebase Blaze plan gerekli)
