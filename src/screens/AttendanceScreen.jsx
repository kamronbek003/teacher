import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import Card, { cardVariants } from "../components/Card";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { listVariants } from "../utils/animationVariants";
import {
    ArrowLeft,
    Save,
    UserCheck,
    UserX,
    Clock,
    ClipboardCheck,
    Calendar as CalendarIcon,
} from "lucide-react";
import {
    saveAttendance,
    fetchAttendance,
    AUTH_TOKEN_KEY,
} from "../services/api";

const ATTENDANCE_STATUS = {
    KELDI: "KELDI",
    KELMADI: "KELMADI",
    KECHIKDI: "KECHIKDI",
    SABABLI: "SABABLI",
};

const statusStyles = {
    [ATTENDANCE_STATUS.KELDI]: {
        icon: UserCheck,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/50",
        activeBgColor: "bg-green-600 dark:bg-green-500",
        activeTextColor: "text-white dark:text-gray-900",
        hoverBgColor: "hover:bg-green-200 dark:hover:bg-green-800/70",
        ringColor: "ring-green-500",
        label: "Keldi",
    },
    [ATTENDANCE_STATUS.KELMADI]: {
        icon: UserX,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/50",
        activeBgColor: "bg-red-600 dark:bg-red-500",
        activeTextColor: "text-white dark:text-gray-900",
        hoverBgColor: "hover:bg-red-200 dark:hover:bg-red-800/70",
        ringColor: "ring-red-500",
        label: "Kelmadi",
    },
    [ATTENDANCE_STATUS.KECHIKDI]: {
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/50",
        activeBgColor: "bg-yellow-500 dark:bg-yellow-400",
        activeTextColor: "text-white dark:text-gray-900",
        hoverBgColor: "hover:bg-yellow-200 dark:hover:bg-yellow-800/70",
        ringColor: "ring-yellow-500",
        label: "Kechikdi",
    },
    [ATTENDANCE_STATUS.SABABLI]: {
        icon: ClipboardCheck,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/50",
        activeBgColor: "bg-blue-600 dark:bg-blue-500",
        activeTextColor: "text-white dark:text-gray-900",
        hoverBgColor: "hover:bg-blue-200 dark:hover:bg-blue-800/70",
        ringColor: "ring-blue-500",
        label: "Sababli",
    },
};

const formatDateForInput = (date) => {
    if (!date || isNaN(new Date(date).getTime())) {
        date = new Date();
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const day = `0${d.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
};

const AttendanceScreen = ({ group, students, onBack, onSaveSuccess }) => {
    const [attendance, setAttendance] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(true);
    const [saveError, setSaveError] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());

    const todayFormatted = useMemo(() => formatDateForInput(new Date()), []);

    useEffect(() => {
        if (!group?.id || !Array.isArray(students)) {
            setFetchError("Guruh yoki talabalar ma'lumotlari mavjud emas.");
            setIsLoadingExisting(false);
            return;
        }

        const abortController = new AbortController();
        const loadAttendanceForDate = async () => {
            setIsLoadingExisting(true);
            setFetchError(null);
            setAttendance({});

            let token;
            try {
                token = localStorage.getItem(AUTH_TOKEN_KEY);
            } catch (e) {
                console.warn("localStorage is not available:", e);
                setFetchError(
                    "Avtorizatsiya tokenini olishda xatolik. Iltimos, qayta kiring."
                );
                setIsLoadingExisting(false);
                return;
            }

            if (!token) {
                setFetchError(
                    "Avtorizatsiya tokeni topilmadi. Iltimos, qayta kiring."
                );
                setIsLoadingExisting(false);
                return;
            }

            try {
                const dateStr = formatDateForInput(selectedDate);
                const existingRecordsArray = await fetchAttendance(
                    { groupId: group.id, date: dateStr },
                    token,
                    { signal: abortController.signal }
                );

                const attendanceMap = new Map();
                if (
                    existingRecordsArray &&
                    Array.isArray(existingRecordsArray)
                ) {
                    existingRecordsArray.forEach((rec) => {
                        if (rec.studentId) {
                            attendanceMap.set(rec.studentId, rec.status);
                        }
                    });
                }

                const newAttendanceState = {};
                students.forEach((student) => {
                    newAttendanceState[student.id] =
                        attendanceMap.get(student.id) ||
                        ATTENDANCE_STATUS.KELDI;
                });
                setAttendance(newAttendanceState);
            } catch (err) {
                if (err.name === "AbortError") return;
                console.error("Mavjud davomatni yuklashda xatolik:", err);
                setFetchError(
                    err.message ||
                        "Mavjud davomatni yuklashda xatolik yuz berdi."
                );
                const defaultAttendance = {};
                students.forEach((student) => {
                    defaultAttendance[student.id] = ATTENDANCE_STATUS.KELDI;
                });
                setAttendance(defaultAttendance);
            } finally {
                setIsLoadingExisting(false);
            }
        };

        loadAttendanceForDate();

        return () => {
            abortController.abort();
        };
    }, [group, students, selectedDate]);

    const handleStatusChange = useCallback((studentId, status) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
        setSaveError(null);
        setSuccessMessage("");
    }, []);

    const handleSaveAttendance = async () => {
        setIsSaving(true);
        setSaveError(null);
        setSuccessMessage("");

        let token;
        try {
            token = localStorage.getItem(AUTH_TOKEN_KEY);
        } catch (e) {
            console.warn("localStorage is not available:", e);
            setSaveError(
                "Avtorizatsiya tokenini olishda xatolik. Saqlash uchun qayta kiring."
            );
            setIsSaving(false);
            return;
        }

        if (!token) {
            setSaveError(
                "Avtorizatsiya tokeni topilmadi. Saqlash uchun qayta kiring."
            );
            setIsSaving(false);
            return;
        }

        if (!Array.isArray(students) || students.length === 0) {
            setSaveError("Bu guruhda o'quvchilar mavjud emas.");
            setIsSaving(false);
            return;
        }

        if (Object.keys(attendance).length !== students.length) {
            setSaveError("Barcha o'quvchilar uchun davomat belgilanmagan.");
            setIsSaving(false);
            return;
        }

        const attendanceData = {
            groupId: group.id,
            date: formatDateForInput(selectedDate),
            records: Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status,
            })),
        };

        try {
            const response = await saveAttendance(attendanceData, token);
            setSuccessMessage(
                response.message || "Davomat muvaffaqiyatli saqlandi!"
            );
            if (onSaveSuccess) onSaveSuccess(attendanceData);
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error("Davomatni saqlashda xatolik:", err);
            setSaveError(
                err.message || "Davomatni saqlashda xatolik yuz berdi."
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleDateChange = (event) => {
        const newDateValue = event.target.value;
        if (newDateValue) {
            const newDate = new Date(newDateValue);
            const adjustedDate = new Date(
                newDate.getUTCFullYear(),
                newDate.getUTCMonth(),
                newDate.getUTCDate()
            );
            if (!isNaN(adjustedDate.getTime())) {
                setSelectedDate(adjustedDate);
                setFetchError(null);
            } else {
                setFetchError(
                    "Noto'g'ri sana tanlandi. Iltimos, to'g'ri sana kiriting."
                );
            }
        }
    };

    if (!group) {
        return (
            <div className="p-4">
                <motion.button
                    onClick={onBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mb-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
                    aria-label="Orqaga qaytish"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Orqaga
                </motion.button>
                <ErrorMessage message="Guruh ma'lumotlari topilmadi." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen"
        >
            <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mb-4 inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                aria-label="Guruhga qaytish"
            >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Guruhga Qaytish
            </motion.button>

            <Card variants={cardVariants} className="mb-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                            Davomat Olish: {group?.groupId || `Noma'lum Guruh`}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sana:{" "}
                            {selectedDate.toLocaleDateString("uz-UZ", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            type="date"
                            value={formatDateForInput(selectedDate)}
                            onChange={handleDateChange}
                            max={todayFormatted}
                            className="w-full sm:w-auto pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm transition duration-150 appearance-none shadow-sm"
                            aria-label="Davomat sanasini tanlash"
                        />
                    </div>
                </div>
            </Card>

            <AnimatePresence>
                {saveError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4"
                    >
                        <ErrorMessage
                            message={saveError}
                            type="error"
                            onClose={() => setSaveError(null)}
                        />
                    </motion.div>
                )}
                {fetchError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4"
                    >
                        <ErrorMessage
                            message={fetchError}
                            type="error"
                            onClose={() => setFetchError(null)}
                        />
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4"
                    >
                        <Card className="border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30">
                            <p className="text-center text-green-700 dark:text-green-300 font-medium text-sm py-2">
                                {successMessage}
                            </p>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoadingExisting ? (
                <div className="flex justify-center items-center h-40">
                    <Loader />
                </div>
            ) : Array.isArray(students) && students.length > 0 ? (
                <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                >
                    {students.map((student) => {
                        const currentStatus = attendance[student.id];
                        if (!currentStatus) return null;

                        return (
                            <Card
                                key={student.id}
                                className="!p-3 sm:!p-4 shadow-md hover:shadow-lg transition-shadow duration-200"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center space-x-3 flex-grow min-w-0">
                                        <Avatar
                                            src={student.image}
                                            fallback={
                                                student.firstName?.[0] +
                                                (student.lastName?.[0] || "")
                                            }
                                            className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full shadow"
                                        />
                                        <div className="min-w-0">
                                            <p
                                                className="font-medium text-gray-800 dark:text-gray-100 truncate"
                                                title={`${student.firstName} ${student.lastName}`}
                                            >
                                                {student.firstName}{" "}
                                                {student.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {student.studentId ||
                                                    `ID: ${student.id}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex space-x-1.5 sm:space-x-2 w-full sm:w-auto justify-end flex-wrap gap-y-1.5">
                                        {Object.values(ATTENDANCE_STATUS).map(
                                            (status) => {
                                                const style =
                                                    statusStyles[status];
                                                const isActive =
                                                    currentStatus === status;
                                                const buttonClasses = `!px-2 !py-1.5 sm:!px-3 !text-xs sm:!text-sm transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${
                                                    style.ringColor
                                                } ${
                                                    isActive
                                                        ? `${style.activeBgColor} ${style.activeTextColor} shadow-md`
                                                        : `${style.bgColor} ${style.color} ${style.hoverBgColor} hover:shadow`
                                                }`;
                                                return (
                                                    <Button
                                                        key={status}
                                                        size="sm"
                                                        variant={"ghost"}
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                student.id,
                                                                status
                                                            )
                                                        }
                                                        className={
                                                            buttonClasses
                                                        }
                                                        title={style.label}
                                                        aria-label={`O'quvchi ${student.firstName} ${student.lastName} uchun ${style.label} holatini belgilash`}
                                                        aria-pressed={isActive}
                                                    >
                                                        <style.icon
                                                            className={`w-4 h-4 ${
                                                                isActive
                                                                    ? ""
                                                                    : "sm:mr-1.5"
                                                            }`}
                                                        />
                                                        <span
                                                            className={`hidden ${
                                                                isActive
                                                                    ? "sm:hidden"
                                                                    : "sm:inline"
                                                            }`}
                                                        >
                                                            {style.label}
                                                        </span>
                                                        {isActive && (
                                                            <span className="sm:hidden ml-1.5">
                                                                {style.label}
                                                            </span>
                                                        )}
                                                    </Button>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </motion.div>
            ) : (
                <Card className="mt-6 shadow">
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8 italic">
                        Bu guruhda hozircha o'quvchilar yo'q yoki o'quvchilar
                        ro'yxati yuklanmadi.
                    </p>
                </Card>
            )}

            {Array.isArray(students) &&
                students.length > 0 &&
                !isLoadingExisting && (
                    <motion.div
                        className="mt-8 text-center"
                        variants={cardVariants}
                    >
                        <Button
                            size="lg"
                            onClick={handleSaveAttendance}
                            disabled={isSaving}
                            className={`w-full sm:w-auto !py-3 !px-6 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:ring-indigo-400 ${
                                isSaving
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
                            }`}
                            aria-label="Davomatni saqlash"
                            aria-disabled={isSaving}
                        >
                            {isSaving ? (
                                <motion.div className="flex items-center justify-center">
                                    <motion.div
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            repeat: Infinity,
                                            ease: "linear",
                                            duration: 0.8,
                                        }}
                                    />
                                    Saqlanmoqda...
                                </motion.div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <Save className="w-5 h-5 mr-2" />
                                    Davomatni Saqlash
                                </div>
                            )}
                        </Button>
                    </motion.div>
                )}
        </motion.div>
    );
};

AttendanceScreen.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        groupId: PropTypes.string,
    }),
    students: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
                .isRequired,
            firstName: PropTypes.string.isRequired,
            lastName: PropTypes.string,
            studentId: PropTypes.string,
            image: PropTypes.string,
        })
    ),
    onBack: PropTypes.func.isRequired,
    onSaveSuccess: PropTypes.func,
};

export default AttendanceScreen;
