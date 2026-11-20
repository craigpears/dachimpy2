/** In the hut, at her star table: over her head as things happen. */
export const WOLF_DEN = {
    hello: 'Oh, hi! Come in, come in. Cookie? They\'re choc chip. Pull up to the table, the stars won\'t chart themselves.',
    again: 'You\'re back! I saved you a cookie. Mostly.',
    table: 'Four rings here, not three. The outer one\'s for parking stars, to set up chains.',
    half: 'Half the pack turned back already. You got this!',
    last: 'That\'s the last of them, back to wolf-kin! Moon\'s down. Cookie to celebrate?',
    rise: 'Uh oh, here comes the next pack. Back to the stars!',
    chain: 'A chain! See the next one\'s centre? All wild. Any star will do.',
    plain: 'Charted! Finish the next one with a chain, it\'s worth way more.',
    booch: 'Oops, booched it. Happens to everyone. Deep breath, keep going.',
    bye: 'Bye! Take a cookie for the road.',
};
/** Her opening, a little cutscene the first time you come in (src/den-wolfden.ts's OPENING, by `say`): at her star
    table, spinning the wheel frantically to stop the werewolves coming as the moon wanes; then she sees you. */
export const OPENING = {
    frantic: 'No no no no, not tonight! Chart, chart, chart!',
    spin: 'Come on, little stars... Double! Where\'s my yellow?!',
    waning: 'That\'s it, that\'s it... back to wolf-kin, all of you!',
    phew: 'Phew. Oh! Hi! Didn\'t see you there. Cookie?',
    after: 'They\'ll be back at moonrise. There it goes. Pull up to the table, I\'ll show you how it\'s done.',
};
/** Her lesson's opening choice and its words (src/wolf-den-tutorial.ts; js/tutorial-choice.js draws it). */
export const TUTOR = {
    hello: 'A wolf den\'s Navigation isn\'t the one you know. Let me show you.',
    basics: { asks: 'Or what\'s different here?', then: 'What\'s different, then. Which bit?' },
    mechanics: { asks: 'Want to see how it works? Umami\'s run, from his replay, a step at a time.', then: 'Umami\'s run, then. Space for each step.' },
    quick: { asks: 'Or speed nav? The quick double. Nice and simple, and you can do it every time.', then: 'The quick double, then. Space for each step.' },
    tricks: { asks: 'Or the chains that pay?', then: 'Chains! Pick one.' },
    fun: { asks: 'Or a fun one? Umami\'s evil constellation.', then: 'Evil, this one. Watch.' },
    show: 'This one\'s {title}. I\'ll set it up, you watch the board.',
    after: 'Your board now. I\'ll be right here with the cookies.',
    afterNote: 'Chart what you can: each constellation turns werewolves back. T for her lessons again.',
    walked: 'Your board now, those four wild targets and all. Any star fills them. Cookie while you think?',
    walkedNote: 'Space drops, arrows turn. T for her lessons again.',
    quickWalked: 'Your board now. Build a layer of three, line two up outside, spin. Quick as you like. Cookie?',
};
/** What she says as she plays a lesson's board, by the board (src/den-wolfden.ts's BOARDS) and her cue on it (its
    CUES: 'set' as it's laid, `move<n>` before its nth move, `step<n>` as the cascade's nth clear or chart shows, 'wild'
    as slots go wild, 'chart', 'deal' as the next constellation goes up, 'end'). The places she talks of at 'set' are
    ringed on the board. "Wild target": YPPedia's word (the user, 15 Nov). */
export const LESSON = {
    replay: {
        set: 'This is Umami\'s run, from his replay. Three targets filled, but there\'s a blue in the orange one, top middle. Two whites round the centre, two reds beside the orange. He drops one white...',
        step1: 'Single! Plus 3. Three whites, gone. And the red above the first one falls in, beside the two reds...',
        step2: 'Double! Plus 6.',
        wild: 'See the top target? Every colour now. A clear in a combo turns the targets beside it wild, so that blue counts.',
        step3: 'Triple!',
        chart: 'Constellation! 71, times three: 213. For one white.',
        deal: 'And the next one comes up with four wild targets in the centre. Two clears before the chart did that.',
        end: 'Single, Double, Triple Constellation. That\'s the trick: end a cascade on the constellation.',
    },
    quick: {
        set: 'Speed nav. A layer of three: two whites on the third ring, the gap beside them, and the yellow target under the top one. Out on the outer ring, two lined up: a white, then a yellow behind it.',
        move1: 'Spin the outer ring. Over full spokes, they just wait.',
        move2: 'Once more, and the white\'s over the gap...',
        step1: 'Single! Three whites, gone. And the yellow\'s right over the target they left...',
        chart: '...Double! Constellation! 71, times two: 142. Two turns.',
        deal: 'And the next one\'s up, its centre wild from the chain.',
        end: 'That\'s the quick double. You don\'t need triples, just be quick: build the layer, line two up outside, spin.',
    },
    cascade: {
        set: 'Cascades first. See the two reds round the third ring, and the stars waiting up top? One red dropped, and watch what it sets off.',
        step1: 'Single! Three reds. And the blue that was waiting over them falls in...',
        step2: '...right between two blues. Double!',
        wild: 'And see those slots go every colour? A clear in a combo turns the slots on it and beside it wild. Any star fills a wild target.',
        step3: 'Triple! The yellow fell onto two yellows.',
        end: 'Three, six, nine. That\'s all lines are worth, even in a cascade. What pays is the constellation at the end of one.',
    },
    outer: {
        set: 'The fourth ring, out on the handles. It has no slots of its own: it\'s where stars wait. That yellow slot\'s the last one, under two whites.',
        move2: 'See? It stays up there, over a full spoke. And it turns with its ring, so I can carry it round.',
        move3: 'Now it\'s over the yellow slot\'s spoke. Turn the third ring, and its white lands on the two whites.',
        step1: 'Single! The whites go, and down comes the yellow...',
        chart: '...into its slot. Constellation! On the second step, so double: 250.',
        deal: 'And up goes the next one. Three in the centre, two in the middle, one in the third. Charted in a chain, so its centre\'s all wild.',
        end: 'Park a star up top, clear under it, and it drops in. The fourth ring\'s for setting that up.',
    },
    lastClear: {
        set: 'Same cascade as before, but now only one slot\'s left: that orange one in the third ring, with a blue in it. And the yellow waiting over it.',
        step1: 'Single...',
        step2: 'Double! The blue\'s gone with them...',
        wild: '...and its slot went wild. The yellow will do.',
        chart: 'Triple! Constellation! 125, times three.',
        deal: 'Two clears before it, so the next one gets a fourth wild target in the centre.',
        end: '375 for one red dropped. A line\'s 3. So every cascade you build, end it on the constellation.',
    },
    evilTry: {
        set: 'Now, an evil one. Made with Umami in mind: six reds side by side, round the centre. Let\'s fill it a star at a time.',
        step1: 'Gone! Five reds in a row is a line, and lines go.',
        end: 'Any way you fill it one at a time, three end up side by side first, and poof. It only goes in a combo.',
    },
    evil: {
        set: 'So: whites in the two gaps. A white over each in the third ring, reds waiting over those, and a white beside each in the middle. One turn of the middle ring.',
        step1: 'Both whites\' spokes go at once...',
        chart: '...and both reds land together. Constellation! Double, too: 486.',
        end: 'Most people booch it trying. You didn\'t. Well, I didn\'t. Cookie?',
    },
    trapdoor: {
        step1: 'The reds go...',
        chart: '...and the yellow waiting above drops into its slot. Double!',
    },
    echo: {
        chart: 'Charted first...',
        step2: '...then the blue falls between two blues. The next one\'s centre goes wild.',
    },
};
export const CHARACTER = {
    name: 'Multibella',
    who: 'She teaches the wolf den\'s four-ring Duty Navigation at the star table in her hut, on an island of her own '
        + 'off to the right of the den. A real Puzzle Pirates pirate (Multibella of Emerald), drawn from her portrait: '
        + 'smiling, wavy blonde hair, a magenta tricorne edged in gold, a magenta vest with gold buttons over a rose '
        + 'shirt, magenta trousers and boots, and Divergent, her parrot, light blue and pink, on her shoulder.\n\n'
        + 'Kind and practical, and encouraging ("You got this!"): the one who explained the wolf den\'s wild targets. She '
        + 'helps you set a chain up, then munches chocolate chip cookies while you finish it.',
    theUser: [
        { on: '11 Nov', said: 'Multibella is very sweet as well' },
        { on: '14 Nov', said: 'everyone loves cookies, so [Multibella] can be munching on choco chip cookies while they wait for you to finish what they\'ve helped you set up' },
        { on: '14 Nov', said: 'Thought the plan was for her to do the wolf den tutorial and would expect her to have her own island similar to others' },
    ],
    lines: [
        {
            when: 'In her wolf den\'s hut, at the star table (four-ring Duty Navigation)', says: WOLF_DEN,
            each: {
                hello: 'You come in, the first time',
                again: 'You come in again',
                table: 'You first step up to the table',
                half: 'Your charts turn half the pack back',
                last: 'Your charts turn the last werewolf back: the moon\'s gone',
                rise: 'A moment later: the moon\'s full again',
                chain: 'You chart a constellation in a chain',
                plain: 'You chart one with no chain (now and then)',
                booch: 'You booch',
                bye: 'You leave',
            },
        },
        {
            when: 'Her opening, the first time you come in: a little cutscene', says: OPENING,
            each: { frantic: 'At her star table, spinning the wheel frantically, the werewolf at the window', spin: 'Close on the wheel, rings flying round', waning: 'The moon waning in the window, the werewolf turning back', phew: 'She stops, and sees you', after: 'Once it\'s over: the moon rising again' },
        },
        {
            when: 'Her lesson\'s opening choice, at the star table (it pops up as you sit; T)', says: TUTOR,
            each: { hello: 'Her opening line', mechanics: 'Her first question, and once it\'s picked', basics: 'Her second, and once it\'s picked', tricks: 'Her third, and once it\'s picked', quick: 'Her speed nav question, after how it works, and once it\'s picked', fun: 'Her last, and once it\'s picked', show: 'As a lesson\'s board is laid, when it has no words of its own ({title} its name)', after: 'Handing you the board', afterNote: 'Under it, in the bar', walked: 'Handing you the board after Umami\'s run, its four wild targets up', walkedNote: 'Under it, in the bar', quickWalked: 'Handing you the board after the quick double' },
        },
        {
            when: 'Her lesson, as she plays each board at the star table: as it\'s laid, before a move, as each clear or chart of a cascade shows, as slots go wild, as the next constellation goes up, and at the end',
            says: LESSON,
            each: {
                replay: 'How it works: Umami\'s run, from his replay, a beat at a time (Space for each)',
                quick: 'Speed nav: the quick double, a layer of three and two lined up on the outer ring, a beat at a time (Space for each)',
                cascade: 'A cascade, lines only, making wild targets',
                outer: 'The fourth ring: a star waiting up there, carried round, dropped in by a clear under it',
                lastClear: 'A constellation charted by a cascade\'s last clear',
                evilTry: 'Umami\'s evil constellation (a fun one), a star at a time',
                evil: 'Umami\'s evil constellation, filled by a combo',
                trapdoor: 'The Trapdoor',
                echo: 'The Echo',
            },
        },
    ],
};
