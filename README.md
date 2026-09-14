# Movo — Move. Earn. Give.

A real React Native / Expo SDK 57 app for **Android and iOS from one codebase**. This repository is independent of [movo-backend](https://github.com/salman679/movo-backend) and [movo-admin](https://github.com/salman679/movo-admin).

## Run on a device

Use Node 24 LTS and PNPM 11.19.0. Copy `.env.example` to `.env`, then:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

For Android emulators, `http://10.0.2.2:4000/api` reaches a backend running on the host. Physical devices need a reachable LAN or HTTPS backend URL. Use the separate backend's setup instructions to create the database and rewards catalog. No local passwords are stored; sessions use Expo SecureStore.

**Use a development build for background location**, not Expo Go. Connect the project to your Expo account with `eas init`, set `EAS_PROJECT_ID`, then build and install:

```sh
pnpm dlx eas-cli build --profile development --platform android
pnpm dev --dev-client
```

For iOS use `--platform ios`. EAS cloud builds require your Expo account; iOS signing requires an Apple Developer account. Local iOS builds need macOS/Xcode.

## Product flows

Welcome, backend signup/login/password reset, onboarding, five native tabs, GPS activity start/pause/resume/finish/recovery, activity summary/history, point ledger, real rewards/redemptions, giving campaigns, challenge joining/progress, period leaderboards, profile, notifications, permission settings, privacy/terms and password-confirmed account deletion.

Home shows actual verified tracked steps/distance, points issued today, the daily step goal, streak, wallet, a recent activity, current challenge and featured reward. All business-critical values come from the API. This is not an all-day step counter; measured steps are available only where the device sensor provides them during recorded activity.

## Tracking and offline design

`src/services/tracking/ActivityTrackingService.ts` isolates `start`, `pause`, `resume`, `stop`, `getCurrentActivity`, and `recoverActivity` from the UI. Expo Location and Task Manager record active sessions. SQLite persists state, timestamped samples and the submission queue transactionally. The background task reloads state from the database instead of relying on a live React component or in-memory variable.

- Foreground permission is requested only after the user reads the explanation and starts.
- Screen-lock tracking is an explicit option requiring background permission; a denial falls back to foreground recording with an explanation.
- Optional step measurement requests motion/activity permission only when chosen. Sensor counts may pause in the background; Movo does not invent steps.
- Five-second / five-meter updates, deferred background delivery, bounded 12-hour / 12,000-sample recordings, no heavy tracking animations.
- Pause intervals are saved and excluded from active duration and distance segments. Restart can recover the session or safely mark an interrupted foreground recording paused.
- Completed recordings are stored before the active session is cleared. The API receives raw samples and calculates the final distance, verification status and points.
- Sync retries use the same client activity ID and the original session token to avoid double rewards or cross-account uploads. Queue entries are scoped to their owner. Uploaded local coordinates are removed after acknowledgment. A failed sync remains visible with Retry.
- Force-quitting, OEM battery management and operating-system restrictions can stop background collection. The app detects recoverable interruption, but does not claim uninterrupted tracking after force-stop.

## EAS release

`eas.json` defines development, preview APK, and production Android AAB / iOS builds. `app.config.ts` configures application IDs, version, icon/adaptive icon, splash, location descriptions, motion permission and blocked unrelated permissions. No separate Android/iOS source trees are committed; Expo generates them.

Set these separately in each EAS environment:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EAS_PROJECT_ID`
- Optional final `ANDROID_APPLICATION_ID` and `IOS_BUNDLE_IDENTIFIER` (defaults `com.movo.app`). Confirm identifier ownership before first store release.

Production configuration requires HTTPS API/privacy/terms URLs and a real EAS project ID. Preview can point to a staging API. Configure EAS signing, then:

```sh
pnpm dlx eas-cli build --profile preview --platform android
pnpm dlx eas-cli build --profile production --platform all
```

JavaScript bundle export is not a signed APK/AAB/IPA or store approval. Before release, verify foreground/background GPS on physical budget Android and iOS devices: permissions denied/permanently denied, screen lock, app switch, pause/resume, no GPS, offline finish/sync, process interruption, duplicate sync and battery behavior. Confirm final generated Android manifest permissions and Apple entitlements in the native build.

## Privacy and notifications

The app collects identity, recorded location/time/accuracy, optional measured steps and reward/donation transactions. Leaderboards expose member names and activity totals; routes remain private. The included data explanations must be paired with published operator identity, support contact, Privacy Policy and Terms. Complete store Data Safety/App Privacy forms from the actual deployed behavior; compliance is not automatic.

Deletion is real and calls the API; local account recordings/cache are removed after successful deletion. The backend deletes GPS/notification data immediately and retains anonymized accounting records for its documented 365-day policy. Run the backend retention job and set a backup expiry schedule.

Notifications are opt-in. Movo offers one local 6 PM reminder plus a backend inbox for redemption updates. Expo push device registration is prepared; server push dispatch and additional reminder events are provider seams. Analytics is a no-op provider abstraction until an operator configures a provider; it does not transmit GPS or identity by default.

## Validate

```sh
pnpm typecheck
pnpm test
pnpm build
```

Build exports Android and iOS bundles. Tests cover tracking distance/time calculations; critical ledger, reward, anti-cheat and challenge tests live in the backend repository. GitHub Actions runs these mobile checks. Shared contracts are vendored at `packages/shared` v0.1.0 from the backend; shared tracking constants live in `packages/config`.
