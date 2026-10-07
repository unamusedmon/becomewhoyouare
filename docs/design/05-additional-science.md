# 05 — Science Audit: what you had, and what I added

Your list was already strong. This doc does three things: it **grades** what you named, **adds** mechanisms the research supports that weren't on the list, and **flags** a couple of popular ideas where the evidence is thinner than their reputation.

Evidence grades: **●●● strong** (meta-analyses or multiple RCTs) · **●●○ moderate** (some RCTs or consistent lab findings, less ADHD-specific) · **●○○ weak** (plausible, mostly anecdotal or theory). Citations are short pointers, not a literature review. Verify the specifics before you quote any of them publicly.

## Grading the original list

| Mechanism | Grade | Note |
|---|---|---|
| Implementation intentions | ●●● | Gollwitzer & Sheeran (2006) meta-analysis, d ≈ 0.65 for goal attainment. ADHD-specific lab evidence too: Gawrilow & Gollwitzer (2008) found if-then plans improved response inhibition in children with ADHD. |
| Smallest first step / task breakdown | ●●○ | A core skill in CBT for adult ADHD (Safren et al., 2010 RCT; Solanto et al., 2010 meta-cognitive therapy RCT). The specific "2-minute physical step" is clinical practice more than an isolated, tested variable. |
| Time-blindness accommodations | ●●○ | Timing and time-perception deficits in ADHD are well replicated (Noreika et al., 2013 review; Barkley's model). Experiential units are a design inference, not a tested intervention. Good inference, but worth A/B testing. |
| Generous buffers | ●●● | The planning fallacy is robust in everyone (Buehler, Griffin & Ross, 1994). ADHD adds time-perception error on top. |
| Externalizing working memory | ●●● | Working-memory deficits in adult ADHD are large (Kasper, Alderson & Hudec, 2012 meta-analysis). Barkley's principle: externalize information *at the point of performance*. |
| Energy-based planning | ●●○ | Circadian and arousal variation is real, and ADHD is strongly associated with delayed sleep phase and evening chronotype (Coogan & McGowan, 2017 review). Matching task cost to state is sound. |
| Interest / novelty / urgency / challenge | ●●○ | The four-word framing is Dodson's clinical heuristic, not a formal model. But it lines up with replicated findings on altered reward processing and delay aversion in ADHD (Volkow et al., 2009/2011; Sonuga-Barke, 2002). |
| Dopamine-aware immediate feedback | ●●○ | Steeper delay discounting in ADHD is well supported (Jackson & MacKillop, 2016 meta-analysis), so immediate feedback is the right call. |
| Body doubling | ●○○ | Hugely popular, but there is very little direct research. Related evidence: social facilitation (Zajonc, 1965) and accountability effects. Build it, keep it optional, measure it, and don't market it as proven. |
| Guilt-free failure handling | ●●● | See *self-forgiveness* below. This is one of the best-supported items on your list, and it's the one most apps get wrong. |
| "Intrinsic motivation is the only fuel" | ●○○ as stated | Rational quibble: urgency, which is extrinsic, *also* reliably works for ADHD. It's literally on your own list. The better claim is that **interest and meaning are the most sustainable fuel; urgency works but burns hot.** The design already reflects this, since it uses deadlines as one signal among several. |

## What I added

Each one says where it lives in the model (`01-data-model.ts`).

### 1. Self-forgiveness after a lapse reduces the next lapse ●●○
Students who forgave themselves for procrastinating on one exam procrastinated less on the next (Wohl, Pychyl & Bennett, 2010). Self-compassion is associated with less procrastination (Sirois, 2014 meta-analysis). This turns "guilt-free" from a nice value into a **mechanism**: shame predicts more avoidance.
→ Slip copy (04), `SlipInsight`, no red states, no streak loss.

### 2. Procrastination is mood repair, not time mismanagement ●●○
Procrastination is largely short-term avoidance of a negative feeling attached to the task (Sirois & Pychyl, 2013). Emotional dysregulation is now considered a core feature of ADHD for many people, not a side effect (Shaw et al., 2014).
→ `SlipInsight.hypothesis = 'aversive_feeling'`. Emotionally loaded tasks get a body-first step and body-doubling offer (02). The reflection prompt asks what is heavy about the task, not why the user is avoiding it.

### 3. Distractibility delay (the parking lot) ●●○
A specific module in Safren's CBT protocol: when a distracting thought comes up mid-task, write it down in one tap and get back to the task, instead of acting on it or trying to hold it in mind.
→ `Capture.source = 'focus_parking_lot'`, `FocusSession.parkedCaptureIds`. Shown at the end of the focus session: "You parked 3 things. Want to look?"

### 4. Mental contrasting + if-then (WOOP / MCII) ●●○
Pairing the desired future with the main *obstacle*, then an if-then plan for that obstacle, beats positive fantasy alone. Positive fantasy alone can actually reduce effort (Oettingen; meta-analysis Wang, Wang & Gai, 2021). This fits the Becoming statement perfectly, and adds a corrective to pure "visualize your best self".
→ `Becoming.obstacle` + `Becoming.ifThenPlan`; `ImplementationIntention.ifObstacle`.

### 5. Identity-based motivation ●●○
When a task feels congruent with an identity a person holds, they persist more. When it feels incongruent, difficulty gets read as "not for me" (Oyserman, 2009). That's the scientific case for "Become who you are" as a working feature, not decoration.
→ `Task.becomingIds`, the "Who does this make you?" card (03).

### 6. Personal estimate calibration ●●○
People underestimate their own task durations even when they remember past overruns (Buehler et al., 1994). The fix that works is outside-view, reference-class data: what did *similar tasks actually take you*?
→ `UserProfile.estimateCalibration` learns a multiplier per energy tier from actual vs. planned. It's also a self-overcoming metric (`estimate_accuracy_gain`).

### 7. Acute exercise as a focus primer ●●○
Short bouts of moderate exercise produce small-to-moderate acute improvements in executive function in ADHD (e.g., Cerrillo-Urbina et al., 2015 meta-analysis). Nietzsche, conveniently, agreed: "Sit as little as possible…"
→ Optional "movement primer" offer before a deep-focus block (5 min walk, one song of dancing). `EnergyCheckin.factors: 'moved_body'` lets the planner learn whether it helps *this* user.

### 8. Temptation bundling ●●○
Pairing a "should" task with a "want" pleasure that you only allow during that task increased gym attendance (Milkman, Minson & Volpp, 2014). This brings the reward closer in time, which directly addresses steep delay discounting.
→ `Task.hooks.pairedReward` ("the good playlist only plays during taxes").

### 9. Endowed progress & goal gradient ●●○
People speed up as they approach a goal (Kivetz, Urminsky & Zheng, 2006). A progress bar that starts with some credit already filled boosts completion (Nunes & Drèze, 2006).
→ Multi-step tasks start their progress bar with the first step pre-credited the moment it's done. Progress art never shrinks.

### 10. Fresh-start effect ●●○
Temporal landmarks (Mondays, the first of the month, birthdays) increase goal-directed behavior (Dai, Milkman & Riis, 2014).
→ Recurrence question and "look at the bigger picture" prompts are biased toward landmark days. Theme rotation lands on them too.

### 11. Self-monitoring of progress ●●●
Monitoring goal progress reliably improves attainment, more so when it's recorded and physically visible (Harkin et al., 2016 meta-analysis).
→ `OvercomingEvidence` and the visible progress art. Monitoring of *capability*, not of debt.

### 12. Notification habituation & just-in-time design ●●○
Repeated identical prompts lose effect fast. Adaptive "just-in-time" interventions that fire when the person is receptive work better (Nahum-Shani et al., 2018, JITAI framework).
→ `NudgeSettings.maxPerDay`, wording rotation (04), no nudges during focus or "fried" states, event-triggered intentions preferred over clock times.

### 13. Transitions and hyperfocus ●●○
Shifting sets is an executive cost. Hyperfocus is real and self-reported widely in ADHD (Hupfeld, Abagis & Shah, 2019), and it's a power as much as a risk. Abrupt interruption is aversive; advance warnings help.
→ `NudgeSettings.transitionWarnings` (10 / 3 min before a hard switch, in songs), `FocusSession.overrunNoticeShownAt` offers a body check, never forces a stop.

### 14. Medication-aware planning (optional, private) ●●○
Stimulant effects follow a fairly predictable onset/peak/wear-off curve. People who take them often already plan around that.
→ `UserSettings.medicationWindow`. Off by default, stored on device only, never mentioned in copy unless the user turned it on.

## One correction to my own instinct: no variable rewards

Variable-ratio rewards (random loot, surprise multipliers) drive behavior very effectively. That's exactly why slot machines use them, and why you asked to avoid them. Keep rewards **fixed and predictable**; get novelty from **themes and art changing on a schedule**, not from randomized payouts. That gives novelty without the compulsion loop.

## What to test first (when there's a build)

1. **Start latency** with vs. without the generated first step. This is the core bet of the app.
2. Experiential time units vs. clock units, on estimate accuracy and on the user's own rating of how calm the day felt.
3. Body doubling (ambient) vs. solo, on start latency for tasks flagged aversive.
4. Recurrence question: does the affirmed share of the list rise, and does slip rate fall for affirmed routines?
