/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#22212B',
        secondary: '#16151E',
        accent: '#D93025',
        accentDark: '#B71C1C',
        live: '#2ec4b6',
        success: '#2d6a4f',
        warning: '#F59E0B',
        bg: '#FDF8F3',
        cardBg: '#ffffff',
        border: '#E8DDD0',
        text: '#3D2B1F',
        textLight: '#8B7355',
        textMuted: '#B5A28E',
        alertRed: '#dc2626',
        alertAmber: '#d97706',
        alertGreen: '#16a34a',
        dark: {
          bg: '#1A1924',
          card: '#22212B',
          elevated: '#2A2935',
          border: '#33323E',
          text: '#E8E6F0',
          textLight: '#9896A3',
          textMuted: '#5E5D68',
          accent: '#D93025',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        beacon: 'beacon 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        beacon: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      boxShadow: {
        emergency: '0 0 20px rgba(217, 48, 37, 0.3)',
        card: '0 1px 3px rgba(34,33,43,0.08), 0 1px 2px rgba(34,33,43,0.06)',
        'card-hover': '0 4px 12px rgba(34,33,43,0.1), 0 2px 4px rgba(34,33,43,0.06)',
        dark: '0 4px 16px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
