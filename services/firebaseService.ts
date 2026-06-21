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
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import type { Doctor, Appointment, AppUser, UserProfileData } from '../types';

// Firebase web config is read from environment variables (set VITE_FIREBASE_*
// in Vercel). Fallback values are kept so existing deployments keep working,
// but production should rely on the env vars and rotate the keys below.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBZjafdO0LQvc7Ry4JUi_QomHdniFAzYGo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "iwc-health-pro.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "https://iwc-health-pro-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "iwc-health-pro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "iwc-health-pro.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "905313749463",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:905313749463:web:286b401b40e3cd5bbe2392",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-F95R7BYC0V"
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

// --- USER PROFILE (server-side, replaces localStorage-only storage) ---
// Storing the health profile in Firestore (keyed by uid) means it survives
// device changes, can be audited, and — importantly for DPDP — can be
// fully exported and deleted on request.

export const saveUserProfile = async (user: AppUser, profile: UserProfileData): Promise<boolean> => {
    try {
        await setDoc(doc(db, "profiles", user.uid), { ...profile, updatedAt: Timestamp.now() });
        return true;
    } catch (error) {
        console.error("Error saving user profile:", error);
        return false;
    }
};

export const getUserProfile = async (user: AppUser): Promise<UserProfileData | null> => {
    try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        return snap.exists() ? (snap.data() as UserProfileData) : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

// --- DPDP COMPLIANCE: Right to erasure ---
// Deletes all of a user's data (appointments + profile) and the auth account.
export const deleteAllUserData = async (user: AppUser): Promise<boolean> => {
    try {
        const apptQuery = query(collection(db, "appointments"), where("userId", "==", user.uid));
        const appts = await getDocs(apptQuery);
        await Promise.all(appts.docs.map((d) => deleteDoc(d.ref)));

        await deleteDoc(doc(db, "profiles", user.uid)).catch(() => {});

        // Remove any locally cached data as well.
        try {
            localStorage.removeItem('userProfile');
        } catch { /* ignore */ }

        // Finally delete the Firebase Auth account (requires a recent login).
        if (auth.currentUser) {
            await deleteUser(auth.currentUser);
        }
        return true;
    } catch (error) {
        console.error("Error deleting user data:", error);
        return false;
    }
};
