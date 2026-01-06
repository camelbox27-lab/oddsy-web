import ModalOverlay from './ModalOverlay';

const PrivacyPolicy = ({ onClose }) => {
  return (
    <ModalOverlay title="KİŞİSEL VERİLERİN KORUNMASI" onClose={onClose}>
      <div className="p-8 text-gray-200 space-y-6">
        <p className="leading-relaxed">
          Oddsy olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, kullanıcılarımızın kişisel verilerine büyük önem veriyoruz. Bu nedenle, kişisel verilerinizin işlenmesi, saklanması ve paylaşılması ile ilgili olarak sizi bilgilendirmek istiyoruz.
        </p>

        <section>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">1. Veri Sorumlusu</h2>
          <p className="leading-relaxed">
            Kişisel verileriniz, veri sorumlusu sıfatıyla Oddsy tarafından aşağıda belirtilen kapsamda işlenmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">2. Hangi Verileri Topluyoruz?</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Ad ve soyad</li>
            <li>E-posta adresi</li>
            <li>Şifre (hashlenmiş şekilde)</li>
            <li>Kullanıcı davranışı ve site içi tercih bilgileri</li>
            <li>IP adresi, tarayıcı ve cihaz bilgileri (loglama amaçlı)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">3. Verilerin İşlenme Amaçları</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Üyelik işlemlerinin gerçekleştirilmesi</li>
            <li>Oddsy platformunun çalışmasının sağlanması</li>
            <li>Üyelik bazlı hizmetlerin sunulması</li>
            <li>Kullanıcı taleplerinin karşılanması ve destek süreçleri</li>
            <li>İstatistiksel analiz ve geliştirme faaliyetleri</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">4. Hukuki Sebepler</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (KVKK m.5/2-c)</li>
            <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (KVKK m.5/2-ç)</li>
            <li>İlgili kişinin açık rızası alınarak (KVKK m.5/1)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">5. Verilerin Aktarılması</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Yasal yükümlülükler çerçevesinde yetkili kamu kurumlarına</li>
            <li>Ödeme ve faturalandırma hizmeti alınan üçüncü taraflara</li>
            <li>Teknik altyapı sağlayıcılarına (örneğin veritabanı sunucuları, hosting hizmetleri)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">6. Saklama Süresi</h2>
          <p className="leading-relaxed">
            Kişisel verileriniz, yukarıda belirtilen amaçların gerektirdiği süre boyunca saklanacak, bu sürenin sonunda silinecek veya anonim hale getirilecektir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">7. KVKK Kapsamındaki Haklarınız</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>Amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>Bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Kanuna aykırı işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
          </ul>
        </section>

        <section className="bg-green-900 p-6 rounded-lg border border-yellow-400">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">8. İletişim</h2>
          <p className="leading-relaxed mb-2">
            Bu haklarınızı kullanmak için bizimle aşağıdaki adres üzerinden iletişime geçebilirsiniz:
          </p>
          <p className="text-yellow-400 font-semibold">
            <a href="mailto:Oddsydestek@gmail.com" className="hover:underline">
              Oddsydestek@gmail.com
            </a>
          </p>
        </section>
      </div>
    </ModalOverlay>
  );
};

export default PrivacyPolicy;
