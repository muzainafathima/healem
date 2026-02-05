import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import type { Doctor, HealthcareFacility, AppUser } from '../../types';
import { SPECIALTIES, TIME_SLOTS } from '../../constants';
import { geocodeAddress, findNearbyDoctors, findNearbyFacilities } from '../../services/locationService';
import { bookAppointment } from '../../services/firebaseService';
import { SearchIcon, LocationMarkerIcon, PhoneIcon, WebsiteIcon } from '../layout/Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { isNativePlatform } from '../../utils/capacitor';

// Haversine formula to calculate distance
const haversineDistance = (lat1: number | undefined, lon1: number | undefined, lat2: number, lon2: number) => {
  if (lat1 === undefined || lon1 === undefined) return Infinity;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Fix for default icon paths in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const today = new Date().toISOString().split('T')[0];

const BookingModal: React.FC<{ 
  doctor: Doctor; 
  onClose: () => void; 
  onBook: (doctor: Doctor, date: string, slot: string) => void 
}> = ({ doctor, onClose, onBook }) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>
        <p className="text-lg mb-1">with <span className="font-semibold">{doctor.name}</span></p>
        <p className="text-md text-gray-600 dark:text-gray-400 mb-6">{doctor.specialty}</p>

        <div className="mb-4">
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('consult.selectDate')}
          </label>
          <input
            type="date"
            id="appointmentDate"
            value={selectedDate}
            min={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <h3 className="text-lg font-semibold mb-2">{t('consult.selectTime')}</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`p-2 rounded-md text-sm text-center ${
                selectedSlot === slot
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              if (selectedSlot) onBook(doctor, selectedDate, selectedSlot);
            }}
            disabled={!selectedSlot}
            className="flex-1"
          >
            {t('consult.confirmBooking')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const FindDoctors: React.FC = () => {
  const { t } = useLanguage();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const facilityMarkersRef = useRef<L.Marker[]>([]);

  // View state
  const [activeView, setActiveView] = useState<'map' | 'booking'>('booking');

  // Location state
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Map state
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [facilityType, setFacilityType] = useState<'hospital' | 'clinic' | 'pharmacy'>('hospital');
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);

  // Booking state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [specialty, setSpecialty] = useState<string>('');
  const [radius, setRadius] = useState<number>(5);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success' | 'error'>('idle');

  // Initialize map
  useEffect(() => {
    if (activeView === 'map' && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current && activeView !== 'map') {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activeView]);

  // Update map view when location changes
  useEffect(() => {
    if (mapRef.current && location && activeView === 'map') {
      mapRef.current.setView([location.lat, location.lng], 13);

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        const blueIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        userMarkerRef.current = L.marker([location.lat, location.lng], { icon: blueIcon })
          .addTo(mapRef.current)
          .bindPopup(t('consult.yourLocation'))
          .openPopup();
      }
    }
  }, [location, activeView, t]);

  // Handle location search
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsLocating(true);
    setLocationError('');

    try {
      const coords = await geocodeAddress(searchQuery);
      if (coords) {
        setLocation({ lat: parseFloat(coords.lat), lng: parseFloat(coords.lon) });
      } else {
        setLocationError('Location not found. Please try a different search.');
      }
    } catch (error) {
      setLocationError('Failed to search location. Please try again.');
    } finally {
      setIsLocating(false);
    }
  };

  // Handle get current location
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError('');

    try {
      if (isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition();
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setIsLocating(false);
          },
          () => {
            setLocationError('Unable to retrieve your location. Please enter a location manually.');
            setIsLocating(false);
          }
        );
        return;
      }
    } catch (error) {
      setLocationError('Unable to retrieve your location. Please enter a location manually.');
    } finally {
      setIsLocating(false);
    }
  };

  // Search for doctors (for booking view)
  const searchDoctors = async () => {
    let currentLocation = location;
    
    // If no location but there's a search query, geocode it first
    if (!currentLocation && searchQuery.trim()) {
      setIsSearching(true);
      try {
        const coords = await geocodeAddress(searchQuery);
        if (coords) {
          currentLocation = { lat: parseFloat(coords.lat), lng: parseFloat(coords.lon) };
          setLocation(currentLocation);
        } else {
          setLocationError('Location not found. Please try a different search.');
          setIsSearching(false);
          return;
        }
      } catch (error) {
        setLocationError('Failed to search location. Please try again.');
        setIsSearching(false);
        return;
      }
    }
    
    if (!currentLocation) {
      alert(t('consult.enterLocation'));
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for doctors with specialty:', specialty, 'at location:', currentLocation);
      const nearbyDoctors = await findNearbyDoctors(specialty, currentLocation.lat, currentLocation.lng);
      console.log('Found doctors:', nearbyDoctors);
      setDoctors(nearbyDoctors);
    } catch (error) {
      console.error('Error searching for doctors:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search for facilities (for map view)
  const searchFacilities = async () => {
    if (!location) return;

    setIsLoadingFacilities(true);
    try {
      const query = facilityType.toLowerCase();
      console.log('Searching for facilities with query:', query, 'at location:', location);
      const nearbyFacilities = await findNearbyFacilities(query, location.lat, location.lng);
      console.log('Found facilities:', nearbyFacilities);
      setFacilities(nearbyFacilities);

      // Update markers
      if (mapRef.current) {
        facilityMarkersRef.current.forEach(marker => marker.remove());
        facilityMarkersRef.current = [];

        const redIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        nearbyFacilities.forEach(facility => {
          if (facility.lat && facility.lng && mapRef.current) {
            const marker = L.marker([facility.lat, facility.lng], { icon: redIcon })
              .addTo(mapRef.current)
              .bindPopup(`<b>${facility.name}</b><br>${facility.address || ''}`);
            facilityMarkersRef.current.push(marker);
          }
        });
      }
    } catch (error) {
      console.error('Error searching for facilities:', error);
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  // Load facilities when location or type changes (map view)
  useEffect(() => {
    if (location && activeView === 'map') {
      searchFacilities();
    }
  }, [location, facilityType, activeView]);

  // Handle booking
  const handleBook = async (doctor: Doctor, date: string, slot: string) => {
    setBookingStatus('booking');
    try {
      const currentUser: AppUser = {
        uid: 'demo-user',
        email: 'user@example.com'
      };

      await bookAppointment(currentUser, doctor, date, slot);
      setBookingStatus('success');
      setTimeout(() => {
        setSelectedDoctor(null);
        setBookingStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus('error');
      setTimeout(() => setBookingStatus('idle'), 3000);
    }
  };

  const doctorsWithDistance = useMemo(() => {
    if (!location) return doctors;
    return doctors
      .map(doc => ({
        ...doc,
        distance: haversineDistance(location.lat, location.lng, doc.lat, doc.lng)
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [doctors, location]);

  const facilitiesWithDistance = useMemo(() => {
    if (!location) return facilities;
    return facilities
      .map(f => ({
        ...f,
        distance: haversineDistance(location.lat, location.lng, f.lat || 0, f.lng || 0)
      }))
      .filter(f => f.distance !== Infinity)
      .sort((a, b) => a.distance - b.distance);
  }, [facilities, location]);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl font-bold mb-2">{t('findDoctors.title')}</h1>
        
        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveView('booking')}
            variant={activeView === 'booking' ? 'primary' : 'secondary'}
            className="flex-1"
          >
            {t('findDoctors.bookConsultation')}
          </Button>
          <Button
            onClick={() => setActiveView('map')}
            variant={activeView === 'map' ? 'primary' : 'secondary'}
            className="flex-1"
          >
            {t('findDoctors.viewMap')}
          </Button>
        </div>

        {/* Location Search - Common for both views */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{width: '20px', height: '20px'}}>
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                placeholder={t('locations.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSearchLocation} disabled={isLocating}>
              {isLocating ? <Spinner message="" /> : t('common.search')}
            </Button>
            <Button onClick={handleGetCurrentLocation} disabled={isLocating} variant="secondary">
              <div style={{width: '20px', height: '20px'}}>
                <LocationMarkerIcon />
              </div>
            </Button>
          </div>

          {locationError && (
            <div className="text-red-600 dark:text-red-400 text-sm">{locationError}</div>
          )}
        </div>
      </Card>

      {/* Booking View */}
      {activeView === 'booking' && (
        <Card>
          <h2 className="text-2xl font-bold mb-4">{t('findDoctors.bookConsultation')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('consult.yourLocation')}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchDoctors()}
                placeholder={t('locations.searchPlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('consult.specialty')}
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('consult.selectSpecialty')}</option>
                <option value="all">All Specialities</option>
                {SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('consult.searchRadius')}
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 {t('consult.km')}</option>
                <option value={10}>10 {t('consult.km')}</option>
                <option value={25}>25 {t('consult.km')}</option>
                <option value={50}>50 {t('consult.km')}</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={searchDoctors} disabled={isSearching} className="w-full">
                {isSearching ? <Spinner message="" /> : t('consult.search')}
              </Button>
            </div>
          </div>
          
          {locationError && (
            <div className="text-red-600 dark:text-red-400 text-sm mb-4">{locationError}</div>
          )}

          {!location && <p className="text-gray-600 dark:text-gray-400">{t('consult.enterLocation')}</p>}

          {isSearching && <Spinner />}

          {!isSearching && doctors.length === 0 && location && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              {t('consult.noResults')}
            </p>
          )}

          {doctors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctorsWithDistance.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">{doctor.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{doctor.specialty}</p>
                  
                  {doctor.distance !== Infinity && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                      📍 {doctor.distance.toFixed(1)} km
                    </p>
                  )}

                  {doctor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div style={{width: '16px', height: '16px'}}>
                        <PhoneIcon />
                      </div>
                      <span>{doctor.phone}</span>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{doctor.address}</p>

                  <Button onClick={() => setSelectedDoctor(doctor)} className="w-full">
                    {t('consult.book')}
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {doctors.length === 0 && !isSearching && location && (
            <p className="text-gray-600 dark:text-gray-400">{t('consult.noResults')}</p>
          )}
        </Card>
      )}

      {/* Map View */}
      {activeView === 'map' && (
        <Card>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('locations.facilityType')}
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => setFacilityType('hospital')}
                variant={facilityType === 'hospital' ? 'primary' : 'secondary'}
              >
                {t('locations.hospital')}
              </Button>
              <Button
                onClick={() => setFacilityType('clinic')}
                variant={facilityType === 'clinic' ? 'primary' : 'secondary'}
              >
                {t('locations.clinic')}
              </Button>
              <Button
                onClick={() => setFacilityType('pharmacy')}
                variant={facilityType === 'pharmacy' ? 'primary' : 'secondary'}
              >
                {t('locations.pharmacy')}
              </Button>
            </div>
          </div>

          {!location && <p className="text-gray-600 dark:text-gray-400 mb-4">{t('locations.enterLocation')}</p>}

          <div ref={mapContainerRef} className="h-96 rounded-lg mb-4" />

          {isLoadingFacilities && <Spinner />}

          {!isLoadingFacilities && facilities.length === 0 && location && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No {facilityType}s found in this area. Try a different location.
            </p>
          )}

          {facilitiesWithDistance.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2">
                Found {facilitiesWithDistance.length} {facilityType === 'hospital' ? t('locations.hospital') : facilityType === 'clinic' ? t('locations.clinic') : t('locations.pharmacy')}
              </h3>
              {facilitiesWithDistance.map((facility, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold">{facility.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{facility.address}</p>
                  {facility.distance !== Infinity && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">📍 {facility.distance.toFixed(1)} km</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onBook={handleBook}
        />
      )}

      {/* Booking Status Messages */}
      {bookingStatus === 'booking' && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {t('consult.booking')}
        </div>
      )}

      {bookingStatus === 'success' && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {t('consult.success')}
        </div>
      )}

      {bookingStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {t('consult.error')}
        </div>
      )}
    </div>
  );
};

export default FindDoctors;
