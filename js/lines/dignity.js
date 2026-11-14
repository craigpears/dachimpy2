/** Her cutscene, the first time you sail up to her checkpoint from the cove's side. */
export const SCENE = {
    halt: 'Halt! Imperial checkpoint. State your busi...',
    oh: '...oh. Pirates. It\'s always pirates.',
    lively: 'Look lively! And do try to hit them this time.',
    giggle: 'Hee hee! Oops. That was a warning shot. Mostly. Come any closer and the next ones won\'t be.',
};
/** Over her head as things happen, after her cutscene: each said once. */
export const LATER = {
    closer: 'One more stroke and I\'ll have to shoot. There\'ll be paperwork. I hate paperwork.',
    wrecked: 'That was Imperial property!',
    passed: 'This is going in my report. In very small, very cross handwriting.',
    canal: 'Nobody uses the canal. Nobody!',
};
/** Helium's rum run (src/den-rumrun.ts): watching from her gate as you sail by with a deck of barrels, Helium
    whistling. One a pass, in turn. */
export const RUM_RUN = [
    'Barrels. And whistling. It\'s always the whistling.',
    'I\'m writing down "whistled". In very small, very suspicious handwriting.',
    'That sloop is lower in the water than she was. Hm.',
];
/** The wolf den's hut (src/den-wolfden.ts), her star table: she charts the stars to find the ways pirates sneak round
    her outpost, and at a wolf den's table, they turn its werewolves back. Over her head as things happen. */
export const WOLF_DEN = {
    hello: 'Oh. It\'s you. Sit down, then. If I\'m to catch pirates sneaking round my outpost, I need someone who can read stars.',
    again: 'Back again? The moon isn\'t going to chart itself.',
    table: 'Four rings here, not three. The outer one has no places of its own. It\'s for parking stars. Officially.',
    half: 'Half of them turned back already. I\'m writing that down. In very neat handwriting.',
    last: 'That\'s the last of them back to wolf-kin. Moon\'s down. Nobody tell the Empire I was out here.',
    rise: 'And here comes the next pack. Of course it does.',
    chain: 'A chain! The next one\'s centre has gone wild. Don\'t waste it.',
    plain: 'Charted. No chain, though. That\'s going in my report.',
    booch: 'You booched it. I\'ll need that in writing.',
    bye: 'Off you go. Mind the werewolves. And the paperwork.',
};
/** Her lesson's opening choice and its words (src/wolf-den-tutorial.ts; js/tutorial-choice.js draws it). */
export const TUTOR = {
    hello: 'Right. A wolf den\'s Navigation isn\'t the one you know.',
    basics: { asks: 'Shall I start you on what\'s different here?', then: 'What\'s different, then. Which bit?' },
    tricks: { asks: 'Or the chains that pay?', then: 'Chains. Pick one.' },
    run: { asks: 'Or shall I play you a run, start to finish?', then: 'A run, then. Watch closely.' },
    show: 'This one\'s {title}. Watch the board.',
    after: 'Your board now. I\'ll be here. Taking notes.',
    afterNote: 'Chart what you can: each constellation turns werewolves back. T for her lessons again.',
};
export const CHARACTER = {
    name: 'Dignity',
    who: 'The imperial checkpoint\'s dutiful commander, peering down from the top of its gatehouse, the '
        + 'Empire\'s flag behind her. A real Puzzle Pirates pirate (Dignity of Emerald), drawn from her portrait: '
        + 'smiling, wavy blonde hair, an eyepatch, a dusky purple Buccaneer jacket, a brass spyglass in her hand, '
        + 'and Bella, her lavender monkey, on her shoulder.\n\n'
        + 'Witty, very cute, and a stickler for the rules (she hates paperwork, and writes very cross reports). '
        + 'Pirates are always a disappointment to her. She sends Bella to fire the warning shot, and giggles '
        + 'at it.',
    theUser: [
        { on: '10 Nov', said: 'adding [her] as the dutiful commander of the imperial checkpost, kind of peering down from the gates ... give her a little cutscene similar to Dalnoth ... come up with something witty for her' },
        { on: '10 Nov', said: 'I need to give it a bit of a cheeky giggle and a win' },
        { on: '10 Nov', said: 'we\'ve really got to go all in with Dignity\'s little cutscene. She\'s got to be very cute.' },
        { on: '10 Nov', said: 'I love it. The cheeky giggle and the spyglass, definitely complete it.' },
    ],
    lines: [
        {
            when: 'Her cutscene, the first time you sail up to her checkpoint', says: SCENE,
            each: {
                halt: 'Lowering her spyglass: she\'s seen you',
                oh: 'A hand to her forehead',
                lively: 'To Bella, pointing her spyglass at you',
                giggle: 'The warning shot just missed you: a hand to her mouth, then wagging her spyglass at you',
            },
        },
        {
            when: 'Later, over her head as things happen (each said once)', says: LATER,
            each: {
                closer: 'You come one stroke short of her guns\' first mark',
                wrecked: 'You wreck one of her guns',
                passed: 'You get through her gate, either way',
                canal: 'You come out round her by the locks (even if she never saw you sail up)',
            },
        },
        { when: 'Helium\'s rum run: you sail by her gate with a deck of barrels, Helium whistling (one a pass, in turn)', says: RUM_RUN },
        {
            when: 'The wolf den\'s hut, at her star table (four-tier Duty Navigation)', says: WOLF_DEN,
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
            when: 'Her lesson\'s opening choice, at the star table (T)', says: TUTOR,
            each: { hello: 'Her opening line', basics: 'Her first question, and once it\'s picked', tricks: 'Her second, and once it\'s picked', run: 'Her third, and once it\'s picked', show: 'As a lesson\'s board is laid ({title} its name)', after: 'Handing you the board', afterNote: 'Under it, in the bar' },
        },
    ],
};
