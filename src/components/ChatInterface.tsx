import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

interface Mensagem {
  id: string;
  texto: string;
  remetenteId: string;
  remetenteRole: 'estudante' | 'guarda';
  data_hora: number;
}

interface ChatInterfaceProps {
  alertaId: string;
  isEstudante: boolean;
  onClose?: () => void;
}

export default function ChatInterface({ alertaId, isEstudante, onClose }: ChatInterfaceProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novoTexto, setNovoTexto] = useState('');
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!alertaId) return;

    const q = query(
      collection(db, `alertasos/${alertaId}/mensagens`),
      orderBy('data_hora', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Mensagem[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Mensagem);
      });
      setMensagens(msgs);
      setTimeout(() => {
        mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `alertasos/${alertaId}/mensagens`);
    });

    return () => unsubscribe();
  }, [alertaId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTexto.trim() || !auth.currentUser) return;

    const texto = novoTexto.trim();
    setNovoTexto('');

    try {
      await addDoc(collection(db, `alertasos/${alertaId}/mensagens`), {
        texto,
        remetenteId: auth.currentUser.uid,
        remetenteRole: isEstudante ? 'estudante' : 'guarda',
        data_hora: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `alertasos/${alertaId}/mensagens`);
      setNovoTexto(texto); // restore text on failure
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/10 shadow-2xl relative">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary" size={20} />
          <h3 className="font-bold text-white text-lg">Mensagens</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 -m-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {mensagens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 h-full">
            <MessageSquare size={32} className="opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-center px-4">Envie uma mensagem para iniciar a comunicação.</p>
          </div>
        ) : (
          mensagens.map((msg) => {
            const isMine = msg.remetenteId === auth.currentUser?.uid;
            
            return (
              <div 
                key={msg.id} 
                className={`flex max-w-[85%] ${isMine ? 'self-end bg-primary/20 text-white rounded-l-xl rounded-tr-xl border border-primary/30' : 'self-start bg-white/10 text-slate-200 rounded-r-xl rounded-tl-xl border border-white/5'}`}
              >
                <div className="px-4 py-2.5">
                  <p className="text-[0.95rem] whitespace-pre-wrap leading-relaxed">{msg.texto}</p>
                  <p className="text-[0.65rem] opacity-60 mt-1 text-right">
                    {new Date(msg.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={mensagensEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={novoTexto}
            onChange={(e) => setNovoTexto(e.target.value)}
            placeholder="Digite algo..."
            className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-primary/50 focus:bg-white/10 transition-colors"
          />
          <button
            type="submit"
            disabled={!novoTexto.trim()}
            className="bg-primary hover:bg-primary-hover text-white p-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
