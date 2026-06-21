// Server-side Gemini proxy (Vercel Serverless Function).
//
// SECURITY: The Gemini API key MUST live only on the server. Set it in the
// Vercel project as `GEMINI_API_KEY` (NOT prefixed with VITE_, so it is never
// bundled into the client). This endpoint is the single entry point the
// browser uses for every AI feature, which also gives us one place to add
// rate limiting, logging and abuse protection later.

import { GoogleGenAI, Type } from "@google/genai";

const API_KEY: string | undefined = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY ?? "" });

const generate = async (prompt: any, responseSchema: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });
  return JSON.parse(response.text.trim());
};

const mealSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    calories: { type: Type.INTEGER },
  },
  required: ["name", "description", "calories"],
};

const schemas: Record<string, any> = {
  disease: {
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
      next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["disclaimer", "predictions", "next_steps"],
  },
  risk: {
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
            explanation: { type: Type.STRING },
          },
          required: ["risk_category", "score", "explanation"],
        },
      },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["disclaimer", "risk_scoreboard", "recommendations"],
  },
  report: {
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
          required: ["parameter", "value", "normal_range", "explanation", "analogy", "recommendation"],
        },
      },
    },
    required: ["disclaimer", "overall_summary", "parameter_breakdown"],
  },
  diet: {
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
                snacks: { type: Type.ARRAY, items: mealSchema },
              },
              required: ["breakfast", "lunch", "dinner"],
            },
            daily_focus: { type: Type.STRING },
          },
          required: ["day", "meals", "daily_focus"],
        },
      },
      hydration_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["disclaimer", "plan", "hydration_tips"],
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set on the server.");
    return res.status(500).json({ error: "AI service is not configured." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { action, payload } = body || {};
    const language = (payload && payload.language) || "English";

    switch (action) {
      case "disease": {
        const { symptoms, age, gender, duration } = payload;
        const prompt = `
          IMPORTANT: Respond in ${language} language.
          Analyze the following health information and predict potential diseases.
          - Age: ${age}
          - Gender: ${gender}
          - Symptoms: ${symptoms}
          - Duration of symptoms: ${duration}
          Provide a JSON response in ${language} with a disclaimer, top 3 predictions (including disease, description, reasoning, and a confidence score from 0 to 1), and actionable next steps.`;
        return res.status(200).json(await generate(prompt, schemas.disease));
      }

      case "risk": {
        const h = payload.healthData || {};
        let genderSpecific = "";
        if (h.gender === "Female") {
          genderSpecific = `Female-Specific Health Data:
            - Pregnancy Status: ${h.pregnancyStatus}
            - Menstrual Cycle Regularity: ${h.menstrualCycle}
            - History of PCOS: ${h.historyOfPCOS}`;
        } else if (h.gender === "Male") {
          genderSpecific = `Male-Specific Health Data:
            - Prostate Health Issues: ${h.prostateIssues}
            - Known Low Testosterone: ${h.testosteroneLevels}`;
        }
        const prompt = `
          IMPORTANT: Respond entirely in ${language} language.
          Analyze the following comprehensive health data and provide a detailed health risk analysis.
          Health Data:
          - Age: ${h.age}
          - Gender: ${h.gender}
          - Exercise Frequency: ${h.exercise}
          - Diet Quality: ${h.diet}
          - Smoking Status: ${h.smoking}
          - Alcohol Consumption: ${h.alcohol}
          - Stress Level: ${h.stress}
          - Average Sleep: ${h.sleep}
          - Family History of Major Disease: ${h.familyHistory}
          - Self-Assessed Weight Status: ${h.weight}
          - Known Blood Pressure: ${h.bloodPressure}
          ${genderSpecific}
          Based on ALL this data, provide a JSON response in ${language} with a disclaimer, a risk scoreboard for Heart Disease, Type 2 Diabetes, and General Cancers. If gender-specific data is provided, incorporate relevant risks (Breast/Ovarian Cancer or PCOS for females, Prostate Cancer for males). Each scoreboard item must have a 'risk_category', a 'score' from 0 to 100, and a brief 'explanation'. Also provide 3-5 personalized, actionable 'recommendations'.`;
        return res.status(200).json(await generate(prompt, schemas.risk));
      }

      case "report": {
        const { imageBase64, mimeType } = payload;
        const prompt = {
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            {
              text: `IMPORTANT: Respond entirely in ${language} language.
                Analyze this medical report. Provide a JSON response in ${language} with:
                1. A disclaimer that this is not medical advice.
                2. An "overall_summary" of the findings in simple terms.
                3. A "parameter_breakdown" array. For each key parameter, provide an object with: "parameter" name, "value", "normal_range", a simple "explanation", a relatable "analogy", and a "recommendation".`,
            },
          ],
        };
        return res.status(200).json(await generate(prompt, schemas.report));
      }

      case "diet": {
        const { goal, preferences, allergies, calories } = payload;
        const prompt = `
          IMPORTANT: Respond entirely in ${language} language.
          Create a personalized 3-day diet plan based on:
          - Goal: ${goal}
          - Dietary Preferences: ${preferences}
          - Allergies: ${allergies}
          - Target Daily Calories: ${calories}
          Provide a JSON response in ${language} with a disclaimer, a 3-day plan (each day having breakfast, lunch, dinner, and snacks with name, description, and estimated calories), a "daily_focus" for each day, and general hydration tips.`;
        return res.status(200).json(await generate(prompt, schemas.diet));
      }

      case "chat": {
        const { message } = payload;
        const prompt = `
          IMPORTANT: Respond entirely in ${language} language.
          You are a helpful health assistant for HEAL'EM.
          Provide helpful, empathetic, and accurate health information while being conversational.
          Always remind users that you're an AI assistant and not a replacement for professional medical advice.
          Keep responses concise but informative.
          User message: ${message}`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        return res.status(200).json({ text: response.text.trim() });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error: any) {
    console.error("Gemini proxy error:", error?.message || error);
    return res.status(502).json({ error: "AI request failed." });
  }
}
