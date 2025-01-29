// components/ThemeToggle.tsx
import { Sun, Moon } from "lucide-react"

interface ThemeToggleProps {
    theme: string;
    onToggle: () => void;
}

const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
    return (
        <button
            onClick={onToggle}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            role="switch"
            aria-checked={theme === 'dark'}
        >
            <span className="sr-only">Toggle dark mode</span>
            <div
                className={`${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                    } inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out`}
            >
                {theme === 'dark' ? (
                    <Moon className="h-4 w-4 m-1 text-gray-600" />
                ) : (
                    <Sun className="h-4 w-4 m-1 text-yellow-500" />
                )}
            </div>
        </button>
    )
}

export default ThemeToggle