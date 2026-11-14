# Tutorials: one shape for every puzzle

The user, 14 Nov: "whatever structure we come up with ... should be a standard generic thing. Like ... jump to this,
let me show you this trick. Let me show you this phase. Like, those are general concepts that we'll cover across all
puzzles." And: "somebody might not care about showing me basics ... They may be struggling with the end game and
wanting help with that part." RULES.md has the rules ("Every tutorial has a read version, kept in sync", "Every
tutorial has the same shape, and you can jump in anywhere"); this is how they're built.

## 1. The description each puzzle fills in

One `Tutorial` (src/tutorial.ts) for each puzzle, in a file of the puzzle's own (`src/distill-tutorial.ts`):

- **The basics:** the rules in brief, just enough to follow the rest (the game's own tutorial teaches them properly).
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
- One look at both on their own: the unlinked `tutorial-test.html` (Distilling's draft, stand-in sections).

## 3. Distilling (Helium)

The draft is `src/distill-tutorial.ts` (14 Nov), written while the late-game work was changing Distilling's bots,
tricks and guide; it's not wired yet. Drawn from what's there, so it can't drift (tests/tutorial.test.ts):

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
- **The choice**, in Helium's voice (drafts): "Right. What are you after? The basics? Help with the early or mid
  game? Trying to get your CC higher?", and "The end game?" once it's ready. The basics (with the drag tricks); the
  early or mid game (the first three phases); a higher Crystal Clear (setting a target, storing, the leapfrog, the
  chain); the end game.

### What's left to wire (after the late-game work merges)

1. **src/distill-tutorial.ts:** the end game's phase, its tricks and the gamble's board from the late-game work (drop
   their `todo`s); any trick or technique it added (the test fails until each is in); check the scenario phases
   (P7 and P27 put in the fire's side).
2. **src/lines/helium.ts:** DRAFT_LINES move there as `TUTOR` (and into LINES.md by `npm run build`).
3. **distilling-guide.html:** ids on the rules' four articles (`b-pieces`, `b-swaps`, `b-furnace`, `b-chains`); the
   old `nav.toc` replaced by `tutorialNav(DISTILL_TUTORIAL, ...)`; and `ANCHORS_TO_ADD` emptied as they appear.
4. **js/distill-guide-view.js:** an id on each trick tile (`d-climb` ...); the old table of contents' code removed.
5. **src/den-helium.ts and js/den/helium-isle.js:** the choice before the lesson (after the opening, or on a key at
   the still, "Teach me", T): `tutorialChoice(DISTILL_TUTORIAL, { onPlay })`, and `onPlay` turning a part's board
   (`distillShows`) into beats, as `lessonPlan` does now for step one: the board laid, Helium's line, the drags
   played at PACE_LESSON, then it's yours. Step one becomes the scenario `stepOne`; STEPS grows a step a phase.
6. A "show me this" link on each guide section (`den.html?at=helium&learn=<id>`), opening the lesson on that part
   (`TutorialMenu.play`).

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
