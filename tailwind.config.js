/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          500: '#9333ea',
          600: '#7e22ce',
          700: '#6b21a8',
        },
        pink: {
          50: '#fce7f3',
          500: '#ec4899',
          600: '#db2777',
        },
        orange: {
          500: '#f97316',
          600: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        accent: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
