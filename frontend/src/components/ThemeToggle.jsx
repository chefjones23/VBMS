import { useTheme } from '../context/ThemeContext';
import { IconSun, IconMoon } from './Icon';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      type="button"
    >
      {theme === 'light' ? <IconMoon width={17} height={17} /> : <IconSun width={17} height={17} />}
    </button>
  );
}
