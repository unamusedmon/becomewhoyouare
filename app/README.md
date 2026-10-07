# Become Who You Are: app

Expo (SDK 57) + React Native + TypeScript. This first slice is the core loop:
capture a task, see it as its smallest first step on the Now card, tap **I did it**.

## Run it

```bash
cd app
npm install
npx expo start        # scan the QR code with Expo Go, or press w for web
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

Everything is stored on the device (AsyncStorage). Nothing leaves the phone yet.

## Not yet

Model-generated first steps (needs a small server so no API key ships in the app),
implementation intentions, the recurrence question, notifications, voice capture
beyond the keyboard's dictation, natural-language search, overcoming evidence.
