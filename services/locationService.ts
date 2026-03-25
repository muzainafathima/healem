import type { GeocodedLocation, NominatimFacilityResult, HealthcareFacility, Doctor } from '../types';

export const geocodeAddress = async (address: string): Promise<GeocodedLocation | null> => {
    if (!address) return null;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data: GeocodedLocation[] = await response.json();
        if (data && data.length > 0) {
            return data[0];
        }
        return null;
    } catch (error) {
        console.error('Failed to geocode address:', error);
        return null;
    }
};

export const reverseGeocodeAddress = async (lat: number, lon: number): Promise<string | null> => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url, { headers: { 'Accept-Language': 'en' } }); // Use English for consistent parsing if possible, or omit
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county;
            const state = data.address.state;
            if (city && state) return `${city}, ${state}`;
            return data.display_name;
        }
        return null;
    } catch (error) {
        console.error('Failed to reverse geocode address:', error);
        return null;
    }
};

const VIEWBOX_RADIUS_KM = 10; // Search within a 10km radius

export const findNearbyFacilities = async (query: string, lat: number, lon: number): Promise<HealthcareFacility[]> => {
    // Calculate bounding box for the viewbox parameter
    const latDelta = VIEWBOX_RADIUS_KM / 111.32; // ~111.32 km per degree latitude
    const lonDelta = VIEWBOX_RADIUS_KM / (111.32 * Math.cos(lat * (Math.PI / 180)));
    
    const lon1 = lon - lonDelta;
    const lat1 = lat - latDelta;
    const lon2 = lon + lonDelta;
    const lat2 = lat + latDelta;

    const viewbox = `${lon1},${lat2},${lon2},${lat1}`; // left,top,right,bottom

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=50`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data: NominatimFacilityResult[] = await response.json();
        
        const facilities: HealthcareFacility[] = data
            .filter(item => ['hospital', 'clinic', 'pharmacy'].includes(item.type)) // Filter for relevant types
            .map(item => {
                const nameParts = item.display_name.split(',');
                const name = nameParts[0] || item.display_name;
                
                return {
                    id: item.osm_id,
                    name: name,
                    type: (item.type.charAt(0).toUpperCase() + item.type.slice(1)) as 'Hospital' | 'Clinic' | 'Pharmacy',
                    address: item.display_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                };
            });
        
        return facilities;
    } catch (error) {
        console.error(`Failed to find nearby ${query}:`, error);
        return [];
    }
};

export const findNearbyDoctors = async (specialty: string, lat: number, lon: number): Promise<Doctor[]> => {
    // Search for medical facilities like clinics and doctors' offices
    // If specialty is "all", search for general medical facilities
    const searchTerms = specialty && specialty !== 'all' 
        ? [`${specialty} doctor`, `${specialty} clinic`, 'doctor', 'clinic', 'medical center']
        : ['doctor', 'clinic', 'medical center', 'hospital'];
    
    // Bounding box for the viewbox parameter to prioritize local results
    const DOCTOR_VIEWBOX_RADIUS_KM = 20;
    const latDelta = DOCTOR_VIEWBOX_RADIUS_KM / 111.32;
    const lonDelta = DOCTOR_VIEWBOX_RADIUS_KM / (111.32 * Math.cos(lat * (Math.PI / 180)));
    
    const lon1 = lon - lonDelta;
    const lat1 = lat - latDelta;
    const lon2 = lon + lonDelta;
    const lat2 = lat + latDelta;
    const viewbox = `${lon1},${lat2},${lon2},${lat1}`;

    const allDoctors: Doctor[] = [];
    
    // Try multiple search queries to find medical facilities
    for (const searchTerm of searchTerms) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&viewbox=${viewbox}&bounded=1&limit=20&extratags=1`;
            
            const response = await fetch(url);
            if (!response.ok) continue;
            
            const data: NominatimFacilityResult[] = await response.json();
            
            // Map the results to the Doctor type
            const doctors: Doctor[] = data.map(item => {
                const nameParts = item.display_name.split(',');
                const name = nameParts[0] || item.display_name;
                
                return {
                    id: item.osm_id,
                    name: name,
                    specialty: specialty && specialty !== 'all' ? specialty : 'General Practice',
                    address: item.display_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    phone: item.extratags?.['contact:phone'] || item.extratags?.phone,
                    website: item.extratags?.website,
                };
            });
            
            allDoctors.push(...doctors);
            
            // If we found enough results, break early
            if (allDoctors.length >= 10) break;
        } catch (error) {
            console.error(`Failed to search for "${searchTerm}":`, error);
        }
    }
    
    // Remove duplicates based on osm_id
    const uniqueDoctors = allDoctors.filter((doctor, index, self) => 
        index === self.findIndex((d) => d.id === doctor.id)
    );
    
    console.log(`Found ${uniqueDoctors.length} unique medical facilities`);
    return uniqueDoctors;
};