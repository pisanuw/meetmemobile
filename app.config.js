/**
 * app.config.js — dynamic Expo config that reads environment variables at
 * build time.  Static values live in app.json; this file only overrides what
 * needs to vary per environment.
 *
 * To target a different backend at build time:
 *   API_BASE_URL=https://staging.meetme.pisan.me eas build --platform ios
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expo: baseConfig } = require('./app.json');

const BASE_URL = process.env.API_BASE_URL ?? 'https://meetme.pisan.me';
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? '00000000-0000-0000-0000-000000000000';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...baseConfig,
  extra: {
    apiBaseUrl: BASE_URL,
    eas: { projectId: EAS_PROJECT_ID },
  },
};
