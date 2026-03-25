import React, { useState } from 'react';
import { signUp, signIn } from '../../services/firebaseService';
import Card from '../ui/Card';
import Button from '../ui/Button';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
            // On success, the onAuthChange listener in App.tsx will redirect
        } catch (err: any) {
            let friendlyMessage = 'An unexpected error occurred. Please try again.';
            if (err.code) {
                switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
                        break;
                    case 'auth/email-already-in-use':
                        friendlyMessage = 'This email is already registered. Please try to sign in instead.';
                        break;
                    case 'auth/weak-password':
                        friendlyMessage = 'Your password is too weak. It should be at least 6 characters long.';
                        break;
                    case 'auth/invalid-email':
                        friendlyMessage = 'Please enter a valid email address.';
                        break;
                    case 'auth/network-request-failed':
                        friendlyMessage = 'A network error occurred. Please check your internet connection and try again.';
                        break;
                    default:
                        console.error('Authentication Error:', err);
                        friendlyMessage = 'Authentication failed. Please try again later.';
                }
            }
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
             <div className="flex items-center justify-center mb-8">
                <img src="/healem.jpg" alt="HEAL'EM" className="h-24 w-24 object-cover rounded-full shadow-lg ring-4 ring-white dark:ring-gray-800" />
            </div>
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                    {isLogin ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                        />
                    </div>
                     {error && <p className="text-sm text-red-500">{error}</p>}
                    <div>
                        <Button type="submit" isLoading={loading} disabled={loading} className="w-full">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </div>
                </form>
                <div className="mt-6 text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default Auth;