# 03 — The Eternal Recurrence Question

> *"What if some day or night a demon were to steal after you into your loneliest loneliness and say to you: 'This life as you now live it and have lived it, you will have to live once more and innumerable times more'…"*
> Nietzsche, *The Gay Science* §341, "The Greatest Weight"

Nietzsche offered the thought of eternal recurrence as a **test of affirmation**, not as a metaphysical claim. Would you will this again? That makes it a triage tool almost word for word: a routine that you would not will to repeat forever is a routine that should be questioned.

This is the app's signature feature. It turns the list from **an inbox you owe** into **a thing you authored**.

## Design principles

1. **Optional, always.** Off until the user turns it on (onboarding offers it once). Never a "daily ritual" that becomes a new executive chore.
2. **Few questions, spaced.** At most 3 items per session (user can raise it to 7). Routines that keep earning a "yes" are asked less and less often (7 days → 21 days → 60 days), the same idea as spaced repetition. Questioning a stable "yes" every day would cheapen the question.
3. **The question is serious; the interface is light.** One sentence, two big buttons, a quiet third. Two seconds per item.
4. **"No" is not a failure of the task or the user.** It's the most valuable answer the app can get. It means the user just found something that isn't theirs.
5. **Some things are tolls, not choices.** Taxes, dishes, renewing a passport. They may fail the recurrence test and still have to happen. Nietzsche's answer isn't to pretend they're beautiful. It's *amor fati*: love what is necessary, and make it **weigh less**. Tolls get the question "how can this be lighter?", never "should this exist?" twice.
6. **No streaks for answering.** Skipping the question costs nothing, ever.

## When it's asked

User picks one (default: **after first completion**):

| Moment | Why |
|---|---|
| **After the day's first completion** (default) | Rides an existing dopamine moment. The user is already in a "yes" state, and the question costs nothing extra to reach. |
| Morning | For people who like to plan. Shown under today's Now card, never in front of it. |
| Evening | Reflective. Pairs with the optional day close. |
| Manual only | A "Recurrence" button in the Becoming tab. |

**Never** asked during focus mode, inside quiet hours, on a "fried" energy check-in, or more than once a day. If the prompt is dismissed 3 times in a row, the app asks once: *"Ask me less often, or not at all?"* Then it obeys.

## Which items get asked (selection logic)

```
eligible = routines where status = active
           AND recurrence.nextEligibleAt <= now
           AND (nature != 'toll' OR last toll review > 90 days)

score each:
  + 3  never asked (standing = 'unasked')
  + 3  slipped ≥ 3 times in the last 30 days      ← the data is already asking
  + 2  opened-but-not-started ≥ 3 times           ← avoidance signal
  + 1  no becoming link
  + 1  a "no"/"unsure" last time that led to "keep anyway"
  − 2  completed on time 5+ times in a row with low latency (it's working; leave it be)

ask top N (N = maxQuestionsPerSession, default 3); ties broken by oldest lastAskedAt
```

An optional "**run it on today's list**" button applies the same question to today's one-off tasks. It's useful on overloaded days. This mode is user-initiated only.

## The flow

```
                    ┌──────────────────────────────────────────────────────────┐
                    │  If you had to live this day again, innumerable times,     │
                    │  exactly the same, would you keep this on the list?        │
                    │                                                           │
                    │                 WEEKLY CALL WITH MOM                      │
                    │                                                           │
                    │         [   Yes, again   ]   [   No   ]                  │
                    │                    not sure · skip                        │
                    └──────────────────────────────────────────────────────────┘
                            │                │               │
                ┌───────────┘                │               └────────────┐
                ▼                            ▼                            ▼
             YES                            NO                       NOT SURE
     consecutiveYes += 1             "Then let's question it."      "Fair. Want to look
     nextEligible: spaced            ┌──────────────────────┐        at it closer, or ask
     standing = 'affirmed'           │ ▸ Reshape it         │        me again next week?"
                                     │ ▸ Make it rarer      │        ▸ Look closer → NO menu
     If no becoming link (and        │ ▸ It's a toll →      │        ▸ Next week → nextEligible +7d
     not asked in 30d):              │   make it lighter    │
     "Who does this make you?"       │ ▸ Let it go          │
     ▸ pick a Becoming / skip        │ ▸ Keep it anyway     │
                                     └──────────────────────┘
```

### The "No" menu, in detail

| Choice | What happens | Copy (see 04) |
|---|---|---|
| **Reshape it** | Opens the routine with the first step, duration and energy editable, plus one model suggestion for a smaller or different form ("weekly 1-hr call → 15-min call + a voice memo"). | "What would a version you'd say yes to look like?" |
| **Make it rarer** | Cadence picker that starts one notch looser (daily → few per week → weekly → monthly). | "How often would feel like *yours*?" |
| **It's a toll** | Sets `nature = 'toll'`. Offers lightening levers: automate, delegate, batch, pair with a reward, lower the bar ("good enough" definition). Tolls are asked again only every 90 days. | "Some things are the price of a life you want. Let's make this one cheaper." |
| **Let it go** | `status = 'released'`, small, dignified animation (fade, not trash can). Restorable for 90 days from the Released shelf. | "Released. Looking away is allowed." |
| **Keep it anyway** | Logged, no friction. Optional one-line note field ("why?"), never required. The note is private and never quoted back at them. | "Your call. It stays." |

### After a "Yes": identity linking (sparingly)

If the affirmed routine has no `becomingIds`, at most once per 30 days per routine:

> **Who does this make you?**
> [ a writer ] [ someone present ] [ + new ] · skip

This is the bridge between the philosophy and the motivation science. Linking a task to an identity is linked to more persistence (Oyserman's identity-based motivation work). It also keeps the "why" visible on the task card, which helps attention, because ADHD attention follows interest and meaning far better than obligation.

## What the user sees over time

In the Becoming tab, a single quiet line, never a dashboard:

> **Your list, authored.** 14 of 17 routines are ones you'd live again. Three months ago: 6 of 15.

That's the `affirmed_list_share` kind of `OvercomingEvidence`. It moves only when the user actually reshapes their life, so it can't be gamed by tapping "yes".

A "Released" shelf shows what they let go, framed as **what they made room for**, not what they failed at.

## Data written

- One `RecurrenceVerdict` per answer (including `skipped`, so we can learn when to stop asking).
- `Routine.recurrence` updated: `lastAskedAt`, `nextEligibleAt`, `consecutiveYes`, `standing`.
- `Routine.nature` / `cadence` / `status` changed by the follow-up choice.

## Edge cases

- **Bad day bias.** A "no" on a fried-energy day might be the mood talking. If a routine with 3+ consecutive "yes" answers gets a "no" on a low or fried check-in, the follow-up menu leads with "Ask me again on a better day" as the first option. It's still the user's call. (Mood-congruent judgment is well documented. The point isn't to protect the routine; it's to make sure the "no" is really theirs.)
- **Caregiving and obligations to others.** "Pick up kid from school" should never appear in the question. Routines can be flagged `nature: 'toll'` at creation, and an obvious-obligation classifier pre-flags them. Asking "would you keep picking up your kid?" would be grotesque.
- **Newly created routines** aren't asked for 14 days. You can't affirm what you haven't lived yet.
- **Everything is "no".** If more than 60% of answers in a session are "no", end the session early: *"That's a lot of no. That's important information, not a crisis. Want to look at the bigger picture in the Becoming tab sometime?"* No auto-releasing in bulk.
