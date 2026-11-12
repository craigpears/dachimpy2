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
  the driftwood barrier (Foraging), the crane, and the gambles (the turning pool and the veiled wind).
- **The race's puzzle shortcuts, not yet seen at all (12 Nov):** "I've definitely got to check things
  like the starlit door and the crane and [Treasure Haul] ... I've not seen any of that stuff yet. I've
  not even seen a visual or anything about those puzzles, the navigation puzzle that is." So: the crane
  built by Carpentry on the race; the bribe at the gate, the wreck's coins hauled by Treasure Haul; Duty
  Navigation itself (`navigation-test.html`); and the starlit door on the race course (its Navigation on
  the rock, the door opening, the tunnel and its clefts), straight there by `den.html?at=door` since 12 Nov.
- **The race's chart (12 Nov):** `changelog/race-map.jpg` and its changelog entry, and the design
  page (`design.html`), for whether they read well.
- **The course editor (12 Nov):** `race-editor.html`: move buoys and shortcuts, set each puzzle's size,
  the balance check, then race it in 3D; and the barrier now a square along from the middle snake.
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
    funny animated scene showing you real distilling moves, then "now you try". His still is the
    hidden Easter egg in his house, with the mishap ("Oops. That happens sometimes. Don't worry
    about it."). His portrait checked first. Smuggling the rum after still waits. (IDEAS.md,
    "Helium, and Distilling".)
    **Started (12 Nov), and an island of his own, not a house:** "I think we can start doing his
    thing ... I think you're ready enough to start on the mechanics of building that puzzle, usual
    kind of modularized stuff." And "Him being in a hidden house, maybe he can just have his own
    little island. That just seems to be the theme somewhere. Maybe that can link into where the
    Smuggle Beach is ... I bet he just wants an island for him somewhere." First the puzzle, as
    real as the rest (researched, with bots), and a tutorial in the style of Tzz's Sailing guide;
    the user will point us to what the real tutorial looks like.

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


- **The race's chart kept in step with the course (12 Nov):** "hopefully we're keeping this [race map]
  JPEG in sync." Redraw `changelog/race-map.jpg` whenever the course changes, and have a test fail when
  it's out of date (the chart's drawing records which course it drew; the test compares with today's), as
  `tests/build.test.ts` does for the compiled js.
  **And clearer (12 Nov):** reading the chart, the user couldn't tell what the wreck by the start was for,
  took the locks' berth on leg 4 for the starlit door, and didn't find the rowing shortcut or the veiled
  wind. Each label beside what it names, not across the spit (the imperial gate's label sits on the
  spit's far end from the gate; "The locks" on the far end from the locks); the wreck labelled "haul the
  bribe here", the berth "wait for the lock", the headwind gap "row it"; the veiled wind's "?" named.
- **Rocks blasted away by her guns, open to everyone once down (12 Nov):** a catch-up shortcut in spit 3
  beside the whirlpool channel, about three hits from her broadsides on the move, then open to every
  racer (RACE.md, "Rocks blasted open for everyone"). Earlier: "we still haven't got
  the destructible rocks. That was supposed to be part way through the course somewhere." Rocks across a
  gap, shot away by Gunnery loading her guns, on the move (RACE.md §3's table, "Rocks across a gap,
  blasted away", an idea till now). After the course editor lands, as it moves the course's numbers.


- **The race's next pass, from reading the chart (12 Nov).** After the course editor and online racing
  land, as all of it moves the course's numbers:
  - **Fewer gambles, none by the finish:** "I don't think we want that many gambles. That's far too near
    to the finish for a gamble. That will make people very cranky." The veiled wind through the last
    spit goes; the turning pool stays (to confirm: whether one gamble is the most, or another goes early).
    **The turning pool too? (12 Nov):** "is that really a good idea? I love the snakes and ladders thing,
    like where you have to double hop over it because it's more deterministic. But it just seems no cost
    to taking that gamble right at the start ... are we going to ... create a situation whereby the only
    way to win is to take that gamble, and if you don't, you rage quit? ... there's already enough
    features ... It does not feel like a very game-worthy thing ... not really in the ... good
    sportsman-like spirit." And "we're struggling for space already." **Agreed (12 Nov): "Yes, drop
    both."** No gambles at all: the veiled wind and the turning pool both go, and the turning pool's spit
    is just land again. Out of the changelog's entry and the design page too, and the
    simulation re-run.
  - **The imperial gate's bribe isn't worth its puzzle:** "doing an entire puzzle to get through one gate
    that doesn't save you too much time, that doesn't feel like it's been balanced." The gate saves 14 s
    against a whole Treasure Haul: make the haul shorter or the gate worth more, checked by the
    simulation.
  - **Slow winds, as Puzzle Pirates' are, besides the trade winds:** "we need two different kinds of
    [winds]. Like the trade wind kind that really just blows you and you don't get the chance, but you
    also need the slower wind that only nudges you one per turn." So the sea's moves go in Puzzle Pirates'
    order: each move, first the sloop's own (left, forward, right, or stay), then the square she's on acts
    once: a slow wind pushes her one square its way, a whirlpool turns her to its opposite corner (as it
    already does). Trade winds stay instant (the snakes, and the lanes a Vegas or a Double hops). The
    start's field is slow winds and whirlpools: "you would say left into a whirlpool because the wind
    action then takes you one tile further up, so that kind of navigating and eyeballing the route",
    which is what the starter's "plan the fastest way in" was meant to be and today isn't.
  - **The start's field different each race:** "there should be some element of randomness to it so
    that it's not the same on every single thing": its pools and slow winds laid from the race's seed
    (the same seed for everyone in an online race), always with a way through.
  - **Rocks blasted away by her guns,** above.
  - **Every puzzle's shortcut cuts the same distance (12 Nov):** "other than things that are obviously
    should be bigger, like the Vegas or the triple hop ... they don't seem proportionate. Like each an
    element of puzzling surely should be the same distance. Like for example, the imperial gate ...
    distance-wise ... that's a relatively small corner ... Whereas the [locks] are maybe like twice as big
    distance-wise, and then the cranes 3 times again. They are not even." So each stopped puzzle (the
    gate's bribe or guns, the barrier, the locks, the crane, rowing the headwind gap) skips about the same
    stretch of course, and each is sized to take about the same time to play (fewer frames for the
    crane, fewer clears for the locks, fewer coins for the bribe), so the choice is only which puzzle is
    yours. The chain hops grow with the chain: a Double small, a Triple bigger (today it saves only 9 s),
    a Vegas biggest. RACE.md §8 has the principle.


- **The course editor down to the tile (12 Nov):** "it looks cool, especially with the map. But just
  moving stuff left to right isn't exactly much of a ... it doesn't really give you much control over,
  like, how many legs do I do? ... more fine-grained control ... you get to the tile level of what tiles
  you want where, what objects you want to move about and place. It needs to be a lot, give you a lot
  more control." So the course becomes a grid you paint square by square (water, land, rock), with
  objects you place, move and remove anywhere (buoys, the start and finish, winds of both kinds,
  whirlpools, each shortcut and its puzzle), as many legs as you like; the race laid from that grid,
  the checks (a way round, every shortcut sailable) and the balance check as now. With the race's next
  pass, as that reworks the course anyway.
- **A whirlpool that went the wrong way (12 Nov):** "I just saw people go ... they kind of went left into
  it and then somehow came out as it was like into the right turn, wins, shortcut. Something went really
  wrong there. That is not how a whirlpool works." Likely the turning pool, whose spin flips (it goes
  with the gambles); but check every pool on the course turns her by Puzzle Pirates' rules, with a test
  named after what the user saw.


- **A rival's Sailing shows on her sails (12 Nov):** "you should be able to see the [sailing] puzzle in the
  [sails]. Like, I can see Kikkit building a Vegas, but it's not showing on her [sails]." Watching the
  race, her board fills but her sloop's sails don't change. Her sails should sparkle as yours do when you
  sail well (`sail-sparkle.js`), growing as her chain builds, on every racer's sloop, rivals and online
  players alike.


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
