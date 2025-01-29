/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3B82F6', // Blue-500
          dark: '#60A5FA',  // Blue-400
        },
        secondary: {
          light: '#6366F1', // Indigo-500
          dark: '#818CF8',  // Indigo-400
        },
        background: {
          light: '#FFFFFF',
          dark: '#111827',
        },
        surface: {
          light: '#F3F4F6',
          dark: '#1F2937',
        },
        text: {
          primary: {
            light: '#111827',
            dark: '#F9FAFB',
          },
          secondary: {
            light: '#6B7280',
            dark: '#9CA3AF',
          },
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      boxShadow: {
        light: '0 2px 8px rgba(0, 0, 0, 0.1)',
        dark: '0 2px 8px rgba(255, 255, 255, 0.1)',
        'glow-light': '0 0 12px rgba(59, 130, 246, 0.3)',
        'glow-dark': '0 0 12px rgba(96, 165, 250, 0.3)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      container: {
        center: true,
        padding: '1rem',
      },
      fontFamily: {
        sans: ['Space Mono', 'monospace'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};