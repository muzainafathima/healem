
import React, { useState, useCallback } from 'react';
import { getDiseasePrediction } from '../../services/geminiService';
import type { DiseasePredictionResponse, UserProfileData } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface DiseasePredictorProps {
    navigate: (page: 'consult', props: { specialty: string }) => void;
    userProfile: UserProfileData | null;
}

const getSpecialtyForDisease = (disease: string): string => {
    const diseaseLower = disease.toLowerCase();
    
    // Cardiovascular
    if (diseaseLower.includes('heart') || diseaseLower.includes('cardiac') || diseaseLower.includes('hypertension') || diseaseLower.includes('cholesterol') || diseaseLower.includes('vascular')) {
        return 'Cardiology';
    }
    // Skin
    if (diseaseLower.includes('skin') || diseaseLower.includes('acne') || diseaseLower.includes('dermatitis') || diseaseLower.includes('rash') || diseaseLower.includes('psoriasis') || diseaseLower.includes('eczema')) {
        return 'Dermatology';
    }
    // Hormonal
    if (diseaseLower.includes('diabetes') || diseaseLower.includes('thyroid') || diseaseLower.includes('hormone')) {
        return 'Endocrinology';
    }
    // Ear, Nose, Throat
    if (diseaseLower.includes('ear') || diseaseLower.includes('nose') || diseaseLower.includes('throat') || diseaseLower.includes('sinus') || diseaseLower.includes('tonsillitis')) {
        return 'ENT (Otolaryngology)';
    }
    // Digestive
    if (diseaseLower.includes('stomach') || diseaseLower.includes('digestive') || diseaseLower.includes('gut') || diseaseLower.includes('colon') || diseaseLower.includes('liver') || diseaseLower.includes('gastro') || diseaseLower.includes('ibs')) {
        return 'Gastroenterology';
    }
    // Women's Health
    if (diseaseLower.includes('pregnant') || diseaseLower.includes('menstrual') || diseaseLower.includes('uterine') || diseaseLower.includes('ovarian') || diseaseLower.includes('cervical')) {
        return 'Gynecology';
    }
     // Kidney
    if (diseaseLower.includes('kidney') || diseaseLower.includes('renal')) {
        return 'Nephrology';
    }
    // Nervous System
    if (diseaseLower.includes('migraine') || diseaseLower.includes('headache') || diseaseLower.includes('nerve') || diseaseLower.includes('brain') || diseaseLower.includes('seizure')) {
        return 'Neurology';
    }
    // Cancer
    if (diseaseLower.includes('cancer') || diseaseLower.includes('tumor') || diseaseLower.includes('oncology')) {
        return 'Oncology';
    }
    // Eyes
    if (diseaseLower.includes('eye') || diseaseLower.includes('vision') || diseaseLower.includes('glaucoma') || diseaseLower.includes('retina')) {
        return 'Ophthalmology';
    }
    // Bones and Joints
    if (diseaseLower.includes('bone') || diseaseLower.includes('fracture') || diseaseLower.includes('joint') || diseaseLower.includes('orthopedic')) {
        return 'Orthopedics';
    }
    // Children
    if (diseaseLower.includes('child') || diseaseLower.includes('infant') || diseaseLower.includes('pediatric')) {
        return 'Pediatrics';
    }
    // Mental Health
    if (diseaseLower.includes('anxiety') || diseaseLower.includes('depression') || diseaseLower.includes('mental') || diseaseLower.includes('psychiatric') || diseaseLower.includes('stress')) {
        return 'Psychiatry';
    }
    // Lungs
    if (diseaseLower.includes('lung') || diseaseLower.includes('breathing') || diseaseLower.includes('asthma') || diseaseLower.includes('pneumonia') || diseaseLower.includes('pulmonary')) {
        return 'Pulmonology';
    }
    // Autoimmune/Joints
    if (diseaseLower.includes('arthritis') || diseaseLower.includes('lupus') || diseaseLower.includes('rheumatoid')) {
        return 'Rheumatology';
    }
    // Urinary
    if (diseaseLower.includes('bladder') || diseaseLower.includes('urinary') || diseaseLower.includes('prostate')) {
        return 'Urology';
    }
    
    // Default fallback
    return 'General Practice';
};

const DiseasePredictor: React.FC<DiseasePredictorProps> = ({ navigate, userProfile }) => {
  const [formData, setFormData] = useState({
    age: userProfile?.age || '',
    gender: userProfile?.gender || '',
    symptoms: '',
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiseasePredictionResponse | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const { age, gender, symptoms, duration } = formData;
    if (!age || !gender || !symptoms || !duration) {
      setError('Please fill out all fields.');
      setLoading(false);
      return;
    }

    const prediction = await getDiseasePrediction(symptoms, parseInt(age), gender, duration);
    if (prediction) {
      setResult(prediction);
    } else {
      setError('Failed to get a prediction. The AI service may be unavailable. Please try again later.');
    }
    setLoading(false);
  }, [formData]);

  const renderResult = () => {
    if (!result) return null;

    const topPrediction = result.predictions.length > 0 ? result.predictions[0] : null;
    const suggestedSpecialty = topPrediction ? getSpecialtyForDisease(topPrediction.disease) : 'General Practice';


    return (
      <Card className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Prediction Results</h2>
        <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 mb-6">
          <p><span className="font-bold">Disclaimer:</span> {result.disclaimer}</p>
        </div>

        <div className="space-y-6">
          {result.predictions.map((p, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{p.disease}</h3>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(p.confidence * 100)}%
                </span>
              </div>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{p.description}</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">Reasoning:</span> {p.reasoning}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">Recommended Next Steps</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                {result.next_steps.map((step, i) => <li key={i}>{step}</li>)}
            </ul>
        </div>
        {topPrediction && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Need a Specialist?</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Based on your results, we suggest consulting a <strong>{suggestedSpecialty}</strong> specialist.
              </p>
              <Button onClick={() => navigate('consult', { specialty: suggestedSpecialty })}>
                Find a {suggestedSpecialty} Doctor Near You
              </Button>
            </div>
        )}
      </Card>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                    <input type="number" name="age" id="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Describe your symptoms</label>
                <textarea name="symptoms" id="symptoms" rows={4} value={formData.symptoms} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., persistent cough, headache, fatigue..."></textarea>
            </div>
            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration of symptoms</label>
                <input type="text" name="duration" id="duration" value={formData.duration} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., 3 days, 2 weeks..." />
            </div>
            <div>
                <Button type="submit" isLoading={loading} disabled={loading} className="w-full">
                    Get Prediction
                </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </Card>
      
      {loading && <div className="mt-8"><Spinner message="AI is analyzing your symptoms..." /></div>}
      {renderResult()}
    </div>
  );
};

export default DiseasePredictor;