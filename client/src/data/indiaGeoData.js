// client/src/data/indiaGeoData.js
// Geographical centroid coordinates and bounding boxes for all 35 Indian States & UTs.
// Used for Leaflet + OpenStreetMap (OSM) tile rendering and smooth flyTo animations.

export const STATE_CENTROIDS = {
  'karnataka': { lat: 15.3173, lng: 75.7139, zoom: 7, name: 'Karnataka' },
  'kerala': { lat: 10.8505, lng: 76.2711, zoom: 7, name: 'Kerala' },
  'tamil-nadu': { lat: 11.1271, lng: 78.6569, zoom: 7, name: 'Tamil Nadu' },
  'maharashtra': { lat: 19.7515, lng: 75.7139, zoom: 6, name: 'Maharashtra' },
  'rajasthan': { lat: 27.0238, lng: 74.2179, zoom: 6, name: 'Rajasthan' },
  'west-bengal': { lat: 22.9868, lng: 87.8550, zoom: 7, name: 'West Bengal' },
  'uttar-pradesh': { lat: 26.8467, lng: 80.9462, zoom: 6, name: 'Uttar Pradesh' },
  'gujarat': { lat: 22.2587, lng: 71.1924, zoom: 6, name: 'Gujarat' },
  'delhi': { lat: 28.6139, lng: 77.2090, zoom: 10, name: 'Delhi' },
  'goa': { lat: 15.2993, lng: 74.1240, zoom: 9, name: 'Goa' },
  'punjab': { lat: 31.1471, lng: 75.3412, zoom: 7, name: 'Punjab' },
  'jammu-and-kashmir': { lat: 33.7782, lng: 76.5762, zoom: 7, name: 'Jammu and Kashmir' },
  'odisha': { lat: 20.9517, lng: 85.0985, zoom: 7, name: 'Odisha' },
  'madhya-pradesh': { lat: 22.9734, lng: 78.6569, zoom: 6, name: 'Madhya Pradesh' },
  'andhra-pradesh': { lat: 15.9129, lng: 79.7400, zoom: 6, name: 'Andhra Pradesh' },
  'telangana': { lat: 18.1124, lng: 79.0193, zoom: 7, name: 'Telangana' },
  'assam': { lat: 26.2006, lng: 92.9376, zoom: 7, name: 'Assam' },
  'himachal-pradesh': { lat: 31.1048, lng: 77.1734, zoom: 7, name: 'Himachal Pradesh' },
  'uttarakhand': { lat: 30.0668, lng: 79.0193, zoom: 7, name: 'Uttarakhand' },
  'bihar': { lat: 25.0961, lng: 85.3131, zoom: 7, name: 'Bihar' },
  'jharkhand': { lat: 23.6102, lng: 85.2799, zoom: 7, name: 'Jharkhand' },
  'chhattisgarh': { lat: 21.2787, lng: 81.8661, zoom: 6, name: 'Chhattisgarh' },
  'haryana': { lat: 29.0588, lng: 76.0856, zoom: 7, name: 'Haryana' },
  'ladakh': { lat: 34.1526, lng: 77.5771, zoom: 6, name: 'Ladakh' },
  'manipur': { lat: 24.6637, lng: 93.9063, zoom: 8, name: 'Manipur' },
  'meghalaya': { lat: 25.4670, lng: 91.3662, zoom: 8, name: 'Meghalaya' },
  'mizoram': { lat: 23.1645, lng: 92.9376, zoom: 8, name: 'Mizoram' },
  'nagaland': { lat: 26.1584, lng: 94.5624, zoom: 8, name: 'Nagaland' },
  'tripura': { lat: 23.9408, lng: 91.9882, zoom: 8, name: 'Tripura' },
  'sikkim': { lat: 27.5330, lng: 88.5122, zoom: 8, name: 'Sikkim' },
  'arunachal-pradesh': { lat: 28.2180, lng: 94.7278, zoom: 7, name: 'Arunachal Pradesh' },
  'puducherry': { lat: 11.9416, lng: 79.8083, zoom: 11, name: 'Puducherry' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, zoom: 11, name: 'Chandigarh' },
  'andaman-and-nicobar': { lat: 11.7401, lng: 92.6586, zoom: 7, name: 'Andaman and Nicobar Islands' },
  'lakshadweep': { lat: 10.5667, lng: 72.6417, zoom: 8, name: 'Lakshadweep' },
};

export const CITY_COORDS = {
  // Karnataka Campus & Coastal hubs
  'manipal':    { lat: 13.3525, lng: 74.7928 },
  'udupi':      { lat: 13.3409, lng: 74.7421 },
  'bengaluru':  { lat: 12.9716, lng: 77.5946 },
  'bangalore':  { lat: 12.9716, lng: 77.5946 },
  'mysuru':     { lat: 12.2958, lng: 76.6394 },
  'mysore':     { lat: 12.2958, lng: 76.6394 },
  'mangaluru':  { lat: 12.9141, lng: 74.8560 },
  'mangalore':  { lat: 12.9141, lng: 74.8560 },
  'hubballi':   { lat: 15.3647, lng: 75.1240 },
  'hubli':      { lat: 15.3647, lng: 75.1240 },
  'belagavi':   { lat: 15.8497, lng: 74.4977 },
  'madikeri':   { lat: 12.4244, lng: 75.7382 },
  'coorg':      { lat: 12.3375, lng: 75.8069 },
  'gokarna':    { lat: 14.5479, lng: 74.3188 },
  'hampi':      { lat: 15.3350, lng: 76.4600 },
  'shivamogga': { lat: 13.9299, lng: 75.5681 },
  
  // Pan-India hubs
  'mumbai':     { lat: 19.0760, lng: 72.8777 },
  'pune':       { lat: 18.5204, lng: 73.8567 },
  'delhi':      { lat: 28.6139, lng: 77.2090 },
  'new delhi':  { lat: 28.6139, lng: 77.2090 },
  'chennai':    { lat: 13.0827, lng: 80.2707 },
  'kolkata':    { lat: 22.5726, lng: 88.3639 },
  'jaipur':     { lat: 26.9124, lng: 75.7873 },
  'jodhpur':    { lat: 26.2389, lng: 73.0243 },
  'thrissur':   { lat: 10.5276, lng: 76.2144 },
  'kochi':      { lat: 9.9312, lng: 76.2673 },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'lucknow':    { lat: 26.8467, lng: 80.9462 },
  'varanasi':   { lat: 25.3176, lng: 82.9739 },
  'agra':       { lat: 27.1767, lng: 78.0081 },
  'hyderabad':  { lat: 17.3850, lng: 78.4867 },
  'ahmedabad':  { lat: 23.0225, lng: 72.5714 },
  'amritsar':   { lat: 31.6340, lng: 74.8723 },
  'bhubaneswar':{ lat: 20.2961, lng: 85.8245 },
  'puri':       { lat: 19.8135, lng: 85.8312 },
  'shillong':   { lat: 25.5788, lng: 91.8933 },
  'guwahati':   { lat: 26.1445, lng: 91.7362 },
  'srinagar':   { lat: 34.0837, lng: 74.7973 },
  'leh':        { lat: 34.1526, lng: 77.5771 },
  'patna':      { lat: 25.5941, lng: 85.1376 },
  'ranchi':     { lat: 23.3441, lng: 85.3096 },
  'raipur':     { lat: 21.2514, lng: 81.6296 },
  'bhopal':     { lat: 23.2599, lng: 77.4126 },
  'indore':     { lat: 22.7196, lng: 75.8577 },
};

/**
 * Resolves accurate [lat, lng] for an event object with collision dispersion.
 * Checks event.lat/lng, city, venue, and fallback state centroid.
 */
export function resolveEventCoords(evt, index = 0, total = 1) {
  let baseCoords = null;

  if (evt?.lat && evt?.lng && !isNaN(evt.lat) && !isNaN(evt.lng)) {
    baseCoords = [Number(evt.lat), Number(evt.lng)];
  } else {
    const textToSearch = `${evt?.city || ''} ${evt?.venue || ''} ${evt?.neighborhood || ''}`.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (textToSearch.includes(key)) {
        baseCoords = [coords.lat, coords.lng];
        break;
      }
    }
  }

  if (!baseCoords) {
    const normState = (evt?.stateId || evt?.state || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (STATE_CENTROIDS[normState]) {
      const c = STATE_CENTROIDS[normState];
      baseCoords = [c.lat, c.lng];
    } else {
      baseCoords = [13.3525, 74.7928]; // Manipal / Udupi campus default
    }
  }

  // If there are multiple events grouped or index provided, distribute them radially around the base coordinate
  if (total > 1 && index > 0) {
    const radius = 0.22; // ~20-25 km dispersion on map view
    const angle = (index * (2 * Math.PI)) / total;
    return [
      Number((baseCoords[0] + radius * Math.sin(angle)).toFixed(4)),
      Number((baseCoords[1] + (radius * 1.2) * Math.cos(angle)).toFixed(4))
    ];
  }

  return baseCoords;
}

/**
 * Accurately determines if an event belongs to a target state,
 * checking stateId, state, city, neighborhood, venue, and geographical coordinates.
 */
export function matchesEventState(evt, targetStateId) {
  if (!targetStateId) return true;
  if (!evt) return false;

  const target = targetStateId.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  
  const normStateId = (evt.stateId || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  if (normStateId && (normStateId === target || normStateId.includes(target) || target.includes(normStateId))) return true;

  const normState = (evt.state || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  if (normState && (normState === target || normState.includes(target) || target.includes(normState))) return true;

  const normCity = (evt.city || '').toLowerCase().trim();
  const normNeigh = (evt.neighborhood || '').toLowerCase().trim();
  const normVenue = (evt.venue || '').toLowerCase().trim();
  const allText = `${normCity} ${normNeigh} ${normVenue}`;

  if (target === 'karnataka') {
    return ['bengaluru', 'bangalore', 'manipal', 'mysore', 'mysuru', 'udupi', 'mangaluru', 'mangalore', 'hubli', 'hubballi', 'belagavi', 'hampi', 'gokarna', 'karnataka'].some(k => 
      allText.includes(k)
    );
  }
  if (target === 'kerala') {
    return ['kochi', 'cochin', 'thrissur', 'trivandrum', 'thiruvananthapuram', 'kalamandalam', 'calicut', 'kozhikode', 'kerala'].some(k => 
      allText.includes(k)
    );
  }
  if (target === 'tamil-nadu') {
    return ['chennai', 'madras', 'madurai', 'thanjavur', 'swamimalai', 'coimbatore', 'tamil nadu', 'tamil-nadu'].some(k => 
      allText.includes(k)
    );
  }
  if (target === 'maharashtra') {
    return ['mumbai', 'bombay', 'pune', 'palghar', 'dahanu', 'nagpur', 'nashik', 'maharashtra'].some(k => 
      allText.includes(k)
    );
  }
  if (target === 'delhi') {
    return ['delhi', 'new delhi', 'ncr'].some(k => allText.includes(k));
  }
  if (target === 'rajasthan') {
    return ['jaipur', 'jodhpur', 'udaipur', 'pushkar', 'jaisalmer', 'rajasthan'].some(k => allText.includes(k));
  }
  if (target === 'west-bengal') {
    return ['kolkata', 'calcutta', 'shantiniketan', 'darjeeling', 'bengal'].some(k => allText.includes(k));
  }
  if (target === 'uttar-pradesh') {
    return ['lucknow', 'varanasi', 'banaras', 'kashi', 'agra', 'uttar pradesh'].some(k => allText.includes(k));
  }
  if (target === 'gujarat') {
    return ['ahmedabad', 'gandhinagar', 'surat', 'vadodara', 'kutch', 'gujarat'].some(k => allText.includes(k));
  }
  if (target === 'odisha') {
    return ['bhubaneswar', 'puri', 'konark', 'cuttack', 'odisha'].some(k => allText.includes(k));
  }
  if (target === 'punjab') {
    return ['amritsar', 'ludhiana', 'chandigarh', 'punjab'].some(k => allText.includes(k));
  }

  // Coordinate bounding box fallback
  if (evt.lat && evt.lng) {
    const lat = Number(evt.lat);
    const lng = Number(evt.lng);
    if (target === 'karnataka' && lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.6) return true;
    if (target === 'kerala' && lat >= 8.2 && lat <= 12.8 && lng >= 74.8 && lng <= 77.4) return true;
    if (target === 'tamil-nadu' && lat >= 8.0 && lat <= 13.6 && lng >= 76.2 && lng <= 80.4) return true;
    if (target === 'maharashtra' && lat >= 15.6 && lat <= 22.0 && lng >= 72.6 && lng <= 80.9) return true;
    if (target === 'rajasthan' && lat >= 23.3 && lat <= 30.2 && lng >= 69.5 && lng <= 78.3) return true;
    if (target === 'delhi' && lat >= 28.4 && lat <= 28.9 && lng >= 76.8 && lng <= 77.4) return true;
  }

  return false;
}
