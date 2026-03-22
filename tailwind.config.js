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

        // ── Dark emergency command center palette ───────────────────
        'bg-app': '#0F1923',
        'surface-dark': '#182635',
        'border-dark': '#2A3F55',

        // Status colors
        'emergency': '#C62828',
        'emergency-dark': '#EF5350',
        'safe': '#2E7D32',
        'safe-dark': '#4CAF50',
        'warning-amber': '#E65100',
        'warning-amber-dark': '#FF9800',

        // Text
        'text-dark': '#E1E4E8',
        'text-muted-dark': '#8B99A8',
      },
      fontFamily: {
        // System stack — no font fetch, fastest possible render
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        // Legacy (used by existing components during transition)
        display: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        // Accessibility-focused font
        hyperlegible: ['Atkinson Hyperlegible', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        // Dark emergency command center animations
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
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
        // Dark emergency command center keyframes
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(198, 40, 40, 0.4)' },
          '50%': { boxShadow: '0 0 24px 8px rgba(198, 40, 40, 0.7)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
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
