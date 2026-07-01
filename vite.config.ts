import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  preview: {
    port: 5000,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        booking: 'booking.html',
        'booking-success': 'booking-success.html',
        services: 'services.html',
        gallery: 'gallery.html',
        contact: 'contact.html',
        privacy: 'privacy.html',
        terms: 'terms.html',
        admin: 'admin/index.html'
      }
    }
  }
});
