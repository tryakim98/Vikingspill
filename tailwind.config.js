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
          coal:     '#08101C', // kullsvart bakgrunn
          darkblue: '#0B1426', // dyp nattblå
          surface:  '#182846',
          gold:     '#D4A843', // gammelgull
          'gold-soft': '#E8C97A',
          'gold-deep': '#8B6914', // mørk patinert gull/bronse
          paper:    '#FDFBF6',
          parchment: '#E8DBB7', // patinert pergament
          rust:     '#A0522D',
          teal:     '#2B6B6B',
          moss:     '#5B7553',
          bronze:   '#4A5A3C', // bronsegrønt
          plum:     '#6B3FA0',
          crimson:  '#8B2929', // blodrødt aksent
          'crimson-deep': '#5C1818',
          leather:  '#3A2615', // mørkt lær/tre
          'leather-soft': '#5C3E22',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        // «Saga» = Cinzel Decorative — kraftigere overskriftsfont med ornament,
        // brukes på hovedoverskrifter (RoleSelect-tittel, store paneler).
        saga: ['"Cinzel Decorative"', 'Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
