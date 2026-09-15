/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#404040',
          50: '#FAFAFA',
          100: '#FFFFFF',
          200: '#737373',
          300: '#A3A3A3',
          400: '#E5E5E5',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        moss: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#1B9E6C',
          300: '#178F63',
          400: '#147A56',
          500: '#116B4B',
          600: '#0F5F42',
          700: '#047857',
          800: '#065F46',
        },
        canvas: '#FAFAFA',
        panel: '#FFFFFF',
        line: '#E5E5E5',
        cloud: '#F5F5F5',
        mute: '#737373',
        pulse: '#1B9E6C',
        chrome: '#F5F5F5',
        sidebar: '#525252',
        warn: '#F59E0B',
        critical: '#DC2626',
        red: {
          100: '#FEE2E2',
          200: '#DC2626',
          300: '#EF4444',
          400: '#DC2626',
          500: '#B91C1C',
          950: '#450A0A',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(64, 64, 64, 0.04), 0 18px 48px rgba(23, 23, 23, 0.08)',
      },
      keyframes: {
        'home-rise': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'home-scan': {
          from: { top: '18%' },
          to: { top: '88%' },
        },
        'home-drift': {
          from: { transform: 'translate(0, 0)' },
          to: { transform: 'translate(18%, 12%)' },
        },
      },
      animation: {
        'home-rise': 'home-rise 0.8s ease-out both',
        'home-rise-delayed': 'home-rise 1s 0.12s ease-out both',
        'home-scan': 'home-scan 3.8s linear infinite',
        'home-drift': 'home-drift 8s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
