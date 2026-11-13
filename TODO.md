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
- **Plan your race route, then puzzle it through (12 Nov, agreed):** you can't steer and puzzle at once, so the race gets a plan: one choice for each leg (the long way or one of its shortcuts), hidden from the others, changed any time from a strip along the screen's edge with one click and no time lost from the board. The pilot sails it move by move, stops by itself at each obstacle's spot (a hop, each of the zigzag's headwinds, a lock, the crane, the barrier, the whirlpools, the door) with the board it needs up, and goes on once it's done. "That's really simple and easy." The design is in RACE.md §5. (After the course pass and the racers' moves and gusts, which use the same files.) Once it's live, design.html gets a section on it (the user, 12 Nov: "where you've got the design page to have this, the planning feature, so how that fixes the problem of wanting as a player to be able to plot your course in advance, but make those choices, but also be able to focus on puzzling at the same [time]"): the problem (you can't steer and puzzle at once), and how choosing a leg at a time while the pilot sails and stops for you lets you plan ahead and still keep your hands on the boards. With a picture from its `?at=` link, and the changelog entry.
- **Distilling's burn seemed really slow on the test page (12 Nov):** playing it yourself: "I don't think the burn's quite working when it's not in the bottle, it's just going really slow. But oh, I can click the burn button." The furnace seemed to take far too long to burn a column, at least when you're playing rather than watching a bot ("not in the bottle": perhaps "not with the bot"). The Burn button works. What's off, and when (playing alone, paused, or after watching a bot): to pin down with the user. The real game's furnace burns every 15.3 s or so. The user, later: "I don't know what you mean by that. I think that's probably just a text-to-speech error from earlier", so "not in the bottle" was a dictation slip; whether the furnace is really too slow is still to check (on the test page, timed against 15.3 s).
- **Helium's still: a proper distillery, and a bigger bang (13 Nov):** "I think the explosion needs to be more dramatic. If you look up a distillery on Puzzle Pirates, I think [Helium] needs to have at least a bigger setup. That little object that blows up in the background is very tiny." Look up Puzzle Pirates' distillery building (YPPedia) and give Helium's island a setup like it, big enough to read from the sea, and make the opening's explosion (and the bang when a white burns) much bigger and more dramatic. The user, later: "If white goes down, it should cause like that explosion animation as well", and the other way, "some meaningful animation that happens if you start sending up the white ... Helium should start, you know, distilling out some rum and filling some barrels or something." Go-ahead given, 13 Nov.
- **Help, Helium's bubble can't be seen while you play (13 Nov):** "you could do like the help from Helium, but they are too far to the right for the help bubble to really appear." Their advice needs to show where you can read it while at the board.
- **Help, Helium more targeted (13 Nov, later):** "I wanted the help to be more targeted ... I'm sure we'll work on this." What more targeted means: to pin down with the user.
- **Helium's lesson in steps you tab through (13 Nov):** "for the tutorial ... we do those first phases ... you have each step of the puzzle. So maybe we just, for the tutorial, kind of, we could tab through the steps and say, like, step one is getting a few columns on the right-hand side that are about to burn completely free of white pieces. Like maybe that's just step one." The lesson as the puzzle's stages, one at a time, tabbed through: step one, a few junk columns on the right, the next to burn, cleared of every white. The later steps to draw from DISTILLING.md's notes (the techniques by stage, the seventh note) and to agree with the user. After the distillery pass lands (it's in Helium's files now). The user, then: "let's just really take it one step at a time. Just do that clearing ... a few columns to the right first ... because otherwise, yeah, the furnace blows up and, you know, I've already got no eyebrows." So step one only, for now; the four drafted steps (clear the right; keep the wall upright; browns down through the blacks when columns stop finishing; before the end, browns down then up and the hooks lined up) wait.
- **Helium's lesson goes by far too fast (13 Nov):** "the speech and the animation is over so quickly. Like, it's supposed to be a little cutscene, and it's like half a second." Each line up long enough to read, each drag played slowly enough to follow, a pause between beats, and a way to go on when you've read it.
- **Helium and Tzz don't do their portraits justice (13 Nov):** looking at Helium's portrait (black and white, the Atlantis trinket, a dark purple monkey on the shoulder): "I don't feel like the character really does her any justice ... I can see she's been given the ears, but like the whole tone and colour of everything, like the shading on the [portrait], she looks really good, but her character in the game really does not. To be honest, I think I found the same with [Tzz] as well. I think the quality of their appearance really needs working on." So: a pass on how the real pirates look in 3D, starting with Helium and Tzz, matched against their portraits: colours and tones, shading, proportions, their pieces (the cat-eared mask, the Atlantis trinket in Helium's hand, left out before as it's not in the wardrobe; the monkey's dark purple). One phrase was lost to dictation ("Why should she be given a poke?"; perhaps the hair, drawn as a bun): to pin down with the user.

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
