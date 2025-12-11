import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type Auth,
  type User,
  type AuthError
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import type { Doctor, Appointment, AppUser } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBZjafdO0LQvc7Ry4JUi_QomHdniFAzYGo",
  authDomain: "iwc-health-pro.firebaseapp.com",
  databaseURL: "https://iwc-health-pro-default-rtdb.firebaseio.com",
  projectId: "iwc-health-pro",
  storageBucket: "iwc-health-pro.firebasestorage.app",
  messagingSenderId: "905313749463",
  appId: "1:905313749463:web:286b401b40e3cd5bbe2392",
  measurementId: "G-F95R7BYC0V"
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db = getFirestore(app);

// --- AUTH FUNCTIONS ---

export const signUp = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- FIRESTORE FUNCTIONS ---

export const bookAppointment = async (user: AppUser, doctor: Doctor, date: string, slot: string) => {
    try {
        console.log('Booking appointment with:', { user: user.uid, doctor: doctor.name, date, slot });
        
        if (!user || !user.uid) {
            console.error('User not authenticated');
            return false;
        }
        
        const docRef = await addDoc(collection(db, "appointments"), {
            userId: user.uid,
            doctorName: doctor.name,
            doctorSpecialty: doctor.specialty,
            doctorAddress: doctor.address,
            date: date,
            slot: slot,
            createdAt: Timestamp.now()
        });
        
        console.log('Appointment booked successfully with ID:', docRef.id);
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        console.error("Error code:", e.code);
        console.error("Error message:", e.message);
        return false;
    }
};

export const getUserAppointments = async (user: AppUser): Promise<Appointment[]> => {
    try {
        const q = query(collection(db, "appointments"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const appointments: Appointment[] = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // The `date` field in Firestore might be a string (from newer bookings)
            // or a Timestamp. We must handle both and convert to a consistent,
            // serializable string format to prevent circular reference errors in React state.
            let cleanDate: string;
            const dateValue = data.date;

            if (dateValue && typeof dateValue.toDate === 'function') {
                // It's a Firestore Timestamp, convert it to a YYYY-MM-DD string.
                cleanDate = dateValue.toDate().toISOString().split('T')[0];
            } else if (typeof dateValue === 'string') {
                // It's already a string, use it as is.
                cleanDate = dateValue;
            } else {
                // Handle unexpected cases gracefully.
                console.warn(`Appointment ${doc.id} has an invalid date format.`, dateValue);
                cleanDate = new Date().toISOString().split('T')[0]; // Fallback
            }
    
            const appointment: Appointment = {
                id: doc.id,
                userId: data.userId,
                doctorName: data.doctorName,
                doctorSpecialty: data.doctorSpecialty,
                doctorAddress: data.doctorAddress,
                date: cleanDate, // Use the sanitized string date.
                slot: data.slot
            };
            appointments.push(appointment);
        });

        // Sort by date, most recent first. Using localeCompare is safer for YYYY-MM-DD strings.
        return appointments.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
        console.error("Error fetching user appointments:", error);
        return []; // Return an empty array on failure.
    }
};

export const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
    try {
        console.log('Canceling appointment with ID:', appointmentId);
        
        const appointmentRef = doc(db, "appointments", appointmentId);
        await deleteDoc(appointmentRef);
        
        console.log('Appointment canceled successfully');
        return true;
    } catch (error) {
        console.error("Error canceling appointment:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        return false;
    }
};
