import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, BadgePlus, LogIn } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Logo from '../../components/Logo';

export default function PoliceRegister() {
  const [police, setPolice] = useState({ credencial: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = `${police.credencial}@policia.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, police.senha);
      const uid = userCredential.user.uid;
      
      try {
        await setDoc(doc(db, 'policiais', uid), {
          credencial: police.credencial
        });
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.CREATE, `policiais/${uid}`);
      }
      navigate('/painel/radar');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Por favor, ative o provedor "E-mail/Senha" no console do Firebase Authentication.');
      } else {
        setError(err.message || 'Erro ao registrar policial.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container fade-in">
      <div className="header mb-8 flex flex-col items-center">
        <Logo size={42} className="mb-2 text-danger" />
        <p className="text-muted">Cadastro de Policial</p>
      </div>
      <div className="glass-panel-heavy form-card">
        {error && <div className="text-danger mb-4 text-center text-sm">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label><BadgePlus size={14} className="inline mr-1"/> Credencial / Número de Identificação</label>
            <input type="text" required className="glass-input" placeholder="Ex: GM-12345" value={police.credencial} onChange={e => setPolice({...police, credencial: e.target.value})} />
          </div>
          <div className="form-group">
            <label><LogIn size={14} className="inline mr-1"/> Senha de Acesso</label>
            <input type="password" required className="glass-input" placeholder="Sua senha" value={police.senha} onChange={e => setPolice({...police, senha: e.target.value})} />
          </div>
          <button type="submit" className="glass-button mt-4" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Criar Acesso Policial'}
          </button>
          
          <div className="flex flex-col items-center gap-4 mt-6 pt-6 border-t border-white/10">
            <Link to="/painel/login" className="text-primary hover:text-white transition-colors text-sm font-medium" style={{ textDecoration: 'none' }}>Já tem conta? Entrar na Central</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
