/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        surface: "#020817",
        neonGreen: "#22c55e",
        neonAmber: "#fbbf24",
        neonRed: "#f97373"
      }
    }
  },
  plugins: []
};

