# MeetMe iOS — Roadmap

## v0.1 — Current (MVP)
- [x] Magic-link and Google OAuth sign-in via in-app WebView
- [x] Dashboard: list meetings created + invited
- [x] Create meeting: specific dates or days-of-week, time window, invite by email
- [x] Meeting detail: group heatmap view
- [x] Meeting detail: personal availability grid (tap to select)
- [x] Save / update availability
- [x] Finalize meeting (creator picks slot, sets duration + note)
- [x] Send reminder emails to non-responders
- [x] Profile: edit name, timezone, send feedback, log out
- [x] Jest + RNTL test suite with coverage thresholds

---

## v0.2 — Polish & Stability

### Auth
- [ ] Token refresh / silent re-auth when session cookie expires
- [ ] Handle expired magic link gracefully (show re-send option in WebView)
- [ ] Biometric unlock (Face ID) to resume session without re-auth

### UX
- [ ] Pull-to-refresh on meeting detail screen
- [ ] Skeleton loading placeholders instead of full-screen spinner
- [ ] Empty-state illustrations (SVG or Lottie animations)
- [ ] Haptic feedback on availability cell tap/drag
- [ ] Swipe-to-delete meeting on dashboard (creator only)
- [ ] Confirmation bottom sheet instead of `Alert.alert` for destructive actions

### Notifications
- [ ] Push notification permission request on first launch
- [ ] Receive push when someone submits availability for your meeting
- [ ] Receive push when your meeting is finalized
- [ ] Badge count on app icon for pending meetings

### Testing
- [ ] Increase coverage thresholds to 80% across branches/functions/lines
- [ ] Add E2E tests with Detox against the staging backend
- [ ] CI workflow (GitHub Actions) running Jest on every PR

---

## v0.3 — Feature Parity with Web

### Availability grid
- [ ] Drag-to-select multiple cells in one gesture (PanResponder)
- [ ] "Select all" / "Clear all" buttons
- [ ] Show Google Calendar conflicts as a greyed overlay (requires OAuth calendar scope)
- [ ] Time zone indicator on grid (show meeting creator's zone vs. viewer's zone)

### Heatmap
- [ ] Tap a heatmap cell to see a popover listing who is available at that time
- [ ] "By person" view: tap a participant row to see only their availability

### Meeting management
- [ ] Edit meeting title/description after creation
- [ ] Copy shareable meeting link to clipboard
- [ ] Share sheet integration (share meeting link via Messages, Mail, etc.)
- [ ] Meeting search / filter on dashboard

### Admin
- [ ] Admin-only screen: site stats, user list, meeting list, event log

---

## v1.0 — App Store Launch Ready

### Quality gates
- [ ] Full accessibility audit (VoiceOver, Dynamic Type, reduced motion)
- [ ] Right-to-left layout support
- [ ] iPad support (optional, low priority given portrait-only target)
- [ ] Dark mode support throughout
- [ ] Offline state handling — show cached data with "offline" banner

### Security
- [ ] Certificate pinning for API calls to `meetme-2.netlify.app`
- [ ] Jailbreak / root detection (optional, low-traffic app so low risk)
- [ ] Audit and restrict WebView navigation to known domains only

### App Store requirements
- [ ] Design app icon (1024×1024 px) and all required sizes
- [ ] Create splash screen asset
- [ ] App Store screenshots (6.7", 6.1", 5.5" + iPad if supported)
- [ ] Write App Store description, keywords, privacy policy URL
- [ ] Set up Apple Developer account & provisioning profiles
- [ ] Configure Associated Domains for Universal Links (magic-link deep linking)
- [ ] Age rating review (likely 4+)
- [ ] GDPR / privacy: confirm no personal data stored on device beyond the session cookie

### Infrastructure
- [ ] EAS build profiles: `development`, `preview`, `production`
- [ ] TestFlight distribution for beta testers
- [ ] Crashlytics / Sentry integration for production error tracking
- [ ] Analytics (privacy-respecting, e.g. PostHog) for feature usage metrics

---

## Future Ideas (Post-v1)

- [ ] **iMessage extension** — share a meeting link directly in a conversation
- [ ] **Widget** — home screen widget showing your next finalized meeting
- [ ] **Shortcuts integration** — "Hey Siri, create a MeetMe for Thursday"
- [ ] **Calendar sync** — write finalized meetings directly to iOS Calendar
- [ ] **Recurring meetings** — weekly recurring meeting templates
- [ ] **Android app** — the codebase is already cross-platform; just needs testing + Play Store submission
