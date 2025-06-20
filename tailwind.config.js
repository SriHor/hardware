/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',   // sky-50
          100: '#e0f2fe',  // sky-100
          200: '#bae6fd',  // sky-200
          300: '#7dd3fc',  // sky-300
          400: '#38bdf8',  // sky-400
          500: '#0ea5e9',  // sky-500
          600: '#0284c7',  // sky-600
          700: '#0369a1',  // sky-700
          800: '#075985',  // sky-800
          900: '#0c4a6e',  // sky-900
          950: '#082f49',  // sky-950
        },
        secondary: {
          50: '#fff7ed',   // orange-50
          100: '#ffedd5',  // orange-100
          200: '#fed7aa',  // orange-200
          300: '#fdba74',  // orange-300
          400: '#fb923c',  // orange-400
          500: '#f97316',  // orange-500
          600: '#ea580c',  // orange-600
          700: '#c2410c',  // orange-700
          800: '#9a3412',  // orange-800
          900: '#7c2d12',  // orange-900
          950: '#431407',  // orange-950
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0ea5e9 0%, #f97316 100%)',
        'gradient-light': 'linear-gradient(135deg, #e0f2fe 0%, #fed7aa 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #075985 0%, #0c4a6e 100%)',
      },
    },
  },
  plugins: [],
};