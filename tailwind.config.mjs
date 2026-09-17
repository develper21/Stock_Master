/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf3",
          100: "#d1fae4",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
      boxShadow: {
        card: "0 18px 45px rgba(15,23,42,0.65)",
      },
      borderRadius: {
        xl: "1rem",
      },
      keyframes: {
        dashArray: {
          '0%': { strokeDasharray: '0 1 359 0' },
          '50%': { strokeDasharray: '0 359 1 0' },
          '100%': { strokeDasharray: '359 1 0 0' },
        },
        dashOffset: {
          '0%': { strokeDashoffset: '365' },
          '100%': { strokeDashoffset: '5' },
        },
        spinDashArray: {
          '0%': { strokeDasharray: '270 90' },
          '50%': { strokeDasharray: '0 360' },
          '100%': { strokeDasharray: '270 90' },
        },
        spinRotate: {
          '0%': { rotate: '0deg' },
          '12.5%, 25%': { rotate: '270deg' },
          '37.5%, 50%': { rotate: '540deg' },
          '62.5%, 75%': { rotate: '810deg' },
          '87.5%, 100%': { rotate: '1080deg' },
        },
      },
      animation: {
        'dash': 'dashArray 2s ease-in-out infinite, dashOffset 2s linear infinite',
        'spin-complex': 'spinDashArray 2s ease-in-out infinite, spinRotate 8s ease-in-out infinite, dashOffset 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
