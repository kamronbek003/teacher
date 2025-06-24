const Badge = ({ children, variant = 'default', className = '' }) => {
    const baseStyle = 'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
    const variantStyles = {
        default: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        secondary: 'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
        destructive: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        outline: 'text-gray-600 border-gray-300 dark:text-gray-400 dark:border-gray-600',
        success: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        warning: 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', 
    };
    return (
        <span className={`${baseStyle} ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
