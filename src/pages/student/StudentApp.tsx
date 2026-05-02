import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle2, Navigation2, LogOut, User, Camera, Building, Home, Menu, X, MessageSquare } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { signOut } from 'firebase/auth';
import { getAddressFromCoords } from '../../utils/geocoding';
import Logo from '../../components/Logo';
import ChatInterface from '../../components/ChatInterface';

function StudentApp({ studentData }: { studentData: any }) {
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [step, setStep] = useState(2);
  const [location, setLocation] = useState('Buscando localização...');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertaId, setAlertaId] = useState<string | null>(null);
  const [alertaStatus, setAlertaStatus] = useState<string>(''); // To track if police arrived/resolving
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();

  // Profile Form States
  const [instituicao, setInstituicao] = useState(studentData.instituicao || '');
  const [fotoUrl, setFotoUrl] = useState(studentData.foto_url || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (!studentData) navigate('/');
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          const address = await getAddressFromCoords(lat, lng);
          setLocation(address);
        },
        () => setLocation('Campus Principal')
      );
    }
  }, [studentData, navigate]);

  const firePanic = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'alertasos'), {
        estudante_id: studentData.id,
        estudante: {
          nome: studentData.nome,
          matricula: studentData.matricula,
          telefone: studentData.telefone
        },
        localizacao: location,
        coordenadas: coords,
        data_hora: Date.now(),
        resolvido: false,
        ultima_atualizacao: Date.now()
      });
      setAlertaId(docRef.id);
      setStep(3);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'alertasos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    signOut(auth);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg('');
    try {
      await updateDoc(doc(db, 'estudantes', studentData.id), {
        instituicao,
        foto_url: fotoUrl
      });
      setProfileMsg('Perfil atualizado com sucesso!');
      studentData.instituicao = instituicao;
      studentData.foto_url = fotoUrl;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `estudantes/${studentData.id}`);
      setProfileMsg('Erro ao atualizar. Verifique as permissões.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  useEffect(() => {
    let watchId: number;
    let unsubscribeAlert: (() => void) | undefined;
    let unsubscribeChat: (() => void) | undefined;
    let lastFetchTime = 0; // Throttle to avoid rate limits

    if (step === 3 && alertaId && "geolocation" in navigator) {
      // Listen to alert status
      unsubscribeAlert = onSnapshot(doc(db, 'alertasos', alertaId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAlertaStatus(data.status || '');
          if (data.resolvido) {
            setStep(2); // Go back to default when resolved
            setAlertaId(null);
            setIsChatOpen(false);
          }
        }
      });

      // Listen to messages count for simple unread logic
      unsubscribeChat = onSnapshot(
        collection(db, `alertasos/${alertaId}/mensagens`),
        (snapshot) => {
          if (!isChatOpen) {
            // Count changes since we closed/opened
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added' && change.doc.data().remetenteRole === 'guarda') {
                setUnreadMessages(prev => prev + 1);
              }
            });
          }
        }
      );

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const now = Date.now();
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let newLoc = location;

          // Only fetch address once every 5 seconds to avoid over-querying Nominatim Api
          if (now - lastFetchTime > 5000) {
            newLoc = await getAddressFromCoords(lat, lng);
            lastFetchTime = now;
          } else if (location.startsWith('Buscando') || location.startsWith('Lat:')) {
             newLoc = await getAddressFromCoords(lat, lng);
             lastFetchTime = now;
          }

          setLocation(newLoc);
          setCoords({ lat, lng });
          try {
            await updateDoc(doc(db, 'alertasos', alertaId), { 
              localizacao: newLoc,
              coordenadas: { lat, lng },
              ultima_atualizacao: Date.now()
            });
          } catch (err) {
             console.error("Failed to update location:", err);
          }
        },
        (err) => console.error("Error watching location:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId !== undefined && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (unsubscribeAlert) unsubscribeAlert();
      if (unsubscribeChat) unsubscribeChat();
    };
  }, [step, alertaId, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadMessages(0);
    }
  }, [isChatOpen]);

  if (!studentData) return null;

  return (
    <div className="mobile-container fade-in pb-8">
      {/* Modal de Confirmação de Saída */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 fade-in px-4">
          <div className="glass-panel text-center max-w-sm w-full p-6">
            <LogOut size={48} className="mx-auto text-danger mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Deseja realmente sair?</h3>
            <p className="text-muted text-sm mb-6">Você precisará fazer login novamente para acessar o aplicativo.</p>
            <div className="flex gap-4">
               <button onClick={cancelLogout} className="glass-button flex-1 bg-white/5 hover:bg-white/10 text-white border-0">
                 Cancelar
               </button>
               <button onClick={confirmLogout} className="glass-button flex-1 danger border-0">
                 Sim, Sair
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar with Hamburger */}
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="text-white hover:text-primary transition-colors p-2 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-[#0f172a] shadow-2xl shadow-black z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/10">
          <Logo size={24} />
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 -mr-2">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-2">
          {step === 3 && alertaId && (
            <button 
              onClick={() => { setIsChatOpen(true); setIsSidebarOpen(false); }}
              className="flex items-center gap-3 w-full p-4 rounded-xl transition-all font-medium bg-primary/10 text-primary border border-primary/20 mb-4"
            >
              <div className="relative">
                <MessageSquare size={22} />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-2 bg-danger w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0f172a]">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[1.05rem]">Chat com a Base</span>
            </button>
          )}
          <button 
            onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all font-medium ${activeTab === 'home' ? 'bg-primary/20 text-primary' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
          >
            <Home size={22} />
            <span className="text-[1.05rem]">Início</span>
          </button>
          <button 
            onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-primary/20 text-primary' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
          >
            <User size={22} />
            <span className="text-[1.05rem]">Meu Perfil</span>
          </button>
        </div>
        
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-4 p-2 bg-white/5 rounded-xl border border-white/5">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {studentData.foto_url ? (
                <img src={studentData.foto_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-muted" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[0.95rem] font-bold text-white truncate">{studentData.nome}</p>
              <p className="text-[0.8rem] text-slate-400 truncate mt-0.5">{studentData.matricula}</p>
            </div>
          </div>
          <button 
            onClick={() => { setIsSidebarOpen(false); handleLogoutClick(); }} 
            className="flex items-center gap-3 w-full p-4 rounded-xl text-danger hover:bg-danger/10 transition-colors font-medium border border-transparent hover:border-danger/20"
          >
            <LogOut size={22} />
            <span className="text-[1.05rem]">Sair da Conta</span>
          </button>
        </div>
      </div>

      {activeTab === 'home' && (
        <>
          {step === 2 && (
            <div className="fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', padding: '2rem 1rem' }}>
               <div className="header mt-8">
                <h1 className="outfit-font text-danger"><AlertTriangle size={32} /> Emergência</h1>
                <p>A central será notificada imediatamente</p>
              </div>

              <div style={{ margin: '3rem 0', width: '100%', maxWidth: '400px', alignSelf: 'center' }}>
                <button className="sos-button" onClick={firePanic} disabled={loading}>
                   {loading ? (
                     <>
                       <div className="animate-spin">
                         <AlertTriangle size={48} className="mb-2 opacity-50" />
                       </div>
                       <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.05em' }}>ENVIANDO...</span>
                     </>
                   ) : (
                     <>
                       <AlertTriangle size={48} className="mb-2" />
                       <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.05em' }}>SOS</span>
                       <span style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Toque para Ajuda</span>
                     </>
                   )}
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '1rem', marginTop: 'auto' }}>
                <div className="info-row justify-center">
                  <Navigation2 size={16} className="text-primary" /> 
                  <span>Localização Atual: <strong>{location}</strong></span>
                </div>
                <div className="text-sm text-center text-muted mt-2">Logado como: {studentData.nome}</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="glass-panel-heavy form-card text-center fade-in mt-12">
              <CheckCircle2 className="success-icon" />
              <h2 className="mt-4 mb-2 outfit-font text-white" style={{ fontSize: '1.8rem' }}>Aviso Enviado!</h2>
              {alertaStatus === 'operacao' && (
                <div className="bg-warning/20 border border-warning/50 text-warning px-4 py-2 rounded-lg mb-4 text-sm font-bold animate-pulse">
                  PATRULHA A CAMINHO DA SUA LOCALIZAÇÃO
                </div>
              )}
              <p className="text-muted mb-8">A Guarda Municipal foi acionada para sua localização. Mantenha a calma e fique em um local seguro.</p>
              
              <button 
                onClick={() => setIsChatOpen(true)}
                className="glass-button w-full mb-6" 
                style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderColor: 'currentColor' }}
              >
                <div className="flex items-center justify-center gap-2 relative">
                  <MessageSquare size={20} /> <span className="font-bold text-lg">Falar com a Central</span>
                  {unreadMessages > 0 && (
                    <span className="absolute right-4 bg-danger w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center shadow-lg border-2 border-slate-900 border-opacity-50">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
              </button>

              <div className="p-3 mb-6 bg-black/30 rounded-lg text-primary text-sm flex flex-col gap-2">
                <strong>Sua localização em tempo real:</strong>
                {location}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'profile' && (
        <div className="fade-in pt-12 px-2">
          <div className="header mb-8 text-center">
            <h1 className="outfit-font text-white mx-auto flex items-center justify-center gap-2">
              <User size={32} className="text-primary" /> Meu Perfil
            </h1>
            <p>Personalize suas informações</p>
          </div>

          <div className="glass-panel-heavy">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-primary mb-4 flex items-center justify-center overflow-hidden">
                {studentData.foto_url ? (
                  <img src={studentData.foto_url} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-muted" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{studentData.nome}</h3>
              <p className="text-muted text-sm">{studentData.matricula}</p>
            </div>

            {profileMsg && (
              <div className={`p-3 mb-4 rounded-lg text-sm text-center ${profileMsg.includes('sucesso') ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label><Camera size={14} className="inline mr-1"/> URL da Foto de Perfil</label>
                <input 
                  type="url" 
                  className="glass-input" 
                  placeholder="https://exemplo.com/sua-foto.jpg" 
                  value={fotoUrl} 
                  onChange={e => setFotoUrl(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label><Building size={14} className="inline mr-1"/> Instituição de Ensino</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Ex: Universidade XYZ" 
                  value={instituicao} 
                  onChange={e => setInstituicao(e.target.value)} 
                />
              </div>

              <button type="submit" className="glass-button mt-4 w-full" disabled={updatingProfile || step === 3}>
                {updatingProfile ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation Navigation Removed */}
      {/* Chat Side Panel / Modal */}
      {isChatOpen && alertaId && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex flex-col backdrop-blur-md">
          <div className="flex-1 w-full max-w-lg mx-auto bg-slate-900 shadow-2xl h-full flex flex-col">
            <ChatInterface 
              alertaId={alertaId} 
              isEstudante={true} 
              onClose={() => setIsChatOpen(false)} 
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default function StudentAppWrapper() {
  const [studentData, setStudentData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const locState = location.state as any;
    if (locState?.student) {
      setStudentData(locState.student);
    } else {
      const waitAuth = auth.onAuthStateChanged(async (user) => {
        if (user && user.emailVerified) {
          try {
            const userDoc = await getDocFromServer(doc(db, 'estudantes', user.uid));
            if (userDoc.exists()) {
              setStudentData({ ...userDoc.data(), id: user.uid });
            } else {
              navigate('/');
            }
          } catch (err) {
            navigate('/');
          }
        } else {
           navigate('/');
        }
      });
      return () => waitAuth();
    }
  }, [navigate, location.state]);

  return studentData ? <StudentApp studentData={studentData} /> : <div className="text-center mt-20 text-white">Carregando...</div>;
}
