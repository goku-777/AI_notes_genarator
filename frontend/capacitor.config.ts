import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ainotesgenerator.app',
  appName: 'AI Notes Generator',
  webDir: 'dist',
  server: {
    // During local development against a live Vite dev server on your
    // phone/emulator, you can point this at your machine's LAN IP, e.g.
    // url: 'http://192.168.1.50:5173',
    // androidScheme: 'http',
    //
    // For production APK builds, leave `server` pointing at the bundled
    // `dist/` folder (the default) so the app works fully offline-capable
    // for static assets, talking only to VITE_API_BASE_URL for data.
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
