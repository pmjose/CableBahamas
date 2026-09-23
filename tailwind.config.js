/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vfes: {
          red: '#FF4438',
          'red-dark': '#D92D22',
          'red-light': '#FF776E',
          dark: '#222128',
          ink: '#141414',
          yellow: '#FF4438',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradient-shift 12s ease infinite',
        'float': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'scan': 'scan 8s linear infinite',
        'faster-pulse': 'faster-pulse 1.6s ease-in-out infinite',
      },
      keyframes: {
        'faster-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            textShadow: '0 0 0px rgba(255,68,56,0), 0 0 0px rgba(255,119,110,0)',
            filter: 'brightness(1)',
          },
          '50%': {
            transform: 'scale(1.06)',
            textShadow: '0 0 18px rgba(255,68,56,0.8), 0 0 36px rgba(255,119,110,0.5)',
            filter: 'brightness(1.25)',
          },
        },
        'scan': {
          '0%': { transform: 'translateY(-20vh)' },
          '100%': { transform: 'translateY(120vh)' },
        },
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
      },
    },
  },
  plugins: [],
}
