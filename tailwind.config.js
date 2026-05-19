/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        red: {
          50: '#fff0f0',
          100: '#ffe3e3',
          200: '#ffc1c1',
          300: '#ff9090',
          400: '#ff5c5c',
          500: '#ff4040',
          600: '#ff2d2d',
          700: '#e61e1e',
          800: '#cc1414',
          900: '#aa1212',
          950: '#4d0505',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 24px 80px rgba(15, 23, 42, 0.12)',
        glow: '0 18px 60px rgba(255, 45, 45, 0.24)',
      },
    },
  },
  plugins: [],
};
