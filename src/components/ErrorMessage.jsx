import React from 'react';
import Card from './Card'; 
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, type = 'error', className = '' }) => {
  const colors = {
    error: {
      border: 'border-red-200 dark:border-red-800',
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      iconColor: 'text-red-500 dark:text-red-400',
    },
    warning: {
      border: 'border-yellow-200 dark:border-yellow-800',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-500',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
    },
  };

  const selectedColor = colors[type] || colors.error;

  return (
    <Card className={`${selectedColor.border} ${selectedColor.bg} ${className} border`}>
      <div className="flex items-center">
        <AlertCircle className={`h-5 w-5 mr-3 ${selectedColor.iconColor}`} />
        <p className={`text-sm font-medium ${selectedColor.text}`}>
          {message || 'An unexpected error occurred.'} 
        </p>
      </div>
    </Card>
  );
};

export default ErrorMessage;
