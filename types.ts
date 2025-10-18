export interface Prediction {
  disease: string;
  description: string;
  reasoning: string;
  confidence: number;
}

export interface DiseasePredictionResponse {
  disclaimer: string;
  predictions: Prediction[];
  next_steps: string[];
}

export interface RiskScore {
  risk_category: string;
  score: number;
  explanation: string;
}

export interface RiskAnalysisResponse {
  disclaimer:string;
  risk_scoreboard: RiskScore[];
  recommendations: string[];
}

export interface ReportParameter {
  parameter: string;
  value: string;
  normal_range: string;
  explanation: string;
  analogy: string;
  recommendation: string;
}

export interface EReportResponse {
  disclaimer: string;
  overall_summary: string;
  parameter_breakdown: ReportParameter[];
}

export interface Meal {
  name: string;
  description: string;
  calories: number;
}

export interface DailyPlan {
  day: number;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal[];
  };
  daily_focus: string;
}

export interface DietPlanResponse {
  disclaimer:string;
  plan: DailyPlan[];
  hydration_tips: string[];
}

export interface Doctor {
    id: number;
    name: string;
    specialty: string;
    address: string;
    phone?: string;
    website?: string;
    lat: number;
    lng: number;
    distance?: number;
}

export interface HealthcareFacility {
    id: number;
    name: string;
    type: 'Hospital' | 'Clinic' | 'Pharmacy';
    address: string;
    lat: number;
    lng: number;
    distance?: number;
}

export interface NominatimFacilityResult {
    osm_id: number;
    lat: string;
    lon: string;
    display_name: string;
    type: string; // e.g., 'hospital', 'clinic', 'pharmacy'
    extratags?: {
        website?: string;
        "contact:phone"?: string;
        phone?: string;
    }
}

export interface Appointment {
    id: string;
    userId: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorAddress: string;
    date: string;
    slot: string;
}

export interface GeocodedLocation {
    lat: string;
    lon: string;
    display_name: string;
}

// A serializable, lightweight representation of the authenticated user.
export interface AppUser {
  uid: string;
  email: string | null;
}

// Comprehensive user profile data stored locally
export interface UserProfileData {
    name: string;
    age: string;
    gender: string;
    weight: string;
    height: string;
    photo: string; // Base64 encoded string
    conditions: string;
    surgeries: string;
}