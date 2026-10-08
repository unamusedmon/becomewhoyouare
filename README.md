# Become Who You Are

### *or, How to Philosophize with a To-Do List*

> *"You shall become the person you are."*
> (*The Gay Science* §270, said by a man with a famously huge mustache)

A task app for ADHD brains, with a Nietzschean spine. The to-do engine is the hammer. Becoming is the point.

---

## Prologue: Zarathustra Descends from the Mountain, Opens the App Store

When Zarathustra was thirty years old he left his home and went into the mountains. There he enjoyed his spirit and his solitude, and for ten years he did not tire of it. Then he came back down with an inbox of 4,000 unread messages, a dentist appointment he had been "about to book" since 2019, and a productivity app that greeted him with a red badge reading **OVERDUE (37)**.

And Zarathustra spoke thus: *"What is this? Who made my tasks into debts? Who taught this little red circle to say 'thou shalt'?"*

Then he deleted it, and this app was born.

---

## Book One: Of the Three Metamorphoses (what it does)

**§1. The camel.** You dump everything you are carrying. One thing per line. You do not sort it. The camel does not sort. The camel kneels and says "load me."

**§2. The lion.** The app asks which of those things you actually want. You get to say *not mine*. The lion says "I will" to the great dragon called Thou Shalt, then releases the thing about learning Mandarin because your dad mentioned it once.

**§3. The child.** You say who you are *becoming*. Not a goal. A person. "Someone who writes every week." The child is innocence, a new beginning, a self-propelled wheel, and also kind of bad at estimating time, which is why we help with that.

**§4. The smallest first step.** Every task shows up as one tiny physical action. Not "do taxes." Instead: *"Put the tax paperwork on the table."* Willpower, as a tank that runs dry, is a fairy tale: two enormous replications found the effect at roughly zero. We start smaller.

**§5. Energy, not virtue.** You tell the app how much force you have right now: *plenty*, *some*, *not much*, or *fried*. When you are fried, only the light things show. The will to power is not about pushing harder. Sometimes it is about doing the dishes.

**§6. Time you can feel.** "45 minutes" means nothing to a time-blind brain. "About one laundry wash" means something. Every estimate gets a generous 1.5× buffer, because the planning fallacy is real and it is coming for you.

**§7. Implementation intentions.** *"When I finish my coffee, at my desk, I'll open the report."* Tie a task to something that already happens. When it happens, tap **it's now** and the task jumps to the front. This is the best-evidenced trick in the whole design (Gollwitzer & Sheeran, 2006; Sheeran, Listrom & Gollwitzer, 2024). Nietzsche would have called it "commanding oneself." The psychologists call it a reliable, moderate effect across 642 tests.

**§8. The eternal recurrence, as a triage question.** Opt-in, rare, and never more than three at a time: *"If you had to live this day again, innumerable times, exactly the same, would you keep this on the list?"* Say yes and it is affirmed. Say no and you can reshape it, make it rarer, or let it go. Some things are tolls of being alive, like taxes and school pickup. Those get asked *"could this weigh less?"* instead of *"should this exist?"* Even Zarathustra had to renew his passport.

**§9. Self-overcoming, measured honestly.** The growth metric is how fast you *start*, not how much you *finish*. When the data really shows it, the app says: *"It used to take you about 40 minutes to start writing. These last two weeks: about 6 minutes."* When the data does not show it, the app says nothing. No fabricated praise. The overman does not need a participation trophy.

**§10. No guilt.** Nothing here is overdue, late, behind, or failed. Things are open, started, resting, released, or done. Nietzsche traced the German word for guilt, *Schuld*, back to *Schulden*, debts. **Productivity is not a debt.** There is no red anywhere in this app. We checked.

---

## Book Two: Of the Afterworldly (how to run it)

Behold, mortal. Android is the primary target.

```bash
cd app
npm install
npx expo start      # scan the QR code with Expo Go on Android, or press a for an emulator
npm test            # the domain tests, which prove things rather than merely believe them
npm run typecheck   # TypeScript: the categorical imperative, but for types
```

Everything lives on your device (AsyncStorage). Nothing leaves the phone unless you turn on sync. You are a free spirit and so is your data.

**The laptop sibling.** There is a web version, in its own repo: [becomewhoyouare-web](https://github.com/unamusedmon/becomewhoyouare-web). The two keep in step through a WebDAV folder you own (Settings → Sync), with optional end-to-end encryption and an optional Org-mode file for Emacs. Each repo carries its own copy of the sync rules in `app/src/domain/`, so **the sync file format must stay compatible in both**. Details in [`app/README.md`](app/README.md).

> Heads up: `npx expo install` sometimes can't reach Expo's servers from cloud sandboxes. In that case, pin versions from `node_modules/expo/bundledNativeModules.json` and use plain `npm install`. Even the overman reads the lockfile.

---

## Book Three: Of the Higher Directory Structure

```
docs/design/            the philosophy, written before any code (as is proper)
  01-data-model.ts        the full type model
  02-first-step-flow.md   how a task becomes a tiny physical action
  03-recurrence-triage-flow.md   the eternal recurrence, operationalized
  04-copy-tone-guide.md   the voice: stern but loving, no exclamation marks
  05-additional-science.md   the ADHD evidence, graded honestly
app/                    Expo (SDK 57) + React Native + TypeScript
  src/domain/             pure logic and tests: reducer, planner, first steps,
                          recurrence, intentions, overcoming evidence
  src/app/                screens (Expo Router): Now, Onboarding, Becoming
  src/ui/                 cards, copy, theme (dark, gold, never red)
```

---

## Book Four: Of the Rules That Are Not Rules

1. **The philosophy never overrides the science.** If a sentence sounds profound but adds guilt, load, or "just use willpower," it gets cut.
2. **At most one aphorism per screen.** We are a to-do app, not a gift-shop calendar.
3. **No variable-ratio rewards.** Slot machines are for people who are trying to take your attention, not give it back.
4. **Be light.** *"What is good is light; whatever is divine moves on tender feet."* (*The Case of Wagner* §1)

---

## Epilogue

> *"One must still have chaos in oneself to be able to give birth to a dancing star."*
> (*Thus Spoke Zarathustra*, Prologue §5)

You have plenty of chaos. This app is for the dancing-star part.

Now close this README. Your first step is waiting, and it is very, very small.
