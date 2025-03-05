/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      // Drei zusätzliche kleinere Schriftgrößen
      fontSize: {
        '2xs': '0.625rem',    // 10px
        '3xs': '0.5rem',      // 8px
        '4xs': '0.375rem',    // 6px
      },
      colors: {
        // Add primary color which was missing
        primary: {
          DEFAULT: '#3B82F6', // blue-500
          dark: '#2563EB',    // blue-600
        },
        sidebar: {
          DEFAULT: 'rgb(240, 242, 245)',
          dark: 'rgb(10, 11, 12)',
        },
        background: {
          DEFAULT: '#f9fafb',
          dark: '#121212',
          sidebar: {
            light: 'rgb(240, 242, 245)',
            dark: 'rgb(10, 11, 12)',
          }
        },
        text: {
          light: '#333333',
          dark: '#ffffff',
          muted: {
            light: '#6B7280',
            dark: '#374151',
          }
        },
        active: {
          DEFAULT: '#2563EB',
          dark: '#3B82F6',
        },
        hover: {
          DEFAULT: 'rgba(0, 0, 0, 0.05)',
          dark: 'rgba(255, 255, 255, 0.1)',
        },
        divider: {
          DEFAULT: 'rgba(0, 0, 0, 0.1)',
          dark: 'rgba(255, 255, 255, 0.1)',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#1e1e1e',
        },
        input: {
          DEFAULT: '#ffffff',
          dark: '#2d2d2d',
        },
        border: {
          DEFAULT: '#e5e7eb',
          dark: '#333333',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      boxShadow: {
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        dark: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
