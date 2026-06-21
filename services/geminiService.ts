import type { DiseasePredictionResponse, RiskAnalysisResponse, EReportResponse, DietPlanResponse } from '../types';

// All AI requests now go through our own server-side proxy (/api/gemini).
// The Gemini API key never reaches the browser — see api/gemini.ts.

const callProxy = async <T,>(action: string, payload: Record<string, any>): Promise<T | null> => {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) {
      console.error(`AI request "${action}" failed with status ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`Error calling AI proxy for "${action}":`, error);
    return null;
  }
};

export const getDiseasePrediction = (
  symptoms: string,
  age: number,
  gender: string,
  duration: string,
  language: string = 'English'
): Promise<DiseasePredictionResponse | null> =>
  callProxy<DiseasePredictionResponse>('disease', { symptoms, age, gender, duration, language });

export const getRiskAnalysis = (
  healthData: Record<string, string>,
  language: string = 'English'
): Promise<RiskAnalysisResponse | null> =>
  callProxy<RiskAnalysisResponse>('risk', { healthData, language });

export const analyzeMedicalReport = (
  reportImageBase64: string,
  mimeType: string,
  language: string = 'English'
): Promise<EReportResponse | null> =>
  callProxy<EReportResponse>('report', { imageBase64: reportImageBase64, mimeType, language });

export const getDietPlan = (
  goal: string,
  preferences: string,
  allergies: string,
  calories: string,
  language: string = 'English'
): Promise<DietPlanResponse | null> =>
  callProxy<DietPlanResponse>('diet', { goal, preferences, allergies, calories, language });

export const getChatResponse = async (
  userMessage: string,
  language: string = 'English'
): Promise<string | null> => {
  const result = await callProxy<{ text: string }>('chat', { message: userMessage, language });
  return result ? result.text : null;
};
