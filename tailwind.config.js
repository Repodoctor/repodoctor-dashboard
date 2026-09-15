/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F172A',
          50: '#F8FAFC',
          100: '#FFFFFF',
          200: '#64748B',
          300: '#94A3B8',
          400: '#E2E8F0',
          500: '#64748B',
          600: '#1E293B',
          700: '#1E293B',
          800: '#0F172A',
          900: '#020617',
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
        canvas: '#F8FAFC',
        panel: '#FFFFFF',
        line: '#E2E8F0',
        cloud: '#F1F5F9',
        mute: '#64748B',
        pulse: '#1B9E6C',
        chrome: '#E2E8F0',
        warn: '#F59E0B',
        critical: '#EF4444',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(15, 23, 42, 0.04), 0 18px 48px rgba(15, 23, 42, 0.08)',
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
