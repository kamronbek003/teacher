import React from 'react';
import { motion } from 'framer-motion';
import Card, { cardVariants } from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { listVariants } from '../utils/animationVariants';
import { Moon, Sun, Edit, LogOut, User as UserIcon, Phone, MapPin } from 'lucide-react';

const ProfileDetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start text-sm text-gray-700 dark:text-gray-300 py-2">
        <Icon className="w-4 h-4 mr-3 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
            <span className="font-medium text-gray-600 dark:text-gray-400 mr-2">{label}:</span>
            <span className="text-gray-800 dark:text-gray-200 text-left sm:text-right break-words">{value || '-'}</span>
        </div>
    </div>
);

const ProfileScreen = ({ teacher, onLogout, onNavigateToEdit }) => {
    const { theme, toggleTheme } = useTheme();

    if (!teacher) {
        return <div className="text-center p-10 text-gray-500 dark:text-gray-400">Yuklanmoqda...</div>;
    }

    const { firstName, lastName, subject, phone, address, image } = teacher;
    const avatarFallback = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={listVariants}
            className="space-y-6 md:space-y-8 mb-28" // Added margin-bottom
        >
            <motion.div
                variants={cardVariants}
                className="mb-8 p-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800 text-white shadow-lg"
            >
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 p-3 bg-white/20 rounded-full">
                        <UserIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mening Profilim</h1>
                        <p className="mt-1 text-base opacity-90">Shaxsiy ma'lumotlar va sozlamalar.</p>
                    </div>
                </div>
            </motion.div>

            <Card variants={cardVariants} className="!p-6 md:!p-8">
                <div className="flex flex-col items-center space-y-6">
                    {/* O'qituvchi avatari */}
                    <Avatar
                        src={image}
                        fallback={avatarFallback}
                        className="h-32 w-32 border-4 border-white dark:border-gray-700 shadow-xl ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-800 ring-blue-400 dark:ring-blue-600"
                    />
                    {/* Ism, Familiya va Fan */}
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                            {firstName} {lastName}
                        </h2>
                        <p className="text-blue-600 dark:text-blue-400 text-md font-medium mt-1">
                            {subject || 'Noma\'lum Fan'}
                        </p>
                    </div>

                    {/* Telefon va Manzil */}
                    <div className="w-full max-w-md border-t dark:border-gray-700 pt-6 mt-4 space-y-3">
                        <ProfileDetailItem icon={Phone} label="Telefon" value={phone} />
                        <ProfileDetailItem icon={MapPin} label="Manzil" value={address} />
                    </div>

                    {/* Tugmalar Bo'limi */}
                    <div className="w-full max-w-md space-y-3 pt-4">
                        {/* Profilni Tahrirlash Tugmasi */}
                        <Button
                            variant="default"
                            className="w-full !py-2.5"
                            icon={Edit}
                            onClick={onNavigateToEdit}
                        >
                            Profilni Tahrirlash
                        </Button>
                        {/* Tema O'zgartirish Tugmasi */}
                        <Button
                            variant="outline"
                            className="w-full !py-2.5"
                            onClick={toggleTheme}
                            icon={theme === 'light' ? Moon : Sun}
                        >
                            {theme === 'light' ? 'Tungi Rejim' : 'Kunduzgi Rejim'}
                        </Button>
                        {/* Chiqish Tugmasi */}
                        <Button
                            variant="destructive"
                            className="w-full !py-2.5"
                            icon={LogOut}
                            onClick={onLogout}
                        >
                            Chiqish
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default ProfileScreen;