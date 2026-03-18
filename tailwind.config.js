/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── New design system tokens (rebuild) ──────────────────
        urgent: '#FF3B30',       // primary action buttons, critical badges
        moderate: '#FF9500',     // moderate severity
        resolved: '#34C759',     // resolved status only
        shell: '#1C1C1E',        // header / app shell
        'app-bg': '#F2F2F7',     // page background
        surface: '#FFFFFF',      // cards, modals
        'text-primary': '#1C1C1E',
        'text-secondary': '#3C3C43',
        'text-tertiary': '#8E8E93',

        // ── Legacy tokens (keep during transition) ───────────────
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
        alertRed: '#C62828',
        alertAmber: '#E65100',
        alertGreen: '#2E7D32',
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
        // System stack — no font fetch, fastest possible render
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        // Legacy (used by existing components during transition)
        display: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08)',
        'card-md': '0 2px 12px rgba(0,0,0,0.08)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
