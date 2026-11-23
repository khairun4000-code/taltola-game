import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        royalHotelPreview: resolve(__dirname, 'royal-hotel-preview.html'),
        corollaPreview: resolve(__dirname, 'corolla-preview.html'),
        priusPreview: resolve(__dirname, 'prius-preview.html'),
        tata2515Preview: resolve(__dirname, 'tata-2515-preview.html'),
        circuitHousePreview: resolve(__dirname, 'circuit-house-preview.html'),
        whitePalacePreview: resolve(__dirname, 'white-heritage-palace-preview.html'),
      },
    },
  },
});
