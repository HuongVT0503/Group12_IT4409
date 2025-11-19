/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: {
          300: "#C79AF5",
          400: "#9D63C9",
          500: "#7A3E9D",
        },
        neutral: {
          100: "#FFFFFF",
          200: "#F5F5F8", // light bg
          300: "#E5E5E5", // borders
        },
        bg: "#e6dcff", // main background
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #7A3E9D 0%, #C79AF5 100%)',
      }
    },
  },
  plugins: [],
};