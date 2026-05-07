import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Navigation2, Shield, User, Clock, Building, Users } from 'lucide-react';
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

export default function InstitutionRadar() {
  const [students, setStudents] = useState<any[]>([]);
  const [instData, setInstData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const routeLocation = useLocation();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const waitAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
         navigate('/instituicao');
         return;
      }
      
      try {
        let pData = (routeLocation.state as any)?.user;
        if (!pData) {
          const userDoc = await getDoc(doc(db, 'instituicoes', user.uid));
          if (!userDoc.exists()) {
             throw new Error('NOT_INST');
          }
          pData = userDoc.data();
        }
        setInstData(pData);

        // Listen for all students in this institution
        const q = query(collection(db, 'estudantes'), where('instituicao', '==', pData.instituicao_alvo));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setStudents(list);
        }, (error) => {
          setErrorMsg('Erro de permissão ou falha ao buscar dados.');
          handleFirestoreError(error, OperationType.LIST, 'estudantes');
        });

      } catch (err) {
        navigate('/instituicao');
      }
    });

    return () => {
      waitAuth();
      if (unsubscribe) unsubscribe();
    };
  }, [navigate, routeLocation.state]);

  const handleLogout = () => {
    signOut(auth);
    navigate('/instituicao');
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

  if (!instData) {
      return <div className="text-center mt-20 text-white">Carregando painel da instituição...</div>;
  }

  const studentsWithLocation = students.filter(s => s.coordenadas);
  
  // Center roughly based on first student, else SP
  const mapCenter = studentsWithLocation.length > 0 
    ? [studentsWithLocation[0].coordenadas.lat, studentsWithLocation[0].coordenadas.lng] 
    : [-23.5505, -46.6333];

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 shadow-2xl relative overflow-hidden">
      <div className="flex-1 relative w-full h-full z-0">
        <MapContainer center={mapCenter as any} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          
          {studentsWithLocation.map(student => (
            <Marker key={student.id} position={[student.coordenadas.lat, student.coordenadas.lng]} icon={customMarkerIcon}>
              <Popup className="custom-popup">
                <div className="p-2">
                  <div className="font-bold text-gray-900 flex items-center gap-1 border-b pb-1 mb-1">
                    <User size={14}/> {student.nome}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold">Matrícula:</span> {student.matricula}
                  </div>
                  <div className={`text-[11px] flex items-center gap-1 font-bold ${getStatusColor(student.ultima_localizacao_tempo)}`}>
                    <Clock size={12}/> {getStatusText(student.ultima_localizacao_tempo)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Header */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start fade-in">
           <div className="glass-panel-heavy px-5 py-3 rounded-2xl pointer-events-auto flex items-center gap-4 shadow-2xl backdrop-blur-xl border border-white/5">
             <Logo size={32} />
             <div>
               <h1 className="text-white font-bold tracking-wider uppercase text-sm">Monitoramento Institucional</h1>
               <p className="text-primary text-xs opacity-80 flex items-center gap-1 mt-0.5">
                 <Building size={12}/> {instData.instituicao_alvo}
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
        <div className="absolute top-24 right-4 z-[1000] w-[22rem] max-w-[calc(100vw-2rem)] pointer-events-none fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-panel-heavy p-5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-xl pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-secondary font-bold text-xs tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-white/10 pb-3 shrink-0">
              <Users size={16} className="text-primary"/> Dispositivos Ativos ({studentsWithLocation.length})
            </h3>
            
            <div className="overflow-auto pr-1 custom-scrollbar">
              {students.length > 0 ? (
                 <div className="flex flex-col gap-3">
                   {students.map(student => (
                     <div key={student.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:bg-black/50 transition-colors">
                       <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                          {student.foto_url ? (
                            <img src={student.foto_url} alt="Perfil" className="w-full h-full object-cover" />
                          ) : (
                            <User size={22} className="text-muted" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className="font-bold text-white text-sm truncate">{student.nome}</p>
                           <p className="text-xs text-slate-400 truncate">{student.matricula}</p>
                           <div className="mt-2 flex justify-between items-center">
                             <p className={`text-[10px] uppercase font-bold flex gap-1 items-center ${getStatusColor(student.ultima_localizacao_tempo)}`}>
                               <Clock size={10}/> {getStatusText(student.ultima_localizacao_tempo)}
                             </p>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
              ) : (
                 <div className="text-center p-6 text-slate-300 text-sm border border-white/5 rounded-xl bg-black/20">
                   Nenhum aluno registrado.
                   <br/><br/>
                   <span className="text-xs text-muted">Aguardando estudantes com vínculo ativo com essa instituição...</span>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
