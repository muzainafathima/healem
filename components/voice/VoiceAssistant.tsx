import React, { useState, useEffect, useRef } from 'react';
import { getChatResponse } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../ui/Card';
import type { Page } from '../../App';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (page: Page) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, navigate }) => {
  const { t, getLanguageName, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [detectedCommand, setDetectedCommand] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Command detection function
  const detectCommand = (text: string): { page: Page; action: string } | null => {
    const commands = {
      // Dashboard
      dashboard: ['dashboard', 'home', 'main page', 'go home', 'inicio', 'முகப்பு'],
      
      // Disease Predictor
      disease: [
        'disease', 'predict', 'symptoms', 'diagnose', 'diagnosis', 'what is wrong', 'illness', 'sick',
        'enfermedad', 'predecir', 'síntomas', 'diagnosticar',
        'நோய்', 'கணிப்பு', 'அறிகுறி'
      ],
      
      // Risk Analysis
      risk: [
        'risk', 'health risk', 'analyze risk', 'risk analysis', 'assessment',
        'riesgo', 'análisis de riesgo',
        'ஆபத்து', 'பகுப்பாய்வு'
      ],
      
      // Diet Planner
      diet: [
        'diet', 'meal plan', 'nutrition', 'food', 'eating plan', 'weight loss', 'weight gain',
        'dieta', 'plan de comida', 'nutrición',
        'உணவு', 'திட்டம்'
      ],
      
      // E-Consultation
      consult: [
        'doctor', 'appointment', 'consult', 'consultation', 'book doctor', 'find doctor', 'specialist',
        'médico', 'cita', 'consulta', 'especialista',
        'மருத்துவர்', 'சந்திப்பு', 'ஆலோசனை'
      ],
      
      // Calendar
      calendar: [
        'calendar', 'appointments', 'my appointments', 'schedule', 'booking',
        'calendario', 'citas', 'mis citas',
        'நாட்காட்டி', 'சந்திப்புகள்'
      ],
      
      // E-Reports
      reports: [
        'report', 'medical report', 'test results', 'lab results', 'scan', 'upload report',
        'informe', 'reporte médico', 'resultados',
        'அறிக்கை', 'மருத்துவ அறிக்கை'
      ],
      
      // Locations
      locations: [
        'location', 'hospital', 'clinic', 'pharmacy', 'nearby', 'near me', 'find hospital', 'find clinic', 'map',
        'ubicación', 'hospital', 'clínica', 'farmacia', 'cerca', 'mapa',
        'இடம்', 'மருத்துவமனை', 'கிளினிக்', 'மருந்தகம்', 'அருகில்'
      ],
      
      // Profile
      profile: [
        'profile', 'my profile', 'health profile', 'personal info', 'settings',
        'perfil', 'mi perfil', 'información personal',
        'சுயவிவரம்', 'எனது சுயவிவரம்'
      ]
    };

    // Check each command category
    for (const [page, keywords] of Object.entries(commands)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return { page: page as Page, action: keyword };
        }
      }
    }

    return null;
  };

  // Get confirmation message based on page
  const getConfirmationMessage = (page: Page): string => {
    const messages: Record<Page, Record<string, string>> = {
      dashboard: {
        en: "Taking you to the dashboard.",
        es: "Llevándote al panel principal.",
        ta: "முகப்புக்கு அழைத்துச் செல்கிறது."
      },
      disease: {
        en: "Opening the disease predictor. You can describe your symptoms there.",
        es: "Abriendo el predictor de enfermedades. Puedes describir tus síntomas allí.",
        ta: "நோய் கணிப்பை திறக்கிறது. உங்கள் அறிகுறிகளை அங்கு விவரிக்கலாம்."
      },
      risk: {
        en: "Opening health risk analysis. You can complete the health assessment there.",
        es: "Abriendo análisis de riesgo de salud. Puedes completar la evaluación allí.",
        ta: "சுகாதார ஆபத்து பகுப்பாய்வை திறக்கிறது."
      },
      diet: {
        en: "Opening diet planner. You can create your personalized meal plan there.",
        es: "Abriendo planificador de dieta. Puedes crear tu plan de comidas personalizado allí.",
        ta: "உணவு திட்டத்தை திறக்கிறது."
      },
      consult: {
        en: "Opening doctor consultation. You can find and book doctors there.",
        es: "Abriendo consulta médica. Puedes encontrar y reservar doctores allí.",
        ta: "மருத்துவ ஆலோசனையை திறக்கிறது."
      },
      calendar: {
        en: "Opening your appointments calendar.",
        es: "Abriendo tu calendario de citas.",
        ta: "உங்கள் சந்திப்புகள் நாட்காட்டியை திறக்கிறது."
      },
      reports: {
        en: "Opening medical reports. You can upload and analyze your reports there.",
        es: "Abriendo informes médicos. Puedes subir y analizar tus informes allí.",
        ta: "மருத்துவ அறிக்கைகளை திறக்கிறது."
      },
      locations: {
        en: "Opening nearby health services. You can find hospitals, clinics, and pharmacies there.",
        es: "Abriendo servicios de salud cercanos. Puedes encontrar hospitales, clínicas y farmacias allí.",
        ta: "அருகிலுள்ள சுகாதார சேவைகளை திறக்கிறது."
      },
      profile: {
        en: "Opening your health profile.",
        es: "Abriendo tu perfil de salud.",
        ta: "உங்கள் சுகாதார சுயவிவரத்தை திறக்கிறது."
      }
    };

    const langKey = language === 'es' ? 'es' : language === 'ta' ? 'ta' : 'en';
    return messages[page][langKey] || messages[page].en;
  };

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Set language based on current app language
      const langMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        pt: 'pt-PT',
        ru: 'ru-RU',
        zh: 'zh-CN',
        ja: 'ja-JP',
        ko: 'ko-KR',
        ar: 'ar-SA',
        hi: 'hi-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
        ur: 'ur-PK',
        tr: 'tr-TR',
        vi: 'vi-VN',
        th: 'th-TH',
        id: 'id-ID',
        nl: 'nl-NL',
        pl: 'pl-PL',
        uk: 'uk-UA',
        ro: 'ro-RO',
        el: 'el-GR',
        cs: 'cs-CZ',
        sv: 'sv-SE',
        he: 'he-IL',
        fa: 'fa-IR',
      };
      recognitionRef.current.lang = langMap[language] || 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognitionRef.current.onresult = async (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        setIsListening(false);

        // Check for navigation commands
        const command = detectCommand(speechResult.toLowerCase());
        if (command) {
          setDetectedCommand(command.action);
          const confirmationMessage = getConfirmationMessage(command.page);
          setResponse(confirmationMessage);
          speak(confirmationMessage);
          
          // Navigate after a short delay
          setTimeout(() => {
            navigate(command.page);
            onClose();
          }, 2000);
          return;
        }

        // Get AI response for regular queries
        try {
          const aiResponse = await getChatResponse(speechResult, getLanguageName());
          setResponse(aiResponse);
          speak(aiResponse);
        } catch (err) {
          setError('Failed to get response from AI');
          console.error(err);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        setError(`Speech recognition error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language, getLanguageName]);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setResponse('');
      setError('');
      setDetectedCommand('');
      recognitionRef.current.start();
    } else {
      setError('Speech recognition is not supported in your browser');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string) => {
    if (synthRef.current && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language for speech synthesis
      const voices = synthRef.current.getVoices();
      const langMap: Record<string, string[]> = {
        en: ['en-US', 'en-GB', 'en'],
        es: ['es-ES', 'es-MX', 'es'],
        fr: ['fr-FR', 'fr'],
        de: ['de-DE', 'de'],
        it: ['it-IT', 'it'],
        pt: ['pt-PT', 'pt-BR', 'pt'],
        ru: ['ru-RU', 'ru'],
        zh: ['zh-CN', 'zh-TW', 'zh'],
        ja: ['ja-JP', 'ja'],
        ko: ['ko-KR', 'ko'],
        ar: ['ar-SA', 'ar'],
        hi: ['hi-IN', 'hi'],
        ta: ['ta-IN', 'ta'],
        te: ['te-IN', 'te'],
        tr: ['tr-TR', 'tr'],
        th: ['th-TH', 'th'],
        id: ['id-ID', 'id'],
        nl: ['nl-NL', 'nl'],
        pl: ['pl-PL', 'pl'],
      };

      const preferredLangs = langMap[language] || ['en-US'];
      const voice = voices.find(v => preferredLangs.some(lang => v.lang.startsWith(lang)));
      
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = preferredLangs[0];
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {t('voice.title') || 'Voice Assistant'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Microphone Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''} shadow-2xl`}
            >
              {isListening ? (
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="12" height="16" rx="2" />
                </svg>
              ) : (
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {isListening
                ? t('voice.listening') || 'Listening...'
                : isSpeaking
                ? t('voice.speaking') || 'Speaking...'
                : t('voice.clickToSpeak') || 'Click to speak'}
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                {t('voice.youSaid') || 'You said:'}
              </p>
              <p className="text-gray-800 dark:text-gray-200">{transcript}</p>
              {detectedCommand && (
                <div className="mt-3 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {t('voice.commandDetected') || 'Command detected!'} - {detectedCommand}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className={`p-4 rounded-lg border-l-4 ${
              detectedCommand 
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-500'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <p className={`text-sm font-semibold ${
                  detectedCommand 
                    ? 'text-purple-800 dark:text-purple-300' 
                    : 'text-green-800 dark:text-green-300'
                }`}>
                  {detectedCommand 
                    ? (t('voice.navigating') || 'Navigating...') 
                    : (t('voice.response') || 'Response:')}
                </p>
                <button
                  onClick={isSpeaking ? stopSpeaking : () => speak(response)}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  {isSpeaking ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{response}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                {t('common.error') || 'Error:'}
              </p>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Command Examples */}
          {!transcript && !error && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('voice.examples') || 'Try saying:'}
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
                <li>"Show me nearby hospitals"</li>
                <li>"Predict my symptoms"</li>
                <li>"Open diet planner"</li>
                <li>"Book a doctor appointment"</li>
                <li>"Show my calendar"</li>
                <li>"Analyze my health risk"</li>
              </ul>
            </div>
          )}

          {/* Instructions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {t('voice.instructions') || 'Click the microphone button and speak your health question. The assistant will respond with voice and text.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceAssistant;
