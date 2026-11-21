import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        royalHotelPreview: resolve(__dirname, 'royal-hotel-preview.html'),
      },
    },
  },
});
