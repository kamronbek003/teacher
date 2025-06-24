import React, { useMemo, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import Card, { cardVariants } from '../components/Card';
import { listVariants } from '../utils/animationVariants';
import { Users as UsersIcon, CheckCircle, BarChart3, TrendingUp, CheckSquare } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const AnimatedNumber = ({ value, isPercentage = false }) => {
    const numericValue = (typeof value === 'number' && !isNaN(value)) ? value : (value === "N/A" ? null : 0);
    const count = useMotionValue(0);
    const formatted = useTransform(count, latest =>
        numericValue === null ? "N/A" : (isPercentage ? `${Math.round(latest)}%` : Math.round(latest))
    );
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    useEffect(() => {
        if (isInView && numericValue !== null) {
            const controls = animate(count, numericValue, { duration: 1.5, ease: "easeOut" });
            return () => controls.stop();
        } else if (numericValue === null) {
             count.set(0);
        }
    }, [isInView, numericValue, count]);
    if (numericValue === null) { return <span ref={ref}>N/A</span>; }
    return <motion.span ref={ref}>{formatted}</motion.span>;
};


const StatCardItem = ({ icon: Icon, label, value, color, variants, isPercentage = false }) => (
    <motion.div variants={variants}>
        <Card className={`!p-4 h-full border-t-4 ${color ? color.replace('text-', 'border-') : 'border-gray-300 dark:border-gray-600'}`}>
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 p-1"> 
                    <Icon className={`w-6 h-6 ${color || 'text-gray-500 dark:text-gray-400'}`} /> 
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                        <AnimatedNumber value={value} isPercentage={isPercentage} />
                    </p>
                </div>
            </div>
        </Card>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label, valueKey = 'value', nameKey = 'name', unit = '' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data[nameKey] || label;
    const value = payload[0].value;
    if (value === undefined || value === null) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-2 rounded shadow text-xs border border-gray-200 dark:border-gray-600">
        <p className="font-medium text-gray-900 dark:text-gray-100">{`${name}: `}<span className="font-bold text-blue-600 dark:text-blue-400">{value}{unit}</span></p>
      </div>
    );
  }
  return null;
};

const MOCK_PERFORMANCE = [
    { name: 'A\'lo (5)', value: 35, fill: '#22c55e' }, 
    { name: 'Yaxshi (4)', value: 45, fill: '#3b82f6' }, 
    { name: 'Qoniqarli (3)', value: 15, fill: '#f97316' }, 
    { name: 'Qoniqarsiz (2)', value: 5, fill: '#ef4444' },
];

const StatisticsScreen = ({ teacher, groups }) => {
    const { theme } = useTheme();
    const pieColors = MOCK_PERFORMANCE.map(item => item.fill);

    const activeGroups = useMemo(() => groups?.filter(g => g.status === 'FAOL') || [], [groups]);
    const activeGroupsCount = activeGroups.length;
    const totalActiveStudents = useMemo(() => activeGroups.reduce((sum, group) => sum + (group._count.students || 0), 0), [activeGroups]);

    const attendanceRate = 92; 
    const assignmentCompletionRate = 85; 

    return (
        <motion.div initial="hidden" animate="visible" variants={listVariants} className="space-y-6 md:space-y-8">
            <motion.div
                variants={cardVariants}
                className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800 text-white shadow-lg" 
            >
                <div className="flex items-center space-x-4"> 
                    <div className="flex-shrink-0 p-3 bg-white/20 rounded-full">
                        <BarChart3 className="w-7 h-7 text-white" /> 
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Statistika
                        </h1>
                        <p className="mt-1 text-base opacity-90"> 
                            Faoliyatingiz bo'yicha asosiy ko'rsatkichlar.
                        </p>
                    </div>
                </div>
            </motion.div>
            <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                variants={listVariants} initial="hidden" animate="visible"
            >
                <StatCardItem icon={CheckCircle} label="Faol Guruhlar" value={activeGroupsCount} color="text-green-600 dark:text-green-400" variants={cardVariants} />
                <StatCardItem icon={UsersIcon} label="Faol O'quvchilar" value={totalActiveStudents} color="text-blue-600 dark:text-blue-400" variants={cardVariants} />
                <StatCardItem icon={TrendingUp} label="O'rtacha Davomat" value={attendanceRate} isPercentage={true} color="text-teal-600 dark:text-teal-400" variants={cardVariants} />
                <StatCardItem icon={CheckSquare} label="Vazifa Bajarish" value={assignmentCompletionRate} isPercentage={true} color="text-orange-600 dark:text-orange-400" variants={cardVariants} />
            </motion.div>

            {/* Diagrammalar Bo'limi */}
            <div className="grid grid-cols-1 gap-6">
                 <motion.div variants={cardVariants}>
                     <Card>
                         <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Talabalarning O'zlashtirish Statistikasi (Namuna)</h3>
                         <ResponsiveContainer width="100%" height={350}>
                             <PieChart>
                                 <Pie
                                     data={MOCK_PERFORMANCE} 
                                     cx="50%"
                                     cy="50%"
                                     labelLine={false}
                                     innerRadius={70} 
                                     outerRadius={100}
                                     fill="#8884d8"
                                     paddingAngle={2}
                                     dataKey="value"
                                     nameKey="name"
                                     cornerRadius={4}
                                 >
                                     {MOCK_PERFORMANCE.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={entry.fill} stroke={theme === 'dark' ? '#1f2937' : '#fff'} strokeWidth={2} />
                                     ))}
                                 </Pie>
                                 <Tooltip content={<CustomTooltip valueKey="value" nameKey="name" unit="%"/>} />
                                 <Legend
                                     iconType="circle"
                                     layout="horizontal"
                                     verticalAlign="bottom"
                                     align="center"
                                     iconSize={10}
                                     wrapperStyle={{ fontSize: '11px', marginTop: '15px' }}
                                     formatter={(value, entry) => <span className="text-gray-700 dark:text-gray-300 ml-1">{value}</span>}
                                 />
                             </PieChart>
                         </ResponsiveContainer>
                     </Card>
                 </motion.div>
            </div>

        </motion.div>
    );
};

export default StatisticsScreen;
