import React from 'react';
import { motion } from 'framer-motion';

function DailyFeedbackDetailScreen({ feedback, group, students, onBack, onNavigateToGradeFeedback }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className="p-4"
        >
            <button onClick={onBack} className="mb-4 text-indigo-600 dark:text-indigo-400">&larr; Guruhga qaytish</button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Fikr-mulohaza Tafsilotlari: {feedback?.id}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
                **Guruh:** {group?.name}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
                **Fikr-mulohaza matni:** {feedback?.feedback}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
                **Ball:** {feedback?.ball}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
                **Sana:** {new Date(feedback?.feedbackDate).toLocaleDateString()}
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                Talabalar va Ular Haqida Fikr-mulohazalar
            </h3>
            {students && students.length > 0 ? (
                <ul className="space-y-2">
                    {students.map(student => (
                        <li key={student.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex justify-between items-center">
                            <span className="text-gray-800 dark:text-gray-200">{student.fullName}</span>
                            <button
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                            >
                                Fikr-mulohaza berish
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-600 dark:text-gray-400">Bu guruhda talabalar topilmadi.</p>
            )}

        </motion.div>
    );
}

export default DailyFeedbackDetailScreen;