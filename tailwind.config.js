/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0b0f14',
          50: '#e8eef4',
          100: '#e8eef4',
          200: '#8b9bb0',
          300: '#8b9bb0',
          400: '#1e2a36',
          500: '#1e2a36',
          600: '#1e2a36',
          700: '#12181f',
          800: '#12181f',
          900: '#0b0f14',
        },
        moss: {
          50: '#e8eef4',
          100: '#e8eef4',
          200: '#e8eef4',
          300: '#6eebd0',
          400: '#3ee0b2',
          500: '#3ee0b2',
          600: '#2bb894',
          700: '#1f8a70',
          800: '#166353',
        },
        panel: '#12181f',
        line: '#1e2a36',
        cloud: '#e8eef4',
        mute: '#8b9bb0',
        pulse: '#3ee0b2',
        warn: '#f5a524',
        critical: '#f43f5e',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(62, 224, 178, 0.04), 0 24px 64px rgba(0, 0, 0, 0.45)',
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
