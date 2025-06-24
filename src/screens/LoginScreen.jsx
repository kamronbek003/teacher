import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const formatPhoneNumber = (digits) => {
  const prefix = "+998";
  let formatted = prefix;
  if (digits.length > 0) {
      formatted += " " + digits.substring(0, 2);
  }
  if (digits.length > 2) {
      formatted += " " + digits.substring(2, 5);
  }
  if (digits.length > 5) {
      formatted += " " + digits.substring(5, 7);
  }
  if (digits.length > 7) {
      formatted += " " + digits.substring(7, 9);
  }
  return formatted;
};

const getRawPhoneNumber = (digits) => {
  return `+998${digits}`;
};

const LoginScreen = ({ onLogin, error, isLoading }) => {
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handlePhoneChange = useCallback((e) => {
    const inputValue = e.target.value;
    const prefix = "+998 ";

    let digitsOnly = inputValue.replace(/\D/g, '');

    if (digitsOnly.startsWith('998')) {
        digitsOnly = digitsOnly.substring(3); 
    }

    const limitedDigits = digitsOnly.substring(0, 9);

    setPhoneDigits(limitedDigits);
  }, []);

  const displayPhone = formatPhoneNumber(phoneDigits);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!isLoading) {
        const rawPhone = getRawPhoneNumber(phoneDigits);
        if (phoneDigits.length === 9) {
            onLogin(rawPhone, password);
        } else {
            console.error("Telefon raqam to'liq kiritilmagan.");
        }
    }
  };

  const isLoginDisabled = () => {
      return isLoading || phoneDigits.length !== 9;
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
             <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
                className="inline-block p-3 bg-indigo-600 dark:bg-indigo-500 rounded-full mb-4"
            >
                <LogIn className="w-8 h-8 text-white" />
            </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tizimga Kirish</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">O'qituvchi paneliga xush kelibsiz!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Telefon Raqam Maydoni */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Telefon Raqam
            </label>
            {/* Input elementi */}
            <input
              type="tel"
              id="phone"
              value={displayPhone} 
              onChange={handlePhoneChange} 
              placeholder="+998 XX XXX XX XX"
              required
              title="Telefon raqamini +998 XX XXX XX XX formatida kiriting"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 transition duration-150"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Parol
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 transition duration-150 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Xatolik Xabari */}
          {error && (
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-600 dark:text-red-400 text-center"
            >
                {error}
            </motion.p>
          )}

          {/* Kirish Tugmasi */}
          <Button
            type="submit"
            className="w-full !py-3 !text-base font-semibold"
            disabled={isLoginDisabled()}
            icon={isLoading ? null : LogIn}
          >
            {isLoading ? (
                <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
            ) : (
                'Kirish'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
