import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';

import StudentLogin from './pages/student/StudentLogin';
import StudentRegister from './pages/student/StudentRegister';
import StudentAppWrapper from './pages/student/StudentApp';
import PoliceLogin from './pages/police/PoliceLogin';
import PoliceRegister from './pages/police/PoliceRegister';
import PoliceRadar from './pages/police/PoliceRadar';

// Fix generic leaflet marker icon issue
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function App() {
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/app" element={<StudentAppWrapper />} />
        <Route path="/painel/login" element={<PoliceLogin />} />
        <Route path="/painel/register" element={<PoliceRegister />} />
        <Route path="/painel/radar" element={<PoliceRadar />} />
      </Routes>
    </BrowserRouter>
  );
}
