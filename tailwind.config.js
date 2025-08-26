import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./js/**/*.{js,ts}",
    "./components/**/*.html",
    "./public/**/*.html"
  ],
  plugins: [
    typography,
  ],
};

