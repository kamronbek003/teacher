import { useMemo, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView, AnimatePresence } from 'framer-motion';
import Card, { cardVariants } from '../components/Card';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';
import { listVariants } from '../utils/animationVariants';
import {
    Clock, Users as UsersIcon, AlertTriangle, ArrowRight, BookOpen,
    CalendarDays, Sun, Moon, Cloud, TrendingUp, Award
} from 'lucide-react';

const AnimatedNumber = ({ value, isPercentage = false }) => {
    const numericValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
    const count = useMotionValue(numericValue); 
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    useEffect(() => {
        if (isInView) {
            const controls = animate(count, numericValue, {
                duration: 1.2,
                ease: "easeOut",
            });
            return () => controls.stop();
        } else {
            count.set(numericValue);
        }
    }, [isInView, numericValue, count]);

    const displayValue = useTransform(count, latest =>
        isPercentage ? `${Math.round(latest)}%` : Math.round(latest)
    );

    return <motion.span ref={ref}>{displayValue}</motion.span>;
};


const dayNameToNumber = { 'Yak': 0, 'Dush': 1, 'Sesh': 2, 'Chor': 3, 'Pays': 4, 'Jum': 5, 'Shan': 6 };
const uzWeekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const uzWeekdaysShort = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
const uzMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];


const getWeeklySchedule = (groups) => {
    if (!groups || !Array.isArray(groups)) { return []; }
    const now = new Date();
    const todayDay = now.getDay(); 
    const firstDayOfWeek = new Date(now);
    const dayDiff = todayDay === 0 ? -6 : 1 - todayDay;
    firstDayOfWeek.setDate(now.getDate() + dayDiff);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const weekSchedule = [];
    for (let i = 0; i < 7; i++) {
        const currentDayIter = new Date(firstDayOfWeek);
        currentDayIter.setDate(firstDayOfWeek.getDate() + i);
        const dayNum = currentDayIter.getDay(); 

        const shortDayNameIndex = dayNum === 0 ? 6 : dayNum - 1;

        weekSchedule.push({
            dayName: uzWeekdays[dayNum],
            shortDayName: uzWeekdaysShort[shortDayNameIndex],
            date: currentDayIter.getDate(),
            month: uzMonths[currentDayIter.getMonth()],
            fullDate: currentDayIter,
            isToday: now.toDateString() === currentDayIter.toDateString(),
            classes: []
        });
    }

    groups.forEach(group => {
        if (group.status !== 'FAOL' || !group.darsJadvali || !group.darsVaqt) return;
        const scheduleDays = group.darsJadvali.split('/').map(day => day.trim());
        const timeParts = group.darsVaqt.split('-').map(time => time.trim());
        if (timeParts.length < 1) return;
        const startTimeStr = timeParts[0];
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        if (isNaN(startHour) || isNaN(startMinute)) return;
        const startTimeMinutes = startHour * 60 + startMinute;

        scheduleDays.forEach(dayStr => {
            const dayNumInGroupSchedule = dayNameToNumber[dayStr];
            if (dayNumInGroupSchedule !== undefined) {
                const targetDay = weekSchedule.find(d => d.fullDate.getDay() === dayNumInGroupSchedule);
                if (targetDay) {
                    if (!targetDay.classes.some(c => c.groupId === group.id && c.time === startTimeStr)) {
                        targetDay.classes.push({
                            groupName: group.name || `Guruh ${group.groupId || group.id}`,
                            time: startTimeStr,
                            groupId: group.id,
                            startTimeMinutes: startTimeMinutes
                        });
                    }
                }
            }
        });
    });
    weekSchedule.forEach(day => { day.classes.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes); });
    return weekSchedule;
};

const getGreetingInfo = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: "Xayrli tun", Icon: Moon };
    if (hour < 12) return { text: "Xayrli tong", Icon: Sun };
    if (hour < 18) return { text: "Xayrli kun", Icon: Cloud };
    return { text: "Xayrli kech", Icon: Moon };
};

const StatCardItem = ({ icon: Icon, label, value, color, bgColor, variants, isPercentage = false }) => (
    <motion.div
        variants={variants}
        whileHover={{ scale: 1.03, y: -2, shadow: 'md' }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
        <Card className={`!p-4 h-full overflow-hidden relative border border-gray-100 dark:border-gray-700/50 ${bgColor || 'bg-white dark:bg-gray-800'}`}>
            <div className="flex items-center relative z-10">
                <div className={`flex-shrink-0 p-3 rounded-lg mr-4 ${color} bg-opacity-15`}>
                    <Icon className={`w-6 h-6 ${color}`}/>
                </div>
                <div className="flex-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 block">{label}</span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                        <AnimatedNumber value={value} isPercentage={isPercentage} />
                    </span>
                </div>
            </div>
        </Card>
    </motion.div>
);

const DashboardScreen = ({ teacher, groups, topTeachers, isLoadingTopTeachers }) => {
    console.log('[DashboardScreen] Props received - teacher:', teacher ? teacher.firstName : 'Not loaded');
    console.log('[DashboardScreen] Props received - groups count:', groups ? groups.length : 0);
    console.log('[DashboardScreen] Props received - topTeachers raw:', topTeachers);
    console.log('[DashboardScreen] Props received - isLoadingTopTeachers:', isLoadingTopTeachers);

    const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
        const today = new Date();
        const todayDayNum = today.getDay();
        return todayDayNum === 0 ? 6 : todayDayNum - 1;
    });

    const weeklySchedule = useMemo(() => getWeeklySchedule(groups), [groups]);

    const selectedDayClasses = useMemo(() => {
        if (!weeklySchedule || weeklySchedule.length === 0) return [];
        let targetIndex = selectedDayIndex;
        if (targetIndex < 0 || targetIndex >= weeklySchedule.length) {
            const todayActualIndex = weeklySchedule.findIndex(day => day.isToday);
            targetIndex = todayActualIndex >=0 ? todayActualIndex : 0;
        }
        return weeklySchedule[targetIndex]?.classes || [];
    }, [selectedDayIndex, weeklySchedule]);

    const totalActiveStudents = useMemo(() => groups?.reduce((sum, g) => g.status === 'FAOL' ? sum + (g._count?.students ?? 0) : sum, 0) || 0, [groups]);
    const totalActiveGroups = useMemo(() => groups?.filter(g => g.status === 'FAOL').length || 0, [groups]);
    const { text: greeting, Icon: GreetingIcon } = getGreetingInfo();

    const todayDateFormatted = useMemo(() => {
        const now = new Date();
        const dayOfWeek = uzWeekdays[now.getDay()];
        const dayOfMonth = now.getDate();
        const monthName = uzMonths[now.getMonth()];
        const year = now.getFullYear();
        return `${dayOfWeek}, ${dayOfMonth} ${monthName} ${year}`;
    }, []);

    const attentionItems = useMemo(() => {
        const items = [];
        return items;
    }, []);

    const leaderTeachers = useMemo(() => {
        if (isLoadingTopTeachers || !topTeachers || !Array.isArray(topTeachers)) {
            console.log('[DashboardScreen] leaderTeachers useMemo: isLoading or topTeachers invalid/empty, returning []. isLoadingTopTeachers:', isLoadingTopTeachers, 'topTeachers:', topTeachers);
            return [];
        }
        const filtered = topTeachers.filter(t => t.status === 'LIDER');
        console.log('[DashboardScreen] leaderTeachers useMemo: Filtered result (status === LIDER):', filtered);
        return filtered;
    }, [topTeachers, isLoadingTopTeachers]);

    if (!teacher) {
        return <div className="flex justify-center items-center h-screen"><Loader /></div>;
    }

    return (
        <motion.div initial="hidden" animate="visible" variants={listVariants} className="space-y-6 md:space-y-8">
            {/* === HEADER === */}
            <motion.div
                variants={cardVariants}
                className="p-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800 text-white shadow-lg overflow-hidden relative"
            >
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <div className="flex items-center space-x-2.5 mb-1">
                            <GreetingIcon className="w-6 h-6 opacity-90" />
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting}, {teacher.firstName}!</h1>
                        </div>
                        <p className="text-sm md:text-base opacity-80">{todayDateFormatted}</p>
                    </div>
                    <Avatar src={teacher.image} fallback={teacher.firstName?.[0] + (teacher.lastName?.[0] || '')} className="h-14 w-14 flex-shrink-0 border-2 border-white/60 shadow-sm" />
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <Card variants={cardVariants} className="overflow-hidden !p-0">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700/50">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                <CalendarDays className="w-5 h-5 mr-2.5 text-indigo-600 dark:text-indigo-400"/> Haftalik Dars Jadvali
                            </h3>
                        </div>
                        <div className="p-5">
                            {/* Haftalik Kunlar Grid - AVVALGI KO'RINISHGA QAYTARILDI */}
                            <motion.div
                                className="grid grid-cols-7 gap-2 mb-5" // Har doim 7 ustun
                                variants={listVariants} initial="hidden" animate="visible"
                            >
                                {weeklySchedule.map((day, index) => (
                                    <motion.div
                                        key={day.fullDate.toISOString()}
                                        variants={cardVariants}
                                        onClick={() => setSelectedDayIndex(index)}
                                        className={`relative p-2 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center h-24 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-900 ${
                                            selectedDayIndex === index
                                                ? 'bg-indigo-100 dark:bg-indigo-900/70 border-indigo-400 dark:border-indigo-500 shadow-lg scale-105 z-10 focus:ring-indigo-400'
                                                : day.isToday
                                                    ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 focus:ring-blue-400'
                                                    : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/70 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/70 focus:ring-gray-400'
                                        }`}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    >
                                        <p className={`text-[11px] sm:text-xs font-semibold mb-0.5 ${selectedDayIndex === index ? 'text-indigo-700 dark:text-indigo-200' : day.isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {day.shortDayName}
                                        </p>
                                        <p className={`text-lg sm:text-xl font-bold mb-0.5 ${selectedDayIndex === index ? 'text-indigo-800 dark:text-indigo-100' : day.isToday ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {day.date}
                                        </p>
                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 h-1.5 w-1.5">
                                            {day.classes.length > 0 && (
                                                <div className={`h-full w-full rounded-full ${selectedDayIndex === index ? 'bg-indigo-500 dark:bg-indigo-400' : day.isToday ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <div className="mt-4 min-h-[150px] relative bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-base">
                                    {weeklySchedule[selectedDayIndex]?.dayName || 'Kun tanlanmagan'}, {weeklySchedule[selectedDayIndex]?.date} {weeklySchedule[selectedDayIndex]?.month}
                                </h4>
                                <AnimatePresence mode="wait">
                                    {selectedDayClasses.length > 0 ? (
                                        <motion.div
                                            key={selectedDayIndex + (weeklySchedule[selectedDayIndex]?.fullDate.toISOString() || '')}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="space-y-2.5"
                                        >
                                            {selectedDayClasses.map((cls, clsIndex) => (
                                                <motion.div
                                                    key={`${cls.groupId}-${cls.time}-${clsIndex}`}
                                                    className="flex items-center space-x-3 text-sm p-3 bg-white dark:bg-gray-700/70 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group shadow-sm border border-gray-100 dark:border-transparent"
                                                    whileHover={{ scale: 1.02 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                >
                                                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0"/>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200 w-12 tabular-nums">{cls.time}</span>
                                                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1" title={cls.groupName}>{cls.groupName}</span>
                                                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-1 group-hover:translate-x-0"/>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key={selectedDayIndex + "-empty"}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="absolute inset-0 flex flex-col items-center justify-center text-center"
                                        >
                                            <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2"/>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                Bu kunga darslar yo'q.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </Card>

                    {attentionItems.length > 0 && (
                        <Card variants={cardVariants} className="!p-0">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2.5 text-amber-500 dark:text-amber-400"/> E'tibor Talab Qiladi
                                </h3>
                            </div>
                            <div className="p-5 space-y-3">
                                {attentionItems.map((item, index) => (
                                    <motion.div >
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                <div className="space-y-6 md:space-y-8">
                    <Card variants={cardVariants} className="!p-0">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700/50">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2.5 text-green-600 dark:text-green-400" /> Umumiy Holat
                            </h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 gap-4">
                            <StatCardItem
                                icon={UsersIcon}
                                label="Faol O'quvchilar"
                                value={totalActiveStudents}
                                color="text-blue-600 dark:text-blue-400"
                                bgColor="bg-blue-50 dark:bg-blue-900/30"
                                variants={cardVariants}
                            />
                            <StatCardItem
                                icon={BookOpen}
                                label="Faol Guruhlar"
                                value={totalActiveGroups}
                                color="text-green-600 dark:text-green-400"
                                bgColor="bg-green-50 dark:bg-green-900/30"
                                variants={cardVariants}
                            />
                        </div>
                    </Card>

                    <Card variants={cardVariants} className="!p-0">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700/50">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                <Award className="w-5 h-5 mr-2.5 text-yellow-500 dark:text-yellow-400" /> Haftaning Lider O'qituvchilari
                            </h3>
                        </div>
                        <div className="p-5 min-h-[100px]">
                            {isLoadingTopTeachers ? (
                                <div className="flex justify-center items-center h-full"> <Loader size="sm" /> </div>
                            ) : leaderTeachers.length > 0 ? (
                                <ul className="space-y-3">
                                    {leaderTeachers.slice(0, 3).map((leaderTeacher, index) => (
                                        <motion.li
                                            key={leaderTeacher.id || `leader-${index}`}
                                            variants={cardVariants}
                                            custom={index}
                                            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600/50 hover:shadow-md transition-shadow"
                                        >
                                            <Avatar
                                                src={leaderTeacher.image}
                                                fallback={leaderTeacher.firstName?.[0] + (leaderTeacher.lastName?.[0] || '')}
                                                className="w-10 h-10 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={`${leaderTeacher.firstName} ${leaderTeacher.lastName}`}>
                                                    {leaderTeacher.firstName} {leaderTeacher.lastName}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300'
                                                : index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-600/30 dark:text-gray-300'
                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300'
                                            }`}>
                                                #{index + 1}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 dark:text-gray-400">
                                    <Award className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2"/>
                                    <p className="text-sm italic"> Bu hafta uchun lider o'qituvchilar topilmadi. </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardScreen;