/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1B2A41',
        secondary: '#132031',
        accent: '#C62828',
        accentDark: '#8E0000',
        accentSoft: '#FFEBEE',
        successSoft: '#E8F5E9',
        warningSoft: '#FFF3E0',
        primarySoft: '#E3F2FD',
        live: '#00897B',
        success: '#2E7D32',
        warning: '#E65100',
        bg: '#F4F1EC',
        cardBg: '#FFFFFF',
        border: '#D6D0C4',
        borderLight: '#E8E3DA',
        text: '#1B2A41',
        textLight: '#5D6B7E',
        textMuted: '#9CA8B7',
        surface: '#EBE7E0',
        alertRed: '#C62828',
        alertAmber: '#E65100',
        alertGreen: '#2E7D32',
        // Emergency command center dark palette
        'bg-app': '#0F1923',
        'surface-dark': '#182635',
        'border-dark': '#2A3F55',
        // Emergency accent
        emergency: '#C62828',
        'emergency-dark': '#EF5350',
        // Status colors
        safe: '#2E7D32',
        'warning-amber': '#E65100',
        // Text colors
        'text-dark': '#E1E4E8',
        'text-muted-dark': '#8B99A8',
        dark: {
          bg: '#0F1923',
          card: '#182635',
          elevated: '#1E3044',
          border: '#2A3F55',
          text: '#E1E4E8',
          textLight: '#8B99A8',
          textMuted: '#5A6978',
          accent: '#EF5350',
        },
      },
      fontFamily: {
        sans: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        hyperlegible: ['Atkinson Hyperlegible', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        beacon: 'beacon 1.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s linear infinite',
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
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(198, 40, 40, 0.4)' },
          '50%': { boxShadow: '0 0 24px 8px rgba(198, 40, 40, 0.7)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        emergency: '0 0 20px rgba(198, 40, 40, 0.3)',
        card: '0 1px 3px rgba(27,42,65,0.08), 0 1px 2px rgba(27,42,65,0.06)',
        'card-hover': '0 4px 12px rgba(27,42,65,0.1), 0 2px 4px rgba(27,42,65,0.06)',
        dark: '0 4px 16px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
