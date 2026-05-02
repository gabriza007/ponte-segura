import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, LogIn, User } from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Logo from '../../components/Logo';

export default function StudentLogin() {
  const [credentials, setCredentials] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signInWithEmailAndPassword(auth, credentials.email, credentials.senha);
      
      if (!res.user.emailVerified) {
        await signOut(auth);
        throw new Error('UNVERIFIED_EMAIL');
      }

      const userDoc = await getDocFromServer(doc(db, 'estudantes', res.user.uid));
      if (!userDoc.exists()) throw new Error('ESTUDANTE_NAO_ENCONTRADO');
      
      const studentData = userDoc.data();
      navigate('/app', { state: { student: { ...studentData, id: res.user.uid } } });
    } catch (err: any) {
      if (err.message === 'UNVERIFIED_EMAIL') {
        setError('Por favor, verifique seu e-mail antes de fazer login.');
      } else if (err.message === 'ESTUDANTE_NAO_ENCONTRADO') {
        setError('Ocorreu um erro: registro de estudante não encontrado.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Por favor, ative o provedor "E-mail/Senha" no console do Firebase Authentication.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Credenciais inválidas ou erro de conexão.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container fade-in flex items-center justify-center pt-8">
      <div className="w-full">
        <div className="header mb-8 flex flex-col items-center">
          <Logo size={42} className="mb-2" />
          <p className="text-muted">Login do Estudante</p>
        </div>
        <div className="glass-panel-heavy form-card">
          {error && <div className="text-danger mb-4 text-center text-sm">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label><Mail size={14} className="inline mr-1"/> E-mail Acadêmico ou Pessoal</label>
              <input type="email" required className="glass-input" placeholder="Seu e-mail" value={credentials.email} onChange={e => setCredentials({...credentials, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label><LogIn size={14} className="inline mr-1"/> Senha</label>
              <input type="password" required className="glass-input" placeholder="Sua senha" value={credentials.senha} onChange={e => setCredentials({...credentials, senha: e.target.value})} />
            </div>
            <button type="submit" className="glass-button mt-4" disabled={loading}>
              {loading ? 'Acessando...' : 'Acessar'}
            </button>
            
            <div className="flex flex-col items-center gap-4 mt-6 pt-6 border-t border-white/10">
              <Link to="/register" className="text-primary hover:text-white transition-colors text-sm font-medium" style={{ textDecoration: 'none' }}>Não tem conta? Cadastre-se</Link>
              <Link to="/painel/login" className="text-muted hover:text-white transition-colors text-xs flex items-center gap-1" style={{ textDecoration: 'none' }}><Shield size={12}/> Acesso Guarda Municipal</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
