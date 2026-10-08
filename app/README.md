# Become Who You Are: app

Expo (SDK 57) + React Native + TypeScript. This first slice is the core loop:
capture a task, see it as its smallest first step on the Now card, tap **I did it**.

## Run it

```bash
cd app
npm install
npx expo start        # scan the QR code with Expo Go on Android, or press a for an emulator
npm test              # domain tests (node:test via tsx)
npm run typecheck
```

## What's in this slice

| Area | File | Design doc |
|---|---|---|
| Data model subset | `src/domain/model.ts` | `docs/design/01-data-model.ts` |
| First-step generator (offline templates) + the six-rule validator | `src/domain/firstStep.ts` | `02-first-step-flow.md` |
| Lived-time durations, 1.5× default buffer | `src/domain/duration.ts` | `05-additional-science.md` §6 |
| Energy-based Now pick | `src/domain/planner.ts` | `01` (DayAllocation) |
| All state changes, incl. start-latency logging | `src/domain/reducer.ts` | `01` (TaskEvent, TaskStats) |
| Copy | `src/ui/copy.ts` | `04-copy-tone-guide.md` |

Slice 2 adds onboarding (`src/app/onboarding.tsx`), becomings, routines and the eternal
recurrence question (`src/domain/recurrence.ts`, `src/ui/RecurrenceCard.tsx`, design doc `03`),
and the Becoming screen (`src/app/becoming.tsx`). Screens use Expo Router under `src/app/`.

Slice 4 adds implementation intentions ("when I finish my coffee, at my desk, I'll…", with an
optional if-then for stalls) in `src/domain/intention.ts` and `src/ui/PlanEditor.tsx`, and
overcoming evidence computed from real start times in `src/domain/overcoming.ts` (silent until
the sample is big enough and the change is real). Android is the primary target: verify with
`npx expo export --platform android`.

Slice 5 adds gentle nudges: local notifications for plans tied to a clock time and, if
you want it, one daily nudge about something that has sat a while. They're off until you
turn them on, capped at six a day, and their wording rotates. The plan is a pure function
(`src/domain/nudges.ts`); `src/state/nudgeSync.ts` mirrors it to Android with
`expo-notifications`. Tapping a nudge opens that task on the Now card.

Slice 6 adds voice capture. Tap the mic on the Now screen, or "Talk" in onboarding, and say
everything in one breath: "um I need to call mom and then fix the computer oh and taxes" becomes
three tasks (`src/domain/spoken.ts` splits on "and then", "also", "I need to" and friends, never
on a bare "and"). `src/state/voice.ts` wraps `expo-speech-recognition`. That module is native, so
the in-app mic needs a development build (`npx expo run:android` or an EAS build); in Expo Go the
mic button focuses the field and points you at the keyboard's own mic instead.

Slice 7 is a friendliness pass. Taps that are easy to regret (done, let it go, not now, I did
it, stop here, rename) show an Undo bar for seven seconds (`src/domain/undo.ts`). Nothing set
aside is lost: Becoming lists everything let go or put off in onboarding, with "bring back".
Tapping a task under "Also here" offers do this now, rename or let it go, and tapping the task
name on the Now card renames it. The plan editor shows one kind of "when" at a time.

Slice 8 adds hints, tooltips for a touch screen. Each is one line next to the thing it explains,
shown once, at the moment that thing is on screen, and gone with a tap or by using the feature.
Never more than one at a time, with a pause between them (`src/domain/hints.ts`). Becoming has a
switch to turn them off and a link to show them all again.

Quick add: a + button sits at the bottom right of the Now and Becoming screens and opens a
one-field sheet (with the mic) that stays open for a burst of thoughts. On Android, long-pressing
the app icon offers "Quick add" too. That shortcut is native (`plugins/withQuickAddShortcut.js`
opens `becomewhoyouare://add`), so it appears in development and release builds, not in Expo Go.

Everything is stored on the device (AsyncStorage). The one exception is speech: the app asks
Android for on-device recognition when the phone supports it, and otherwise the phone's speech
service (usually Google's) may process the audio online. The app itself keeps no recordings.

## Not yet

Model-generated first steps (needs a small server so no API key ships in the app),
place cues, transition warnings before hard events (need a calendar), natural-language search.
