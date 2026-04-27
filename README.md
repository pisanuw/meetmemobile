# MeetMe iOS

Native iPhone app for [MeetMe](https://meetme.pisan.me) — find the perfect meeting time across your team.

Built with **Expo / React Native** using file-based routing via `expo-router`.  
The app talks directly to the MeetMe Netlify backend at `meetme.pisan.me` — no new server needed.

---

## Features (v0.1)

- 🔐 Magic-link & Google OAuth sign-in (via in-app WebView — shares cookie with native fetch)
- 📋 Dashboard — view meetings you created and meetings you're invited to
- ➕ Create meeting — specific dates or days-of-week, time window, invite by email
- 🗓 Meeting detail — group heatmap view & personal availability grid (tap to select)
- ✅ Finalize meeting — creator taps a heatmap cell, sets duration & note
- 📧 Send reminders to non-responders
- 👤 Profile — edit name & timezone, send feedback, log out

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Expo CLI | `npm install -g expo@latest` |
| EAS CLI | `npm install -g eas-cli` (for App Store builds) |
| Xcode | 15+ (for iOS Simulator / device) |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start

# 3. Press 'i' to open in iOS Simulator
#    or scan the QR code with Expo Go on a real device
```

### Deep-link / magic-link testing

The backend sends magic links pointing at `https://meetme.pisan.me/api/auth/magic-link/verify?token=...`.
To have those links open your app instead of Safari during development:

1. Use a real device (Simulator can't handle Universal Links).
2. Or tap the link on the device — it will open in Safari, then tap "Open in MeetMe" if the Associated Domain is configured.

For local API testing with a different backend URL, set `API_BASE_URL` at build time:

```bash
API_BASE_URL=https://staging.meetme.pisan.me eas build --platform ios
```

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# Coverage report (threshold: 75%)
npm run test:coverage
```

### Test structure

```
__tests__/
├── api/
│   ├── client.test.ts       # HTTP client (fetch mocking)
│   ├── auth.test.ts         # Auth API calls
│   ├── meetings.test.ts     # Meetings API + mapper logic
│   ├── config.test.ts       # Utility functions (slotToTime etc.)
│   └── hooks.test.ts        # useFlash, useMeetings, useMeeting
├── hooks/
│   ├── deeplink.test.ts     # useDeepLinkHandler
│   ├── useCreateMeetingForm.test.ts
│   └── useProfileForm.test.ts
├── screens/
│   ├── LoginScreen.test.tsx
│   ├── DashboardScreen.test.tsx
│   ├── MeetingDetailScreen.test.tsx
│   ├── CreateMeetingScreen.test.tsx
│   ├── ProfileScreen.test.tsx
│   ├── EmailSentScreen.test.tsx
│   └── AuthContext.test.tsx
└── components/
    └── components.test.tsx  # Button, Card, MeetingCard, FlashMessage, LoadingScreen
```

---

## Building for the App Store

### 1. Configure EAS

```bash
eas login
eas build:configure
```

Update `app.json`:
- Set your real `bundleIdentifier` (e.g. `com.yourname.meetme`)
- Set `EAS_PROJECT_ID` env var or update `app.json` with your EAS project ID

### 2. Build

```bash
# Development build (for testing on device)
eas build --profile development --platform ios

# Production build (for App Store)
eas build --profile production --platform ios
```

### 3. Submit to App Store

```bash
eas submit --platform ios
```

---

## Project Structure

```
meetmemobile/
├── app/                        # expo-router screens (file-based routing)
│   ├── _layout.tsx             # Root layout — providers + RootNavigator + deep-link handler
│   ├── (auth)/
│   │   ├── login.tsx           # Magic-link email entry
│   │   ├── email-sent.tsx      # "Check your email" confirmation
│   │   └── webview-auth.tsx    # In-app WebView for OAuth / magic-link
│   └── (tabs)/
│       ├── index.tsx           # Dashboard
│       ├── create-meeting.tsx  # New meeting form
│       ├── profile.tsx         # Profile & settings
│       ├── privacy.tsx         # Privacy policy (App Store requirement)
│       └── meetings/[id].tsx   # Meeting detail + grids
├── src/
│   ├── api/                    # Typed API wrappers (client, auth, meetings)
│   ├── components/             # Reusable UI components
│   ├── config.ts               # Colors, spacing, API base URL (from build-time env), utilities
│   ├── context/AuthContext.tsx # Global auth state
│   ├── hooks/                  # useFlash, useMeetings, useMeeting, useCreateMeetingForm, useProfileForm, …
│   ├── navigation/             # RootNavigator (auth redirect logic)
│   ├── types/index.ts          # Shared TypeScript types
│   └── utils/validation.ts     # Shared validation helpers (isValidEmail)
└── __tests__/                  # Jest + RNTL test suite
```

---

## Auth Architecture

The backend uses **HttpOnly JWT cookies** — they cannot be read from JS.

On iOS, `WKWebView` (used by `react-native-webview`) and native `fetch()` share
the same iOS cookie store when `sharedCookiesEnabled={true}` is set.

**Magic-link flow:**
1. User enters email → `POST /api/auth/magic-link/request`
2. User taps link in email → opens `webview-auth.tsx` (via Universal Link / deep link)
3. WebView loads `/api/auth/magic-link/verify?token=...` → backend sets `token` cookie
4. WebView navigates to `/dashboard.html` or `/profile.html?setup=1` → app detects success, calls `getMe()`
5. All subsequent `fetch()` calls automatically include the cookie ✓

**Google OAuth flow:**
1. User taps "Continue with Google" → `webview-auth.tsx` loads `/api/auth/google/start`
2. OAuth completes → backend redirects to `/dashboard.html`
3. App detects success URL and calls `getMe()` ✓

---

## Environment / Configuration

The API base URL is baked in at build time via `app.config.js`:

```bash
# Use production backend (default)
eas build --platform ios

# Use a different backend
API_BASE_URL=https://staging.meetme.pisan.me eas build --platform ios
```

`src/config.ts` reads `Constants.expoConfig.extra.apiBaseUrl` at runtime (set by `app.config.js`).
