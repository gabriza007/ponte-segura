import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, LogIn, Lock, Building, UserPlus } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import Logo from '../../components/Logo';

export default function InstitutionAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [instituicaoAlvo, setInstituicaoAlvo] = useState('');

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

        const userDoc = await getDoc(doc(db, 'instituicoes', res.user.uid));
        
        if (!userDoc.exists()) {
           throw new Error('CONTA_NAO_ENCONTRADA');
        }
        navigate('/instituicao/radar', { state: { user: userDoc.data() } });
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(db, 'instituicoes', res.user.uid), {
          nome,
          email,
          instituicao_alvo: instituicaoAlvo,
          emailVerificado: false
        });
        
        await sendEmailVerification(res.user);
        await signOut(auth);
        
        setErrorMsg('Conta criada! Verifique seu e-mail institucional (clique no link enviado) antes de fazer login.');
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
        <h1 className="outfit-font text-white">{isLogin ? 'Portal da Instituição' : 'Cadastro de Instituição'}</h1>
        <p className="text-muted">Monitore a segurança dos seus alunos</p>
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
                <label><Building size={14} className="inline mr-1" /> Nome do Responsável</label>
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
                <label><Shield size={14} className="inline mr-1" /> Nome da Instituição (Exatamente como o aluno cadastra)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Ex: Universidade XYZ" 
                  value={instituicaoAlvo} 
                  onChange={e => setInstituicaoAlvo(e.target.value)} 
                  required 
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label><Mail size={14} className="inline mr-1" /> Email Institucional</label>
            <input 
              type="email" 
              className="glass-input" 
              placeholder="admin@universidade.edu" 
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
            <p>Sua instituição não possui acesso? <button onClick={() => setIsLogin(false)} className="text-secondary hover:text-white font-bold ml-1">Solicite acesso</button></p>
          ) : (
            <p>Já possui cadastro? <button onClick={() => setIsLogin(true)} className="text-primary hover:text-white font-bold ml-1">Fazer login</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
