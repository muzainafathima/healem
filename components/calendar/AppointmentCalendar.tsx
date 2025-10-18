import React, { useState, useEffect } from 'react';
import { getUserAppointments, cancelAppointment } from '../../services/firebaseService';
import type { Appointment, AppUser } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const AppointmentCalendar: React.FC<{ user: AppUser }> = ({ user }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                const userAppointments = await getUserAppointments(user);
                setAppointments(userAppointments);
            } catch (err) {
                setError("Failed to fetch appointments. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [user]);

    const handleCancelAppointment = async (appointmentId: string, doctorName: string) => {
        setCancelingId(appointmentId);
        setError(null);
        setSuccessMessage(null);

        try {
            const success = await cancelAppointment(appointmentId);
            if (success) {
                // Remove the appointment from the local state
                setAppointments(prev => prev.filter(app => app.id !== appointmentId));
                setSuccessMessage(`Appointment with ${doctorName} has been canceled successfully.`);
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError('Failed to cancel appointment. Please try again.');
            }
        } catch (err) {
            setError('An error occurred while canceling the appointment.');
            console.error(err);
        } finally {
            setCancelingId(null);
            setConfirmCancel(null);
        }
    };

    if (loading) {
        return <Spinner message="Loading your appointments..." />;
    }

    if (error) {
        return <Card><p className="text-red-500 text-center">{error}</p></Card>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            {successMessage && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-green-100 border border-green-400 text-green-700" role="alert">
                    <strong className="font-bold">Success! </strong>
                    <span className="block sm:inline">{successMessage}</span>
                </div>
            )}
            <Card>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Your Appointments</h2>
                {appointments.length > 0 ? (
                    <div className="space-y-4">
                        {appointments.map(app => {
                            // Fix for timezone issue: parse date as UTC to prevent off-by-one day errors.
                            const date = new Date(app.date);
                            const displayDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

                            return (
                                <div key={app.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col sm:flex-row justify-between">
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{app.doctorName}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{app.doctorSpecialty}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{app.doctorAddress}</p>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:text-right flex flex-col justify-between">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{displayDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                <p className="font-semibold text-lg text-gray-700 dark:text-gray-300">{app.slot}</p>
                                            </div>
                                            <div className="mt-3 sm:mt-2">
                                                {confirmCancel === app.id ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleCancelAppointment(app.id, app.doctorName)}
                                                            variant="danger"
                                                            isLoading={cancelingId === app.id}
                                                            disabled={cancelingId === app.id}
                                                            className="text-sm"
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            onClick={() => setConfirmCancel(null)}
                                                            variant="secondary"
                                                            disabled={cancelingId === app.id}
                                                            className="text-sm"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => setConfirmCancel(app.id)}
                                                        variant="danger"
                                                        className="text-sm w-full sm:w-auto"
                                                    >
                                                        Cancel Appointment
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">You have no upcoming appointments.</p>
                )}
            </Card>
        </div>
    );
};

export default AppointmentCalendar;