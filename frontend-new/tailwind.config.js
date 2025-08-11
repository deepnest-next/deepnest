/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // DeepNest theme colors
        'dn-bg-primary': '#f5f7f9',
        'dn-bg-secondary': '#ffffff',
        'dn-text-primary': '#404247',
        'dn-text-secondary': '#818489',
        'dn-border': '#e2e8ed',
        'dn-nav-bg': '#404247',
        'dn-button-primary': '#24c7ed',
        'dn-button-hover': '#3eddf7',
        'dn-table-bg': '#ffffff',
        'dn-table-hover': '#f5f7f9',
        'dn-table-active': '#24c7ed',
        'dn-input-bg': '#e2e8ed',
        'dn-input-border': '#c8cedb',
        'dn-input-text': '#7b879e',
        'dn-progress-bg': '#cdd8e0',
        
        // Dark theme
        'dn-dark-bg-primary': '#1a1a1a',
        'dn-dark-bg-secondary': '#2d2d2d',
        'dn-dark-text-primary': '#ffffff',
        'dn-dark-text-secondary': '#818489',
        'dn-dark-border': '#404040',
        'dn-dark-nav-bg': '#000000',
        'dn-dark-button-primary': '#1a98b8',
        'dn-dark-button-hover': '#1fb3d8',
        'dn-dark-table-bg': '#2d2d2d',
        'dn-dark-table-hover': '#3d3d3d',
        'dn-dark-table-active': '#1a98b8',
        'dn-dark-input-bg': '#3d3d3d',
        'dn-dark-input-border': '#505050',
        'dn-dark-input-text': '#ffffff',
        'dn-dark-progress-bg': '#404040',
      },
      spacing: {
        'nav': '4.375rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};