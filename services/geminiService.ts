
import { GoogleGenAI, Type } from "@google/genai";
import type { DiseasePredictionResponse, RiskAnalysisResponse, EReportResponse, DietPlanResponse } from '../types';

// Read the Gemini API key from Vite's exposed env variable.
// Vercel and Vite expose client-safe env vars that start with VITE_.
const API_KEY: string | undefined = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY environment variable not set. Set VITE_GEMINI_API_KEY in your environment or Vercel project settings.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY ?? '' });

const generateContentWithRetry = async <T,>(prompt: string, responseSchema: any): Promise<T | null> => {
  try {
    console.log('🔑 API Key status:', API_KEY ? 'Present' : 'Missing');
    console.log('📤 Sending request to Gemini...');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    console.log('✅ Received response from Gemini');
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error("❌ Error generating content from Gemini:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status
    });
    return null;
  }
};

export const getDiseasePrediction = async (symptoms: string, age: number, gender: string, duration: string, language: string = 'English'): Promise<DiseasePredictionResponse | null> => {
  const prompt = `
    IMPORTANT: Respond in ${language} language.
    
    Analyze the following health information and predict potential diseases.
    - Age: ${age}
    - Gender: ${gender}
    - Symptoms: ${symptoms}
    - Duration of symptoms: ${duration}

    Provide a JSON response in ${language} with a disclaimer, top 3 predictions (including disease, description, reasoning, and a confidence score from 0 to 1), and actionable next steps.
  `;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      disclaimer: { type: Type.STRING },
      predictions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            disease: { type: Type.STRING },
            description: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["disease", "description", "reasoning", "confidence"],
        },
      },
      next_steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: ["disclaimer", "predictions", "next_steps"],
  };

  return generateContentWithRetry<DiseasePredictionResponse>(prompt, schema);
};


export const getRiskAnalysis = async (healthData: Record<string, string>, language: string = 'English'): Promise<RiskAnalysisResponse | null> => {
    console.log('🏥 Starting risk analysis with data:', healthData);
    console.log('🌐 Response language:', language);
    
    let genderSpecificPrompts = '';
    if (healthData.gender === 'Female') {
        genderSpecificPrompts = `
          Female-Specific Health Data:
          - Pregnancy Status (current or recent): ${healthData.pregnancyStatus}
          - Menstrual Cycle Regularity: ${healthData.menstrualCycle}
          - History of PCOS: ${healthData.historyOfPCOS}
        `;
    } else if (healthData.gender === 'Male') {
        genderSpecificPrompts = `
          Male-Specific Health Data:
          - Prostate Health Issues: ${healthData.prostateIssues}
          - Known Low Testosterone: ${healthData.testosteroneLevels}
        `;
    }
    
    const prompt = `
      IMPORTANT: Respond entirely in ${language} language.
      
      Analyze the following comprehensive health data for a user and provide a supportive lifestyle check.
      The data includes personal details, lifestyle habits, and known health indicators. Use positive, encouraging language.
      
      Health Data:
      - Age: ${healthData.age}
      - Gender: ${healthData.gender}
      - Exercise Frequency: ${healthData.exercise}
      - Diet Quality: ${healthData.diet}
      - Smoking Status: ${healthData.smoking}
      - Alcohol Consumption: ${healthData.alcohol}
      - Stress Level: ${healthData.stress}
      - Average Sleep: ${healthData.sleep}
      - Family History of Major Disease: ${healthData.familyHistory}
      - Self-Assessed Weight Status: ${healthData.weight}
      - Known Blood Pressure: ${healthData.bloodPressure}
      
      ${genderSpecificPrompts}
      
      Based on ALL this data, provide a JSON response in ${language} with a supportive disclaimer, a lifestyle scoreboard for Heart Health, Blood Sugar Balance, and General Wellness. If gender-specific data is provided, incorporate areas like Women's Health or Men's Health into your analysis where relevant. Each item in the scoreboard should have a 'risk_category', a 'score' from 0 (excellent lifestyle habits) to 100 (needs attention), and a brief positive 'explanation' for the score using supportive language. Also, provide 3-5 personalized, actionable 'recommendations' for lifestyle improvements based on the user's specific inputs, using encouraging and culturally relevant language.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            disclaimer: { type: Type.STRING },
            risk_scoreboard: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        risk_category: { type: Type.STRING },
                        score: { type: Type.INTEGER },
                        explanation: { type: Type.STRING }
                    },
                    required: ["risk_category", "score", "explanation"]
                }
            },
            recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
        required: ["disclaimer", "risk_scoreboard", "recommendations"]
    };

    return generateContentWithRetry<RiskAnalysisResponse>(prompt, schema);
};

export const analyzeMedicalReport = async (reportImageBase64: string, mimeType: string, language: string = 'English'): Promise<EReportResponse | null> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: reportImageBase64,
            },
        };

        const textPart = {
            text: `
                IMPORTANT: Respond entirely in ${language} language.
                
                Analyze this medical report. Provide a JSON response in ${language} with:
                1.  A disclaimer that this is not medical advice.
                2.  An "overall_summary" of the findings in simple terms.
                3.  A "parameter_breakdown" array. For each key parameter (like Cholesterol, Blood Sugar, RBC, etc.), provide an object with: "parameter" name, its "value" from the report, the "normal_range", a simple "explanation", a relatable "analogy", and a "recommendation".
            `,
        };

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                disclaimer: { type: Type.STRING },
                overall_summary: { type: Type.STRING },
                parameter_breakdown: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            parameter: { type: Type.STRING },
                            value: { type: Type.STRING },
                            normal_range: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            analogy: { type: Type.STRING },
                            recommendation: { type: Type.STRING },
                        },
                        required: ["parameter", "value", "normal_range", "explanation", "analogy", "recommendation"]
                    }
                }
            },
            required: ["disclaimer", "overall_summary", "parameter_breakdown"]
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as EReportResponse;
    } catch (error) {
        console.error("Error analyzing medical report with Gemini:", error);
        return null;
    }
};

export const getDietPlan = async (goal: string, preferences: string, allergies: string, calories: string, language: string = 'English', lifestyleData?: Record<string, string>): Promise<DietPlanResponse | null> => {
    let lifestyleContext = '';
    if (lifestyleData) {
        lifestyleContext = `
        
        IMPORTANT LIFESTYLE CONTEXT FROM USER'S HEALTH CHECK:
        - Age: ${lifestyleData.age}
        - Gender: ${lifestyleData.gender}
        - Exercise Frequency: ${lifestyleData.exercise}
        - Current Diet Quality: ${lifestyleData.diet}
        - Smoking Status: ${lifestyleData.smoking}
        - Alcohol Consumption: ${lifestyleData.alcohol}
        - Stress Level: ${lifestyleData.stress}
        - Sleep Quality: ${lifestyleData.sleep}
        - Family Health History: ${lifestyleData.familyHistory}
        - Weight Status: ${lifestyleData.weight}
        - Blood Pressure: ${lifestyleData.bloodPressure}
        
        Please tailor the diet plan to address these specific lifestyle factors. For example:
        - If stress is high, include stress-reducing foods
        - If sleep is poor, suggest foods that promote better sleep
        - If exercise is low, provide energy-boosting meals
        - If diet quality is poor, focus on whole foods and nutrition education
        - Consider any health risks indicated by family history
        `;
    }
    
    const prompt = `
        IMPORTANT: Respond entirely in ${language} language.
        
        Create a personalized 3-day diet plan based on the following user details:
        - Goal: ${goal}
        - Dietary Preferences: ${preferences}
        - Allergies: ${allergies}
        - Target Daily Calories: ${calories}
        ${lifestyleContext}

        Provide a JSON response in ${language} with a disclaimer, a 3-day plan (each day having breakfast, lunch, dinner, and snacks with name, description, and estimated calories), a "daily_focus" for each day, and general hydration tips. Use Indian/Tamil Nadu-friendly food examples where possible (idli, dosa, sambar, ragi, etc.).
    `;

    const mealSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            calories: { type: Type.INTEGER }
        },
        required: ["name", "description", "calories"]
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            disclaimer: { type: Type.STRING },
            plan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.INTEGER },
                        meals: {
                            type: Type.OBJECT,
                            properties: {
                                breakfast: mealSchema,
                                lunch: mealSchema,
                                dinner: mealSchema,
                                snacks: { type: Type.ARRAY, items: mealSchema }
                            },
                            required: ["breakfast", "lunch", "dinner"]
                        },
                        daily_focus: { type: Type.STRING }
                    },
                    required: ["day", "meals", "daily_focus"]
                }
            },
            hydration_tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
        required: ["disclaimer", "plan", "hydration_tips"]
    };

    return generateContentWithRetry<DietPlanResponse>(prompt, schema);
};

export const getChatResponse = async (userMessage: string, language: string = 'English'): Promise<string | null> => {
    try {
        console.log('💬 Sending chat message to Gemini...');
        console.log('🌐 Chat language:', language);
        
        const prompt = `
            IMPORTANT: Respond entirely in ${language} language.
            
            You are a helpful health assistant for HEAL'EM. 
            Provide helpful, empathetic, and accurate health information while being conversational.
            Always remind users that you're an AI assistant and not a replacement for professional medical advice.
            Keep responses concise but informative.
            
            User message: ${userMessage}
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const textResponse = response.text.trim();
        console.log('✅ Chat response received');
        return textResponse;
    } catch (error) {
        console.error("❌ Error getting chat response from Gemini:", error);
        return null;
    }
};