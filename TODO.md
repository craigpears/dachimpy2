# Pirate Den: to do

Fixes, quality-of-life and feel changes the user has asked for. These are agreed: just do them.
New puzzles, new features and the user's unrefined ideas go in [IDEAS.md](IDEAS.md) instead.
When one's done, put its rule in [RULES.md](RULES.md) and delete it from here. Not published with
the site (`.assetsignore` skips `*.md`).

## Still to playtest (kept from 12 Nov)

Built, but not yet played by the user (the user, 12 Nov: "keep a note of what is still to be play
tested"). Struck off here once played; what the playtest corrects goes in RULES.md (or RACE.md).

- **The sloop race, a full run (12 Nov):** the whole course with rivals, now with the locks a beat,
  the buoys always seen, the wind gaps lined up, the bribe gate (the wreck's coins by Treasure Haul),
  the driftwood barrier (Foraging), the crane. And the race's next pass (12 Nov): no gambles; the snakes a
  few squares back; the start's field of slow winds and whirlpools, fresh each race, and its hop; the rocks
  off leg 3 blasted open for everyone; every stopped puzzle's shortcut about the same stretch; the starlit
  door a plain door, Navigation only, one stretch through; the headwind gap's lower cliffs and its wind.
- **The race's puzzle shortcuts, not yet seen at all (12 Nov):** "I've definitely got to check things
  like the starlit door and the crane and [Treasure Haul] ... I've not seen any of that stuff yet. I've
  not even seen a visual or anything about those puzzles, the navigation puzzle that is." So: the crane
  built by Carpentry on the race; the bribe at the gate, the wreck's coins hauled by Treasure Haul; Duty
  Navigation itself (`navigation-test.html`); and the starlit door on the race course (its Navigation on
  the rock, the door opening, the tunnel and its clefts), straight there by `den.html?at=door` since 12 Nov.
- **The race's chart (12 Nov):** `changelog/race-map.jpg` and its changelog entry, and the design
  page (`design.html`), for whether they read well.
- **The course editor (12 Nov):** `race-editor.html`: move buoys and shortcuts, set each puzzle's size,
  the balance check, then race it in 3D; the rocks movable along spit 3 since the race's next pass.
- **Watching the race (12 Nov):** the replay / spectator mode, `?at=race-watch`: four racers, the
  free camera, following one, their boards.
- **Penguin Island and sailing round there (12 Nov):** Kikkit's whirlpools, Vegas Island and the run
  behind the rocks to the smugglers' beach. (The run's width is a fix too, under "Asked for".)
- **Tzz's balloon lesson (11 Nov):** on her island (RULES.md, "Tzz's balloon lesson").
- **The wedding, showered in gifts (12 Nov):** the gifts theme and plot, and Mischievious's newer
  lines (the presents all for her, the loopy weddings).
- **Primates Rule (11 Nov):** beside the sloop on the unlinked `frigate-test.html`.
- **Older, still unseen:** the captain's map's cutscene with Dalnoth redrawn; the towers, lower
  middle and night sky; the cove (each under "Asked for", below).

## Asked for

- **Raiders getting through mustn't end the game (9 Nov):** rethink what happens when raiders get
  in, because the den should let you go off on side quests, row out to the ship and explore: "I
  don't want the game to be ending because you decided to go exploring." Getting plundered should
  cost you something without ending everything. (What the consequence is instead: to pin down
  with the user. A first sketch, with raids becoming opt-in after an opening siege, is in
  IDEAS.md, "Raids you choose".)

- **Split the den off from the Carpentry primer (9 Nov, not yet):** "we need to separate this code
  at some point from this carpentry primer thing, because this is obviously far more interesting
  ... I think that can just be removed and just focus on the pirate then. It has evolved." But
  "we don't care about that at this point". Later: the den becomes the site (or its own repo), and
  the primer goes. (How, where it's hosted, and what of the primer's engine the den still needs,
  to pin down with the user when it's time.)

- **Something worth finding in the hidden cove: treasure (9 Nov):** the canal and the cove "would
  be great, but ... it needs a point of interest in here, even if it's a little like treasure
  chest on this little beach in the cove. You need to be able to go in here and do some treasure
  hauling or something." So: step ashore in the cove, and Puzzle Pirates' Treasure Haul brings up
  the treasure, played by its real rules (checked first), with a believable reason for it there.
  (Treasure Haul's real home is a wreck, so it went at the clifftop lagoon's wreck, the crane's
  place, now built; the cove keeps a chest of its own on the beach. How you get that one: to pin
  down.)

- **A hit on a gun shows on it, not in words (10 Nov):** "there should be some visible damage once
  you fire a cannonball at one of the turrets. Right now it's just like, oh, read the text to work
  out that it's been damaged ... I probably shouldn't really be any text. It should just be visible
  that you've damaged it, and you work out how many shots it takes." So each hit leaves its mark
  on the gun (chipped stone, a scorched and dented barrel, a battlement knocked off, smoking more
  as it's worse), and the toasts that count the hits ("2 more to wreck it") go.

- **Sunk at the checkpoint, row home (10 Nov):** agreed (IDEAS.md, "Sunk at the checkpoint"):
  "it should be a short row home ... you've got the trade winds blowing you back, haven't you? So
  all you need to do is a quick row to get onto the trade winds." Sunk, you bob up in a little
  rowboat, row by mirror strokes the short way to the trade winds, and they carry you home; the
  sloop's waiting at the den, and you're back aboard her, with a small, subtle note after the row
  home that O gets the oars out any time. Nothing about the wind (the user, 10 Nov: "keep it
  secret ... don't do a big thing ... We want to keep it as the Easter egg, the thing that you
  figure out"). After Dignity's cutscene.
  No hint of another way round, here or anywhere (10 Nov; RULES.md, "Hidden gems, never
  hinted"). The chain: you see the wind, and work out for yourself that the oars get you past it.
  Sunk only by a real hit (10 Nov): Bella's first shot is the warning (her giggle stays); a gun
  that actually hits you sinks her, and you row home. No more patching a bit of damage with
  Carpentry at the checkpoint: "it probably adds a bit more stakes ... you are in a tiny sloop at
  this point, after all." Then, unsure (10 Nov): "Part of me likes just being able to get through.
  Part of me wants her to actually sink you if you get enough damage. I'm really not sure on it."
  (To pin down: one hit, or enough damage over a run.)
  **Settled (10 Nov): damage and bilge, as in Puzzle Pirates.** Three hits is no challenge ("I just did
  a very simple go forward, forward, forward, forward, and I only got hit twice"), so instead: "as
  you get hit, your damage goes up and carpentry brings it down ... you can jump into that puzzle.
  ... same as how you hit O to get the oars out, but it's not a forced thing", and "bilging is ... the
  same kind of idea. You can clear your bilge, but ... when you're damaged, bilge slowly goes up."
  So her damage rises with each hit and Carpentry on her deck brings it down, whenever you choose
  (no more being stopped to patch); while she's damaged, water seeps into her hold and her bilge
  rises, and Bilge pumps it out. Sunk when her damage is full, and you row home. Shown as Puzzle
  Pirates shows them, a damage meter and a bilge meter, and on her too (holes, water in her hold).
  Check YPPedia for what bilge does to a ship (slower, say) and how damage sinks one. After the
  lag at the gauntlet is fixed (it's in the same files).
  **But the deck patch stays (10 Nov):** "abandon getting rid of the carp[entry] on deck when the
  cannonball hits things ... people like it. It's funny. It's good." A hit still holes her deck and
  you patch it by Carpentry before she sails on, as now (RULES.md, "Kept because people like
  them"). **The meters are for bigger ships (10 Nov):** "maybe in a sloop you get damaged and you
  have to patch it up instantly, and then those full damage [and] bilge meter things are bigger ship
  features that we can discover later" (IDEAS.md, "A bigger ship from the shipwright"): "it gives a
  bit of personality to this little small sloop." So the sloop keeps the instant patch, and no
  damage or bilge meters are built for her. Still open: whether a hit can sink the sloop at the
  checkpoint (and you row home), and how.

- **The Sailing puzzle, for Kikkit's quest (10 Nov):** Kikkit's penguin quest is next up once the
  work in hand is done ("that is next up ... I guess you can start some of that now because that
  requires the sailing puzzle"). First the Sailing puzzle itself, Puzzle Pirates' own rules
  checked on YPPedia, as a module knowing nothing of the den, tested and with bots; its Vegas (or
  whatever its real big combo is) sends her a long run forward in one go (IDEAS.md, "Kikkit's
  penguin").
  **Her whirlpools are a way through the reef (11 Nov):** the passage through the reef to the right
  of the checkpoint's gate, sailed with Vegases, a harder way past than the gate or the locks, with
  the penguin in the middle as its reward (IDEAS.md, "Kikkit's penguin").
  **Order of work (11 Nov, "move on to that sailing feature with all the accompanying things"):**
  its board drawn, balloony, and playable anywhere at sea first (done: RULES.md, "Sailing at sea"); then Kikkit's island and her
  rambling (done); the whirlpools through the reef with the penguin in the middle (done: RULES.md,
  "Kikkit's whirlpools"); Tzz's island and her
  balloon lesson on her island (built, to be played: RULES.md, "Tzz's balloon lesson"); the ending: Kikkit moves to Vegas Island, the penguins' island
  past the reef, her familiars swimming after your ship (11 Nov, IDEAS.md).

- **Paint your ship (11 Nov, for later):** "we definitely need that on the to-do, being able to
  paint your ship somewhere. Maybe ... some character later on an island ... will let you paint
  your ship. I don't know who yet." Her colours (hull, sails, trim) chosen somewhere at sea, from a
  character on an island of their own; who, to settle with the user. What you paint her is kept in
  this browser, like your look.

- **Pictures of Primates Rule, from the user (11 Nov): received.** "I'll have to put a to-do in
  there that I'll have to share the pictures of it, where it's got like the gold, the black and
  white thrones, the skeleton cannons." Found and shared the same day: `notes/primates-rule/` (not
  deployed). The user's war frigate, the one for Daquan's flotilla (IDEAS.md, "Daquan's flotilla"):
  - **1-top-deck:** three masts; a black hull with white rails and two white stripes, square gun
    ports in two rows, the planking below the waterline bare wood; a black beast's-head figurehead
    with gold scrollwork; a raised quarterdeck aft and forecastle forward, stairs between. On deck:
    the skeleton cannons (black, banded in bone, a skull on each), suits of armour on plinths,
    gibbet cages hanging from posts, a black grand piano, jars with creatures in them,
    anchor-backed chairs, a skeleton in a chair, tool chests, tables of cards and bottles. Dachimpy
    stands at the bow with Doggie the Dog.
  - **2-captains-cabin:** an L-shaped cabin, wood-panelled; chained skeletons hung on the walls;
    open chests spilling gold; a desk with maps, quill and candlestick; suits of armour; skeleton
    chairs at round black tables with a spiral top; a potted palm; a ladder up.
  - **3-hold-throne:** the hold: the gold and black throne on a tiered black-and-gold dais
    ringed with bones; skeleton cannons along both sides; long tables heaped with gold and gems;
    piles of skulls and bones; chests of gold; pumps and buckets; pumpkins; a globe.
  - **How close (11 Nov):** "Not saying ... to do a faithful depiction ... but ... obviously Puzzle
    Pirate elements ... should be faithful ... the skeleton cannons and the black and white theme and
    a few of the bits of furniture ... the gibbet, the skeleton set ... most of the stuff like on the
    top of the deck looks good. I'm not so sure about some of the goldy bits ... Actually, to be
    fair, yeah, go relatively close. That's fine." So: the war frigate herself as Puzzle Pirates
    drew her (faithful), black and white; must-haves the skeleton cannons, the gibbet cages and the
    skeleton furniture set; the top deck's things relatively close; the gold (the throne, the
    treasure) kept, but not the point. "It was just such a happy one."

- **Next, one at a time, once Tzz is finished and played (11 Nov):** "for the [Daquan] and Helium
  ones, I think they're fleshed out enough ... to be on the to-do list to get started ... there's
  enough there to get started, and then I think you can naturally flesh out the rest of the
  mechanics later." But "try and finish things ... we need to finish things really one at a time"
  (RULES.md, "Finish one thing at a time"): each starts only when the one before is played and done.
  **On hold for the racing (11 Nov):** "I just want to focus on this racing for right now on these core
  things." Helium and Distilling "can definitely wait", Kikkit's ending (her move to Vegas Island) too,
  and Primates Rule below decks is "definitely way down the" list. Kept here, not started, until the
  race's core is done.
  - **Daquan's flotilla, to start (started 11 Nov: Primates Rule modelled, curved, and moored at sea as still to come; below decks and the cutscene next):** the cutscene (Dachimpy at the helm told to go sink a ship,
    sinking their own; Daquan face-palming, then turning to you), and modelling a bigger ship,
    Primates Rule, the war frigate he lends you, to see how she looks beside the sloop
    (proportional by YPPedia's numbers). Daquan's portrait checked first; Primates Rule's gold,
    black and white thrones and skeleton cannons from the user's pictures (above). What you do
    against the flotilla: fleshed out after. (IDEAS.md, "Daquan's flotilla".)
    **Modelled (11 Nov), to be looked at:** Primates Rule beside the sloop on the unlinked
    `frigate-test.html` (`js/den/frigate.js`, `src/den-frigate.ts`; RULES.md, "Primates Rule, as Puzzle
    Pirates drew her"). Next: below decks (the captain's cabin; the hold and its throne), her crew to
    be seen aboard (dozens), then placing her on the sea for the flotilla.
  - **Helium and Distilling, to start:** a Distilling puzzle of its own (its rules from YPPedia, a
    module knowing nothing of the den, tested), and Helium teaching it as Tzz teaches Sailing: a
    funny animated scene showing you real distilling moves, then "now you try". Their still is the
    hidden Easter egg in their house, with the mishap ("Oops. That happens sometimes. Don't worry
    about it."). Their portrait checked first. Smuggling the rum after still waits. (IDEAS.md,
    "Helium, and Distilling".)
    **Started (12 Nov), and an island of their own, not a house:** "I think we can start doing his
    thing ... I think you're ready enough to start on the mechanics of building that puzzle, usual
    kind of modularized stuff." And "Him being in a hidden house, maybe he can just have his own
    little island. That just seems to be the theme somewhere. Maybe that can link into where the
    Smuggle Beach is ... I bet he just wants an island for him somewhere." First the puzzle, as
    real as the rest (researched, with bots), and a tutorial in the style of Tzz's Sailing guide;
    the user will point us to what the real tutorial looks like.
    **First pass built (12 Nov), to be played:** the user, "are you able to crack on with adding Helium
    and some of the tutorial elements in? I don't want to get too caught up on perfecting this bit."
    Helium drawn from their Emerald portrait (IDEAS.md), their island past the checkpoint across the
    smugglers' rocks from their cove (`?at=helium`), their still and the real board on a stand; a short
    lesson (swap rule, whites left and junk right, a column burned, their mishap's bang), then your own
    session there, "Help, Helium" on H or the button (`advise`, their line naming the technique, the drag
    played on your board), and a bang with their line whenever a white burns. Panel's distiller is them now.
    Their opening first (12 Nov, the user's): the still blows up as you arrive, they shrug it off, "is it
    safe?", "of course it's safe", and the eyebrows. Your pirate's tense face isn't drawn (lines only).
    Not yet: the smuggling ring and the penguin's link, the coached replay, a lesson per technique.
    Watch: whether the lesson's pace and camera feel right, whether their help's drags read as one smooth
    hand. Helium is drawn as the pirate is, a woman (her portrait, "Lady of the flag"), and called "they"
    in the den's words (the user, 13 Nov).

- **The captain's map and its cutscene (9 Nov).** (RULES.md, "The captain's map".) Seen: the map
  "is great"; Dalnoth redrawn from his portrait and the map's view cleared, not yet seen. Watch: whether the cutscene's timing and camera feel right (about ten
  seconds), whether the map reads well from where the camera looks down on it, and whether M is
  a good key for it.

- **Towers, a lower middle and a night sky (9 Nov), not yet seen by the user.** (RULES.md, "You
  can see out to sea".) Watch for: whether enough of the beach shows from where you usually
  stand; the step down from the towers to the middle; the walk and gun tower spanning the middle
  on posts; the sky's colours in each landscape; the ship looking too close or big now it shows.

- **Swordfight at the armoury hoist (8 Nov), not yet tried by the user.** Rebuilt after the
  first demo: the board is a stack of weapon crates under a tall timber hoist on the left of the
  den; chests (fused blocks) arm soldiers, more with combos; loose crates are broken up for
  planks that mend the wall a piece at a time (RULES.md). The user wanted "to see what it feels like ... it's hard to say without
  seeing". Watch for: whether the stack now feels part of the den, and the crates big enough from
  where the camera puts it (it frames the whole hoist, 7 m high); too few soldiers now only chests
  arm them (one per chest, the first demo's six from one break looked too strong); repairs coming too often
  or too seldom (4 loose crates a piece's worth), and planks finishing a hole as a Masterpiece
  paying a breaker that makes more planks; the order you pick crates up giving you
  a say in what comes next (the user: "kind of okay. It adds a bit of an element of difference").
  Since 8 Nov Masterpieces also pay a breaker pair, sent to the front of the queue: watch for
  that making the stack too easy, or too many breakers piling up on a well-mended wall.

- **The cove (9 Nov), not yet seen by the user.** Raiders row in to a beach, and their cannon is
  on a ship out in the cove (RULES.md, "A cove"). Watch for: the cove only showing when you turn
  or tilt the view, or go up on the wall (the usual camera frames the wall, as before); the ship
  too dark or too faint in the barren den's night; a row of beached boats looking cluttered.

- **The gate and the beach (9 Nov), not yet tried by the user.** Walk up and it opens; out on the
  beach you can throw straight at raiders (RULES.md, "The gate opens"). Watch for: the camera out
  there (it looks down over the wall; the gold outline shows you under the gun tower); the gate
  opening every time you work near it inside; throwing from the beach being too easy a way to
  thin the raiders out. Not tried with a crew (a crewmate by the gate opens it for you too).

- **Bilging the shallows (9 Nov), not yet tried by the user.** (RULES.md, "Bilging the
  shallows".) Watch for: the board being hard to find (it's out on the beach to the right of the
  gun tower; nothing points you to it yet); the pieces readable from where the camera puts it; the
  tide coming in too fast or too slow (a row every 30 seconds), and being worth bilging at all;
  the rocks too harsh or too soft (a point of stamina a metre, up to 6 m); barrels too strong;
  the sea coming in close at high tide making the raids feel harder for anyone who'd rather not
  bilge.

- **The longer calm between waves (8 Nov), not yet tried by the user.** 40 seconds now (it was
  20), after being overwhelmed by wave 8; the raids stay as big. Watch for: still overwhelmed late
  on (then perhaps longer still, or longer only as the waves climb), or the calm dragging early on.

- **Turning a piece close to the wall feels off.** The user can't yet say how (which way it
  turns? where the ghost jumps to?). The snapping changes of 7 Nov may have helped, and since 8 Nov
  the whole-wall puzzle mode (arrows move the piece by screen direction); ask again.
- **The Carpentry view (9 Nov), not yet tried by the user.** (RULES.md, "The Carpentry view".)
  Tab from anywhere on the den floor goes straight on to the wall or a frame (and since 9 Nov it comes
  on by itself at a frame you bring a piece to), with Puzzle Pirates'
  own keys; it stays on between pieces. Watch for: the wall's stretch of view (15 m round the
  piece) too close or too far; the stairs' frame hard to read (dark on the dark cave wall); the
  pirate in the way (they stand beside the piece now); the tabs over the prompt (ticks where the
  piece fits); one staircase on the right, and the den 4 m deeper; Q/W/A/S on a long wall (the nearest hole that way, up or down first); still
  coming on by itself when you walk up to the wall with a piece (and staying on: Esc to walk).
  Since 9 Nov (after the user's keyboard test): left and right skip the bare stone between holes,
  Q/W/A/S always leave the hole you're at, a resting hand on the mouse no longer undoes key moves,
  Shift+Tab goes back, the tabs are a clearer bar. Watch for: the arrows' jump to the next hole
  feeling abrupt, and anything else the keys do that surprises.
- **The wall in two courses (9 Nov), not yet tried by the user.** (RULES.md, "The wall in two
  courses".) Watch for: open high holes being too easy a way in (no stone to hack first, so most
  raiders go for them while they're open); the ladders reading clearly from inside the den; the
  hole labels for the low holes sitting over the stone between the courses; the gate now tall and
  narrow (nine rows high, still four wide); the stairs as a stringer four deep (a band three deep
  was turned down before for holding too few pieces: this one holds six or seven); the wall-walk
  and gun tower half as high again (5 m); the Carpentry view taking in the whole wall (the holes
  small on a narrow window?).
- **The walk as one square frame, sawn into lengths (8 Nov), not yet tried by the user.** About
  24 pieces in an 11 by 13 frame at the right of the den, sawn into four lengths that go up end
  to end. Watch for: still running out of the right pieces near the end (a simulated build wasted
  half as many deals as the long frame, but the last few pieces still need particular shapes; if
  so, the user's other idea was odds that favour the pieces the frame needs); the frame at the
  right of the den, and the barrel and chest behind the crates, looking right; the strips'
  flight up onto the wall. Also still to try: the solid stairs and gun tower parts.
- **The first wave dealt fair (8 Nov), not yet tried by the user.** Until wave 1 is beaten, the
  crates deal the pieces that finish the holes as Masterpieces. Watch for: it feeling too easy or
  too obvious. (First wave only, the user's choice: from wave 2 the deal is random again.) Since
  8 Nov it also stops once the first wall's done, and doesn't re-deal a piece you used elsewhere
  (the user got four W's in a row building a frame); check it no longer feels stuck on. Also
  since 8 Nov: it plans all the holes together, and keeps to the usual odds (five crosses in
  thirteen pieces before); check the mix feels natural, not too many P's; and (since 8 Nov) that the piece finishing a hole comes first.
- **Layers behind (8 Nov), not yet tried by the user.** A layer is now the hole's shape again,
  filled piece by piece in a timber surround, and a full one is as strong as a Masterpiece and pays
  the same. Watch for: holes three layers deep being too strong, or the pay too generous; the
  surround looking right (only a square wide round each hole: the user may have meant a whole timber
  lining between the holes, once every hole's first layer is done).
- **Wood a piece at a time, and roomier raid holes (8 Nov), not yet tried by the user.** Watch
  for: refilling a knocked-out piece being too easy a way to hold a hole forever, and cannon
  breaches feeling too big now.
- **Holding the wall.** The cannon now aims before it fires, breaches fill with rubble, and
  turning raiders away pays (RULES.md: "Keeping them out must be possible"). Since 7 Nov raiders
  also need a gap they can walk through and arrive winded after hacking one (RULES.md: "Raiders
  walk in", "Getting through costs them"), and a hole giving way dazes the raiders at it and
  chokes the gap with rubble (RULES.md: "A wall giving way hits the ones hacking at it"). The user
  has tried the gaps but not yet the dazing. Watch for: once one gap is opened, every raider
  nearby pours through it, and a single piece in it only holds two or three of them off for a few
  seconds. If it still feels hopeless or too easy, see "Holding the wall" in IDEAS.md.
  Since 9 Nov you can also lob a piece over the wall from the den floor at raiders hacking
  outside; not yet tried by the user. Watch for: the markers on raiders outside cluttering the
  view while you carry a piece.

- **The race's rivals, what's left (11 Nov; the rivals and shooting at sea are built: RACE.md §6):** Daquan
  in Dalnoth's place once his portrait's checked and he's drawn; and the rivals' puzzles played as real
  moves where the puzzles have bots (tools/sail-bots.mjs, row-bots, nav-bots), so they're the testers as
  well (today they take the simulation's drawn times).
- **Balancing the race: a headless simulation, and 2–4 racers (11 Nov):** after more goes, the routes
  don't feel even: "the bilging one is relatively probably quick to get through, same with the carpentry.
  I mean, I definitely noticed just loading the guns and gunning takes a long time ... Gunning felt very
  unrewarding, and those turrets are really aggressive once you actually start shooting at them. If
  they're aggroed, they are very relentless." (Partly "in the real Puzzle Pirates you can run a lot
  faster, but nonetheless, we need to at least do some basic balancing just to make this enjoyable.")
  So: a test harness under the race with no graphics ("so you can just run through simulations quickly
  and easily, and just really test balance"), racing a handful of bots that each take a different
  strategy (the long way, the Gunnery gap, the locks, the crane, the whirlpools...) over many runs, and
  tuning until they "all have a relatively equal chance of winning". Racing several at once first: "start
  adding multiple players to this first, even if it's like 2 to 4 players with some bots, and obviously
  tweak the course and sizes according to that." A lock is first come, first served ("If you got through
  it first, we get through it first"); maybe more than one lock or crane spot, though not one for
  everybody. The rivals with profiles (above) are these bots. Gunnery's gap wants to pay off better for
  its time, and the turrets once roused less relentless. Before the course's next pass, so that pass is
  tuned with it.
- **Treasure Haul: any of the redrawn coins to bring back? (12 Nov):** the old look is back (RULES.md),
  but "I kind of liked some of the coins". Which, if any, to put on the old board (to pin down with the
  user).


- **Scale the far sea up and space it out (12 Nov):** "that whole area again needs to be scaled up.
  Like the fort, that Imperial Island is still tiny. And again, I just want things a bit, generally, a
  bit more spaced out now that they're getting busier." Port Decorum (its town, fort and quay) bigger,
  and the places out there given more room between them. For example "that line of sail ...
  between the Penguin Island and that back entrance. Like, it's only like one tile wide, it's tiny. I
  don't think you can even really navigate in there without bumping off the rocks. It looks silly."
  So the smugglers' run behind the rocks wide enough to sail without bumping (two or three squares).


- **The course editor down to the tile (12 Nov):** "it looks cool, especially with the map. But just
  moving stuff left to right isn't exactly much of a ... it doesn't really give you much control over,
  like, how many legs do I do? ... more fine-grained control ... you get to the tile level of what tiles
  you want where, what objects you want to move about and place. It needs to be a lot, give you a lot
  more control." So the course becomes a grid you paint square by square (water, land, rock), with
  objects you place, move and remove anywhere (buoys, the start and finish, winds of both kinds,
  whirlpools, each shortcut and its puzzle), as many legs as you like; the race laid from that grid,
  the checks (a way round, every shortcut sailable) and the balance check as now. With the race's next
  pass, as that reworks the course anyway.


- **A rival's Sailing shows on her sails (12 Nov):** "you should be able to see the [sailing] puzzle in the
  [sails]. Like, I can see Kikkit building a Vegas, but it's not showing on her [sails]." Watching the
  race, her board fills but her sloop's sails don't change. Her sails should sparkle as yours do when you
  sail well (`sail-sparkle.js`), growing as her chain builds, on every racer's sloop, rivals and online
  players alike.


- **Watching the race: the bots and what's shown (12 Nov, from the user watching).**
  - **Missing animations, the puzzling not seen:** at the lock "it's missing the animation ... missing
    some of the animations, puzzle visibility": the lock's water doesn't rise as a bot pumps, a built
    crane isn't drawn going up, the boards only show for the racer followed (RACE.md §10, "Not yet").
  - **Odd moves:** "why did that bot just go out the lock and to the left? That was a bit crazy", and
    "why did a ship just zoom right from the right-hand side to the left? ... like someone just went on
    Zoomies". (The zoom is likely the left-hand trade wind, the snake along the top back to the start,
    with nothing to show it's a snake that caught her; the lock exit to pin down.) Each racer's way out of
    a shortcut should look like a sailor's, and a snake catching her should read as one.
  - **No tactics:** "I'm not seeing people use the tiny [shortcuts]", "nobody's exactly behaving tactically
    between these bots ... Gravee is out in the lead. So the only way you're going to catch up with her is
    to take a gamble ... Nobody's even using the [winds] at the top to get to first." So the bots race by
    the race: behind, they take the bigger shortcuts and the catch-up rocks; ahead, they play safe and
    sheltered; they take the little Doubles and Triples on the way when their chain allows; they hop the
    zigzag and use the winds that help.
  - **Nobody shoots:** "I'm not seeing anybody shoot anything either. Like, no cannon." Watched, the bots
    should fire on a racer sitting still in the open as they pass (as the rivals do in your race), with
    the shot, the hit and the patch shown.
  - **More variety in the ways round:** "I didn't even see anybody ... go do the rowing, go through the
    driftwood. I love that Kikkit went through the sails, but there's a bit more variety needed there."
  - **Kikkit back at the start late on:** "Three of them finished, one of them vanished ... One's back at
    the start. I don't know what happened to her. Did she get bumped? ... Is she doing like lap number 2
    ... I'm pretty sure I thought she got through the Vegas' part." There are no laps; a failed Vegas only
    sends her back to the channel's mouth. Likeliest: the left-hand trade wind (the snake down the left
    edge, back to the start) caught her near buoy 4. Trace a watched race and account for every move that
    looks wrong, with the bar saying what happened ("caught by the trade wind, back to the start").
  - **Follow whoever you've zoomed in on, and see what everyone's doing (12 Nov):** "it should almost look
    like ... whoever you're closest to, if there's only one obvious person there, it should do that kind
    of following thing, follow [the racer], if you've zoomed in on them. Otherwise ... at least you should
    see some little representation of what they're doing." So with the free camera close in on one
    sloop and nobody else near, it eases into following her (her board shown); and every racer always
    has a little sign over her sloop of what she's doing (a tiny board filling as she puzzles, a lock,
    the crane, guns loading, a patch), so you see it all at a glance from anywhere.
  After the course's rework (the race's next pass), as the bots race whatever course it leaves.

- **The opening still says "defend the den" (12 Nov):** "The initial loading screen is more of a loading
  screen because it keeps saying defend the den still, and like we're way past that now". What you first see
  is the siege's: "Raiders are coming! Grab a piece from a crate and mend the wall", "Vikings attack in 1:00",
  the "Defend it again" button, while the den's now a whole sea of islands, puzzles and a race. (What it
  should say instead, and whether the quick siege still opens it, to pin down with the user: the message was
  cut off.)
- **How far does a chain carry her? Vegas Island's hidden rule (12 Nov):** "I did a double to get over the
  first one, and then I thought, well, it's 1, 2, 3 tiles to get to the penguins, so surely a bingo should
  take me 3 tiles, right? ... What's the calculation?" The calculation is a square a step (Double 2,
  Triple 3, Bingo 4, Donkey 5, a Vegas 7, a square more for each step past it), but the penguins' water
  also has a hidden rule: only a Vegas's gust gets in, however near it is, so her Bingo stopped on the
  wind in front of it and was swept home. To make plain (how, to pin down with the user): honest distance
  only (the penguins 7 squares from the mouth, any gust that reaches them lands), or the Vegas rule kept
  and shown (on the water, and said when it stops her short).
- **Plan your race route, then puzzle it through (12 Nov, agreed; started 13 Nov):** you can't steer and puzzle at once, so the race gets a plan: one choice for each leg (the long way or one of its shortcuts), hidden from the others, changed any time from a strip along the screen's edge with one click and no time lost from the board. The pilot sails it move by move, stops by itself at each obstacle's spot (a hop, each of the zigzag's headwinds, a lock, the crane, the barrier, the whirlpools, the door) with the board it needs up, and goes on once it's done. "That's really simple and easy." The design is in RACE.md §5. (After the course pass and the racers' moves and gusts, which use the same files.) Once it's live, design.html gets a section on it (the user, 12 Nov: "where you've got the design page to have this, the planning feature, so how that fixes the problem of wanting as a player to be able to plot your course in advance, but make those choices, but also be able to focus on puzzling at the same [time]"): the problem (you can't steer and puzzle at once), and how choosing a leg at a time while the pilot sails and stops for you lets you plan ahead and still keep your hands on the boards. With a picture from its `?at=` link, and the changelog entry.
- **Distilling's burn seemed really slow on the test page (12 Nov):** playing it yourself: "I don't think the burn's quite working when it's not in the bottle, it's just going really slow. But oh, I can click the burn button." The furnace seemed to take far too long to burn a column, at least when you're playing rather than watching a bot ("not in the bottle": perhaps "not with the bot"). The Burn button works. What's off, and when (playing alone, paused, or after watching a bot): to pin down with the user. The real game's furnace burns every 15.3 s or so. The user, later: "I don't know what you mean by that. I think that's probably just a text-to-speech error from earlier", so "not in the bottle" was a dictation slip; whether the furnace is really too slow is still to check (on the test page, timed against 15.3 s).
- **Helium's still: a proper distillery, and a bigger bang (13 Nov):** "I think the explosion needs to be more dramatic. If you look up a distillery on Puzzle Pirates, I think [Helium] needs to have at least a bigger setup. That little object that blows up in the background is very tiny." Look up Puzzle Pirates' distillery building (YPPedia) and give Helium's island a setup like it, big enough to read from the sea, and make the opening's explosion (and the bang when a white burns) much bigger and more dramatic. The user, later: "If white goes down, it should cause like that explosion animation as well", and the other way, "some meaningful animation that happens if you start sending up the white ... Helium should start, you know, distilling out some rum and filling some barrels or something." Go-ahead given, 13 Nov. **Done (13 Nov), to be played:** YPPedia wouldn't load for us, so built from the game's look as remembered: a timber distillery (`js/den/distillery.js`), plank walls open at the front, shingled roof, its sign, a brick chimney smoking, a smaller still and racked barrels inside; in its yard the big copper pot still on its furnace, the swan neck to the worm tub and its coil, a pipe out to a spout over a cask on a stillage with a sight glass, the pile of full casks beside it. The bang (`js/den/blast.js`, for anything that blows up): a screen flash, a fireball, sparks, a dark cloud that hangs about, copper, staves and shingles flying and landing, the camera shaken, the still shaking, its head blown off and landing back on, the copper sooted black and coming back; they cower, then shrug. Bigger the more whites burned (src/den-helium.ts, worksFor). Whites sent up: rum runs into the cask (a measure a white, twice for a Crystal Clear), a full cask capped, tipped and rolled onto the pile (Cellar); they turn to tend it. Watch: whether the bang's size and length feel right, whether the rum reads while you play at a 4:3 screen (the cask is at the edge there).
- **Help, Helium's bubble can't be seen while you play (13 Nov):** "you could do like the help from Helium, but they are too far to the right for the help bubble to really appear." Their advice needs to show where you can read it while at the board. **Done (13 Nov), to be played:** they stand just beside the board now, turned to you, and their bubble is kept on the screen and off the board (src/den-helium.ts, lineSpot): beside it on their side on a wide screen, below it on a phone (checked at 375 by 812), narrower to fit; on a wide screen the board sits a little left so they're in the shot.
- **Help, Helium more targeted (13 Nov, later):** "I wanted the help to be more targeted ... I'm sure we'll work on this." What more targeted means: to pin down with the user.
- **Helium's lesson in steps you tab through (13 Nov):** "for the tutorial ... we do those first phases ... you have each step of the puzzle. So maybe we just, for the tutorial, kind of, we could tab through the steps and say, like, step one is getting a few columns on the right-hand side that are about to burn completely free of white pieces. Like maybe that's just step one." The lesson as the puzzle's stages, one at a time, tabbed through: step one, a few junk columns on the right, the next to burn, cleared of every white. The later steps to draw from DISTILLING.md's notes (the techniques by stage, the seventh note) and to agree with the user. After the distillery pass lands (it's in Helium's files now). The user, then: "let's just really take it one step at a time. Just do that clearing ... a few columns to the right first ... because otherwise, yeah, the furnace blows up and, you know, I've already got no eyebrows." So step one only, for now; the four drafted steps (clear the right; keep the wall upright; browns down through the blacks when columns stop finishing; before the end, browns down then up and the hooks lined up) wait. **Step one done (13 Nov), to be played:** after the mishap (what skipping it does), Helium's step one, said in the bar as Step 1: the three columns next to the fire cleared of every white on the real lesson board (the bots' rescue, worked out in src/den-helium.ts's lessonPlan; the lesson's deal picked so it clears in 7 drags), and why: "Otherwise the still goes bang. And I've already got no eyebrows." Then your go with step one as the goal at the foot of the screen (how many whites to go), and their line when you've done it. `STEPS` has room for the rest.
- **Helium's lesson goes by far too fast (13 Nov):** "the speech and the animation is over so quickly. Like, it's supposed to be a little cutscene, and it's like half a second." Each line up long enough to read, each drag played slowly enough to follow, a pause between beats, and a way to go on when you've read it. **Done (13 Nov), to be played:** lines were up 1.4 s plus 0.05 s a letter and their drags 0.2 s a swap; now a reading pace (3.2 s at the least, about 2.5 words a second), the opening's bang 3.5 s on its own, drags 0.55 s a swap after a 1.6 s look at the line, a breath between beats (src/den-helium.ts, PACE_LESSON, tested); Space, Enter or a click goes on once a line's been up a moment, Esc skips. Timed in the browser: about two minutes, opening and lesson together.
- **Helium and Tzz don't do their portraits justice (13 Nov):** looking at Helium's portrait (black and white, the Atlantis trinket, a dark purple monkey on the shoulder): "I don't feel like the character really does her any justice ... I can see she's been given the ears, but like the whole tone and colour of everything, like the shading on the [portrait], she looks really good, but her character in the game really does not. To be honest, I think I found the same with [Tzz] as well. I think the quality of their appearance really needs working on." So: a pass on how the real pirates look in 3D, starting with Helium and Tzz, matched against their portraits: colours and tones, shading, proportions, their pieces (the cat-eared mask, the Atlantis trinket in Helium's hand, left out before as it's not in the wardrobe; the monkey's dark purple). One phrase was lost to dictation ("Why should she be given a poke?"; perhaps the hair, drawn as a bun): to pin down with the user.
- **Helium's opening: show a white burned causing the bang, and say so (13 Nov):** "maybe there should be a bit more of a link in the initial dialogue to the idea of just make sure you don't send any white pieces down into the burner. And maybe in the initial opening animation, you actually see some white being burnt, and that's what causes the explosion." So the opening shows the board: a column with a white in it goes down into the furnace, and that's the bang. Helium's lines tie it together (the mishap was a white sent down; the one thing to know is never send a white down), leading straight into step one. The lesson's later mishap beat may then be one too many. Then (the same day, go-ahead given): drop the basic mechanics from the lesson: "some of the speech they've got about, oh, blacks up, [browns] down, whatever it is ... basic move mechanics ... Puzzle Pirates does that. That tutorial exists. I'm sure people can work that out. This is more about technique to get to [Crystal Clears] and opening up with the right. First things first. See all these whites on the right, you know, highlight them all. Right, we want to get them out of the way because ... otherwise ... silly mishaps happen." So no swap rule: the lesson opens on technique, every white in the right-hand columns highlighted, and why they go.
- **Helium sends you on to other pirates (13 Nov):** "helium said to teach you some tricks, but ... don't forget, you know, the greatest love of the game is talking to other pirates ... this is not a replacement for the game ... this is a tool, a side adventure ... We should be watching people, looking at YouTube videos, talk to people, just whatever." So once Helium's taught their few tricks, they say plainly the rest comes from other pirates: ask about, watch them play, their videos. The principle is in STORY.md and RULES.md, for every teacher in the den.
- **Distilling bots: measure whites burned by when (13 Nov):** "why it's burned in itself doesn't feel like it means much ... I would measure like the early game by how many like mixed brown black columns you burn before you burned a white ... if you burn a white on the first column or the second column that goes up or down, that's catastrophic. That's game ending ... If you're playing well, you should never burn a white." So the bots' report leads with sessions with no white burned, junk columns burned before the first white burned, and early burns counted as disasters (DISTILLING.md, the twentieth note).
- **Distilling bots: a brown a flick lower when it costs next to nothing (13 Nov):** the bot dragged a brown up the plain diagonal near the top right; "I would have put it further down ... it gets that black piece up. It creates ... a more connected board on that right hand side ... you don't want to really actively be going out of your way, spending extra moves to sort them at this point. But it's still preferable if it costs you very little ... a little flick and a swish, and the brown can be one level lower." A tie-breaker among moves that do the same job (DISTILLING.md, the twenty-first note).
- **Distilling bots: no urgency about whites low by the fire (13 Nov):** "there's no urgency in this script ... it doesn't seem fussed that you're only one column away from a couple of whites burning at the bottom ... It seems to be working ... the top part of the board still ... the top board's safe. Moves are easy there. You've got a spice and a bunch of stuff blocking things at the bottom. Like, that's your danger area that's hard to reach." The whites next to burn, and how hard they are to reach, should come first (DISTILLING.md, the twenty-second note).
- **Distilling bots: whites mostly left, now move the junk in blocks and build the V (13 Nov):** "it made me a bit anxious ... it's doing a lot of little fiddly things ... I would just start pulling, like treating it more like blocks of things to move ... you've got the whites mostly over to the left. This is where you just start saying all those three browns, move them up, all the blacks on the bottom left, pull them all the way down and start building that V shape." (DISTILLING.md, the twenty-third note.) Then the board they'd end up with: whites a block on the left, the junk all right, "note that I've left the brown at the bottom left ... I want to use that to haul black pieces up potentially ... you don't want to just get too greedy" (the twenty-fourth note). Then, with the V there: "that's when I start pulling the browns in, then the blacks down ... I've looped some of the browns around, the blacks are then moving over ... you want the V to be made of ... browns there, preferably more than blacks ... it's still easy to go grab a brown and pull it over when you need it" (the twenty-fifth note).
- **Helium's lesson, the later steps from the user's critiques, concise (13 Nov):** "these are my individual critique guides or critiques, but obviously we want to make this into a more concise tutorial for Helium to give." So DISTILLING.md's notes (the twentieth to the twenty-fifth, and on) become Helium's steps after step one, each short: never a white down the fire, the danger low by the fire first, a brown a flick lower, then the block moves into the V, a brown kept bottom-left, the browns into the V's bottom. One step at a time, as step one was. Then (the same day): levels by a target, "this is how I build a crystal clear 2. That's the initial tutorial, and then you can control what level of tutorial you want": a target chain set first, which sets how much to bank, how long each stage lasts and which tricks it needs (DISTILLING.md, the thirtieth note). And Helium says the target as they teach it (the user, the same day): "he's going to explain ... what the target is. Like, we're going to get some of those whites over. Our goal is to get ... one column full of white pieces. So phase one is get things over, and then we're going to start building the whites to the left ... and then we're going to start gradually increasing the number that we get." So the first level's lesson: the goal is one column of whites; phase one, the junk over to the right; then the whites built up on the left; one column sent up; the next level aims for more. After the bots' target levels land. And your best remembered (the same day): "save it in the local memory, so [they remember] what your best crystal clear is. So the idea is each time you come back, you'll try to work on that breaking that personal best." Done 13 Nov: your best Crystal Clear at their still is kept in this browser; coming back to the still they say it ("Your best's a Crystal Clear 3. Let's beat it.", or with none yet the first goal, one column of whites), and when a chain beats it they say so and remember it. Still to do with the target levels: Helium's lesson and watch mode aiming at your best plus one. And every lesson ends with "Any questions, send me a tell on Emerald" (the user: "to really mess with Helium"; done 13 Nov).
- **Tzz and Umami send you on to the community too (13 Nov):** "I think TZZ and Umami, you can kind of say the same as well ... these are the starter things, but, you know, these guys are amazing. They stream on Twitch a lot. Check out ... link up to the community, especially in the Discord channels ... The official Puzzle Pirate one and the Trophy Hunter community ... where people coordinate things, puts Twitch streams and such." Tzz's done 13 Nov: her lesson ends, after the Bingo, with the starter stuff done, Twitch and the two Discords. Still to do: Umami (he doesn't speak, so how?), and the real links (the Discords' invites, Tzz's and Umami's Twitch) and the community's exact name, from the user.
- **Helium nervous when you leave whites by the fire (13 Nov):** "imagine Helium getting nervous if you're not really clearing out the whites, because Helium's going to be nervous that the distiller is going to have a mishap." Done 13 Nov: at your still, a white in the furnace's column gets them uneasy about 9 seconds before it burns, panicking and cowering about 3 seconds before, and saying phew if you get it out in time.
- **Helium's speech bubble off the edge of the screen at the end (13 Nov):** "I'm looking at the helium thing at the end again. The speech [bubbles] are really off the edge of the screen. There may be two-thirds of them are on the screen, half." Their line should always sit whole on the screen. Done 13 Nov: every pirate's line is kept whole on the screen, side to side. With it: "I can't see helium at all ... still need to see more of the puzzle ... you don't need like the menu at the top again in these views"; done the same day: no den panel at Helium's board, the board bigger, and Helium beside it once the screen's wide enough. Then ("on mobile, I can't see helium at all"): on a phone, where they stand off the screen, they're shown in a little framed window at the top left, a second camera on their face, their line beside it. And bigger ("a bit bigger ... removing more of the dead space"): on a phone the board fills the width, the still's picture tucked up beside Helium's window. When Helium's nervous, the whites they mean are ringed on the board ("it should like visually indicate like highlight the pieces").
- **Distilling bots: the Ultimate walls in a white by the fire, burns early, crawls too soon (13 Nov):** watching the Ultimate on seed 1. A white at the top of the third column from the fire, beside a spice: "It should have moved it into that spot behind the [spice] ... I would be taking some of those browns in the far bottom left and be like racing them up there"; then "it even moved some blacks in the way at the top that actually block getting that white piece out ... Why have you blocked it all in?" Then "3 burns just happened in rapid succession before it even made another move. Is that why it's struggling and failing?" And "a lot of crawls and kind of looping things up motions ... still being done at an early stage when there are much simpler techniques ... through [the V] in one big giant sweeping motion". And a black let go "one short" of the corner, when a swap more and the brown in the bottom middle would have levelled the bottom. Traced (DISTILLING.md, the twenty-sixth to twenty-ninth notes): whites only count as in danger in the last two columns; columns are burned early with whites in the next ones; the phase weights are switched off whenever anything's stuck, which is nearly always; a drag's let go where the score peaks. Go-ahead given (13 Nov): "Just do for all of them", the four fixes and the target together. And the bots' levels by their target, not their names: "I don't want to say able blah blah blah. I want to say what is the bot's target crystal clear and it will try and work towards it. Like once it's got a crystal clear one, it will start sending them up ... it will just be like one white column ... and then it will start working on the next one." So each bot is a target chain (CC^1, CC^2, CC^3...): it banks the whites for that chain, sends it up, then starts on the next; its report leads with its mean chain against its target (DISTILLING.md, the thirtieth note).
- **Helium's opening a bit long, once only, and in on the board for the lesson (13 Nov):** "his initial cutscene goes on a bit too long now. As long as you can skip it, that's fine. I've said I wouldn't want that playing every time, but I think that's standard. Also, when he starts moving pieces and showing you how to get the whites out of the way, it really should be zooming in on the board by that point." Done 13 Nov: Esc still skips it all; their lesson was remembered as seen in this browser (undone the same day: the user wants it again after a refresh); and from step one the camera is in on the board as at your still, Helium beside it on a wide screen, in their little window on a phone. Then which part: "not trimming, but just like ... the time they hang around for. Certainly ... by the time you get to is it safe, it's a bit like, well, come on, get on with the puzzle." Done 13 Nov: every line's up for less (about 3.3 words a second, was 2.5; 2.5 s at the least, was 3.2), the bang's moment 3 s (was 3.5), a shorter breath between beats; Space still goes on sooner.
- **A black bar over the top of Helium's lesson on a phone (13 Nov):** "on mobile, there's just like a black bar in the top of the screen ... it's blocking all the chat and the animation." The cutscene's letterbox bar at the top covered Helium's little window and their line. Done 13 Nov: at Helium's board on a phone (upright), no bar at the top; the bottom one, with the step and the keys, stays. Checked at 375 by 812.
- **A read version of every tutorial, kept in sync: Distilling first, then Tzz's (13 Nov):** "Do you have a summary document of the strategy that the bot is taking now? ... what are the rules, what are the phases, what are the tricks and techniques ... it would be quite good to actually have that as a document anyway to point to if people just want to go have a read version, similar to how we've got the those design docs ... a 2D static version of the guide, and ... everything's just kept in sync, like the animated version, the 2D static version ... So we could do the same with the TZZ tutorial of how to do doubles and bingos or Vegas." There's no such guide yet: the strategy is spread through DISTILLING.md's notes. So a public page, Distilling's guide: the rules in brief, the target (a Crystal Clear to aim for, the levels), the phases (fire, fill, block, chain) and what each is after, the techniques with a 2D board picture each, the tricks from the user's notes; drawn from the same code as the lesson and the bots (the boards, Helium's lines, the phases' and techniques' names), so they can't drift. Then the same for Tzz's balloon animals (doubles, Bingos, Vegases). The rule is in RULES.md.
- **Distilling's read version: the progression out of order, some arrows confusing (13 Nov):** "Just been through the guide, and it seems like a few of the simple things are a bit out of order just reading the read thing. So, you know, progression's a bit weird ... and some of the arrows are a bit confusing at times." The guide goes rules, target, the four phases, then every technique by the level that adds it, then the tricks at the end; so the first things a player needs (never a white down the fire, the danger by the fire) come last, and the chain's channels sit among the simple ones. Which arrows confuse: to pin down with the user. With it, the sorted right side's one fluid motion (DISTILLING.md, the thirty-first note): "once there's a nice clear separation, it's just down, up and back up again", for the guide, Helium's lesson and the bots. Go-ahead (13 Nov): "go ahead and reorder the guide and add the fluid motion thing." Done 13 Nov for the guide: each phase in order with its own tricks and techniques under it, simplest first, each tagged with the level that brings it in (storing and the leapfrog moved to the blocks, where the phase weights put them); the fluid motion drawn on the picture's own board, the drag found by the code; the arrows one colour a drag, a dot at the pick-up, the head only at the end, numbers placed clear, there-and-back stretches as two lanes. Helium's lesson and the bots still to learn the fluid motion.
- **Distilling bots: frozen with whites at the bottom, the blacks' diagonal left, drags stopped short (13 Nov):** "It seems to have just frozen ... It seemed to really neglect clearing out the diagonal of blacks ... eventually you end up with these white gaps at the bottom ... maybe it's stuck because it requires maybe a few moves just to kind of get the brown into the right position. And then you can use it to drag across a few blacks and then just mass drag them down"; and "it doesn't really still finish dragging things all the way to the right when it's got the opportunity ... you could go one step further, just do it." (DISTILLING.md, the thirty-second note.) Passed to the bots' round in progress.
- **Duty Navigation: stars should drop slowly, the ring selected hard to tell, turning jumpy (13 Nov):** "for Duty Nav, the pieces are supposed to slowly drop. It's feeling really weird ... some of the highlights as well and the contrasts are a bit off"; "the highlight between the selected ring and a non-selected ring is relatively minimal, so it's making it hard to tell what ring"; "the turning animation, it's just very jumpy and jagged. It's not as smooth as I expect." Done 13 Nov (js/den/nav-board.js, every Duty Navigation board, the starlit door's too): a star drops in and falls at a steady, slow pace, about a third of a second a ring (was a sixth of a second whatever the distance); the ring selected lit plainly, a bright band with gold edges either side, gently pulsing; a turn takes a quarter of a second, eased, and a run of turns flows on without stopping at each spoke. Other contrasts the user meant: to pin down with them.
- **Gunnery at sea: W A S D steered her instead of pointing the chalk (13 Nov):** "in guns, [WASD] should be controlling the arrow direction, not turning the ship." Done 13 Nov: at her guns W A S D point the chalk arrow the way you press, as on the gun tower, and don't steer; the arrows still move along the planks; the prompt says so.
- **The race's rocks: one hit to bring them down (13 Nov):** "the gunning barrier is definitely need tuning down, like maybe just try it even with one to get through them, like the one that you start with, because any amount of gunning otherwise just feels unworth it." Tried 13 Nov (ROCKS.HITS 3 to 1): the balance check then has the rocks' route winning 41% of races against its cap of 40%, and the barrier's (Foraging) route 12.1% against its floor of 12.5%; every other route still fair. Held back, for the user to choose: one hit as it is (and the caps widened), or one hit with the rocks' route a little longer, or two hits. Then "Try 2 hits" (13 Nov): with two, the rocks' route is fair, but the barrier's (Foraging) route still wins 12.1% against its floor of 12.5% (it was above it at three hits, so the rocks take a few of its wins). Held at three again, for the user: two hits with the barrier's floor eased a hair, or two hits with the barrier made a little quicker. Meanwhile the rocks' look copes with any number of hits (every course still standing comes down with the last).
- **Bilging at the canal: zoom in, the puzzle's tiny (13 Nov):** "[Bilging] at the canal, you definitely need to be zoomed in more. It's so tiny, the puzzle." Done 13 Nov: the camera at a lock's quay pump fits the board with a little room (was 1.75 times that, to take in the lock beside it), and your zoom at sea no longer shrinks it, as at her deck patch. Not checked in the browser.
- **The crane you build in the race: tiny, its arm floating (13 Nov):** "the crane that I built was really tiny in the race, and there's actually no connection even between the [pieces]. It's so small that there's no connection between the bits. So, like, the arm is just floating in midair." The crane built in its notch (Carpentry's frames) wants to be drawn much bigger, and its parts joined: the mast, the arm, the hook all connected.
- **Distilling bots: never burn by hand, no cap on a drag, CC^1 banks one column, its column shown (13 Nov):** "I've got the bot on aiming for CC1, but it's just going and going ... My intention was ... it would highlight a column and say, look, I'm aiming to build a crystal clear one here ... don't have any limits on how long an individual pull can be ... definitely get rid of manual burns ... that's why no one's getting past CC2 ... just don't ever do that. Never." Done 13 Nov: no bot (nor Helium's Help) ever burns a column by hand; a drag's let go where the board's best, the longest such, and the cap on a drag's length lifted (40 swaps, more than any board needs); the bots bank a column of whites a Crystal Clear of their target (CC^1 one column, was four; six at the most); on the test page the bot's aim is said first, banking or "building a Crystal Clear in column N", that column shaded gold on the board. Not measured yet over 20 boards.
- **Distilling bots: a brown stuck at the top of the column going up, rescued (13 Nov):** "this is absolute danger mode ... the first thing I would be doing here is just rescuing that brown piece, because that gives you your crystal clear 2 or 3 easily here. You got a brown piece there, look, that can move up, and then a black that can hop along the top, and you'd rescue the brown piece. You'd then be able to pull it back. It's not applying those techniques in a really urgent situation, and it's actually burned several columns and just left this here. Like, there was lots of time to rescue it even before now." The furnace's column all white but a brown at its top; the user's drag brings a black along the top row to free it. The thirteenth run found the same: in the chain a brown or black stuck on the edge of the column going up needs a pair working together, which no routine finds. To do, urgently, and early (there was time).
- **Helium's lesson as goals: CC^1 first, a plan shown, the batch done when it's met (13 Nov):** "in the tutorial mode, obviously, if we're aiming for crystal clear one, the whole thing should obviously just finish and then restart the next puzzle once you've hit that goal. I guess maybe you could say, no, you should do it again"; then "Might be a bit tedious if you have to go through every single CC level one by one. So maybe you can say, you're aiming for at least one, but do a few more if you can." And the structure after the goal: "she says starts with a goal, one crystal clear, but then it's just kind of like it's just a message. Nothing. There's no structure after it. It's not like, oh ... what I will do is maybe ... try and get those three columns of blacks out of the way and start getting all the white pieces over here and like highlighting some column ... and arrows of where they think the white pieces should go." So at your still: the goal (at least a CC^1, more if you can), then Helium's plan step by step on the board (the junk columns to clear, the column the Crystal Clear will be built in shaded, arrows for where the whites go), and once the goal's met the batch is done: well done, go again or on to a bigger goal. **Done 13 Nov, to be played:** at the still each batch has a goal, at least your best plus one (a Crystal Clear 1 to start), more if you can, said as you sit down and in the bar. Their plan for it is the planner's own (`advise` with the goal as its target; one more than the chain once it's met), shown a step at a time as the board changes: 1, the junk columns to burn shaded red, the whites in them ringed; 2, whites banked left (only when the board hasn't enough for the goal yet); 3, the Crystal Clear's column shaded gold, the junk in it ringed; 4, send it up (X burns the junk ahead). The planner's next drags drawn as numbered arrows throughout, Helium's line as each step starts, the step in the bar. Once the goal's met and the chain ends (or the flask fills), the batch is done: the board stops, their well done (the first time, the other pirates and the tell on Emerald), your best kept, then R the same goal again or N a bigger one (past your best), on buttons too, a fresh board. src/den-helium.ts (goalFor, Batch, planFor, PlanLines), tests/helium-goal.test.ts. Still to do: the read version (distilling-guide.html) to show the goal and the plan's steps.
- **The flask fills a step each Crystal Clear (13 Nov):** "the jar thing at the top should fill up each time you do a crystal clear ... one nth": the flask above the still fills by one n-th for each Crystal Clear, n the most there can be. **Done 13 Nov:** n is 12 (twelve columns of whites fill the flask's 100 pieces, eleven don't; from the twelfth Crystal Clear in a row it carries on), so at Helium's still the flask fills a twelfth a Crystal Clear sent up, twelve marks up its side (src/den-helium.ts, flaskLevel; distill-board.js's `flask` option). The real flask's rule, 100 pieces, still ends the session.
- **Helium's opening plays again after a refresh (13 Nov):** "Going to this Helium's Island isn't playing the thing anymore ... if I refresh the browser there, it should. I don't want it to be stored in local storage." Done 13 Nov: seen once a page load, as before; the browser's old mark cleared.
- **Distilling: positions to critique, turned into tests (13 Nov):** "are we able to create just some sort of set of tests and are you able to like lead me through them of like create a few random boards or ... snapshots from partways through the game that I can critique and we can create some real deterministic test on what I think the bot should be doing at that point, either at the strategic level or specific move level ... at the moment, I feel like I'm critiquing, but it's not really having the specific impact, and it's not very regression-proof." So a set of positions taken from the bots' own games at telling moments (danger by the fire, a stall, a chain about to break, the block phase), each shown numbered with the bot's move drawn, on a page readable on a phone; the user says what should happen (a phase or plan, or a move, drawn as now); each answer becomes a test on that exact board (what the bot must do, or must never do), kept in a file of positions, so every critique stays fixed. Built 13 Nov (`distilling-positions.html`, twelve positions P1 to P12). Verdicts so far: P1 and P2 (13 Nov), the top right first early on, before its whites are trapped (risk management and priorities; open: the bots don't yet). P3 (13 Nov): with time in hand, the quick sorting moves first, blacks down and browns up (open). The theme from them (13 Nov): "you need some kind of little agent or something that detects, traps, and risks and prioritizes which white pieces to try and rescue": a risk reader for the bots, each white ranked by how trapped it is and how soon its column burns, the riskiest worked first, quick sorting moves when nothing is at risk; the open verdicts its tests. P4 (13 Nov): by the fire, fill the gaps as fast as you can, junk raced into the whites' places (a brown up, a black down: column 9's two gaps in two moves), not one white dragged a long way (open). P5 (13 Nov): column 8's top two whites first, with no way for a brown to reach them; the bot's move fine but the bigger danger missed (open). P6 (13 Nov): no big, long, complicated moves; the trapped whites at the top of columns 8 and 9 first (open). P7 (13 Nov): a board gone really wrong; the risk reader names the board's state (an enum: healthy, at risk, damage control) from how many pieces are stuck, how many columns the junk can still fill, and junk stranded among the whites, and every choice reads it; here damage control, columns 8 and 9 filled fast, then the stranded blacks and brown in columns 5 and 6 out left (open; the user's message was cut off at "you could still get like a crystal clear 6 or"). P8 (13 Nov): sort columns 9 and 10 fast before one burns (blacks up, browns down: the zigzag needs two solid columns), then fix the V; the V left too long (open). P9 (13 Nov): the sweep stopped short; better, the tail of browns at the bottom of columns 7 and 8 sorted down first, so the next sweep runs all the way (open). P10 (13 Nov): a cracked board (blacks stranded at the bottom among whites, browns at the top): hold off lifting the middle's browns to the right, they're the tools to rescue the blacks; switch from filling to fixing (open). And "why are things only half moving?": the page draws the bot's one-swap drag faithfully, but its reason says "down through the browns" (to pin down with the user). P11 (13 Nov): skipped, "not a valid question, because something went wrong": a lost board, its lesson upstream. P12 (13 Nov): skipped too, "you would not get into that situation if you're any good". Then (13 Nov): "keep all of that ... kind of organize them into the themes for those test examples": the positions' tests and page grouped by theme, once the board reader is merged (it edits the same files): trapped whites near the fire first (P1, P2, P5, P6); fill by the fire fast (P4); quick sorting when nothing's at risk (P3); the board's state, damage control (P7); a cracked board, keep the tools (P10); the patterns on the right and below, the ladder and the V (P8, P9); and the skipped, lost boards (P11 and P12, the user confirmed, 13 Nov), marked skipped in the code rather than listed as todos. Then (13 Nov): "once you've done that and trained the bots ... build up the list of examples so that I think we could definitely go with a lot more and speed through them ... we'll test that those are behaving and categorizing the way we want, as well as a new batch." So after the board reader: check the first twelve read and play as judged, then a bigger new batch of positions (twenty or more, from fresh games with the reader in), each shown with the bot's reading (its state, the risks it rings, its tactic) and its move, laid out to judge quickly (agree, or a line of what's wrong), each answer a test. And (13 Nov): "Maybe not just like a few, could be like a random batch, but then maybe it can try and see, like, here's a challenge. Can you find one or two others in the same theme and different boards to see that that feature is detecting those themes is working?" So the batch is two parts: a random set, and for each theme already judged, one or two fresh boards the reader says show that theme (found by searching bot games for its reading), to confirm the detection holds on boards it wasn't built on. The board reader (13 Nov, the thirty-fifth note): risks spotted piece by piece and as groups by pattern (stranded junk, the V and its tail, the ladder), the board's state named and the tactic in play, every move weighed by them; started 13 Nov with the open verdicts as its tests.
- **The den's menu as a hamburger menu, on a phone above all (13 Nov):** "the menu, certainly on mobile, can be more of a hamburger menu." The panel at the top left (Your pirate, Your den, Decorate, Pause...) folded behind one button. And hidden in any puzzle's view, as it now is at Helium's board.
- **Help, Helium: hinting, the path shown, and their plan for this part of the game (13 Nov):** "as well as helium helping, they can be hinting as well, so it shows you the path. Of what the next moves are they would do. And maybe ... plans out a few of like, well, this is the thing I will do at this part of the game." So a hint mode beside the help: the next drag or two drawn on the board as a path (not played), and what they're working towards at this stage in a line (to shape with the user). And with Helium's nerves (the same day): "when he's kind of highlighting the white pieces ... maybe it should show some arrows of nearby routes of pieces that can be dragged into the spots": with the whites ringed, arrows for the nearby junk pieces' drags that would take their places (the path search's routes). And three ways at the still (the same day): Help (they play it), hints and feedback, or "the watch helium play option where he explains, well ... first of all ... I'm going to try and get rid of all the white pieces in all these columns, and then just kind of step by step what you're thinking based on the whatever technique or strategy". So the bots need a phase of their own they say aloud ("this is the current phase I think I'm in"), and the phase sets each technique's weight: "it can always use all the techniques if it absolutely needs to, like it gets stuck or there's a blocked white piece. But ... different techniques have different weights depending on the stage." Done 13 Nov: the bots' phases (fire, fill, block, chain) with weights by phase; hints on G (arrows, and routes into a ringed white); watch Helium on W. Then ("you've got 2 of the 3 in that column, but there's no route shown for how that third white can get out. It should show all of them"): every white in the columns a hint clears gets a pale route of its own, and every white by the fire one before any gets two.
- **Hold the fire and burn by hand at Helium's still (13 Nov):** "Should have the ability to pause auto burning and burn manually if you'd like to slow down, helium should reference the keyboard shortcuts for it at points." Done 13 Nov: F holds the fire (nothing burns till X), F again lets it go; held through Help and watching them; they say the keys as they hand you the board, in the bar, and after they panic the first time or two. Then held to start with ("Maybe it should start that way ... if you're ready for it to start burning automatically, hit so-and-so button, but it's paused by default. I think that's much more tutorial-like"): Helium says so handing you the board, and on a phone there are buttons, Start the fire (F) and Burn now (X). And funny about it ("saying I'm gonna hold the automatic burner so we don't have any of these mishaps. But ... when you feel ready, hit [the key] and it can start burning automatically"): done the same day, a beat before your go. (Of the hints and watching them play: "well aligned ... more of a single toggle so I like that".)

## Spotted along the way (not asked for)

- **The camera indoors:** walk into the shack and its near wall hides you. Fade it out then.
- **Your den's preview** shows your flag on every tab. The Shack tab could show the shack itself
  (painted as you choose), and the Den tab the landscape.
- **Wave sizes for a crew** may need retuning after the cannon change; only solo was tested.
- **Not checked yet:** the look and den messages between two real crewmates (only tried solo),
  and the shack on a narrow den (the left-hand crate could crowd its floor frames).
- **The tests exit with an error though every test passes (12 Nov):** vitest reports "Timeout calling
  onTaskUpdate" from a worker (twice in a full run) while agents run alongside on the same machine, so
  `npm test` exits 1. Find what holds a worker up (a long test without a break) or cap the workers.
- **Helium's lesson reads the board too: the bigger risks first (13 Nov):** "the tutorial mode as well, like those bigger pattern things again. So it should be like go for the default and the focused view, but if you spot those bigger risks, focus on them instead ... if you start getting into those situations, like that's why I would expect Helium as the kind of little instructor to be like, you know, you've got a lot of trapped pieces, and start highlighting them, similar to how you do with the targets, and say, I think you need to worry about this." So at Helium's still, their goal-led plan stays the default, but when the board reader (the thirty-fifth note) spots a bigger risk (trapped whites near the fire, junk stranded among the whites, the V gone bad, the board cracked or in damage control, or about to lose the zigzag: "when you're at risk of losing the ability to do the Z thing, where you can bring pieces up and down on the right ... That's a risk", the right-hand pair unsorted as the column it needs comes up to burn), Helium says so in their voice and rings those pieces on the board, as the plan's columns are shaded now, until it's dealt with; then back to the plan. Built on the board reader once it's merged.
- **Helium's lesson: its plan's moves to feel like teaching (13 Nov):** playing it: "I kind of get the idea that fine, [they're] trying to get you to get the whites over into that yellow column, but I think the graphics need work ... it's giving you really complicated moves. Oh, okay ... now it's kind of making some sense ... I'm not really sure that seemed very tutorial-like. Like, am I supposed to be able to figure out and spot similar things? Yeah, so I think just a bit of the user experience on that needs refining." So the moves Helium shows should be ones a learner can see and repeat (short, one at a time, each with why it works in a line), drawn more clearly, and teach the pattern so you can spot the next one yourself, not a bot's long plan to copy. Then: "the drawing of the arrows was all fine ... if we go for a crystal clear one, that those were complicated moves. Like best for like maybe for later, sure, but for crystal clear one starting, no." So the arrows stay as they are; the moves scale with the goal: plain one-to-three-swap moves at CC^1, the long plans only for bigger goals later. Started 13 Nov.
- **Two drags that are one move (13 Nov):** at Helium's still, the plan's moves: "drag the brown to the right, and then the white to the left. When to me, it's like, well, why isn't that just one move? So I guess this explains why things are being caught one short, is it's not, oh, I can't go further. It's I want to drag this up and then the white" (the message was cut off there). A one-swap drag of a brown onto a white, then the white it moved dragged on, is the same as holding the white and dragging it the whole way in one go: the bots' plans (and Helium's) should make it one drag, as a player would. A likely cause of the drags "stopped short" (the thirty-second note).
