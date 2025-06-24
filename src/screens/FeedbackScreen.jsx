import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { Save, CalendarDays } from 'lucide-react';
import { createDailyFeedback } from '../services/api';
import { listVariants } from '../utils/animationVariants';

const SCORE_BASED_FEEDBACK_TEMPLATES = [
    { range: [90, 100], feedback: 'A\'lo darajadagi ishlash. Barcha ko\'rsatkichlar bo\'yicha yuqori natijalar ko\'rsatdi.' },
    { range: [80, 89], feedback: 'Juda yaxshi natija. Berilgan vazifalarni to\'g\'ri bajargan, darsda faol qatnashgan.' },
    { range: [70, 79], feedback: 'Yaxshi natija. Mavzuni o\'zlashtirgan, ammo ba\'zi jihatlarda qo\'shimcha e\'tibor talab etiladi.' },
    { range: [60, 69], feedback: 'Qoniqarli natija. Asosiy tushunchalarni o\'zlashtirgan, biroq faollikni oshirish va vazifalarni to\'liq bajarish ustida ishlash kerak.' },
    { range: [50, 59], feedback: 'Yomon natija. Mavzuni o\'zlashtirishda katta qiyinchiliklarga duch kelmoqda. Qo\'shimcha darslar va individual yondashuv tavsiya etiladi.' },
    { range: [0, 49], feedback: 'Juda yomon natija. Jiddiy e\'tibor va yordam talab qiladi. Darsga tayyorgarlik ko\'rish va faol qatnashish kerak.' },
];

const formatDateForInput = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
};

const FeedbackScreen = ({ group, students, onBack, onSaveSuccess }) => {
    const [studentFeedbacks, setStudentFeedbacks] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [feedbackDate, setFeedbackDate] = useState(new Date());

    const activeStudents = students.filter(student => student.status === 'FAOL');

    useEffect(() => {
        const initialFeedbacks = {};
        activeStudents.forEach(student => {
            if (!studentFeedbacks[student.id]) {
                initialFeedbacks[student.id] = {
                    ball: '', 
                    feedback: '',
                    isFeedbackCustom: false,
                };
            }
        });
        setStudentFeedbacks(prev => ({ ...initialFeedbacks, ...prev }));
    }, [activeStudents]);


    const handleFeedbackChange = useCallback((studentId, field, value) => {
        setStudentFeedbacks(prev => {
            const currentFeedbackState = prev[studentId] || { ball: '', feedback: '', isFeedbackCustom: false };
            let newFeedbackState = { ...currentFeedbackState, [field]: value };

            if (field === 'feedback') {
                newFeedbackState.isFeedbackCustom = true;
            } else if (field === 'ball') {
                const parsedBall = parseInt(value);
                if (!isNaN(parsedBall)) {
                    const suggestedTemplate = SCORE_BASED_FEEDBACK_TEMPLATES.find(
                        t => parsedBall >= t.range[0] && parsedBall <= t.range[1]
                    );

                    if (suggestedTemplate && (!newFeedbackState.isFeedbackCustom || newFeedbackState.feedback === '')) {
                        newFeedbackState.feedback = suggestedTemplate.feedback;
                        newFeedbackState.isFeedbackCustom = false; 
                    } else if (!newFeedbackState.isFeedbackCustom && value === '') {
                        newFeedbackState.feedback = '';
                    }
                } else {
                    if (!newFeedbackState.isFeedbackCustom) {
                        newFeedbackState.feedback = '';
                    }
                }
            }

            return { ...prev, [studentId]: newFeedbackState };
        });
        setSaveError(null); 
        setSaveSuccess(false);
    }, []);

    const validateFeedback = (feedback) => {
        if (feedback.ball === '' || feedback.ball === null || isNaN(parseInt(feedback.ball))) {
            return "Ball qiymati to'g'ri kiritilmagan.";
        }
        if (!feedback.feedback || feedback.feedback.trim() === '') {
            return "Fikr-mulohaza tavsifi bo'sh bo'lishi mumkin emas.";
        }
        const parsedBall = parseInt(feedback.ball);
        if (parsedBall < 0 || parsedBall > 100) { 
            return "Ball 0 dan 100 gacha bo'lishi kerak.";
        }
        return null; 
    };

    const handleSaveAllFeedback = useCallback(async () => {
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        const token = localStorage.getItem('authToken');
        if (!token) {
            setSaveError("Avtorizatsiya tokeni topilmadi. Iltimos, qayta kiring.");
            setIsSaving(false);
            return;
        }

        if (activeStudents.length === 0) {
            setSaveError("Faol o'quvchilar topilmadi, baholash mumkin emas.");
            setIsSaving(false);
            return;
        }

        let successfulSaves = 0;
        let failedSaves = 0;
        const errors = [];

        for (const student of activeStudents) { 
            const feedback = studentFeedbacks[student.id];

            if (!feedback) { 
                errors.push(`O'quvchi ${student.firstName} ${student.lastName} uchun baho ma'lumotlari topilmadi.`);
                failedSaves++;
                continue;
            }

            const validationError = validateFeedback(feedback);
            if (validationError) {
                errors.push(`O'quvchi ${student.firstName} ${student.lastName} uchun: ${validationError}`);
                failedSaves++;
                continue;
            }

            const payload = {
                studentId: student.id,
                groupId: group.id,
                ball: parseInt(feedback.ball),
                feedback: feedback.feedback,
                feedbackDate: feedbackDate.toISOString(),
            };

            console.log(`Saving feedback for ${student.firstName} ${student.lastName}:`, payload);

            try {
                await createDailyFeedback(payload, token);
                successfulSaves++;
            } catch (err) {
                console.error(`O'quvchi ${student.firstName} ${student.lastName} uchun baho saqlashda xatolik:`, err);
                errors.push(`O'quvchi ${student.firstName} ${student.lastName} uchun baho saqlab bo'lmadi: ${err.message || 'Noma\'lum xato'}`);
                failedSaves++;
            }
        }

        if (successfulSaves > 0) {
            setSaveSuccess(true);
            setStudentFeedbacks(prev => {
                const newFeedbacks = { ...prev };
                activeStudents.forEach(student => { 
                    const studentHasError = errors.some(err => err.includes(student.firstName) && err.includes(student.lastName));
                    if (!studentHasError) {
                        delete newFeedbacks[student.id]; 
                    }
                });
                return newFeedbacks;
            });
            setSaveSuccess(false); 
            onSaveSuccess(); 
        }

        if (failedSaves > 0) {
            setSaveError(`Baho saqlashda ${failedSaves} ta xato yuz berdi. Tafsilotlar: ${errors.join('; ')}`);
        } else if (successfulSaves === 0 && failedSaves === 0 && activeStudents.length > 0) {
            setSaveError("Hech qanday baho saqlanmadi. Ma'lumotlarni tekshiring.");
        }


        setIsSaving(false);
    }, [studentFeedbacks, activeStudents, group.id, onSaveSuccess, feedbackDate]);


    const studentListVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const studentItemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    const inputVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
    };

    const generateScoreButtons = () => {
        const scores = [];
        for (let i = 50; i <= 100; i += 5) {
            scores.push(i);
        }
        return scores;
    };

    return (
        <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg">

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Save Status Messages */}
                <AnimatePresence>
                    {saveError && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-4"
                        >
                            <ErrorMessage message={saveError} type="error" onClose={() => setSaveError(null)} />
                        </motion.div>
                    )}
                    {saveSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-4"
                        >
                            <Card className="border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30">
                                <p className="text-center text-green-700 dark:text-green-300 font-medium text-sm py-2">Baho muvaffaqiyatli saqlandi!</p>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
                        <CalendarDays className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                        Baho sanasini tanlang
                    </h3>
                    <div className="relative flex-grow">
                        <input
                            type="date"
                            id="feedbackDate"
                            value={formatDateForInput(feedbackDate)}
                            onChange={(e) => setFeedbackDate(new Date(e.target.value))}
                            className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm transition duration-150 appearance-none shadow-sm"
                            aria-label="Fikr-mulohaza sanasini tanlash"
                        />
                    </div>
                </div>

                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">O'quvchilar ro'yxati va baholash:</h3>
                {activeStudents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 italic text-center py-5">Faol o'quvchilar topilmadi.</p>
                ) : (
                    <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
                        {activeStudents.map(student => {
                            const feedback = studentFeedbacks[student.id] || { ball: '', feedback: '', isFeedbackCustom: false };

                            return (
                                <motion.div
                                    key={student.id}
                                    variants={studentItemVariants}
                                    className={`
                                        p-4 rounded-xl transition-all duration-200 border
                                        bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/60
                                    `}
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Avatar src={student.image} fallback={student.firstName?.[0] + student.lastName?.[0]} className="h-10 w-10 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight truncate">{student.firstName} {student.lastName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{group.name || group.groupId}</p>
                                        </div>
                                    </div>

                                    <motion.div variants={inputVariants} className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div>
                                            <label htmlFor={`ball-${student.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ball:</label>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <input
                                                    id={`ball-${student.id}`}
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={feedback.ball}
                                                    onChange={(e) => handleFeedbackChange(student.id, 'ball', e.target.value)}
                                                    placeholder="0-100"
                                                    className="block w-full sm:w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm py-2.5 px-3 flex-shrink-0"
                                                    disabled={isSaving}
                                                />
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {generateScoreButtons().map(score => (
                                                        <Button
                                                            key={score}
                                                            onClick={() => handleFeedbackChange(student.id, 'ball', score.toString())}
                                                            variant="outline"
                                                            size="xs"
                                                            className="!py-1.5 !px-3 text-xs !rounded-full !border-gray-300 dark:!border-gray-600 hover:!bg-blue-100 dark:hover:!bg-blue-900/40"
                                                            disabled={isSaving}
                                                        >
                                                            {score}
                                                        </Button>
                                                    ))}
                                                     <Button
                                                        onClick={() => handleFeedbackChange(student.id, 'ball', '')}
                                                        variant="outline"
                                                        size="xs"
                                                        className="!py-1.5 !px-3 text-xs !rounded-full !border-red-300 !text-red-600 dark:!border-red-600 dark:!text-red-400 hover:!bg-red-100 dark:hover:!bg-red-900/40"
                                                        disabled={isSaving}
                                                    >
                                                        Tozalash
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor={`feedback-${student.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fikr-mulohaza tavsifi:</label>
                                            <textarea
                                                id={`feedback-${student.id}`}
                                                value={feedback.feedback}
                                                onChange={(e) => handleFeedbackChange(student.id, 'feedback', e.target.value)}
                                                placeholder="O'quvchining bugungi darsdagi harakatlari haqida batafsil ma'lumot kiriting..."
                                                rows="3"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm py-2.5 px-3 resize-y"
                                                disabled={isSaving}
                                            ></textarea>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {activeStudents.length > 0 && (
                <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-end"> 
                    <Button
                        onClick={handleSaveAllFeedback}
                        disabled={isSaving}
                        className="w-full sm:w-auto !py-3 !px-5 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md shadow-md transition-colors font-semibold"
                    >
                        {isSaving ? (
                            <motion.div className="flex items-center justify-center">
                                <motion.div
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
                                />
                                Saqlanmoqda...
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Save className="w-5 h-5 mr-2" />
                                Baholarni Saqlash
                            </div>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

FeedbackScreen.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        groupId: PropTypes.string,
    }).isRequired,
    students: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            firstName: PropTypes.string,
            lastName: PropTypes.string,
            image: PropTypes.string,
            status: PropTypes.string, 
        })
    ).isRequired,
    onBack: PropTypes.func.isRequired,
    onSaveSuccess: PropTypes.func.isRequired,
};

export default FeedbackScreen;
