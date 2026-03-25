import React from 'react';

interface SpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ message = "Analyzing...", fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="animate-fade-in flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    {message && <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">{message}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{message}</p>
        </div>
    );
};

export default Spinner;
