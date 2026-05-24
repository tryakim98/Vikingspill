/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        viking: {
          darkblue: '#0B1426',
          surface: '#182846',
          gold: '#D4A843',
          'gold-soft': '#E8C97A',
          paper: '#FDFBF6',
          rust: '#A0522D',
          teal: '#2B6B6B',
          moss: '#5B7553',
          plum: '#6B3FA0',
          crimson: '#8B2929',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
