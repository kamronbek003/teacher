import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card, { cardVariants } from '../components/Card';
import Avatar from '../components/Avatar'; 
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { updateTeacherProfile } from '../services/api';

const EditProfileScreen = ({ teacher, onBack, onProfileUpdated }) => {
    const [firstName, setFirstName] = useState(teacher?.firstName || '');
    const [lastName, setLastName] = useState(teacher?.lastName || '');
    const [phone, setPhone] = useState(teacher?.phone || '');
    const [address, setAddress] = useState(teacher?.address || '');
    const [imageFile, setImageFile] = useState(null); 
    const [imagePreview, setImagePreview] = useState(teacher?.image || null); 

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (teacher) {
            setFirstName(teacher.firstName || '');
            setLastName(teacher.lastName || '');
            setPhone(teacher.phone || '');
            setAddress(teacher.address || '');
            setImagePreview(teacher.image || null);
        }
    }, [teacher]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
            setError("Ism, Familiya va Telefon raqam kiritilishi shart.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        let uploadedImageUrl = teacher?.image;
        if (imageFile) {
            try {
                console.log("Simulating image upload for:", imageFile.name);
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                console.log("Simulated image URL:", uploadedImageUrl);

            } catch (uploadError) {
                console.error("Rasm yuklashda xatolik:", uploadError);
                setError("Rasmni yuklab bo'lmadi. Profil saqlanmadi.");
                setIsLoading(false);
                return;
            }
        }

        const profileData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            image: uploadedImageUrl, 
        };

        try {
            const updatedTeacher = await updateTeacherProfile(teacher.id, profileData); 
            setSuccessMessage("Profil muvaffaqiyatli yangilandi!");
            if (onProfileUpdated) {
                onProfileUpdated(updatedTeacher);
            }
            setImageFile(null); 
            setTimeout(() => {
                setSuccessMessage('');
            }, 2000);

        } catch (err) {
            console.error("Profilni yangilashda xatolik:", err);
            setError(err.message || "Profilni yangilashda noma'lum xatolik.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!teacher) {
        return <div className="p-4"><Loader /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {/* Orqaga qaytish tugmasi */}
            <motion.button
                onClick={onBack}
                className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
                whileHover={{ x: -5 }}
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Profilga Qaytish
            </motion.button>

            {/* Sarlavha */}
            <Card variants={cardVariants} className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    Profilni Tahrirlash
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Shaxsiy ma'lumotlaringizni yangilang.
                </p>
            </Card>

             <AnimatePresence>
                 {error && ( <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><ErrorMessage message={error} type="error" className="mb-4"/></motion.div> )}
                 {successMessage && ( <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Card className="mb-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"><p className="text-center text-green-700 dark:text-green-300 font-medium text-sm">{successMessage}</p></Card></motion.div> )}
             </AnimatePresence>

            {/* Tahrirlash Formasi */}
            <Card variants={cardVariants}>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Rasm Yuklash */}
                    <div className="flex flex-col items-center space-y-3">
                        <Avatar src={imagePreview} fallback={firstName?.[0] + lastName?.[0]} className="h-28 w-28 border-4 border-gray-200 dark:border-gray-700 shadow-md" />
                        <label
                            htmlFor="profile-image-upload"
                            className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                        >
                            <ImageIcon className="w-4 h-4 mr-2"/>
                            Rasmni o'zgartirish
                            <input id="profile-image-upload" name="profile-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                        </label>
                    </div>

                    {/* Ism va Familiya */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ism <span className="text-red-500">*</span></label>
                            <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Familiya <span className="text-red-500">*</span></label>
                            <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm" />
                        </div>
                    </div>

                    {/* Telefon Raqam */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon Raqam <span className="text-red-500">*</span></label>
                        <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm" placeholder="+998 XX XXX XX XX"/>
                    </div>

                    {/* Manzil */}
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manzil (Ixtiyoriy)</label>
                        <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-sm" />
                    </div>

                    {/* Saqlash Tugmasi */}
                    <div className="pt-3 text-right">
                        <Button
                            type="submit"
                            size="default"
                            disabled={isLoading || !firstName.trim() || !lastName.trim() || !phone.trim()} 
                            icon={isLoading ? null : Save}
                        >
                            {isLoading ? ( <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/> ) : null}
                            O'zgarishlarni Saqlash
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
};

export default EditProfileScreen;
