import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { updateDailyFeedback } from '../services/api'; 
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

function GradeFeedbackScreen({ submission, feedback, onGradeSaved, onBack }) {
    const [score, setScore] = useState(submission?.ball || feedback?.ball || 0);
    const [feedbackText, setFeedbackText] = useState(submission?.feedback || feedback?.feedback || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const studentName = submission?.studentInfo?.fullName || 'Noma\'lum talaba';
    const feedbackTitle = feedback?.feedback || 'Fikr-mulohaza';

    const handleSubmit = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const updatedData = { ball: score, feedback: feedbackText };
            await updateDailyFeedback(feedback.id, updatedData);
            onGradeSaved({ ...feedback, ball: score, feedback: feedbackText });
        } catch (err) {
            setError(err.message || "Fikr-mulohazani saqlashda xatolik yuz berdi.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <Loader />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className="p-4"
        >
            <button onClick={onBack} className="mb-4 text-indigo-600 dark:text-indigo-400">&larr; Orqaga</button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {studentName} uchun Fikr-mulohaza berish
            </h2>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feedbackTitle}</h3>
                <div className="mb-4">
                    <label htmlFor="score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ball (0-100):
                    </label>
                    <input
                        type="number"
                        id="score"
                        value={score}
                        onChange={(e) => setScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        min="0"
                        max="100"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="feedbackText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fikr-mulohaza matni:
                    </label>
                    <textarea
                        id="feedbackText"
                        rows="4"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Bu yerga fikr-mulohazani kiriting..."
                    ></textarea>
                </div>
                <button
                    onClick={handleSubmit}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                >
                    Saqlash
                </button>
            </div>
        </motion.div>
    );
}

export default GradeFeedbackScreen;