import React, { useState, useMemo, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import type { Doctor, AppUser } from '../../types';
import { SPECIALTIES, TIME_SLOTS } from '../../constants';
import { geocodeAddress, findNearbyDoctors } from '../../services/locationService';
import { bookAppointment } from '../../services/firebaseService';
import { SearchIcon, LocationMarkerIcon, PhoneIcon, WebsiteIcon } from '../layout/Icons';

// Haversine formula to calculate distance
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1) return Infinity;
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

const today = new Date().toISOString().split('T')[0];

const BookingModal: React.FC<{ doctor: Doctor; onClose: () => void; onBook: (doctor: Doctor, date: string, slot: string) => void }> = ({ doctor, onClose, onBook }) => {
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>
                <p className="text-lg mb-1">with <span className="font-semibold">{doctor.name}</span></p>
                <p className="text-md text-gray-600 dark:text-gray-400 mb-6">{doctor.specialty}</p>

                <div className="mb-4">
                    <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Date</label>
                    <input type="date" id="appointmentDate" value={selectedDate} min={today} onChange={(e) => setSelectedDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>

                <h3 className="text-lg font-semibold mb-2">Select a Time Slot</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map(slot => (
                        <button key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2 rounded-md text-sm text-center ${selectedSlot === slot ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                            {slot}
                        </button>
                    ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => selectedSlot && onBook(doctor, selectedDate, selectedSlot)} disabled={!selectedSlot || !selectedDate}>
                        Confirm Booking
                    </Button>
                </div>
            </Card>
        </div>
    );
};

interface EConsultationProps {
    user: AppUser;
    specialty?: string;
}

const EConsultation: React.FC<EConsultationProps> = ({ user, specialty: initialSpecialty }) => {
    const [specialty, setSpecialty] = useState(initialSpecialty || '');
    const [radius, setRadius] = useState(10);
    const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

    useEffect(() => {
        if (initialSpecialty) {
            setSpecialty(initialSpecialty);
        }
    }, [initialSpecialty]);
    
    useEffect(() => {
        if (location) {
            const fetchDoctors = async () => {
                setIsLoadingDoctors(true);
                const results = await findNearbyDoctors(specialty, location.lat, location.lng);
                setDoctors(results);
                setIsLoadingDoctors(false);
            };
            fetchDoctors();
        }
    }, [location, specialty]);


    const handleLocationSearch = async () => {
        setIsLocating(true);
        setLocationError('');
        setDoctors([]);
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
        setDoctors([]);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setSearchQuery("My Current Location");
                setIsLocating(false);
            },
            () => {
                setLocationError("Unable to retrieve your location. Please enable location services in your browser.");
                setIsLocating(false);
            }
        );
    };

    const doctorsWithDistance = useMemo(() => {
        if (!location) return [];
        return doctors.map(doc => ({
            ...doc,
            distance: haversineDistance(location.lat, location.lng, doc.lat, doc.lng)
        }));
    }, [location, doctors]);

    const filteredDoctors = useMemo(() => {
        return doctorsWithDistance
            .filter(doc => doc.distance <= radius)
            .sort((a, b) => a.distance - b.distance);
    }, [radius, doctorsWithDistance]);
    
    useEffect(() => {
        if(confirmation) {
            const timer = setTimeout(() => setConfirmation(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmation])

    const handleBookAppointment = async (doctor: Doctor, date: string, slot: string) => {
        console.log('Attempting to book appointment:', { doctor: doctor.name, date, slot, user: user.uid });
        
        const success = await bookAppointment(user, doctor, date, slot);
        if (success) {
            setConfirmation(`✅ Appointment successfully booked with ${doctor.name} on ${date} at ${slot}.`);
        } else {
             setConfirmation(`❌ Failed to book appointment. Please check the browser console for errors and try again.`);
        }
        setBookingDoctor(null);
    };

    const renderDoctorList = () => {
        if (isLoadingDoctors) {
            return <Spinner message={`Searching for ${specialty || 'doctors'}...`} />;
        }
        if (!location) {
             return (
                <Card>
                    <p className="text-center text-gray-500 dark:text-gray-400">Please enter a location to find nearby doctors.</p>
                </Card>
            );
        }
        if (filteredDoctors.length > 0) {
            return filteredDoctors.map(doctor => (
                <Card key={doctor.id}>
                    <div className="flex flex-col md:flex-row justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{doctor.name}</h3>
                        <p className="text-blue-600 dark:text-blue-400">{doctor.specialty}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{doctor.address}</p>
                         <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <PhoneIcon />
                                {doctor.phone ? (
                                    <a href={`tel:${doctor.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">{doctor.phone}</a>
                                ) : (
                                    <span>Not available</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <WebsiteIcon />
                                {doctor.website ? (
                                    <a href={doctor.website.startsWith('http') ? doctor.website : `https://${doctor.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">Visit Website</a>
                                ) : (
                                    <span>Not available</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-left md:text-right">
                        <p className="font-semibold">{doctor.distance.toFixed(2)} km away</p>
                        <Button onClick={() => setBookingDoctor(doctor)} className="mt-2">Book Appointment</Button>
                    </div>
                    </div>
                </Card>
            ));
        }
        return (
            <Card>
                <p className="text-center text-gray-500 dark:text-gray-400">No doctors found matching your criteria. Try expanding the search radius or changing the specialty.</p>
            </Card>
        );
    };

  return (
    <div className="max-w-6xl mx-auto">
      {confirmation && (
        <div className={`px-4 py-3 rounded-lg relative mb-6 ${confirmation.startsWith('Failed') ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`} role="alert">
            <strong className="font-bold">{confirmation.startsWith('Failed') ? 'Error!' : 'Success!'} </strong>
            <span className="block sm:inline">{confirmation}</span>
        </div>
      )}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
                 <label htmlFor="search-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Location</label>
                <div className="mt-1 flex gap-2">
                    <input type="text" id="search-location" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g., New York, NY" className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    <Button onClick={handleLocationSearch} isLoading={isLocating} className="!px-3"><SearchIcon /></Button>
                    <Button onClick={handleUseMyLocation} isLoading={isLocating} className="!px-3" variant="secondary"><LocationMarkerIcon /></Button>
                </div>
                {locationError && <p className="text-red-500 text-xs mt-1">{locationError}</p>}
            </div>
            <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specialty</label>
                <select id="specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value="">All Specialties</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Radius ({radius} km)</label>
                <input type="range" id="radius" min="1" max="50" value={radius} onChange={e => setRadius(Number(e.target.value))} className="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
            </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        {renderDoctorList()}
      </div>

      {bookingDoctor && <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} onBook={handleBookAppointment} />}
    </div>
  );
};

export default EConsultation;
