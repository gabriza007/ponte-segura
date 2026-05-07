import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, LogIn, Lock, User, UserPlus } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import Logo from '../../components/Logo';

export default function ParentAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [filhoMatricula, setFilhoMatricula] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, senha);
        
        if (!res.user.emailVerified) {
          await signOut(auth);
          throw new Error('UNVERIFIED_EMAIL');
        }

        const userDoc = await getDoc(doc(db, 'pais', res.user.uid));
        
        if (!userDoc.exists()) {
           throw new Error('CONTA_NAO_ENCONTRADA');
        }
        navigate('/pais/radar', { state: { user: userDoc.data() } });
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(db, 'pais', res.user.uid), {
          nome,
          email,
          filho_matricula: filhoMatricula,
          emailVerificado: false
        });
        
        await sendEmailVerification(res.user);
        await signOut(auth);
        
        setErrorMsg('Conta criada! Verifique seu e-mail (clique no link enviado) antes de fazer login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      if (err.message === 'UNVERIFIED_EMAIL') {
        setErrorMsg('Por favor, verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.');
      } else if (err.message === 'CONTA_NAO_ENCONTRADA') {
        setErrorMsg('Conta não encontrada ou tipo de usuário incorreto.');
        await signOut(auth);
      } else {
        setErrorMsg(isLogin ? 'Erro ao entrar. Verifique suas credenciais.' : 'Erro ao cadastrar. O email pode já estar em uso.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container fade-in flex flex-col justify-center px-4">
      <div className="header mt-12 mb-8 text-center">
        <Logo size={48} className="mx-auto mb-4" />
        <h1 className="outfit-font text-white">{isLogin ? 'Portal dos Pais' : 'Cadastro de Pais'}</h1>
        <p className="text-muted">Monitore a localização do seu filho</p>
      </div>

      <div className="glass-panel-heavy form-card">
        {errorMsg && (
          <div className="bg-danger/20 border border-danger/50 text-danger p-3 rounded-lg mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div className="form-group">
                <label><User size={14} className="inline mr-1" /> Seu Nome Completo</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Nome Completo" 
                  value={nome} 
                  onChange={e => setNome(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Shield size={14} className="inline mr-1" /> Matrícula do Filho(a)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Ex: 2024001" 
                  value={filhoMatricula} 
                  onChange={e => setFilhoMatricula(e.target.value)} 
                  required 
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label><Mail size={14} className="inline mr-1" /> Email</label>
            <input 
              type="email" 
              className="glass-input" 
              placeholder="seu@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label><Lock size={14} className="inline mr-1" /> Senha</label>
            <input 
              type="password" 
              className="glass-input" 
              placeholder="••••••••" 
              value={senha} 
              onChange={e => setSenha(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="glass-button w-full mt-4 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? 'Processando...' : isLogin ? <><LogIn size={20} /> Entrar</> : <><UserPlus size={20} /> Cadastrar</>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {isLogin ? (
            <p>Novo por aqui? <button onClick={() => setIsLogin(false)} className="text-secondary hover:text-white font-bold ml-1">Crie sua conta</button></p>
          ) : (
            <p>Já tem conta? <button onClick={() => setIsLogin(true)} className="text-primary hover:text-white font-bold ml-1">Fazer login</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
