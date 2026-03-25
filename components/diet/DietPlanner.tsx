
import React, { useState, useCallback, useEffect } from 'react';
import { getDietPlan } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import type { DietPlanResponse, DailyPlan } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface DietPlannerProps {
  lifestyleData?: Record<string, string>;
}

const MealCard: React.FC<{ meal: DailyPlan }> = ({ meal }) => {
  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">Day {meal.day}</h3>
      <p className="italic text-gray-600 dark:text-gray-400 mb-4">{meal.daily_focus}</p>
      <div className="space-y-3">
        <div>
            <h4 className="font-semibold">Breakfast: {meal.meals.breakfast.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-500">{meal.meals.breakfast.description} (~{meal.meals.breakfast.calories} kcal)</p>
        </div>
        <div>
            <h4 className="font-semibold">Lunch: {meal.meals.lunch.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-500">{meal.meals.lunch.description} (~{meal.meals.lunch.calories} kcal)</p>
        </div>
        <div>
            <h4 className="font-semibold">Dinner: {meal.meals.dinner.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-500">{meal.meals.dinner.description} (~{meal.meals.dinner.calories} kcal)</p>
        </div>
         {meal.meals.snacks.length > 0 && (
            <div>
                <h4 className="font-semibold">Snacks</h4>
                {meal.meals.snacks.map((snack, index) => (
                     <p key={index} className="text-sm text-gray-500 dark:text-gray-500">{snack.name} (~{snack.calories} kcal)</p>
                ))}
            </div>
         )}
      </div>
    </Card>
  );
};


const DietPlanner: React.FC<DietPlannerProps> = ({ lifestyleData }) => {
  const { t, getLanguageName } = useLanguage();
  const [formData, setFormData] = useState({
    goal: 'Weight Loss',
    preferences: '',
    allergies: '',
    calories: '2000',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DietPlanResponse | null>(null);

  // Auto-adjust goal based on lifestyle data if available
  useEffect(() => {
    if (lifestyleData) {
      // Adjust goal based on weight status
      if (lifestyleData.weight === 'Overweight' || lifestyleData.weight === 'Obese') {
        setFormData(prev => ({ ...prev, goal: 'Weight Loss' }));
      } else if (lifestyleData.weight === 'Underweight') {
        setFormData(prev => ({ ...prev, goal: 'Muscle Gain' }));
      }
      
      // Adjust based on family history
      if (lifestyleData.familyHistory?.includes('diabetes')) {
        setFormData(prev => ({ ...prev, goal: 'Diabetes Management' }));
      } else if (lifestyleData.familyHistory?.includes('heart')) {
        setFormData(prev => ({ ...prev, goal: 'Heart Health' }));
      }
    }
  }, [lifestyleData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    const { goal, preferences, allergies, calories } = formData;
    if (!goal || !calories) {
      setError('Please fill out all required fields.');
      setLoading(false);
      return;
    }
    
    const plan = await getDietPlan(goal, preferences, allergies, calories, getLanguageName(), lifestyleData);
    if (plan) {
      setResult(plan);
    } else {
      setError('Failed to generate a diet plan. Please try again later.');
    }
    setLoading(false);
  }, [formData, lifestyleData, getLanguageName]);

  return (
    <div className="max-w-2xl mx-auto">
      {lifestyleData && (
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-l-4 border-green-500">
          <p className="text-lg text-gray-800 dark:text-gray-100">
            ✨ <strong>Great!</strong> We'll create a diet plan tailored to your lifestyle check results for better health outcomes.
          </p>
        </Card>
      )}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('diet.primaryGoal')}</label>
              <select name="goal" id="goal" value={formData.goal} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="Weight Loss">{t('diet.weightLoss')}</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Diabetes Management">Diabetes Management</option>
                <option value="Heart Health">Heart Health</option>
              </select>
            </div>
            <div>
              <label htmlFor="calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('diet.targetCalories')}</label>
              <input type="number" name="calories" id="calories" value={formData.calories} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('diet.dietaryPreferences')}</label>
            <input type="text" name="preferences" id="preferences" value={formData.preferences} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('diet.allergiesToAvoid')}</label>
            <input type="text" name="allergies" id="allergies" value={formData.allergies} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <Button type="submit" isLoading={loading} disabled={loading} className="w-full">{t('diet.generatePlan')}</Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </Card>
      
      {loading && <div className="mt-8"><Spinner message="AI is crafting your personalized diet plan..." /></div>}
      
      {result && (
        <div className="mt-8">
            <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 mb-6">
                <p><span className="font-bold">Disclaimer:</span> {result.disclaimer}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {result.plan.map(dayPlan => <MealCard key={dayPlan.day} meal={dayPlan} />)}
            </div>
            <Card className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Hydration Tips</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    {result.hydration_tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
            </Card>
        </div>
      )}
    </div>
  );
};

export default DietPlanner;
