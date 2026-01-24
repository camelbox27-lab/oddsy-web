import ModalOverlay from './ModalOverlay';

const AboutModal = ({ onClose }) => {
    return (
        <ModalOverlay title="HAKKINDA" onClose={onClose}>
            <div className="space-y-6">
                <p className="text-lg">
                    <span className="text-yellow-400 font-bold">Oddsy</span>, <span className="text-yellow-400 font-bold">yapay zeka</span> destekli profesyonel bir futbol analiz platformudur. Amacımız, gelişmiş oran sistemlerini entegre ederek geçmiş maç verilerini, güncel oranları ve gelişmiş algoritmalarımızı kullanarak kullanıcılara en güvenilir maç içgörülerini sunmaktır.
                </p>
                <p>
                    Sistemimizde, dünya standartlarındaki açılış oranları ile maç öncesi analize yönelik tahminler yer almaktadır. Onlarca istatistik, oran trendi analizi ve <span className="text-yellow-400 font-bold">yapay zeka</span> modelleriyle, her maç için veriye dayalı, oran odaklı tahminler oluşturuyoruz.
                </p>
                <div className="bg-yellow-400/5 p-4 rounded-xl border border-yellow-400/20">
                    <p>
                        Kullanıcı dostu arayüzümüz ve gelişmiş filtreleme seçeneklerimizle, güncel oranlara göre analizleri kişiselleştirmenizi ve en iyi fırsatları tespit etmenizi sağlıyoruz. <span className="text-yellow-400 font-bold">Oddsy</span> ile sadece tahmin değil, oran analiziyle desteklenmiş akıllı kararlar alırsınız.
                    </p>
                </div>
            </div>
        </ModalOverlay>
    );
};

export default AboutModal;
