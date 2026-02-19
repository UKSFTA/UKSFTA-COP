/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./layouts/**/*.html", "./content/**/*.md", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        'tactical-bg': '#050505',
        'tactical-surface': '#121212',
        'tactical-green': '#4caf50',
        'tactical-amber': '#ff9800',
        'tactical-blue': '#2196f3',
        'tactical-border': '#333333',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
