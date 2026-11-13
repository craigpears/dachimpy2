/* Pirate Den: Dachimpy (src/lines/character.ts says how these files go), the user's own pirate, in their
   house in the den's housing district, which doubles as a museum. Said in speech bubbles by
   js/den/dachimpy-house.js as they hug you at the door, give you a cookie and show you round: the museum
   of the old Blockade Simulator and Dachimpy.com (src/den-dachimpy.ts's EXHIBITS, oldest first), then
   their friends (src/den-dachimpy.ts's FRIENDS). Their plaques are here too: written by them, in their
   voice. */
import type { Character } from './character.js';

/** At the door when you come in, every visit: a hug first (IDEAS.md: "I'm very well known for giving just
    like hugs and cookies ... anyone that comes into my house ... I need to give them cookies"). */
export const AT_THE_DOOR = {
  first: 'Welcome, welcome! Come here, you. Hug first.',
  again: 'You came back! Hug first. Then cookies.',
} as const;

/** After the hug, the cookie: the first visit, then one of the others in turn; and on to the museum. */
export const THE_COOKIE = {
  first: 'And a cookie. Everyone who comes in gets a cookie. House rule.',
  again: ['Cookie! Fresh ones.', 'Your cookie. Still warm.', 'One cookie, as promised.'],
  onward: 'Now come and see. The old sims, oldest first. My pride and joy.',
} as const;

/** Another cookie from the plate on the hall's table (walk up to it and ask), one in turn. */
export const ANOTHER_COOKIE = [
  'Have another. I insist.',
  'There\'s always another cookie.',
  'That\'s three. I\'m not counting. I am counting.',
  'Take two. One for the road.',
] as const;

/** Showing you round, a stop at a time: the lines they say when you get there. */
export const TOUR_LINES = {
  hall: [
    'So this is my house. And the museum. Both, really.',
    'Everything I ever made for Puzzle Pirates, through there. Oldest first.',
  ],
  museum: [
    'Here we are. Stop by any of them and I\'ll tell you about it.',
    'Bugs and all. Especially the bugs.',
  ],
  friends: [
    'And this room\'s the people. My friends, from all those years.',
    'The middle of the wall is for the truly special ones.',
  ],
} as const;

/** The plaques, under each exhibit and with it close up (src/den-dachimpy.ts's EXHIBITS, by id): what
    IDEAS.md says of each version, and where it says nothing, what the screenshot plainly shows. */
export const PLAQUES = {
  banner: 'The banner from the top of Dachimpy.com: the chimp in his blue pirate hat, a dashed trail to the X, the cliffs, and the sloop on its green ring.',
  titleCard: 'The title card from my guide videos: the logo over the sea, faint jigsaw pieces across it, and a little ship sailing in at the corner.',
  first: 'The first prototype board. One whirlpool, one little ship, three moves: left, forward, right. Then Execute Move. It moved! I was thrilled.',
  beforeWhirled: 'The version before Whirled. I bet nobody even recognises it. Flags, rocks, whirlpools and winds, your ship counting its lefts, forwards and rights, chat beside it, on SmartFoxServer.',
  jobbers: 'It tried to be realistic: Starting Jobbers and Jobbers per Turn for each team, so you had to fill your ship with jobbers. Too complicated. I simplified it to just the ship navigating part.',
  wireframe: 'The plan for the game set-up, in grey boxes: an Admiral and Navs for each team, chat, and the user list.',
  lobby: 'The Blockade Sim\'s lobby: choose your ship, your jobbers Weak, Normal or Elite, and tick Ready. Blockade practice without gathering hundreds of jobbers.',
  teams: 'The teams: Spectators, Team One and Team Two. That\'s me on Team One, on Normal, ready.',
  create: 'Create Your Game: max players, rated or not, the map, the turn time, and friendly fire. Ticked, of course.',
  inPlay: 'The finished thing, live on Whirled from 13 April 2010: isometric, the Blockade! move panel, the clock. And now and then your ship would spin and hop into the rocks. That gave it character.',
  rotations: 'A sloop for every heading, drawn by hand by someone I paid a tiny bit, back in the day. Poor guy. I love them.',
  rings: 'The same sloops, turning round on their rings.',
} as const;

/** The museum's panels of story, where there's no picture: the start, the first version, and the end. Each
    a title and its words, on a painted page of its own. */
export const PANELS = {
  began: {
    title: 'Did you know?',
    text: 'It all started when I watched Dlonelyone showing a new pirate how to sail a sloop for the first time. I wished I could do that too. I wasn\'t quite brave enough, not out loud. So I made Dachimpy.com instead: a quieter way of doing the same thing. Helping people learn.',
  },
  guide: {
    title: 'Version one',
    text: 'An insanely basic HTML page: the Bnav Guide. Plain links. Ship movement; winds and rocks; whirlpools; shooting and grappling; collisions. Then practice boards, and "Dalnoth traverses the board", I to III. Its last line planned a Survival Game: waves of bot ships, each harder than the last.',
  },
  gone: {
    title: 'And then',
    text: 'Flash got deprecated and Whirled was taken down, and the sim went with them. These days there\'s the Global Cade Sim, someone else\'s, still running. It works perfectly. No ship ever spins into the rocks. Where\'s the fun in that?',
  },
} as const;

/** About the exhibit you're looking at (the house shell's: src/den-houses.ts's lookingAt), by its id, once a
    visit each; also under it in the close view. Short: it's said in a bubble. */
export const ON_AN_EXHIBIT = {
  began: 'That\'s where it all started. Watching her.',
  banner: 'My banner. The chimp\'s me, more or less.',
  titleCard: 'The videos opened on this. Imagine the music.',
  guide: 'Version one. Insanely basic. I was so proud of it.',
  first: 'Look at that little ship. Execute Move!',
  beforeWhirled: 'You don\'t recognise it, do you? Nobody does.',
  jobbers: 'Jobbers per turn. What was I thinking?',
  wireframe: 'All grey boxes. The dream was in there somewhere.',
  lobby: 'Choose your ship! The jobbers came along for free.',
  teams: 'Team One. Just me. Ready, though.',
  create: 'Friendly fire on. Obviously.',
  inPlay: 'Sometimes she\'d spin into the rocks. Character, that is.',
  rotations: 'Every one of those by hand. Poor guy. I love them.',
  rings: 'Round and round. Still makes me smile.',
  gone: 'The new one works perfectly. Shame, really.',
} as const;

/** About each friend's portrait (src/den-dachimpy.ts's FRIENDS), by id, as you stop by it; and their
    titles on the frames. Pirate names only. */
export const FRIEND_TITLES = {
  dalnoth: 'Dalnoth, First on the Board',
  dignity: 'Dignity, Never Off Duty',
  mischievious: 'Mischievious, at a Wedding',
  gravee: 'Gravee, Who Paints Everyone',
  kikkit: 'Kikkit',
  zizzy: 'Zizzy',
  sanne: 'Sanne',
  tzz: 'Tzz, and D\'rizzle',
  helium: 'Helium, Eyebrows Pending',
  roobear: 'Roobear, Ears Roobed',
  thanks: 'Thank You',
} as const;
export const ON_A_FRIEND = {
  dalnoth: 'Dalnoth. He was on my very first boards. He took it well.',
  dignity: 'Dignity. She runs the checkpoint. Very firmly. Bella helps.',
  mischievious: 'Mischievious. Always a wedding somewhere.',
  gravee: 'Gravee. She\'ll paint you too. Mind the coffin.',
  kikkit: 'Kikkit. Truly special. She gets the middle, and the roses.',
  zizzy: 'Zizzy. Truly special. I\'ll paint her properly when I can do her justice.',
  sanne: 'Sanne. Truly special. Their portrait\'s to come: I want to get them just right.',
  tzz: 'Tzz. She gave me my best teaming tip: don\'t stall. Ever.',
  helium: 'Helium. Ask about the eyebrows. Actually, don\'t.',
  roobear: 'Roobear. Robert roobed my ears too.',
  thanks: 'That one\'s for everyone. It\'s the people that made it.',
} as const;
/** The thank-you, on a page in the friends' room: to everyone who makes Puzzle Pirates what it is. */
export const THANKS = 'To my friends on these walls, and everyone who isn\'t: everyone who makes Puzzle Pirates such an awesome place. Thank you.';
/** The sign over the truly special ones, in the middle of the friends' wall. */
export const SPECIAL = 'Truly special';

/** After the tour, as you wander: now and then, while they're near. */
export const CHATTER = [
  'Another cookie? There\'s always another cookie.',
  'The ship spinning into the rocks? That was a feature.',
  'Tab, if you want a proper look at them.',
  'Mind the crumbs. Actually, I don\'t mind.',
  'I\'ve got hugs in reserve, if you need one.',
] as const;

/** Seeing you out. */
export const GOODBYE = 'Bye! Take a cookie for the road!';

export const CHARACTER: Character = {
  name: 'Dachimpy',
  who: 'The user\'s own pirate, of the Emerald Ocean (they/them), drawn in their rose pink wig, belt and braces and '
    + 'kilt. They made the Blockade Simulator and Dachimpy.com, guides and sims for helping people learn the '
    + 'puzzles, a quieter way of doing what they saw Dlonelyone do one day: teaching a new pirate to sail.\n\n'
    + 'Warm, proud of everything they built, bugs and all, and well known for hugs and cookies: everyone who '
    + 'comes into their house gets both. Their house in the den\'s housing district doubles as a museum of the '
    + 'old sims, oldest first, and keeps their friends on its walls.',
  theUser: [
    { on: '11 Nov', said: 'It very much fits me, kind of just ... showing you around all the history of the things that I\'ve built. They are my pride and joy.' },
    { on: '11 Nov', said: 'I\'m very well known for giving just like hugs and cookies ... anyone that comes into my house, which I guess you can double up as a museum, I need to give them cookies.' },
    { on: '11 Nov', said: 'the bugs are what made it, kept it interesting. They gave it the character.' },
    { on: '13 Nov', said: 'my museum house idea ... Definitely seems [ready]' },
  ],
  lines: [
    { when: 'At the door when you come in, a hug first', says: AT_THE_DOOR, each: { first: 'Your first visit', again: 'Coming back' } },
    { when: 'After the hug, a cookie', says: THE_COOKIE, each: { first: 'Your first visit', again: 'Coming back, one in turn', onward: 'Then, on to the museum' } },
    { when: 'Another cookie from the plate on the hall\'s table, one in turn', says: ANOTHER_COOKIE },
    {
      when: 'Showing you round, as you come to each stop', says: TOUR_LINES,
      each: { hall: 'In the hall, under the banner', museum: 'Into the museum', friends: 'Into the friends\' room' },
    },
    { when: 'The plaques under the exhibits, oldest first', says: PLAQUES },
    { when: 'The museum\'s panels of story, where there\'s no picture', says: PANELS },
    { when: 'About the exhibit you\'ve stopped by or turned to look at (once a visit each), and under it close up', says: ON_AN_EXHIBIT },
    { when: 'The titles on their friends\' portraits', says: FRIEND_TITLES },
    { when: 'About the friend\'s portrait you\'ve stopped by (once a visit each)', says: ON_A_FRIEND },
    { when: 'The thank-you on the friends\' wall, and the sign over the truly special ones', says: { thanks: THANKS, special: SPECIAL } },
    { when: 'Now and then, as you wander after the tour', says: CHATTER },
    { when: 'As you leave', says: [GOODBYE] },
  ],
};
