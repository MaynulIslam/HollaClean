/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: '#9333ea',
        secondary: '#ec4899',
        accent: '#f97316',
      },
    },
  },
  plugins: [],
};
