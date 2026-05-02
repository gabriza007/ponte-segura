import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Phone, Hash, LogIn, Mail } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import Logo from '../../components/Logo';

export default function StudentRegister() {
  const [student, setStudent] = useState({ nome: '', matricula: '', telefone: '', email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, student.email, student.senha);
      const uid = userCredential.user.uid;
      
      try {
        await setDoc(doc(db, 'estudantes', uid), {
          nome: student.nome,
          matricula: student.matricula,
          telefone: student.telefone,
          email: student.email,
          instituicao: '',
          foto_url: ''
        });
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.CREATE, `estudantes/${uid}`);
      }

      await sendEmailVerification(userCredential.user);
      await signOut(auth); // force them to verify before seeing app
      
      setSuccessMsg('Conta criada com sucesso! Verifique seu email para confirmar o cadastro antes de fazer login.');
      setStudent({ nome: '', matricula: '', telefone: '', email: '', senha: '' });
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Por favor, ative o provedor "E-mail/Senha" no console do Firebase Authentication.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else {
        setError(err.message || 'Erro ao registrar.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container fade-in flex items-center justify-center pt-8">
      <div className="w-full">
        <div className="header mb-6 flex flex-col items-center">
          <Logo size={36} className="mb-2" />
          <p className="text-muted">Cadastro de Estudante</p>
        </div>

        <div className="glass-panel-heavy form-card">
          {error && <div className="text-danger mb-4 text-center text-sm">{error}</div>}
          {successMsg && <div className="text-success mb-4 text-center text-sm font-medium">{successMsg}</div>}
          
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label><User size={14} className="inline mr-1"/> Nome Completo</label>
              <input type="text" required className="glass-input" placeholder="Seu nome" value={student.nome} onChange={e => setStudent({...student, nome: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label><Hash size={14} className="inline mr-1"/> Matrícula</label>
              <input type="text" required className="glass-input" placeholder="Sua matrícula" value={student.matricula} onChange={e => setStudent({...student, matricula: e.target.value})} />
            </div>

            <div className="form-group">
              <label><Mail size={14} className="inline mr-1"/> E-mail</label>
              <input type="email" required className="glass-input" placeholder="Seu e-mail" value={student.email} onChange={e => setStudent({...student, email: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label><Phone size={14} className="inline mr-1"/> Telefone (WhatsApp)</label>
              <input type="tel" required className="glass-input" placeholder="(00) 00000-0000" value={student.telefone} onChange={e => setStudent({...student, telefone: e.target.value})} />
            </div>

            <div className="form-group">
              <label><LogIn size={14} className="inline mr-1"/> Senha de Acesso</label>
              <input type="password" required className="glass-input" placeholder="Sua senha" value={student.senha} minLength={6} onChange={e => setStudent({...student, senha: e.target.value})} />
            </div>

            <button type="submit" className="glass-button mt-4" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </button>

            <div className="flex flex-col items-center gap-4 mt-6 pt-6 border-t border-white/10">
              <Link to="/" className="text-primary hover:text-white transition-colors text-sm font-medium" style={{ textDecoration: 'none' }}>Já tem conta? Entrar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
