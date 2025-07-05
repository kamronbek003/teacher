import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import Card, { cardVariants } from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import FeedbackScreen from './FeedbackScreen'; 
import DailyFeedbackDetailScreen from './DailyFeedbackDetailScreen'; 
import { listVariants } from '../utils/animationVariants';
import { ArrowLeft, PlusCircle, CalendarCheck, Users, MessageSquare, Save, Filter } from 'lucide-react';

import {
    fetchGroupStudents,
    fetchDailyFeedbacksForGroup,
    fetchAttendance,
    saveAttendance, 
    AUTH_TOKEN_KEY 
} from '../services/api';

const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
};

const ATTENDANCE_STATUSES = [
    { value: 'KELDI', label: 'Kelgan', color: 'green' },
    { value: 'KELMADI', label: "Kelmagan", color: 'red' },
    { value: 'KECHIKDI', label: "Kechikkan", color: 'yellow' },
    { value: 'SABABLI', label: "Uzrli Sabab", color: 'blue' },
];

const GroupDetailScreen = ({ group, onBack }) => {
    const [students, setStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [errorStudents, setErrorStudents] = useState(null);

    const [dailyFeedbacks, setDailyFeedbacks] = useState([]);
    const [isLoadingDailyFeedbacks, setIsLoadingDailyFeedbacks] = useState(true);
    const [errorDailyFeedbacks, setErrorDailyFeedbacks] = useState(null);
    const [selectedFeedbackDate, setSelectedFeedbackDate] = useState(new Date()); // Date filter for daily feedbacks

    const [attendanceData, setAttendanceData] = useState({}); // Stores status for each student: { studentId: 'KELDI' }
    const [isSavingAttendance, setIsSavingAttendance] = useState(false);
    const [attendanceSaveError, setAttendanceSaveError] = useState(null);
    const [attendanceSuccessMessage, setAttendanceSuccessMessage] = useState('');
    const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(new Date());

    const [activeTab, setActiveTab] = useState('students');

    const [showFeedbackModal, setShowFeedbackModal] = useState(false); 
    const [showAttendanceModal, setShowAttendanceModal] = useState(false); 
    const [showDailyFeedbackDetail, setShowDailyFeedbackDetail] = useState(false); 
    const [currentViewingFeedback, setCurrentViewingFeedback] = useState(null); 

    const getAuthToken = useCallback(() => {
        try {
            return localStorage.getItem(AUTH_TOKEN_KEY);
        } catch (e) {
            console.error("Xatolik: localStorage-ga kirishda muammo yuz berdi:", e);
            return null;
        }
    }, []);

    const fetchGroupData = useCallback(async () => {
        if (!group?.id) {
            console.warn("GroupDetailScreen: Guruh prop mavjud emas yoki noto'g'ri.");
            setIsLoadingStudents(false);
            setIsLoadingDailyFeedbacks(false);
            setErrorStudents("Guruh ma'lumoti topilmadi.");
            setErrorDailyFeedbacks("Guruh ma'lumoti topilmadi.");
            setStudents([]);
            setDailyFeedbacks([]);
            return;
        }

        const token = getAuthToken();
        if (!token) {
            setErrorStudents("Avtorizatsiya tokeni topilmadi.");
            setErrorDailyFeedbacks("Avtorizatsiya tokeni topilmadi.");
            setIsLoadingStudents(false);
            setIsLoadingDailyFeedbacks(false);
            return;
        }

        setIsLoadingStudents(true);
        setErrorStudents(null);
        try {
            const studentResponse = await fetchGroupStudents(group.id, token);
            let studentData = [];
            if (studentResponse && Array.isArray(studentResponse.data)) {
                studentData = studentResponse.data;
            } else if (Array.isArray(studentResponse)) {
                studentData = studentResponse;
            } else {
                console.warn("Kutilmagan o'quvchi ma'lumot formati:", studentResponse);
                setErrorStudents("O'quvchi ma'lumotlari formati noto'g'ri.");
            }
            setStudents(studentData);
        } catch (err) {
            console.error("O'quvchilarni yuklashda xatolik:", err);
            setErrorStudents(err.message || "O'quvchilar ro'yxatini yuklab bo'lmadi.");
            setStudents([]);
        } finally {
            setIsLoadingStudents(false);
        }
    }, [group?.id, getAuthToken]);

    const fetchDailyFeedbacks = useCallback(async () => {
        if (!group?.id) return;

        setIsLoadingDailyFeedbacks(true);
        setErrorDailyFeedbacks(null);
        const token = getAuthToken();
        if (!token) {
            setErrorDailyFeedbacks("Avtorizatsiya tokeni topilmadi.");
            setIsLoadingDailyFeedbacks(false);
            return;
        }

        try {
            const dateFilter = selectedFeedbackDate.toISOString();
            const dailyFeedbackResponse = await fetchDailyFeedbacksForGroup(group.id, token, { date: dateFilter });
            let dailyFeedbackData = [];
            if (dailyFeedbackResponse && Array.isArray(dailyFeedbackResponse.data)) {
                dailyFeedbackData = dailyFeedbackResponse.data;
            } else if (Array.isArray(dailyFeedbackResponse)) {
                dailyFeedbackData = dailyFeedbackResponse;
            }
            setDailyFeedbacks(dailyFeedbackData);
        } catch (err) {
            console.error("Kunlik fikr-mulohazalarni yuklashda xatolik:", err);
            setErrorDailyFeedbacks(err.message || "Kunlik fikr-mulohazalar ro'yxatini yuklab bo'lmadi.");
            setDailyFeedbacks([]);
        } finally {
            setIsLoadingDailyFeedbacks(false);
        }
    }, [group?.id, selectedFeedbackDate, getAuthToken]);

    const fetchCurrentAttendance = useCallback(async () => {
        if (!group?.id) return;

        setAttendanceSaveError(null);
        const token = getAuthToken();
        if (!token) {
            setAttendanceSaveError("Avtorizatsiya tokeni topilmadi.");
            setAttendanceData({});
            return;
        }

        try {
            const dateFilter = selectedAttendanceDate.toISOString();
            const existingAttendance = await fetchAttendance({ groupId: group.id, date: dateFilter }, token);
            const attendanceMap = {};
            const attendanceRecords = existingAttendance?.data || existingAttendance; 

            if (Array.isArray(attendanceRecords)) {
                attendanceRecords.forEach(att => {
                    const normalizedStatus = ATTENDANCE_STATUSES.find(s => s.value === att.status)?.value || 'KELMADI';
                    attendanceMap[att.studentId] = normalizedStatus;
                });
            }
            setAttendanceData(attendanceMap);
        } catch (err) {
            console.error("Davomatni yuklashda xatolik:", err);
            setAttendanceSaveError("Davomatni yuklashda xatolik yuz berdi. Yangi davomat kiritishingiz mumkin.");
            setAttendanceData({}); 
        }
    }, [group?.id, selectedAttendanceDate, getAuthToken]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    useEffect(() => {
        if (activeTab === 'dailyFeedbacks') {
            fetchDailyFeedbacks();
        } else if (activeTab === 'attendance') {
            fetchCurrentAttendance();
        }
    }, [activeTab, fetchDailyFeedbacks, fetchCurrentAttendance]);

    const handleNewDailyFeedbackClick = () => {
        setShowFeedbackModal(true);
    };

    const handleFeedbackModalClose = () => {
        setShowFeedbackModal(false);
        fetchDailyFeedbacks();
    };

    const handleFeedbackSaveSuccess = () => {
        setShowFeedbackModal(false); 
        fetchDailyFeedbacks(); 
    };

    const handleTakeAttendanceClick = () => {
        setShowAttendanceModal(true);
        fetchCurrentAttendance();
    };

    const handleAttendanceModalClose = () => {
        setShowAttendanceModal(false);
        setAttendanceSaveError(null);
        setAttendanceSuccessMessage('');
    };

    const handleViewDailyFeedbackDetails = (feedback) => {
        setCurrentViewingFeedback(feedback);
        setShowDailyFeedbackDetail(true);
    };

    const handleBackFromDailyFeedbackDetail = () => {
        setShowDailyFeedbackDetail(false);
        setCurrentViewingFeedback(null);
    };

    const handleAttendanceChange = useCallback((studentId, status) => {
        setAttendanceData(prev => ({
            ...prev[studentId] === status ? prev : { ...prev, [studentId]: status }, 
        }));
        setAttendanceSaveError(null);
        setAttendanceSuccessMessage('');
    }, []);

    const handleSaveAttendance = useCallback(async () => {
        setIsSavingAttendance(true);
        setAttendanceSaveError(null);
        setAttendanceSuccessMessage('');

        const token = getAuthToken();
        if (!token) {
            setAttendanceSaveError("Avtorizatsiya tokeni topilmadi. Saqlash uchun qayta kiring.");
            setIsSavingAttendance(false);
            return;
        }

        if (!group?.id || students.length === 0) {
            setAttendanceSaveError("Guruh yoki talabalar ma'lumotlari mavjud emas.");
            setIsSavingAttendance(false);
            return;
        }

        let successfulSaves = 0;
        let failedSaves = 0;
        const errors = [];

        for (const student of students) {
            const status = attendanceData[student.id] || 'KELMADI'; 
            
            if (!student.id || typeof student.id !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(student.id)) {
                console.error(`Invalid studentId for student: ${student.firstName} ${student.lastName} (${student.id})`);
                errors.push(`O'quvchi ${student.firstName} ${student.lastName} (${student.id}) uchun noto'g'ri ID.`);
                failedSaves++;
                continue; 
            }
            if (!ATTENDANCE_STATUSES.some(s => s.value === status)) {
                console.error(`Invalid attendance status for student ${student.id}: ${status}`);
                errors.push(`O'quvchi ${student.firstName} ${student.lastName} uchun noto'g'ri davomat statusi: ${status}.`);
                failedSaves++;
                continue; 
            }

            const singleAttendancePayload = {
                groupId: group.id,
                studentId: student.id,
                date: selectedAttendanceDate.toISOString(),
                status: status,
                reason: '' 
            };

            try {
                await saveAttendance(singleAttendancePayload, token);
                successfulSaves++;
            } catch (err) {
                console.error(`O'quvchi ${student.firstName} ${student.lastName} davomatini saqlashda xatolik:`, err);
                errors.push(`O'quvchi ${student.firstName} ${student.lastName} uchun davomatni saqlab bo'lmadi: ${err.message || "Noma'lum xato"}`);
                failedSaves++;
            }
        }

        setIsSavingAttendance(false); 

        if (successfulSaves > 0 && failedSaves === 0) {
            setAttendanceSuccessMessage("Davomat muvaffaqiyatli saqlandi!");
        } else if (successfulSaves > 0 && failedSaves > 0) {
            setAttendanceSaveError(`Davomat qisman saqlandi. ${successfulSaves} ta muvaffaqiyatli, ${failedSaves} ta xato. Tafsilotlar: ${errors.join('; ')}`);
        } else {
            setAttendanceSaveError(`Davomatni saqlashda xatolik yuz berdi. Tafsilotlar: ${errors.join('; ')}`);
        }

        fetchCurrentAttendance();
        setTimeout(() => {
            setAttendanceSuccessMessage('');
            setAttendanceSaveError('');
        }, 5000); 
    }, [group, students, attendanceData, selectedAttendanceDate, fetchCurrentAttendance, getAuthToken]);

    const tabContentVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
    };

    if (showDailyFeedbackDetail && currentViewingFeedback) {
        return (
            <DailyFeedbackDetailScreen
                feedback={currentViewingFeedback}
                group={group}
                students={students} 
                onBack={handleBackFromDailyFeedbackDetail}
            />
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* "Orqaga qaytish" button to go back to the groups list */}
            <motion.button
                onClick={onBack}
                className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
                whileHover={{ x: -5 }}
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Guruhlar Ro'yxatiga
            </motion.button>

            {/* Group Information Card */}
            {group ? (
                <motion.div
                    variants={cardVariants}
                    className="mb-6 p-5 rounded-xl bg-blue-50 dark:bg-blue-900/30 shadow-sm border border-blue-100 dark:border-blue-800/50"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h1 className="text-2xl font-semibold text-blue-900 dark:text-blue-100 truncate" title={group.name || `Guruh ${group.groupId}`}>
                            {group.name || `Guruh ${group.groupId}`}
                        </h1>
                        <Badge variant={group.status === 'FAOL' ? 'success' : 'secondary'} className={group.status === 'FAOL' ? '!bg-green-100 !text-green-800 dark:!bg-green-900/50 dark:!text-green-200' : '!bg-gray-200 !text-gray-700 dark:!bg-gray-700 dark:!text-gray-200'}>{group.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4 text-blue-800/90 dark:text-blue-200/90">
                        <p><span className="font-medium text-blue-600 dark:text-blue-300/80">ID:</span> {group.groupId}</p>
                        <p><span className="font-medium text-blue-600 dark:text-blue-300/80">Narxi:</span> {group.coursePrice ? `${group.coursePrice.toLocaleString()} so'm` : 'Noma\'lum'}</p>
                        <p className="col-span-2"><span className="font-medium text-blue-600 dark:text-blue-300/80">Jadval:</span> {group.darsJadvali || 'Noma\'lum'}</p>
                        <p className="col-span-2"><span className="font-medium text-blue-600 dark:text-blue-300/80">Vaqt:</span> {group.darsVaqt || 'Noma\'lum'}</p>
                    </div>
                    {/* Action Buttons for Davomat Olish and Kunlik Baho */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-blue-100 dark:border-blue-800/50">
                        <Button
                            size="sm" variant="default" icon={CalendarCheck}
                            onClick={handleTakeAttendanceClick} 
                            disabled={isLoadingStudents || !!errorStudents || !students || students.length === 0}
                            className="!bg-blue-600 hover:!bg-blue-700 dark:!bg-blue-500 dark:hover:!bg-blue-600"
                        > Davomat Olish </Button>
                        <Button
                            size="sm" variant="outline" icon={PlusCircle}
                            onClick={handleNewDailyFeedbackClick} 
                            className="!border-blue-300 !text-blue-700 hover:!bg-blue-100 dark:!border-blue-700 dark:!text-blue-300 dark:hover:!bg-blue-900/40"
                        > Kunlik Baho </Button>
                    </div>
                </motion.div>
            ) : (
                <ErrorMessage message="Guruh ma'lumotlari topilmadi." />
            )}

            {/* Tab Navigation for Students, Daily Feedbacks, and Attendance */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                        activeTab === 'students'
                            ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent'
                    }`}
                >
                    <Users className="w-4 h-4 mr-2" />
                    O'quvchilar
                </button>
                <button
                    onClick={() => setActiveTab('dailyFeedbacks')}
                    className={`flex items-center px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                        activeTab === 'dailyFeedbacks'
                            ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent'
                    }`}
                >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Baholar
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`flex items-center px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                        activeTab === 'attendance'
                            ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent'
                    }`}
                >
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    Davomat
                </button>
            </div>

            {/* Tab Content Area with Animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Students List Tab Content */}
                    {activeTab === 'students' && (
                        <div>
                            {isLoadingStudents ? <Loader className="h-40" /> : errorStudents ? <ErrorMessage message={errorStudents} /> : students && students.length > 0 ? (
                                <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                                    {students.map(student => (
                                        <Card key={student.id} className="flex items-center space-x-3 !p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <Avatar src={student.image} fallback={student.firstName?.[0] + student.lastName?.[0]} className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{student.firstName} {student.lastName}</p>
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{student.phone}</p>
                                            </div>
                                            <Badge variant={student.status === 'FAOL' ? 'success' : 'secondary'} className="ml-auto flex-shrink-0">{student.status}</Badge>
                                        </Card>
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic text-center py-5">Bu guruhda o'quvchilar yo'q.</p>
                            )}
                        </div>
                    )}

                    {/* Daily Feedbacks List Tab Content */}
                    {activeTab === 'dailyFeedbacks' && (
                        <div>
                            {/* Date Filter for Daily Feedbacks */}
                            <div className="mb-4 flex items-center gap-2">
                                <label htmlFor="feedbackDateFilter" className="text-gray-700 dark:text-gray-300 text-sm">Sana bo'yicha filtr:</label>
                                <div className="relative flex-grow">
                                    <input
                                        type="date"
                                        id="feedbackDateFilter"
                                        value={formatDateForInput(selectedFeedbackDate)}
                                        onChange={(e) => setSelectedFeedbackDate(new Date(e.target.value))}
                                        className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm transition duration-150 appearance-none shadow-sm"
                                        aria-label="Fikr-mulohaza sanasini tanlash"
                                    />
                                    {/* Icon is here for visual purpose, input handles date selection */}
                                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                            {/* Display Daily Feedbacks or loading/error messages */}
                            {isLoadingDailyFeedbacks ? <Loader className="h-40" /> : errorDailyFeedbacks ? <ErrorMessage message={errorDailyFeedbacks} /> : dailyFeedbacks && dailyFeedbacks.length > 0 ? (
                                <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                                    {dailyFeedbacks.map(feedback => (
                                        <Card key={feedback.id} className="!p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{feedback.feedbackTitle || "Kunlik fikr-mulohaza"}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2">{feedback.feedback || "Tavsif yo'q"}</p>
                                            <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 dark:text-gray-400 gap-x-4 gap-y-1 border-t dark:border-gray-700 pt-2">
                                                <span>Sana: {feedback.feedbackDate ? new Date(feedback.feedbackDate).toLocaleDateString('uz-UZ') : 'Noma\'lum'}</span>
                                                <span>Ball: {feedback.ball || 0}</span>
                                            </div>
                                            <div className="text-right mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="!py-1"
                                                    onClick={() => handleViewDailyFeedbackDetails(feedback)}
                                                >
                                                    Batafsil Ko'rish
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic text-center py-5">Bu guruh uchun kunlik baholar yaratilmagan.</p>
                            )}
                        </div>
                    )}

                    {/* Attendance List Tab Content (This tab will primarily show a summary or allow selection for modal) */}
                    {activeTab === 'attendance' && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Davomat</h2>
                            {/* Date Filter for Attendance */}
                            <div className="mb-4 flex items-center gap-2">
                                <label htmlFor="attendanceDateFilter" className="text-gray-700 dark:text-gray-300 text-sm">Sana bo'yicha filtr:</label>
                                <div className="relative flex-grow">
                                    <input
                                        type="date"
                                        id="attendanceDateFilter"
                                        value={formatDateForInput(selectedAttendanceDate)}
                                        onChange={(e) => setSelectedAttendanceDate(new Date(e.target.value))}
                                        className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm transition duration-150 appearance-none shadow-sm"
                                        aria-label="Davomat sanasini tanlash"
                                    />
                                    {/* Icon is here for visual purpose, input handles date selection */}
                                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                            {isLoadingStudents ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader />
                                </div>
                            ) : students.length > 0 ? (
                                <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                                    {students.map(student => (
                                        <Card key={student.id} className="flex items-center space-x-3 !p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <Avatar src={student.image} fallback={student.firstName?.[0] + student.lastName?.[0]} className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{student.firstName} {student.lastName}</p>
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{student.phone}</p>
                                            </div>
                                            {/* Display current attendance status for the selected date if available */}
                                            {attendanceData[student.id] ? (
                                                <Badge
                                                    variant={
                                                        attendanceData[student.id] === 'KELDI' ? 'success' :
                                                        attendanceData[student.id] === 'KELMADI' ? 'error' :
                                                        attendanceData[student.id] === 'KECHIKDI' ? 'warning' :
                                                        'info'
                                                    }
                                                    className="ml-auto flex-shrink-0"
                                                >
                                                    {ATTENDANCE_STATUSES.find(s => s.value === attendanceData[student.id])?.label || attendanceData[student.id]}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                                    Belgilanmagan
                                                </Badge>
                                            )}
                                        </Card>
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic text-center py-5">Bu guruhda o'quvchilar yo'q.</p>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Feedback Screen as a Modal (positioned fixed on top of main content) */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex justify-center items-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl h-[90vh] overflow-hidden flex flex-col"
                        >
                            <FeedbackScreen
                                group={group}
                                students={students} 
                                onBack={handleFeedbackModalClose}
                                onSaveSuccess={handleFeedbackSaveSuccess}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attendance Modal */}
            <AnimatePresence>
                {showAttendanceModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex justify-center items-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Davomat Olish</h2>
                                <button
                                    onClick={handleAttendanceModalClose}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                {/* Date filter inside the attendance modal */}
                                <div className="mb-4 flex items-center gap-2">
                                    <label htmlFor="attendanceDateModal" className="text-gray-700 dark:text-gray-300 text-sm">Sana:</label>
                                    <div className="relative flex-grow">
                                        <input
                                            type="date"
                                            id="attendanceDateModal"
                                            value={formatDateForInput(selectedAttendanceDate)}
                                            onChange={(e) => setSelectedAttendanceDate(new Date(e.target.value))}
                                            className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm transition duration-150 appearance-none shadow-sm"
                                            aria-label="Davomat sanasini tanlash"
                                        />
                                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {attendanceSaveError && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
                                            <ErrorMessage message={attendanceSaveError} type="error" onClose={() => setAttendanceSaveError(null)} />
                                        </motion.div>
                                    )}
                                    {attendanceSuccessMessage && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
                                            <Card className="border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30">
                                                <p className="text-center text-green-700 dark:text-green-300 font-medium text-sm py-2">{attendanceSuccessMessage}</p>
                                        </Card>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isLoadingStudents ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Loader />
                                    </div>
                                ) : students.length > 0 ? (
                                    <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                                        {students.map(student => (
                                            <motion.div
                                                key={student.id}
                                                variants={cardVariants}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                                                    <Avatar src={student.image} fallback={student.firstName?.[0] + student.lastName?.[0]} className="h-8 w-8 rounded-full" />
                                                    <div className="font-medium text-gray-800 dark:text-gray-100">
                                                        {student.firstName} {student.lastName}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-2 justify-start sm:justify-end w-full sm:w-auto">
                                                    {ATTENDANCE_STATUSES.map(statusOption => (
                                                        <label key={statusOption.value} htmlFor={`attendance-${student.id}-${statusOption.value}`} className="flex items-center cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                id={`attendance-${student.id}-${statusOption.value}`}
                                                                name={`attendance-${student.id}`}
                                                                value={statusOption.value}
                                                                checked={attendanceData[student.id] === statusOption.value}
                                                                onChange={() => handleAttendanceChange(student.id, statusOption.value)}
                                                                className={`form-radio h-4 w-4 text-${statusOption.color}-600 dark:text-${statusOption.color}-500 transition duration-150 ease-in-out`}
                                                            />
                                                            <span className={`ml-2 text-sm text-gray-700 dark:text-gray-300`}>{statusOption.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <Card className="mt-6 shadow">
                                        <p className="text-center text-gray-500 dark:text-gray-400 py-8 italic">
                                            Bu guruhda hozircha o'quvchilar yo'q.
                                        </p>
                                    </Card>
                                )}
                            </div>
                            <div className="p-4 sm:p-6 mb-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <Button
                                    onClick={handleSaveAttendance}
                                    disabled={isSavingAttendance}
                                    className="w-full !py-2.5 !px-5 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors"
                                >
                                    {isSavingAttendance ? (
                                        <motion.div className="flex items-center justify-center">
                                            <motion.div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
                                            />
                                            Saqlanmoqda...
                                        </motion.div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <Save className="w-4 h-4 mr-2" />
                                            Davomatni Saqlash
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

GroupDetailScreen.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.string.isRequired,
        groupId: PropTypes.string,
        name: PropTypes.string,
        status: PropTypes.string,
        coursePrice: PropTypes.number,
        darsJadvali: PropTypes.string,
        darsVaqt: PropTypes.string,
    }).isRequired,
    onBack: PropTypes.func.isRequired,
};

export default GroupDetailScreen;
