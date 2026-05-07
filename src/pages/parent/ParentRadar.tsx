import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Navigation2, Shield, User, Clock } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { signOut } from 'firebase/auth';
import { MapUpdater } from '../../components/MapUpdater';
import Logo from '../../components/Logo';

// Custom Marker
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ParentRadar() {
  const [student, setStudent] = useState<any>(null);
  const [parentData, setParentData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const routeLocation = useLocation();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const waitAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
         navigate('/pais');
         return;
      }
      
      try {
        let pData = (routeLocation.state as any)?.user;
        if (!pData) {
          const userDoc = await getDoc(doc(db, 'pais', user.uid));
          if (!userDoc.exists()) {
             throw new Error('NOT_PARENT');
          }
          pData = userDoc.data();
        }
        setParentData(pData);

        // Listen for the student
        const q = query(collection(db, 'estudantes'), where('matricula', '==', pData.filho_matricula));
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            setStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          } else {
            setStudent(null);
          }
        }, (error) => {
          setErrorMsg('Erro de permissão ou falha ao buscar dados.');
          handleFirestoreError(error, OperationType.LIST, 'estudantes');
        });

      } catch (err) {
        navigate('/pais');
      }
    });

    return () => {
      waitAuth();
      if (unsubscribe) unsubscribe();
    };
  }, [navigate, routeLocation.state]);

  const handleLogout = () => {
    signOut(auth);
    navigate('/pais');
  };

  const getStatusColor = (time?: number) => {
    if (!time) return 'text-slate-500';
    const mins = (Date.now() - time) / 60000;
    if (mins < 5) return 'text-success';
    if (mins < 30) return 'text-warning';
    return 'text-danger';
  };
  
  const getStatusText = (time?: number) => {
    if (!time) return 'Nunca atualizado';
    const mins = Math.floor((Date.now() - time) / 60000);
    if (mins < 1) return 'Agora mesmo';
    if (mins < 60) return `Há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours}h`;
    return `Há ${Math.floor(hours / 24)} dias`;
  };

  if (!parentData) {
      return <div className="text-center mt-20 text-white">Carregando painel dos pais...</div>;
  }

  const mapCenter = student?.coordenadas ? [student.coordenadas.lat, student.coordenadas.lng] : [-23.5505, -46.6333];

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 shadow-2xl relative overflow-hidden">
      <div className="flex-1 relative w-full h-full z-0">
        <MapContainer center={mapCenter as any} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          {student?.coordenadas && <MapUpdater center={[student.coordenadas.lat, student.coordenadas.lng]} />}
          
          {student?.coordenadas && (
            <Marker position={[student.coordenadas.lat, student.coordenadas.lng]} icon={customMarkerIcon}>
              <Popup className="custom-popup">
                <div className="p-2">
                  <div className="font-bold text-gray-900 flex items-center gap-1 border-b pb-1 mb-1">
                    <User size={14}/> {student.nome}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold">Instituição:</span> {student.instituicao || 'Não informada'}
                  </div>
                  <div className={`text-[11px] flex items-center gap-1 font-bold ${getStatusColor(student.ultima_localizacao_tempo)}`}>
                    <Clock size={12}/> {getStatusText(student.ultima_localizacao_tempo)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating Header */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start fade-in">
           <div className="glass-panel-heavy px-5 py-3 rounded-2xl pointer-events-auto flex items-center gap-4 shadow-2xl backdrop-blur-xl border border-white/5">
             <Logo size={32} />
             <div>
               <h1 className="text-white font-bold tracking-wider uppercase text-sm">Monitoramento Familiar</h1>
               <p className="text-primary text-xs opacity-80 flex items-center gap-1 mt-0.5">
                 <User size={12}/> Responsável: {parentData.nome}
               </p>
             </div>
           </div>
           
           <button onClick={handleLogout} className="glass-button pointer-events-auto text-sm px-4 py-2.5 flex items-center gap-2 hover:bg-danger/20 hover:border-danger/50 text-white rounded-xl shadow-lg transition-all">
             <LogOut size={16} /> Sair
           </button>
        </div>

        {errorMsg && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-danger text-white px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 text-sm border border-white/20 animate-bounce">
            {errorMsg}
          </div>
        )}

        {/* Sidebar Info Card */}
        <div className="absolute bottom-6 left-6 z-[1000] w-[22rem] max-w-[calc(100vw-3rem)] pointer-events-none fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-panel-heavy p-5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-xl pointer-events-auto">
            <h3 className="text-secondary font-bold text-xs tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <Shield size={16} className="text-primary"/> Status do Dispositivo
            </h3>
            
            {student ? (
                 <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        {student.foto_url ? (
                          <img src={student.foto_url} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-muted" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <p className="font-bold text-white text-lg truncate leading-tight">{student.nome}</p>
                         <p className="text-sm text-slate-400 font-mono mt-1">{student.matricula}</p>
                      </div>
                   </div>
                   
                   <div className="bg-black/40 border border-white/5 rounded-xl p-4 shadow-inner mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sinal do Radar</span>
                        <div className={`text-[10px] uppercase font-bold flex items-center gap-1 ${getStatusColor(student.ultima_localizacao_tempo)}`}>
                            <Clock size={10}/> {getStatusText(student.ultima_localizacao_tempo)}
                        </div>
                      </div>
                      
                      {student.coordenadas ? (
                         <div className="text-sm text-blue-300 font-mono tracking-widest px-1">
                             {student.coordenadas.lat.toFixed(5)}, {student.coordenadas.lng.toFixed(5)}
                         </div>
                      ) : (
                         <div className="text-xs text-warning animate-pulse px-1">Aguardando sinal de GPS...</div>
                      )}
                   </div>
                 </div>
            ) : (
               <div className="text-center p-6 text-slate-300 text-sm border border-white/5 rounded-xl bg-black/20">
                 Nenhum dispositivo encontrado com a matrícula <strong>{parentData?.filho_matricula}</strong>.
                 <br/><br/>
                 <span className="text-xs text-muted">Aguardando conexão com o aplicativo do aluno...</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
