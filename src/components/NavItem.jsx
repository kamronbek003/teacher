import React from 'react';
import { motion } from 'framer-motion';

const NavItem = ({ icon: Icon, label, screenName, isActive, onClick }) => {
    return (
        <motion.button
            onClick={() => onClick(screenName)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 relative ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            whileTap={{ scale: 0.9 }}
        >
            <Icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
            {isActive && (
                <motion.div
                    layoutId="activeNavIndicator" 
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}
        </motion.button>
    );
};

export default NavItem;
