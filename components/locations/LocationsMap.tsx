import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import type { HealthcareFacility } from '../../types';
import { geocodeAddress, findNearbyFacilities } from '../../services/locationService';
import { SearchIcon, LocationMarkerIcon } from '../layout/Icons';
import { useLanguage } from '../../contexts/LanguageContext';

// Haversine formula
const haversineDistance = (lat1: number | undefined, lon1: number | undefined, lat2: number, lon2: number) => {
    if (lat1 === undefined || lon1 === undefined) return Infinity;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Fix for default icon paths in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const LocationsMap: React.FC = () => {
    const { t } = useLanguage();
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const facilityMarkersRef = useRef<L.Marker[]>([]);

    const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
    const [facilityType, setFacilityType] = useState<'hospital' | 'clinic' | 'pharmacy'>('hospital');
    const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);

    const facilitiesWithDistance = useMemo<HealthcareFacility[]>(() => {
        return facilities
            .map(f => ({
                ...f,
                distance: haversineDistance(location?.lat, location?.lng, f.lat, f.lng)
            }))
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }, [location, facilities]);

    const handleLocationSearch = async () => {
        setIsLocating(true);
        setLocationError('');
        const result = await geocodeAddress(searchQuery);
        if (result) {
            setLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
        } else {
            setLocationError("Could not find location. Please try another search.");
        }
        setIsLocating(false);
    };

    const handleUseMyLocation = () => {
        setIsLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setSearchQuery("My Current Location");
                setIsLocating(false);
            },
            () => {
                setLocationError("Unable to retrieve your location. Please enable location services.");
                setIsLocating(false);
            }
        );
    };

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([40.7128, -74.0060], 12); // Default to NYC
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);
        }

        if (mapRef.current && location) {
            mapRef.current.flyTo([location.lat, location.lng], 13);

            const userIcon = L.divIcon({
                html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>',
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([location.lat, location.lng]);
            } else {
                userMarkerRef.current = L.marker([location.lat, location.lng], { icon: userIcon })
                    .addTo(mapRef.current)
                    .bindPopup('Your Location');
            }
        }
    }, [location]);
    
    useEffect(() => {
        if (location) {
            const fetchFacilities = async () => {
                setIsLoadingFacilities(true);
                setFacilities([]); // Clear previous results
                const results = await findNearbyFacilities(facilityType, location.lat, location.lng);
                setFacilities(results);
                setIsLoadingFacilities(false);
            };
            fetchFacilities();
        }
    }, [location, facilityType]);

    useEffect(() => {
        if(mapRef.current) {
             // Clear previous facility markers
            facilityMarkersRef.current.forEach(marker => marker.remove());
            facilityMarkersRef.current = [];

            // Add new facility markers
            facilitiesWithDistance.forEach(facility => {
                const marker = L.marker([facility.lat, facility.lng])
                    .addTo(mapRef.current!)
                    .bindPopup(`<b>${facility.name}</b><br>${facility.type}<br>${facility.address}`);
                facilityMarkersRef.current.push(marker);
            });
        }
    }, [facilitiesWithDistance]);

    const flyToLocation = (lat: number, lng: number) => {
        mapRef.current?.flyTo([lat, lng], 15);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-150px)]">
            <div className="lg:w-1/3 h-2/5 lg:h-full overflow-y-auto">
                <Card className='h-full flex flex-col'>
                    <h2 className="text-xl font-bold mb-4">Nearby Facilities</h2>
                    <div className="mb-4">
                         <label htmlFor="map-search-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('locations.searchLabel')}</label>
                        <div className="mt-1 flex gap-2">
                            <input type="text" id="map-search-location" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g., New York, NY" className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                            <Button onClick={handleLocationSearch} isLoading={isLocating} className="!px-3"><SearchIcon /></Button>
                            <Button onClick={handleUseMyLocation} isLoading={isLocating} className="!px-3" variant="secondary"><LocationMarkerIcon /></Button>
                        </div>
                        {locationError && <p className="text-red-500 text-xs mt-1">{locationError}</p>}
                    </div>
                     <div className="flex justify-center gap-2 mb-4">
                        {(['hospital', 'clinic', 'pharmacy'] as const).map(type => (
                            <Button
                                key={type}
                                variant={facilityType === type ? 'primary' : 'secondary'}
                                onClick={() => setFacilityType(type)}
                                className="capitalize flex-1"
                            >
                                {type}s
                            </Button>
                        ))}
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                         {isLoadingFacilities ? (
                             <div className="flex justify-center items-center h-full">
                                <Spinner message={`Searching for ${facilityType}s...`} />
                             </div>
                         ) : !location ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 mt-4">{t('locations.enterLocation')}</p>
                         ) : facilitiesWithDistance.length > 0 ? facilitiesWithDistance.map(facility => (
                            <button key={facility.id} onClick={() => flyToLocation(facility.lat, facility.lng)} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{facility.name}</h3>
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{facility.distance?.toFixed(2)} km</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{facility.type}</p>
                            </button>
                        )) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 mt-4">{t('locations.noResults')} {facilityType}s {t('locations.noResultsEnd')}</p>
                        )}
                    </div>
                </Card>
            </div>
            <div className="lg:w-2/3 h-3/5 lg:h-full">
                <Card className="h-full p-0 overflow-hidden">
                    <div ref={mapContainerRef} className="h-full w-full" />
                </Card>
            </div>
        </div>
    );
};

export default LocationsMap;