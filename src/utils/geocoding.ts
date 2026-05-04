export const getAddressFromCoords = async (lat: number, lng: number) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: {
        'Accept-Language': 'pt-BR'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    if (data && data.address) {
      const a = data.address;
      const street = a.road || a.pedestrian || a.path || a.footway || a.street || a.neighbourhood || '';
      const neighborhood = a.suburb || a.city_district || '';
      const locality = a.city || a.town || a.village || '';
      
      const parts = [];
      if (street) parts.push(street);
      if (neighborhood && neighborhood !== street) parts.push(neighborhood);
      if (locality && locality !== neighborhood) parts.push(locality);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    
    if (data && data.display_name) {
      return data.display_name.split(',').slice(0, 3).join(', ');
    }
    
    throw new Error("Nominatim format unexpected");
  } catch (e) {
    console.error("Nominatim geocoding error:", e);
    try {
      const bdcResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`);
      if (bdcResponse.ok) {
         const bdcData = await bdcResponse.json();
         if (bdcData && (bdcData.locality || bdcData.city)) {
           return `${bdcData.locality || bdcData.city}, ${bdcData.principalSubdivision || ''}`;
         }
      }
    } catch (err) {
      console.error("BDC fallback error:", err);
    }
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
};
