import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', icon: Icon, disabled = false }) => {
  const baseStyle = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:pointer-events-none';
  const variantStyles = {
    default: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 dark:focus:ring-blue-400 shadow hover:shadow-md',
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500 dark:focus:ring-gray-400 hover:border-gray-400 dark:hover:border-gray-500',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400 focus:ring-blue-500 dark:focus:ring-gray-400',
    destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 dark:focus:ring-red-400 shadow hover:shadow-md',
  };
  const sizeStyles = {
    default: 'h-10 py-2 px-5',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-lg',
    icon: 'h-10 w-10 rounded-full',
  };
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      whileTap={!disabled ? { scale: 0.97 } : {}} 
      whileHover={!disabled && (variant === 'outline' || variant === 'ghost') ? { scale: 1.03, transition: { duration: 0.1 } } : {}}
    >
      {Icon && <Icon className={`mr-2 h-4 w-4 ${size === 'icon' ? 'mr-0' : ''}`} />}
      {children}
    </motion.button>
  );
};

export default Button;
