/* Pirate Den: the race's starter (src/lines/character.ts says how these files go), at the buoy off the
   sloop race's gate, out past Primates Rule (src/den-race.ts; js/den/race.js says these). Nameless for
   now: a real pirate needs the user's pick, and their portrait checked. (Your rivals are the den's own
   characters, their lines each one's own: RACER in their files.) */
import type { Character } from './character.js';

/** What the starter calls out. `{time}` is a time, as the clock shows it; `{place}` a place (2nd). */
export const STARTER = {
  /** Sailing up to the buoy, the first time a voyage. */
  hail: 'A race round the course? Five legs out and back behind them rocks, round the buoys. Space when ye\'re ready',
  /** By the buoy again, after a race. */
  again: 'Another go? Space when ye\'re ready',
  /** Taken in to the starting line, before the off: the race explained (the user, 11 Nov: "Here are your
      options ... do you want to bilge through a [lock]? Or you can take the long way around or zoom over a
      whirlpool, risking a doomed return to the start if you ... get it wrong"). The long way, shortcuts
      that cost a puzzle with a few named, the snakes, and the shooting. Said a line at a time. The starlit
      door named among the shortcuts since 12 Nov (RULES.md, "No hidden gems in the proof of concept"). The bribe at the gun gap's gate named
      since 12 Nov, once it was built (RACE.md §3). The race's next pass (12 Nov): the gambles gone, the rocks
      blasted open for everyone named, the field fresh each race and its hop, and the snakes gentle. The gate
      through the fort across its bay named (13 Nov, an experiment: RACE.md §3), and that both its guns hole you if
      you run it. */
  explain: [
    'Here\'s the way of it. Round the numbered buoys, five legs and the run home: the long way, no puzzle, just sail her',
    'First the field: slow winds that nudge ye a square, whirlpools that turn ye round, fresh every race. Eyeball a way through, or hop the headwinds with a Double for a ride',
    'Or cut through the spits, if ye dare. Every shortcut costs ye a puzzle: bilge up through a lock, build a crane, row the headwind gap',
    'Zoom over the whirlpools on a Vegas, hop a headwind with a Double, or haul up some treasure and pay off the guard at the gate',
    'That gate\'s through the Empire\'s fort, straight across the bay the long way goes round. Run it, and both its guns\'ll hole ye',
    'Or blast the rocks off leg three with yer guns: three hits, anyone\'s, and they\'re open for everyone',
    'Or, for a navigator, a starry door in the cliff off leg two, opened by Navigation, and a tunnel under the course up onto leg three',
    'Mind the winds that sweep ye back a few squares, the trade wind up the left most of all, and the run home runs right beside it',
    'And the others\'ll shoot ye if ye sit still in the open. Pick yer spot on the line, and Space for the count',
  ],
  /** The count, then the gun. */
  count: ['Three...', 'Two...', 'One...'],
  go: 'Go!',
  /** On the line: who's racing ye ({names}: your rivals, src/den-rivals.ts). */
  field: 'Racing ye: {names}',
  /** A rival's home ({name}, her place and time). */
  home: '{name}\'s over the line: {place}, {time}',
  /** A snake has her (a few squares back, since 12 Nov: never rage-inducing): the left-hand trade wind's
      loops, the trade wind back across leg 3. (The tight water past the gun gap went 13 Nov.) */
  swept: {
    left: 'The trade wind\'s got ye! A few squares back: round ye go again',
    mid: 'Caught in the trade wind! Round its loop and have another go at that hop',
  },
  /** Over the finish line: first, or not; and a best. */
  won: 'Over the line, and home first! {time}',
  lost: 'Over the line in {time}: {place}. Beaten to it, this time',
  best: 'Yer best yet: {time}',
  /** Sailed back out through the gate mid-race. */
  quit: 'Out the gate? That race is off, then',
} as const;

export const CHARACTER: Character = {
  name: 'The race\'s starter',
  who: 'Whoever keeps the buoy off the sloop race\'s gate, out past Primates Rule: takes you in to the starting '
    + 'line, explains the race, counts you down, fires the gun, and calls the times at the finish line. Nameless '
    + 'for now: a real pirate needs the user\'s pick. (The rivals racing you are the den\'s own characters.)\n\n'
    + 'Explains the race\'s rules before the off (the long way, shortcuts that cost a puzzle, a few named as '
    + 'examples, the starlit door among them, the snakes, the shooting), never where a shortcut is or how it\'s '
    + 'done beyond that (RULES.md, "No hidden gems in the proof of concept").',
  theUser: [
    { on: '11 Nov', said: 'a winding, snakes and ladders, zigzagging kind of course, just with a lot of shortcuts, and each shortcut is a different puzzle' },
    { on: '11 Nov', said: 'Obviously, this will be out near where Primates Rule is, I guess ... We\'re going to have to go through several iterations of this course.' },
    { on: '11 Nov', said: 'the concepts in this are going to need ... quite a bit of explaining as well at the start, like everything we\'ve talked about. Here are your options.' },
  ],
  lines: [
    {
      when: 'At the buoy, and the race', says: STARTER,
      each: {
        hail: 'Sailing up to the buoy, the first time a voyage',
        again: 'By the buoy again, after a race (Space past the finish line takes her back there)',
        explain: 'Taken in to the starting line, before the off: the race explained, a line at a time',
        count: 'The count, a second each',
        go: 'The gun',
        field: 'On the starter\'s card, on the line: who\'s racing you',
        home: 'When a rival\'s over the finish line',
        swept: 'When a snake has her, a few squares back: the left-hand trade wind, the trade wind back across leg 3',
        won: 'Over the finish line before everyone else',
        lost: 'Over it after someone',
        best: 'Your best time yet, kept in this browser',
        quit: 'Sailed back out through the gate mid-race',
      },
    },
  ],
};
