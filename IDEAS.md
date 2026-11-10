# Pirate Den: future design ideas

The user's unrefined ideas for later: new puzzles, new features, the long-term picture. Nothing
here is built or agreed yet. Fixes and quality-of-life changes the user has asked for go in
[TODO.md](TODO.md) instead. When an idea gets built, move its rules into [RULES.md](RULES.md) and
delete it from here. Not published with the site (`.assetsignore` skips `*.md`).

The thread through all of them: each Puzzle Pirates puzzle should feel like *that puzzle* played
in the 3D den, the way the rampart frames feel like carpentry. Nothing should magically appear or
transform; things are made from pieces you can see, and stay as those pieces.

**Biggest principle: democratised, team effort.** One plague of Puzzle Pirates is that it gets
elitist: everyone wants to drive the ship and fire the guns, and a few get to. Here every pirate
should have agency and a real say in how things go, and no job should belong to one person. It's
already a team game in Puzzle Pirates; this should be even more so.

**Second principle: true to the 2D puzzles, with a 2D mode.** Every job in the den should stay as
true to the original 2D puzzle as it can, the way a wall hole is still a carpentry hole you can see
whole. That means any job could have a **2D mode**: a pirate switches into the classic flat
puzzle (old-school carpentry on a hole, old-school gunning on a gun deck), while crewmates still
see their work happening in 3D. You can dial the complexity up there too, for someone who just
wants to do the carpentry properly. The 3D version is the fun extra; it loses some depth because
of its mechanics and the quick pace (gunning especially), so both should work together on the
same job. Build later, but design every new job so it maps cleanly onto its 2D puzzle.
The user sees the 2D mode as the place for a quicker pace, too: pieces turning themselves to fit
was tried in 3D and dropped as cheapening the puzzle ("that is probably where the 2D mode comes
in... that will really help just speed it up a bit").

**The puzzle itself comes over as it is.** Every puzzle should be high fidelity to the
original, small tweaks aside: the 3D decides only where the board stands and who's on the other
end, never the rules (RULES.md has the user's words).

**Third principle: fun and obvious from the first minute.** One of the user's main goals: make it
more fun and intuitive straight off than Puzzle Pirates ever was. Keep the crew and group vibes,
but it must be quick and easy to get into. Every new job should be playable within seconds of
seeing it, with the depth coming after.

**Always more piratey.** Keep looking for ways to give it a more piratey feel.

## Solo for now: the public den and crews parked (10 Nov)

"I don't know how the public den works anymore, because I think we've gone a bit far away from
that now. I think we're just keeping this as a solo proof of concept right now." What was in
TODO.md, for when it comes back: land in a public den anyone can drop into, private crews by a
four-letter code alongside it, no cap on numbers (the crew room holds four now, and the first
pirate's browser runs the raiders for everyone, so snapshots would need trimming), a ceiling on
wave size for a big crowd, drop-in and drop-out without spoiling anyone's game, a "Play alone"
button, and a way to hide a nuisance pirate. Also parked: a fresh piece's strength and the fair
deal never leading to a Masterpiece (8 Nov), which the user says have "been fine or have moved
on by now" (the cheat to copy a deal stays, in case one turns up).
**What stays (10 Nov):** "remove the public [den] ... keep some of that code in there, the
multiplayer thing, at least on that starting area, because we might revisit it. I'm just kind
of trying to explore the proof of concepts for now." The public den was never built, so
there's nothing of it to take out. The private crews (a four-letter code, in the den) stay as
they are; the new parts out at sea are built solo and needn't work with a crew for now.

## Treasure maps from fallen raiders

Now and then a raider you knock out drops a **treasure map**: a quick little event. Go out of the
gates and find the buried treasure, and dig it up with the treasure hauling puzzle somehow. Short
and sweet, not a long expedition. In the bigger picture, follow the spirit of Puzzle Pirates:
more things you go and do as a group activity.

- **A map that sends you somewhere, and a reason to fight (9 Nov):** a quest hints "I heard there's
  some treasure in the inn": go dig it up. At the inn (or someone's house) a mining-style puzzle
  digs up the ground, and the treasure's owner, snoozing there minding his own business (the
  user's "Down Off"; name to check), comes out: "Oi, what are you doing with my treasure?" (or you
  challenge him first). That's a Rumble, with animated punches going back and forth between the
  two little avatars each time you send one.

## The captain's map, out to sea to his hideout (9 Nov, the next big feature)

The user, liking "Raids you choose": the reward for beating the third wave is a **treasure map**
to an X marks the spot. It's a big feature, so it's built a bit or two at a time ("pick one or two
bits to do at a time so that we can compress and come back later on"). At first the X was up the
rocks behind the den ("I want that pirate hideout feel, not a city feel"); then, the same day, it
moved **out to sea**: "it feels weird going backwards ... it would be better if you can go
forward". You **row out to his hideout**, which gives it "a bit more of a PvP feel": the reverse,
"a mirror of this kind of siege", with you the raider this time. In order:

1. **The siege ends after three waves; soldiers are capped at a handful.** Built 9 Nov.
2. **The map, and a cheesy little cutscene** (being built 9 Nov, TODO.md). Beat wave 3 and the
   camera cuts to the beach: their captain (Dalnoth) shakes his fist, "We'll be back!", runs for his boat,
   and a map falls out of his coat. Your pirate walks out through the gate on their own, picks it
   up ("A map!") and opens it out on the sand. The user: "a short, cheesy one, but that would be
   fantastic". **The map shows the choices**: "we hear there's some secret treasure here, guarded
   by a fearsome enemy", with your cove at the bottom, the sea, and his island at the top, and the
   ways in marked on it:
   - *By sea, with the guns:* come at him in a ship and shoot up his defences ("that makes the
     gunnery deck more natural, because you're out in your ship");
   - *Land and swordfight him* on his beach;
   - *Round the corner:* "bypass his defenses, go around the corner into some cove", where the
     map says there's "some hidden undiscovered bilge pump": flood him out.
3. **A pile of scrolls, not just the one map (the user, 9 Nov):** "imagine like having a pile of
   scrolls and he's trying to figure out what's on all of them". The captain drops a bundle, and
   each scroll opens something different, so you're "not just going necessarily straight":
   - the map to **his hideout** (the next part of the story);
   - a map to an **island to forage** on the way, or the **capybara rescue** (see "Side quests
     that leave friends about the den");
   - a chart showing **a hidden cove** with something in it (a plant, the bilge pump);
   - **plans for building**: the gun platform, say, so building it is unlocked by the plans you
     found, not handed out.
   And meanwhile you can stay home and do up your hideout instead. **This is why the den wants
   side quests**: the story's path is there, but you choose when, and what else you do first.
4. **Getting there: you really sail it (the user, 9 Nov).** How you cross the sea: in the raiders'
   rowboats, or the abandoned sloop in the harbour (which also goes with 7). However you go, the
   crossing is played, not skipped: see "Sailing between places, for real" below.
5. **Sneaking in for the loot, and aggro (the user, 9 Nov):** a way that's closer to Treasure
   Haul: the map shows "there's this spot where they buried their treasure", and you sneak onto
   his island **without a direct confrontation** and steal some of it. Doing that builds up
   **aggravation**: the more you take, the angrier they get, and that's what brings on further
   raids at your den. (So the raids that come "when the world gives a reason" have one: your own
   thieving.) Another way to stir up aggro (the user, 9 Nov, "if we somehow manage to figure it
   out"): the den evolves so the gun platform sits **over a busy shipping lane**, and you can
   take shots at passing ships; that makes people angry enough to come and attack you. The
   platform would be **up the cliffs, found on foot** (the user, 9 Nov: "I like gunning to be more
   discoverable ... once things calm down ... you should be able to go back up some path up the
   cliffs to get to the gunnery deck"), looking down on the shipping lane. The gun tower over the
   gate then matters less for the fighting and becomes more of a nice rampart, more cosmetic
   ("that carpentry building idea will just be ... for a bit of a nice ramparts"). Or, more
   believable but less handy, the platform could stand **out in the middle of the sea, reached
   along a rope bridge** (the user, 9 Nov: "it would make it feel a bit more real, because ...
   why would there be a shipping route passing by a pirate cave?"); but they want it "quick and
   accessible for now", so the cliff path first. **Or freeform, built where you like** (the user,
   9 Nov, thinking on: "a bit more of a freeform world"): the lane runs clearly further out, and
   you **build rope bridges out across the rocks** (the ones you sail round now) to make the cove
   "more explorable or navigable", then **build your own gun platform out near the trading
   lanes**, wherever you choose, a more creative hideout. Clearing the way on land the same way:
   cut back the forest by Foraging's equivalent. So the den spreads out as you build, rather than
   having its places set for you. Digging still needs to be believable where it happens (the user, earlier: Treasure
   Haul "breaks the immersion" in the middle of a hillside):
   - *Digging, Foraging-style:* in Puzzle Pirates, Foraging is digging up goods on an island, so
     digging down to the chest is what it was made for;
   - *Clearing the way:* brush and fallen rocks (Foraging again), or a rope bridge (Rigging).
6. **The owner: Dalnoth, guarding his treasure, and your choice of how to get past him.** The
   user's friend's pirate, **Dalnoth** of Emerald (YPPedia: Dalnoth; senior officer of Rootbeer
   Flotillas, flag Illusion, once of Hunter Ocean; the "Hunter Champion" the user remembered is the
   Champion familiar he won there). His portrait, for his likeness: a horned helmet (pale, gold
   trim), a big black beard, a long yellow coat and yellow trousers with a white sash, a frothy
   tankard of ale in his hand, a familiar on his shoulder (checked 9 Nov: the dark one in the
   portrait is his black Hunter Archetype familiar; his white monkey is the Hunter Champion one,
   and that's the one the den gives him). He's also the captain who leads the opening siege and
   drops the map (built 9 Nov). Painted as a bit of a drunk. Keep it simple: you stumble on him
   sitting on his chest, guarding it well, "Oi, what are you doing with my treasure?". Then **the
   choices are left open** (the user: "I like that principle. Like, leave the choices open"), one
   for each puzzle the den has:
   - *Swordfight him* (it's in the den already; Rumble later);
   - *Gunning:* from your ship (or a gun platform, built from plans you found), shoot him off it;
   - *Bilge:* pump water into where he's sitting and flood him out, so the treasure washes out
     onto the ground;
   - (and maybe *Carpentry*, the den's own puzzle: shore up or build something to get at him.)
   Story order still to settle: whether you dig before or after you get past him.
   - **His monkey is yours (the user's favourite bit, "to rub it in"):** beaten, he runs off, but
     his white monkey stays: you're the champion now, so it hops onto your shoulder. That's what
     makes him so furious he comes back (7).
   - **Familiars are earned, not chosen:** so the Your pirate panel stops letting you just pick a
     familiar; you get them by winning them, as Dalnoth won his (a Champion familiar in Puzzle
     Pirates). Dalnoth's white monkey is the first. (Today the panel offers a parrot, a monkey or
     an octopus to anyone: RULES.md, "Familiars". What happens to a familiar already picked: to
     settle with the user when it's built.)
   - *Sword or Rumble, your choice (later):* players love one and hate the other, so let them pick
     which they fight with (as "choosing your mini-game" already says for the soldiers).
7. **Dalnoth comes back for it.** A big famous pirate robbed of his treasure gets very grouchy and
   very angry, and comes back with his crew: that's what brings on the next round of raids,
   naturally. And again, two ways to meet him:
   - *Dig in at the den:* fortify the hideout, build gun towers, build up your soldiers, and fight
     him on the beaches (the den as it plays now, against a tougher raid);
   - *Take to the sea:* "we heard there's an abandoned sloop" in the harbour: fix her up, crew her,
     and see him off on a Battle Navigation board before he ever lands.

**Balance, alongside:** building on with the rampart and guns is fine as long as it isn't
overpowered. Soldiers are limited to a handful at the start, and building up the den (bigger
barracks, say) lets you build "a little army up later".

## Sailing between places, for real (9 Nov)

The user would "really love ... actually navigating to these areas, being very more Puzzle
Pirates": like Pillaging or Atlantis, where "you're always in an environment". Going from your den
to another place (his hideout, a side-quest island, another den) means **sailing there on a real
board**, never a jump cut:

- **Puzzle Pirates' sailing, in 3D.** You see your ship on the sea and put in its moves: forward,
  left, right, as in Battle Navigation. The grid's still there underneath, but not drawn as
  obvious squares; it's the sea.
- **Tokens from sailing.** You generate the move tokens by working (the Sailing puzzle, as on a
  real ship), so the crossing is still a puzzle: "you actually sail, generate tokens, and it's a
  bit more of an active" thing.
- **Hazards, simple to start:** a few rocks at first; whirlpools and wind (the Battle Navigation
  board's own) later.
- **Arrivals you can see:** the beach coming up, then landing; sailing up to a den, its gun
  turrets and walls in view.
- **Balanced so it doesn't take forever** to cross the board.
- **An auto-set destination, eventually:** pick where to go and the moves are generated for you
  ("you get somebody else to sail for you"), still with the same feel of watching her go; you
  take over and put in forward, left and right yourself when hazards or trouble show up.

(Goes with the gunnery deck at sea, the sloop, and raiding other dens. A big one: to shape with
the user before building.)

**A first go is built (9 Nov; RULES.md, "Sailing, a first go"):** the old sloop in the cove, the
hidden board, Battle Navigation's moves a turn at a time, a pin and a pilot, a few rocks, and W A
D to steer yourself. The user, steering her by hand: "it gives you the very Puzzle Pirate feel of
moving. It gives such a nostalgia." What's next:

- **Filling up the tokens** ("obviously you need the thing of filling up tokens"): the moves you
  put in have to be earned, as on a real ship, by Sailing (the puzzle). And how hard that is
  depends on where you are (the user, 9 Nov): **on the open sea it's easy and quick**, so getting
  about is light; **getting towards battle areas it becomes a lot closer to Puzzle Pirates**, a
  real Battle Navigation feel ("the wind is ... quite milder" out in the open).
- **Fixing her up first:** she's an old wreck left behind ("an abandoned sloop": STORY.md, step
  7), so maybe she needs patching by Carpentry before she'll sail, like the wall.
- **Places to sail to:** Dalnoth's island, the side-quest islands, other dens, with the beach and
  their walls and turrets coming up as you arrive.
- **Life on the sea, to make it feel alive:** "just things like just to make the environment feel
  a bit more alive", as the universe is built out. The first the user thought of: **a Kraken**,
  drawn on the captain's map too, that you sail past on the way to Dalnoth; it attacks you if you
  come too close. Unlocked later, not in the first voyages.
- **Crews at sea:** for now she's sailed alone.
- **Shipping lanes: the trade winds, a wild ride (9 Nov, "a fantastic, incredible idea").** In
  Puzzle Pirates, Battle Navigation's wind tiles push you along. A lane is a souped-up run of
  them, "just insanely quick wind tiles", the fast way between places. But it mustn't be a dull
  conveyor: "it's got to be an interesting journey", with rocks along its sides and whirlpools
  in it, "some craziness to the journey". Sail onto the trade winds and they take over ("it will
  just like spin you. The autopilot will take over"), whirling you round and flinging you on,
  with "some fear of ... a bit of bashing on the rocks on the way": go for **"the crazy captain
  vibe"**. (A fit with what's there: the hidden board already has rocks and bumps; wind tiles
  move you a square, whirlpools spin you round, as in Battle Navigation. How much a bash costs
  (damage, lost time, spilled cargo), whether you can steer at all once you're in, and where the
  lanes run (between the places on the captain's map, the gun platform over one: above): to
  shape with the user.) **Junctions (9 Nov):** at certain decision points along a lane it drops
  you off "just like a normal square", so you choose to turn left, turn right or carry on (or
  steer off on your own); the lanes meet at those crossings, so a long trip is a few wild rides
  with a choice at each stop. (A first go is built: one lane out to one junction, a loop home and
  a canal: RULES.md.)
  **Racing, one day (9 Nov; PvP races are Umami's idea, a friend's pirate):** the user has joked
  the lanes are "like Mario Kart times 20", and by the time they're built, with wind, whirlpools,
  rocks and stops, it's close enough to a racing game to race other players down them: PvP
  racing on the trade winds.
  (A race of our own, not a copy of any racing game; and still a puzzle game first, so whatever
  decides a race should come back to the puzzles, the Sailing tokens say. To shape with the user,
  with the wilds and crews.) **Shortcuts, and ships that really scale:** take the main lane and
  dodge the bigger ships in it, or cut through the side ways, narrow runs a single square wide
  that only a small ship fits. Bigger ships would **really be bigger on the board**, say two
  squares wide, needing bigger gaps ("I've always loved the idea of ... the ships in the game
  actually properly scaling"; in Puzzle Pirates every ship takes one square). How a two-square
  ship moves and turns: to work out. "Any kind of PvP racing would be hilarious." Goes with
  smuggling's small ships at the back beaches, and "ship types with real trade-offs".
  **Locks on a canal (9 Nov, "a weird idea"):** a canal through the land as a shortcut, with
  locks you have to work through: lots of Bilge to pump them, filling and emptying each lock to
  raise or lower your ship before the gates open. A shortcut that costs puzzle work, not
  reflexes, which keeps a race a puzzle game (and Bilge pumping water somewhere it believably
  needs pumping, as at the den's tide). (A first go: one lock up a cliff into a hidden cove,
  pumped by Bilge; then a chain of four, two up and two down, the secret way round the imperial
  checkpoint: RULES.md.)
  **The Navigation duty puzzle (9 Nov):** bring Puzzle Pirates' Navigation duty puzzle into the
  races, so that, in concept, doing it well lets you find the shortcuts and hidden routes (how:
  "I don't quite know how that could work"). Check the real puzzle's rules before shaping it. Then
  each way through a race has its own puzzle: Sailing for speed on the open lane, Bilge at the
  locks, Navigation to find the hidden way.
  **Dodging, and what a hit does (9 Nov):** enemy ships, monsters and gun turrets along the way
  to dodge ("that's classic Puzzle Pirates"), so a race works single-player too, and scales up
  to other players later. Getting hit (by a turret, say) needn't be traditional damage: maybe it
  **dazes you for a few turns**, and you work it off by **Carpentry or Bilge** (patching the hole,
  pumping her out) to get going again. "We'll have to figure out exactly." **Dazed it is, for the
  proof of concept** (the user, 9 Nov): "much more almost Mario Kart-esque, but it keeps it
  faster paced, while keeping the puzzles key". And it's something players do to each other:
  swing in behind somebody pulling ahead, shoot them, and they're dazed while they do a bit of
  puzzling, then they set sail again. Nobody's knocked out of the race. (A first go: a turret whose hits
  daze the sloop till she's bilged out: RULES.md.)
- **Getting her past what blocks the way: haul her over (9 Nov).** From the Vikings TV series,
  where they haul the longships up a cliff with cranes, and the Ottoman siege of Constantinople,
  where they dragged their ships overland on logs to get round the chain across the harbour. On
  the sea: an obstruction in the way (a chain across a harbour mouth, a cliff, a neck of land),
  and the way past is to take her out of the water and haul her: a crane up a cliff, or chop
  down a forest, lay the logs as rollers, find something to grease them with (oil, tallow), and
  drag her across. "I'm sure we could sneak some of those mechanics in there", though the
  user's own worry is that the full chain of steps might be "going a bit too far". Like the
  lock, a way past that costs puzzle work, not reflexes: Carpentry to build the crane or the
  rollers, something to fell the trees, something to heave her (which puzzles, and how much of
  the chain of steps to keep: to shape with the user). A chain across a harbour on its own would
  be a good obstruction too, for this or for a raid on the captain's island. (A first go: a crane
  built by Carpentry on a ledge in the hidden cove, up the cliff into a clifftop lagoon: RULES.md.)
  **An imperial checkpoint, and the ways round it (10 Nov):** the main shipping lane runs
  through a checkpoint, manned (to start with, just a couple of the gun turrets the sea already
  has): "obviously ... you're pirates, so they're not going to be very friendly to you". The
  choice is presented to you: run it, go round, or build a crane to go up the cliff and bypass
  it. That's where the crane makes sense ("I don't really see how having a lock would make
  sense" there). The snag the user sees: "you're only in a sloop at the moment", and a sloop can
  always slip round by the little side ways, so the choice only bites once bigger ships can't
  ("it's just a bit weird because, well, you haven't got any bigger ships yet, so you are always
  able to take these little nifty routes"). Goes with "Ship types with real trade-offs" and
  "Shallow and deep water". (Whether the secret cove stays as well, and how a sloop's choice
  means something before bigger ships come: to shape with the user. A first go of running it,
  rowing it and going round is built: RULES.md, "The imperial checkpoint".)
  **Bribe your way through (10 Nov):** another way past the checkpoint: haul treasure up from a
  wreck (Treasure Haul; "go blow up a wreck, get some coins or something") and use it to bribe
  your way through. So in a race you'd either do some treasure hauling to buy your way past, or
  run the guns, or take the crane. "That's a way of getting through using treasure haul": the
  same puzzle as a route as well as a reward, in keeping with "Every other way through costs a
  puzzle" (RULES.md). (Whether the coins are the den's doubloons or loot of their own, and what a
  bribe costs: to shape with the user.)
  **Checkpoints of all strengths, and toll gates (10 Nov):** "they're just generally controlling
  the trade routes", so checkpoints turn up along the lanes, of varying strengths, and come back
  (respawn) after you've cleared them; clear one and you pass for free for a while, and later on
  you'll meet one you can't get through. A checkpoint could be a toll gate: they charge you to
  pass, so you choose: pay the toll, blast the gate and sail through, or wonder "is there another
  way?", the game hinting at the secret way round (the locks, the crane). Not for now: "it
  doesn't really make much sense at this stage of a proof of concept".
  **Bring back the crew's puzzles driving the helm (10 Nov):** in Puzzle Pirates, the crew's
  Sailing and Rigging puzzles are what give the helm its moves. The user would like that back:
  the helm steers left and right, "but if somebody starts doing things in sailing or rigging,
  then that can interact", so the crew's puzzles feed her speed and her moves, as the rowing
  board now feeds her oars. ("That's full of ideas here": to shape with the user.)
  **And in real time, not stored up (10 Nov):** "make it a bit more real-time": the navigator
  still puts in the moves, left and right, but "instead of them being stored up by the puzzles,
  you know, the things actually happen when the things happen in the puzzle. So if you clear a
  platform, the ship actually executes one of its moves", like a gust of wind in real time. The
  rowing board already works this way (a clear pulls the oars there and then), so sailing could
  follow it: the crew's clears drive the queued moves as they land. ("I'm just really going out
  crazy with ideas": to shape with the user.)
- **Gunnery at sea, faster than Puzzle Pirates, on timing (9 Nov).** In Puzzle Pirates a round
  of Battle Navigation plays every 35 seconds or so, in four slots, and you know just where a ship
  coming at you will move. The user would like it faster paced: load the guns (on a ship or the
  gun platform), then watch ships moving quickly by and time your shots, "you can shoot, but
  there's no guarantee", since ships are always moving and have far more chances to move or hold
  still than four slots a turn. (A first go is the sloop's two guns firing at the rocks as she
  sails, and at the imperial checkpoint's guns, which fire back; loaded by Gunnery on her deck:
  RULES.md. Moving targets, and how a hit tells: to shape with
  the user.)

## Rewards that mean something (10 Nov)

The user likes the clifftop lagoon ("I like the little lagoon"), but its treasure, 32 doubloons,
is "a bit meh at the moment": money has to be more meaningful, something to spend or show, and
that comes with the social side eventually (trading, a crew, other players). Way outside the proof
of concept for now; to figure out later.

## Smuggling: taxes, embargoes and the back beaches (9 Nov)

Something to give a reason "to either steal or smuggle". Each island has its **main port**, but
also **beaches all round it**, so even if an island's blockaded you can still **sneak in with a
smaller ship round the back**:

- **Taxes and embargoes:** an island might tax its goods, or put an embargo on one, rum say. Buy
  rum cheap on one island ("or making it yourself"; Distilling is a Puzzle Pirates puzzle), sail
  it over and sell it through a hidden beach for a big profit, without paying the taxes.
- **Dodging the patrols:** the authorities patrol the coast, so you might run into them and have
  to fight off a bigger ship, or run.
- **Small ships, small loads:** only a small ship can get in close enough to row the goods ashore
  to the beach, so you can only carry a limited amount. That gives the small ships something
  they're best at (goes with "ship types with real trade-offs", further down).
- **A smuggling race (9 Nov):** where the racing idea (the shipping lanes, above) comes in. Everyone's
  hanging about at an island with the same idea, contraband in the hold, all trying to get it to
  another island first, so it's a race for the profits. The PvP race then has a reason, and the
  trade-offs show: the small ships slip through the shortcuts and onto the back beach, the big
  ones carry more but have to keep to the main lane.

Ties in with trading and commodities (none in the den yet), the shipping lanes, blockades, and the
safe waters and the wilds. "I'm sure I could flesh that out more": to shape with the user.

## Safe waters, and the wilds: high risk, high reward (9 Nov, a pipe dream)

The user, "probably me just getting more into real pipe dreaming stuff": player versus player
should mean something. **Safe story areas** where you do light adventures, and then, like
RuneScape's Wilderness, **the wilds, with the higher rewards and the higher risk**: out there
there are krakens and monsters to get past to whatever you're after, and **anywhere in the wilds
you might be attacked by another player** ("there's never really anywhere I want you to be able
to go and not be at risk of a player versus player attack" there). Goes with sailing (the open
sea easy, battle waters closer to real Battle Navigation: above), raiding other dens, and crews.
To shape with the user much later.

## Side quests that leave friends about the den (9 Nov)

Little side quests, like rescuing a capybara by dredging out a reef (a friend's idea). The friend
you rescue then hangs around your den, so finished quests add up into a den full of characters.

## Zoom in on what you're doing, like the captain's map (9 Nov)

The user liked how the camera zooms in onto the captain's map and back out again: you're still in
the world, but what you're looking at fills the view. "We need that zoom in thing a bit more."
It's also the answer to crowding: with lots of people in one space, the building puzzles get
tricky (pirates in the way, frames on top of each other), and a zoomed-in view means "more dense
things in one space". So more puzzles could open the same way: walk up, the camera swoops down
onto your frame or hole or crates, the rest of the den falls away around the edges, and it swoops
back out when you're done. (The wall, the pumps and the armoury already lean in a bit; this goes
further, the map's way. Which ones, and how close: to try out.)

## The vampire in the coffin: rapid Carpentry, with funny cutscenes (9 Nov)

The user loves "the idea of funny cutscenes", and remembered Puzzle Pirates' vampire thing, where
you do Carpentry on the coffins (to check how it went there). A setup for a really funny one:
you're plundering somewhere (his hideout's hold, a crypt on a side-quest island), you open a
coffin, and **a vampire sits up**. You both scream at each other comically, "ah! ah!", and you
slam the lid and **quickly nail it back down** while he tries to get back out. So it's
**Carpentry, the rapid version**: a row of coffins, lids bumping, and you patch each one before he
bursts it, to keep him in long enough to plunder the stuff.

- *A funny cutscene at the start* (short and cheesy, Space skips, like the captain's map).
- *Funny animations all through:* the lid rattling, fingers poking out of a gap, your pirate
  panicking and hammering faster and faster.
- *Still a puzzle, not an action game:* the pace comes from the lids, but it's the real Carpentry
  pieces and keys, and a lid you lose just pops open (he groans and sits back down), never a game
  over.
- Where it goes in the story: maybe one of the ways in (or one of the scrolls). "Who knows?
  Maybe that could be one of the things."

## A little town up the cliffs (9 Nov)

More of a little town behind the den and in front of it, with the feel of a new pirate
city-builder the user loves (name to find): a real pirate hideout built up into the sides of the
cliff, rope bridges between, and all the lodgings up in the rock, not spread out across an island.
Follow that aesthetic. (Goes with the side quests and exploring: places to go, not just a wall to
hold.)

## Raids you choose: a quick siege to start, then calm (9 Nov)

The user likes the quick intro, under attack from the start, but after a few waves the raids
should become more opt-in, built into the world, so "you're not constantly under pressure and you
feel free to go explore, roam, and do different puzzles". (Goes with "Raiders getting through
mustn't end the game" in TODO.md.) A first sketch, to talk through:

- **The opening siege, then they sail off.** The first three waves stay as now (the dealt-fair
  first wave, the cannon from wave 2, the walk's timber as the reward). Beat wave 3 and their
  captain calls it off: the ship hauls its boats in and sails out of the cove, "We'll be back!".
  The den goes calm, and the timer goes.
- **After that, raids are something you see coming and something you can call on.**
  - *A sail on the horizon:* a raid comes because of something in the world, never a clock: your
    chest getting fat, your infamy from pillaging at sea, a treasure you dug up that someone wants
    back. The ship shows out at sea and anchors in the cove before anyone lands (a few minutes'
    warning), so you can come home, or not.
  - *The bell on the gate (or a beacon on the tower):* ring it to call a raid on when you want
    one. That's the way to the rewards only raids give (the rampart's timber, treasure maps from
    fallen raiders, soldiers' pay), and to a harder raid each time, like choosing a quest.
  - *A good wall puts them off:* a ship that sees Masterpieces all along the wall may sail on
    past, so mending is how you buy yourself time to roam.
- **While you're away, the den holds or pays.** Raiders who land with nobody home go for the
  chest and take a share of it (plundered, not the game over); soldiers from the armoury and any
  friends about the den (the capybara, the monkey on the gate) put up a fight. Coming home to a
  raid in progress is its own little moment.
- **Reputation, and the Empire sending soldiers (10 Nov):** as in Port Royale and games like it,
  a reputation with each side: Dalnoth's crew, the Empire. Shown for now in a little panel in the
  top right (the user's suggestion; it would be the den's first panel of the kind, so to shape
  against "no overlays"). Attacking imperial checkpoints or traders lowers it, with a warning
  first ("your reputation with the Empire goes down if you attack its checkpoints or traders"),
  and a while after you've wrecked a checkpoint the aggro brings imperial soldiers to attack the
  den, like Dalnoth's raid at the start but in their own colours.
- **Look after the den from afar (10 Nov):** when a raid comes while you're out at sea, you
  shouldn't have to sail all the way back: "Factorio style, where you can be on a different
  planet, but you can still see your own base and deal with problems remotely". Jump the camera
  back to the den and play its puzzles as if you were there, and maybe jump back to the den
  whenever you like.
- **To check:** today the rampart's frames arrive as the reward for beating a wave, so the
  building needs feeding another way once raids are opt-in (timber from called raids, from the
  shipwright, from side quests).

## Raiding other dens (9 Nov, eventually a crew thing)

- **Go raiding:** a group of you jump out of the ship and storm up the beach to raid or loot
  another den, an NPC's or a real player's, "really piratey". Something like a blockade or
  pillaging board to get there. A competitive side too.
- **No whales:** Puzzle Pirates suffers from people accumulating things for years. Not
  necessarily a full reset every few weeks (a game of Factorio lasts weeks, then starts over), but
  something that restores the natural balance. (Whether things persist at all: to work out.)

## Grades for the layers behind a hole

Nailing junk pieces on behind a mended hole should reward good work, the way the hole does:

- **Fill a section properly and it's stronger:** e.g. a layer that runs top to bottom of the hole
  and at least a certain width, packed solid, counts as a Masterpiece layer.
- **More than one grade:** carpentry has levels below Masterpiece (the user remembers "good
  work"; check YPPedia for the real names), so a decent but imperfect layer could be a middle
  grade, stronger than loose boards but weaker than a Masterpiece.
- **The timber framing comes with the rampart (8 Nov).** The studwork behind the holes, and the
  layers behind that it lets you build ("it allows you to build double thick"), could be unlocked
  by putting the rampart up rather than being there from the start. Finishing the rampart then pays
  off straight away, with a stronger wall. To pin down with the user: is it the whole rampart, or
  does each stretch frame the holes below it; and before then, can you put anything behind a hole
  at all (today any mended hole takes layers from the first wave on)?
  - **Later the same day:** "The framing is good, but the shape of the second layer of holes should
    be different and only get the framing when you complete the deck." So the framing (and the
    layers behind) unlock once the deck is complete, and a layer behind is a new shape to fill, not
    the hole's own shape again. To pin down: "the deck" as the whole wall-walk, or the whole
    rampart with the gun tower; and how a layer's shape is chosen (a fresh hole cut to fit inside
    the framing, perhaps bigger than the hole in front?).

## A quick tour for pirates dropping in (9 Nov)

"Some kind of intro that gives you a high level idea of what the phases are ... a walkthrough ...
a tour, because, you know, people are just going to be quickly dropping into this." Not a
tutorial, "just kind of a quick, here's what happens, here's how it plays", tabbing through a few
stages: mend the wall, build the ramparts so you get a gunnery deck to defend from, the build to
push them back, and the rest. Especially for things like the gun deck, "which are quite hidden at
the start". And easy to skip straight away.

## Carpentry as close to the puzzle as Bilge (9 Nov)

The user, after trying Bilge: "some of the ideas this way I'd like to get carpentry closer to is
something like this, where it's like, yeah, this is like really close one-to-one with the puzzle
that you can still kind of see what's going on, but it just plays like the puzzle." So the wall's
holes, the frames and the rest should play like Puzzle Pirates' Carpentry itself, in a view that
goes into the puzzle (as Bilge's does), with the den still showing round it. **The view and the
keys are in** (RULES.md, "The Carpentry view", 9 Nov). Still to work out with the user: what Carpentry does today that the real puzzle doesn't (walking a piece up to the wall,
carrying, throwing), and what of that stays.

### The wall in two courses (9 Nov; built: RULES.md, "The wall in two courses")

A flat board over the den, the holes in two rows, was tried and dropped as "forced" and "detached"
(RULES.md). The user: an overlay "suggests there's a deeper design problem whereby however I've
designed the wall is stopping me being able to do this properly ... really think about it." The
wall now is one long row of holes along the ground (about 24 m, with the gate and gun tower in the
middle), so no view shows them all and the piece travels sideways; the real puzzle's four holes sit
two up, two down, side by side. So, in the 3D world itself:
- **Two courses, one above the other**, either side of the gate: a low hole and a high hole on each
  side, so each half of the wall is a 2-high stack, and the four are the real puzzle's four. The
  wall about half as tall again (9 squares, 5 m, not 6 squares and 3.3 m), the walk on top higher
  (longer stairs). The user worried a taller wall hides what's behind; the camera looks down over
  it, so mostly it'd hide the beach from the den floor.
- **What a high hole is for**, the real question: raiders walk in through holes at the foot of the
  wall, so a hole up high needs a meaning of its own. Ideas: the cannon breaches high and raiders
  hack low (a high breach lets their cannon fire into the den, or musket fire at the pirates); or
  raiders bring ladders to high holes; or high holes are where the walk's timber shows through.
- **Or keep one row but closer together:** the holes bunched each side of the gate, two to a side,
  with the arrows skipping between them (done, 9 Nov). Cheaper, keeps the raiders as they are, but
  still a row, not the puzzle's square.

## The rampart, built more like real carpentry

Building on what's there now (the walk and its stairs are made of pieces that stay pieces):

- **Base first, then supports, then planks:** the base is laid on the floor as it is now.
  Then supports go up from it, and then the planking runs up and along the supports, so you can
  walk on it.
- **Pieces suit jobs:** rarer pieces like the M make good cross braces, so the supports are
  built from M's going up. P's make good surface pieces for the planking. People can still fit
  any piece however they like; that's just what works well.
- **Freeform, and what you built is what you get:** if you leave gaps, it's harder to walk up and
  you're more likely to fall off. The realism matters: it's what we actually built, holes and
  all, not some magical thing.

## Ship setting, and the other puzzles (long term)

- **Bring in more puzzles:** Bilge and Rumble too, eventually. How Rumble would work here is still
  to figure out.
- **Maybe move it all onto a ship,** with raiders attacking in rowboats. A ship makes it easy to
  add bilging, duty navigating and the rest.
- **Gunnery with real aim:** aim the cannons at particular ports on an enemy ship, so there's a
  fun part of gunnery beyond loading.
- **The Kraken (9 Nov, someone's idea the user liked):** "it'd be really great to get like the
  Kraken in here." The user wants to think about how the den could become "a lot more ship-based"
  without starting again. A first step is in (raiders row in to a beach, their cannon is a ship
  offshore: RULES.md, "A cove"). The user's thoughts so far (9 Nov):
  - **Tentacles bashing the wall:** "similar concept to the cannon, except a bit more dialed up".
    It rises out of the cove and its tentacles smash at the wall; you rebuild the wall to hold it
    off.
  - **Any puzzle can beat it:** the user first thought it fitted Gunnery, but "that goes against
    ... my idea of saying, you know, you can use any puzzle to defeat it when it comes". So the
    guns fire at it, the soldiers fight it, and mending the wall keeps it out, each its own way
    of helping.
  - **Soldiers going outside, for this and generally:** "making it so that the doors open and you
    can go and fight on the beach". The gate opens and the armoury's soldiers march out onto the
    beach to fight raiders there, and to help attack the Kraken.
  - **Every way of fighting works on it (9 Nov):** "you should certainly be able to do all the usual
    things like throw carpentry pieces at it, which do a bit of damage". And at the armoury hoist,
    a choice: "create soldiers or target the Kraken". Swords sent at it should be seen: "3D swords
    flying at the Kraken ... dropping down on its head", tied to the den's physics: the hoist
    swings round and drops them on its head ("just ridiculous, but still funny").
  (How strong it is, how often it comes, and what beating it pays: to work out.)
  - **A thicker wall keeps it out (9 Nov):** "this will probably be a good point where ... the
    sprinkles really come in, or the multiple layers of the wall". Once the wall's fully mended,
    rewards from Swordfight (its sprinkles) and the other puzzles build extra stone layers, up to a
    triple-thick wall, and that's a key way of keeping the Kraken out. The user likes that it
    gives a reason to say "right, we really need to make the wall thicker": sprinkle it,
    carpenter it, whichever puzzle you like, all solving the same problem. (Goes with "Grades for
    the layers behind a hole" above.)
- **Your own pet Kraken, as the reward (9 Nov):** "the most obvious reward ... is to actually have
  the Kraken yourself. It helps defend you." Beat it and it's yours: it fights for the den, and
  later for you at sea. The user sees it as a natural next step out of the den: "you start in your
  little rowboat, but you have your pet Kraken that comes fight", then a ship of your own, and it
  would make battle navigation more fun ("you're not just controlling your ship"). "You can go
  plundering ships with your pet Kraken. That would be hilarious." (Alongside treasure maps, for
  more of an exploring, questing side: "Treasure maps from fallen raiders" above.)
- **Bilging the shallows: what's next (the first version is in, 9 Nov; its rules are in RULES.md,
  "Bilging the shallows").** Still open:
  - **Crews: a shared board (9 Nov).** It's solo only for now, like Swordfight; in a crew the tide
    stays put. Decided (9 Nov): one shared board everyone swaps on, "just to keep it simple". The
    user sees it as collaborative: "multiple people could come and play at the same
    time. So it's kind of a shared board and it's visible ... it's a lot more interactive". To work
    out: one board everyone swaps on (each with their own cursor), or a board each side by side in
    the shallows, all pumping the one tide (as the real puzzle does on a ship).
  - **Barrels:** they go off by themselves as a raider comes by. The user also wondered about
    setting them off yourself, and they should be useful against the Kraken.
  - **The Kraken and the tide:** shallow water it can't come into, so bilging pushes it out
    (the user, 9 Nov).
  - **Buried things beyond rocks:** a half-sunk wreck, say, uncovered at low tide.
  - **Bilge your way out to their ship (9 Nov):** "maybe you start with the water all the way to
    the top, and if you get down far enough ... the enemy ship is basically anchored at the bottom
    of the bilge board, so that lets you go and board the enemy, attack the enemy ship or
    something, and that's what gets you like a nice progression into seafaring." (Goes with the
    pet Kraken, and the den becoming more ship-based.)
- **Keep it democratised:** everyone gets a turn at the fun jobs (see the principle above).
- **More to do at sea, for a real proof of concept (9 Nov, "more than just a tiny mini game"):**
  - **A sailing puzzle:** hijack one of the boats on the shore (the tiniest thing with sails, a
    little sloop, rather than a rowboat) and sail or rig it out.
  - **Blockades and Atlantis in 3D:** the den should show how they'd work, with adventures to set
    off on from the beach. Ships carry a few rowboats to launch attacks from, as Atlantis does;
    grapple an enemy ship and send the soldiers over.
  - **Pillaging with choices:** board them, or fire round, grape or chain shot, each doing
    something different. Terrorise a convoy: sink one or two and your infamy grows, so the rest
    are more likely to surrender. A sunk ship pays less, but builds infamy.
  - **Everyone on the board:** a few people sail, the rest crew the rowboats or aim the little
    guns, so everyone contributes. Pets helping too, though 40 pets on a sea monster hunt needs
    rethinking.
  - **Ship types with real trade-offs:** harder to sink against faster, and so on. Today it's
    the big war brig or nothing, and a fast ship on a blockade board just gets sunk.
    **Fit her out, Wacky Races style (9 Nov):** specialist ships with real meaning, a fit with the
    racing on the trade winds: one built for top speed, one quicker off the mark, one with a
    cannon that's a bit slower but can daze the others, one with a crane to haul her up a cliff
    (above, "haul her over"), one with a navigation post to find the hidden routes (the
    Navigation duty puzzle, above). Not one thing or the other, necessarily: you configure your
    ship, adding a crane or a navigation post, each with its cost. "I'm sure we can come up with
    other ideas." (What the fittings are, what each costs her, and how many she takes: to shape
    with the user. A racer of our own, not a copy of any game's karts or cars.)
    "The really wacky thinking": a **taller mast** gives you better vision over where the shortcuts
    are, to navigate through them (with the navigation post). The user wants more wacky ship ideas
    like this, Puzzle Pirates-inspired, and knows they'd "have to have a lot of balancing".
    **Cohesion first (the user, 9 Nov):** "they do need to have some kind of cohesion to them. Not
    just let's create a new mechanic for every ship." So the fittings work through the few things
    the sea already has (the trade winds, rocks and the bumps on them, the lock, the turret and
    being dazed, the duty puzzles), each changing how one of those plays for you, and a new
    mechanic only where it earns its place. From a brainstorm, the ones the user liked:
    - **Oars, a longship:** she can go where there's no wind: "absolutely make it meaningful". But
      no new puzzle for rowing ("we've already got sailing"): the Sailing duty puzzle drives the
      oars as it does the sails. A good addition, and a choice: oars or cannons, you give one up
      for the other.
    - **More bilge pumps:** to get through the canals faster: the locks pump up quicker (Bilge is
      already how a lock fills). A giant one is "just funny", but not too Wacky Races.
    - **More cannons:** load them (Gunnery), daze a rival, reload; the guns against the oars.
    - **A ram on the bow:** bump a rival to daze them ("certainly the ram ship"); bump a rock and
      it's you that's dazed.
    - **A grappling hook:** hook a rock to whip round a corner tighter, or hook a rival to be towed
      ("I love those sort of things").
    - **A shallow draught:** over sandbanks and shoals the others can't cross ("I don't mind some
      of the things like getting over some of the sandbanks"). (Real enough: flat-bottomed,
      shallow-draught boats do cross shallows; pinning it on the dhow was only a guess, since in
      Puzzle Pirates every ship goes the same places.)
    - **Jettisoning ballast** for a burst of speed: fine, and familiar, the way Puzzle Pirates
      already has the double forward and chain shot.
    - Not fog and lanterns: "probably getting too many mechanics there", and clearing the way is
      already the Navigation duty puzzle finding the hidden routes.
    The shallow draught is the kind the user likes best: everyone racing in the same water, and a
    plausible advantage. And the lock is a quick shortcut for whoever'll pump it.
    **Puzzle-driven, eventually:** every fitting works through a puzzle in the end (Sailing for
    the oars and sails, Bilge at the locks, Gunnery for the guns, Navigation for the hidden ways).
    A first race could be a demo, one player, with no puzzling behind it, but that's the
    direction. Not too wacky: "I don't think I want to go too Wacky Races".
    **Not just faster (9 Nov):** a fitting that only makes her quicker isn't what the user wants
    ("rather than just going faster, which I'm not really a fan of"); one that opens up water the
    others can't use is: "a bit more of a tactical ship". A calm patch where only oars move her
    at pace is that kind (as the shallow draught is over sandbanks). But not a ship without guns:
    gunless makes sense in a race, "but I'm not sure how that makes sense in the broader, bigger
    world. Like, I don't really want a ship without guns." (Proposed, to settle with the user:
    sweeps, the long oars real warships ran out through their ports in a calm. Every ship keeps
    her guns, but while the sweeps are out the guns at those ports can't fire, so in a calm you
    choose, moment to moment, to row or to fight.)
    **Shallow and deep water is what's left of it (9 Nov):** "the only thing that really makes
    sense is that you can have bigger ships that need a bigger draft", so just shallow water and
    deep. Even that's partly the map's job already: bigger ships are more squares wide, and a gap
    one square wide keeps them out. What shallows do add is **visual diversity**: a few squares of
    shallow water where ships "really slow down", and a small ship gets her oars out to get over
    it, "especially as bigger ships come in later" (they'd need the deep water). On hold: "it
    still just seems forced".
    **Which puzzle would get her over the shallows? (10 Nov)** The user likes shallows as an
    alternative way, but "what physical activity in the real world would you associate with going
    through ... some shallow waters? Nothing really jumps to mind" (adjusting the rigging, the
    Rigging puzzle, is "a bit of a stretch"). Real seamanship has some: **sounding** (a leadsman
    swinging the lead and calling the depth, so she's steered through the channel: Navigation,
    already the idea for the navigation post), **kedging** (rowing an anchor out ahead, dropping it
    and heaving her up to it on the capstan, the way ships really got off sandbanks and through
    calms: a heave, maybe Sailing or Rigging), and **lightening her** (stores over the side or into
    the boat to float her higher). Sounding through by Navigation is the most natural fit. Also
    asked: is it a problem that puzzles built for continual duty are used for small one-off jobs
    (the lock's Bilge, the deck patch)? Puzzle Pirates' own duty puzzles map loosely onto the work
    (Bilge for pumping, Sailing for trimming); a short round to a goal, as at the lock, seems to
    stand up. (To talk over with the user.)
    **Rowing puzzles, some first ideas (10 Nov, asked for: "going over some shallow shoals with
    some rowing ... what kind of ideas have you come up with, like, for a rowing puzzle?").** The
    user earlier didn't want a puzzle made just for rowing, so the first two reuse what's there:
    - **Port and starboard (Bilge's board, split down the middle):** the left half is her port
      oars, the right half starboard. Clears on a side pull those oars: even work on both sides
      keeps her straight, more on one side turns her. Over a shoal the deep channel twists, so the
      puzzle is the steering: you plan your clears to follow the bends. A run aground just stops
      her till you've cleared her off (no damage).
    - **Sounding the channel (a deduction board, Navigation):** the shoal ahead is hidden; each
      cast of the lead shows a square's depth, and the numbers tell you about the squares round it,
      so you work out the safe channel before you row it, a stroke a square. Thinking, not timing.
    - **Keeping stroke (new, a rhythm-free tile puzzle):** a row of rowers' benches, each with an
      oar in some position; one move swings a run of them, and a stroke lands when every oar on
      the bench line matches. Fewer moves, longer strokes.
    - **Kedging (the capstan):** row the anchor out, drop it, and heave her up to it: rings of the
      capstan to turn into line (a Carpentry-like fitting, or a short Bilge round at the bars).
      Slow but sure: good for the very worst shoals, and for a calm.
    (Port and starboard is the pick for cohesion: one mechanic used a new way, and it makes the
    oars steer rather than just go. The user loved it, 10 Nov: in TODO.md.)
    **Rowing as a team, and the heart of a race (10 Nov):** "this would make the core of a race
    puzzle in itself". The split board is for solo; in a crew, each pirate rows one side on a board
    of their own: "you've got your side and you've got your mate's side". Out of step, "one's
    outperforming the other, you just end up rowing in circles"; "if you both clear a bingo at the
    same time, that gets you that good balanced forward momentum". A Vegas on one side is a burst,
    with "that one pirate ... going like crazy" at the oars. "A real team building puzzle", and
    "absolutely hilarious". Goes with the race idea and "Better together" in STORY.md. (The rowing
    rules are being built to take a side from either board, so this can come later.)
    **Taking rowing further from Bilge (10 Nov):** the user loves the split board ("quite
    unique") and keeping two sides, or two people, in sync, "I think we need to build on that",
    but wants it further from plain Bilge. Ideas, each building on the sync:
    - **Benches across the keel:** each row of the board is a bench with a rower each side. A line
      across the middle (both seats of a bench) is both rowers pulling together: straight ahead,
      the best pull. A line on one side only turns her. The board's shape is the steering.
    - **Mirror strokes:** the halves mirror each other; a swap on one side makes the mirrored swap
      on the other. Each move works both sides, so you hunt for the move that clears on both. In a
      crew, your move is mirrored onto your mate's board: you help or hinder each other.
    - **Catching a crab:** a real rowing term (an oar blade caught in the water, jerking the rower
      off his stroke), and Bilge already has crabs. On the rowing board a crab jams that side's oar
      till it's cleared, so she swerves. A pun with a real mechanic behind it.
    - **The drum:** a galley drummer beats the stroke, a count of moves. What each side clears
      within a beat counts together; in step on the beat is a full stroke. In a crew, a third
      pirate could drum (the coxswain), calling "port two!" for a bonus when it's matched.
    - **Currents and shoals pull the board:** a current across her bow tips the pieces to one
      side, so you row harder on the other to hold straight; over a shoal the channel bends and the
      pull changes. The sea itself shapes the puzzle.
    - **Tired arms:** each side tires as it works and recovers as it rests, so leaning on one side
      can't carry her; balance is rewarded without a timer.
    (Benches across the keel was "confusing": dropped. Mirror strokes "maybe has an idea ... that
    gets it further than just being a double bilge board", if it has the depth: see below.)
    **Mirror strokes, thought through for skill (10 Nov):** the test is STORY.md's "Quick to learn,
    hard to master". Two full Bilge boards side by side, port and starboard, with pieces of their
    own; every swap you make on one is made in mirror on the other. Quick to learn: "every move
    rows both sides; clear on both at once to pull straight". Hard to master: a move that sets up
    a combo on one side scrambles the other, so the skill is reading two boards at once and
    finding the move good for both, and the top of the curve is a Vegas on each side on the same
    move (the zoom). Steering adds decisions rather than noise: matched pull drives her ahead,
    the unmatched part turns her, so on a bending course you sometimes want one side ahead, on
    purpose. In a crew the mirror goes and the two boards are two pirates, in sync by time
    instead: the same idea, clear on both sides at once. Before building it into the den: a
    plain test page, and bots that play it (random, greedy, looking two moves ahead), to see
    whether better play goes much further, as a check on the skill curve. (To shape with the user.)
    **Tested (10 Nov):** `row-test.html` plays it, beside the plain split board. Bots over 30
    games of 80 moves: with pull paired by time, mirror strokes has the bigger skill gap (looking
    two moves ahead goes 9 times as far as greedy, against under 5 on the split board), as the
    obvious move usually scrambles the other board; paired move by move, no difference. Suggestive,
    not proof. Rough edges: pull is low (10 to 28 squares in 80 moves), combos big enough for the
    double Vegas almost never happen, and reading two boards is heavy work.
    The user likes that you haven't full control: "especially if you get like a cascade where it
    then accidentally starts sending you in circles. That would be hilarious. Frustrating but
    funny." And for a crew, just for a laugh: **blindfold rowing**, each pirate's moves mirrored
    onto a mate's board they can't see, "you don't know what you're going to affect on the other
    person's board ... you can just see somebody like clearing, ruining other people's". The
    worry: people would just share screens, which might make it frustrating. Still "a bit funny".
    **Played (10 Nov):** "I actually love it ... I love that it's kind of mirrored, so it's not
    easy. Like, it kind of messes with the brain ... It stops you just kind of playing games and
    setting stuff up. That is so hilarious. This is actually quite a good puzzle." Setting up a
    stack on one side moves the piece you wanted on the other ("Oh god, everything's in reverse").
    It isn't really building up: "within 2 clicks it's done something", which is maybe as it
    should be, "otherwise it would be too easy just to play one side and the other side". Going
    straight is hard (the user hadn't yet). Wanted: fewer kinds of piece, "because that makes more
    of a risk for cascades and unintended effects", anything to make it more chaotic, better
    graphics, and "the actual 3D thing" (TODO.md).
    **Fewer kinds, tested (10 Nov):** `row-test` now lets you pick 3 to 7 kinds of piece (Bilge has
    7; 5 is the default now), with the den's look on the boards and her rowing in 3D beside them.
    Bots, 30 games of 80 moves, squares made good by greedy and by looking two moves ahead: 7
    kinds 2.8 and 10.4; 6 kinds 5.7 and 21.2; 5 kinds 15.2 and 40.6; 4 kinds 63.5 and 60.5. At 5,
    looking ahead still pays a lot and careful play goes straight about two thirds of the time,
    and a random player rows in circles a quarter of the time; at 4 the cascades do the playing
    and thinking no longer helps. So 5 is the sweet spot. Still no bot ever gets a Vegas on both
    sides at once.
    **A course like snakes and ladders (10 Nov):** a rowing race round a course where pulling the
    wrong way at the wrong spot sends you into a whirlpool, or a wind that sweeps you "all the way
    back to the start and you've got to row back up again. That would be hilarious." (Goes with
    the whirlpools and trade winds the sea already has.)
    **Guns trained on squares (10 Nov):** a gun tower (the checkpoint's, say) trained on certain
    squares: land on one and you're blown up, and you mend her by Carpentry. So you either move
    quickly, get hit and repair, or build a combo that moves her two squares at once and skips
    the gun's square.
    **Quick clears against big combos (10 Nov):** the heart of whatever puzzle drives a race: "this
    balance of quick puzzle completion versus big combos". A combo has its risk, "you will get
    shot because you aren't moving and you'll be sitting duck trying to complete a Vegas", and in
    other spots, "trying to zoom past a checkpoint, there is a huge advantage to big combo
    building. It becomes a lot more tactical and direct."
    **A puzzling decathlon (10 Nov):** no reason a course can't switch puzzles as it goes, a rowing
    stretch, then a sailing stretch, "is that like the puzzling decathlon? That would be funny."
    **Oars against the water, a puzzle of its own (10 Nov):** "think outside the box a bit more
    ... what's the analogy for, like, pulling motion". The user's idea, after Puzzle Pirates'
    Rumble: the oars are drawn on the board, and pieces come in from the top as the water's flow,
    piling on the oar and pushing it back; popping them clears the space and lets the oar swing
    forward, "until the normal flow and pressure gradually pushes them back again". So popping is
    the rowing movement: "the bigger amount you clear in one go, you get a bigger, stronger
    stroke", and the two oars still have to go in unison or she goes round in circles. Shaped a
    little:
    - **The stroke:** the oar lies across the board from its rowlock at the foot. The water's
      pressure sweeps it back, and that sweep is the drive that moves her. Once it's right back
      it's spent. A pop frees it to swing forward, as far as the pop was big, ready for the next
      drive: a small pop, a short stroke; a big chain, a long one.
    - **Unison:** her heading follows the two oars. Swinging together, she goes straight; one
      oar driving while the other's spent, she turns. So the skill is building big pops and
      timing them to land together.
    - (Catching a crab, an oar jamming when the pile reaches the top: "forget the crabs".)
    - **Solo and crew:** in a crew, a board each side, a pirate each. Solo, one board whose
      colours belong to a side (say warm colours to port, cool to starboard), so which colours
      you pop is how you steer, and a chain that pops both at once is a stroke in unison.
    Quick to learn (pop pieces, the oar swings, she moves), hard to master (building big chains
    while keeping two oars in time). (To test on the same page as mirror strokes, if the user
    wants. To shape with the user.)
    **Tested (10 Nov):** `oars-test.html` plays it (6 wide, 12 high, pairs dropped where you
    choose, breakers popping their colour; the flow presses each oar back a little every pair, a
    pop swings it forward by its size, links counting double, triple and on, so only chains keep
    an oar going; a stack at the top washes away the top rows rather than ending the game; a crew
    mode with a bot on starboard). Bots over 20 games of 200 pairs: random made good 2.1 lengths
    and rowed in circles; greedy 6.6; seeing the next pair 8.8, still spent 42% of the time and
    rarely chaining, so there's room above it. Steering is clearly a skill; whether it's deep is
    still open. It reads partly like rowing (swing forward, press back), but solo, colour luck
    decides unison more than you do. To try next: the wash costs the oars too, a bonus for
    matched drive, numbers of its own for a crew (much easier: each side gets all the pieces).
    **Played (10 Nov): "very confusing right now".** "I don't understand what's supposed to be
    going on"; the oars drawn on the board "doesn't really make sense ... That's just really
    weird"; and why two oars in different colours, "are the pieces on the board supposed to
    correspond with the colours of the oars? Maybe we could have 4 colours and 4 oars", so which
    colour gets popped says which oar pulls: "kind of Swordfight, Bilge-esque ... but linked to
    the [oars]".
    **Shelved (10 Nov):** four colours for four oars has "nothing unique about it"; mirror strokes
    stays the rowing ("I love the mechanic of the other thing"). This one is "build yourself up
    with a bit of a weird animation, and it's just confusing". A Rumble-like popping game is no
    longer a sure thing either. Its test page stays, unlinked, until the user says otherwise.
    **What was interesting: a drop that nudges (10 Nov).** The pieces looked like compasses at
    first, and "I almost thought like it was going to push something off to the left, like if
    you want to nudge something over and drop it in, like that would have been a bit more of a
    cool mechanic". A seed for a puzzle of its own: what you drop shoves what's there sideways,
    so you place by pushing as much as by dropping. (To shape with the user.)
    **Weather is where oars make sense (9 Nov):** the wind can drop. Under sail she's quicker, but
    when the wind drops a ship that's all sails is "dead in the water until the wind picks back
    up again", and under sail you "can't go against the wind". Oars keep her moving either way:
    slower than a good wind, but never stuck. So the trade-off is a real one, sails for speed or
    oars to be sure, and it comes from the sea itself rather than a tile made for it. (A first go
    is on the sloop's sea, to see how it feels: RULES.md, "The wind, and her oars". Goes with
    "Weather and time of day", under landscapes.)
    Parked for now (10 Nov, "just getting irritating": the arrows got in the way): switched off
    by `WEATHER.parked` in src/den-wind.ts, its code kept, to refine later; the oars stay.
    **The wind in one place: a wreck you can see but can't sail to (10 Nov):** with the wind parked
    across the whole sea ("just getting irritating"), it comes back in one place only: being built,
    see TODO.md, "A wind by the old wreck beyond the checkpoint".
    **Big ships hit hard, small ships mend fast (9 Nov):** a way to give big and small ships each a
    purpose. A big ship has more cannons, but the only control you really have is to "fire a full
    broadside": far more effective against medium and big ships. Against a small ship it's
    overkill: it's only dazed, "they do a quick puzzle and they're off and away again. And you've
    just ... used an entire volley to take out a tiny ship." So a small ship's strength is
    survivability: "they don't have the firepower, but they're fixable", a quick patch (Carpentry,
    as her deck patch is today) and she's away, or at worst she's knocked down to a raft rather
    than sunk. A big ship's holes are bigger and slower to patch. (How a broadside is loaded and
    fired, what "a raft" means in play, and how this sits with "Gunnery with real aim" and
    "Dazed, not damaged" in RULES.md: to shape with the user.)

For now the den is the first version, and that works.

## Gun tower: what's left (the tower itself is built; its rules are in RULES.md)

- **Knocked flying:** get hit by their cannonball up on the wall and you're knocked clean off the
  rampart, comically, and have to walk back up.
- **Upgrades, later:** more guns, a faster barrel. No levels yet.
- **Crew guns facing in?** The user wondered about two guns facing into the den for raiders who
  get through. Left out for now (throwing pieces covers that), but could come back.
- **2D mode:** play the deck as the classic flat Gunnery board while the crew watch it in 3D (see
  the second principle at the top).

## Making it yours: what's next (the first version is in; its rules are in RULES.md)

- **Familiars with personality (9 Nov):** a monkey sits on top of the gate; when raiders arrive it
  panics and runs back to you, and goes back to perch once it's calm. A parrot flies over. And a
  familiar that helps you fight.

Done, 7 Nov 2026: male and female pirates in YPP clothes and dyes, familiars, the flag designer,
Decorate mode (flags, banners, lanterns, rum barrels), a house built from pieces and painted.
Gunnery stores also bump and bounce now instead of stopping dead when they meet.

Ideas to carry on with:
- **More to put up:** a clothes line, a rowing boat, palm trees in tubs, a ship's wheel, treasure
  piles, a Puzzle Pirates-style trophy shelf. And more parts of the den to build from pieces: the
  user wanted **cladding on the walls that don't get attacked** (the cave sides), built from
  frames like the house, then painted.
- **Banners on walls**, hung on the house or the cladding, not just on their own posts.
- **Decorate the outside of the wall.** You can now turn the view all the way round to see the
  wall's outer face (lit by moonlight), and the user wants that "especially as we get to being
  able to decorate it": flags and banners hung on the outer face, a skull over the gate, maybe
  spikes along the top. Decorate mode only places things on the den floor so far.
- **More landscapes and more to each:** snowy north, a volcano island, a swamp; a jetty and a
  rowing boat on the seaside one, parrots in the jungle trees, waves that lap. Weather and time of
  day (a sunset, a storm) would fit too.
- **More of the gun tower to dress:** what's in the crates (shot, rum, fruit, treasure), the deck's
  colour, the guns themselves (bronze, black iron, gilded), the barrel.
- **The shack is small, open-backed and staying that way** (the user loves it: "a lot of
  character"). Things to put in it should suit its size: a hammock, a sea chest, a lantern hook.
- **Move what you've put up** (pick it up and put it down again) rather than take down and redo.
- **Inside the house:** furniture placed the same way, as in a YPP house.
- **More clothes:** coats in more cuts, sashes, the rest of the YPPedia hat list (Bicorne,
  Musketeer hat, Turban...), hatted familiars, and more familiars (bat, dragon, lobster).
- **Earn them:** the user's later idea of quests for looks (rare dyes and familiars found or won)
  fits here; for now everything is free to try.
- **Houses that stay:** the house and rampart go with each new game, though the decorations stay.
  A den you keep between visits would want them kept too.
- **The main puzzle's solver** (`js/engine.js`) works row by row, which is very slow on long thin
  shapes (a 3 by 15 strip took about a minute). The den's copy turns wide shapes on their side
  first. If the main site ever solves long strips, do the same there.

## Mods you make yourself, with an AI (9 Nov, a big one)

Puzzle Pirates players love making things their own (their clothes, their looks). The user wants
the den "fundamentally customizable in every single way, with modularity points for all those
things", and not by asking for features: "we've got AI nowadays. You don't need to put a request in
to say, can you add this hat? ... Go build it yourself." Describe what you want ("do you want
penguins to be your bodyguards that get spawned and go and attack the enemy with wet fishes? Or do
you want a cheeky monkey that's going to lay banana peels that trips them up?") and plug it in.
- **Bring your own AI:** the den doesn't pay for anyone's AI credits. Instead it gives you
  instructions to copy into your favourite LLM (Claude, ChatGPT): the context ("here's a soldier.
  They do this and this"), the interface a mod has to follow ("this is what our customization
  endpoint looks like"), and the default code as an example ("go change it however you want").
- **Modding points for everything:** familiars, bodyguards, the soldiers, accessories for the house
  and the wall, how the wall looks, and the rest.
- **Compatible with the core game:** "in a way that's compatible with the core gameplay, but at
  least aesthetically do whatever you want". A mod can change how things look freely; how far it
  can change what they do (penguins that really slow raiders, banana peels that trip them) needs
  limits, so the puzzles stay the puzzles and a crew stays fair.
- **To work out:** what a mod is (a small script against a typed interface, with the den's own
  familiars and soldiers rewritten as the first mods, so they're the examples); keeping it safe (a
  mod someone pastes in runs in a sandbox, can't reach your browser's data or the network, and a
  broken one just falls back to the default); sharing mods with your crew (a crewmate's penguins
  in your den); and a page in the game that hands you the instructions, ready to copy.

- **The commercial side (9 Nov, for the bigger commercial ideas list):** a marketplace where
  players sell the familiars (and the rest) they've made, charging doubloons for each sale; the den
  takes a cut, bigger for more extravagant ones, plus a margin on top for any AI usage it runs for
  them.
- **Familiars stay special and earned:** "you shouldn't just be able to create any old familiar
  that you want. Like, you should have to really earn and pay for that, whether that's through
  game achievements or whatever." And nobody gets someone else's for free: "you don't want to be
  like, oh look, someone's seen my dragon, then you can just go copy it for free". So making one
  takes an achievement, and what you've made is yours to sell or keep.
- **A fully moddable game:** beyond looks, whole modded versions. "Keep the core puzzles, use the
  core puzzles how you want, but ... add your own mod of, like, a specific scenario and fun twist
  that you want to do." The core is the puzzles and the enemy spawning; a mod builds its own
  scenario round them.

## Holding the wall: what's next

- **The same physics for everyone (9 Nov):** "If raiders can get through a hole, so should you be
  able to." A gap in the wall raiders can walk through, you can walk through too (out onto the
  beach and back), and the other way round: wherever you can't go, neither can they.

Ideas if keeping raiders out still feels hopeless or too easy once the user has tried the
first fix (TODO.md has the playtest):
- **Raiders who get in should be catchable**: they walk to the chest; a crewmate standing in the
  way could block them, and a thrown piece already knocks them flat.
- **Repairs between waves**: Masterpieces could heal a little in the calm (the user's call).

## Swordfight soldiers, and choosing your mini-game (8 Nov)

The user wants to get on to "something bigger". Like the tutorial in Age of Apes, where "they have
like 3 mini games, and you get to choose between them": the den should give that choice of how
to defend. Swordfight is the one to bring in next, since it "would come in naturally quicker than
gunning":
- **A sword-fighting piece from each raider beaten,** falling inside the den (or some other way of
  getting them; the user likes it as a reward).
- **The pieces spawn little soldiers** who help defend, and end up sword fighting the raiders.
- **No picker: a natural choice.** The user: "attackers are coming and you just choose which ways
  to deal with them. Similar to how you can defend with carp or jump to the gun turret later. All
  options are there and you naturally choose between them."
- **Built 8 Nov** as the sword rack (RULES.md, "Swordfight at the sword rack"): the real puzzle,
  with what a break sends mustering soldiers. Still open: with a crew; strikes from the raiders
  (only sprinkles so far); whether soldiers should march out of the gate.
- **Rethinking it after the demo (8 Nov).** The board on a sign "feels like it's been forced in"
  (TODO.md), and setting it into a wall "doesn't really make sense". The user wants "really natural
  and like brilliant ideas for this". Their own:
  - **Sprinkles build a barrier:** breaking loose pieces could send something to fall "to build an
    extra barrier ... on this side of the wall", helping block the breach the way "full of rubble"
    does after a fresh breach.
  - **Soldiers from fused blocks, not sprinkles:** "you'd have to do a combo, like a fuse block to
    get a soldier, and obviously combo for multiples".
  - **Breakers as rewards, not gold (8 Nov):** the user, once the hoist was in: "this actually
    fills in another nice gap is when you get rewards for things like masterpieces, because, you
    know, the whole getting some gold thing is fairly meaningless. So getting a reward like some
    breakers would be a lot better than gold." So a Masterpiece (and perhaps other good carpentry)
    pays in Swordfight pieces, breakers above all, which ties mending the wall to the hoist. **Built
    8 Nov** (RULES.md, "Masterpieces pay in breakers").
  - **Claude's suggestion, the armoury stack** (the user: "implement your idea. Let's just kind of
    see what it feels like"; **built 8 Nov**, with the user's two ideas, RULES.md "Swordfight at
    the armoury hoist"; the stack stands full height under a tall hoist; soldiers come out from the
    stack, not the shack, since the shack may not be built yet): the board is a real stack of
    weapon crates in a corner of the den, built in the den's own timber, at about the size of its
    crates. Each colour is a crate of one weapon (the four swords). A hoist on a beam lowers each
    pair, which is how it "falls" in 3D, and you turn it on the rope. A breaker bursts the crates it
    touches. Loose crates (sprinkles) were first stacked as a barricade inside the nearest breach; since
    8 Nov they're broken up for planks that mend a piece of a hole for good (built: RULES.md). A fused block is a big chest
    of swords that arms a soldier from the shack, and bigger blocks and chains arm more of them.
    Attack blocks are crates nailed shut with iron bands. Still to work out: a 13-high stack at
    crate size is far taller than the wall (a tall hoist frame as a landmark, like the gun tower;
    smaller crates; or a shorter board).

## Swordfight: the golem boss

Reference: https://yppedia.puzzlepirates.com/Swordfight (still to read before building: the
drop patterns per sword, and where exactly strikes and sprinkles land).

In the puzzle, coloured blocks drop in pairs; either piece can be a block or a breaker. Lumps of
one colour, two by two or bigger, fuse into big blocks. A breaker smashes the touching blocks of
its colour, and big blocks and chains hit harder. Your smashes bury your opponent's board in
sprinkles (junk that counts down and turns into blocks), and theirs bury yours. Fill to the top
and you lose.

Where it's got to (7 Nov 2026), kept simple on purpose (the user: don't make it multi-step):

- **A golem boss, fought in a real Swordfight.** A big standoff in the open, almost heroic, so
  it's fine for the raid to pause for it, and the golem's size makes its big board look right.
- **One pirate can do the swordfight** (start there), but it's a team thing: **crewmates help
  from their own jobs.** A cannon shot from the gun tower that hits the golem drops black blocks
  onto its board, which makes it more plausible to beat. That help must be easy to see: the shot
  lands, and the blocks appear on the board.
- **The puzzle should feel real:** the board is the real Swordfight board, standing big beside
  the golem where everyone can see it.
- **Swords falling from the sky, as animation only.** The user loves the idea of seeing attacks
  as swords raining down onto the board they hit, both ways, for a dramatic swordfight, without
  touching the puzzle itself. With several pirates, each has their own board, in a ring round
  the golem, all sending swords down on it: three on one.

What the real puzzle already does (YPPedia *Swordfight* and *Brawl*, read 7 Nov 2026), which
answers most of the 3-on-1 questions without inventing anything:

- **Board:** 6 wide by 13 high; pairs fall from the top of the fourth column. You lose when the
  fourth column is full.
- **Swords really do land on the board.** A fused block (2x2 or bigger) that shatters is sent as
  a *strike*: an immovable sword image of about that size that lands on the opponent's board,
  stays one turn, then turns into grey blocks that decay into normal blocks. (A 2x2 sends a 1x4
  sword, a 3x3 a 2x4; wide blocks send horizontal swords, which can come in from the side.)
  Loose blocks are sent as *sprinkles*, one grey block per two broken. Chains multiply both.
- **Instakill:** a sword landing in the fourth column knocks that fighter out at once. A ready-made
  finisher: a giant sword impaling the golem's board.
- **Cannon damage is black blocks.** In sea-battle swordfights, the ship's cannon damage adds
  immovable black blocks from the bottom of the board up (at most 6 rows). So the user's cannon
  idea is the real rule: cannon hits on the golem add black rows to its board. The other way is
  real too: damage the den has taken could add black rows to the crew's boards.
- **Three on one is a brawl** (a *fray* when it's against monsters). Each pirate plays their own
  board and picks who to attack; here, there's only the golem. The opponent targets one fighter
  at a time rather than splitting attacks, so the golem should turn to whoever it's hitting, and
  the others get time to build big chains (YPPedia notes teaming lets some players build their
  chains unhindered).
- **Getting to the golem (the user, 7 Nov):** the fight is out in the open, so pirates need to
  be able to walk out through the front gates to confront it. Or the golem smashes the gates open
  and the fight comes to them. The user leans to **the golem smashing the gate open**: they like
  the chaos, and it opens a way out of the front for later (to the golem, and other things
  outside, like the treasure maps). But the den mustn't then be "forever wide open": the gap has
  to be closable again, e.g. mended with carpentry into a gate that opens and shuts. Either way
  it's part of the first test.
- **NPPs don't take attacks the way players do** (bigger attacks still hurt more), so how the
  golem's board takes three pirates' attacks can be tuned without breaking faith.

Tried and dropped along the way: clay soldiers or a golem built from smashed blocks, with
breakers won from kills ("too far away from the sword fighting puzzle"); one-on-one duels at the
wall (too slow for the raid, "really disjointed").

## The bigger picture: from a den to a pirate world (long term)

The user's brain-dump (7 Nov 2026), for much later:

- **Raids are a mini-game you start,** not something happening all the time. In a bigger
  multiplayer world the den would be a place you live and build, and a raid is something you
  trigger (or that comes now and then), a little mini-game.
- **Houses:** build houses, or work out how building on land would go.
- **Mines, flooded, with Bilging:** a way to bring puzzles onto land. A flooded mine with a big
  pool of water by a pump, where you play the bilging puzzle to keep it pumped out and keep building
  further in. Down there you dig resources, like iron for cannonballs.
  - (The user said "building puzzle"; by the pump and the water, that's Bilging, from
    https://yppedia.puzzlepirates.com/Bilging. Bilging: swap two side-by-side pieces to make lines
    of three or more of a kind, which clear and pump the water down. Bigger clears have names
    (Good, Great, Arrr!, Har!, Yarrr!, Bingo!, Sea Donkey!, Vegas!). Water rises if it's ignored.
  - Crabs clear when they reach the waterline. A pufferfish clears the 3x3 round it. A jellyfish
    clears every piece of one colour.)
- **Quests for looks:** personalised clothing and dyes, found by hunting ingredients out in the
  forest, with rarer ones for better things.
- **Stronger opponents** further on.
- **Rumble, as boxers:** Rumble could spawn troops of your own, but boxers: big brawlers in
  boxing mode, like the heavies in Team Fortress 2. How the puzzle maps onto them is still to work
  out. Since the Swordfight clay soldiers were dropped for being too far from the puzzle, Rumble
  probably wants the same treatment as the Swordfight golem: the real puzzle, with the fight
  around it shown in 3D.
- **Fill out the place:** trees, and water behind the den, so it feels like a pirate den on the
  coast. They attack from land now, but the sea is right there.
- **Ships and voyages:** later, build ships and sail off on voyages for resources: the full Puzzle
  Pirates kind of thing.
