import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext'; 

const Avatar = ({ src, alt, fallback, className = '' }) => {
    const [imgError, setImgError] = useState(false);
    const fallbackText = fallback || '?';
    const placeholderUrlLight = `https://placehold.co/100x100/e0e7ff/4f46e5?text=${encodeURIComponent(fallbackText)}`;
    const placeholderUrlDark = `https://placehold.co/100x100/374151/a5b4fc?text=${encodeURIComponent(fallbackText)}`;

    const { theme } = useTheme(); 
    const placeholderUrl = theme === 'dark' ? placeholderUrlDark : placeholderUrlLight;

    useEffect(() => {
        setImgError(false); 
    }, [src]);

    return (
        <div className={`relative flex shrink-0 overflow-hidden rounded-full ${className}`}>
            {imgError || !src ? (
                 <img className="aspect-square h-full w-full object-cover" src={placeholderUrl} alt={alt || 'Placeholder'} />
            ) : (
                <img
                    className="aspect-square h-full w-full object-cover"
                    src={src}
                    alt={alt || 'Avatar'}
                    onError={() => setImgError(true)} 
                />
            )}
        </div>
    );
};

export default Avatar;
