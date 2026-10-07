# Become Who You Are

*A Nietzschean app for people with ADHD. The task engine is the implementation; becoming is the point.*

## Design foundations (v0.1)

| # | Doc | What it is |
|---|-----|------------|
| 01 | [`01-data-model.ts`](01-data-model.ts) | Core data model as TypeScript types: Becoming, Capture, Task, FirstStep, ImplementationIntention, DurationEstimate (lived units), Routine + RecurrenceVerdict, append-only TaskEvents, SlipInsight, OvercomingEvidence |
| 02 | [`02-first-step-flow.md`](02-first-step-flow.md) | The smallest-first-step generator: rules, flow, prompt, worked examples, shrink loop, fallbacks |
| 03 | [`03-recurrence-triage-flow.md`](03-recurrence-triage-flow.md) | The eternal recurrence question: when it's asked, selection logic, the yes/no/not-sure flow, tolls vs. choices |
| 04 | [`04-copy-tone-guide.md`](04-copy-tone-guide.md) | Voice, banned words, copy for every moment, vetted aphorism library, visual tone |
| 05 | [`05-additional-science.md`](05-additional-science.md) | Evidence grades for the original spec and 14 added mechanisms, with citations |

## The five load-bearing ideas

1. **The first step is the task.** The UI shows the step large and the title small. Start latency is the core metric.
2. **Nothing is overdue.** No overdue field, no red, no streak loss. Slips are data that point at how the task is built.
3. **The list is authored, not owed.** The recurrence question turns routines into choices or into honestly named tolls.
4. **Growth is measured as capability.** "You start faster now", not badge counts. It's only shown when the data is real.
5. **Science runs the mechanics; Nietzsche supplies the meaning.** One aphorism per screen at most, always skippable.
