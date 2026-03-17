import { useTheme } from '../contexts/ThemeContext';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <HiOutlineSun className="theme-icon sun-icon" />
            ) : (
                <HiOutlineMoon className="theme-icon moon-icon" />
            )}
        </button>
    );
}
