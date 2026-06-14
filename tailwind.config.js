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
          // Skitne jordfarger — myrbrun base, oksidert bronse, blodrust, beinhvit,
          // mosegrønn. Bevisst dempet og «forvitret», vekk fra den rene blå/gull-looken.
          coal:     '#0C0A06', // sotbrun
          darkblue: '#17100A', // mørk valnøtt (base) — navnet beholdt
          surface:  '#241A10', // myrbrun/lær (panelflate)
          gold:     '#A8862F', // oksidert messing/bronse (dempet «gull»)
          'gold-soft': '#C7AD6E', // støvet bronse
          'gold-deep': '#7A5E18', // mørk patinert bronse
          paper:    '#E8DEC8', // beinhvit (ikke ren hvit)
          parchment: '#D6C49A', // skitnere pergament
          rust:     '#8A3F22', // blodrust
          teal:     '#3D5650', // mørk myr-grønnblå (dempet)
          moss:     '#5A6B43', // mosegrønn
          bronze:   '#4A5A3C', // bronsegrønt
          plum:     '#5C4466', // dempet plomme
          crimson:  '#7A2A20', // blodrødt aksent (skittent)
          'crimson-deep': '#4A1614',
          leather:  '#3A2615', // mørkt lær/tre
          'leather-soft': '#5C3E22',
        },
      },
      // KI-tell: avrundede hjørner. Alt firkantes (hugget-aktig) — sirkler beholdes (full).
      borderRadius: {
        none: '0', sm: '0', DEFAULT: '0', md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0',
        full: '9999px',
      },
      // KI-tell: myke drop-shadows. Fjernet — dybden bæres av harde kanter/border i stedet.
      boxShadow: {
        none: 'none', sm: 'none', DEFAULT: 'none', md: 'none', lg: 'none', xl: 'none', '2xl': 'none', inner: 'none',
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
