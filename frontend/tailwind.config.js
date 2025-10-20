/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        grafana: {
          bg: '#000000', // Pure black background
          panel: '#1a1a1a', // Dark grey panels
          border: '#333333', // Darker borders
          hover: '#2a2a2a', // Hover state
          orange: '#ff7833',
          'orange-light': '#ff9966',
          blue: '#5794f2',
          green: '#73bf69',
          yellow: '#fade2a',
          red: '#f2495c',
          text: '#ffffff', // Pure white text
          'text-secondary': '#cccccc', // Light grey secondary text
          'text-disabled': '#666666', // Darker grey disabled text
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
