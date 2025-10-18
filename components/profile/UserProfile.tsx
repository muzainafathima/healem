import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { UserProfileData } from '../../types';
import { ProfileIcon } from '../layout/Icons';

const initialProfileState: UserProfileData = {
    name: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    photo: '',
    conditions: '',
    surgeries: '',
};

interface UserProfileProps {
    userProfile: UserProfileData | null;
    onProfileUpdate: (profile: UserProfileData) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userProfile, onProfileUpdate }) => {
    const [profile, setProfile] = useState<UserProfileData>(initialProfileState);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (userProfile) {
            setProfile(userProfile);
        }
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            onProfileUpdate(profile);
            setSaveMessage('Your information has been saved successfully!');
        } catch (error) {
            console.error("Failed to save profile", error);
            setSaveMessage('Failed to save information. Please try again.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000); // Clear message after 3 seconds
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Photo and Personal Details */}
                    <div className="md:col-span-1 flex flex-col items-center space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white md:hidden">My Health Profile</h2>
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {profile.photo ? (
                                    <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <ProfileIcon />
                                )}
                            </div>
                            <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <input id="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                        </div>
                         <div className="w-full space-y-4 text-sm">
                            <input type="text" name="name" value={profile.name} onChange={handleChange} placeholder="Your Name" className="w-full text-center font-semibold text-lg bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    {/* Right Column: Form Fields */}
                    <div className="md:col-span-2 space-y-6">
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-white hidden md:block">My Health Profile</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                                <input type="number" name="age" id="age" value={profile.age} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                <select name="gender" id="gender" value={profile.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
                                <input type="number" name="weight" id="weight" value={profile.weight} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
                                <input type="number" name="height" id="height" value={profile.height} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="conditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pre-existing Conditions</label>
                            <textarea id="conditions" name="conditions" rows={4} value={profile.conditions} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., Asthma, Type 2 Diabetes..." />
                        </div>
                        <div>
                            <label htmlFor="surgeries" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Past Surgeries</label>
                            <textarea id="surgeries" name="surgeries" rows={4} value={profile.surgeries} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., Appendectomy (2015)..." />
                        </div>
                         <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {saveMessage && <p className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>{saveMessage}</p>}
                            <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            </Card>
            <Card className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Privacy Note</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Your profile information is stored securely on your device's local storage and is not uploaded to our servers. This ensures your data remains private and under your control. Clearing your browser's cache may remove this data.
                </p>
            </Card>
        </div>
    );
};

export default UserProfile;