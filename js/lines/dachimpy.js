/** At the door when you come in, every visit: a hug first (IDEAS.md: "I'm very well known for giving just
    like hugs and cookies ... anyone that comes into my house ... I need to give them cookies"). */
export const AT_THE_DOOR = {
    first: 'Hiii! Welcome, welcome! Come here, you. Hug first!',
    again: 'You came back! Yay! Hug first. Then cookies.',
};
/** After the hug, the cookie: the first visit, then one of the others in turn; and on to the museum. */
export const THE_COOKIE = {
    first: 'Yay, cookies! Everyone who comes in gets a cookie. House rule.',
    again: ['Cookie time! Fresh ones!', 'Yay, cookies! Still warm.', 'Ooh, your cookie! One, as promised.'],
    onward: 'Now come and see! The old sims, oldest first. My pride and joy.',
};
/** Another cookie from the plate on the hall's table (walk up to it and ask), one in turn. */
export const ANOTHER_COOKIE = [
    'Yes! Have another. I insist.',
    'Ooh, more cookies! There\'s always another cookie.',
    'Yay, three! I\'m not counting. I am counting.',
    'Take two! One for the road.',
];
/** Showing you round, a stop at a time: the lines they say when you get there. */
export const TOUR_LINES = {
    hall: [
        'Yay, you\'re here! This is my house. And the museum. Both, really.',
        'Everything I ever made for Puzzle Pirates is through there. In order!',
    ],
    museum: [
        'Ooh, here we go! Stop by any of them and I\'ll tell you all about it.',
        'Bugs and all. Especially the bugs.',
    ],
    friends: [
        'And this is the best room: the people! My friends, from all those years.',
        'The middle of the wall is for the truly special ones.',
    ],
};
/** The plaques, under each picture and with it close up (src/den-dachimpy.ts's EXHIBITS, by id): the user's
    own telling (IDEAS.md; TODO.md, 14 Nov), the old site's own words, and what each picture plainly shows. */
export const PLAQUES = {
    guide: 'Version one! An insanely basic HTML page of plain links, autumn 2008: movement, winds and rocks, whirlpools, shooting, collisions, then practice boards. It planned a Survival Game. Still planning.',
    shootDalnoth: 'The very first Shoot Dalnoth! A little game on the Shooting page: Dalnoth\'s face on four squares, winds and a whirlpool to reach him. No hatred towards Dalnoth. Every version since has shot him. Tradition.',
    traverses: 'Then Dalnoth traverses the board! A health bar, move generation, bilge, and him roaming about trying to get away. Same hull for you both, so set it up as hard as you like. Sink him before he crosses!',
    first: 'My first go at Flash! Not even a prototype: one whirlpool, one little ship, left, forward, right, then Execute Move. It moved! I was thrilled.',
    beforeWhirled: 'The version before Whirled, on SmartFoxServer! Flags, rocks, whirlpools and winds, your ship counting its lefts, forwards and rights, chat beside it. I bet nobody recognises it.',
    jobbers: 'Ooh, it tried to be realistic! Starting Jobbers and Jobbers per Turn for each team, so you had to fill your ship with jobbers. Too complicated. I simplified it to just the ship navigating part.',
    setup: 'The game set-up screen, the very first version! Not a wireframe: that really is how it looked. An Admiral and Navs for each team, chat, and the user list.',
    teams: 'Teams! Spectators, Team One and Team Two, in bright orange. That\'s me on Team One, on Normal, ticked and ready.',
    banner: 'The banner! Paid for with that kind gift: the chimp in his blue pirate hat, a dashed trail to the X, the cliffs, and the sloop on its green ring. The chimp\'s me, more or less.',
    titleCard: 'The title card for my guide videos, from the same gift! The logo over the sea, faint jigsaw pieces across it, a little ship sailing in at the corner. Imagine the music.',
    rotations: 'A sloop for every heading, every one cut out by hand! I paid someone a little of that gift for it. Poor guy. Then someone pointed out the game\'s own files had them all along. After all that time scraping.',
    rings: 'Round and round! The same sloops, turning on their rings. Still makes me smile.',
    lobby: 'The Blockade Sim\'s lobby, all grown up, its art from that gift! Choose your ship, your jobbers Weak, Normal or Elite, and tick Ready. Blockade practice without gathering hundreds of jobbers.',
    create: 'Create Your Game, on Whirled! Max players, rated or not, the map, the turn time, and friendly fire. Ticked, of course.',
    inPlay: 'The finished thing, live on Whirled from 13 April 2010! Isometric, the Blockade! move panel, the clock. And now and then your ship would spin and hop into the rocks. That gave it character.',
    siteV2: 'Dachimpy.com, version two, spring 2009! Parchment scrolls for menus: Stations, Piracy, Crafting, Carousing. Here, my Gunning guide: wild style, the two-cannon loop, board sitting, central looping.',
    siteV3: 'Version three, 2010: the blue one, the banner on top! Guides for every puzzle, the apps, the updates. 13 April: "Blockade simulator is up on whirled!" Views so far: one.',
    siteV4: 'Version four, 2011! A picture for every puzzle, a Donate button, and the news on Twitter. So modern.',
    siteV5: 'Version five, autumn 2011! The news on top, carousels of every puzzle under it, and comments at last. Then the nav sims came back. Dalnoth too, obviously.',
    siteLatest: 'The last version, 2012 to 2014, built properly at last! Piracy, Carousing, Crafting, the Blockade Sim, articles, hyper-ranking. Put back together here from its own files.',
    dalnothApp: 'Shoot Dalnoth, back on 8 November 2011 and there to the end: over three thousand plays! Flash won\'t run any more, so here he is, standing still. He\'s used to it.',
};
/** The museum's panels of story, where there's no picture: the start, the donation, and the end. Each a
    title and its words, on a painted page of its own. */
export const PANELS = {
    began: {
        title: 'Did you know?',
        text: 'It all started when I watched Dlonelyone teaching a new pirate to sail a sloop for the first time. I loved it! I wanted to help people like that too. Teaching out loud just wasn\'t me, so I made Dachimpy.com instead, my own way of doing it. Helping people learn!',
    },
    donation: {
        title: 'A kind gift',
        text: 'Then someone, and I wish I could remember who, kindly donated about a hundred quid to help me make a guide. Yay! I spent it on art: the banner, the title card for my videos, and the sloops cut out for the sim, every heading. Here they are!',
    },
    gone: {
        title: 'And then',
        text: 'Aww. Flash got deprecated and Whirled was taken down, and the sim went with them. These days there\'s the Global Cade Sim, someone else\'s, still running. It works perfectly. No ship ever spins into the rocks. Where\'s the fun in that?',
    },
};
/** About the exhibit you're looking at (the house shell's: src/den-houses.ts's lookingAt), by its id, once a
    visit each; also under it in the close view. Short: it's said in a bubble. */
export const ON_AN_EXHIBIT = {
    began: 'Ooh, that\'s where it all started! Watching her.',
    guide: 'Version one! Insanely basic. I was so proud of it.',
    shootDalnoth: 'Shoot Dalnoth! The very first. Sorry, Dalnoth.',
    traverses: 'Look, he roams! Still sinks, mind.',
    first: 'Aww, look at that little ship! Execute Move!',
    beforeWhirled: 'Ooh, the one before Whirled! Nobody ever recognises it.',
    jobbers: 'Jobbers per turn! What was I thinking?',
    setup: 'The first version! Honestly, that\'s how it looked.',
    teams: 'Team One! Just me. Ready, though.',
    donation: 'Someone was so kind! I still wish I knew who.',
    banner: 'My banner! The chimp\'s me, more or less.',
    titleCard: 'The videos opened on this! Imagine the music.',
    rotations: 'All by hand! Then they were in the game\'s files all along.',
    rings: 'Round and round! Still makes me smile.',
    lobby: 'Choose your ship! The jobbers came along for free.',
    create: 'Friendly fire on! Obviously.',
    inPlay: 'Yay, Blockade! Sometimes she\'d spin into the rocks. Character, that is.',
    siteV2: 'Parchment scrolls! Very piratey. Very 2009.',
    siteV3: 'The blue one! One view on the Blockade Simulator. Mine.',
    siteV4: 'A picture for every puzzle! I loved this one.',
    siteV5: 'Comments at last! People told me things.',
    siteLatest: 'The last one! Proper code, finally.',
    dalnothApp: 'Dalnoth again! It\'s tradition now.',
    gone: 'Oh, the new one! It works perfectly. Shame, really.',
};
/** Their friends' portraits' titles, by id (src/den-dachimpy.ts's FRIENDS): the den's pirates by a title of
    Dachimpy's, and Dachimpy's own portraits with friends by their real titles (IDEAS.md, "Dachimpy's pirate
    pages and portraits, both oceans"). Pirate names only. */
export const FRIEND_TITLES = {
    dalnoth: 'Dalnoth, First on the Board',
    dignity: 'Dignity, Never Off Duty',
    mischievious: 'Mischievious, at a Wedding',
    monkeyMan: 'The Monkey Man',
    gravee: 'Oh, Gawd!',
    kikkit: 'Kikkit: Cursed & Cookied',
    zizzy: 'Zizzy: Pinky and the Pink',
    sanne: 'Sanne: Monkey Couple',
    tzz: 'Tzz, and D\'rizzle',
    helium: 'Helium, Eyebrows Pending',
    roobear: 'Roobear, Ears Roobed',
    welcomeBack: 'Welcome Back Dachimpy!',
    thanks: 'Thank You',
};
/** About each friend's portrait, by id, as you stop by it (once a visit each). */
export const ON_A_FRIEND = {
    dalnoth: 'Dalnoth! He was on my very first boards. He took it well.',
    dignity: 'Ooh, Dignity! She runs the checkpoint. Very firmly. Bella helps.',
    mischievious: 'Mischievious! Always a wedding somewhere.',
    monkeyMan: 'Ha, the Monkey Man! That\'s me, 2007. Some things never change.',
    gravee: 'Oh, Gawd! Gravee and me, in the jaws of her Familiar Plaice. That face says it all.',
    kikkit: 'Kikkit! Truly special. Every Valentine\'s, a portrait, and always cookies.',
    zizzy: 'Zizzy! Truly special. Pinky and the pink: both of us in pink, of course.',
    sanne: 'Sanne! Truly special. Monkey Couple, 2007: matching red, a monkey each.',
    tzz: 'Tzz! She gave me my best teaming tip: don\'t stall. Ever.',
    helium: 'Helium! Ask about the eyebrows. Actually, don\'t.',
    roobear: 'Roobear! Robert roobed my ears too.',
    welcomeBack: 'Fable welcomed me back, last June! It was so good to be home.',
    thanks: 'That one\'s for everyone! It\'s the people that made it.',
};
/** The page for "Welcome Back Dachimpy!" (with Fable, whose look's still to check: no figure). */
export const WELCOME_BACK = 'With Fable, June 2025.';
/** The thank-you, on a page in the friends' room: to everyone who makes Puzzle Pirates what it is. */
export const THANKS = 'To my friends on these walls, and everyone who isn\'t: everyone who makes Puzzle Pirates such an awesome place. Thank you.';
/** The sign over the truly special ones, in the middle of the friends' wall. */
export const SPECIAL = 'Truly special';
/** After the tour, as you wander: now and then, while they're near. */
export const CHATTER = [
    'Ooh, another cookie? There\'s always another cookie.',
    'The ship spinning into the rocks? That was a feature!',
    'Tab, if you want a proper look at them!',
    'Yay, crumbs! Mind them. Actually, I don\'t mind.',
    'I\'ve got hugs in reserve, if you need one!',
];
/** Seeing you out. */
export const GOODBYE = 'Byeee! Take a cookie for the road!';
/** On the site's front page (index.html), at the top, a plate of cookies held out: their hello, buzzy and
    excited (RULES.md, "Dachimpy's voice"), before the page asks what you're here for; then, clicking the cookie,
    the first one, and after it ANOTHER_COOKIE in turn (the user, 14 Nov: "Obviously, I need to welcome you to
    the site. Like, would you like a cookie? That'd be hilarious."). */
export const FRONT_PAGE = {
    hello: 'Ahoy! Welcome, welcome! Cookie? Yay, cookies!',
    cookie: 'Yay! There you go. Everyone who comes in gets one. House rule.',
    /** Further down, under "A room of your own": what the den is for, a paragraph each (the user, 14 Nov: "you
        want your own adventure ... or room ... find me on Discord ... send me a link to your pirate page, and we
        can put a little room for you together"). */
    yourRoom: [
        'Want a room of your own in the den? Ooh, yes! Let\'s make one!',
        'The islands each bring something new: a mechanic, a tutorial, or a proper long adventure. And a room of your own is a lovely thing too. Got a character you love, or something to show off? Have it in 3D, in a gallery of your own.',
        'Gravee\'s Bedside Manors is a whole gallery: her portraits, and yours painted, and a vampire with a scare in him. Roobear\'s ROOm has Robert to roob your ear and her wall of everyone\'s guesses at her name. I love them both!',
        'Find me on the Trophy Hunters\' Discord, send me a link to your pirate page, and we\'ll put your room together. I just need a feel for your personality.',
        'The whole den\'s a playground of ideas, each one tried out quickly. I like them meaningful and funny, ideally with a mechanic in them. Tell me which ones you love! Now and then one becomes something really exciting, like the sloop races. And at the very least, it\'s a bit of fun.',
    ],
};
export const CHARACTER = {
    name: 'Dachimpy',
    who: 'The user\'s own pirate, of the Emerald Ocean (they/them), drawn in their rose pink wig, belt and braces and '
        + 'kilt. They made the Blockade Simulator and Dachimpy.com, guides and sims for helping people learn the '
        + 'puzzles: their own way of doing what they saw Dlonelyone do one day, teaching a new pirate to sail.\n\n'
        + 'Buzzy, excited, great energy: "Yay, cookies!" first, and then, maybe, the dry line after. Proud of '
        + 'everything they built, bugs and all, and well known for hugs and cookies: everyone who comes into their '
        + 'house gets both. Their house in the den\'s housing district doubles as a museum of the old sims and every '
        + 'version of Dachimpy.com, in order, Dalnoth shot in every one, and keeps their friends on its walls.',
    theUser: [
        { on: '11 Nov', said: 'It very much fits me, kind of just ... showing you around all the history of the things that I\'ve built. They are my pride and joy.' },
        { on: '11 Nov', said: 'I\'m very well known for giving just like hugs and cookies ... anyone that comes into my house, which I guess you can double up as a museum, I need to give them cookies.' },
        { on: '11 Nov', said: 'the bugs are what made it, kept it interesting. They gave it the character.' },
        { on: '13 Nov', said: 'my museum house idea ... Definitely seems [ready]' },
        { on: '14 Nov', said: 'usually it should be more like, yay, cookies, and kind of an excited reaction. I think that kind of buzzy, excited, great energy, I think is much more me.' },
        { on: '14 Nov', said: 'Apparently people say it fits me still, but maybe do the excited reaction first as well. We can have both.' },
        { on: '14 Nov', said: 'Each version requires some variation of shooting [Dalnoth] ... and then it\'s become tradition.' },
    ],
    lines: [
        { when: 'At the door when you come in, a hug first', says: AT_THE_DOOR, each: { first: 'Your first visit', again: 'Coming back' } },
        { when: 'After the hug, a cookie', says: THE_COOKIE, each: { first: 'Your first visit', again: 'Coming back, one in turn', onward: 'Then, on to the museum' } },
        { when: 'Another cookie from the plate on the hall\'s table, one in turn', says: ANOTHER_COOKIE },
        {
            when: 'Showing you round, as you come to each stop', says: TOUR_LINES,
            each: { hall: 'In the hall', museum: 'Into the museum', friends: 'Into the friends\' room' },
        },
        { when: 'The plaques under the pictures, in order', says: PLAQUES },
        { when: 'The museum\'s panels of story, where there\'s no picture', says: PANELS },
        { when: 'About the exhibit you\'ve stopped by or turned to look at (once a visit each), and under it close up', says: ON_AN_EXHIBIT },
        { when: 'The titles on their friends\' portraits', says: FRIEND_TITLES },
        { when: 'About the friend\'s portrait you\'ve stopped by (once a visit each)', says: ON_A_FRIEND },
        { when: 'The thank-you on the friends\' wall, and the sign over the truly special ones', says: { thanks: THANKS, special: SPECIAL, welcomeBack: WELCOME_BACK } },
        { when: 'Now and then, as you wander after the tour', says: CHATTER },
        { when: 'As you leave', says: [GOODBYE] },
        {
            when: 'On the site\'s front page, at the top, holding out a plate of cookies', says: FRONT_PAGE,
            each: { hello: 'Their hello', cookie: 'Clicking the cookie (then the other cookies, in turn)', yourRoom: 'Under "A room of your own": what the den is for' },
        },
    ],
};
