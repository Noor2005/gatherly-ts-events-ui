# Gatherly — React Native app

Mobile port of the Gatherly web app. Reuses `TimeZoneUtils` from `src/utils/` and mirrors all main screens and services.

## Structure

```
react-native/
├── App.jsx                    # Entry point
├── navigation/
│   ├── AppNavigator.jsx       # Stack + auth redirect
│   ├── TabNavigator.jsx       # Bottom tabs (replaces NavBar)
│   └── ProtectedScreen.jsx    # Auth guard
├── screens/
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── MyEventsPage.jsx
│   ├── EventDetailsPage.jsx
│   └── AddEventForm.jsx
├── components/
│   ├── EventCard.jsx
│   ├── EventsCarousel.jsx     # Replaces Swiper
│   ├── SearchBar.jsx
│   ├── LoadingComponent.jsx
│   ├── LoadingText.jsx
│   ├── FormField.jsx
│   ├── AlertBanner.jsx
│   ├── GoogleCalendarEventButton.jsx
│   └── DownloadEvent.jsx
└── services/
    ├── storage.js             # AsyncStorage (replaces localStorage)
    ├── api.js
    ├── AuthService.js
    └── EventService.js
```

## Web → Native mapping

| Web | React Native |
|-----|----------------|
| `NavBar` sidebar | Bottom tab navigator |
| `ProtectedRoute` | `ProtectedScreen` + stack guards |
| `localStorage` | `AsyncStorage` |
| Swiper | `EventsCarousel` (horizontal `FlatList`) |
| MUI Login | Native `TextInput` + OTP boxes |
| `react-hook-form` | Controlled state in `AddEventForm` |
| `react-icalendar-link` | ICS string via `Share` API |
| Google Calendar link | `Linking.openURL` |
| `window.location` redirect | React Navigation `reset` / `navigate` |

## Setup (Expo)

From the `react-native/` folder:

```bash
cd react-native
npm install
```

Create `.env` (or use Expo env):

```
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com/api
```

Update `SHARE_BASE_URL` in `components/EventCard.jsx` and `screens/EventDetailsPage.jsx`.

Run:

```bash
npx expo start
```

Wire `App.jsx` as the Expo entry in `app.json`:

```json
{
  "expo": {
    "main": "App.jsx"
  }
}
```

## Dependencies

- `@react-navigation/native` + stack + bottom tabs
- `@react-native-async-storage/async-storage`
- `axios`, `jwt-decode` (same as web)

## Notes

- **Login tab**: shows sign-in when logged out; account + logout when logged in.
- **Create Event tab**: only visible for `ROLE_ADMIN`.
- **My Events tab**: only visible when authenticated.
- Date/time on create/edit uses `YYYY-MM-DDTHH:mm` text input; swap in `@react-native-community/datetimepicker` for a native picker if preferred.

## Build for TestFlight (iOS)

TestFlight is Apple’s beta channel. You need an **Apple Developer Program** membership ($99/year). On **Windows** you cannot build iOS locally — use **EAS Build** (Expo’s cloud builders).

### 1. Prerequisites

- [Apple Developer account](https://developer.apple.com/programs/)
- [App Store Connect](https://appstoreconnect.apple.com/) — create an app with bundle ID matching `app.json` → `ios.bundleIdentifier` (default: `com.techsisters.gatherly`)
- [Expo account](https://expo.dev/signup) (free tier includes limited EAS builds)

### 2. One-time setup (required — fixes “EAS project not configured”)

Run these from the **`react-native/`** folder (not the repo root):

```bash
cd react-native
npm install
npm install -g eas-cli
eas login
eas init
```

`eas init` creates an EAS project and writes a `projectId` into `app.json` under `expo.extra.eas`. **Without this step, builds from expo.dev will fail.**

Verify `app.json` contains something like:

```json
"extra": {
  "eas": {
    "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

Commit `app.json` after `eas init` so the Expo dashboard can find the linked project.

**If you use the Expo website:** when connecting the GitHub repo, set the **project root** to `react-native` (not the monorepo root).

Set your **production API URL** (not localhost) as an EAS secret:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value https://your-api.example.com/api/v1
```

Update `app.json` if needed:

- `expo.ios.bundleIdentifier` — must match App Store Connect exactly
- `expo.version` — user-facing version (e.g. `1.0.0`)
- `expo.ios.buildNumber` — incremented each upload (or use `autoIncrement` in `eas.json`)

Update `eas.json` → `submit.production.ios` with your Apple ID, Team ID, and App Store Connect app ID (or pass them at submit time).

### 3. Build the iOS app (cloud)

```bash
npm run build:ios
```

Or:

```bash
eas build --platform ios --profile production
```

EAS will prompt to create/use Apple credentials (certificates + provisioning). Choose **automatic** unless your org manages certs manually.

When the build finishes, download the `.ipa` from the Expo dashboard or use the link in the terminal.

### 4. Submit to TestFlight

**Option A — CLI (recommended):**

```bash
npm run submit:ios
```

**Option B — Expo dashboard:** open the build → **Submit to App Store**.

**Option C — Transporter:** download the `.ipa` and upload with [Apple Transporter](https://apps.apple.com/app/transporter/id1450874784) (Mac) if you have access to a Mac.

### 5. Enable testers in App Store Connect

1. App Store Connect → **My Apps** → **Gatherly** → **TestFlight**
2. Wait for **Processing** to complete (often 5–30 minutes)
3. Answer **Export Compliance** if prompted (`ITSAppUsesNonExemptEncryption: false` in `app.json` usually covers standard HTTPS-only apps)
4. Add **Internal testers** (team) or **External testers** (requires brief Beta App Review for first external build)
5. Testers install via the **TestFlight** app on iPhone

### 6. Subsequent releases

Bump `expo.version` for marketing releases, or rely on `autoIncrement` in `eas.json` for build numbers:

```bash
npm run build:ios
npm run submit:ios
```

### Common issues

| Issue | Fix |
|--------|-----|
| Bundle ID mismatch | Same ID in `app.json` and App Store Connect |
| API calls fail in TestFlight | Set `EXPO_PUBLIC_API_BASE_URL` EAS secret to production HTTPS URL |
| Missing compliance | Complete export compliance in App Store Connect |
| Build queue slow | Free EAS tier has limits; paid plan for faster builds |
