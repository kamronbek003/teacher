import { motion } from 'framer-motion';
import Card, { cardVariants } from '../components/Card'; 
import Badge from '../components/Badge';
import Button from '../components/Button';
import { listVariants } from '../utils/animationVariants';
import { Users as UsersIcon, Clock, ArrowRight, Check, X, CalendarDays } from 'lucide-react'; 

const GroupsScreen = ({ groups, onSelectGroup }) => {
    const totalGroups = groups?.length || 0; 

    console.log(" Mavjud guruhlaaaaaar",groups);
    

    return (
        <motion.div initial="hidden" animate="visible" variants={listVariants} className="space-y-6 md:space-y-8">
            <motion.div
                variants={cardVariants}
                className="mb-8 p-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800 text-white shadow-lg" 
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    {/* Sarlavha va Guruhlar Soni */}
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 p-3 bg-white/20 rounded-full">
                            <UsersIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight"> {/* Larger title */}
                                Mening Guruhlarim
                            </h1>
                            <p className="mt-1 text-base opacity-90"> 
                                Jami {totalGroups} ta guruh mavjud
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Guruhlar ro'yxati */}
            {!groups || groups.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-500 dark:text-gray-400 mt-16 py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                >
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Guruhlar Topilmadi</p>
                    <p className="mt-1 text-sm">Hozircha sizga biriktirilgan guruhlar mavjud emas.</p>
                </motion.div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {groups.map((group, index) => (
                        <motion.div
                            key={group.id}
                            variants={cardVariants}
                            custom={index} 
                            className="h-full"
                        >
                            <motion.div
                                onClick={() => onSelectGroup(group)}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg dark:shadow-gray-700/40 h-full flex flex-col overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700/50 transition-all duration-300 group"
                                whileHover={{ y: -6, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            >
                                <div className={`p-4 bg-gradient-to-br ${group.status === 'FAOL' ? 'from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-600' : 'from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700'} text-white`}> 
                                    <div className="flex justify-between items-center mb-1">
                                        <h2 className="text-lg font-semibold truncate mr-2" title={group.name || `Guruh ${group.groupId}`}>
                                            {group.name || `Guruh ${group.groupId}`}
                                        </h2>
                                        <Badge
                                            variant={group.status === 'FAOL' ? 'success' : 'secondary'}
                                            className={`!px-2.5 !py-0.5 text-xs font-medium ${group.status === 'FAOL' ? '!bg-white/25 !text-white backdrop-blur-sm' : '!bg-gray-200/30 !text-gray-100 dark:!bg-gray-900/40 dark:!text-gray-200 backdrop-blur-sm'}`}
                                        >
                                            {group.status === 'FAOL' ? <Check className="w-3 h-3 mr-1 inline-block"/> : <X className="w-3 h-3 mr-1 inline-block"/>}
                                            {group.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-white/80">ID: {group.groupId}</p>
                                </div>

                                <div className="p-4 flex-grow flex flex-col justify-between">
                                    {/* Guruh Ma'lumotlari */}
                                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {/* O'quvchilar Soni */}
                                        <div className="flex items-center">
                                            <UsersIcon className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0"/>
                                            <span>O'quvchilar: <span className="font-semibold text-gray-800 dark:text-gray-200">{group._count.students ?? 0}</span></span>
                                        </div>
                                        {/* Dars Jadvali */}
                                        <div className="flex items-center">
                                            <CalendarDays className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400 flex-shrink-0"/>
                                            <span>{group.darsJadvali || 'Noma\'lum Jadval'}</span>
                                        </div>
                                         {/* Dars Vaqti */}
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-2 text-teal-500 dark:text-teal-400 flex-shrink-0"/>
                                            <span>{group.darsVaqt || 'Noma\'lum Vaqt'}</span>
                                        </div>
                                    </div>

                                    {/* "Batafsil" tugmasi */}
                                    <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50 text-right">
                                        <Button
                                            size="sm"
                                            variant="link"
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium !px-0 !py-1"
                                            icon={ArrowRight}
                                            iconPosition="right" 
                                        >
                                            Batafsil
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export default GroupsScreen;
