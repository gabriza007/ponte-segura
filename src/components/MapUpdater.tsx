import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export const MapUpdater = ({ alertas, selectedAlertaId, center }: { alertas?: any[], selectedAlertaId?: string | null, center?: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
      return;
    }

    if (!alertas) return;

    if (selectedAlertaId) {
      const selected = alertas.find(a => a.id === selectedAlertaId);
      if (selected && selected.coordenadas) {
        map.setView([selected.coordenadas.lat, selected.coordenadas.lng], 17, { animate: true });
        return;
      }
    }

    const coords = alertas.filter(a => a.coordenadas).map(a => [a.coordenadas.lat, a.coordenadas.lng] as [number, number]);
    if (coords.length > 0) {
      if (coords.length === 1) {
         map.setView(coords[0], 15);
      } else {
         const bounds = L.latLngBounds(coords);
         map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [alertas, map, selectedAlertaId, center]);
  return null;
};
