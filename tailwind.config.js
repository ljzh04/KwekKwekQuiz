module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./js/**/*.js"], // Scan your files
  theme: {
    extend: { /* your theme extensions */ },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}.
