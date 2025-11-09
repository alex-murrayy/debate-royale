/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // University at Buffalo Primary Colors
        'ub-blue': {
          DEFAULT: '#005bbb',
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#005bbb',
          600: '#004999',
          700: '#003777',
          800: '#002555',
          900: '#001333',
        },
        'ub-white': {
          DEFAULT: '#ffffff',
        },
        // Secondary Colors (use sparingly)
        'letchworth-autumn': '#e56a54',
        'solar-strand': '#ffc72c',
        'greiner-green': '#ebec00',
        'lake-lasalle': '#00a69c',
        'capen-brick': '#990000',
        'bronze-buffalo': '#ad841f',
        'olmsted-green': '#6da04b',
        'niagara-whirlpool': '#006570',
        'victor-e-blue': '#2f9fd0',
        'harriman-blue': '#002f56',
        'baird-point': '#e4e4e4',
        'putnam-gray': '#666666',
        // Legacy primary mapping for compatibility
        primary: {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#005bbb',
          600: '#004999',
          700: '#003777',
          800: '#002555',
          900: '#001333',
          DEFAULT: '#005bbb',
        },
        accent: {
          DEFAULT: '#2f9fd0', // Victor E. Blue as accent
          autumn: '#e56a54',
          strand: '#ffc72c',
          green: '#ebec00',
          lasalle: '#00a69c',
          brick: '#990000',
          buffalo: '#ad841f',
          olmsted: '#6da04b',
          whirlpool: '#006570',
          victor: '#2f9fd0',
          harriman: '#002f56',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-ub': 'linear-gradient(135deg, #005bbb 0%, #2f9fd0 100%)',
        'gradient-ub-dark': 'linear-gradient(135deg, #003777 0%, #005bbb 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 91, 187, 0.4)',
        'glow-lg': '0 0 40px rgba(0, 91, 187, 0.6)',
        'glow-ub': '0 0 30px rgba(0, 91, 187, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(0, 91, 187, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

