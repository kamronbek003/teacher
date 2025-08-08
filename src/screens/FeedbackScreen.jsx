import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { Save, CalendarDays, X, MessageSquare } from "lucide-react";
import { createDailyFeedback, AUTH_TOKEN_KEY } from "../services/api";
import { listVariants } from "../utils/animationVariants";

// --- Boshlanish: Maxsus Bildirishnoma uchun Komponent va Stillar ---

const allCustomNotificationStyles = `
.custom-notification-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100; /* Modal oynadan yuqorida bo'lishi uchun */
}

.custom-notification-backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.custom-notification-content {
  position: relative;
//   align-content: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px 40px;
  width: 280px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2);
//   text-align: center;
//   background-color: red;
}

.custom-notification-content p {
  margin-top: 20px;
  font-size: 18px;
  font-weight: 600;
//   background-color:red;
}

/* Animatsiya icon */
.animated-icon {
  width: 80px;
  height: 80px;
  margin-left: 13px;
//   text-align: center;
//   background-color: red;
}

.animated-icon .path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 0;
}

/* SUCCESS style */
.success-icon .path.circle {
  stroke: #4CAF50;
  animation: custom-dash 0.9s ease-in-out;
}
.success-icon .path.check {
  stroke: #4CAF50;
  stroke-dashoffset: -100;
  animation: custom-dash-check 0.9s 0.35s ease-in-out forwards;
}
.success-toast p {
  color: #388E3C;
}

/* ERROR style */
.error-icon .path.circle {
  stroke: #F44336;
  animation: custom-dash 0.9s ease-in-out;
}
.error-icon .path.line {
  stroke: #F44336;
  stroke-dashoffset: 1000;
  animation: custom-dash 0.9s 0.35s ease-in-out forwards;
}
.error-toast p {
  color: #D32F2F;
}

/* Animatsiya keyframes */
@keyframes custom-dash {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

@keyframes custom-dash-check {
  from { stroke-dashoffset: -100; }
  to { stroke-dashoffset: 900; }
}
`;


const CustomNotification = ({ notification, onClear }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClear();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClear]);

    if (!notification) {
        return null;
    }

    const isSuccess = notification.type === "success";

    const content = isSuccess ? (
        <div className="toast-content-wrapper success-toast">
            <div className="animated-icon success-icon">
                <svg
                    className="animated-icon success-icon"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 80 80"
                >
                    <circle
                        className="path circle"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="5"
                        strokeMiterlimit="10"
                        cx="40"
                        cy="40"
                        r="37"
                    />
                    <polyline
                        className="path check"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeMiterlimit="10"
                        points="25,40 35,50 55,30"
                    />
                </svg>
            </div>
            <p>{notification.message}</p>
        </div>
    ) : (
        <div className="toast-content-wrapper error-toast">
            <div className="animated-icon error-icon">
                <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 130.2 130.2"
                >
                    <circle
                        className="path circle"
                        fill="none"
                        stroke="#F44336"
                        strokeWidth="6"
                        strokeMiterlimit="10"
                        cx="65.1"
                        cy="65.1"
                        r="62.1"
                    />
                    <line
                        className="path line"
                        fill="none"
                        stroke="#F44336"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeMiterlimit="10"
                        x1="34.4"
                        y1="37.9"
                        x2="95.8"
                        y2="92.3"
                    />
                    <line
                        className="path line"
                        fill="none"
                        stroke="#F44336"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeMiterlimit="10"
                        x1="95.8"
                        y1="38"
                        x2="34.4"
                        y2="92.2"
                    />
                </svg>
            </div>
            <p>{notification.message}</p>
        </div>
    );

    return (
        <div className="custom-notification-overlay">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="custom-notification-backdrop"
            />
            <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="custom-notification-content"
            >
                {content}
            </motion.div>
        </div>
    );
};

// --- Tugash: Maxsus Bildirishnoma uchun Komponent va Stillar ---

const SCORE_BASED_FEEDBACK_TEMPLATES = [
    {
        range: [100, 100],
        feedback:
            "Maksimal natija – 100 ball! Aql-zakovat, mehnatsevarlik va izlanishning yorqin namunasi! Bu o‘quvchi nafaqat mavzuni chuqur o‘zlashtirgan, balki o‘z fikrini erkin bayon eta oladi, ijodiy yondashuvga ega va o‘rnak bo‘lish darajasida yetuk. Bunday yutuqlar faqat qat’iyat, mas’uliyat va tinimsiz harakat orqali qo‘lga kiritiladi. Shu ruhda davom etsa, yuksak cho‘qqilar uni kutmoqda!",
    },
    {
        range: [95, 99],
        feedback:
            "Zo‘r natija! O‘quvchi mavzuni mukammal o‘zlashtirgan, mustaqil fikrlay oladi va ijodiy yondashuv ko‘rsatgan. Bunday yuksak daraja ilhomlantiradi. Davom et!",
    },
    {
        range: [90, 94],
        feedback:
            "A’lo! Darsda faol ishtirok etadi, topshiriqlarni to‘g‘ri va o‘z vaqtida bajaradi. Mavzuni chuqur tushungan, izlanishga qiziqishi baland. Barakali mehnat!",
    },
    {
        range: [85, 89],
        feedback:
            "Juda yaxshi! Bilim darajasi yuqori, savollarga aniq va puxta javob beradi. O‘z fikrini bildirishga intiladi. Yana biroz harakat bilan mukammallikka erishadi.",
    },
    {
        range: [80, 84],
        feedback:
            "Yaxshi! Mavzuni yaxshi o‘zlashtirgan, topshiriqlarni to‘g‘ri bajargan. Ayrim joylarda ishonch yetishmasa-da, umumiy tayyorgarligi mustahkam.",
    },
    {
        range: [75, 79],
        feedback:
            "O‘rtadan yuqori. Mavzu bo‘yicha tushunchasi yetarli, ba’zida xatoliklarga yo‘l qo‘ygan. Yaxshi natijaga erishgan, ammo doimiy mashq foydali bo‘ladi.",
    },
    {
        range: [70, 74],
        feedback:
            "Qoniqarli. Asosiy tushunchalarni o‘zlashtirgan, ammo ayrim savollarda ikkilanib qolgan. Diqqatni jamlab, darsga tayyorgarlikni oshirishi kerak.",
    },
    {
        range: [65, 69],
        feedback:
            "O‘tish darajasi. Bilimlar yetarli darajada emas, mavzuni yuzaki tushungan. O‘z ustida mustaqil ishlash va darslikka qayta murojaat qilish foyda beradi.",
    },
    {
        range: [60, 64],
        feedback:
            "Minimal talab. Mavzuni tushunishda qiynalgan, topshiriqlarning bir qismi bajarilgan. Bilimni mustahkamlash uchun ko‘proq vaqt ajratishi kerak.",
    },
    {
        range: [55, 59],
        feedback:
            "Kuchsiz. O‘zlashtirishda jiddiy bo‘shliqlar mavjud. Dars materiallarini qayta ko‘rib chiqish va o‘qituvchi bilan alohida ishlash zarur.",
    },
    {
        range: [50, 54],
        feedback:
            "Juda kuchsiz. Tayyorlanish yetarli emas, asosiy tushunchalar yaxshi o‘zlashtirilmagan. Bilimni qayta shakllantirish ustida ishlashi kerak.",
    },
    {
        range: [40, 49],
        feedback:
            "Yomon. Darsda ishtirok sust, topshiriqlar bajarilmagan yoki noto‘g‘ri bajarilgan. O‘rganishga jiddiyroq yondashuvi lozim.",
    },
    {
        range: [0, 39],
        feedback:
            "Qoniqarsiz. O‘quv faoliyatiga bo‘lgan munosabat juda sust. Darsga qatnashmagan yoki topshiriqlarni bajarmagan. Ota-onasi bilan alohida suhbat tavsiya etiladi.",
    },
];

const formatDateForInput = (date) => {
    if (!date || isNaN(date.getTime())) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const day = `0${d.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
};

const FeedbackScreen = ({ group, students, onBack, onSaveSuccess }) => {
    const [studentFeedbacks, setStudentFeedbacks] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [feedbackDate, setFeedbackDate] = useState(new Date());

    const activeStudents = useMemo(
        () => students.filter((student) => student.status === "FAOL"),
        [students]
    );

    useEffect(() => {
        const initialFeedbacks = {};
        activeStudents.forEach((student) => {
            if (!studentFeedbacks[student.id]) {
                initialFeedbacks[student.id] = {
                    ball: "",
                    feedback: "",
                    isFeedbackCustom: false,
                };
            }
        });
        if (Object.keys(initialFeedbacks).length > 0) {
            setStudentFeedbacks((prev) => ({ ...initialFeedbacks, ...prev }));
        }
    }, [activeStudents]);

    const handleFeedbackChange = useCallback((studentId, field, value) => {
        setStudentFeedbacks((prev) => {
            const currentFeedbackState = prev[studentId] || {
                ball: "",
                feedback: "",
                isFeedbackCustom: false,
            };
            let newFeedbackState = { ...currentFeedbackState, [field]: value };

            if (field === "feedback") {
                newFeedbackState.isFeedbackCustom = true;
            } else if (field === "ball") {
                const parsedBall = parseInt(value, 10);
                if (!isNaN(parsedBall)) {
                    const suggestedTemplate =
                        SCORE_BASED_FEEDBACK_TEMPLATES.find(
                            (t) =>
                                parsedBall >= t.range[0] &&
                                parsedBall <= t.range[1]
                        );

                    if (
                        suggestedTemplate &&
                        (!newFeedbackState.isFeedbackCustom ||
                            newFeedbackState.feedback === "")
                    ) {
                        newFeedbackState.feedback = suggestedTemplate.feedback;
                        newFeedbackState.isFeedbackCustom = false;
                    } else if (
                        !newFeedbackState.isFeedbackCustom &&
                        value === ""
                    ) {
                        newFeedbackState.feedback = "";
                    }
                } else {
                    if (!newFeedbackState.isFeedbackCustom) {
                        newFeedbackState.feedback = "";
                    }
                }
            }

            return { ...prev, [studentId]: newFeedbackState };
        });
    }, []);

    const validateFeedback = (feedback) => {
        if (
            feedback.ball === "" ||
            feedback.ball === null ||
            isNaN(parseInt(feedback.ball, 10))
        ) {
            return "Ball qiymati to'g'ri kiritilmagan.";
        }
        if (!feedback.feedback || feedback.feedback.trim() === "") {
            return "Fikr-mulohaza tavsifi bo'sh bo'lishi mumkin emas.";
        }
        const parsedBall = parseInt(feedback.ball, 10);
        if (parsedBall < 0 || parsedBall > 100) {
            return "Ball 0 dan 100 gacha bo'lishi kerak.";
        }
        return null;
    };

    const handleSaveAllFeedback = useCallback(async () => {
        setIsSaving(true);
        setNotification(null);

        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            setNotification({
                type: "error",
                message: "Avtorizatsiya tokeni topilmadi.",
            });
            setIsSaving(false);
            return;
        }

        if (activeStudents.length === 0) {
            setNotification({
                type: "error",
                message: "Faol o'quvchilar topilmadi.",
            });
            setIsSaving(false);
            return;
        }

        const payloads = [];
        const studentNamesWithErrors = [];

        for (const student of activeStudents) {
            const feedback = studentFeedbacks[student.id];
            if (!feedback || feedback.ball === "") {
                continue; // Baho kiritilmagan o'quvchilarni o'tkazib yuborish
            }

            const validationError = validateFeedback(feedback);
            if (validationError) {
                studentNamesWithErrors.push(
                    `${student.firstName}: ${validationError}`
                );
                continue;
            }

            payloads.push({
                studentId: student.id,
                groupId: group.id,
                ball: parseInt(feedback.ball, 10),
                feedback: feedback.feedback,
                feedbackDate: feedbackDate.toISOString(),
            });
        }

        if (studentNamesWithErrors.length > 0) {
            setNotification({
                type: "error",
                message: `Xatoliklar: ${studentNamesWithErrors.join("; ")}`,
            });
            setIsSaving(false);
            return;
        }

        if (payloads.length === 0) {
            setNotification({
                type: "error",
                message: "Hech qanday baho kiritilmagan.",
            });
            setIsSaving(false);
            return;
        }

        try {
            await Promise.all(
                payloads.map((payload) => createDailyFeedback(payload, token))
            );
            setNotification({ type: "success", message: "Baholar saqlandi!" });
            setTimeout(() => {
                onSaveSuccess();
            }, 2000);
        } catch (err) {
            console.error("Baholarni saqlashda umumiy xatolik:", err);
            setNotification({
                type: "error",
                message: err.message || "Noma'lum xato yuz berdi.",
            });
        } finally {
            setIsSaving(false);
        }
    }, [
        studentFeedbacks,
        activeStudents,
        group.id,
        onSaveSuccess,
        feedbackDate,
    ]);

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
            <style>{allCustomNotificationStyles}</style>
            <AnimatePresence>
                {notification && (
                    <CustomNotification
                        notification={notification}
                        onClear={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>

            <div className="relative flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-center items-center">
                {/* Markazlashtirilgan Sarlavha va Ikonka */}
                <div className="flex items-center">
                    <MessageSquare className="h-6 w-6 mr-3 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        Kunlik Baholash
                    </h2>
                </div>
                {/* Absolyut joylashgan Yopish tugmasi */}
                <button
                    onClick={onBack}
                    className="absolute top-1/2 right-6 -translate-y-1/2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-blue-500"
                    aria-label="Yopish"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                            onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                const userTimezoneOffset =
                                    newDate.getTimezoneOffset() * 60000;
                                setFeedbackDate(
                                    new Date(
                                        newDate.getTime() + userTimezoneOffset
                                    )
                                );
                            }}
                            className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm transition duration-150 appearance-none shadow-sm"
                            aria-label="Fikr-mulohaza sanasini tanlash"
                        />
                    </div>
                </div>

                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
                    O'quvchilar ro'yxati va baholash:
                </h3>
                {activeStudents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 italic text-center py-5">
                        Faol o'quvchilar topilmadi.
                    </p>
                ) : (
                    <motion.div
                        variants={studentListVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                    >
                        {activeStudents.map((student) => {
                            const feedback = studentFeedbacks[student.id] || {
                                ball: "",
                                feedback: "",
                                isFeedbackCustom: false,
                            };

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
                                        <Avatar
                                            src={student.image}
                                            fallback={
                                                student.firstName?.[0] +
                                                (student.lastName?.[0] || "")
                                            }
                                            className="h-10 w-10 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight truncate">
                                                {student.firstName}{" "}
                                                {student.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {group.name || group.groupId}
                                            </p>
                                        </div>
                                    </div>

                                    <motion.div
                                        variants={inputVariants}
                                        className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-700"
                                    >
                                        <div>
                                            <label
                                                htmlFor={`ball-${student.id}`}
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Ball:
                                            </label>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <input
                                                    id={`ball-${student.id}`}
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={feedback.ball}
                                                    onChange={(e) =>
                                                        handleFeedbackChange(
                                                            student.id,
                                                            "ball",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="0-100"
                                                    className="block w-full sm:w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm py-2.5 px-3 flex-shrink-0"
                                                    disabled={isSaving}
                                                />
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {generateScoreButtons().map(
                                                        (score) => (
                                                            <Button
                                                                key={score}
                                                                onClick={() =>
                                                                    handleFeedbackChange(
                                                                        student.id,
                                                                        "ball",
                                                                        score.toString()
                                                                    )
                                                                }
                                                                variant="outline"
                                                                size="xs"
                                                                className="!py-1.5 !px-3 text-xs !rounded-full !border-gray-300 dark:!border-gray-600 hover:!bg-blue-100 dark:hover:!bg-blue-900/40"
                                                                disabled={
                                                                    isSaving
                                                                }
                                                            >
                                                                {score}
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button
                                                        onClick={() =>
                                                            handleFeedbackChange(
                                                                student.id,
                                                                "ball",
                                                                ""
                                                            )
                                                        }
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
                                            <label
                                                htmlFor={`feedback-${student.id}`}
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Fikr-mulohaza tavsifi:
                                            </label>
                                            <textarea
                                                id={`feedback-${student.id}`}
                                                value={feedback.feedback}
                                                onChange={(e) =>
                                                    handleFeedbackChange(
                                                        student.id,
                                                        "feedback",
                                                        e.target.value
                                                    )
                                                }
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
                        className="w-full mb-5 sm:w-auto !py-3 !px-5 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md shadow-md transition-colors font-semibold"
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
