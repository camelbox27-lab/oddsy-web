import ModalOverlay from './ModalOverlay';

const TermsOfService = ({ onClose }) => {
    return (
        <ModalOverlay title="KULLANICI SÖZLEŞMESİ" onClose={onClose}>
            <div className="p-8 text-gray-200 space-y-6">
                <p className="leading-relaxed">
                    Bu sözleşme, Wondiyo web sitesine üye olan kullanıcılar ("Kullanıcı") ile Wondiyo ("Şirket") arasında aşağıdaki şartlarda düzenlenmiştir. Web sitesine üye olarak veya hizmetleri kullanarak, bu sözleşmeyi okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
                </p>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">1. Taraflar</h2>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong className="text-white">Hizmet Sağlayıcı:</strong> Wondiyo</li>
                        <li><strong className="text-white">Kullanıcı:</strong> Üyelik formunu dolduran, hizmetlere erişen gerçek kişidir.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">2. Konu</h2>
                    <p className="leading-relaxed">
                        Bu sözleşme, Wondiyo tarafından sağlanan üyelik tabanlı istatistik ve analiz hizmetlerinin kullanım koşullarını, hak ve yükümlülükleri belirler.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">3. Hizmet İçeriği</h2>
                    <p className="leading-relaxed">
                        Wondiyo platformu, çeşitli futbol maçlarına ilişkin istatistiksel analizler ve geçmiş verilere dayalı algoritmik tahminler sunar. Wondiyo bahis oynatma hizmeti vermez. Sunulan içerikler yalnızca bilgilendirme ve analiz amaçlıdır.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">4. Üyelik Sistemi</h2>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Kullanıcı, üyelik oluştururken doğru ve eksiksiz bilgi vermekle yükümlüdür.</li>
                        <li>Kullanıcı hesabı kişiseldir, üçüncü kişilerle paylaşılamaz.</li>
                        <li>Abonelik hizmetleri yalnızca ödeme yapılması halinde aktiftir.</li>
                        <li>Kullanıcı, hesabının güvenliğinden bizzat sorumludur.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">5. Kullanım Koşulları</h2>
                    <p className="mb-2">Kullanıcı aşağıdakileri kabul eder:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Platformu yalnızca yasal amaçlarla kullanmayı,</li>
                        <li>Telif hakkı içeren içerikleri izinsiz çoğaltmamayı,</li>
                        <li>Platformun güvenliğini zedeleyici girişimlerde bulunmamayı.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">6. Ücretlendirme ve Fatura</h2>
                    <p className="leading-relaxed">
                        Wondiyo, belirli hizmetleri abonelik modeliyle sunar. Kullanıcı, ödeme altyapısı üzerinden aylık ödeme yaparak hizmetlere erişim kazanır. Yapılan ödemeler sonrası e-Arşiv fatura kesilir ve e-posta ile gönderilir.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">7. Fikri Mülkiyet</h2>
                    <p className="leading-relaxed">
                        Wondiyo'ye ait içerikler (veri, analiz, tasarım, kod) Şirket'e aittir. İzinsiz kopyalanamaz, paylaşılmaz.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">8. Sözleşmenin Feshi</h2>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Kullanıcı, dilediği zaman hesabını kapatabilir.</li>
                        <li>Şirket, kötüye kullanım veya ihlal tespitinde üyeliği askıya alabilir veya sona erdirebilir.</li>
                    </ul>
                </section>

                <section className="bg-yellow-400/10 p-6 rounded-lg border border-yellow-400">
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">9. Sorumluluk Reddi</h2>
                    <p className="leading-relaxed">
                        Wondiyo üzerinde sunulan analizler tavsiye niteliği taşır. Kullanıcının bu analizleri kullanması kendi inisiyatifindedir. Wondiyo hiçbir sonuç için garanti vermez.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">10. Uyuşmazlık Durumu</h2>
                    <p className="leading-relaxed">
                        Taraflar arasında doğabilecek uyuşmazlıklarda İstanbul Anadolu Adliyesi Mahkemeleri ve İcra Daireleri yetkilidir.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">11. Yürürlük</h2>
                    <p className="leading-relaxed">
                        Kullanıcı, bu sözleşmeyi onayladığı anda yürürlüğe girer. Wondiyo, sözleşmeyi önceden bildirmeksizin güncelleyebilir.
                    </p>
                </section>

                <section className="bg-green-900 p-6 rounded-lg border border-yellow-400">
                    <h2 className="text-xl font-bold text-yellow-400 mb-3">İletişim</h2>
                    <p className="leading-relaxed mb-2">
                        Sorularınız için bizimle iletişime geçebilirsiniz:
                    </p>
                    <p className="text-yellow-400 font-semibold">
                        <a href="mailto:wondiyodestek@gmail.com" className="hover:underline">
                            wondiyodestek@gmail.com
                        </a>
                    </p>
                </section>
            </div>
        </ModalOverlay>
    );
};

export default TermsOfService;
