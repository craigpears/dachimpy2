/** Answering the door when you knock: the first time, and when you come back. */
export const AT_THE_DOOR = {
    first: 'Ahoy! Come in, come in. Mind the stump, it bites. Well. What comes out of it does.',
    again: 'Back again! Got your sword arm warmed up?',
};
/** Showing you round, a stop at a time. */
export const TOUR_LINES = {
    hall: [
        'This isn\'t even my main house, you know. You should see my gallery.',
        'And my shack\'s just my bank. Don\'t tell anyone.',
    ],
    stump: [
        'This is the fun bit. A charm on the stump, and in come the werewolves.',
        'Wolves are my thing. Vampires I leave to Gravee.',
    ],
    gallery: [
        'And THIS is my gallery. My real house, honestly. The hall\'s just the porch.',
        'Go on, have a wander. It goes on a bit. I keep adding to it.',
        'The octopuses love it in here. So many places to hide. Find them all, if you can.',
    ],
};
/** Running the length of her gallery (the shell's skip, Q): your question the first time, her answer, and hers as
    you come back. */
export const THE_GALLERY = {
    answer: 'Keep going. I\'ll tell you when you\'re halfway.',
    back: 'Told you it was big. And that\'s just the one wing.',
};
/** About a portrait you've stopped by or turned to look at (src/den-jezerbell.ts's PORTRAITS and
    GALLERY_PORTRAITS), once a visit each. */
export const ON_A_PICTURE = {
    twilight: 'A twilight stroll. Very peaceful. No werewolves in that one.',
    love: 'Eternal love! Me and my babies. Well, one of them. The others were hiding.',
    three: 'Just the three of us. I don\'t know who the third is. Probably an octopus.',
    wolfnight: 'Wolf night. My favourite kind of night.',
    eightarms: 'Eight arms, one heart. Well, three hearts. Octopuses have three. Look it up.',
    beginners: 'My beginners\' den. Everybody gets a shot in mine.',
    moonrise: 'Moonrise. Right before the wolves come out. Lovely and spooky.',
    hideandseek: 'Hide and seek. Guess who\'s winning. Not me.',
    allmine: 'All mine. The gallery, I mean. And everything in it.',
    karaoke: 'Karaoke night. Helium was meant to be teaching me to distil.',
};
/** Finding her octopuses, hidden about her hall and her gallery (src/den-jezerbell.ts's OCTOPUSES): what she says as
    each comes out, by where it hid. */
export const FOUND = {
    vase: 'Oh, you found the pink one! She loves that vase. Don\'t ask me for her.',
    throne: 'Under my throne again? Cheeky. That\'s the violet one.',
    'g-screen': 'Behind the screen. Classic. He does that every time.',
    'g-vase': 'Another one in a vase! They do love a vase.',
    'g-chair': 'Under my good chair! Out you come.',
    'g-frame': 'Behind the picture! He thinks he\'s part of the art.',
    'g-chest': 'In with the treasure. She knows what\'s valuable.',
    'g-pillar': 'Right up the pillar! How did she even get up there?',
    'g-statue': 'Behind the shark. Brave little thing.',
    'g-palm': 'Up the palm! She thinks she\'s a coconut.',
    'g-armour': 'Behind the armour. Of course he is.',
    'g-screen2': 'All the way down the end, behind the last screen. You walked all this way!',
};
/** As you find them: the first (her worry, now you've seen one), and when she counts them all and one's missing. */
export const HUNT = {
    first: 'Oh no, you\'ve seen one. Now you\'ll want one. Everyone wants one.',
    allButOne: [
        'Ten, eleven, twelve... and... where\'s my little black one?',
        'The werewolves. They\'ve been sniffing round all week. They\'ve got her!',
        'Right. There\'s a charm on the stump. Shall we go and get her back?',
    ],
};
/** At her stump (Space uses a charm). */
export const AT_THE_STUMP = {
    summon: 'Charm\'s on. Here they come! Stand behind me. Actually, stand next to me, I need you.',
    again: 'Another charm? You\'re a natural. Here they come!',
};
/** In the fray, beside you: when she beats one of her own, when you beat yours, when you're knocked out. */
export const IN_THE_FRAY = {
    mine: ['That\'s one for me!', 'Down you go, puppy.', 'I eat werewolves for breakfast!'],
    yours: ['Nice! Next one\'s yours too.', 'Ooh, good break!', 'That\'s the way!'],
    youOut: 'You\'re out? Don\'t worry, I\'ve got this.',
};
/** After the fray: won (her octopus back, the first time, then again), and lost. */
export const AFTER = {
    won: [
        'She\'s back! My little black one! Come here, you.',
        'And look, a Wolf-skull Wayfinder. Put that on a little ship\'s chart table and it\'ll take you to their ship.',
    ],
    again: 'Good fray! Same time tomorrow?',
    lost: 'That was hard. Another charm, and we\'ll have them.',
};
/** After her octopuses are all found and back, now and then, while she's near. */
export const CHATTER = [
    'I\'ve been running beginner dens. Everyone does the elite ones, so the new ones never get a shot.',
    'Helium tried to teach me distilling. "No, your other left, Jez!" We did karaoke instead.',
    'Most of my octopuses are hidden. People get ideas.',
    'Wolf dens, vampire lairs, I\'m a bit of an addict. In a good way.',
    'If a wine bat ever turns up, you tell me first.',
];
/** Seeing you out. */
export const GOODBYE = 'Bye! Don\'t tell anyone where the octopuses are.';
// ---------- the pack ----------
/** The werewolves as they burst in from the stump, each its taunt (by its id in src/den-jezerbell.ts's PACK). */
export const PACK_TAUNTS = {
    huff: 'Little pirate, little pirate, let us in! Oh. We\'re in.',
    puff: 'Two little piggies and four big wolves. I like those odds.',
    teeth: 'My, what a big board you have!',
    cried: 'Little Bo Peep\'s lost her sheep, and look who\'s found them!',
};
/** A wolf knocked out, slinking off (by who's down, in turn). */
export const PACK_DOWN = [
    'Yipe! Me tail!',
    'Not the fur! It won\'t grow back till the full moon!',
    'We\'ll be back. With a bigger pack.',
    'Owooo... ow.',
];
/** The pack winning, the last word. */
export const PACK_WON = 'Mutton for supper! Arooo!';
export const CHARACTER = {
    name: 'Jezerbell',
    who: 'A real pirate (by her pirate name only), from the user\'s chat log and a screenshot of her house, 21 Nov. She '
        + 'runs werewolf dens and vampire lairs, beginner ones so new crew get a shot; a friend says "she eats WW for '
        + 'breakfast". Her house has a summoning stump for werewolves; she hides her octopus '
        + 'familiars so nobody asks her for one. Her gallery is her main house, her shack her bank. Helium once tried to teach '
        + 'her distilling ("no your other left jez"), and they did karaoke instead.\n\n'
        + 'Warm, bubbly and brave, a wolf hunter who laughs a lot: she shows you her house, worries you\'ll want one of her '
        + 'octopuses, and fights the werewolves beside you. Kept gentle: no other pirates\' names, and nothing she wouldn\'t '
        + 'say herself.\n\n'
        + 'The werewolf pack her charm summons are their own characters, ours: Huffing Hector, Puffing Prudence, '
        + 'Big-Teeth Bartholomew and Cried-Wolf Clementine, fairy-tale wolves who taunt in nursery rhymes and whimper off '
        + 'when beaten.',
    theUser: [
        { on: '21 Nov', said: 'there\'s definitely some good material there for Jezebel in her house, like the hidden octopus ... especially if you start going looking for her familiar octopus, the werewolf for it' },
        { on: '21 Nov', said: 'Oh, I absolutely love Jezebel\'s house idea ... Go find her octopuses. That\'s brilliant.' },
    ],
    lines: [
        { when: 'Answering the door when you knock', says: AT_THE_DOOR, each: { first: 'Your first visit', again: 'Coming back' } },
        { when: 'Showing you round, as you come to each stop', says: TOUR_LINES, each: { hall: 'In the middle of her hall', stump: 'By her summoning stump', gallery: 'Just inside her grand gallery' } },
        { when: 'Running the length of her gallery (Q): her answer to your question, and as you come back', says: THE_GALLERY, each: { answer: 'Her answer', back: 'Coming back' } },
        { when: 'About the portrait you\'ve stopped by or turned to look at (once a visit each)', says: ON_A_PICTURE, each: { twilight: 'Twilight Stroll', love: 'Eternal Love!', three: 'Just the three of us', wolfnight: 'Wolf Night (the gallery)', eightarms: 'Eight Arms, One Heart', beginners: 'The Beginners\' Den', moonrise: 'Moonrise', hideandseek: 'Hide and Seek', allmine: 'All Mine', karaoke: 'Karaoke Night' } },
        { when: 'As you find each of her octopuses, by where it hid', says: FOUND },
        { when: 'Her octopus hunt: the first you find, and once you\'ve found all but the missing one', says: HUNT, each: { first: 'The first you find', allButOne: 'All found but the one the werewolves took' } },
        { when: 'At her summoning stump (a charm)', says: AT_THE_STUMP, each: { summon: 'The first charm', again: 'Another charm' } },
        { when: 'In the fray, beside you', says: IN_THE_FRAY, each: { mine: 'She beats one of her own, one in turn', yours: 'You beat yours, one in turn', youOut: 'You\'re knocked out' } },
        { when: 'After the fray', says: AFTER, each: { won: 'Won, her octopus back', again: 'Won again', lost: 'Lost' } },
        { when: 'Now and then, as you wander her hall once her octopuses are all back', says: CHATTER },
        { when: 'As you leave', says: [GOODBYE] },
        { when: 'The pack: each werewolf\'s taunt as it bursts in from the stump', says: PACK_TAUNTS, each: { huff: 'Huffing Hector', puff: 'Puffing Prudence', teeth: 'Big-Teeth Bartholomew', cried: 'Cried-Wolf Clementine' } },
        { when: 'The pack: a werewolf knocked out, slinking off, one in turn', says: PACK_DOWN },
        { when: 'The pack, winning the fray', says: [PACK_WON] },
    ],
};
