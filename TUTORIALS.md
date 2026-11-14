# Tutorials: one shape for every puzzle

The user, 14 Nov: "whatever structure we come up with ... should be a standard generic thing. Like ... jump to this,
let me show you this trick. Let me show you this phase. Like, those are general concepts that we'll cover across all
puzzles." And: "somebody might not care about showing me basics ... They may be struggling with the end game and
wanting help with that part." RULES.md has the rules ("Every tutorial has a read version, kept in sync", "Every
tutorial has the same shape, and you can jump in anywhere"); this is how they're built.

## 1. The description each puzzle fills in

One `Tutorial` (src/tutorial.ts) for each puzzle, in a file of the puzzle's own (`src/distill-tutorial.ts`):

- **The basics:** its rules of thumb and its basic moves, never the game's rules: the tutorials are for players who
  know the mechanics (the user, 14 Nov: "I thought we agreed we're not sharing the rules and mechanics here"; the
  game's own tutorial teaches them).
- **The phases:** a game's stretches in order, each wanting different moves.
- **The tricks:** each a move or a habit, met in a phase (`phase`), or any time (none).
- **The scenarios:** a board in a particular kind of trouble, or a particular build, and what to do there; each in a
  phase too.

Every part has an `id`, a `title` (the guide's heading), a `line` (what it is, one line, plain words) and `shows`:
what shows it, a board to look at (`board`) or moves played on a board (`moves`), as a key only the puzzle reads (one
of its boards, a routine, a position a bot reached). Optional: `anchor` (its place on the read guide, if not its id),
`tag` (the first target that needs it), `todo` (written ahead, not ready: left out everywhere till it's done).

And the teacher's **opening choice**: a few `choices`, each a `label` (the button, in the player's words), `asks` (the
teacher's question, in their voice), `then` (their line once it's picked) and `covers` (a section, a phase's id,
which brings in the phase and every trick and scenario met in it, or any part's id). The teacher's lines come from
their file in `src/lines/`, like every other line.

`problems()` says what's wrong with a description: ids unique, every part named, in one line and shown, phases that
exist, choices covering what's there, and **every ready part reachable from some choice**, so nothing's in the lesson
you can't get to.

## 2. What every tutorial gets from it

- **The read guide's sticky nav** (`navFor`, drawn by `js/tutorial-nav.js`): a bar along the top, a button for each
  section; each opens its links, the tricks and scenarios in runs under their phases (those met any time first), the
  first target that needs one as a tag. The part you're reading is lit as you scroll (`spy`); jumps land below the
  bar. The page's own links (the lesson, how it's designed) at the bar's end.
- **The animated lesson's opening choice** (`TutorialMenu`, drawn by `js/tutorial-choice.js`, a panel any teacher can
  show, over a scene or a page): their question in their voice, an answer a button. Not a chatbot. Pick one, and they
  say their line over that part's list: its phases, its scenarios, its single tricks, in tabs when there's more than
  one (scenarios before tricks: "here are the scenario[s] ... Are you wanting the individual tricks?"). Pick one, and
  the teacher's lesson plays it on a real board, from its `shows`. Keys: arrows (or W A S D) to move, Enter or Space
  to pick, a digit for its row, Esc back a level, then shut; every other key goes through to the game. Touch: tap.
  A link can open it on a choice's list (`open`) or straight on a part (`play`), so the read guide's "show me this"
  can land in the lesson at that part.
- One look at both on their own: the unlinked `tutorial-test.html` (Distilling's description, stand-in sections).

## 3. Distilling (Helium)

The description is `src/distill-tutorial.ts` (14 Nov), drawn from what's there, so it can't drift
(tests/tutorial.test.ts). Wired the same day: distilling-guide.html's sticky nav is drawn from it, Helium's lesson
opens with its choice, and every part it links to on the guide has a "Show me this" into the lesson on that part.

- **Basics:** the guide's rules (the pieces, the swap rule, the furnace, Crystal Clears and chains), setting a
  target, and "At Helium's still: a goal, and a plan for it".
- **Phases:** src/distill-phase.ts's four (the fire's side, filling the junk columns, blocks and the V, the chain),
  and **the end game** (past CC^10 each new column a bet; the carry-on at CC^12; when to stop: DISTILLING.md, "The
  endgame's gamble"), `todo` for the late-game work.
- **Tricks:** the drag tricks, met any time (the climb, the sink, the lift, the drop, the weave, the ladder, making
  way: Helium's TEACH); then the guide's PLAN under each phase, its techniques (tagged with the first target that
  plays them) and the user's tricks.
- **Scenarios:** Helium's step one on their lesson board; the positions the guide reads (a white trapped by the fire,
  the ladder about to be lost, a cracked board, damage control, damage control and the hoist), each checked to be
  the state and tactic the planner reads there; and the end game's gamble, `todo`.
- **What shows each:** the guide's own picture of it (`distillShows`), so the lesson plays the board the read version
  draws.
- **The choice**, in Helium's voice (src/lines/helium.ts, `TUTOR`): "Right. What are you after? The basics? Help with the early or mid
  game? Trying to get your CC higher?", and "The end game?" once it's ready. The basics (with the drag tricks); the
  early or mid game (the first three phases); a higher Crystal Clear (setting a target, storing, the leapfrog, the
  chain); the end game.

### How it's wired (14 Nov)

- **The read guide:** `tutorialNav(DISTILL_TUTORIAL, ...)` in js/distill-guide-view.js, in place of the old table of
  contents; the rules' four articles have their ids (`b-pieces` ...), each trick tile its own (`d-climb` ...); a
  "Show me this" on each part's place, `den.html?at=helium&learn=<id>`.
- **The lesson:** after Helium's opening, the choice (`tutorialChoice`, loaded when it's first asked); at the still,
  "Teach me" (T) puts it again. What's picked is played by src/den-helium-tutor.ts's `tutorBeats`: the part's own
  board laid (`distillShows`), Helium's line (`TUTOR.show`), the pieces it's about ringed, its drags played at
  PACE_LESSON (or its column burned), then a fresh board yours. Step one is the scenario `stepOne`, played as their
  lesson always was (`lessonPlan`). A link's `learn=` plays that part straight away instead of the opening.

### What's left (after the late-game work merges)

1. **src/distill-tutorial.ts:** the end game's phase, its tricks and the gamble's board from the late-game work (drop
   their `todo`s); any trick or technique it added (the test fails until each is in); check the scenario phases
   (P7 and P27 put in the fire's side).
2. **STEPS grows a step a phase** (src/den-helium.ts): each phase's own beats in Helium's words, as step one has, in
   place of the plain "{title}. Here, on a real board." the other parts get now.

## 4. Sailing (Tzz), next, in the same shape

Tzz's balloon lesson (src/balloons.ts, src/den-tzz.ts) fits as it is; its read version isn't written yet.

- **Basics:** pairs falling and steered; platforms and their targets; lines of four pop, before platforms; a chain's
  name by its steps (Double, Triple, Bingo!, Donkey!, Vegas!!: `chainName`); every pop a gust at sea.
- **Phases:** laying the bottom platform one short; building storeys on it; parking the trigger; setting it off.
- **Tricks:** a line's pop drops its partner into the gap; never a wrong colour in a target; keep the columns above
  an unfinished target open; a stack of three waiting for its fourth; a pair parked on a corner to fall later.
- **Scenarios:** her Double, her Bingo (ROUTINES, each shown as moves: the twists' routes), and a Vegas (to build:
  "Two more and it's a Vegas").
- **What shows each:** a routine and how far into it (`setup(routine, n)`), its moves the twists' routes
  (`perform`), the plan faint from the start (`marks`).
- **The choice**, in her voice, breezy: something like "The basics? A Double? Building up to a Bingo? Or the big
  one, a Vegas?", her lines in src/lines/tzz.ts.
- **Its read version**, `sailing-guide.html`, drawn from the same routines, with the same nav.

## 5. A variant of a puzzle: the wolf den's Duty Navigation (Dignity), its basics first

The user, 14 Nov: "for the werewolf [Duty Nav] thing, I think that should be obviously slightly differently
structured in that it is something where you have to explain some of the basic mechanics because it is different.
Like, how does it work? What are the differences to main [Duty Nav]? That should be part of the tutorial. Like,
we'll probably do something more broadly at some point for the werewolves and how those work."

So a variant's tutorial keeps the same shape but its **basics aren't left to the game's own tutorial**: they're
taught, as what's different from the plain puzzle (here: the fourth, outer ring; wild slots and how a chain makes
them; the moon and turning werewolves back; why every constellation should end a chain), with plain Duty
Navigation's rules taken as known. Probably a `differs` part (or the basics marked as a variant's) in
`src/tutorial.ts`, and a choice for it ("What's different here?"). The werewolves themselves (the expedition, the
den's rounds, Rumble, the moon) get a wider explainer of their own later, not this lesson. The detail researched so
far: IDEAS.md, "Dignity's tutorial: four-tier Duty Navigation in the werewolf den".

Its opening choice and what it shows (the user, 14 Nov): "certainly start all their tips of ... you can just go
regular [Duty Nav] style and get through it quickly, or you can do it using combos." So the choice offers both: the
plain way, quick, and the combo way. The combo way is examples of setting combos up, the first from the screenshots
the user shared of Umami's run (IDEAS.md, "What players say, and a looting run watched"), where he built it up at the
bottom: "look, there's ... reds laid out here intentionally so that when this breaks, this falls down." Shown as Tzz's
Sailing lesson shows its chain: the build and its plan marked on the board as it's played.

### Built, a first version (14 Nov)

`src/wolf-den-tutorial.ts`, in the one shape: its basics are what's different (four rings, the den's constellations,
why chains pay, wild places, the moon), a phase (between the rumbles; the rumbles themselves `todo`), the tricks (the
Trapdoor, the Echo, a combo beside the wrong star, don't reset the board) and the scenario (the run in the
screenshots). Every part's shown on one of the lesson's boards, `src/den-wolfden.ts`'s BOARDS, each tested to do
what its part says. Dignity's opening choice: what's different, the chains, a run. Her lesson lays the part's board
on the star table and plays its moves (js/den/wolfden-house.js), then hands it to you; the read version,
`wolf-den-guide.html`, draws every board before and after its moves with the den's own board. Not yet: the plain,
quick way as a choice beside the combo way, and the build's plan marked on the board as Tzz's lesson marks hers.
