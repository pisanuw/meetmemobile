# MeetMe iOS

Native iPhone app for [MeetMe](https://meetme-2.netlify.app) — find the perfect meeting time across your team.

Built with **Expo / React Native** using file-based routing via `expo-router`.  
The app talks directly to the existing MeetMe Netlify backend — no new server needed.

---

## Features (v0)

- 🔐 Magic-link & Google OAuth sign-in (via in-app WebView — shares cookie with native fetch)
- 📋 Dashboard — view meetings you created and meetings you're invited to
- ➕ Create meeting — specific dates or days-of-week, time window, invite by email
- 🗓 Meeting detail — group heatmap view & personal availability grid (tap/drag)
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

The backend sends magic links pointing at `https://meetme-2.netlify.app/api/auth/magic?token=...`.
To have those links open your app instead of Safari during development:

1. Use a real device (Simulator can't handle Universal Links).
2. Or tap the link on the device — it will open in Safari, then tap "Open in MeetMe" if the Associated Domain is configured.

For local API testing with a different backend URL, set `API_BASE_URL` in `src/config.ts`.

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test structure

```
__tests__/
├── api/
│   ├── client.test.ts       # HTTP client (fetch mocking)
│   ├── auth.test.ts         # Auth API calls
│   ├── meetings.test.ts     # Meetings API calls
│   ├── config.test.ts       # Utility functions (slotToTime etc.)
│   └── hooks.test.ts        # useFlash, useMeetings, useMeeting
└── screens/
    ├── LoginScreen.test.tsx
    ├── DashboardScreen.test.tsx
    ├── MeetingDetailScreen.test.tsx
    ├── CreateMeetingScreen.test.tsx
    ├── ProfileScreen.test.tsx
    └── AuthContext.test.tsx
components/
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
- Set `extra.eas.projectId` from your EAS dashboard

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
meetme-ios/
├── app/                        # expo-router screens (file-based routing)
│   ├── _layout.tsx             # Root layout — providers + RootNavigator
│   ├── (auth)/
│   │   ├── login.tsx           # Magic-link email entry
│   │   ├── email-sent.tsx      # "Check your email" confirmation
│   │   └── webview-auth.tsx    # In-app WebView for OAuth / magic-link
│   └── (tabs)/
│       ├── index.tsx           # Dashboard
│       ├── create-meeting.tsx  # New meeting form
│       ├── profile.tsx         # Profile & settings
│       └── meetings/[id].tsx   # Meeting detail + grids
├── src/
│   ├── api/                    # Typed API wrappers (client, auth, meetings)
│   ├── components/             # Reusable UI components
│   ├── config.ts               # Colors, spacing, API base URL, utilities
│   ├── context/AuthContext.tsx # Global auth state
│   ├── hooks/                  # useFlash, useMeetings, useMeeting, ...
│   ├── navigation/             # RootNavigator (auth redirect logic)
│   └── types/index.ts          # Shared TypeScript types
└── __tests__/                  # Jest + RNTL test suite
```

---

## Auth Architecture

The backend uses **HttpOnly JWT cookies** — they cannot be read from JS.

On iOS, `WKWebView` (used by `react-native-webview`) and native `fetch()` share
the same iOS cookie store when `sharedCookiesEnabled={true}` is set.

**Flow:**
1. User enters email → `POST /api/auth/send-magic-link`
2. User taps link in email → opens `webview-auth.tsx`
3. WebView loads the magic-link URL → backend sets `session` cookie
4. WebView navigates to `/dashboard.html` → app detects this, calls `getMe()`
5. All subsequent `fetch()` calls automatically include the cookie ✓

---

## Environment / Configuration

All config lives in `src/config.ts`. For a different backend:

```ts
export const API_BASE_URL = 'https://your-backend.netlify.app';
```

No `.env` file is required for v0 — the backend URL is the only runtime config.
