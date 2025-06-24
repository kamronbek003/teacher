import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    fetchTeacherData,
    fetchTeacherGroups,
    loginTeacher,
    logoutTeacher,
    AUTH_TOKEN_KEY,
    fetchTopTeachers,
} from './services/api';
import { jwtDecode } from 'jwt-decode';

import NavItem from './components/NavItem';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import DashboardScreen from './screens/DashboardScreen';
import GroupsScreen from './screens/GroupsScreen';
import GroupDetailScreen from './screens/GroupDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import FeedbackScreen from './screens/FeedbackScreen'; 
import DailyFeedbackDetailScreen from './screens/DailyFeedbackDetailScreen'; 
import GradeFeedbackScreen from './screens/GradeFeedbackScreen';
import { Home, Users, User, BarChart3 } from 'lucide-react';

function AppContent() {
    const validScreens = [
        'dashboard',
        'groups',
        'groupDetail',
        'attendance',
        'statistics',
        'profile',
        'editProfile',
        'newFeedback',
        'feedbackDetail',
        'gradeFeedback',
    ];

    const [activeScreen, setActiveScreen] = useState(() => {
        const savedScreen = localStorage.getItem('activeScreen');
        return validScreens.includes(savedScreen) ? savedScreen : 'dashboard';
    });
    const [teacher, setTeacher] = useState(null);
    const [teacherId, setTeacherId] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupStudents, setGroupStudents] = useState([]);
    const [groupIdForNewFeedback, setGroupIdForNewFeedback] = useState(null);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [topTeachers, setTopTeachers] = useState([]);
    const [isLoadingTopTeachers, setIsLoadingTopTeachers] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [error, setError] = useState(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        localStorage.setItem('activeScreen', activeScreen);
    }, [activeScreen]);

    const handleLogout = useCallback(() => {
        logoutTeacher();
        setIsAuthenticated(false);
        setTeacher(null);
        setTeacherId(null);
        setGroups([]);
        setSelectedGroup(null);
        setGroupStudents([]);
        setGroupIdForNewFeedback(null);
        setSelectedFeedback(null);
        setSelectedSubmission(null);
        setTopTeachers([]);
        setIsLoadingTopTeachers(false);
        setActiveScreen('dashboard');
        setError(null);
        setAuthError(null);
        localStorage.removeItem('activeScreen');
    }, []);

    const loadInitialData = useCallback(
        async (currentTeacherId) => {
            if (!currentTeacherId) {
                handleLogout();
                return;
            }

            setIsDataLoading(true);
            setIsLoadingTopTeachers(true);
            setError(null);

            try {
                const [teacherData, groupResponse, topTeachersResponse] = await Promise.all([
                    fetchTeacherData(currentTeacherId),
                    fetchTeacherGroups(currentTeacherId),
                    fetchTopTeachers(),
                ]);

                setTeacher(teacherData);

                let groupData = [];
                if (groupResponse && Array.isArray(groupResponse.data)) {
                    groupData = groupResponse.data;
                } else if (Array.isArray(groupResponse)) {
                    groupData = groupResponse;
                } else {
                }
                if (
                    groupData.length > 0 &&
                    groupData[0] &&
                    groupData[0].studentCount === undefined &&
                    groupData[0]._count?.students !== undefined
                ) {
                    groupData = groupData.map((g) => ({ ...g, studentCount: g._count?.students ?? 0 }));
                } else if (groupData.length > 0 && groupData[0] && groupData[0].studentCount === undefined) {
                }
                setGroups(groupData);

                if (topTeachersResponse && Array.isArray(topTeachersResponse.data)) {
                    setTopTeachers(topTeachersResponse.data);
                } else if (Array.isArray(topTeachersResponse)) {
                    setTopTeachers(topTeachersResponse);
                } else {
                    setTopTeachers([]);
                }
            } catch (err) {
                if (err.isAuthError || (err.message && err.message.toLowerCase().includes('autentifikatsiya'))) {
                    handleLogout();
                } else {
                    setError(err.message || "Ma'lumotlarni yuklashda noma'lum xatolik yuz berdi.");
                }
                setTeacher(null);
                setGroups([]);
                setTopTeachers([]);
            } finally {
                setIsDataLoading(false);
                setIsLoadingTopTeachers(false);
            }
        },
        [handleLogout],
    );

    useEffect(() => {
        if (isAuthenticated && teacherId) {
            loadInitialData(teacherId);
        } else if (!isAuthenticated) {
            setTeacher(null);
            setGroups([]);
            setTopTeachers([]);
            setError(null);
            setAuthError(null);
        }
    }, [isAuthenticated, teacherId, loadInitialData]);

    useEffect(() => {
        const checkAuth = () => {
            setIsLoading(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (token) {
                try {
                    const decodedToken = jwtDecode(token);
                    if (decodedToken && decodedToken.sub && decodedToken.exp && decodedToken.exp * 1000 > Date.now()) {
                        setTeacherId(decodedToken.sub);
                        setIsAuthenticated(true);
                    } else {
                        handleLogout();
                    }
                } catch (e) {
                    handleLogout();
                }
            } else {
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };
        checkAuth();
    }, [handleLogout]);

    const handleLogin = useCallback(async (phone, password) => {
        setIsAuthenticating(true);
        setAuthError(null);
        setError(null);
        try {
            const result = await loginTeacher(phone, password);
            if (result.success && result.token) {
                const decodedToken = jwtDecode(result.token);
                if (decodedToken && decodedToken.sub) {
                    setTeacherId(decodedToken.sub);
                    setIsAuthenticated(true);
                } else {
                    setAuthError("Olingan token yaroqsiz. Server administratatori bilan bog'laning.");
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                }
            } else if (result.message) {
                setAuthError(result.message);
            } else {
                setAuthError("Login qilishda noma'lum server javobi.");
            }
        } catch (err) {
            setAuthError(err.message || 'Login qilishda tizim xatoligi.');
            localStorage.removeItem(AUTH_TOKEN_KEY);
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const handleSelectGroup = useCallback((group) => {
        setSelectedGroup(group);
        setGroupStudents([]);
        setSelectedFeedback(null);
        setActiveScreen('groupDetail');
        setError(null);
    }, []);

    const handleNavigateToAttendance = useCallback(
        (students) => {
            if (!selectedGroup) return;
            setGroupStudents(students);
            setActiveScreen('attendance');
            setError(null);
        },
        [selectedGroup],
    );

    const handleNavigateToNewFeedback = useCallback((groupId) => {
        setGroupIdForNewFeedback(groupId);
        setActiveScreen('newFeedback');
        setError(null);
    }, []);

    const handleNavigateToFeedbackDetail = useCallback((feedback, students) => {
        setSelectedFeedback(feedback);
        setGroupStudents(students);
        setSelectedSubmission(null);
        setActiveScreen('feedbackDetail');
        setError(null);
    }, []);

    const handleNavigateToGradeFeedback = useCallback(
        (submission, student, feedbackFromModal) => {
            setSelectedSubmission({ ...submission, studentInfo: student });
            setSelectedFeedback(feedbackFromModal || selectedFeedback);
            setActiveScreen('gradeFeedback');
            setError(null);
        },
        [selectedFeedback],
    );

    const handleNavigateToEditProfile = useCallback(() => {
        setActiveScreen('editProfile');
        setError(null);
    }, []);

    const handleFeedbackSaved = useCallback(() => {
        setGroupIdForNewFeedback(null); 
    }, []);


    const handleGradeSaved = useCallback((updatedSubmission) => {
        setActiveScreen('feedbackDetail');
        setSelectedSubmission(null);
    }, []);

    const handleProfileUpdated = useCallback((updatedTeacherData) => {
        setTeacher(updatedTeacherData);
        setActiveScreen('profile');
    }, []);

    const handleBackToGroups = () => {
        setSelectedGroup(null);
        setGroupStudents([]);
        setSelectedFeedback(null);
        setSelectedSubmission(null);
        setActiveScreen('groups');
        setError(null);
    };

    const handleBackToGroupDetail = () => {
        setSelectedFeedback(null);
        setSelectedSubmission(null);
        setActiveScreen('groupDetail');
        setError(null);
    };

    const handleBackFromGradeFeedback = () => {
        setSelectedSubmission(null);
        setActiveScreen('feedbackDetail');
        setError(null);
    };

    const handleBackFromEditProfile = () => {
        setActiveScreen('profile');
        setError(null);
    };

    const handleBackFromNewFeedback = () => {
        setActiveScreen('groupDetail');
        setGroupIdForNewFeedback(null);
        setError(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-screen">
                    <Loader />
                </div>
            );
        }

        if (!isAuthenticated) {
            return <LoginScreen onLogin={handleLogin} error={authError} isLoading={isAuthenticating} />;
        }

        if (isDataLoading || !teacher) {
            return (
                <div className="flex justify-center items-center h-screen">
                    <Loader />
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                    <ErrorMessage message={error} />
                    <div className="mt-4 flex space-x-2">
                        <button
                            onClick={() => {
                                if (teacherId) {
                                    loadInitialData(teacherId);
                                } else {
                                    handleLogout();
                                }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                            Qayta Yuklash
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Tizimdan Chiqish
                        </button>
                    </div>
                </div>
            );
        }

        const getExitX = (currentScreen) => {
            if (['groups', 'dashboard', 'statistics', 'profile'].includes(currentScreen)) return -100;
            if (['groupDetail', 'attendance', 'newFeedback', 'feedbackDetail', 'gradeFeedback', 'editProfile'].includes(currentScreen))
                return 100;
            return 0;
        };

        const getInitialX = (currentScreen) => {
            if (['groupDetail', 'attendance', 'newFeedback', 'feedbackDetail', 'gradeFeedback', 'editProfile'].includes(currentScreen))
                return 100;
            if (['groups', 'dashboard', 'statistics', 'profile'].includes(currentScreen)) return -100;
            return 0;
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeScreen}
                    initial={{ opacity: 0, x: getInitialX(activeScreen) }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: getExitX(activeScreen) }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="h-full w-full"
                >
                    {activeScreen === 'dashboard' && (
                        <DashboardScreen
                            teacher={teacher}
                            groups={groups}
                            topTeachers={topTeachers}
                            isLoadingTopTeachers={isLoadingTopTeachers}
                        />
                    )}
                    {activeScreen === 'groups' && <GroupsScreen groups={groups} onSelectGroup={handleSelectGroup} />}
                    {activeScreen === 'groupDetail' && selectedGroup && (
                        <GroupDetailScreen
                            group={selectedGroup}
                            onBack={handleBackToGroups}
                        />
                    )}
                    {activeScreen === 'attendance' && selectedGroup && (
                        <AttendanceScreen group={selectedGroup} students={groupStudents} onBack={handleBackToGroupDetail} />
                    )}
                    {activeScreen === 'newFeedback' && selectedGroup && (
                        <FeedbackScreen
                            group={selectedGroup} 
                            students={groupStudents} 
                            onBack={handleBackFromNewFeedback}
                            onSaveSuccess={handleFeedbackSaved} 
                        />
                    )}
                    {activeScreen === 'feedbackDetail' && selectedFeedback && selectedGroup && (
                        <DailyFeedbackDetailScreen
                            feedback={selectedFeedback}
                            group={selectedGroup}
                            students={groupStudents}
                            onBack={handleBackToGroupDetail}
                            onNavigateToGradeFeedback={handleNavigateToGradeFeedback}
                        />
                    )}
                    {activeScreen === 'gradeFeedback' && selectedSubmission && selectedFeedback && (
                        <GradeFeedbackScreen
                            submission={selectedSubmission}
                            feedback={selectedFeedback}
                            onGradeSaved={handleGradeSaved}
                            onBack={handleBackFromGradeFeedback}
                        />
                    )}
                    {activeScreen === 'statistics' && <StatisticsScreen teacher={teacher} groups={groups} />}
                    {activeScreen === 'profile' && (
                        <ProfileScreen teacher={teacher} onLogout={handleLogout} onNavigateToEdit={handleNavigateToEditProfile} />
                    )}
                    {activeScreen === 'editProfile' && teacher && (
                        <EditProfileScreen teacher={teacher} onBack={handleBackFromEditProfile} onProfileUpdated={handleProfileUpdated} />
                    )}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
            <main
                className={`flex-1 overflow-y-auto ${isAuthenticated ? 'p-4 md:p-6' : ''}`}
                style={{ paddingBottom: isAuthenticated ? `calc(5rem + env(safe-area-inset-bottom))` : '0' }} 
            >
                {renderContent()}
            </main>

            {isAuthenticated && !isLoading && !isDataLoading && teacher && (
                <nav className="sticky bottom-0 left-0 right-0 w-full z-50 bg-white dark:bg-gray-800 shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_-5px_rgba(255,255,255,0.1)] border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <div className="flex justify-around items-center max-w-md mx-auto h-16 relative">
                        <NavItem icon={Home} label="Bosh Sahifa" screenName="dashboard" isActive={activeScreen === 'dashboard'} onClick={setActiveScreen} />
                        <NavItem icon={Users} label="Guruhlar" screenName="groups" isActive={activeScreen === 'groups'} onClick={setActiveScreen} />
                        <NavItem icon={BarChart3} label="Statistika" screenName="statistics" isActive={activeScreen === 'statistics'} onClick={setActiveScreen} />
                        <NavItem icon={User} label="Profil" screenName="profile" isActive={activeScreen === 'profile'} onClick={setActiveScreen} />
                    </div>
                </nav>
            )}
        </div>
    );
}

export default AppContent;
