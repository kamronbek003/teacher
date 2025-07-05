import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { ArrowLeft, User, Calendar, MessageSquareText } from 'lucide-react';

// O'zbekcha oylar ro'yxati
const UZBEK_MONTHS = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

// Animatsiya variantlari
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { 
            staggerChildren: 0.1 
        }
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

function DailyFeedbackDetailScreen({ feedback, students, onBack }) {
    const student = students.find(s => s.id === feedback?.studentId);

    // Sanani vergulsiz, kerakli formatda chiqaruvchi funksiya
    const formatDateManually = (dateString) => {
        if (!dateString) return 'Noma\'lum sana';
        try {
            const date = new Date(dateString);
            if (isNaN(date)) throw new Error("Invalid Date");
            const day = date.getDate();
            const monthName = UZBEK_MONTHS[date.getMonth()];
            const year = date.getFullYear();
            return `${day}-${monthName} ${year}-yil`;
        } catch (error) {
            console.error("Sana formatlashda xato:", error);
            return 'Noto\'g\'ri sana';
        }
    };

    const formattedDate = formatDateManually(feedback?.feedbackDate);

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
             
             <motion.div 
                className="max-w-3xl mx-auto relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
             >
                {/* Orqaga qaytish tugmasi */}
                <motion.button 
                    onClick={onBack} 
                    whileHover={{ x: -4, scale: 1.05 }}
                    className="mb-6 inline-flex items-center gap-2 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors font-semibold"
                    variants={itemVariants}
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Orqaga qaytish</span>
                </motion.button>
                
                {/* Asosiy ma'lumotlar bloki (Glassmorphism) */}
                <motion.div 
                    className="relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 rounded-3xl shadow-2xl"
                    variants={itemVariants}
                >
                    {/* BALL KO'RSATKICHI (Dinamik joylashuv) */}
                    <motion.div 
                        className="absolute -top-10 -right-4 sm:-top-8 sm:-right-8 w-28 h-28 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-2xl text-white border-4 border-white/50 dark:border-gray-800/80"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                    >
                        <p className="text-5xl font-bold leading-none tracking-tight">{feedback?.ball ?? '–'}</p>
                        <p className="text-xs uppercase tracking-wider font-semibold">Ball</p>
                    </motion.div>

                    <div className="p-6 sm:p-8">
                        {/* Talaba ma'lumoti */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-3">
                               <User className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Talaba</p>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    {student ? `${student.firstName} ${student.lastName}` : 'Ma\'lumot topilmadi'}
                                </h2>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Sana bloki */}
                            <div className="flex items-start gap-4 p-4 bg-gray-500/5 dark:bg-gray-900/30 rounded-xl">
                                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 mt-1">
                                    <Calendar className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sana</p>
                                    <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{formattedDate}</p>
                                </div>
                            </div>

                            {/* Izoh bloki */}
                            <div className="flex items-start gap-4 p-4 bg-gray-500/5 dark:bg-gray-900/30 rounded-xl">
                                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 mt-1">
                                    <MessageSquareText className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">O'qituvchi izohi</p>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
                                        {feedback?.feedback || 'Izoh matni mavjud emas.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

DailyFeedbackDetailScreen.propTypes = {
    feedback: PropTypes.shape({
        id: PropTypes.string,
        studentId: PropTypes.string.isRequired,
        feedbackDate: PropTypes.string,
        feedback: PropTypes.string,
        ball: PropTypes.number,
    }).isRequired,
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
    })).isRequired,
    onBack: PropTypes.func.isRequired,
};

export default DailyFeedbackDetailScreen;