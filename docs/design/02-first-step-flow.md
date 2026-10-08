# 02 — The Smallest First Step

> The hardest moment is not *doing* the task. It's the gap between *seeing* it and *moving*. This flow exists to make that gap about the width of a thumb.

## What a first step is (the rules)

A valid first step is **one physical, visible action, under ~2 minutes, with zero decisions inside it.** The generator is held to six checks; a candidate that fails any of them is regenerated or rejected.

| # | Rule | Fails | Passes |
|---|------|-------|--------|
| 1 | Starts with a **physical verb** (open, type, pick up, put, write, tap, walk, fill, plug in, set) | "Think about the report" | "Open the report doc" |
| 2 | Names a **concrete object or place**, using the user's own tools where known | "Start the email" | "Open Gmail and type the subject line" |
| 3 | **No decisions** hidden inside (no choose, decide, plan, figure out, research, organize) | "Decide what to write" | "Type one ugly sentence about the main point" |
| 4 | **≤ ~2 minutes** of effort | "Clean the kitchen" | "Put three dishes in the sink" |
| 5 | **≤ 15 words**, readable at a glance | — | — |
| 6 | **Ends in a visible state** you could photograph | "Get into the right mindset" | "The tax folder is on the table, open" |

Banned lead verbs (auto-reject): `think, consider, plan, decide, figure, research, review, prepare, organize, brainstorm, reflect, try, start, begin, work on, deal with, handle`. ("Start" and "begin" are banned because they're promises, not actions.)

Why these rules: CBT protocols for adult ADHD (Safren et al., 2010; Solanto et al., 2010) teach exactly this: break the task down until the first piece is so small it feels almost silly, then start there. The 2-minute ceiling sits below the threshold where task aversion usually kicks in. The "no decisions" rule targets the executive-function cost of choosing, which is often what stalls initiation, more than the effort itself.

## The flow

```
CAPTURE ──► PARSE ──► CLASSIFY ──► GENERATE (3 candidates) ──► VALIDATE ──► SHOW ONE
  voice/      title,    energy,        LLM w/ user context       6 rules       on task card
  text/       entities, duration,      (tools, places, past       + banned       + swipe for
  share       deadline  becoming link   accepted steps)            verbs          the other 2
                                                                                     │
          ┌──────────────────────────────────────────────────────────────────────────┤
          ▼                       ▼                        ▼                         ▼
     [ I did it ]          [ Still too big ]          [ Edit ]                 (ignore it)
          │                       │                        │                         │
   celebrate (vivid,       shrink recursively:      user's text becomes        nothing happens.
   <1s), log latency,      generate a smaller       the step; learn from       No nag. Planner
   then offer:             step from the current    the edit (tools,           may resurface it
   ▸ Keep going (next      one, depth+1. At         phrasing).                 later at a better
     step / focus timer)   depth 3: "This might                                energy fit.
   ▸ That's enough         need a different
     for now ✓ (counts     shape" → split / set
     as a real win)        an intention / pair
                           with a reward / let go
```

### Step by step

1. **Capture (zero friction).** One tap or voice. The raw text is saved *before* any processing so nothing is lost if the network or model fails. The user never has to fill a form. Parsing happens in the background; the task appears instantly with a placeholder step ("Open [the thing]").
2. **Parse.** Pull out title, people/places/tools/dates, any deadline, and whether it's a one-off or recurring.
3. **Classify.** Infer `energy` (deep / medium / autopilot) and a raw duration. Convert to `plannedMinutes` using the user's calibration multiplier (starting at 1.5× because of the planning fallacy, which is worse with ADHD time perception), and render it in a lived unit ("about one laundry cycle").
4. **Generate three candidates** in one model call (prompt below). Three, not one, because the right first step is very personal. Cheap alternatives turn the choice into a swipe instead of a blank-page edit.
5. **Validate** each candidate in code, not in the prompt: verb whitelist/blacklist, word count, decision-word scan, object present. Failing candidates get one regeneration, then the system falls back to templates (below).
6. **Show one.** The task card is the first step, big. The task title is smaller, above it. Visually, the *step* is the task.
7. **Act.**
   - **I did it** → immediate vivid completion signal (haptic plus a short animation, under 800 ms), log `first_step_done` with start latency, then ask *one* low-pressure question: keep going, or that's enough for now. **Stopping after the first step is a legitimate, celebrated outcome**, not a half-failure. A started task is easier to resume later. That's the Ovsiankina effect: interrupted tasks tend to get resumed (the related Zeigarnik claim, that unfinished tasks are *remembered* better, did not hold up in a 2025 meta-analysis by Ghibellini & Meier). It also gets around delay aversion.
   - **Still too big** → recursive shrink. Each press asks the generator for a step that's smaller than the current one, with the current one in context. Shrink depth is logged; it's useful data for the slip-insight engine.
   - **At shrink depth 3**, the problem probably isn't size. Offer the slip-insight menu (see `SlipInsight` in the data model): split it, set a when-where-how intention, pair it with a reward, start it with a body double, or let it go.
8. **Learn.** Accepted steps, edits and rejections feed per-user few-shot examples (the last ~20 accepted steps go into the prompt). Over time the generator says "Open VS Code" instead of "Open your editor", because it knows.

### Implementation-intention capture (optional, one card)

Right after a step is accepted, for tasks that are deep, deadline-bound, or have slipped before, offer a single swipeable card:

> **When** ▸ *[after coffee]* · **Where** ▸ *[at my desk]* · **I will** ▸ *open the report and write one bullet*

- Chips are prefilled from history ("after coffee", "when I get home", "after standup") so it's tap-tap-done.
- The *how* defaults to the first step. That's the bridge: the intention fires the step.
- An optional obstacle line, MCII-style: *"If I find myself on my phone instead, then I'll put it face down and type one bullet."* Only offered once the user has used intentions at least 3 times, so it doesn't add load early.
- Event triggers ("when I finish coffee") are preferred over clock times, because they don't depend on time perception.

## The generation prompt (sketch)

A fast, small model is enough here (e.g. `claude-haiku-4-5-20251001`). Latency matters more than brilliance, because the step has to appear while the user is still looking at the task.

```text
SYSTEM
You turn a task into the smallest possible first physical action for a person
with ADHD. You return JSON only.

Rules for every candidate:
- Begin with a physical verb (open, type, put, pick up, write, tap, walk, fill, set, plug).
- Never begin with: think, consider, plan, decide, figure, research, review,
  prepare, organize, brainstorm, start, begin, try, work on, deal with, handle.
- Name a concrete object or place. Prefer the user's known tools and places.
- Contain no decision. If the task requires a decision, the first step is
  opening the place where the decision will be made.
- Doable in under 2 minutes. 15 words max. Ends in a state you could photograph.
- Plain, warm, imperative. No exclamation marks. No motivational language.

Return: {"candidates":[{"text":"...","verb":"...","object":"...","estSeconds":N}, x3],
         "energy":"deep|medium|autopilot", "rawMinutes":N}
Make candidate 1 the most obvious, candidate 2 the most physical,
candidate 3 the most playful (allowed to be a little absurd if it is still useful).

USER
Task: "{title}"
Notes: "{notes}"
Known tools: {knownTools}
Known places: {knownPlaces}
Current step (if shrinking, make something strictly smaller): "{currentStep}"
Examples of first steps this person accepted: {lastAcceptedSteps}
```

### Worked examples

| Task | Candidate 1 (obvious) | Candidate 2 (physical) | Candidate 3 (playful) |
|------|----------------------|------------------------|----------------------|
| Write email draft to landlord | Open Gmail and type the subject line | Put your phone down and open Gmail on the laptop | Type "Dear landlord" and nothing else |
| Do taxes | Put the tax folder on the table, open | Plug in the laptop and open the tax site | Find one W-2 and put it on top of the pile |
| Clean the kitchen | Put three dishes in the sink | Take the trash bag out of the bin | Clear one square foot of counter, any foot |
| Finish chapter 4 | Open chapter4.md and read the last paragraph | Sit at the desk and open the doc | Type one ugly sentence. Make it bad on purpose |
| Call the dentist | Open the dentist's contact on your phone | Write the dentist's number on a sticky note | Tap call. You can hang up if it rings out |
| Go to the gym | Put your gym shoes by the door | Put on gym shorts | Fill your water bottle. That's the whole job |

Shrinking example, "Do taxes":
`Put the tax folder on the table, open` → *still too big* → `Pick up the tax folder` → *still too big* → `Look at where the tax folder is` → *depth 3, offer reshape*.

## Fallbacks & edge cases

- **Offline / model down:** templates keyed by inferred category (`email → "Open {mailTool} and type the subject line"`, `call → "Open {contact} on your phone"`, `clean → "Put three {objects} where they go"`, `write → "Open {doc} and type one sentence"`, generic → `"Put {object} in front of you"`). Templates are flagged `source: 'template'` and quietly upgraded when the model is reachable.
- **Tasks that are already tiny** ("text Sam back"): the first step *is* the task. Don't invent a smaller one; show a single **Do it** button.
- **Waiting-on tasks** ("hear back from HR"): the first step is the nudge action ("Open the HR thread and type 'just checking in'"), or the task is flagged `blocked_by_other` and leaves the Now card.
- **Emotionally loaded tasks** (detected from slip patterns or words like "ex", "debt", "doctor"): bias toward candidate 2 (physical, body-first) and offer body doubling. Aversion is a feeling problem, not a size problem (Sirois & Pychyl, 2013).
- **Privacy:** task text goes to the model provider. Say so plainly in onboarding, keep a local-template-only mode, and never send the `note` or `reflectionAnswer` fields.

## What we measure

- **Start latency**: card opened → `first_step_done`. This is the core self-overcoming metric (see 01, `OvercomingEvidence.start_latency_drop`).
- **Acceptance rate** of candidate 1, 2 and 3. If 3 wins often, the user likes play; weight it.
- **Shrink depth distribution**: if the median depth is above 1, the generator is too ambitious for this user. Tighten.
- **Edit distance** between the generated and the final step. This is the learning signal.
