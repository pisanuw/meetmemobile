/**
 * app.config.js — dynamic Expo config that reads environment variables at
 * build time.  This file takes precedence over app.json for any keys it
 * exports.  Static values that don't change per-environment stay in app.json.
 *
 * To use a different API URL at build time:
 *   API_BASE_URL=https://staging.meetme.pisan.me eas build --platform ios
 */

const BASE_URL = process.env.API_BASE_URL ?? 'https://meetme.pisan.me';
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? '00000000-0000-0000-0000-000000000000';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'MeetMe',
  slug: 'meetme-ios',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'meetme',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#10b981',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.meetme.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'MeetMe does not use the camera.',
      CFBundleURLTypes: [{ CFBundleURLSchemes: ['meetme'] }],
    },
    associatedDomains: ['applinks:meetme.pisan.me'],
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#10b981',
    },
    package: 'com.meetme.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#10b981',
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiBaseUrl: BASE_URL,
    eas: { projectId: EAS_PROJECT_ID },
  },
};
