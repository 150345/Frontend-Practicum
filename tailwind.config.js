/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#243b30',
        forest: '#244535',
        paper: '#fafaf6',
        coral: '#f9a18e',
        muted: '#59635b',
        line: '#d8ddd5',
        sage: '#e5ecdf',
        accent: '#cb6654',
        cream: '#f2dfbe',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', '"Trebuchet MS"', 'sans-serif'],
      },
      maxWidth: {
        site: '1200px',
      },
      keyframes: {
        arrive: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        arrive: 'arrive 0.7s ease-out both',
      },
    },
  },
  plugins: [],
}
