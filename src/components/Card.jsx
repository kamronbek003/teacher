import React from 'react';
import { motion } from 'framer-motion';

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const Card = ({ children, className = '', isHoverable = false, onClick, variants = cardVariants }) => (
  <motion.div
    variants={variants}
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-slate-700/50 p-4 mb-4 overflow-hidden transition-colors duration-300 ${className} ${isHoverable ? 'cursor-pointer' : ''}`}
    whileHover={isHoverable ? { scale: 1.02, transition: { duration: 0.2 } } : {}} 
    onClick={onClick}
  >
    {children}
  </motion.div>
);

export default Card;
