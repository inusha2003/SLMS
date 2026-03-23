/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lms: {
          darkest: '#20152B',
          dark: '#251F39',
          primary: '#393777',
          secondary: '#484A87',
          accent: '#46314A',
          muted: '#6C546A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};