/* Pirate Den: Jazzmy's lines (src/lines/character.ts says how these files go). When she says them is src/den-carpet.ts's
   (her magic carpet ride down a trade wind, a little adventure of its own), drawn by js/den/carpet.js. */
import type { Character } from './character.js';

/** On her jetty, as the sloop comes alongside: she's in a hurry for Helium's rum, and the carpet's your idea, not
    hers (the user, 14 Nov: "like you're the one that comes up with the idea ... I don't want her to seem like she's
    demanding it"); then climbing onto the carpet. */
export const ON_HER_JETTY = {
  hello: 'Ahoy! Oh, good timing.',
  ask: 'I\'m running rum out to a blockade, and Helium\'s got the rum. I need to get there quick. Any ideas?',
  yes: 'A magic carpet? Oh, go on, then.',
  aboard: 'Ooh, comfy. Right then. Let\'s fly!',
} as const;

/** Down the trade wind on the carpet, by how fast she's going (src/den-carpet.ts's moodAt): a line now and then as
    it changes. */
export const ON_THE_CARPET = {
  bored: ['Is this it?', 'Can it go any faster?', 'I\'ve seen quicker barnacles.'],
  happy: ['Ooh!', 'This is lovely!', 'Look at the sea!'],
  thrilled: ['WHEEE!', 'Faster! FASTER!', 'I\'m FLYING!'],
  scared: ['Too fast! TOO FAST!', 'Are those ROCKS?', 'Slow DOWN!'],
} as const;

/** The wind runs out, the sloop stops dead and the carpet doesn't: as she goes, by whether she's going to clear the
    reef (src/den-carpet.ts). */
export const AS_SHE_GOES = {
  short: 'Oh.',
  off: 'WHEEEEEEEeeeee...',
} as const;

/** In the air (src/den-carpet-flight.ts): through a gust, and dropping low. */
export const IN_THE_AIR = {
  gust: ['Ooh! A gust!', 'Up we go!', 'Wheee!'],
  low: ['Up! UP!', 'We\'re dropping!'],
} as const;

/** Where she comes down, her word on it (but flown off the edge of the sea, she's gone: you say it,
    src/lines/you.ts). At Helium's and Port Decorum, after theirs (src/lines/helium.ts, imperial-guards.ts). */
export const WHERE_SHE_ENDS_UP = {
  short: 'Well. This is peaceful.',
  rocks: 'I\'m fine! The seagulls are not fine.',
  sea: 'Bit short. Bit wet. Lovely view, though.',
  helium: 'Rum! Right. Now, that blockade.',
  decorum: 'Fine. I\'ll fly back out, then.',
  island: 'Not Helium\'s. Nice, though.',
  race: 'Is this the race? Am I winning?',
} as const;

export const CHARACTER: Character = {
  name: 'Jazzmy',
  who: 'A pirate of the Emerald Ocean, a Senior Officer of Down To Clown and a Lady of No Bamboozles, who owns Ice Spices on Armstrong Island. Long golden waves past her shoulders, winking, in black and gold with a white ruff, a silver chalice in her hand and an orange parrot on her shoulder (her portraits).\n\nShe wanted her name to sound like Jasmine. In the den she needs a quick lift to Helium\'s for a blockade\'s rum, and you have an idea: an Aladdin-style adventure, a magic carpet lashed on top of the sloop, "JASMINE" embroidered on it, crossed out, and "Jazzmy" stitched over the top.',
  theUser: [
    { on: '14 Nov', said: 'I\'m not sure if it fits her to be asking for the magic carpet ride ... like you\'re the one that comes up with the idea ... I don\'t want her to seem like she\'s demanding it' },
    { on: '14 Nov', said: 'she said she wanted to make her name sound like Jasmine' },
    { on: '14 Nov', said: 'kind of exasperating at the end. It\'s like, oh, my name\'s not really Jasmine. It\'s like, I have this sad face' },
    { on: '14 Nov', said: 'I think the crossing out Jasmine with Jasmine works enough. I don\'t think you need a constant correction in the dialogue' },
    { on: '14 Nov', said: 'I don\'t think she\'d want the "my name\'s not even Jasmine" thing on there. That seems a bit personal' },
    { on: '14 Nov', said: 'we need more creative, just a few varied endings, like she crashes on the rocks and nothing really happens. Same with the water, yeah, that\'s very anticlimactic' },
  ],
  lines: [
    { when: 'On her jetty, as you come alongside, and once she\'s on the carpet', says: ON_HER_JETTY, each: { hello: 'As you come alongside', ask: 'Straight after', yes: 'After your idea: a magic carpet', aboard: 'Sat on the carpet, lashed on the sloop' } },
    {
      when: 'Down the trade wind on the carpet, now and then, by how fast you\'re going', says: ON_THE_CARPET,
      each: { bored: 'Slow (only once it\'s been slow a while)', happy: 'Going nicely', thrilled: 'Going fast', scared: 'Going too fast: if the wind ran out now, the rocks' },
    },
    {
      when: 'Flying off the sloop as the wind runs out', says: AS_SHE_GOES,
      each: { short: 'Too slow to clear the reef', off: 'Fast enough to clear it' },
    },
    { when: 'In the air', says: IN_THE_AIR, each: { gust: 'Through a gust', low: 'Dropping low, heading down' } },
    {
      when: 'Where she comes down', says: WHERE_SHE_ENDS_UP,
      each: { short: 'In the sea short of the reef, afloat on the carpet, paddling with her goblet, a seagull landing on her head', rocks: 'Into rocks: in a seagulls\' nest on top, the carpet draped over them, the seagulls cross', sea: 'In the open sea past the reef', helium: 'On Helium\'s island, after they\'ve said hello', decorum: 'In Port Decorum, after the guard\'s had his say', island: 'On someone else\'s island', race: 'On the race course, past the far reef' },
    },
  ],
};
