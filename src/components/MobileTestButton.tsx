import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Smartphone, X } from 'lucide-react';

export default function MobileTestButton() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUrl = window.location.origin;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-primary text-white p-3 rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.5)] hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center gap-2"
        title="Testar no Celular"
      >
        <Smartphone size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 max-w-sm w-full relative transform animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-3">
                <Smartphone size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Testar no Celular</h2>
              <p className="text-sm text-slate-400 mt-2">Aponte a câmera do seu celular para o QR Code abaixo para abrir o aplicativo no dispositivo móvel e testar o envio de localização.</p>
            </div>

            <div className="bg-white p-4 rounded-xl flex justify-center mb-6">
              <QRCode value={currentUrl} size={200} />
            </div>
            
            <div className="text-center">
              <p className="text-xs text-slate-500">Ou acesse diretamente:</p>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all block mt-1">
                {currentUrl}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
