/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 24px 80px rgba(15, 23, 42, 0.12)',
        glow: '0 18px 60px rgba(37, 99, 235, 0.28)',
      },
    },
  },
  plugins: [],
};
