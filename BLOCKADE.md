# Blockades: the design

A proof of concept on the unlinked `blockade-test.html` (15 Nov). Its rules are `src/blockade.ts`, its bots
`src/blockade-ai/` (an AI for each kind of ship), every ship's damage `src/ship-damage.ts`, the imperial gate `src/imperial-gate.ts`, each
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

- **Fewer frigates, wary sloops, quick turtles, and the lagoons tried** (15 Nov: "I don't like the bigger ships,
  circles win, that is very against Puzzle Pirates ... just maybe do something simple like [tweak] the lagoons"; "sloops
  hanging around in the middle being blown up by [war frigs], foolishly ... a bit crowded with [war frigates]. So maybe
  just tuning down how many are in there"; "the turtles ... supposed to be much faster ... a quick deploy tool"):
  - each side two frigates and two brigs (Pearl Diver, Dachimpy's second, an Atlantean; Wraith's Wake, Dalnoth's, a
    haunted brig) and five sloops;
  - a sloop leaves be a buoy an enemy frigate's within 5 squares of (`WARY`), and goes where she isn't;
  - turtles swim fast again (0.6 of a sloop's time a move): their ram needing a ship lying still is what keeps them off
    moving sloops, not their pace; they leave a brawl's two ships be, as every bot does;
  - the lagoons tried at 5, 4 and 3 in whole blockades: it hardly matters. Six sloops beat two frigates at any of them
    (400 to 100), being six hulls on seven buoys; one of each kind beat six sloops 3 of 4 with the sloops wary, at 5, so 5
    it stays. In a blockade, numbers of hulls tell: the open question.

- **Blind spots, a design principle** (15 Nov: "the odd couple of rocks in the middle ... sloops or brigs can still
  have a role in the middle because of those blind spots ... if they were in the open water, it would be suicide, but in
  there are ways to dip and dodge"; "make those blind spots an explicit part of the design"): a broadside reaches three
  squares out from a ship's side, never off her bow or stern; to bring her side round, a frigate has to turn, one of her
  big moves (2.6 s, in plain view), while a sloop moves in a second, so a turn is a warning a sloop can act on, out of the
  line or behind a rock (shots stop at rocks); a brig's clumsy turn the same. The heart's rocks and walls are cover, open
  water none: room to dip, duck and dodge (the user's words for it). The gate guns too: a painted target, a slow shot,
  moving the answer. On design.html's blockading tab.

- **Dip, duck and dodge, built and shown** (15 Nov: "the [war frig] could be sitting in the middle and a sloop can jump
  out into those blind spots ... the classic PPE trap, is frigs just like to camp and sit in the middle ... camping
  should not be rewarded. There are blind spots, there are vulnerabilities"):
  - a sloop bot reads every enemy frigate within 7 squares whose side is loaded (or within 1.5 s of it): the squares
    her broadsides reach from where she lies and where her move leaves her; on one, the sloop takes a single move out
    of them, a square beside a rock first, firing as she goes (`dodge`, now in `blockade-ai/sloop.ts`; tested);
  - two rocks in the heart, (18,16) and (25,19), one off each end of a frigate lying on the prize, to tuck in by;
  - following a frigate (or sailing one) shades her reach red on the water, her blind spots plain;
  - the balance as before: the dodge measured head-on and in whole blockades with no change, and the balance tests
    passing with the two rocks in.

- **Playing for the points: frigates camp the heart, brigs send turtles in from the lagoons** (15 Nov: "people aren't
  really paying attention to the points. They're just going off and starting a few fights ... I'm not seeing the kind of
  desired war frigs camping in the middle, war brigs sending turtles in through the gaps ... I just want to see the war
  brigs camping out there more and sending in the turtles"). Watched first (one whole blockade): frigates spent 55% of
  their time fighting and 16% in the heart, chasing turtles 188 s; a lone frigate with the gate shot open lay on the
  2-pennant buoy in front of it rather than going in; the brigs anchored by their lagoon buoys, 15 squares from the
  prize, just out of launching reach, their turtles ramming frigates brawling at sea. Now, the bots only:
  - the heart's worth 2.5 times to a frigate (was 1.6): through a gate shot open to the prize, ~20 s alone;
  - a frigate holding a heart buoy fights only what comes within 5 squares (`HOLD`); a frigate or brig never chases a
    brig's craft of her own choosing (too quick, only a while: she shoots them as they bear);
  - with an enemy frigate in the heart, a brig makes for the square in a lagoon nearest the prize (its corner by the
    gap the wind runs through into the fort) and launches only there (`station`), from 17 squares (was 14);
  - a turtle goes for a ship lying still first (8 squares' worth): she can only ram one that's still, so a frigate
    camped on a buoy is hers before a sloop darting about nearer;
  - after, two games: brigs at anchor, craft out, three quarters of the time, at (8,17), (8,18), (35,17); turtles
    ramming frigates 36 to 60 times a game (was 16 to 38); frigates holding the prize longer, and paying for it.
  - Shelter: the lagoons are the brigs' sheltered place beside the heart, its winds their way in; no rocks added at
    the fort's corners (the user wondered; the lagoons already do it).

- **Playing a brig** (15 Nov: "How are the controls going to work for launching 3 turtles and controlling 3 turtles?
  Are they expected to go on autopilot and you control one of them? ... you can choose which one you're controlling,
  and the others go on autopilot"): at a brig's helm, L launches her craft (she anchors), each on autopilot (its bot);
  Tab moves your helm round her and each craft out (`Blockade.fleet`), the rest on autopilot; G weighs anchor, calling
  them home; a craft you're steering gone home puts you back at her helm. Steering a turtle leaves the brig at anchor
  undefended: the triangle's weakness, felt.

- **Island side and ocean side, and a spinning sink** (15 Nov: "each side is swarming one of the lagoons ... they're
  not really doing much to compete each other's lagoons"; "for the smaller ships, they should ... be able to spawn ...
  on any side that they want to ... island and oceanside spawns ... brigs are quite safe because all the sloops are
  spawning around them"; "we definitely need the spinning sink animation"):
  - a sloop or a brig has two entries, her side's edge and the same place on the far one (`farSide`); each side starts
    a brig and two sloops on the far edge (`far`); sunk, she comes back by the other entry from last time;
  - after, two games: an enemy sloop within 5 squares of a brig at anchor 30 to 38% of the time (was 5%), sloops'
    hits on brigs 62 and 71 a game (was 16); but each lagoon still ends up mostly one side's (flipped: the far
    starters take the other side's);
  - a ship sunk spins down, three turns, faster and faster, the sea swirling white round her;
  - spectating, W A S D move the camera and Q E turn it.

- **A bigger board, the points first, posterns** (15 Nov: "the whole board's a bit small ... there needs to be a bit of a
  buffer travel zone"; "Ocean Island matters for the [war frigs] as well"; "this is a game about the points ... you
  never hide"; "an enclosed launching spot for a brig ... balance that with another kind of gap coming from the
  outside"; "three sloops ... right on the corner of the map ... no reason for them to really be venturing over there";
  "The focus is definitely switching too fast"):
  - the board 56 by 48 (`PAD` 6 squares of open sea all round, every place shifted by it), the edge winds lengthened
    to the edge so the sloops still come in fast; the fleets at the new edges;
  - every frigate a second entry at the other end (`other`), by the other gate; sunk, she comes back by whichever end
    she's quicker into the heart from; sloops and brigs the other side's edge from last time;
  - no ship hides: no home corners, the hiding spots moved onto their lagoon's buoy and unused by the bots; a ship's
    nerve (`nerve`, 1 + 1.5 times his damage less hers) weighs her fights and a sloop's raids, and a hurt sloop keeps
    further from enemy frigates; a frigate never goes after a ship sheltering in a lagoon or its shoals;
  - two more rocks, (32,25) and (23,22), so all four corners of the heart are out of any frigate's reach inside it (a
    brig there hit from no frigate pose in the heart); posterns through the wall by the two corners no way out runs
    through, (20-21,20) and (34-35,27), a frigate outside reaching the corner square through one, a sloop slipping in;
    a brig may launch from a corner as well as a lagoon, whichever's nearer; she launches only at frigates (not at a
    brig: both anchored by the edge, ramming each other, once the sides came in from both edges);
  - the director keeps a ship 12 seconds at least, and while she's still in the thick of it, unless something big
    happens elsewhere;
  - after, two games: brigs at their spots, but turtles ramming frigates only 3 or 4 times a game (36 to 60 before
    this pass): the frigates fight each other far more now (up to 345 s a game) and a frigate on the move can't be
    rammed. To look into next.

- **Turtles get to their frigates again** (15 Nov, after the bigger board: 3 or 4 rams on frigates a game, was 36 to
  60; "Yes, dig in"): watched, a turtle that reached her frigate found her lying still 32 times in 35, but few got
  there: with no sloop hiding any more, sloops lying on the lagoons' buoys drew them off (as much time after sloops as
  after frigates), and each lost seconds at launch. Now a turtle weighs her prey by its worth too (a frigate 12
  squares nearer than it is, a brig 6, `RAM.WORTH`) and keeps to the one she's after (`RAM.KEEP`); she looks at once
  when launched; she puts in a whole turn's moves at a time; a turtle lasts 40 seconds (was 30, a phantom's). Three
  games after: rams on frigates 12, 25, 41.

- **Full damage sinks her; a safe edge; frigates back to the middle; the round's end plain** (15 Nov: "how is that
  different than being sunk? As I thought we were supposed to be sinking ships, not having them just float around
  there"; "the safe zone around the edge ... you can't shoot each other ... one turn before they can move again"; "the
  frigs really are not being very aggressive still at returning to the middle ... one's really out there, near the edge
  of the map"; "I thought it had frozen"):
  - full damage sinks her at once (no knocked-out state, its crew rebuilding her), from any shot, ram, gun or scrape;
  - a safe zone four squares deep round the edge (`SAFE`): nobody in it fires, shots go through ships in it, turtles
    don't ram there, the bots leave ships in it be; a ship back in waits three seconds (`RESPAWN_WAIT`);
  - a big ship's fight counts fully only with an enemy on or contesting a buoy (`OFF_POINTS` 0.35 otherwise); and when
    the ships in her way would send her far round (more than `DETOUR` 1.6 times her way, a gateway full), a big ship
    waits for them rather than setting off round the fort or moving off at random: watched, Iron Pride, back by the
    south entry, wandered west for 75 seconds that way;
  - after, two games: frigates in the heart 32 and 38% of the time (11 to 37 before), holding the prize 225 and 375
    seconds; rams 16 and 31;
  - a banner at the round's end, who won and the score, and New round.
  - the red broadside reach off: only with `?reach` in the address, for the blind spots' picture ("I really don't see
    what that's adding ... the only reason for adding it, was for one screenshot").

- **Nobody hangs about under the gate guns** (15 Nov: "a lot of foolish ships just hanging out when there are cannons
  shooting at them ... more of an incentive to destroy these cannons for the war frigates"): watched, the gate guns
  fired 258 to 284 shots a game, most hitting frigates (122 to 175 hits, holding the heart's buoys within their reach or
  waiting at a gateway), and the frigates wrecked 3 of the 8 (only an admiral's siege order sent them to). Now:
  - a frigate's free to wreck a gate's guns, worth `GUNS.W` a gun still standing, `GUNS.ON` while they're firing on her,
    from her nearest berth either side of the wall (`gunBerth`, shared with the siege order);
  - a sloop's dodge counts the squares the guns have painted, and a brig under way steps off one;
  - after, two games: 68 and 83 shots, 33 and 34 hits on frigates, none sunk by them, 7 of 8 guns wrecked.

- **The gate guns have a side; frigates keep to the points; a brig's turn smooth** (15 Nov: "The turrets need to have a
  side, and each side has a few turrets ... more of an incentive to destroy the other team's turrets"; "You don't hang
  around off points getting into fights"; "the [war frig's] just getting stuck and not going back in again"; a war brig
  "turns, then it seems like it gets snapped into an adjacent square"; "after a shot or two, they start showing some
  signs of crumbling"):
  - each gate's guns the side's whose frigates come in at that end (`GATES[].side`, `gunSide`): they paint and fire on
    the other side's ships only, and their shots hurt the other side only; a frigate goes for the other side's guns only;
    a sloop's dodge counts only the enemy's painted squares; drawn in their side's colour, band and flag;
  - a gun crumbles as it's hit: battlements knocked off, rubble at its foot, a lean, stone dust (`crumble` in turret.js);
  - a frigate never picks a fight with an enemy off the points (`OFF_POINTS` 0 for her); waiting for a gateway, she
    gives it `PATIENCE` 6 seconds, then takes the long way or her next look sends her elsewhere;
  - a brig's turn drawn to where her move really ends (`shipPose`, the arc's size from her real end, ahead and across):
    the biggest jump between frames 0.71 squares, now 0.04;
  - after, two games: frigates fighting 23 and 117 seconds a game (were 156 to 444), in the heart 34 and 38%, gate-gun
    hits on frigates 0 and 20, 4 and 6 of the 8 guns wrecked.

- **A brig's craft clear the enemy's gate guns; a turtle rams a frigate's ends** (16 Nov: "the turtles and [ghost sloops]
  ... as good tactical options to clear out the cannon placements. Maybe it should still need a few rounds, so you'd
  lose some turtles ... they're the standoff hunters"; "let's stay at the front of the war frig and start ramming it
  from the front. That's what they were designed to do"):
  - a turtle beside a gate gun of the other side's rams it (`gunBeside`, `Rammed.gun`): a hit to its wrecking, three
    wreck it, and it isn't quietened by it as by a shot, so it fires on her; a turtle weighs a gun like a still ship,
    `RAM.GUN` 10 more (a frigate 12);
  - a phantom sloop goes for the other side's guns when they're nearer than her raid, by the frigates' gun berths;
  - a brig launches at the other side's guns within `BRIG.LAUNCH` of her as at a frigate;
  - a turtle comes at a ship's nearer end, bow or stern, then a corner, her side last;
  - after, two games: 6 and 8 gun rams, 2 to 4 guns wrecked by the craft, 2 to 4 turtles sunk by the guns.

- **One frigate a side at each end; a turtle's ram shown** (16 Nov: "It's lost some of that early energy to war frigate
  risk ... war frigates ... could be taking a pummeling as they were entering, which is not the case now because they
  just enter on the friendly side"; the guns swapped to defend a gate turned down: "too lopsided"; "one frig from each
  team should come in on each side"; "is there no ramming animation for the turtles? ... almost like headbutting the
  ship and then going back"):
  - Coral Throne and Eldritch Wail start at their far end (`far`): two games, gate-gun hits on frigates 39 and 19
    (were 0 to 20), 4 and 5 of the enemy's guns wrecked by frigates;
  - a turtle's ram drawn as a lunge two thirds of the way at what she strikes, head down, and back (`butt`, 0.45 s).

- **The bots a plug-in AI for each kind; tactics; the anchor shown** (16 Nov: "almost like an AI folder ... so that each of
  these can be have like a separate plugin AI"; "I don't see very many tactical moves being made"; "they seem now to just
  want to sit in the gate"; "They've been sat out there forever ... they seem to have gotten stuck"; "at the very least,
  you would swing ... and start putting broadside"; "I would expect them to be protecting the war brig"; "it needs to be
  some more visible animation when a [war brig] is anchored"):
  - `src/blockade-ai/`: `captain.ts` what every kind does alike, a kind's AI a Captain with its own `act`, `first`,
    `buoyWorth`, `options`, `settled`; `index.ts`'s `AIS` which sails which, any swapped through `Bots`' `ais`, any class
    that's a `ShipAI`; three seeded games played out exactly as before the split;
  - a frigate's never `settled` on a buoy while she's in a gateway (`inGateway`): she goes on in, straight on when she's
    caught there; a big ship getting no nearer her buoy for `STALL` 15 s gives it up as long again;
  - a frigate on the points, idle, an enemy within `BEAR` 8 and no side bearing, turns by a move keeping the buoy in reach;
  - an enemy frigate half in a gateway, within `RAKE` reach and 15 s, raked from her end by a frigate; one in a gateway or
    lying still a while sniped at by one sloop; an enemy sloop within `GUARD` 7 of a brig at anchor fought by one sloop;
  - after, two games: frigates' time in a gateway 0 to 63 s (one lay there 206 s before);
  - the heart was cramped for a frigate: from most poses near the prize she couldn't turn at all (fixed the same day,
    below);
  - a brig's anchor (js/den/anchor.js): falls from her bow with a splash, her cable taut into spreading rings and a tag
    while she lies there, wound in as she weighs it;
  - the design page draws a brig's turtles boxing a frigate in at her ends (16 Nov: "we need ... something like that for
    the design page, where it shows a war brig with its turtles surrounding a war frigate").
- **A fair board, turning where she fits, low rocks in the heart** (16 Nov, watching it: "the map looks very unfair that
  one ends up having to turn for a rock while the other doesn't"; "they don't need open water to turn ... you should
  always be able to turn as long as there's physically enough space to fit your ship"; "low rocks ... you can shoot over
  them but you can't get past them ... so it stays in that center square area"):
  - every entry is the other side's turned round the board's middle, (c, r) to (55 − c, 47 − r): Eldritch Wail's far
    entry (27,2) ran straight at the rock at (27,10) while Coral Throne's (16,45) had none; now (39,2); the frigates'
    other entries likewise (Primates Rule's (38,45), Iron Pride's (17,2)). A test checks the rocks, low rocks and fleets;
  - `ShipSea.move`: a big ship's turn with no room for its quarter circle turns her on the spot about her middle,
    bumping, if her hull fits facing the new way (before, only when no move at all was clear). The pilot's chart takes
    these as moves, so she plans with them;
  - `BLOCKADE.LOW`: a line of low rocks down columns 24 and 31 of the heart (with its rocks and two-pennant buoys there),
    frigates only (`ShipSea.low`), shots over them; a frigate reaches only columns 25 to 30 of the heart, where she can
    always turn. Drawn as a pale ledge with flat stones awash. Brigs lie in the heart's sides more since (859 to 431 out
    and in, from 1111 to 204, seed 6), out of a frigate's way but not her guns;
  - a frigate with no move clear and a buoy to hold (bow to bow between the gates) turns on the spot, the way that keeps
    the buoy (`bounce`); `bear` uses the on-the-spot turn too;
  - a gate gun's crumbling (js/den/turret.js) plain from its first hit at the blockade's distance: more battlements off,
    the stone blackened, the gun askew, a bigger burst, smoking while it's damaged.
  - The turtles' box is weaker for it: a frigate with turtles only at her ends can now turn on the spot between them.

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
