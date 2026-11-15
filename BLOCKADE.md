# Blockades: the design

A proof of concept on the unlinked `blockade-test.html` (15 Nov). Its rules are `src/blockade.ts`, its bots
`src/blockade-bots.ts`, every ship's damage `src/ship-damage.ts`, the imperial gate `src/imperial-gate.ts`, each
ship's handling `src/ship-handling.ts`, each kind of ship's chart of the board (her moves worked out once, and how far
to anywhere) `src/hull-chart.ts`. Its 3D is `js/den/blockade.js`, the gate's `js/den/gate-look.js` and the
damage's `js/den/ship-damage.js`. Tests: `tests/blockade.test.ts`, `tests/ship-damage.test.ts`,
`tests/ship-handling.test.ts`, `tests/hull-chart.test.ts`.

## 1. What was asked (15 Nov)

- "Go study blockading and how blockade boards look, because I think we're ready to do a nice kind of blockading
  concept here, where you've got sideways for the sloops and you've got a few bots ... competing, trying to get to the
  points. The [war frig] bots are there trying to blast their way through while the sloops are more nimble, taking
  the shortcuts, taking those sideways in, just like winds and things now. Keep it like relatively close. Don't do
  all like the new mechanics ... I want to get ambitious now."
- The imperial gate: "the sloop can run through it. The ship, the war frig has to shoot through it because there's
  only one tile of ... canal between the Imperial Gate ... It's a way of naturally delaying the war [frigs]. Like,
  they have to go through a shooting destruction phase before they can get into the heart and center of the board."
- Side ways: "only the sloops can really get to on those fast little winds."
- Damage: "as it starts getting chipped away or shot, damage goes up, and you should visibly start seeing some holes
  and bilge appear ... a few like carpentry bots on board the [war frig], slowly repairing or bilging out ... I want
  the war frig to feel alive and look alive ... a ship full of people puzzling ... see a hole and see an explode or
  bang and a hole appear in the side of the war frigate as I shoot it, and for it to appear where I've shot it. I
  want to shoot the sloop from the war frigate and see it just go dead in the water ... they then have to sit there
  and rebuild."
- Handling: "I want the big ships to feel clumsy. They're powerful but clumsy." Her moves as big as her turn, her
  turns of moves fewer: "slower to react". And the sloop's speed from the sea, not her moves: "getting in there faster
  comes from the opportunities you have to go take [winds] that the [war frig] doesn't have access to."

## 2. Puzzle Pirates' blockades, as researched (YPPedia)

- A blockade board is a big sea battle board: rocks, winds, whirlpools, and buoys.
- A buoy has one, two or three pennants: that many points each turn. At the end of a blockade turn, a buoy in the
  influence circle of one side's ships only scores that side its pennants; both sides' circles reach it, it's
  contested and scores nobody; nobody's, its flags are yellow. Bigger ships have bigger circles.
- Rounds are won on points, not sinks (sinks matter only in a sinking blockade, or a long war).
- Damage: a war frigate's full damage is 15 large, 20 medium or 30 small shots. Damage fills the bilge faster, and
  water slows her (her move tokens come more slowly). Carpentry takes damage off and slows the water coming in.

## 3. What's built (15 Nov, the second pass: "blockading is a bit more epic")

- More asked: "just to be clear, this should be like the race where you see ... the little pirates on each ship ... a
  bigger team ... a good handful of sloops each side and ... three or four [war frigs] ... coming from different
  directions ... Some ocean, some island, so you should be able to just spectate and watch, and I want it to really
  showcase each of those mechanics ... sloops hiding out, sometimes coming out ... while [war frigs] are having a fight
  to land a few pot shots."
- **The board** (`BLOCKADE`): 44 by 36 squares. Each side three war frigates and five sloops, coming in from two edges
  of its own: Dachimpy's flag from the south and west (Primates Rule, Coral Throne the Atlantean, Golden Grin; Lucky
  Banana, Grin and Bear It, Cheeky Monkey, Bananarama, Coconut Shy), Dalnoth's from the north and east (Iron Pride,
  Eldritch Wail the ghost ship, Crimson Tide; Red Wake, Smoke and Mirrors, Scarlet Fever, Blood Orange, Rust Bucket).
- **The heart, a walled fort in the middle**, two deep, with four ways in:
  - **an imperial gate** in its south wall and another in its north: its way one square wide under its arch, a
    tower two squares wide either side, four bastion guns on the wall (doubled, 15 Nov: below). The sloops run
    straight through; a frigate lies broadside to a tower and shoots it down (6 large shots, both of each broadside
    on it: three broadsides), and then the way's three wide for anyone. A gate's guns paint a target on the square of the nearest ship in
    their reach and fire, the shot `GATE_AIM` (2.4 s) coming down, drawn as a red ring filling on the water, over any hull
    (15 Nov: "paint a target on a square and then just take quite a while to fire ... a sloop will move quickly before it
    shoots. But for a [war frig] ... that's basically an entire turn, so they can't dodge it"): a sloop's move is a
    second, a frigate's two and a half, and her hull four squares long; and once the gate's fired on, on whoever's in reach at all (the gate's medium shot's
    damage); any ship's hits quieten one, three wreck it;
  - **a side way** through its west wall and its east: a one-square gap with a wind blowing in through it from the
    open sea. A sloop on it is carried through, fast; a frigate rides the winds out (and wouldn't fit anyway).
- **Islands** (as first built): four out on the open sea, sand and grass and palms, each with a cove a sloop hid in.
  Gone (15 Nov: "Those big ones ... with the cove inside them are not really doing anything ... maybe you just have a
  tiny little island with a buoy in the middle"): the reef lagoons below took their place, each with a tiny island by
  its buoy and the sloops' hiding place in its far corner. Each side's corner of the sea is somewhere to lie out of the
  fighting too, when the lagoons are full.
- **Buoys**: in the heart two two-pennant and the prize, three; out on the open sea a two off each gate and a one by
  each island. Influence 2 squares from any of a sloop's squares, 3.5 of a frigate's. Scored every 10 s; a round is
  six minutes.
- **Damage** (`Damage`): each hit a hole where it struck (along her, which side), its damage by the gun's size (a
  small shot 1, a medium 1.5, a large 2: YPPedia's proportions). Full damage: a war frigate 30 (YPPedia), a sloop 6
  (not checked: three of a frigate's large shots). Her carpenters patch the oldest hole first, her bilgers pump,
  both quicker with more stations (by the square root of her carpentry and bilge stations: a frigate's 18 and 12, a
  sloop's 2 and 2). Water comes in in proportion to her damage and slows her moves (up to 60% longer, full). At full
  damage she's knocked out: dead in the water, no influence, till her crew have her back under 60%.
- **Sinking** (15 Nov: "eventually you do need ships to be able to [sink]. Because that's part of the joy of
  blockading is, oh, look, we've lost control of the central area, we've got to get back in there again"): a sinking
  blockade (`BLOCKADE.SINKING`). A ship knocked out and still shot on sinks once she's 40% past full damage
  (`DAMAGE.SINK`: a war frigate six large shots more, a sloop one or two); her carpenters keep at it while she's out,
  so shot slowly enough she never goes down, and her friends can save her by driving off whoever's finishing her.
  Sunk, she settles by the stern, bow lifting, and goes under; she's off the board (in nobody's way, no influence, no
  guns) for 25 s (`RETURN`), then comes back refitted where she came in at the start, her side's own edge, to fight
  her way back in (waiting while anyone's lying there). The bots fire on a knocked-out enemy to sink her, and a war
  frigate's fights weigh twice as much against one (`FINISH`), and more against an enemy near a knocked-out friend
  (`RESCUE`). Not YPPedia's numbers: ours, to shape.
- **Seen**: every ship's crew aboard, little pirates at work (a frigate's helmsman, three carpenters and two
  bilgers; a sloop's helmsman, a carpenter and a bilger), in their side's colours; a hole made with a bang where the
  shot comes down, a dark hole ringed with raw splintered wood (it shows on black paint), patched with a fresh plank
  that weathers away; carpenters hammering while there's a hole, bilgers pumping and water spouting over her side
  while there's water; sitting lower and listing as she fills; smoking when badly hurt; knocked out, listing hard,
  low, smoking dark and turning slowly where she lies.
- **Each war frigate a config of her decoration** (src/den-frigate.ts; "a [war frig] should have a config for its
  decoration ... the same with an Atlantean type and a haunted seas type"): her paints, figurehead (a beast, a mermaid
  holding a trident, a skull), guns and furniture. Coral Throne, an Atlantean class (YPPedia: sea-themed, sold ready
  painted): sea green and sand gold, verdigris guns, clams, coral and tridents. Eldritch Wail, a Phantom class (YPPedia:
  a ghost aboard for good): see-through and glowing faintly green, flickering, a skull at her bow, candles, skeletons
  and gibbets on her deck and two ghosts. Their new pieces are furniture like any (js/den/furniture/: clam, coral,
  trident, bronzeCannon, ghost), in the catalogue. Either can be sailed in the blockade (its Sail button) or looked at
  on frigate-test.html (`?frigate=`).
- **The bots** (greedy, as the puzzles' are):
  - each picks the buoy most worth her while (its pennants; more if the other side holds it or it's contested; less if
    a friend's on it) for how far it is, and holds it;
  - a war frigate weighs shooting the nearest shut gate down (worth all the heart's pennants) against sailing round to
    an open one, and inside, the heart's buoys are worth more to her;
  - a war frigate with an enemy close by (frigates first) lies off her side and fights her for it;
  - a sloop badly hurt runs for a cove (or her side's corner) and hides till she's patched;
  - two raider sloops a side lurk in a cove, dart out at an enemy frigate, snipe at her from across her line off her
    stern (her bow if that's much quicker to get to: it's in her way), where none of her broadsides bears, fire, and run
    back (15 Nov: "they snipe at the back or the front of the ship where they're safe, then they can't return a
    broadside");
  - everyone fires a loaded side whenever it would hit an enemy and no friend, a tower she's come for, or a gate's
    gun firing on her; blocked by another ship, she makes a move of her own rather than wait for ever.
- **Spectating** (the page's start): the camera's director moves to whatever's happening (a knockout, a tower coming
  down, a hit; else a raid or a fight), no more often than every five seconds, drifting slowly round her; or follow any
  ship by clicking her, or the whole board. Any ship's Sail button takes her helm (`?ship=` her number).
- **The brawl** (`?watch=brawl`, on the front page's launch pad; 15 Nov: "I want to see two of the big ships really
  having a brawl and fighting it out to see what that damage looks like"; "a cinematic of the blockade"): Primates
  Rule and Iron Pride put broadside to broadside on open water between the south-west islands and the fort
  (`BLOCKADE.BRAWL`), their bots set on each other alone, coming about for each other's side; everyone else leaves
  them to it (never raids them, fights them or fires on them), the blockade going on round them. The camera between
  the two, or on whichever's knocked out while her crew rebuild her, drifting round; a caption, and a way out to the
  whole blockade.
- **Admiral mode** (`?admiral`, on the front page's launch pad; 15 Nov: "some kind of admiral mode where ... similar
  to the route planning thing ... you need to be able to give each ship a target or directive, where it's going, what
  it's doing"; "you could give sloops orders like ... camping somewhere, sniping ... drawing up those sorts of plans,
  and then you watch the things unfold and can ... update and tweak things or take over specific [ships]"). You're
  Dachimpy's admiral; the round waits while you plan. Kept simple to start (15 Nov: "like choosing just a strategy,
  just because this is a demo ... a few tactics, like going for a cove, running for the middle. Same with the frigs ...
  rush the middle, systematically attack the middle, control the outside, attack the enemy frigates ... go for sinks"):
  a strategy for your sloops (their own choice, hide and snipe, run for the middle, hold the outside) and one for your
  war frigates (their own choice, rush the middle, take the middle step by step: a gate's guns wrecked, then its tower,
  then in; control the outside, hunt their frigates, go for sinks), `STRATEGIES`, each an order every ship of the kind
  is given, bending how her bot picks. Two minutes of each, seeded, plays plainly differently (rushing in 60 to 29,
  step by step still wrecking guns, the outside held). And, as an extra, one ship's own order
  (src/blockade-orders.ts), carried out by her bot
  before anything she'd choose herself: her own choice; hold a buoy; camp on a square, firing on what comes by; snipe
  (a raider's way); shoot a gate down (a war frigate's); escort a friend, off her side, fighting whoever comes at her;
  hunt an enemy, broadside on (a sloop after a frigate, off her end). Drawn on the board: pick a ship (on the board or
  in the list), then click what she's to do there (a buoy, open water, a gate, a friend, an enemy), the button for
  Snipe or her own choice; a dashed line from each of your ships to her order, a ring where it ends. Start the round
  and watch; change any order as it plays, or Sail to take her helm. A gate down, her order to shoot it is done and
  she's her own again.
- **The gates' guns doubled, punishing campers** (15 Nov: "I do love watching the imperial [cannons] ... training on
  people's positions, especially punishing people camping. I almost partly think that we need to double up on the
  [cannons] ... first of all, stop people camping. And provide more of a barrier to the war frigates ... that central
  three-pointer is fantastic for how fast the sloops can get in ... you have the choice. You either charge the guns
  and take damage, get into that middle fast, or ..."). Four bastion guns a gate, two by its towers and two further
  along the wall; a gun paints and fires on the nearest ship in its reach (painted targets since, below), so camping by a gate, on
  the buoy off it or lying broadside to a tower, is punished, while slipping past mostly isn't; once its gate's fired
  on, on anyone in its reach. A frigate's choice at a gate: charge it under fire (a tower down, the way three wide),
  or wreck its guns first (three hits each), slower. A ship knocked out in a gate's mouth is camping there: the guns
  sink her, and the way's clear again. The bots fire back at a gun firing on them. The sloops' way into the heart, the
  side ways' winds, is out of every gun's reach.
- **Knocked out, seen** (15 Nov: "a tiny bit clearer"): a thick black column of smoke off her middle, seen across the
  board. Holes are drawn anywhere along the square they struck, so a still duel's don't stack.
- **War brigs, the middle class** (15 Nov: "a middle ship class, so it's not a big [brawling] fighter ... medium
  cannonballs ... but it can spawn ... haunted sloops that ... hang around for a set number of turns ... act kind of
  more like troop ... transports"; "the Atlantean ... sends out little [tritons] and turtles to go and ram the enemy
  ships"; "work on like the equivalent of war brigs ... things that can launch smaller ships like little sloops and
  Atlantis creatures"; and, on where she fits, "they can help fight around the islands, help cover more space in a way
  that ... the sloops get there first ... but like brig v sloop wins ... Maybe need like some middle ground"). One a
  side (`src/den-brig.ts`, `WAR_BRIG` in src/ships.ts):
  - **her numbers**: YPPedia's 16 medium guns, two shots a side; the rest not checked yet. Two squares long and one
    wide, a square a move as the sloop's but slower at it (`BRIG_PACE` 1.15 to the frigate's 1.3); she rides the
    winds out, as a frigate does. Full damage 15 small shots (the sloop's 6, the frigate's 30), her influence 2.75
    squares (2 and 3.5). So brig v sloop, the brig wins: she knocks a sloop out in two broadsides and the sloop needs
    fifteen for her; a frigate's large guns beat her. One wide, she slips through a gate's way without shooting a
    tower down, under its guns;
  - **her place, the islands**: her bot weighs the open sea's buoys half as much again and the heart's at a third,
    fights an enemy close by as a frigate does but a sloop before a frigate, and launches her craft whenever an
    enemy's within 10 squares. Her ghost sloops weigh buoys as she does;
  - **her craft** (`LAUNCH`): every 30 s, once they're all back aboard, off her sides by each of her squares (then off
    her bow and stern), heading as she is. Dachimpy's **Tidecaller**, an Atlantean, launches three **sea turtles**:
    no guns and no influence; each makes for the nearest enemy, straight at her a move at a time (her pilot's way only
    when she's stuck four seconds getting no nearer), and beside her rams her: two large shots' holes where she
    struck, and the turtle's gone. Dalnoth's **Grave Lantern**, a haunted brig, launches two **ghost sloops**: sloops
    in all but their look (see-through, glowing green, as Eldritch Wail), holding buoys and firing, never hiding,
    gone after 40 s (four blockade turns: "a set number of turns"). A craft knocked out goes down at once, and her
    brig sunk, they fade; either way she's back aboard, never coming in at the edge;
  - **her ground, the reef lagoons** (15 Nov: "Yeah, do it"; "she can get into the middle faster than a frig because
    she doesn't have to break down the door ... they're kind of maybe 2 tiles long ... but they can still get in the
    areas like the center at a medium speed"): round each of the four buoys by the islands a reef (`REEFS`), a ring
    three squares out with a gap or two a square wide, a lagoon five across inside. A sloop or a brig gets in; a
    frigate can't, her influence falls short of the buoy from outside the reef, and her broadsides stop on it. Those
    buoys made two pennants, so they're worth the fight. The reefs close the way between each island and the fort,
    so a frigate going from the south to the north goes the long way round past the islands, along the board's edge
    (two rocks there taken out so she fits); drawn as a lagoon (15 Nov, of coloured coral heads: "they look incredibly
    weird and colourful, not very lagoon reef like"): the sea paling to turquoise round it, a sandbar ring just under
    the water with surf along its outside and its gaps open, a grey rock here and there;
  - **the ways out of the heart** (15 Nov: "the only thing they really need is maybe an exit from the middle ... as
    the war [frigs] start approaching ... the sloops can kind of disperse quickly ... a wind heading towards each of
    the reefed areas, so they can get out quickly"): `EXITS`, four winds blowing out of the heart through a gap in the
    fort's wall between two of its gate's guns and round into a lagoon by a gap in its reef, one move carrying a sloop
    from the heart to its buoy. A sloop weighs the heart's buoys at 0.3 once an enemy frigate's in it (`FLEE`), so
    they leave. So a round has phases: the sloops in first (9 to 12 s), the brigs (53 to 150 s), the frigates (76 to
    244 s), and the sloops scattering to the lagoons;
  - drawn from a war frigate's parts on her own plan (two masts, one row of ports, her stern's few sizes her own:
    `Plan.stern`), the turtles and ghost sloops by `js/den/sea-craft.js`; the admiral picks a strategy for her too
    (her own choice, hold the outside, run for the middle, hunt their frigates).

- **The board turned round, two lagoons, shoals, rock, paper, scissors** (15 Nov, the user: "Warfrigs start pointing
  at the Imperial gates. Smaller ships come from the other sides and obviously catch the winds for sloops. And the
  lagoons can also be on that side"; "two lagoons like that"; "there just needs to be a cost to that move"; "make it
  closer to rock, paper, scissors ... frigates sink sloops because they just overwhelm them with just sheer firepower.
  War brigs ... good at beating war frigates with how they deploy the turtles ... sloops beat war brigs ... because of
  how they can just dart around and evade them"; of Grave Lantern's craft, "they launch a phantom sloop ... a little
  bit slow ... they don't take damage ... that's how they counter frigs. So anything that's camping or just being
  sluggish is a target for them"):
  - the frigates come in on the south and north edges facing their gates; the sloops and the brig on the west and east
    edges, on their own side's wind, which now blows from the edge through its lagoon and its side way into the heart;
  - two lagoons, one on each wind (`REEFS`), their buoy in the middle (so no frigate, even in the shoals, reaches it),
    gaps for the wind in, the wind out of the heart (`EXITS`, one a side through a gap in the side wall) and north and
    south; the four corner lagoons gone;
  - shoals three squares wide round each reef: a frigate in them scrapes her bottom every 1.5 s (a small shot's hole
    where she's in them, `SHOALS`); her pilot reckons a toll of 8 s on any move through them (`ShipSea.toll`, worked
    into her kind's chart), so she only crosses them when it's well worth it, and her bot never picks a spot in them to
    fight from;
  - rock, paper, scissors: a frigate goes for a sloop first; a sloop holds fire on a frigate unless she's sniping at its
    end; a brig leaves sloops and frigates to others, fights brigs, and launches when an enemy frigate's near; her
    turtles go only for frigates (then brigs), come at her from astern and ram her again and again (a large shot every
    4 s, four small shots to sink a turtle); Grave Lantern's craft are phantom sloops, as slow as a frigate, shots going
    through them, no buoys held, darting at frigates, brigs and anything that's lain still 6 s; a sloop goes for an
    enemy brig close by off her end, the raiders a brig before a frigate; a brig's full damage 10 (not checked).
  - Three seeded rounds, damage dealt by kind to kind (in small shots): frigates to sloops 210, sloops to frigates 39;
    the brigs' side (brigs 59, turtles 272, phantoms 133) to frigates 464, frigates to them 208; sloops to the brigs'
    side 64, it to them 87: the third side of the triangle not there yet (a brig needs a weakness the sloops can find).
    Rounds 2.1 to 2.6 s of computing.

- **Proved fleet against fleet, not by rules** (15 Nov: "it feels a bit artificial ... turtles don't go for sloops at
  all, rather than it being a mechanical advantage. Certainly set some balance tests up ... a fight with all frigs ...
  versus all brigs, etc."). `src/blockade-skirmish.ts`: two fleets of the same points (`POINTS`: a frigate 3, a brig 3, a
  sloop 1; six a side) to the last ship, sunk ships staying sunk, each bot going for the nearest enemy as her kind best
  can (a sloop off a big ship's end, hitting and running; a frigate or a brig broadside on, swinging her side round when
  in range and no gun bears; a frigate leaving be an enemy in a lagoon or its shoals). On open sea, or on the blockade's
  own board (`board: 'blockade'`: its lagoons, reefs, shoals, winds, walls and gate guns), the north fleet the south's
  turned round. (The gate guns were silenced at first, the sloops' hit and run under them counting as camping; the
  user, 15 Nov: "remember, the gate guns are part of the point ... if the sloops are constantly moving, they shouldn't
  be vulnerable to the guns". So a gun counts only the time a ship lies still in its reach, and they're live. Then, the user: paint a target and be
  slow to fire, so moving is plainly the answer: a gun paints the nearest ship's square, the shot coming down 2.4 s later,
  no camping count at all. With it, on the board, frigates beat sloops 5 of 6, brigs frigates 6 of 6, and the brigs
  mostly beat the sloops head-on (sloops 2 of 6), as the user expects: "brigs should just be able to shoot ... sloops";
  the triangle's third side to come out in a full blockade, "when brigs are forced away from the centre by the frigates".) Run by `tools/blockade-balance.mjs [seeds]
  [open|blockade]`; `tests/blockade-balance.test.ts`.
  - The rules taken out: a turtle goes for any enemy. What's left is handling and tactics: a turtle swims slower than
    a sloop sails, faster than a frigate goes (`TURTLE_HANDLING`); a ram only lands on a ship lying still a second
    (`RAM.STILL`); a brig's turn takes 1.6 of her move (`BRIG_TURN`); and **launching anchors a brig** (15 Nov: "she
    has to stay anchored while they're out ... once a Brig's committed ... very difficult to ... raise the anchor. They
    become a sitting duck"): she can't move while her craft are out, and weighing anchor early (`weighAnchor`, G when
    you sail her) calls them home and takes 8 s (`LAUNCH.WEIGH`). So her bot launches only with a frigate or a brig in
    reach and no enemy sloop within 7 squares (`BRIG.SAFE`), and on the board from inside a lagoon ("brigs being able to
    use the terrain to launch from a protected position is very key").
  - Three seeds, both ways round, six fights a pairing: on open sea, frigates beat sloops 6 of 6, brigs beat frigates 6
    of 6, sloops beat brigs 6 of 6. On the board, guns live, brigs beat frigates 6 of 6 and sloops beat brigs 6 of 6; frigates
    and sloops 2 of 6, every fight to the time limit: the sloops slip into the lagoons to hide and patch up where no frigate
    can follow, a stand-off by design (in a blockade the buoys bring them out). Points: at a brig's two, three brigs
    crushed the sloops; at three, the triangle holds.

- **Buoy values, a brig's hull, and whole blockades** (15 Nov: "if you're controlling the centre and then you're at
  least contesting one of the lagoons, you should win ... the two lagoons together should beat the centre ... centre's
  worth 8, a lagoon is worth 5"; "I like the Brig balance ... consistent with Puzzle Pirates"; "Sloops are just cheaper
  so they can be so much more numerous ... That still works as an alternate way of fulfilling the triangle ... As long as
  it happens different ways in each circumstance"):
  - the heart's buoys 4, 2 and 2 (eight), each lagoon's 5, each gate's 2 (a sloop's quick spot, a frigate sniping at
    whoever sits there);
  - a brig's full damage 15 (between the sloop's 6 and the frigate's 30), priced 2 points;
  - head-on (fight to the last ship, four fights a pairing): frigates beat sloops 4 of 4, brigs beat frigates 4 of 4,
    and now brigs beat sloops 4 of 4, on open sea and on the board alike;
  - whole blockades (`blockadeGame`: two make-ups placed as a blockade has them, buoys, scoring, sunk ships coming
    back; four games each, six points a side): brigs beat frigates 4 of 4; six sloops beat three brigs 3 of 4, and two
    frigates 4 of 4 by a mile (both lagoons theirs, ten to the heart's eight, no frigate able to get in); a frigate and
    three sloops against three brigs even; one of each against three brigs even, against six sloops 1 of 4, against two
    frigates 4 of 4. So in a blockade the cheap sloops, everywhere at once, a buoy contested by any one of them, are the
    strongest fleet: to shape with the user (their price, how a contest is decided, or the lagoons' worth).

## 4. Balance and cost, as it plays (bots, four seeded six-minute rounds)

- Sloops in the heart by a side way at 10 to 11 s; a gate down at 30 to 107 s; a frigate in the heart in two rounds of
  four (64 and 169 s), the others fighting outside it. Every round has hiding, raids, fights and 8 to 20 knockouts.
- A frigate's big moves keep her middle on every other square (it moves two at a time), so she can only line up with
  half the gaps two squares wide. So the gate's towers are two wide: crumbled, the way's three wide, and any frigate
  fits. Any narrow way meant for a frigate wants three squares, or two placed for her.
- Cost, first pass: sixteen ships' pilots on a big board, a round 9 to 19 s of computing for its six minutes, each
  pilot searching her own sea afresh whenever a ship near her moved, the bots guessing as the crow flies.
- **Maps worked out once** (15 Nov, the user: "surely ... there's not that many ways you can move around ... a couple
  of pre-computed maps ... one for small ships, one for big ... the only thing that can really change is ... the
  destructible items ... And then ... the adversarial planning on the top ... so you can plan around other moving
  ships"). `src/hull-chart.ts`:
  - **a chart for each kind of ship**: from every square and heading, where each of her three moves takes her (the
    winds carrying a sloop), its seconds, the squares it sweeps; rocks only, no ships. All the sloops share one, all
    the frigates another, worked out when the board's set up (a frigate's half a second, a sloop's a sixth); when a
    tower falls only the poses near it are worked out again (a fifth of the board), unless it's by a wind;
  - **how far to anywhere**: a place's field, its seconds from every pose of hers, the chart worked backwards from it
    once (a millisecond or two) and kept for every ship of her kind. A bot weighs every buoy, cove and gate by a
    look-up, no guessing; a gate's berths are one place, her quickest way ending at whichever's nearest; a frigate's
    shut out of the heart because there's no way in for her, not by a rule;
  - **round the ships near her**: her way as things are is a search told exactly how far everything is past the
    ships (A*, the field its guess), so with nobody near it goes straight down the field; a ship's in her way only
    within 5 squares of her (`IN_WAY`: one further off will have moved by the time she's there).
  - A round now takes 3 to 4 s of computing, worst tick under a tenth of a second; her way is as quick as the den's own
    pilot finds (tested from all over the board, both kinds).
- After the raiders' sniping, three seeded rounds: a gate down at 22 to 28 s, a frigate in the heart at 45, 215 and
  344 s; raiders on a raid hit frigates mostly from off their ends (25 hits to 15 from the side, those on the way in),
  frigates hitting raiders 9 to 22 times a round. The brawl: the two land 9 to 24 hits each in two minutes, one
  knocked out at 37 s in one, at 111 s in another, neither in the third.
- With the guns doubled and punishing campers, three seeded rounds: a gate down at 21 to 31 s; a frigate in the heart
  in all three (42, 125 and 182 s); the guns fire 110 to 139 times a round and hit 90 to 120 (31 to 98 on frigates);
  6 to 8 of the 8 guns wrecked a round; 8 to 16 ships sunk (up to 11 by the guns); 2.2 to 3.2 s of computing.
- With sinking, three seeded rounds: 5 to 8 ships sunk a round (frigates and sloops both), every one back; a frigate in
  the heart in two of the three (54 and 311 s); 4.4 to 4.8 s of computing a round. A frigate knocked out by a gate can
  lie in its mouth, in everyone's way, till she's finished.

- With a war brig a side (15 Nov), three seeded rounds: 14 to 18 launches, 12 to 15 rams a round (2 to 5 of them
  sinking a ship), 1 to 12 craft sunk; the brigs out round the islands two thirds of the time and more, fighting
  sloops; a frigate still in the heart (seed 6's round). 2.9 to 4.4 s of computing a round: the turtles steer straight
  at their prey rather than have a way worked out to wherever she's got to (that was 9.7 s).
- With the reef lagoons, three seeded rounds: the lagoon buoys held 25 to 55% of the time (at one pennant, a run
  before, about a fifth to a third; at two with the turtles slower, 28 to 79%, contested now and then), sloops,
  brigs and ghost sloops all in them, a contest there rare; a gate down at 31 to 103 s, a frigate in the heart in two
  rounds of three (76 and 77 s); 2 to 16 rams a round, the turtles swimming quicker than a sloop sails (0.7 of her
  time a move) so they catch something. 2.4 to 3.1 s of computing a round: a frigate whose exact berth had a ship
  in the way was having her pilot try every square round it for somewhere else to go, a field each (one round took
  26 s); now she waits for her next look.

## 5. To shape with the user

- With the islands gone and the ways out of the heart, three seeded rounds: sloops ride out of the heart 12 to 18
  times a round, 5 to 8 of them after the enemy's frigates are in; the lagoons held two thirds of the round and
  contested 30 to 64 s of it; hiding and raids from them all round; 13 to 20 rams; 1.8 to 2 s of computing a round.
- The reef lagoons as played: whether the brigs fight the sloops in them enough, and the frigates' long way round.
- Whether the frigate's handling feels right: as quick as the sloop over open water, clumsy (her turns of moves half
  as long again), the sloop's speed the winds'.
- The sloop's full damage (6 small shots, not YPPedia's yet), and how long a knocked-out ship takes to rebuild.
- Rams and rocks doing damage (YPPedia's), whirlpools on the board, more buoys or rounds, a sinking blockade.
- The bots playing as teams (escorting, holding a buoy together), sloops darting in to fire and run.
- Puzzles for you aboard: your carpentry and bilge (the den's own boards) instead of the bots' crew.
- Where it goes in the den: a blockade at Port Decorum, Daquan's flotilla (IDEAS.md).
- The styles' own mechanics (IDEAS.md): the Atlantean launching little craft (trikes, an octopus), the ghost ship
  gliding through rocks.
- Frigates getting into the heart more often (two rounds in four), and the bots' fights round the gates.
- Sinking's numbers (40% past full, 25 s away), and how long a knocked-out ship lies dead in the water: a frigate
  kept under fire can lie out for two minutes or more before she's finished or saved.
- **The buoys' flags clear, and the bots as teams** (15 Nov: "the [war frigs] control that large open area and protect
  the sloops ... the sloops ... help the [war frigs] cover more ground"). TODO.md.
- **Admiral mode, further** (IDEAS.md): where each ship comes in ("starting from the middle"), saved plans, two
  admirals, orders in sequence.
- **Islands as the capture points** ("you're blockading not just one island, but ... having a fight around the whole
  ocean"), **shallows a frigate scrapes through at a cost**: idea cards. Carriers and the ramming Atlantean are the war
  brigs, above.
