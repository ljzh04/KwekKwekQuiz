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
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['js/modules/**/*.js'],
      exclude: ['js/modules/**/*.test.js', 'tests/**/*.spec.js'],
    },
  },
});
