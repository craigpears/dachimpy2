/** As you arrive, before you've chosen a tone (the user, 11 Nov: "opening more with a cutscene where
    ... she explains to you what it is and what's going on"): her greeting, what this is, and her
    question, the tone's choice. Her voice, not yet either tone's. */
export const ARRIVE = [
    "Ahoy! Welcome to my isle! Mind the crabs, they're guests too.",
    'This is my wedding venue. Pirates sail in from all over the Ocean to get hitched here.',
    'First things first: what sort of wedding are we having?',
];
/** Her welcome once you've chosen the tone: the venue as she left it, what you do here, and her
    question. Giggly and romantic, or not in the least bothered by the blood and guts. */
export const WELCOME = {
    happy: [
        "Ooh, happy and cheesy! Roses, ribbons, the lot. I've done six today, just for the fun of it!",
        "You plan it your way: who, where, the look, and how it goes. I'll help. Then it plays out, and you get a portrait!",
        'So! How are you? Would you like to get married?',
    ],
    dark: [
        "Ooh, dark humour! Don't mind the blood and guts. The last wedding went a bit... bloody and gory.",
        "It's fine. Six weddings today, and only the one got raided. We've hired a bit of extra security.",
        "You plan it your way: who, where, the look, and how it goes. Then it plays out, and you get a portrait. Mop's in the corner.",
        'So! How are you? Would you like to get married?',
    ],
};
/** Back again, a wedding already planned (kept in this browser, or a share link): a shorter welcome,
    after her line for coming back (GUSH back, shared). */
export const RETURN = {
    happy: ["Carry on where you left off. Who, where, the look, how it goes: I'll be right here!"],
    dark: ["Carry on where you left off. I'll be right here. With the mop."],
};
/** Her reactions as you plan: gushing, giggly, delighted with whatever you do (never "wrong"), and
    funny about herself without ever running herself down (the user, 11 Nov: "more humorous about
    [her], but not negative ... 'she's nearly always free' ... that feels mean"). A pool is the same
    in both tones, or one for each. And she's the host, not the show (the user, 11 Nov: "she's just
    the facilitator for this wedding mechanic. I don't want this to be a [Mischievious] show, but it
    still needs a bit of fun and personality. And Puzzle Pirate personality ... rather than specific
    people"): chattery Puzzle Pirates banter, little about her own love life. */
export const GUSH = {
    ask: { happy: ['Me, perhaps? I do make a gorgeous bride. Hee hee!', 'Me, perhaps? I\'ve the dress on already!'], dark: ['Me, perhaps? I\'ve a dress that\'s hardly been bled on.', 'Me, perhaps? I\'ve had the veil cleaned. Mostly.'] },
    her: { happy: ['Me? Oh, you charmer! Yes! Yes yes yes!', 'I knew you\'d ask! I\'ve had the dress on since Tuesday.'], dark: ['Me? Oh, you brave thing! Yes!', 'Lovely. I\'ll have security stand a bit closer this time.'] },
    version: ['Ooh, that one\'s my favourite!', 'Good choice. I look fabulous in that.', 'This old thing? Hee hee!', 'Twirl! Did you see me twirl?'],
    bachelors: ['Here are your bachelors!'],
    suitor: ['Ooh, good choice! I\'d have picked them too.', 'A match made in the Ocean!', 'They\'ll scrub up lovely.', 'Eee! I love them already!'],
    suitorOne: { happy: ['Sweet William! He\'s an absolute poppet.'], dark: ['Barnaby! He\'s had a lie down and everything.'] },
    own: ['Someone of your own! How mysterious. I love it.', 'Ooh, who\'s this? They\'re gorgeous!', 'Oh, I like them. I like them a lot.'],
    // (Each with her memory of one of today's weddings: TODAY, in src/den-wedding.ts.)
    venue_beach: ['The beach! Sand between your toes. Perfect.', 'Ooh, the sea breeze in your hair!', 'My first today was on the beach. Roses everywhere!'],
    venue_chapel: ['The old chapel! So romantic. Mind the drop.', 'Up on the cliff! You can see half the Ocean from here.', 'I\'ve had two up there today! The raiders came to one. The other made me cry.'],
    venue_deck: ['A ship\'s deck! How very piratey of you.', 'On the deck! We can sail off on honeymoon straight after!', 'My third today was on that deck. Mind the cake.'],
    theme_rosy: ['Happy and rosy! Pink everywhere! I could burst!', 'Roses! I adore roses.', 'Just like my first today! Roses all down the aisle.'],
    theme_gory: { happy: ['Bloody and gory! Ooh, daring. I love it.', 'Like my second today! That one went a bit red.'], dark: ['Bloody and gory! Saves on tidying up, really.', 'Red goes with everything. Especially blood.', 'Like my second today! The raiders saw to the red.'] },
    theme_drunk: ['A drunkards\' fest! Grog for everyone!', 'Barrels! Lovely, lovely barrels.', 'I\'ve had the inn send over every drop they\'ve got.', 'Like my third today! Grog in the punch, grog in the cake.'],
    // (Showered in gifts, 12 Nov, Mischievious herself: "she does think it's all about her": a bit delusional, sure
    //  half the presents are hers, and happy to be the one wanting lots more)
    theme_gifts: ['Showered in gifts! My favourite. The planner gets first pick, you know.', 'A present in every hand! Is that one for me? It looks like it\'s for me.', 'Like my fifth today! Most of those presents were for me, I\'m nearly sure.'],
    plot_sweet: { happy: ['Sweet and blissful! Oh, I\'m welling up already.', 'My last today went just like that. I cried!'], dark: ['Sweet and blissful? Ooh, that\'d make a change.', 'My last today went just like that. Made a nice change!'] },
    plot_raiders: { happy: ['Raiders! How exciting! Good thing I hired security.', 'Like my second today! They came right up the aisle.'], dark: ['Raiders! Just like last time. I\'ll tell the guards.', 'Like my second today! They came right up the aisle.'] },
    plot_drunk: ['Somebody\'s drunk! There\'s always one. Hee hee!', 'Hee hee! I\'ll put the cake somewhere safe. Or not.', 'Like my third today! Face first in the cake.'],
    plot_brawl: { happy: ['A brawl? Ooh, a lively one!', 'Like my fourth today! Benches everywhere. Lovely day, though.'], dark: ['A brawl! Proper wedding, that.', 'Like my fourth today! Benches everywhere. Lovely day, though.'] },
    plot_gifts: { happy: ['Everyone brought a present! I\'ll mind the shiny ones for you. Forever.', 'Like my fifth today! We dug the couple out. I kept the good ones.'], dark: ['Everyone brought a present. Let\'s hope none of them ticks. I\'ll open mine first.', 'Like my fifth today! We dug the couple out. After I\'d had my pick.'] },
    add: ['More! More is always better.', 'Oh, that\'s gorgeous there.', 'Yes! Just there!', 'Ooh, I wouldn\'t have thought of that!', 'Straight from the furnisher\'s, that!'],
    move: ['Ooh, much better there.', 'Perfect! Well, nearly perfect. No, perfect!', 'Yes, yes, yes! There!', 'Oh, that\'s much more you.'],
    turn: ['Ooh, a different angle!', 'Twirly! I love it.'],
    colour: ['That colour! Swoon.', 'Oh, it matches! Or clashes. I love it either way.', 'Gorgeous. Simply gorgeous.', 'Ooh, a pricey dye, that. Worth every doubloon.'],
    remove: ['Gone! Never liked it anyway.', 'Less is more. Sometimes. Hee hee!', 'Room to dance!'],
    dress: ['Oh, they look divine!', 'Stunning! Absolutely stunning!', 'Fit for the Governor\'s ball!', 'Fresh from the tailor, that.', 'Fabulous! Twirl for me!'],
    // (How many come, a guest moved, a fresh crowd: 11 Nov.)
    size_cosy: ['Cosy! Just the nearest and dearest. More cake each.'],
    size_small: ['Just the crew! Everyone gets a good view.'],
    size_big: ['A big one! The whole flag\'s coming. Best hats on!'],
    size_large: ['Ooh, a crowd! I\'ll have the inn brew more grog.'],
    size_grand: ['Half the Ocean! I do hope the island doesn\'t tip over.', 'Everyone! Even a few from the next island over. Hee hee!'],
    guest_move: ['Ooh, they\'ll have a lovely view from there.', 'There! Perfect for the portrait.', 'Mingling! I love a mingle.'],
    crowd: ['A whole new crowd! Where do they all come from?', 'Fresh faces! Hello, everyone!'],
    // (Each new thing from the furnisher's, as it's put down; the plain 'add' lines the rest of the time.)
    add_chair: ['A chair! For the guest with the one good knee.'],
    add_throne: ['A throne! Fit for a Governor. Or for tired feet.'],
    add_feast: ['A feast! Roast boar, ship\'s biscuit, the works. I\'ll be having seconds.'],
    add_punch: ['Punch! It\'s mostly grog. Well, it\'s all grog.'],
    add_fountain: ['A rum fountain! The inn\'s going to be so jealous.', 'Rum on tap! Somebody fetch a bigger mug.'],
    add_candelabra: ['Candles on a stand! Very gothic. I love it.'],
    add_torch: ['A torch! Ever so romantic. Mind the veil.'],
    add_chandelier: ['A chandelier! Ooh, posh. Mind your heads.'],
    add_palm: ['A potted palm! Like the island\'s, only tidier.'],
    add_garland: ['A garland! It\'s like a hug made of flowers.'],
    add_petals: ['Petals! For throwing. Or for slipping on. Hee hee!'],
    add_rug: ['A rug! Wipe your boots, everyone.'],
    add_flag: ['Flags up! Let the whole Ocean know.'],
    add_statue: ['A statue! Ooh, very Governor\'s mansion.'],
    add_heart: ['A great big heart! Mine\'s gone all fluttery.'],
    add_chest: ['A treasure chest! For the presents. Or the doubloons. Ooh, both!'],
    add_gifts: ['Presents! Put the big ones by me. For safekeeping.'],
    add_piano: ['A piano! The shanty-singer knows three songs. Now he can play them louder.'],
    add_band: ['A band! There\'ll be dancing after. I\'ve my dancing boots on already.'],
    add_cannon: ['A cannon! For the salute. Boom! Hee hee!'],
    add_anchor: ['An anchor! For a couple who never want to leave.'],
    add_skulls: { happy: ['Skulls! Ooh, a bit spooky. I love it.'], dark: ['Skulls! Very tasteful. Nobody ask whose.'] },
    ready: ['Ooh, it\'s all ready! Shall we?', 'Everything\'s perfect. I\'m going to cry.'],
    back: ['You\'re back! I kept everything just as you left it.'],
    shared: ['Oh, this one! I remember this one. Shall we do it again?'],
    again: ['That was lovely. Shall we have another?'],
};
/** When each of her GUSH pools is said, for LINES.md. */
const GUSH_WHEN = {
    ask: 'Asking who you\'ll marry, after her welcome', her: 'You choose to marry her', version: 'You pick another of her looks',
    bachelors: 'The suitors walk in', suitor: 'You pick a suitor', suitorOne: 'You pick Bachelor number one', own: 'You choose someone of your own',
    venue_beach: 'You choose the beach', venue_chapel: 'You choose the clifftop chapel', venue_deck: 'You choose the ship\'s deck',
    theme_rosy: 'You choose Happy and rosy', theme_gory: 'You choose Bloody and gory', theme_drunk: 'You choose Drunkards\' fest', theme_gifts: 'You choose Showered in gifts',
    plot_sweet: 'You choose Sweet and blissful', plot_raiders: 'You choose Raiders crash it', plot_drunk: 'You choose Somebody\'s drunk', plot_brawl: 'You choose A brawl breaks out', plot_gifts: 'You choose Showered in gifts',
    add: 'You add a prop (one she hasn\'t a line of its own for, or has just said)', move: 'You move a prop', turn: 'You turn a prop', colour: 'You dye a prop', remove: 'You take a prop away', dress: 'You dress a guest',
    size_cosy: 'You choose Cosy', size_small: 'You choose Small', size_big: 'You choose Big', size_large: 'You choose Large', size_grand: 'You choose Grand',
    guest_move: 'You move a guest', crowd: 'You ask for a fresh crowd',
    add_chair: 'You add a chair', add_throne: 'You add a throne', add_feast: 'You add a feast table', add_punch: 'You add a punch bowl', add_fountain: 'You add a rum fountain',
    add_candelabra: 'You add a candelabra', add_torch: 'You add a torch', add_chandelier: 'You add a chandelier', add_palm: 'You add a potted palm', add_garland: 'You add a garland',
    add_petals: 'You add petals', add_rug: 'You add a rug', add_flag: 'You add a flag pole', add_statue: 'You add a statue', add_heart: 'You add a big heart',
    add_chest: 'You add a treasure chest', add_gifts: 'You add presents', add_piano: 'You add a piano', add_band: 'You add a band stand', add_cannon: 'You add a cannon',
    add_anchor: 'You add an anchor', add_skulls: 'You add skulls',
    ready: 'Everything\'s ready', back: 'Coming back to a wedding you were planning', shared: 'Opening a shared wedding\'s link', again: 'Planning another, after the portrait',
};
/** Things you can ask her while you plan, and what she says: chattery Puzzle Pirates banter, the
    wedding's and the Ocean's, not her own life (the user, 11 Nov: "Maybe it's that kind of
    interactive. You could ask her"). Same in both tones but where the tone gives her another answer.
    (The questions are yours, over your head, and the buttons in the planner's foot.) */
export const ASK_HER = [
    { q: 'How were today\'s weddings?', a: 'Six so far! Roses on the beach, raiders at the chapel, cake on the deck, a lovely brawl, a mountain of presents, and a sweet one to finish. Every one a treat!' },
    { q: 'Who\'s on the guest list?', a: 'Anyone with a clean shirt. Well, a shirt.' },
    { q: 'What\'s the dress code?', a: 'Whatever the tailor had in! Dyed to match, ideally. Black if you\'re showing off.' },
    { q: 'Who\'s paying for all this?', a: 'The crew\'s coffers, love. Don\'t tell the purser.' },
    { q: 'Is the cake safe?', a: { happy: 'Safer than a sloop in a sea battle!', dark: 'Safer than the last one. That one had a cutlass in it.' } },
    { q: 'What if raiders turn up?', a: { happy: 'Then the guards earn their doubloons. Hee hee!', dark: 'Then the guards earn their doubloons. And the mop earns its keep.' } },
    { q: 'Any advice?', a: 'Say "I do", not "Arr". People mix them up.' },
    { q: 'Can my familiar come?', a: 'Of course! Parrots in the front row. Monkeys at the back, near the cake.' },
    { q: 'Who\'s doing the music?', a: 'A shanty-singer from the inn. He knows three songs. All about the sea.' },
];
/** As you plan, when something won't go where you put it, and to move things along. `{theme}`: the
    theme she suggests, by name. */
export const PLANNER = {
    full: 'Ooh, it\'s full! Take something away first, and we\'ll squeeze it in.',
    onUs: 'Not on top of us, love! A bit further off.',
    taken: 'Ooh, something\'s there already! A little to the side?',
    noRoom: 'Ooh, no room beside it! Somewhere else, perhaps?',
    guestRoom: 'Somewhere with a bit more room, love!',
    who: 'Well? Who\'s it to be?',
    theme: 'Ooh, a theme! Shall we start from {theme}? Or anything you like!',
    plot: 'And how shall it go? I do love a bit of drama. Or none! Your choice.',
};
/** Her lines in the ceremony (its beats: src/den-wedding.ts, plotScript). Those she says as the
    officiant (`off`) a guard says instead when it's her you're marrying. `{partner}`: your
    sweetheart's name. */
export const CEREMONY = {
    places: 'Places, everyone! Ooh, I\'m going to cry.',
    beloved: 'Dearly beloved, we are gathered here today, on purpose...',
    calm: 'Nothing\'s gone wrong. Is that allowed?',
    security: 'Oh, not again. Security!',
    whereWereWe: 'Lovely. Now, where were we?',
    hadAFew: 'Oh dear. Somebody\'s had a few.',
    cake: '...and that\'s the cake.',
    down: '...and down they go.',
    benches: 'Not the benches! They\'re hired!',
    presents: 'Ooh, look at it all! Some of these must be for me.',
    stillThere: 'In there, you two? Pass me the gold one.',
    thankYous: 'Thank-you notes later. Mine first. Where were we?',
    doYou: 'Do you take {partner}, through bilge and broadside?',
    kiss: 'Then you may kiss!',
    love: 'Eee! I love weddings!',
};
/** At the den, married to her: what she says when you walk up to her (src/den-spouse.ts says when). */
export const AT_HOME = {
    aboard: 'Ooh, the honeymoon! Does she have a name? I\'ve brought cake.',
    den: [
        'So this is the den! I\'d put a garland on that wall.',
        'The furnisher\'s going to love this place. Hee hee!',
        'Mended walls, raiders on the beach... it\'s a bit like a wedding, really.',
        'I\'ve found a lovely spot for a band stand. Just saying.',
    ],
};
export const CHARACTER = {
    name: 'Mischievious',
    who: 'Host of the Wedding Isle, out at sea on the den\'s side of the checkpoint: she runs the wedding venue on '
        + 'her island and is always planning the next one. A real Puzzle Pirates pirate (Mischievious of Emerald, with '
        + 'the extra i), drawn from five of her portraits, and you choose which of her you\'d marry, each by its own '
        + 'title: "Son of a Nutcracker!", "What is Love?", "Taco Princess", "Wicked" and "Hotter Than Hell".\n\n'
        + 'Giggly, gushing, delighted with whatever you do: never a rule you can fail. Funny about herself, never '
        + 'mean about herself (the dress already on, "a dress that\'s hardly been bled on"). Cheeky, never dirty: a '
        + 'wink in a line about the furniture is the right amount. She\'s the host, not the show: her chatter is the '
        + 'wedding\'s and the Ocean\'s (the tailor, dyes and doubloons, the inn\'s grog, the furnisher, security '
        + 'earning their pay), not her own love life. She\'s been through six ceremonies today for the fun of it, '
        + 'each one of the wedding\'s own options, so her stories show you what you can choose.\n\n'
        + 'In Happy and cheesy she\'s all giggles and romance; in Dark humour, not in the least bothered by the blood '
        + 'and guts of the last wedding, with a bit of extra security hired and the mop in the corner.\n\n'
        + 'Marry her, and she comes home with you: aboard the sloop, then at the den.',
    theUser: [
        { on: '10 Nov', said: 'really go for it, really generate me a proof of concept for the whole thing ... the cheesy ending, pre-generated scenes ... on an island somewhere.' },
        { on: '10 Nov', said: 'Go through her portraits, so you could choose which version of [her] you would like to marry, or something silly' },
        { on: '11 Nov', said: 'we\'d rather be a lot more humorous about [Mischievious], but not negative. Like, I don\'t like where it says, oh, marry [her], she\'s free, she\'s nearly always free. Like, that feels mean.' },
        { on: '11 Nov', said: 'she\'s just the facilitator for this wedding mechanic. I don\'t want this to be a [Mischievious] show, but it still needs a bit of fun and personality. And Puzzle Pirate personality, though, especially, rather than specific people. There\'s the balance.' },
        { on: '11 Nov', said: 'I love ... the more funny lines where she\'s got, oh, yes, yes, right there, when you placed some of the furniture, I guess it gets her kind of promiscuous side in without it being overly, yeah, but dirty.' },
        { on: '11 Nov', said: 'showing that ... you can keep doing it for fun all the time ... not in a promiscuous way, but in a this is a fun game' },
        { on: '11 Nov', said: 'she\'s a primary character, but not the star of the show.' },
        { on: '12 Nov', said: 'you don\'t want her to seem demanding, but just make it fun ... maybe it can fit into the thing of like a wedding theme with lots and lots of gifts.' },
        { on: '12 Nov', said: 'Mischievous is correcting ... maybe she\'s a bit delusional, but she does think it\'s all about her. So I think she is happy with being a bit more attention-seeking and being the one wanting lots more gifts.' },
    ],
    lines: [
        { when: 'As you arrive, close on her: her greeting, what this is, and the tone\'s choice', says: ARRIVE },
        { when: 'Her welcome, once you\'ve chosen the tone', says: WELCOME, each: { happy: 'Happy and cheesy', dark: 'Dark humour' } },
        { when: 'Back again, a wedding already planned (after her line for coming back)', says: RETURN, each: { happy: 'Happy and cheesy', dark: 'Dark humour' } },
        { when: 'Her reactions as you plan (never the same line twice running; a pool for each tone where it splits)', says: GUSH, each: GUSH_WHEN },
        { when: 'Asked things as you plan (your question, then her answer)', says: Object.fromEntries(ASK_HER.map((x) => [x.q, x.a])) },
        {
            when: 'As you plan, when something won\'t go, and moving things along', says: PLANNER,
            each: {
                full: 'Adding a prop when there are as many as there can be', onUs: 'Putting a prop on her, the couple or the guards',
                taken: 'Putting a prop where another stands', noRoom: 'No room for another beside the one you picked',
                guestRoom: 'Letting go of a guest where there\'s no room', who: 'The suitors have all said their piece',
                theme: 'On to the theme, none chosen yet', plot: 'On to how it goes',
            },
        },
        {
            when: 'The ceremony', says: CEREMONY,
            each: {
                places: 'Everyone seated (as the officiant)', beloved: 'The vows begin (as the officiant)',
                calm: 'Sweet and blissful: after the vows', security: 'Raiders crash it: the fight', whereWereWe: 'Raiders crash it: cleared (as the officiant)',
                hadAFew: 'Somebody\'s drunk: staggering about', cake: 'Somebody\'s drunk: face first into the cake', down: 'Somebody\'s drunk: down they go, with no cake to fall in',
                benches: 'A brawl breaks out', presents: 'Showered in gifts: the guests filing up with their presents',
                stillThere: 'Showered in gifts: the couple buried in them up to the neck (as the officiant)', thankYous: 'Showered in gifts: the pile topples (as the officiant)',
                doYou: '"I do" (as the officiant)', kiss: 'The kiss (as the officiant)', love: 'The cheer',
            },
        },
        {
            when: 'Married to her, at home (whoever you married comes home with you, 11 Nov)', says: AT_HOME,
            each: { aboard: 'Coming aboard the sloop with you, off her isle', den: 'Walking up to her at the den' },
        },
    ],
};
