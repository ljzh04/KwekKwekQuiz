import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

// Set correct base path for GitHub Pages
export default defineConfig({
  base: '/KwekKwekQuiz/',
  plugins: [],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
});
