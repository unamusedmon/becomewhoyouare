# 06 — Science audit of what's shipped

*Audited 2026-10-08 against `main` at `a35f48e` (through PR #11, touch hints) plus the open quick-add draft (#12).*

05 graded the **design**. This doc audits the **app as built**: every feature and every line of copy that makes a factual or psychological claim, checked against the research. Where 05 was wrong or overstated, it has been corrected in place and noted here.

**Evidence grades** (same as 05): ●●● strong (meta-analyses, preregistered or multi-site replications) · ●●○ moderate (some RCTs or consistent lab/field findings, usually not ADHD-specific) · ●○○ weak (plausible theory, single studies, or clinical lore).

**Verdicts:** ✅ sound · ⚠️ sound idea, claim or implementation needs a fix · ❌ not supported as stated.

**Honesty note.** Citations were checked against abstracts, publisher records and reputable summaries. Where only a secondary source was available, it says so. Anything marked *unverified* should not be quoted publicly until someone reads the full paper.

---

## The short version

1. **The core mechanics are well chosen.** Implementation intentions, task breakdown, self-monitoring, no shame, few notifications: these are the right bets, and most apps get several of them wrong.
2. **The app's science is almost entirely general-population science.** Apart from working-memory and timing deficits, and one lab study in children (if-then plans), nothing it does has been tested *in ADHD*. That's normal for the field, but the copy shouldn't imply otherwise.
3. **The biggest real problem was a measurement bug, not a copy problem.** The start-latency clock kept running while the app was closed, so "It used to take you about 3 hours to start…" could have been produced by someone who closed the app and came back after lunch. For a feature whose promise is "Nothing here is made up", that's the one that mattered. Fixed in this PR.
4. **A few lines oversold the evidence** ("far more often", "real powers: … sideways ideas"). Softened in this PR.
5. **Five citations in the design docs were wrong or dated** (a children's meta-analysis cited for adults, the Zeigarnik effect, a stale effect size, "dopamine moment"). Corrected in this PR.

---

## Per-feature verdicts

| Feature (where) | Grade | Verdict | One-line reason |
|---|---|---|---|
| Implementation intentions (`intention.ts`, PlanEditor) | ●●● | ⚠️ | Mechanism is the best-evidenced thing in the app, but the effect is moderate, and copy said "far more often". Fixed. |
| Stall plans / if-obstacle (PlanEditor) | ●●○ | ✅ | MCII and if-then for obstacles are well supported; optional is right. |
| Smallest first step + shrink ladder (`firstStep.ts`) | ●●○ | ✅ | Core component of CBT for adult ADHD; "2 minutes" is clinical heuristic, not a tested number. |
| "That counts. Stop here." (NowCard) | ●●○ | ✅ | Ovsiankina (resumption) holds up; the Zeigarnik reason given in 02 did not. Doc fixed. |
| Start latency + overcoming evidence (`overcoming.ts`) | ●●● idea / implementation flawed | ⚠️ | Self-monitoring works (d ≈ 0.40), but the clock counted time with the app closed. Fixed. Small samples remain a risk. |
| Slip handling, no red, no streaks (reducer, copy) | ●●○ | ✅ | Self-forgiveness and self-compassion predict less procrastination. Correlational, but consistent and cheap to honor. 05 overgraded it as ●●●; corrected. |
| Slip copy "built wrong, not you" | ●●○ | ⚠️ | Task aversiveness is a top predictor of procrastination, but so is impulsiveness. "Usually" → "often". Fixed. |
| Energy check-in and energy-fit ranking (`planner.ts`) | ●○○–●●○ | ⚠️ | Matching task to state is plausible; no direct trial. Watch the framing (see ego depletion below). |
| Hiding heavy tasks on low days | ●○○ | ⚠️ | Could quietly reinforce avoidance of aversive tasks. Recommend a ceiling on how long a task can stay hidden. |
| Lived-time units, 1.5× buffer (`duration.ts`) | ●●○ buffer / ●○○ units | ⚠️ | Planning fallacy is robust. The calibration 05 promises doesn't exist yet: it's a fixed 1.5×. |
| Capture / voice brain dump / quick add (#9, #12) | ●●○ | ✅ | Externalizing is sound; the "relief" claim is weaker than people think (see below). App copy doesn't overclaim. |
| Onboarding: camel → lion → child | ●●○ | ⚠️ | Autonomy/self-concordance is solid science; "*Most* of that was handed to you" asserts something we can't know. |
| Onboarding: "Your brain works differently" | ●○○ | ❌ → fixed | "Real powers: hyperfocus, speed under pressure, sideways ideas" overstated the research. Softened to what people report. |
| Becomings / identity link (`becoming.tsx`) | ●●○ | ✅ | Identity-based motivation is reasonable. Avoid the "noun label" trick, which failed replication. |
| Eternal recurrence question (`recurrence.ts`) | ●○○ (philosophy) / ●●○ (nearest science) | ⚠️ | No study of this question. Its closest scientific cousins (values clarification, self-concordance) are decent. Timing introduces a known mood bias. |
| Tolls vs choices | ●○○ | ✅ | Design judgment, not science, and humane. |
| Nudges (`nudges.ts`) | ●●○ | ✅ | Off by default, capped, rotated, user-planned first: matches the evidence on habituation and interruption costs. |
| Touch hints (`hints.ts`, #11) | ●○○ | ✅ | No psych claim; one-at-a-time, spaced, never repeated is consistent with cognitive-load thinking. |
| Undo / bring back | ●○○ | ✅ | No claim beyond "mistaps happen". Reasonable. |
| Completion flash + rotating lines | ●●○ | ✅ | Immediate feedback suits steep delay discounting. Rotating wording is not a variable-ratio reward: the reward itself is fixed. |
| Aphorisms | n/a | ✅ | Meaning, not mechanics, and labeled as such. |

---

## Feature by feature

### 1. Implementation intentions ●●● ⚠️

**What the app does.** "When I finish my coffee, at my desk, I'll [first step]." Event, after-task, or clock triggers. The planned task jumps to the front when its cue fires.

**Evidence.** The 2006 meta-analysis (Gollwitzer & Sheeran; 94 tests) gave d ≈ 0.65 and is what the app and README quoted. The much larger update, **Sheeran, Listrom & Gollwitzer (2024, *European Review of Social Psychology*, 642 tests)**, reports effects from **d ≈ .27 to .66** depending on outcome, and larger effects when plans are truly if-then in form, when people are motivated, and when the plan is rehearsed. A blog summary claims a pooled d = .36 with notable publication bias; *unverified*, and not used here. In clinical/analogue samples, Toli, Webb & Hardy (2015) found d ≈ 0.99, but ADHD was not analyzed separately.

**ADHD specifically.** Gawrilow & Gollwitzer (2008) found if-then plans brought children with ADHD up to typical performance on a Go/No-Go inhibition task, and that plans plus stimulants worked best. That's a lab task in children. **I found no trial of implementation intentions in adults with ADHD.**

**What's right.** If-then format; event cues preferred; plan shown on the card (light rehearsal); optional obstacle plan.

**Changes made.** Hint and plan-editor copy: "far more often" → "more often". README and code comment now cite the 2024 range instead of d ≈ 0.65 alone.

**Recommended.** Let the person read the plan back once when they set it ("Say it to yourself once"). Rehearsal is one of the moderators the 2024 paper found.

### 2. Smallest first step, shrink ladder, reshape ●●○ ✅

**Evidence.** Task breakdown is a core module of the CBT packages for adult ADHD that have RCT support (Safren et al., 2010; Solanto et al., 2010). Those trials test whole packages, so the *component* isn't isolated, and the 2-minute ceiling and "physical verb" rules are clinical heuristics. Procrastination meta-analysis (Steel, 2007, *Psychological Bulletin*, 691 correlations) names **task aversiveness** and **impulsiveness** among the strongest predictors, which supports making the first contact with a task small and concrete.

**"That counts. Stop here."** 02 justified this with the Zeigarnik effect. A 2025 meta-analysis (Ghibellini & Meier, *Humanities & Social Sciences Communications*) found **no memory advantage for unfinished tasks (Zeigarnik), but a general tendency to resume them (Ovsiankina)**. The design survives; the reason changed. 02 corrected.

**Reshape after shrinking fails** ("size isn't the problem") fits the aversiveness finding well.

**Recommended.** This is still the app's core bet with no direct test. The A/B in 05 ("start latency with vs. without the generated first step") remains the most important experiment to run.

### 3. Start latency and overcoming evidence ●●● (idea) ⚠️ (implementation)

**Evidence for showing it.** Harkin et al. (2016, *Psychological Bulletin*, 138 studies, N ≈ 20,000): interventions that increase progress monitoring improve goal attainment, **d ≈ 0.40**, more so when progress is physically recorded. Showing capability ("you start faster") rather than debt is a good reading of that.

**The bug (fixed).** Latency ran from when the card first appeared to when "I did it" was tapped, **including any time the app spent in the background**. Close the app at 9am, come back at 2pm, tap "I did it": latency ≈ 5 hours. Because the evidence card compares medians across windows, a change in *how often someone leaves the app open* could produce a "you start faster now" claim with no change in behavior. Now, if the app goes to the background while the clock runs, that start is logged without a latency (`backgrounded` action in `reducer.ts`). A fresh appearance of the card starts a fresh clock.

**Remaining risks (recommended, not changed).**
- **Small samples.** `MIN_SAMPLES = 5` per window with a 25% median drop is easy to hit by chance, especially per category. Regression to the mean will also make a bad stretch look like improvement afterwards. Consider 8–10 per window, or requiring the drop to persist across two consecutive checks before it's shown.
- **Selection.** Only started tasks have a latency. If the hard ones get let go, the median falls without anyone getting faster. Consider counting tasks released after being shown as "not started" in the comparison, or showing the evidence only when the release rate hasn't risen.
- **Fewer measured starts now.** Voiding interrupted latencies is honest, but it means fewer data points for people who lock their phone while doing the step. If evidence never appears for many users, that's the reason.

### 4. Slips, guilt-free failure, "let it go" ●●○ ✅

**Evidence.** Wohl, Pychyl & Bennett (2010): students who forgave themselves for procrastinating before one midterm procrastinated less before the next. One correlational study, **n ≈ 119** (press reports say 134; *unverified* which is right). Sirois (2014, *Self and Identity*): across four samples (~770 people), procrastination correlates moderately and negatively with self-compassion. Both point the same way; neither is an RCT. 05 graded "guilt-free failure handling" ●●●, which was too high. Corrected to ●●○.

**Copy.** "That usually means it's built wrong, not that you are." Aversiveness is a major predictor, but impulsiveness is too, so "usually" claimed more than the evidence gives. Changed to "often".

**Released copy** ("Released. Looking away is allowed.") makes no empirical claim. Fine.

### 5. Energy check-in, energy fit, held-back tasks ●○○–●●○ ⚠️

**What's supported.** Fatigue and arousal vary across the day, and ADHD is associated with an evening chronotype (Coogan & McGowan, 2017, cited in 05). Asking rather than guessing is good.

**What isn't.** There's no trial showing that matching task difficulty to self-rated energy improves outcomes. And the "limited willpower battery" model it could be read as endorsing is the ego-depletion model, which **failed two large replications** (Hagger et al., 2016; **Vohs et al., 2021: 36 labs, 3,531 people, d = 0.06**). The current copy is fine ("Low force means only the light ones" describes the app, not the brain). Keep it that way: never say force "runs out" or "gets used up".

**Recommended.** Hiding heavier tasks on low days is kind in the moment but can reinforce avoidance of exactly the aversive tasks the app exists for (the logic of CBT's graded exposure). Suggest: if a task has been held back on every check-in for, say, a week, surface it once with its *smallest* shrink step instead of its normal step.

### 6. Lived-time units and the 1.5× buffer ●●○ / ●○○ ⚠️

**Buffer.** The planning fallacy is robust (Buehler, Griffin & Ross, 1994). A fixed 1.5× is a defensible starting default; I couldn't verify a specific multiplier from the literature, so treat 1.5 as a guess.

**Gap.** 05 §6 says calibration *learns* per energy tier from actual vs. planned. In the code, `estimateCalibration` is set once to 1.5 and never updated. Either build the learning loop (needs a completion duration to be recorded) or change 05 to say it's planned.

**Units** ("about two sitcom episodes"): untested design inference, correctly graded ●○○ in 05. No copy overclaims it.

### 7. Capture, voice brain dump, quick add ●●○ ✅

**Supported.** Working-memory deficits in ADHD are moderate and consistent, in children (Kasper, Alderson & Hudec, 2012) and adults (Alderson et al., 2013, *Neuropsychology*; d ≈ 0.5 reported by a secondary source). Getting tasks out of the head and into the app is a sensible compensation.

**Correction.** 05 cited Kasper et al. (2012) for *adult* deficits. That meta-analysis is of **children**. The adult one is Alderson et al. (2013). Corrected, and downgraded to ●●○ because the *compensation* (an app list helps) is Barkley's clinical principle, not a tested intervention.

**Caveat for future copy.** The popular claim that writing things down relieves the mental itch comes mostly from Masicampo & Baumeister (2011), where the relief came from making a *specific plan*, not from listing. I found no independent replication. So "Get it out of your head" (quick add, #12) is fine as an invitation; don't add copy promising calm or freed-up focus.

### 8. Onboarding ●●○ ⚠️

**Camel/lion (keep, not mine, not now).** The scientific backbone here is self-determination theory and **self-concordance** (Sheldon & Elliot, 1999): goals that feel chosen get more sustained effort than goals that feel imposed. That's a good fit and could be cited in 03.

**"Most of that was handed to you."** We can't know that, and for some people it will be false. It's a Nietzschean provocation, which is the point, but it's a factual claim about the user. Recommend "Some of that was handed to you." Left for Zach to decide, since it's voice.

**"Your brain works differently" (amor fati screen).** It said ADHD comes with "real powers: hyperfocus, speed under pressure, novelty-hunting, sideways ideas." The research:
- **Creativity:** Hoogman et al. (2020, *Neuroscience & Biobehavioral Reviews*, 31 studies) found better divergent thinking in people with *high ADHD traits* but **not in people with a clinical diagnosis**, and no convergent-thinking advantage.
- **Hyperfocus:** real as a self-report and reported more by adults with ADHD, but poorly defined and barely studied (Ashinoff & Abu-Akel, 2021).
- **Speed under pressure:** urgency does motivate (05 already notes this), but I found no evidence of a performance *advantage*.

Changed to: "It has real costs. Many people with a brain like this also report upsides: deep absorption when something grabs them, a gear that kicks in under a deadline, a hunger for the new." Same warmth, claims people can check against their own lives.

### 9. Becomings and identity ●●○ ✅

**Evidence.** Identity-based motivation (Oyserman, 2009): tasks that feel identity-congruent get more persistence. Reasonable support, mostly from education research.

**Caution.** Don't lean on the "noun not verb" trick ("be a writer" vs "write"). The famous voting study (Bryan et al., 2011) **failed to replicate** in larger field experiments (Gerber et al., 2016; Gerber, Huber & Fang, 2023). The current "someone who writes every week" phrasing doesn't depend on it, which is good.

### 10. Eternal recurrence question ●○○ (as philosophy) ⚠️

**Evidence.** There is no study of this question. The honest grade is that it's philosophy doing the work. Its nearest scientific relatives are values clarification (as in ACT) and self-concordance, both reasonably supported, and the follow-ups (reshape, rarer, toll, let go) are sensible.

**Timing bias.** The default moment is right after the day's first completion, "riding a win." Mood-as-information (Schwarz & Clore, 1983) predicts that a good mood tilts life judgments positive, so a "yes" here is slightly inflated. The app already guards the other direction (`mightBeTheMood` for a "no" on a low day). That's asymmetric: it protects routines from bad-mood "no"s but not from good-mood "yes"es. Recommendation: either accept the bias openly (03 now says so), or occasionally ask at a neutral moment.

**"Spaced like flashcards."** The spacing effect is about memory, not about how often to ask a values question. Fine as an analogy in a comment; don't cite it as evidence.

**Risk to watch.** For someone in a depressive episode, "would you live this day again, innumerable times?" could invite rumination. The fried-day block and the frequency-down option help. Worth measuring whether people who answer "no" a lot then use the app less.

### 11. Nudges ●●○ ✅

**Evidence.** Smartphone notifications measurably increase inattention and hyperactivity symptoms even in people without ADHD (Kushlev, Proulx & Dunn, 2016, CHI; within-person experiment, N = 221). Repeated prompts lose effect: in HeartSteps (Klasnja et al., 2019), activity suggestions raised steps by 66% at first, and the effect shrank over six weeks.

**What's right.** Off by default; the person's own plans come first; at most one app-chosen nudge a day; wording rotates; nothing extra on fried days. That's the evidence applied well.

**Minor.** The cap of six a day is higher than anything the app would normally send. Fine as a ceiling; don't raise it.

### 12. Feedback and rewards ●●○ ✅

Immediate, vivid completion feedback suits steeper delay discounting in ADHD (Jackson & MacKillop, 2016). The completion line rotates by timestamp, so the *wording* varies, but the reward itself is the same every time. That is not a variable-ratio schedule. Keep it that way.

---

## Ranked fix list

**Applied in this PR**

1. **Start latency no longer counts time with the app closed** (`reducer.ts`, `AppStateContext.tsx`, two new tests). Highest impact: it protects the honesty promise of the evidence feature.
2. **Onboarding "real powers" softened** to upsides people report (`copy.ts`).
3. **"Far more often" → "more often"** in the plan hint and plan editor (`copy.ts`).
4. **Slip copy "usually" → "often"** (`copy.ts`).
5. **Design-doc corrections:** adult WM citation (05), guilt-free grade ●●● → ●●○ (05), implementation-intention effect sizes updated (05, README, `intention.ts`), Zeigarnik → Ovsiankina (02), "dopamine moment" → mood with its bias stated (03), Vohs 2021 added to the ego-depletion line (04), temptation bundling's fade noted (05).

**Recommended, not applied (bigger or a judgment call)**

1. **Run the first-step A/B** (05's test #1). The app's central bet is still untested.
2. **Harden the evidence thresholds:** more samples per window, a persistence check, and account for tasks released unstarted.
3. **Cap how long a heavy task can stay hidden** on low-energy days; resurface it once at its smallest step.
4. **Build the calibration loop** or update 05 §6 to say it isn't there yet.
5. **Add a plan read-back** in the plan editor (rehearsal moderates implementation-intention effects).
6. **"Most of that was handed to you" → "Some of that…"** if Zach agrees the claim matters more than the provocation.
7. **Recurrence timing:** occasionally ask at a neutral moment, or add a good-mood counterpart to `mightBeTheMood`.
8. **Measure, don't market:** nothing here should be described to users as "proven for ADHD". Almost all of it is proven for people in general, and that's a perfectly good thing to say.

## Could not verify

- Pooled d = .36 and publication-bias size for the 2024 implementation-intentions meta-analysis (blog claim only).
- Exact sample in Wohl et al. (2010): 119 vs. 134.
- Alderson et al. (2013) effect sizes (secondary source only).
- A specific planning-fallacy multiplier to justify 1.5×.
- Any trial of implementation intentions, task breakdown as an isolated component, energy matching, or body doubling in **adults with ADHD**.

## Sources checked

- Sheeran, Listrom & Gollwitzer (2024). The when and how of planning. *Eur. Rev. Soc. Psychol.* 36(1). doi:10.1080/10463283.2024.2334563
- Gawrilow & Gollwitzer (2008). *Cognitive Therapy and Research* 32, 261–280. doi:10.1007/s10608-007-9150-1
- Toli, Webb & Hardy (2015). Implementation intentions in mental health: meta-analysis.
- Ghibellini & Meier (2025). Interruption, recall and resumption: meta-analysis of the Zeigarnik and Ovsiankina effects. doi:10.1057/s41599-025-05000-w
- Steel (2007). The nature of procrastination. *Psychological Bulletin* 133(1), 65–94.
- Harkin et al. (2016). Does monitoring goal progress promote goal attainment? *Psychological Bulletin*. doi:10.1037/bul0000025
- Wohl, Pychyl & Bennett (2010). *Personality and Individual Differences* 48(7).
- Sirois (2014). Procrastination and stress: the role of self-compassion. *Self and Identity* 13(2), 128–145.
- Vohs et al. (2021). A multisite preregistered paradigmatic test of the ego-depletion effect. *Psychological Science* 32(10). doi:10.1177/0956797621989733
- Carruth, Ramos & Miyake (2023). Failed replication of Job, Dweck & Walton (2010). *PLoS ONE*.
- Kasper, Alderson & Hudec (2012). *Clinical Psychology Review* 32(7). Alderson et al. (2013). *Neuropsychology* 27(3), 287–302.
- Masicampo & Baumeister (2011). Consider it done! *JPSP* 101(4).
- Hoogman, Stolte, Baas & Kroesbergen (2020). Creativity and ADHD. *Neurosci. Biobehav. Rev.* 119, 66–85.
- Ashinoff & Abu-Akel (2021). Hyperfocus: the forgotten frontier of attention. *Psychological Research*.
- Gerber et al. (2016), *PNAS*; Gerber, Huber & Fang (2023), *Behavioural Public Policy* (noun-label replications).
- Sheldon & Elliot (1999), self-concordance (secondary sources). Schwarz & Clore (1983), *JPSP* 45, 513–523.
- Kushlev, Proulx & Dunn (2016). "Silence your phones." CHI '16, 1011–1020.
- Klasnja et al. (2019). HeartSteps micro-randomized trial. *Annals of Behavioral Medicine* 53(6).
- Milkman, Minson & Volpp (2014). Holding the Hunger Games hostage at the gym.
