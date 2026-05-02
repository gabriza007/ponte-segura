import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogIn, User } from 'lucide-react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Logo from '../../components/Logo';

export default function PoliceLogin() {
  const [credentials, setCredentials] = useState({ credencial: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = `${credentials.credencial}@policia.com`;
      await signInWithEmailAndPassword(auth, email, credentials.senha);
      navigate('/painel/radar');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Por favor, ative o provedor "E-mail/Senha" no console do Firebase Authentication.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Credencial ou senha inválidos.');
      } else {
        setError('Credencial ou senha inválida.');
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
        <p className="text-muted">Acesso Restrito - Guarda Municipal</p>
      </div>
      <div className="glass-panel-heavy form-card">
        {error && <div className="text-danger mb-4 text-center text-sm">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
             <label><LogIn size={14} className="inline mr-1"/> Credencial</label>
             <input type="text" required className="glass-input" placeholder="Ex: GM-12345" value={credentials.credencial} onChange={e => setCredentials({...credentials, credencial: e.target.value})} />
          </div>
          <div className="form-group">
             <label><LogIn size={14} className="inline mr-1"/> Senha</label>
             <input type="password" required className="glass-input" placeholder="Sua senha" value={credentials.senha} onChange={e => setCredentials({...credentials, senha: e.target.value})} />
          </div>
          <button type="submit" className="glass-button mt-4" disabled={loading}>
            {loading ? 'Entrando...' : 'Acessar Radar'}
          </button>
          
          <div className="flex flex-col items-center gap-4 mt-6 pt-6 border-t border-white/10">
            <Link to="/painel/register" className="text-primary hover:text-white transition-colors text-sm font-medium" style={{ textDecoration: 'none' }}>Cadastrar novo Policial</Link>
            <Link to="/" className="text-muted hover:text-white transition-colors text-xs flex items-center gap-1" style={{ textDecoration: 'none' }}><User size={12}/> Voltar para App do Estudante</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
