import { useState } from 'react';
import ModalOverlay from './ModalOverlay';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-yellow-400/20 rounded-xl overflow-hidden mb-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#004d40] hover:bg-[#00695c] transition-colors text-left"
            >
                <span className="font-semibold text-white">{question}</span>
                <span className={`text-yellow-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="p-4 bg-[#002b1d] text-gray-300 text-sm border-t border-yellow-400/10">
                    {answer}
                </div>
            )}
        </div>
    );
};

const FAQ = ({ onClose }) => {
    const questions = [
        { q: "Oddsy nedir?", a: "Oddsy, yapay zeka ve istatistiksel verileri kullanarak futbol maçları için analizler sunan profesyonel bir platformdur." },
        { q: "Uygulama ücretli mi?", a: "Oddsy tamamen ücretsizdir. Tüm analizlerimizden ücretsiz olarak faydalanabilirsiniz." },
        { q: "Tahminler ne kadar güvenilir?", a: "Tahminlerimiz gelişmiş AI modelleri ve geçmiş verilerle oluşturulur ancak %100 kesinlik garantisi vermez." },
        { q: "Bahis oynayabilir miyim?", a: "Hayır. Oddsy sadece analiz ve tahmin platformudur. Üzerinden bahis oynatılmaz." },
        { q: "Hangi ligleri kapsıyor?", a: "Premier Lig, La Liga, Bundesliga, Serie A, Süper Lig ve daha birçok popüler ligi kapsıyoruz." },
        { q: "Verilerim güvende mi?", a: "Evet, kişisel verileriniz KVKK standartlarına uygun olarak korunmaktadır." },
        { q: "Hesabımı nasıl silebilirim?", a: "Hesap ayarları bölümünden veya destek ekibimizle iletişime geçerek hesabınızı silebilirsiniz." },
        { q: "İletişim kanalları nelerdir?", a: "Bize her zaman Oddsydestek@gmail.com adresinden ulaşabilirsiniz." }
    ];

    return (
        <ModalOverlay title="SIKÇA SORULAN SORULAR" onClose={onClose}>
            <div>
                {questions.map((item, idx) => (
                    <FAQItem key={idx} question={item.q} answer={item.a} />
                ))}
            </div>
        </ModalOverlay>
    );
};

export default FAQ;
