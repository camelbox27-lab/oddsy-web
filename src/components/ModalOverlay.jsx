
const ModalOverlay = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#002b1d] border border-yellow-400 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(255,215,0,0.2)]">
            <div className="flex items-center justify-between p-6 border-b border-yellow-400/30 bg-[#004d40]">
                <h3 className="text-xl font-bold text-yellow-400 tracking-wider">{title}</h3>
                <button onClick={onClose} className="text-yellow-400 hover:text-white transition-colors text-2xl">
                    &#x2715;
                </button>
            </div>
            <div className="p-8 overflow-y-auto text-gray-200 space-y-4 font-light leading-relaxed custom-scrollbar">
                {children}
            </div>
            <div className="p-6 border-t border-yellow-400/30 bg-[#002b1d] flex justify-end">
                <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all font-bold"
                >
                    Kapat
                </button>
            </div>
        </div>
    </div>
);

export default ModalOverlay;
