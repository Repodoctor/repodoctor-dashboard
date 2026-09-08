/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#070b08',
          50: '#f3faf4',
          100: '#d7eadb',
          200: '#9fb8a6',
          300: '#6d8a75',
          400: '#3d5644',
          500: '#1c2a20',
          600: '#152019',
          700: '#101812',
          800: '#0c120e',
          900: '#070b08',
        },
        moss: {
          50: '#f0fff4',
          100: '#d6ffe4',
          200: '#b6ffc8',
          300: '#9affb0',
          400: '#7cff9a',
          500: '#4ae276',
          600: '#2f9d52',
          700: '#237542',
          800: '#1b5632',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(124, 255, 154, 0.12)',
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
