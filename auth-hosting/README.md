# auth-hosting — Firebase kimlik doğrulama alt alan adı

Bu klasör **siteyi yayınlamaz**. Sadece `auth.wondiyo.com.tr` alt alan adının
Firebase Hosting üzerinde var olabilmesi için gerekli boş bir kabuktur.

## Neden gerekli

Firebase, Google ile giriş akışını `<proje-id>.firebaseapp.com/__/auth/handler`
adresi üzerinden yürütür. Bu yüzden kullanıcı giriş yaparken `oddsy-778d7.firebaseapp.com`
adresini görür. Bunu kendi alan adımızla değiştirmek için `/__/auth/*` yolunu
sunan bir Firebase Hosting sitesi gerekir — Firebase bu `/__/` yolunu projedeki
her Hosting sitesinde otomatik olarak sunar, ekstra ayar istemez.

Ana site Vercel'de yayında. Bu yüzden Hosting'i ana site için değil, **sadece
auth için ayrı bir site** olarak kullanıyoruz; Vercel'deki yayına hiç dokunmaz.

Buradaki `index.html` ve `404.html`, alt alan adını doğrudan ziyaret eden olursa
ana siteye yönlendirir. Başka bir işlevi yoktur.

> `firebase.json` içinde bilerek **rewrite tanımlı değil**. Bir catch-all rewrite
> eklenirse `/__/auth/handler` yolunu gölgeleyip Google girişini bozma riski olur.

## Kurulum (tek seferlik)

1. **Firebase Console → Hosting → "Add another site"**
   Site ID: `wondiyo-auth`
   (Başka bir ID seçersen `firebase.json` içindeki `"site"` değerini de güncelle.)

2. **Bu siteyi deploy et**
   ```bash
   firebase deploy --only hosting:wondiyo-auth
   ```

3. **Hosting → wondiyo-auth → "Add custom domain"**
   `auth.wondiyo.com.tr` ekle ve Firebase'in verdiği DNS kayıtlarını alan adı
   sağlayıcına gir. SSL sertifikası hazır olana kadar bekle.

4. **Authentication → Settings → Authorized domains**
   `auth.wondiyo.com.tr` ekle.

5. **Google Cloud Console → APIs & Services → Credentials**
   Web OAuth 2.0 Client → Authorized redirect URIs'e ekle:
   `https://auth.wondiyo.com.tr/__/auth/handler`

6. **Vercel → Settings → Environment Variables**
   `VITE_FIREBASE_AUTH_DOMAIN` = `auth.wondiyo.com.tr`
   Kaydet ve projeyi **redeploy et** (bu değişken build sırasında gömülür,
   redeploy olmadan etkisi görünmez).

7. Gizli sekmede Google ile giriş yapıp dene. Açılan pencerede artık
   `oddsy-778d7.firebaseapp.com` değil `auth.wondiyo.com.tr` görünmeli.

## Geri alma

Bir sorun çıkarsa Vercel'de `VITE_FIREBASE_AUTH_DOMAIN` değerini
`oddsy-778d7.firebaseapp.com` yapıp redeploy etmek yeterli; giriş anında
eski haline döner. Diğer adımların hiçbiri geri alınmak zorunda değil.

## Not

Onay ekranındaki **uygulama adı** bu ayardan bağımsızdır. Onu değiştirmek için:
Google Cloud Console → APIs & Services → **OAuth consent screen** → App name.
