/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'traffic-bg': '#0a0a0f',
        'traffic-panel': '#151520',
        'neon-green': '#39ff14',
        'neon-amber': '#ffbf00',
        'neon-red': '#ff3131',
        'neon-cyan': '#00ffff'
      },
      fontFamily: {
        'ops': ['Inter', 'sans-serif'],
        'display': ['Orbitron', 'sans-serif']
      }
    },
  },
  plugins: [],
}
