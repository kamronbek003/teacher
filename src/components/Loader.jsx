import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ className = '' }) => {
  return (
    <div className={`flex justify-center items-center h-full ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 40,
          height: 40,
          border: '4px solid transparent', 
          borderTopColor: '#3b82f6', 
          borderRightColor: '#60a5fa', 
        }}
        className="rounded-full"
      />
    </div>
  );
};

export default Loader;
