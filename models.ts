
import type { 
  DiseasePredictionResponse, 
  RiskAnalysisResponse, 
  EReportResponse, 
  DietPlanResponse 
} from './types';

/*DISEASE PREDICTION MODEL */
export const runLocalDiseasePredictionModel = (
  symptoms: string, 
  age: number, 
  gender: string, 
  duration: string
): DiseasePredictionResponse => {
  const symptomsLower = symptoms.toLowerCase();
  
  // Disease knowledge base with symptoms and scoring
  const diseases: Array<{
    disease: string;
    description: string;
    reasoning: string;
    confidence: number;
    keywords: string[];
  }> = [
    {
      disease: "Common Cold",
      description: "A viral infection of the upper respiratory tract",
      reasoning: "Common symptoms match typical cold presentation",
      confidence: 0,
      keywords: ["cough", "sneeze", "runny nose", "sore throat", "congestion", "fatigue"]
    },
    {
      disease: "Influenza (Flu)",
      description: "A contagious respiratory illness caused by influenza viruses",
      reasoning: "Symptoms indicate possible flu infection",
      confidence: 0,
      keywords: ["fever", "chills", "muscle ache", "headache", "fatigue", "cough", "sore throat"]
    },
    {
      disease: "Migraine",
      description: "A neurological condition characterized by intense headaches",
      reasoning: "Headache pattern suggests migraine",
      confidence: 0,
      keywords: ["headache", "nausea", "light sensitivity", "visual disturbance", "throbbing", "aura"]
    },
    {
      disease: "Gastroenteritis",
      description: "Inflammation of the digestive tract",
      reasoning: "Digestive symptoms point to gastroenteritis",
      confidence: 0,
      keywords: ["nausea", "vomiting", "diarrhea", "stomach pain", "cramps", "fever", "dehydration"]
    },
    {
      disease: "Allergic Rhinitis",
      description: "Allergic inflammation of the nasal airways",
      reasoning: "Respiratory symptoms suggest allergic reaction",
      confidence: 0,
      keywords: ["sneezing", "itchy", "watery eyes", "runny nose", "congestion", "postnasal drip"]
    },
    {
      disease: "Hypertension",
      description: "High blood pressure condition",
      reasoning: "Symptoms may indicate elevated blood pressure",
      confidence: 0,
      keywords: ["headache", "dizziness", "blurred vision", "chest pain", "shortness of breath", "nosebleed"]
    },
    {
      disease: "Type 2 Diabetes",
      description: "Metabolic disorder affecting blood sugar regulation",
      reasoning: "Symptoms suggest possible diabetes",
      confidence: 0,
      keywords: ["thirst", "frequent urination", "hunger", "fatigue", "blurred vision", "slow healing", "tingling"]
    },
    {
      disease: "Anxiety Disorder",
      description: "Mental health condition causing excessive worry",
      reasoning: "Psychological symptoms indicate anxiety",
      confidence: 0,
      keywords: ["worry", "nervousness", "restless", "panic", "heart racing", "sweating", "insomnia", "trembling"]
    },
    {
      disease: "Asthma",
      description: "Chronic respiratory condition causing airway inflammation",
      reasoning: "Breathing difficulties suggest asthma",
      confidence: 0,
      keywords: ["wheezing", "shortness of breath", "chest tightness", "cough", "difficulty breathing"]
    },
    {
      disease: "Pneumonia",
      description: "Infection that inflames air sacs in the lungs",
      reasoning: "Respiratory symptoms with fever suggest pneumonia",
      confidence: 0,
      keywords: ["cough", "fever", "chills", "chest pain", "shortness of breath", "phlegm", "fatigue"]
    }
  ];

  // Simple scoring algorithm based on keyword matching
  diseases.forEach(disease => {
    let score = 0;
    
    // Keyword matching with weighted scoring
    disease.keywords.forEach(keyword => {
      if (symptomsLower.includes(keyword)) {
        score += 0.15;
      }
    });

    // Age-based adjustments
    if (age > 50) {
      if (["Hypertension", "Type 2 Diabetes"].includes(disease.disease)) {
        score += 0.15;
      }
    }
    
    if (age < 18) {
      if (["Common Cold", "Influenza (Flu)", "Asthma"].includes(disease.disease)) {
        score += 0.1;
      }
    }
    
    // Duration-based adjustments
    if (duration.toLowerCase().includes("weeks") || duration.toLowerCase().includes("months") || duration.toLowerCase().includes("chronic")) {
      if (["Hypertension", "Type 2 Diabetes", "Anxiety Disorder", "Asthma"].includes(disease.disease)) {
        score += 0.15;
      }
    } else if (duration.toLowerCase().includes("days") || duration.toLowerCase().includes("acute")) {
      if (["Common Cold", "Influenza (Flu)", "Gastroenteritis", "Pneumonia"].includes(disease.disease)) {
        score += 0.15;
      }
    }

    // Gender-based adjustments
    if (gender.toLowerCase() === "female" && disease.disease === "Migraine") {
      score += 0.1;
    }

    disease.confidence = Math.min(score, 1);
  });

  // Sort by confidence and take top 3
  const topPredictions = diseases
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map(({ disease, description, reasoning, confidence }) => ({
      disease,
      description,
      reasoning,
      confidence: Math.round(confidence * 100) / 100
    }));

  return {
    disclaimer: "This is a demonstration of a local ML model and should NOT be used for actual medical diagnosis. This is for educational purposes only. Always consult a qualified healthcare professional for medical advice.",
    predictions: topPredictions,
    next_steps: [
      "Monitor your symptoms closely and keep a symptom diary",
      "Stay hydrated and get adequate rest",
      "Consult a healthcare professional if symptoms persist, worsen, or if you have concerns",
      "Take your temperature regularly if you have fever symptoms",
      "Avoid self-medication without consulting a doctor"
    ]
  };
};

/* HEALTH RISK ANALYSIS MODEL*/
export const runLocalRiskAnalysisModel = (healthData: Record<string, string>): RiskAnalysisResponse => {
  const scores: { [key: string]: number } = {
    'Heart Disease': 10,
    'Type 2 Diabetes': 10,
    'General Cancers': 10,
  };

  const recommendations = new Set<string>();

  // AGE FACTOR
  const age = parseInt(healthData.age) || 0;
  if (age > 40) {
    const ageFactor = (age - 40) * 0.5;
    scores['Heart Disease'] += ageFactor;
    scores['Type 2 Diabetes'] += ageFactor * 0.3;
    scores['General Cancers'] += ageFactor * 0.6;
  }

  // EXERCISE FACTOR
  const exerciseMapping: { [key: string]: number } = { 
    '0-1 days': 20, 
    '2-3 days': 10, 
    '4-5 days': -5, 
    '6-7 days': -10 
  };
  const exerciseScore = exerciseMapping[healthData.exercise] || 0;
  scores['Heart Disease'] += exerciseScore;
  scores['Type 2 Diabetes'] += exerciseScore;
  if (exerciseScore > 15) {
    recommendations.add("Regular physical activity is crucial for heart health and blood sugar control. Aim for at least 150 minutes of moderate exercise per week.");
  }

  // DIET FACTOR
  const dietMapping: { [key: string]: number } = { 
    'High in processed foods': 25, 
    'Balanced': 5, 
    'Mostly whole foods': -10, 
    'Very healthy/plant-based': -15 
  };
  const dietScore = dietMapping[healthData.diet] || 0;
  scores['Heart Disease'] += dietScore;
  scores['Type 2 Diabetes'] += dietScore * 1.5;
  scores['General Cancers'] += dietScore * 1.2;
  if (dietScore > 20) {
    recommendations.add("Consider reducing processed foods and sugars. A balanced diet rich in fruits, vegetables, and whole grains can significantly lower your risk.");
  }

  // SMOKING FACTOR
  const smokingMapping: { [key: string]: number } = { 
    'Yes, daily': 40, 
    'Yes, occasionally': 20, 
    'Former smoker': 10, 
    'Never': 0 
  };
  const smokingScore = smokingMapping[healthData.smoking] || 0;
  scores['Heart Disease'] += smokingScore * 1.2;
  scores['General Cancers'] += smokingScore * 1.8;
  if (smokingScore > 15) {
    recommendations.add("Quitting smoking is the most impactful change you can make to reduce cancer and heart disease risk. Consider nicotine replacement therapy or counseling.");
  }

  // ═══════════════════════════════════════════════════════════
  // ALCOHOL FACTOR
  // ═══════════════════════════════════════════════════════════
  const alcoholMapping: { [key: string]: number } = { 
    'Daily': 15, 
    'Several times a week': 8, 
    'Once a week': 2, 
    'Rarely/Never': 0 
  };
  const alcoholScore = alcoholMapping[healthData.alcohol] || 0;
  scores['Heart Disease'] += alcoholScore;
  scores['General Cancers'] += alcoholScore * 1.3;
  if (alcoholScore > 10) {
    recommendations.add("Moderating alcohol intake can help lower your risk for certain cancers and improve cardiovascular health. Limit to 1-2 drinks per day.");
  }

  // ═══════════════════════════════════════════════════════════
  // STRESS FACTOR
  // ═══════════════════════════════════════════════════════════
  const stressMapping: { [key: string]: number } = { 
    'High': 15, 
    'Moderate': 8, 
    'Low': 0, 
    'Very Low': -5 
  };
  const stressScore = stressMapping[healthData.stress] || 0;
  scores['Heart Disease'] += stressScore;
  if (stressScore > 10) {
    recommendations.add("Chronic stress can impact heart health. Explore stress-management techniques like mindfulness, meditation, yoga, or speaking with a therapist.");
  }

  // ═══════════════════════════════════════════════════════════
  // SLEEP FACTOR
  // ═══════════════════════════════════════════════════════════
  const sleepMapping: { [key: string]: number } = { 
    '< 6 hours': 12, 
    '6-7 hours': 5, 
    '7-8 hours': 0, 
    '> 8 hours': 2 
  };
  const sleepScore = sleepMapping[healthData.sleep] || 0;
  scores['Heart Disease'] += sleepScore;
  scores['Type 2 Diabetes'] += sleepScore;
  if (sleepScore > 10) {
    recommendations.add("Aim for 7-8 hours of quality sleep per night. Poor sleep can affect blood pressure, blood sugar, inflammation, and overall health.");
  }

  // ═══════════════════════════════════════════════════════════
  // FAMILY HISTORY FACTOR
  // ═══════════════════════════════════════════════════════════
  const familyHistoryMapping: { [key: string]: number } = { 
    'Yes, immediate family': 20, 
    'Yes, extended family': 10, 
    'No': 0, 
    "I don't know": 5 
  };
  const familyHistoryScore = familyHistoryMapping[healthData.familyHistory] || 0;
  scores['Heart Disease'] += familyHistoryScore;
  scores['Type 2 Diabetes'] += familyHistoryScore;
  scores['General Cancers'] += familyHistoryScore;
  if (familyHistoryScore > 15) {
    recommendations.add("Your family history indicates a higher genetic predisposition. Regular check-ups, genetic counseling, and a healthy lifestyle are especially important for you.");
  }

  // ═══════════════════════════════════════════════════════════
  // WEIGHT FACTOR
  // ═══════════════════════════════════════════════════════════
  const weightMapping: { [key: string]: number } = { 
    'Underweight': 5, 
    'Healthy weight': 0, 
    'Overweight': 15, 
    'Obese': 30 
  };
  const weightScore = weightMapping[healthData.weight] || 0;
  scores['Heart Disease'] += weightScore;
  scores['Type 2 Diabetes'] += weightScore * 1.7;
  if (weightScore > 10) {
    recommendations.add("Maintaining a healthy weight is key to reducing strain on your heart and preventing insulin resistance. Consider a personalized weight management plan with a dietitian.");
  }
  
  // ═══════════════════════════════════════════════════════════
  // BLOOD PRESSURE FACTOR
  // ═══════════════════════════════════════════════════════════
  const bloodPressureMapping: { [key: string]: number } = { 
    'Normal': 0, 
    'Elevated/High': 25, 
    'Low': 2, 
    "I don't know": 10 
  };
  const bloodPressureScore = bloodPressureMapping[healthData.bloodPressure] || 0;
  scores['Heart Disease'] += bloodPressureScore;
  if (bloodPressureScore > 20) {
    recommendations.add("High blood pressure is a major risk factor for heart disease and stroke. Monitor it regularly, reduce sodium intake, and consult a doctor about management strategies.");
  }

  // ═══════════════════════════════════════════════════════════
  // GENDER-SPECIFIC RISK FACTORS
  // ═══════════════════════════════════════════════════════════
  if (healthData.gender === 'Female') {
    scores['Breast Cancer'] = 10;
    scores['Ovarian Cancer'] = 10;
    
    if (healthData.historyOfPCOS === 'Yes') {
      scores['Type 2 Diabetes'] += 15;
      scores['Heart Disease'] += 10;
      recommendations.add("PCOS increases risk for diabetes and heart disease. Regular monitoring, weight management, and lifestyle interventions are important.");
    }
    
    if (healthData.menstrualCycle === 'Irregular') {
      scores['Ovarian Cancer'] += 5;
      scores['Type 2 Diabetes'] += 5;
      recommendations.add("Irregular menstrual cycles should be discussed with your gynecologist, as they can be linked to hormonal imbalances.");
    }
    
    if (age > 50) {
      scores['Breast Cancer'] += 10;
      scores['Ovarian Cancer'] += 5;
      recommendations.add("Women over 50 should have regular mammograms and discuss screening schedules with their doctor.");
    }
  } else if (healthData.gender === 'Male') {
    scores['Prostate Cancer'] = 10;
    
    if (age > 50) {
      scores['Prostate Cancer'] += 15;
      recommendations.add("Men over 50 should discuss prostate cancer screening (PSA test) with their doctor.");
    }
    
    if (healthData.prostateIssues === 'Yes') {
      scores['Prostate Cancer'] += 10;
      recommendations.add("Prostate symptoms should be evaluated by a urologist to rule out serious conditions.");
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CALCULATE FINAL SCORES
  // ═══════════════════════════════════════════════════════════
  const risk_scoreboard = Object.keys(scores).map(category => {
    const score = Math.max(0, Math.min(100, Math.round(scores[category])));
    let explanation = '';
    
    if (score > 70) {
      explanation = 'High risk level, driven by multiple factors. Proactive management with healthcare provider is strongly advised. Consider comprehensive screening.';
    } else if (score > 40) {
      explanation = 'Moderate risk level. Several lifestyle factors may be contributing. Positive changes could have a significant impact on reducing risk.';
    } else {
      explanation = 'Low to moderate risk level. Continue to maintain a healthy lifestyle and monitor your health with regular check-ups.';
    }
    
    return { risk_category: category, score, explanation };
  });

  // ═══════════════════════════════════════════════════════════
  // ADD DEFAULT RECOMMENDATION IF HEALTHY
  // ═══════════════════════════════════════════════════════════
  if (recommendations.size === 0 && Array.from(Object.values(scores)).every(s => s < 40)) {
    recommendations.add("You're doing great! Continue maintaining your healthy habits, schedule regular check-ups, and stay informed about preventive health measures.");
  }

  return {
    disclaimer: "This is a simulated risk assessment based on a simplified statistical model and is NOT a substitute for professional medical advice. Individual risk varies based on many factors. Consult a healthcare provider for an accurate evaluation of your health risks.",
    risk_scoreboard,
    recommendations: Array.from(recommendations),
  };
};

/* MEDICAL REPORT OCR & ANALYSIS MODEL*/
export const runLocalReportAnalysisModel = (
  reportImageBase64: string, 
  mimeType: string
): EReportResponse => {
  /* 
   * import Tesseract from 'tesseract.js'; 
   * const { data: { text } } = await Tesseract.recognize(
   *   reportImageBase64,
   *   'eng',
   *   { logger: m => console.log(m) }
   * );
   * const parameters = extractMedicalParameters(text);
   */

  return {
    disclaimer: "This is a demonstration of local OCR and analysis. NOT for actual medical use. This system would require Tesseract.js for OCR, medical databases for normal ranges, and NLP models for interpretation. Always consult a healthcare professional for medical report interpretation.",
    overall_summary: "This is a dummy analysis demonstrating the structure. In a real implementation, the system would: (1) Extract text from your medical report using OCR, (2) Identify and parse medical parameters with their values, (3) Compare values against clinical normal ranges from medical databases, (4) Generate personalized insights and recommendations based on your specific results.",
    parameter_breakdown: [
      {
        parameter: "Total Cholesterol",
        value: "200 mg/dL",
        normal_range: "< 200 mg/dL (Desirable), 200-239 mg/dL (Borderline High), ≥240 mg/dL (High)",
        explanation: "Your cholesterol is at the upper limit of desirable range. Total cholesterol represents the total amount of cholesterol in your blood, including LDL (bad) and HDL (good) cholesterol.",
        analogy: "Think of cholesterol like traffic on a highway. Some traffic (HDL) is going in the right direction helping clean up, while too much traffic overall can cause congestion and blockages (plaque buildup in arteries).",
        recommendation: "Monitor your diet by reducing saturated fats (red meat, butter, cheese), increase fiber intake (oats, beans, fruits), exercise regularly (30 minutes daily), and consider getting a lipid panel for detailed breakdown."
      },
      {
        parameter: "Blood Glucose (Fasting)",
        value: "95 mg/dL",
        normal_range: "70-100 mg/dL (Normal), 100-125 mg/dL (Prediabetes), ≥126 mg/dL (Diabetes)",
        explanation: "Your fasting blood sugar is within normal range, indicating good glucose metabolism. This test measures how much sugar (glucose) is in your blood after not eating for 8-12 hours.",
        analogy: "Blood sugar is like the fuel gauge in your car. You want it in the optimal range - not too low (hypoglycemia) which causes fatigue, and not too high (hyperglycemia) which damages organs over time.",
        recommendation: "Continue your current diet and exercise routine. Maintain healthy eating patterns with complex carbohydrates, avoid sugary drinks, and get regular check-ups especially if you have family history of diabetes."
      },
      {
        parameter: "Hemoglobin",
        value: "14.5 g/dL",
        normal_range: "13.5-17.5 g/dL (Adult Male), 12.0-15.5 g/dL (Adult Female)",
        explanation: "Your hemoglobin level is normal. Hemoglobin is a protein in red blood cells that carries oxygen from your lungs to all parts of your body. Normal levels mean your blood can effectively transport oxygen.",
        analogy: "Hemoglobin is like a fleet of delivery trucks carrying oxygen packages to every cell in your body. If you don't have enough trucks (low hemoglobin/anemia), deliveries are delayed and you feel tired.",
        recommendation: "Maintain adequate iron intake through diet (red meat, spinach, lentils, fortified cereals). If you're vegetarian, pair plant-based iron with vitamin C for better absorption. Consider supplements if recommended by your doctor."
      },
      {
        parameter: "White Blood Cell Count (WBC)",
        value: "7,200 cells/µL",
        normal_range: "4,000-11,000 cells/µL",
        explanation: "Your white blood cell count is within normal range. WBCs are part of your immune system and help fight infections. Normal levels indicate a healthy immune response.",
        analogy: "White blood cells are like security guards patrolling your body. Too few guards means you're vulnerable to infections; too many might mean your body is fighting something or there's an immune disorder.",
        recommendation: "Support your immune system with balanced nutrition (fruits, vegetables, protein), adequate sleep (7-9 hours), regular exercise, stress management, and proper hygiene practices."
      },
      {
        parameter: "Creatinine",
        value: "1.0 mg/dL",
        normal_range: "0.7-1.3 mg/dL (Adult Male), 0.6-1.1 mg/dL (Adult Female)",
        explanation: "Your creatinine level is normal, indicating good kidney function. Creatinine is a waste product from muscle metabolism that's filtered by the kidneys. Normal levels suggest your kidneys are working properly.",
        analogy: "Think of creatinine like exhaust from your car's engine (muscles). Your kidneys are the air filter. If the filter (kidneys) works well, the exhaust (creatinine) is properly removed. High levels mean the filter needs checking.",
        recommendation: "Maintain kidney health by staying hydrated (8 glasses water daily), limiting salt and processed foods, managing blood pressure, avoiding excessive NSAIDs (ibuprofen), and getting regular kidney function tests if at risk."
      },
      {
        parameter: "Thyroid Stimulating Hormone (TSH)",
        value: "2.5 mIU/L",
        normal_range: "0.4-4.0 mIU/L",
        explanation: "Your TSH level is normal, indicating balanced thyroid function. TSH is produced by the pituitary gland and regulates your thyroid hormone production, which controls metabolism, energy, and body temperature.",
        analogy: "TSH is like a thermostat controller. The pituitary (controller) checks if your thyroid (heater) is producing enough heat (thyroid hormones). If it's too cold, TSH goes up to tell the thyroid to work harder.",
        recommendation: "Support thyroid health with adequate iodine (seafood, dairy, iodized salt), selenium (Brazil nuts, fish), avoid excessive soy if you have thyroid issues, and get annual TSH checks, especially if you have symptoms or family history."
      }
    ]
  };
};

/*DIET PLANNING MODEL */
export const runLocalDietPlanModel = (
  goal: string, 
  preferences: string, 
  allergies: string, 
  targetCalories: string
): DietPlanResponse => {
  const calorieTarget = parseInt(targetCalories) || 2000;
  const mealsPerDay = 3;
  const snackCalories = 200;
  const mealCalories = Math.floor((calorieTarget - snackCalories) / mealsPerDay);
  
  const breakfasts = [
    { 
      name: "Protein-Packed Oatmeal Bowl", 
      description: "Steel-cut oats with Greek yogurt, mixed berries, sliced almonds, chia seeds, and a drizzle of honey", 
      calories: mealCalories 
    },
    { 
      name: "Mediterranean Breakfast", 
      description: "Whole grain toast with mashed avocado, poached eggs, cherry tomatoes, feta cheese, and fresh herbs", 
      calories: mealCalories 
    },
    { 
      name: "Berry Protein Smoothie Bowl", 
      description: "Blended acai, banana, protein powder, almond milk, topped with granola, coconut flakes, and fresh fruit", 
      calories: mealCalories 
    }
  ];

  const lunches = [
    { 
      name: "Grilled Chicken Buddha Bowl", 
      description: "Quinoa base with grilled chicken breast, roasted sweet potato, avocado, edamame, mixed greens, and tahini dressing", 
      calories: mealCalories 
    },
    { 
      name: "Wild Salmon Poke Bowl", 
      description: "Brown rice with sashimi-grade salmon, cucumber, seaweed salad, pickled ginger, sesame seeds, and soy-ginger sauce", 
      calories: mealCalories 
    },
    { 
      name: "Mediterranean Chickpea Salad", 
      description: "Mixed greens with chickpeas, cucumber, tomatoes, olives, feta, red onion, and olive oil-lemon dressing", 
      calories: mealCalories 
    }
  ];

  const dinners = [
    { 
      name: "Herb-Crusted Baked Salmon", 
      description: "Oven-baked salmon with herb crust, roasted Brussels sprouts, sweet potato wedges, and lemon butter", 
      calories: mealCalories 
    },
    { 
      name: "Lean Turkey Meatballs", 
      description: "Whole wheat pasta with homemade turkey meatballs, marinara sauce, zucchini noodles, and parmesan", 
      calories: mealCalories 
    },
    { 
      name: "Grilled Chicken & Vegetables", 
      description: "Marinated grilled chicken breast with roasted mixed vegetables (broccoli, carrots, bell peppers) and quinoa", 
      calories: mealCalories 
    }
  ];

  const snackOptions = [
    { name: "Mixed Nuts & Seeds", description: "Handful of raw almonds, walnuts, pumpkin seeds", calories: 100 },
    { name: "Apple with Almond Butter", description: "Medium apple sliced with 1 tbsp natural almond butter", calories: 100 },
    { name: "Greek Yogurt Parfait", description: "Low-fat Greek yogurt with berries and granola", calories: 100 },
    { name: "Hummus & Vegetables", description: "Carrot and celery sticks with 2 tbsp hummus", calories: 100 }
  ];

  const plan = [1, 2, 3].map(day => ({
    day,
    meals: {
      breakfast: breakfasts[(day - 1) % breakfasts.length],
      lunch: lunches[(day - 1) % lunches.length],
      dinner: dinners[(day - 1) % dinners.length],
      snacks: [snackOptions[(day - 1) * 2 % snackOptions.length], snackOptions[((day - 1) * 2 + 1) % snackOptions.length]]
    },
    daily_focus: day === 1 
      ? "Focus on hydration and balanced macronutrients (40% carbs, 30% protein, 30% fats)" 
      : day === 2 
      ? "Incorporate more fiber-rich foods and leafy greens for digestive health" 
      : "Ensure adequate protein intake for muscle recovery and include colorful vegetables"
  }));

  return {
    disclaimer: "This is a demonstration diet plan generated by a local algorithm. It does NOT replace personalized nutrition advice from a registered dietitian. Nutritional needs vary based on age, activity level, medical conditions, and individual goals. Consult a healthcare professional before making significant dietary changes.",
    plan,
    hydration_tips: [
      "Drink at least 8 glasses (64 oz) of water daily; more if exercising or in hot weather",
      "Start your day with a glass of water to kickstart metabolism",
      "Increase water intake before, during, and after exercise to prevent dehydration",
      "Herbal teas, infused water, and water-rich foods (cucumbers, watermelon) count toward daily hydration",
      "Monitor urine color - pale yellow indicates good hydration; dark yellow suggests you need more water",
      "Limit sugary drinks and excessive caffeine which can lead to dehydration"
    ]
  };
};

/**
 * CONVERSATIONAL AI CHATBOT MODEL
 */
export const runLocalChatbotModel = (
  userMessage: string, 
  conversationHistory: Array<{ role: string; content: string }>
): string => {
  const messageLower = userMessage.toLowerCase();

  // Keyword-to-response mapping
  const responses: Record<string, string> = {
    'hello': "Hello! I'm your HealthGuard AI assistant. I can help answer general health questions, guide you through our features, and provide information about symptoms, nutrition, and wellness. How can I assist you today?",
    'hi': "Hi there! I'm here to help with your health-related questions. What would you like to know?",
    
    'symptom': "I understand you're experiencing symptoms. For AI-powered analysis, I recommend using our Disease Predictor tool. It can provide potential diagnoses based on your symptoms, age, and medical history. However, for urgent or severe symptoms, please consult a healthcare professional immediately. Can you tell me more about what you're experiencing?",
    
    'pain': "Pain can have many different causes depending on its location, intensity, duration, and accompanying symptoms. Our Disease Predictor can help identify potential causes. Can you describe: (1) Where is the pain located? (2) How intense is it (1-10 scale)? (3) How long have you had it? (4) Does anything make it better or worse?",
    
    'headache': "Headaches can be caused by tension, migraines, dehydration, eye strain, sinus issues, or other conditions. Here are some general tips: (1) Rest in a dark, quiet room, (2) Stay hydrated, (3) Apply cold/warm compress, (4) Take OTC pain relievers if appropriate, (5) Reduce screen time. If headaches are severe, frequent, or accompanied by other symptoms like vision changes, seek medical attention.",
    
    'fever': "A fever is your body's natural response to fighting infection. General care: (1) Stay hydrated - drink plenty of fluids, (2) Rest and avoid strenuous activity, (3) Monitor temperature regularly, (4) Take acetaminophen or ibuprofen if needed (follow dosage instructions), (5) Dress in light clothing. Seek immediate medical attention if: fever exceeds 103°F (39.4°C), lasts more than 3 days, or is accompanied by severe symptoms like difficulty breathing, chest pain, or confusion.",
    
    'diet': "For personalized nutrition guidance, try our AI Diet Planner! It creates customized meal plans based on your health goals (weight loss, muscle gain, maintenance), dietary preferences (vegetarian, vegan, etc.), allergies, and calorie targets. What are your nutrition goals?",
    
    'nutrition': "Balanced nutrition includes: (1) Variety of fruits and vegetables (5+ servings daily), (2) Whole grains (brown rice, quinoa, oats), (3) Lean proteins (fish, poultry, legumes, tofu), (4) Healthy fats (nuts, avocado, olive oil), (5) Limited processed foods, sugar, and sodium. Our Diet Planner can create personalized plans for you!",
    
    'exercise': "Regular physical activity is crucial for health! Guidelines: (1) 150+ minutes moderate aerobic activity weekly (brisk walking, cycling), (2) 2+ days strength training, (3) Include flexibility exercises (stretching, yoga), (4) Start slowly and gradually increase intensity, (5) Find activities you enjoy. Always consult a doctor before starting a new exercise program, especially if you have health conditions.",
    
    'stress': "Stress management is vital for overall health. Effective techniques: (1) Mindfulness meditation (apps: Headspace, Calm), (2) Deep breathing exercises (4-7-8 technique), (3) Regular physical exercise, (4) Adequate sleep (7-9 hours), (5) Social connections and support, (6) Time management and prioritization, (7) Professional counseling if needed. Chronic stress can impact physical health, so don't hesitate to seek professional help.",
    
    'sleep': "Good sleep hygiene practices: (1) Consistent sleep schedule (same bedtime/wake time daily), (2) Create dark, cool, quiet environment (60-67°F ideal), (3) Avoid screens 1 hour before bed (blue light disrupts melatonin), (4) Limit caffeine after 2 PM, (5) Avoid heavy meals before bed, (6) Create relaxing bedtime routine (reading, meditation, gentle stretching), (7) Exercise regularly but not close to bedtime. Aim for 7-9 hours for adults.",
    
    'appointment': "You can find and book appointments with specialists through our E-Consultation feature! It helps you: (1) Search for doctors by specialty and location, (2) View doctor information and distances, (3) Select appointment dates and time slots, (4) Manage your bookings in My Appointments. Would you like help finding a specific type of doctor?",
    
    'medicine': "⚠️ Important: Never take medication without consulting a healthcare professional. If you have a prescription: (1) Follow dosage instructions exactly, (2) Take at prescribed times, (3) Complete full course even if feeling better (especially antibiotics), (4) Be aware of potential side effects, (5) Check for drug interactions, (6) Store properly, (7) Don't share prescriptions. Always inform doctors of all medications you're taking.",
    
    'risk': "Our AI Health Risk Analysis tool can assess your risk for conditions like heart disease, diabetes, and cancer based on lifestyle factors. It analyzes: age, exercise habits, diet quality, smoking status, alcohol consumption, stress levels, sleep patterns, family history, weight, blood pressure, and gender-specific factors. Want to try it?",
    
    'report': "Our E-Reports Analysis feature uses AI to interpret medical lab reports! Upload an image of your report, and the AI will: (1) Extract key parameters (cholesterol, blood sugar, etc.), (2) Compare to normal ranges, (3) Explain what each value means in simple terms, (4) Provide helpful analogies, (5) Give personalized recommendations. Would you like to upload a report?",
    
    'diabetes': "Type 2 diabetes is a metabolic disorder affecting blood sugar regulation. Risk factors: obesity, physical inactivity, family history, age 45+, certain ethnicities. Prevention: (1) Maintain healthy weight, (2) Exercise regularly (150+ min/week), (3) Eat balanced diet rich in fiber, (4) Limit sugar and refined carbs, (5) Regular health screenings. Our Risk Analysis tool can assess your diabetes risk!",
    
    'heart': "Heart disease is the leading cause of death globally. Risk factors: high blood pressure, high cholesterol, smoking, obesity, diabetes, physical inactivity, family history. Prevention: (1) Heart-healthy diet (Mediterranean or DASH), (2) Regular exercise, (3) Maintain healthy weight, (4) Don't smoke, (5) Manage stress, (6) Control blood pressure and cholesterol, (7) Limit alcohol. Get regular check-ups and screenings!",
    
    'weight': "Healthy weight management involves: (1) Balanced diet with appropriate calorie intake, (2) Regular physical activity, (3) Adequate sleep, (4) Stress management, (5) Mindful eating practices, (6) Gradual changes (1-2 lbs/week is healthy), (7) Focus on sustainable habits, not quick fixes. Our Diet Planner and Risk Analysis tools can support your weight management journey!",
    
    'mental': "Mental health is as important as physical health. Resources: (1) Therapy/counseling (cognitive behavioral therapy is evidence-based), (2) Meditation and mindfulness, (3) Regular exercise (proven to reduce anxiety/depression), (4) Social connections, (5) Adequate sleep, (6) Limit alcohol/substances, (7) Crisis hotlines available 24/7. If experiencing severe symptoms or suicidal thoughts, seek immediate professional help or call emergency services."
  };

  // Find best matching response
  for (const [keyword, response] of Object.entries(responses)) {
    if (messageLower.includes(keyword)) {
      return response;
    }
  }

  // Check for questions about app features
  if (messageLower.includes('feature') || messageLower.includes('what can you do') || messageLower.includes('help')) {
    return "I can help you with:\n\n🔍 Disease Predictor - Analyze symptoms and get potential diagnoses\n📊 Health Risk Analysis - Assess long-term health risks based on lifestyle\n📄 E-Reports Analysis - Interpret medical lab reports with AI\n🥗 Diet Planner - Create personalized meal plans\n👨‍⚕️ E-Consultation - Find and book doctor appointments\n🗺️ Nearby Health Services - Locate hospitals, clinics, and pharmacies\n💬 Chat Support - Ask health questions anytime\n\nWhat would you like to explore?";
  }

  // Check for emergency keywords
  if (messageLower.includes('emergency') || messageLower.includes('urgent') || messageLower.includes('911')) {
    return "⚠️ FOR MEDICAL EMERGENCIES, CALL 911 IMMEDIATELY OR GO TO THE NEAREST EMERGENCY ROOM.\n\nThis AI assistant cannot provide emergency medical care. If you're experiencing:\n- Chest pain\n- Difficulty breathing\n- Severe bleeding\n- Loss of consciousness\n- Severe allergic reaction\n- Stroke symptoms (FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 911)\n\nSeek immediate emergency medical attention.";
  }

  // Default response
  return "I'm here to help with health-related questions and guide you through HealthGuard AI's features!\n\nI can assist with:\n✓ Understanding symptoms and potential conditions\n✓ Nutrition and diet guidance\n✓ Exercise and fitness advice\n✓ Mental health and stress management\n✓ Sleep and wellness tips\n✓ Navigating our health tools\n\n💡 Tip: Ask specific questions like 'What foods help lower cholesterol?' or 'How can I improve my sleep quality?'\n\n⚠️ Important: This chatbot provides general health information and cannot replace professional medical advice. For diagnoses, treatment, or medical emergencies, consult a qualified healthcare provider.\n\nWhat would you like to know?";
};

/**
NEURAL NETWORK ARCHITECTURE 

import * as tf from '@tensorflow/tfjs';

class DiseasePredictionNeuralNetwork {
  private model: tf.Sequential;
  
  constructor() {
    // Define model architecture
    this.model = tf.sequential({
      layers: [
        // Input layer: symptom embeddings
        tf.layers.dense({ 
          units: 128, 
          activation: 'relu', 
          inputShape: [300], // 300-dimensional symptom embeddings
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        
        // Dropout for regularization
        tf.layers.dropout({ rate: 0.3 }),
        
        // Hidden layer
        tf.layers.dense({ 
          units: 64, 
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        
        // Dropout
        tf.layers.dropout({ rate: 0.2 }),
        
        // Hidden layer
        tf.layers.dense({ 
          units: 32, 
          activation: 'relu' 
        }),
        
        // Output layer: disease probabilities
        tf.layers.dense({ 
          units: 50, // 50 possible diseases
          activation: 'softmax' // Multi-class classification
        })
      ]
    });
    
    // Compile model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }
  
  async train(trainingData: tf.Tensor, labels: tf.Tensor, validationData: [tf.Tensor, tf.Tensor]) {
    const history = await this.model.fit(trainingData, labels, {
      epochs: 100,
      batchSize: 32,
      validationData: validationData,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
        }
      }
    });
    return history;
  }
  
  predict(symptomVector: tf.Tensor): tf.Tensor {
    return this.model.predict(symptomVector) as tf.Tensor;
  }
  
  async save(path: string) {
    await this.model.save(path);
  }
  
  async load(path: string) {
    this.model = await tf.loadLayersModel(path);
  }
}
*/