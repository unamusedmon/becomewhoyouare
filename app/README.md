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

Everything is stored on the device (AsyncStorage). Nothing leaves the phone yet.

## Not yet

Model-generated first steps (needs a small server so no API key ships in the app),
place cues, transition warnings before hard events (need a calendar), voice capture beyond
the keyboard's dictation, natural-language search.
