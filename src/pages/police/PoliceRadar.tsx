import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle2, Phone, RefreshCw, Navigation2, LogOut, Activity, Hash, MessageSquare } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { signOut } from 'firebase/auth';
import { MapUpdater } from '../../components/MapUpdater';
import Logo from '../../components/Logo';
import ChatInterface from '../../components/ChatInterface';

const emergencyIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="marker-pin emergency-pulse"><div class="marker-inner-emergency"></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16]
});

const warningIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="marker-pin warning-pin"><div class="marker-inner-warning"></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16]
});

const defaultIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="marker-pin resolved-pin"><div class="marker-inner-resolved"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12]
});

export default function PoliceRadar() {
  const [authStatus, setAuthStatus] = useState(false);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loadingRadar, setLoadingRadar] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [filterView, setFilterView] = useState<'ativos' | 'operacao' | 'historico'>('ativos');
  const [dateFilter, setDateFilter] = useState('');
  const [chatAlertaId, setChatAlertaId] = useState<string | null>(null);
  const [selectedAlertaId, setSelectedAlertaId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email?.endsWith('@policia.com')) {
          setAuthStatus(true);
        } else {
          navigate('/painel/login');
        }
      } else {
        navigate('/painel/login');
      }
      setLoadingRadar(false);
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!authStatus) return;
    
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    const q = query(collection(db, 'alertasos'), orderBy('data_hora', 'desc'));
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlertas(alertasData);
      setErrorMsg('');

      // Check for new alerts to trigger notification
      if (!isInitialLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (!data.resolvido) {
              // Play sound alarm
              try {
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
                audio.play().catch(e => console.log('Audio autoplay prevented:', e));
              } catch (err) {}

              // Show push notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🚨 NOVO ALERTA SOS 🚨', {
                  body: `Estudante: ${data.estudante.nome}\nLocal: ${data.localizacao}`,
                  icon: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  vibrate: [200, 100, 200, 100, 200],
                  requireInteraction: true
                } as any);
              }
            }
          }
        });
      }
      isInitialLoad = false;

    }, (error) => {
      setErrorMsg('Erro: Sem permissão de acesso aos alertas.');
      try {
        handleFirestoreError(error, OperationType.LIST, 'alertasos');
      } catch (err) {}
    });

    return () => unsubscribe();
  }, [authStatus]);

  const handleOperacao = async (id: string) => {
    try {
      await updateDoc(doc(db, 'alertasos', id), { 
        status: 'operacao',
        ultima_atualizacao: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alertasos/${id}`);
    }
  };

  const handleFinalizar = async (id: string) => {
    try {
      await updateDoc(doc(db, 'alertasos', id), { 
        resolvido: true, 
        status: 'resolvido',
        ultima_atualizacao: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alertasos/${id}`);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await signOut(auth);
    navigate('/painel/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const filteredAlertas = alertas.filter(alerta => {
    const isOperacao = alerta.status === 'operacao';

    if (filterView === 'ativos' && (alerta.resolvido || isOperacao)) return false;
    if (filterView === 'operacao' && (!isOperacao || alerta.resolvido)) return false;
    if (filterView === 'historico' && !alerta.resolvido) return false;
    
    if (dateFilter) {
      const dateObj = new Date(alerta.data_hora);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const alertaDate = `${yyyy}-${mm}-${dd}`;
      
      if (alertaDate !== dateFilter) return false;
    }
    
    return true;
  });

  if (loadingRadar) return (
     <div className="app-container fade-in text-center flex flex-col justify-center items-center" style={{ minHeight: '100vh' }}>
       <RefreshCw size={48} className="text-primary animate-spin mb-4" />
       <h2 className="text-white">Verificando Credenciais...</h2>
     </div>
  );

  if (!authStatus) return null;

  return (
    <div className="app-container fade-in">
      {/* Modal de Confirmação de Saída */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 fade-in px-4">
          <div className="glass-panel text-center max-w-sm w-full p-6">
            <LogOut size={48} className="mx-auto text-danger mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Encerrar sessão?</h3>
            <p className="text-muted text-sm mb-6">Você deixará de receber alertas em tempo real até fazer login novamente.</p>
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

      <div className="radar-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="police-brand flex items-center gap-4">
          <Logo size={32} />
          <div className="w-px h-8 bg-white/20 mx-2 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <Activity size={24} className="text-danger" />
            <h2 className="outfit-font text-xl m-0 font-bold tracking-widest text-slate-200">RADAR Central</h2>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg flex items-center border border-primary/20">
            <RefreshCw size={14} className="mr-2 animate-spin" /> Radares e Notificações Push Ativos
          </div>
          <button onClick={handleLogoutClick} className="text-danger flex items-center gap-2 hover:text-white transition-colors" style={{ background: 'none', border:'none', cursor:'pointer' }}>
             <LogOut size={16} /> Sair
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
        <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10 w-full md:w-auto">
          <button 
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterView === 'ativos' ? 'bg-primary text-black' : 'text-white hover:bg-white/10'}`}
            onClick={() => setFilterView('ativos')}
          >
            Emergências Ativas
          </button>
          <button 
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterView === 'operacao' ? 'bg-primary text-black' : 'text-white hover:bg-white/10'}`}
            onClick={() => setFilterView('operacao')}
          >
            Em Operação
          </button>
          <button 
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterView === 'historico' ? 'bg-primary text-black' : 'text-white hover:bg-white/10'}`}
            onClick={() => setFilterView('historico')}
          >
            Histórico de Resolvidos
          </button>
        </div>
        
        {filterView === 'historico' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm text-muted">Data:</span>
            <input 
              type="date" 
              className="bg-black/50 border border-white/20 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="text-muted hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="glass-panel text-danger mb-4" style={{ padding: '1rem', border: '1px solid #ef4444' }}>
           <AlertTriangle size={20} className="inline mr-2" /> {errorMsg}
        </div>
      )}

      {/* Map Section */}
      <div className="glass-panel mb-6 relative z-0" style={{ height: '500px', padding: 0, overflow: 'hidden' }}>
        <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {filteredAlertas.map(alerta => alerta.coordenadas && (
            <Marker 
              key={alerta.id} 
              position={[alerta.coordenadas.lat, alerta.coordenadas.lng]}
              icon={alerta.resolvido ? defaultIcon : (alerta.status === 'operacao' ? warningIcon : emergencyIcon)}
            >
              <Popup>
                <div className="text-black">
                  <strong>{alerta.estudante.nome}</strong><br/>
                  <Phone size={12} className="inline mr-1"/> {alerta.estudante.telefone}<br/>
                  <span className="text-xs text-gray-500">{new Date(alerta.data_hora).toLocaleString()}</span><br/>
                  <span className="text-xs">{alerta.localizacao}</span>
                </div>
              </Popup>
            </Marker>
          ))}
          <MapUpdater alertas={filteredAlertas} selectedAlertaId={selectedAlertaId} />
        </MapContainer>
      </div>

      {/* Desktop Table */}
      <div className="tactic-table-container">
        <table className="tactic-table">
          <thead>
            <tr>
              <th>Situação</th>
              <th>Alvo (Estudante)</th>
              <th>Contato</th>
              <th>Localização</th>
              <th>Horários</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlertas.length === 0 && (
               <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '3rem' }}>Nenhum alerta encontrado para o filtro atual.</td></tr>
            )}
            {filteredAlertas.map(alerta => (
              <tr 
                key={alerta.id} 
                className={`cursor-pointer transition-colors ${selectedAlertaId === alerta.id ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                onClick={() => setSelectedAlertaId(alerta.id)}
              >
                <td>
                  <span className={`badge ${alerta.resolvido ? 'resolved' : (alerta.status === 'operacao' ? 'warning' : 'active')}`}>
                    {alerta.resolvido ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                    {alerta.resolvido ? 'Resolvido' : (alerta.status === 'operacao' ? 'Em Operação' : 'SOS Ativo')}
                  </span>
                </td>
                <td>
                  <div className="font-medium text-white">{alerta.estudante.nome}</div>
                  <div className="text-sm text-muted">Mat: {alerta.estudante.matricula}</div>
                </td>
                <td className="text-white">{alerta.estudante.telefone}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Navigation2 size={14} className="text-primary"/>
                    {alerta.localizacao}
                  </div>
                </td>
                <td className="text-sm">
                  <div className="text-muted">Início: {new Date(alerta.data_hora).toLocaleTimeString('pt-BR')}</div>
                  <div className="text-primary text-xs font-bold mt-1">
                    Atz: {alerta.ultima_atualizacao ? new Date(alerta.ultima_atualizacao).toLocaleTimeString('pt-BR') : new Date(alerta.data_hora).toLocaleTimeString('pt-BR')}
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {!alerta.resolvido ? (
                      alerta.status === 'operacao' ? (
                        <button onClick={() => handleFinalizar(alerta.id)} className="action-btn" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderColor: 'currentColor' }}>
                          <CheckCircle2 size={16} /> Finalizar
                        </button>
                      ) : (
                        <button onClick={() => handleOperacao(alerta.id)} className="action-btn">
                          <Shield size={16} /> Enviar Patrulha
                        </button>
                      )
                    ) : (
                      <span className="text-muted text-sm px-2">Finalizado</span>
                    )}
                    
                    {!alerta.resolvido && (
                      <button 
                        onClick={() => setChatAlertaId(alerta.id)} 
                        className="action-btn" 
                        style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderColor: 'currentColor' }}
                      >
                        <MessageSquare size={16} /> Chat
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards-container mt-4">
         {filteredAlertas.length === 0 && (
              <div className="glass-panel text-center text-muted" style={{ padding: '2rem' }}>
                  Nenhum alerta encontrado para o filtro atual.
              </div>
          )}
        {filteredAlertas.map(alerta => (
          <div 
            key={alerta.id} 
            className={`glass-panel alert-card cursor-pointer transition-colors ${selectedAlertaId === alerta.id ? 'border-primary' : ''}`}
            onClick={() => setSelectedAlertaId(alerta.id)}
          >
            <div className="card-header">
               <span className={`badge ${alerta.resolvido ? 'resolved' : (alerta.status === 'operacao' ? 'warning' : 'active')}`}>
                  {alerta.resolvido ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                  {alerta.resolvido ? 'Resolvido' : (alerta.status === 'operacao' ? 'Em Operação' : 'SOS Ativo')}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted">Início: {new Date(alerta.data_hora).toLocaleTimeString('pt-BR')}</span>
                  <span className="text-[10px] text-primary font-bold">Atz: {alerta.ultima_atualizacao ? new Date(alerta.ultima_atualizacao).toLocaleTimeString('pt-BR') : new Date(alerta.data_hora).toLocaleTimeString('pt-BR')}</span>
                </div>
            </div>
            <div className="card-body">
              <div className="text-lg font-bold text-white outfit-font">{alerta.estudante.nome}</div>
              <div className="info-row"><Hash size={14}/> Matrícula: <strong>{alerta.estudante.matricula}</strong></div>
              <div className="info-row"><Phone size={14}/> Tel: <strong>{alerta.estudante.telefone}</strong></div>
              <div className="info-row mt-2 px-3 py-2 bg-black/20 rounded-lg">
                <Navigation2 size={14} className="text-primary"/> 
                <strong className="text-sm">{alerta.localizacao}</strong>
              </div>
            </div>
            {!alerta.resolvido && (
              <div className="mt-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                {alerta.status === 'operacao' ? (
                  <button onClick={() => handleFinalizar(alerta.id)} className="glass-button w-full" style={{ padding: '12px', fontSize: '1rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderColor: 'currentColor' }}>
                     <CheckCircle2 size={18} /> Finalizar
                  </button>
                ) : (
                  <button onClick={() => handleOperacao(alerta.id)} className="glass-button w-full" style={{ padding: '12px', fontSize: '1rem' }}>
                     <Shield size={18} /> Enviar Patrulha
                  </button>
                )}
                
                <button 
                  onClick={() => setChatAlertaId(alerta.id)} 
                  className="glass-button w-full" 
                  style={{ padding: '12px', fontSize: '1rem', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderColor: 'currentColor' }}
                >
                   <MessageSquare size={18} /> Abrir Chat
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Side Panel */}
      {chatAlertaId && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[400px] z-50 transform transition-transform duration-300">
          <ChatInterface 
            alertaId={chatAlertaId} 
            isEstudante={false} 
            onClose={() => setChatAlertaId(null)} 
          />
        </div>
      )}
      {chatAlertaId && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setChatAlertaId(null)}
        />
      )}
    </div>
  );
}
