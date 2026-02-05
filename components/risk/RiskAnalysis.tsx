
import React, { useState, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getRiskAnalysis } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RiskAnalysisResponse, UserProfileData } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface RiskAnalysisProps {
    userProfile: UserProfileData | null;
    navigate?: (page: 'diet', props: { lifestyleData: Record<string, string> }) => void;
}

const baseQuestions = [
  { id: 'exercise', text: 'How many days a week do you engage in moderate exercise (e.g., brisk walking)?', options: ['0-1 days', '2-3 days', '4-5 days', '6-7 days'] },
  { id: 'diet', text: 'How would you describe your diet?', options: ['High in processed foods', 'Balanced', 'Mostly whole foods', 'Very healthy/plant-based'] },
  { id: 'smoking', text: 'Do you smoke cigarettes?', options: ['Yes, daily', 'Yes, occasionally', 'Former smoker', 'Never'] },
  { id: 'alcohol', text: 'How often do you consume alcohol?', options: ['Daily', 'Several times a week', 'Once a week', 'Rarely/Never'] },
  { id: 'stress', text: 'How would you rate your daily stress level?', options: ['High', 'Moderate', 'Low', 'Very Low'] },
  { id: 'sleep', text: 'On average, how many hours of sleep do you get per night?', options: ['< 6 hours', '6-7 hours', '7-8 hours', '> 8 hours'] },
  { id: 'familyHistory', text: 'Do you have a family history of major diseases (heart disease, diabetes, cancer)?', options: ['Yes, immediate family', 'Yes, extended family', 'No', "I don't know"] },
  { id: 'weight', text: 'How would you describe your current weight?', options: ['Underweight', 'Healthy weight', 'Overweight', 'Obese'] },
  { id: 'bloodPressure', text: 'Do you know your typical blood pressure?', options: ['Normal', 'Elevated/High', 'Low', "I don't know"] },
];

const femaleQuestions = [
    { id: 'pregnancyStatus', text: 'Are you currently pregnant or have you been in the last year?', options: ['Yes', 'No', 'Not Applicable'] },
    { id: 'menstrualCycle', text: 'Is your menstrual cycle regular?', options: ['Yes', 'Irregular', 'Menopausal/Not Applicable'] },
    { id: 'historyOfPCOS', text: 'Have you been diagnosed with Polycystic Ovary Syndrome (PCOS)?', options: ['Yes', 'No', 'Unsure'] },
];

const maleQuestions = [
    { id: 'prostateIssues', text: 'Have you experienced prostate issues (e.g., frequent urination)?', options: ['Yes', 'No', 'Unsure'] },
    { id: 'testosteroneLevels', text: 'Do you know if you have low testosterone levels?', options: ['Yes, diagnosed', 'No', 'Unsure'] },
];

const GaugeChart = ({ value, name }: { value: number, name: string }) => {
  const data = [
    { name: 'Score', value: value },
    { name: 'Remaining', value: 100 - value },
  ];
  const COLORS = ['#ef4444', '#f87171', '#fbbf24', '#a3e635', '#4ade80'];
  const color = value > 80 ? COLORS[0] : value > 60 ? COLORS[1] : value > 40 ? COLORS[2] : value > 20 ? COLORS[3] : COLORS[4];
  
  return (
    <div className="w-48 h-32 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#e0e0e0" />
          </Pie>
           <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-2xl font-bold" style={{color: color}}>{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{name}</p>
      </div>
    </div>
  );
};

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ userProfile, navigate }) => {
  const { t, getLanguageName } = useLanguage();
  const [formData, setFormData] = useState({
    age: userProfile?.age || '',
    gender: userProfile?.gender || '',
    exercise: '',
    diet: '',
    smoking: '',
    alcohol: '',
    stress: '',
    sleep: '',
    familyHistory: '',
    weight: '',
    bloodPressure: '',
    // Female-specific
    pregnancyStatus: '',
    menstrualCycle: '',
    historyOfPCOS: '',
    // Male-specific
    prostateIssues: '',
    testosteroneLevels: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskAnalysisResponse | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleButtonChange = (questionId: string, value: string) => {
    setFormData({ ...formData, [questionId]: value });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields: (keyof typeof formData)[] = [
        'age', 'gender', 'exercise', 'diet', 'smoking', 'alcohol', 'stress', 'sleep', 'familyHistory', 'weight', 'bloodPressure'
    ];
    if (formData.gender === 'Female') {
        requiredFields.push('pregnancyStatus', 'menstrualCycle', 'historyOfPCOS');
    }
    if (formData.gender === 'Male') {
        requiredFields.push('prostateIssues', 'testosteroneLevels');
    }

    const isInvalid = requiredFields.some(field => !formData[field]);
    
    if (isInvalid) {
      setError('Please answer all questions, including the gender-specific ones that appear.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    console.log('🚀 Starting risk analysis...');
    const analysis = await getRiskAnalysis(formData, getLanguageName());
    if (analysis) {
      console.log('✅ Risk analysis successful');
      setResult(analysis);
    } else {
      console.error('❌ Risk analysis failed');
      setError('Failed to get lifestyle check. Please check the browser console for detailed error information and try again later.');
    }
    setLoading(false);
  }, [formData]);

  const renderResult = () => {
    if (!result) return null;

    return (
      <Card className="mt-8">
        {/* Positive Framing Opener */}
        <div className="mb-6 p-5 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-l-4 border-green-500">
          <p className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed">
            🌟 <strong>Great job checking in on your health!</strong> Here's a friendly look at what your lifestyle shows and how small daily tweaks can help you feel even better.
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Your Lifestyle Check</h2>
        
        <h3 className="text-xl font-semibold mb-4 text-center">Your Health Snapshot</h3>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {result.risk_scoreboard.map(risk => (
            <div key={risk.risk_category} className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <GaugeChart value={risk.score} name={risk.risk_category} />
              <p className="text-center text-sm mt-2 max-w-xs text-gray-600 dark:text-gray-400">{risk.explanation}</p>
            </div>
          ))}
        </div>
        
        {/* Quick Lifestyle Snapshot */}
        <div className="mb-6 p-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-200">📋 Quick Lifestyle Snapshot</h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="mr-2">🍽️</span>
              <span><strong>Diet:</strong> Choose lighter cooking—try steamed idli, ragi dosa, or moong dal over heavy fried items. Add a handful of greens to your sambar daily.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🚶</span>
              <span><strong>Activity:</strong> A short 15-20 minute evening walk can boost your energy and mood. Every step counts!</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💤</span>
              <span><strong>Rest & Hydration:</strong> Aim for 7-8 hours of sleep and drink plenty of water throughout the day—it helps everything work better.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">😌</span>
              <span><strong>Stress:</strong> Take short breaks, practice deep breathing, or try light yoga to keep stress in check.</span>
            </li>
          </ul>
        </div>

        {/* Practical Micro-Tips */}
        <div className="mb-6 p-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-200">✨ 5 Easy Steps You Can Start Today</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Add a handful of spinach or methi to your sambar or curry</li>
            <li>Take a 10-15 minute walk after dinner—it aids digestion</li>
            <li>Swap sugary drinks with buttermilk, nimbu paani, or coconut water</li>
            <li>Include one serving of whole grains like brown rice or ragi in your day</li>
            <li>Set a regular bedtime and wake-up time, even on weekends</li>
          </ol>
        </div>

        <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
        </ul>

        {/* Diet Planner Navigation */}
        {navigate && (
          <div className="mb-6">
            <Button 
              onClick={() => navigate('diet', { lifestyleData: formData })} 
              className="w-full"
            >
              🥗 Get Personalized Diet Plan Based on Your Lifestyle
            </Button>
          </div>
        )}

        {/* Motivational Close + Disclaimer */}
        <div className="p-5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-gray-800 dark:text-gray-100 mb-3">
            💪 <strong>Small steps add up—you've got this!</strong> Track how you feel in a week and celebrate your progress.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            <span className="font-semibold">Important:</span> {result.disclaimer} These are general lifestyle ideas only—please consult your doctor for personalized medical advice.
          </p>
        </div>
      </Card>
    );
  };
  
  const renderQuestions = (questions: {id: string, text: string, options: string[]}[]) => {
      return questions.map((q) => (
        <div key={q.id} className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{q.text}</label>
            <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => handleButtonChange(q.id, option)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    formData[q.id as keyof typeof formData] === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    {option}
                </button>
                ))}
            </div>
        </div>
    ));
  }


  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                    <input type="number" name="age" id="age" value={formData.age} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select name="gender" id="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {renderQuestions(baseQuestions)}
                
                {formData.gender === 'Female' && renderQuestions(femaleQuestions)}
                {formData.gender === 'Male' && renderQuestions(maleQuestions)}
                
            </div>
            <div className="mt-8">
                <Button type="submit" isLoading={loading} disabled={loading} className="w-full">
                Check My Lifestyle
                </Button>
            </div>
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        </form>
      </Card>
      {loading && <div className="mt-8"><Spinner message="AI is analyzing your lifestyle habits..." /></div>}
      {result && renderResult()}
    </div>
  );
};

export default RiskAnalysis;