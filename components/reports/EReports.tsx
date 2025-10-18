
import React, { useState, useCallback } from 'react';
import { analyzeMedicalReport } from '../../services/geminiService';
import type { EReportResponse, ReportParameter } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const ParameterItem: React.FC<{ item: ReportParameter }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">{item.parameter}</span>
                <div className="flex items-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mr-4">{item.value}</span>
                    <svg className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </button>
            {isOpen && (
                <div className="mt-4 pl-4 space-y-3 text-gray-600 dark:text-gray-400 text-sm">
                    <p><strong>Normal Range:</strong> {item.normal_range}</p>
                    <p><strong>Explanation:</strong> {item.explanation}</p>
                    <p><strong>Analogy:</strong> {item.analogy}</p>
                    <p><strong>Recommendation:</strong> {item.recommendation}</p>
                </div>
            )}
        </div>
    );
};

const EReports: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<EReportResponse | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 4 * 1024 * 1024) { // 4MB limit
                setError('File is too large. Please upload a file smaller than 4MB.');
                return;
            }
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError(null);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const base64String = await fileToBase64(file);
            const analysis = await analyzeMedicalReport(base64String, file.type);
            
            if (analysis) {
                setResult(analysis);
            } else {
                setError('Failed to analyze the report. The AI service may be unavailable or could not process the file. Please try a clearer image.');
            }
        } catch (err) {
            setError('An error occurred while processing the file.');
            console.error(err);
        }

        setLoading(false);
    }, [file]);

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Medical Report (Image)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, WEBP up to 4MB</p>
                            </div>
                        </div>
                         {fileName && <p className="text-center mt-2 text-sm text-gray-500">Selected: {fileName}</p>}
                    </div>
                    <div>
                        <Button type="submit" isLoading={loading} disabled={loading || !file} className="w-full">Analyze Report</Button>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </form>
            </Card>

            {loading && <div className="mt-8"><Spinner message="AI is analyzing your report..." /></div>}

            {result && (
                <Card className="mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Analysis Results</h2>
                    <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 mb-6">
                        <p><span className="font-bold">Disclaimer:</span> {result.disclaimer}</p>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">Overall Summary</h3>
                        <p className="text-gray-700 dark:text-gray-300">{result.overall_summary}</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Parameter Breakdown</h3>
                        <div className="space-y-2">
                           {result.parameter_breakdown.map((item) => <ParameterItem key={item.parameter} item={item} />)}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default EReports;
