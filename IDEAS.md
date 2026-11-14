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
  **Control the checkpoint, and the trade lanes grow (11 Nov):** "maybe once you control the
  Imperial checkpoint, you know, the trade lanes get bigger. So again, that's kind of the shortcut,
  so you can get through faster when you start exploring more of the world." Taking the checkpoint
  is a reward that lasts: wider, longer trade winds through it, a quick way out to the rest of the
  world once there's more of it to explore. (What "control" means, holding it rather than only
  knocking its guns out, and whether it fits with checkpoints that come back: to shape with the
  user.)
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

## Sunk at the checkpoint: row home in a little boat (10 Nov)

"Would it be funny if she actually destroyed your ship and you then had to row back to shore in a
little rowboat, doing the rowing puzzle ... This is how we need to get back to shore, and that's
how you discover that you can ... learn how to row." It goes with the checkpoints being strong:
"not things you just casually get through on the first try. Like, oh, that was easy ... you need a
bit more incentive to figure out the side route. Like, you should be able to get through here, but
it should be work." Shaped a little:
- **Losing is a scene, not a game over:** take too many hits running the checkpoint and the sloop
  goes down (Bella's last shot, Dignity's giggle), and you bob up in a little rowboat.
- **Rowing is how you get home:** the rowboat is rowed by mirror strokes, so this is where many
  players first learn to row. Once they can row, the winds that guard the wreck and the canal are
  theirs to beat (the secret still never said).
- **Not a punishment:** a short row home, and the sloop's back at the den for the next go (mended,
  or a new one), so the cost is time and pride, never progress.
- **The checkpoint stays possible:** a bold run with a hit or two can still make it (TODO.md, "A
  real chance to get past the checkpoint"); sinking is what happens when you keep pushing your
  luck. (To pin down with the user: how many hits sink her, and whether the rowboat starts by the
  checkpoint or partway home.)

## Kikkit's penguin: five lefts through the whirlpools (10 Nov)

A side quest **beyond the checkpoint, off to the right** (the old wreck's off to the left). The
user went back and forth, then settled it (10 Nov): "I do want there to be a bit of a reward for
getting through, and that is unlocking a few more side [quests] ... there's already side quest
here [before it] ... I think it should be after the checkpoint, off to the right." You come across
Kikkit off to the right, telling you how she's trying to catch a penguin, and it takes you off
down that way. (Earlier the same day: "you don't really necessarily need to get through the
checkpoint for her": superseded.) It suits her: "it kind of fits with her just being out in the
middle of nowhere on an island trying to figure out some sailing."
- **A sea that keeps blowing you back:** "just an insane number of ... whirlpools and winds, and
  they always keep blowing you back, like the Snakes and Ladders style." It suits her: "she's
  just a bit loopy crazy." (10 Nov.)
The user, earlier:
"Look for the pirate Kikkit as well, we need to make her a penguin in the game somewhere, hehe";
then "she's definitely a penguin side quest".
- **Her whirlpools are a way through the reef, past the checkpoint (11 Nov):** looking at the
  map's "ways past the checkpoint" count, the user felt it was "realistically ... only really the
  two ways around" (the gate and the locks), then: "maybe that will be a good place for it to be,
  is that's a way for you to get through the reef. And there's a penguin in the middle, so it gives
  you a bit of a reward. So it's not just the same as ... because it's going to be a bit harder than
  the other option. So you get the reward of the penguin in the middle. Yeah, that can be
  definitely one of the ways. I think that would make sense for getting through that reef." So the
  whirlpools and winds are a passage through the reef to the right of the gate, sailed with the
  Sailing puzzle and its Vegas; harder than the gate or the locks, and the penguin in the middle is
  the reward for going that way. A way past of its own on the map's list.
  **Settled (11 Nov):** Kikkit's island and her whirlpools are to the right of the imperial
  checkpoint, "because it's another way of getting past the reef, so it should go over there."
  And "definitely a Vegas to get fully through to the penguins. I think as long as we have a
  relatively simplified puzzle, that should be achievable. Because you've got relatively small,
  easy platforms. So most people familiar with it, I'd expect can do that." So the whirlpools'
  board stays simple (small, easy platforms), smaller chains carry you part way, and a Vegas
  takes you all the way through to the penguins.
  **Then a small combo through, the penguins the bigger prize (11 Nov):** "Maybe a small combo
  gets you through the reef, with the penguins being the bigger prize after." So a small chain
  gets you through the whirlpools and past the reef (the third way past), and the penguins lie
  just beyond, reached only by a Vegas.
- **Kikkit:** a real pirate on Emerald (checked 10 Nov): captain of Rodrigo's Revenge, of the flag
  Egotistical Englishman, an Admiral in the Aimuari Island Navy (Dignity's navy, and above her).
  Drawn from her portrait by the pirate maker: black curly hair crowned with red roses, an
  eyepatch, gold hoops, her tongue out, blue swirling tattoos on her arms and middle, a red top
  tied at the front, a red wristband, a ragged black skirt on a gold-buckled belt, bare feet, a
  stone jug marked XXX. Every piece a wardrobe item. Her familiar is a monkey, Rodrigo (the user,
  10 Nov: "she doesn't have a ghost ... it's definitely Rodrigo"; her ship's named for him), not
  the ghost first read off her portrait: check it again before drawing him.
- **A bit drunk:** the jug and her tongue out are her. "I remember taking a left, the left, the
  left, the left, and just spinning ... everything was just spinning": the irony is she's drunk
  as well as in the whirlpools.
- **Sailed, with the Sailing puzzle (10 Nov):** "she's definitely a sailing kind of person", so the
  whirlpools are sailed, not rowed. The challenge is getting over the whirlpools, and "you've got
  to do at least the Vegas to get through": you go into the Sailing puzzle and a Vegas sends her
  a long run forward in one go ("like 7 forwards"), clear over what would spin you round. It also
  teaches the way past the checkpoint: a Vegas carries you through in one go, past the guns.
  "That ties in extremely well." (Sailing's real rules and combos to check on YPPedia; see
  "Tokens from sailing".)
- **Her crazed directions:** "I really want a penguin. I saw one over there. I can't remember
  which way I went. Maybe I took five lefts and a right, or was it five rights and a left?" She
  sounds loopy ("you can't have taken five lefts ... spun around on the spot ... hopped"), "she
  can't get her lefts and rights right", "weird and random like that".
- **The twist, she was right:** the way there is through some really weird whirlpools, and
  whirlpools, as in Puzzle Pirates' Battle Navigation, swing you round and set you off facing
  another way. So getting through really does take five lefts: "oh, okay, I think she was actually
  right". Her directions are the puzzle's key, if you take them seriously.
- **The penguin:** found out past the whirlpools, and won by a puzzle, as every reward is (which
  one: to pin down). **It goes back to Kikkit (10 Nov):** "by the end ... the penguin needs to go
  back to her. So when you've completed it, you see her on the island with all her animals and
  the penguin, and she's just so happy." The ending is that little scene: her island, all her
  familiars, the penguin among them, and Kikkit overjoyed. (Earlier thought, now set aside: the
  penguin keeping you company.)
  **Or she goes to live with the penguins (11 Nov):** "Maybe the end is when you get to the
  island, Kikkit [decides] she's just going to go live with the penguins. You know, fits with her
  personality and the general craziness." So instead of the penguin coming home to her, she
  ups and leaves her island to live among them: the ending is her settling in with a colony of
  penguins, delighted, which nobody saw coming but which makes perfect sense for Kikkit. (To pin
  down with the user: which island, hers or a penguins' island past the whirlpools, and whether
  her familiars go with her.)
  **Settled (11 Nov): she moves to Vegas Island.** "She goes and moves to the Vegas Island.
  That's what we call that. That's a funny name." The penguins' island, past the reef where only a
  Vegas reaches, is **Vegas Island**. "Familiars definitely follow along with her. Maybe they can
  swim in the water after your ship when you're kind of doing the sailing." So the ending: Kikkit
  comes along to Vegas Island, her familiars swimming in your wake as you sail there, and she
  settles in among the penguins, delighted.
  **A cutscene of her own? Probably not (11 Nov):** "does she deserve a cinematic? I don't know
  ... maybe I think, yeah, that would be too much, especially since we're going to be getting the
  cinematic from [Tzz] on her balloon popping. Otherwise, it's just going to be too much, maybe."
  So her ending stays light, in her speech bubbles and what happens on the water (her familiars
  swimming after you), not a full cutscene; Tzz's balloon lesson is the cutscene of this stretch.
  Comes after the whirlpools and Tzz.
- **Penguins in the wardrobe too:** "make her a penguin" first meant Kikkit as one; if wanted,
  a penguin body the pirate maker can dress, so anyone can be a penguin.
- **All in on her craziness (10 Nov):** "really just do the whole craziness of Kikkit ... she's the
  crazy one". Her directions ramble: "I took five rights, all right. Did a double backflip. Well,
  that's what I get", "and then I saw a penguin, and he was wearing a balaclava", doing some other
  silly thing; she "just goes off on 20 different tangents while she's trying to explain to you
  how to get to this penguin in a weird, like, loopy, drunk kind of way."
- **Every bit of nonsense is literally true:** "it's got to actually make some mechanical sense so
  that it's more funny and literal". Her ramble is the map, if you take it at its word: the
  "double backflip" is a whirlpool pair that spins her right round twice; the turns she counts
  are the turns the whirlpools make; the penguin in the balaclava is really there, up to
  something, where she said. The funny part is finding out she was right all along.
- **Her "whoosh" (10 Nov):** her ramble gives away the Vegas without meaning to: "I kind of
  remember going in the sailing puzzle, doing some sailing, and then whoosh!", with big emphasis,
  throwing her arms around, "it got really, really big and really sparkly and awesome, and I
  ended up with a penguin. But then I took a few lefts, too many lefts, and I ended up back on
  this island", sad face. That's the mechanic, told her way: a big combo, a long rush forward,
  and the whirlpools' lefts that bring you back.
- **Kikkit aboard, doing the sound effects (11 Nov):** "maybe Kikkit comes on board and does all
  like the sound effects of like whoosh or sparkly, like commenting on how sparkly all their sails
  are, really sparkly and all sparkling ... doing her just loopy kind of commentary as you do
  while at sails." So while you play Sailing she rides along, calling out each chain her way: a
  "whoosh!" on a gust, cooing over the sails as they glitter, beside herself at a Vegas. Her
  commentary follows what really happens on the board and in her sails (TODO.md, "Sparkly full
  sails"), so the loopy talk is a layer on the real mechanic (RULES.md), and it's her old ramble
  coming true in front of you. Tzz is also meant to come aboard for the whirlpools (below), so
  who's aboard when needs settling (to pin down with the user).
- **A fighting chance, and progress you can feel (10 Nov):** "give people a bit of a fighting
  chance", so you can "accidentally work out, oh, I did a double and it went forward double and
  got me past one of the whirlwinds". Not straight back to the start after that ("immediately
  sucked me into the wind and spat me back out again ... would be a bit too harsh"): "there needs
  to be some sense of, oh, I've made progress figuring out part of this." So a smaller combo
  carries her a little way, far enough to clear one whirlpool: the progress is in working out how
  it's done. The big rush is only needed for the last, widest stretch.
- **What Sailing gives (built 10 Nov, `src/sailing.ts`):** Puzzle Pirates' Sailing really has a
  Vegas: its chains are Double, Triple, Bingo!, Donkey!, then Vegas!! for six steps or more. The real
  game ties no clear to forward moves, so the den's run is ours: a Double 2 squares, Triple 3,
  Bingo 4, Donkey 5, a Vegas 7 (plus one per step past six). Its bots, from random up to one that
  builds, never made a Vegas in 3000 drops each (the best made a double or better about 7 times in
  100, a four-step chain at most), so a Vegas is a long, planned build. But the user (10 Nov): "Vegas
  is not only doable, I think you end up with like Vegas 3s and 4s quite easily" once you know the
  staircase, so the bots are missing the technique (TODO.md, "Sailing, as the user remembers"),
  and a full Vegas stays the bar for the last stretch.
- **But blown all the way back to her island (10 Nov):** "I do want it to go all the way back to
  her island. I don't want progress to sit. That's the funny [part]": every time the wind catches
  you, you're back on Kikkit's island, and she finds it hilarious, giggling that you got caught in
  the wind again and coming out with more random nonsense each time. A new line each time,
  short, so it's a joke and never a wait (Space skips), and now and then, buried in the
  nonsense, a bit more of the real way through.
- **Where you find her (10 Nov):** off to the right, "just kind of hanging out on her own on a
  little deserted island with ... all her different familiars hanging around her". She's "a very
  animals person ... the familiar version of a cat lady, just with 20 different familiars all
  around her". Rodrigo among them, and Bubba "definitely". One more the user wants in but not
  named in the game (the one heard as "CZ Junior"). Each familiar a little character doing its
  own thing on the island.
- **Nessah and her three-fiddy (11 Nov):** "kikkit and I love nessah wanting 3-fiddy from south park,
  need to add a line for her around that. Almost secret quest like." The Loch Ness monster in South
  Park, forever after "about tree fiddy": a running joke between the user and Kikkit. A line of
  Kikkit's about Nessah wanting her three-fiddy, said in passing among her tangents, that's really
  the start of a hidden quest: somewhere out on the water, Nessah, and if you find her she wants
  three-fifty (three pieces of eight and a half? to pin down), never hinted beyond Kikkit's
  aside. (To shape with the user: where Nessah is, what three-fiddy is in the den's money, and what
  paying her gets you.)
(To shape with the user: which puzzle wins the penguin, and what Kikkit gives you for bringing
one back, if she even remembers asking.)

## Tzz's huge Vegas, on an island of her own (10 Nov)

"Maybe Tzz can be on an island in there showing how she built her huge Vegas? Is that adding too
many characters, or is it rewarding and shows just how ridiculously far you can get, assuming it
gives you the right seed to reproduce that insanely huge vegas?" Tzz (name as heard; a real pirate,
so check her pirate page and portrait first) built the multi-Vegas in the user's screenshot, in a
competition (a Vegas 5 or 6). Out among Kikkit's whirlpools, a little island of her own where she
shows how it's done: her board (TODO.md, "Sailing, as the user remembers", for its look) and the
same deal to try it yourself, piece for piece. Hidden, not on the way (a gem to find), so she
doesn't crowd Kikkit's scene. Needs the Sailing deal to be seeded, so a deal can be played again
exactly; the real game's own seed can't be had, so her board is rebuilt in our deal.
- **Her pirate page, checked (11 Nov):** Tzz is on the Emerald Ocean
  (https://emerald.puzzlepirates.com/yoweb/pirate.wm?target=Tzz): Senior Officer and "Nap
  Specialist" of Virtute et Armis, Princess of the flag Don't Open Till Doomsday, hearties with
  Dachimpy-West, Daquan and Dalnoth among many; eight shacks and a cabin; twelve familiars. Her
  portrait: light brown hair tied back, an eyepatch, a gold hoop earring, a ragged aqua shirt off
  one shoulder, blue-and-white striped trousers to below the knee, a peg leg, grinning, and on her
  shoulder D'rizzle, a red dragon with silver horns (silver, vibrant red); behind her, a copper
  still.
- **Nearer the start, the sensible one after Kikkit (11 Nov):** "Maybe ... [Tzz] appears nearer
  the start, but maybe you talk to [Kikkit], and then the characters are like, now I wonder if I
  can find somebody that can explain how to get past all these ... whirlpools and winds that makes
  a bit more sense, or goes on fewer tangents." So after Kikkit's rambling, your pirate wonders
  aloud (the joke's on her tangents) whether there's anyone who'd explain it straight, and Tzz is
  that someone: her island nearer the start, not out among the whirlpools, where she shows plainly
  how a big Vegas is built. This changes the earlier "hidden, not on the way" (above), and the
  wondering aloud is a nudge that someone else is out there, which "Hidden gems, never hinted"
  wouldn't allow: to settle with the user (it says someone exists, not where or how).
  **Settled (11 Nov):** "you wonder about [Kikkit]. Yeah, that's kind of the wondering [aloud]
  thing." The wondering's allowed: it's your pirate reacting to Kikkit's tangents, not the game
  pointing the way, and it still says nothing of where Tzz is.
- **Both aboard at once (11 Nov; dropped, below):** asked who rides with you while you sail, Kikkit doing her
  sound effects or Tzz teaching, the user chose "both of them at once": a double act, Kikkit's
  loopy "whoosh!" and "so sparkly!" beside Tzz twisting balloons into the pieces that'll work,
  both following what really happens on your board.
- **On Kikkit's island, teaching Sailing like balloon animals (11 Nov):** "Maybe she's on the same
  island as [Kikkit], just to keep it simple. Or you could go over and find her ... like how
  someone does balloon animals, except that she's doing like a sailing version of balloon animals,
  where she's teaching you how to make a double that makes the ship go ... and zoom over the
  whirlpool, and then she almost does like a balloon animal version of a Vegas. Say, look, it's
  simple. Look, you just do this, and this, and this, and this, and this. You set up this thing,
  and it pop, and then she pops it, and all the balloons go popping down as she's popping with the
  thing. That would be hilarious." So Tzz sits on Kikkit's island (or a hop away), the sensible one
  to Kikkit's rambling, and shows Sailing as a street performer twists balloon animals: a quick
  double first ("and that's what zooms you over a whirlpool"), then a Vegas built up piece by
  piece with breezy patter ("it's simple, look, this, and this, and this..."), each piece a
  squeaky balloon twisted on, till she pops it and the chain goes off down the board pop-pop-pop
  like balloons bursting. Sailing as balloon animals: the look of her lesson, and maybe of the
  Sailing board's chains when they go off. (How much of her lesson you then play yourself: to
  settle with the user.)
  **Settled (11 Nov): her own island, nearby.** "Have it nearby because you want to run in to
  [Kikkit] first, because then it's like the point is you want to go find the other person to help
  you." Kikkit first, always; then Tzz is the one you go looking for.
  **The balloon's the heart of it (11 Nov):** "she's literally got a balloon and starts twisting it,
  like the same as you're making a balloon animal, but she ends up ... twisting it into sailing
  pieces and then pops [it] ... It just makes sense of like, well, how on earth do these sailing
  pieces pop in the puzzle? It makes sense. They're balloon animals." So her animation is a real
  balloon twisted, squeak by squeak, into Sailing's pieces, then popped; and that's why Sailing's
  pieces pop at all: they're balloon animals. The Sailing board's own look can follow (its pieces
  balloony, popping as they clear): TODO.md, "Sailing's look".
  **Or Sailing itself is you twisting balloons (11 Nov):** "do you go into the sailing puzzle, or
  does the sailing puzzle become ... maybe you can use it to get through the thing and rescue the
  penguin later, but that would be absolutely hilarious if you can do, like, a sailing version of
  balloon animal ... and you actually see your character twisting the balloon animals somehow."
  The open question: whether Sailing stays a board you go into, or becomes your own pirate on deck
  twisting balloons (each piece you drop a twist, each chain a balloon animal, popped to send her
  forward), the board shown as what's in their hands. Either way it's what gets you through the
  whirlpools to the penguin, once Tzz has shown you how.
  **Settled (11 Nov): both, together.** "you've got actually going through the whirlpools, but
  she's there maybe on your ship teaching you, showing you through her ... balloon animal skills."
  You sail the whirlpools yourself, in the Sailing puzzle, and Tzz comes aboard with you as you go,
  twisting balloons alongside: showing the double that'll clear the next whirlpool, then the Vegas
  for the last stretch, her balloons the same shapes as the pieces on your board, popping as your
  chains do. The joke's on top and the mechanic's real underneath (RULES.md, "The humour's a layer
  on a real mechanic").
  **Changed (11 Nov): nobody comes aboard.** "I don't think they need to be [aboard], to be honest.
  I like [Kikkit] just kind of on her island. It works. It's a very reusable piece as well." So Tzz
  stays on her island as Kikkit stays on hers: a pirate on an island, met there, the same reusable
  piece. She gives her balloon lesson there, and you sail the whirlpools yourself. The double act
  aboard (above) is dropped.

## Daquan's flotilla: "go sink a ship" (11 Nov)

The user's partner in crime, **Daquan** (a real pirate: pirate name only; his ocean and portrait to
check on YPPedia before he's drawn). Their weirdest memory together: on a flotilla, the user
"wasn't doing very well on that particular day, and people were starting to grumble", so Daquan
said "right, quick ... you got to start sinking something. Go sink a ship, quick", since people
were starting to leave. The user "took a few more risks and ended up sinking our ship rather than
somebody else's ... my literalness is like, well, you told me to go sink a ship, I did that."

**Who's who (11 Nov):** the user's own pirate is **Dachimpy** (the repository's name too), and
"we should all be on the same Emerald Ocean": Dachimpy, Daquan, Dalnoth and Kikkit all of
Emerald. Dachimpy is to be drawn in "my rose pink wig, belt and braces and kilt outfit", without
fail (dye names from YPPedia; the rest of the look from Dachimpy's pirate page). Daquan's portrait
still to check on YPPedia (Emerald) before he's drawn.

- **A cutscene past the reef:** Daquan as your instructor, your introduction to attacking the
  ships on the main shipping lane. It opens on the flotilla memory, with Dachimpy at the helm: told to go sink a ship, they sink their own and
  give that literal answer, and Daquan face-palms. Then he turns to you: "right, I need someone
  new to drive my ships. Please ... don't do what the last guy did."
- **Pick a side: the big ship or the underdogs.** This is where Dalnoth comes back in. The user
  and Daquan "were very proud ... of being the underdogs. You know, we didn't seek the fame and
  glory. We wanted to actually ... liven up the ocean." So a choice: Dalnoth staring you down
  from a war frigate full of cannons (maybe where bigger ships and a 50-strong crew come into
  the game), or the underdogs in your little sloop, "livening up the ocean. It's where the fun
  is at."
- **Underdogs vs the giant ship:** a cutscene with someone darting back and forth, "are you
  serious? He's got a giant ship, dude." Maybe this is where the soldiers from the base come in
  (the quest list's soldiers), and you take him out by boarding him from rowboats, "or something.
  I don't know."

Ties in with: the shipping lanes and the gun platform over them (above; the cliff gun platform
needs a go-ahead before it's built), Dalnoth's return (STORY.md step 7), crew from the barracks
(below), rowing (the rowboats), and PvP and bigger ships (both need a go-ahead).

**What his part actually is, still open (11 Nov):** "we're finally going to get either into
some... Maybe that's why he gives you a bigger ship, or we're doing... I think that's a bit of a
spaghetti on the idea of attacking down north with the rowboats, or redoing like a flotilla-style
thing. I'm not sure." Three ways it could go: Daquan gives you a bigger ship (bigger ships need a
go-ahead); boarding the big ship from rowboats up north; or a flotilla-style run of your own. To
settle with the user before it's built, and kept to one little island of its own whichever it is.
**Settled (11 Nov): Daquan lends you his war frigate.** "I want to go for a bigger ship. Maybe
[Daquan] lends you his ship or something. So you got your little sloop for most of it, but for the
flotilla thing, maybe you know go see him and he gives you a bigger ship ... Then you get a [war
frig] to go sink the flotilla, but going around the world, you're in your little tiny sloop. That
can work." So you go and see Daquan, he lends you his war frigate for the flotilla (the one
bigger ship, his, borrowed for that), and everywhere else you sail your own little sloop. That's
the user's go-ahead for this one borrowed ship, not for bigger ships in general (the shipwright's,
below, still waits). Not the rowboats, and not a flotilla run in the sloop.
Proportional, by YPPedia's numbers (RULES.md, "Ships, physically proportional"): his war frigate
dwarfs your sloop, with 24 large guns and dozens of crew to be seen on deck and below (up to 75).
**The frigate is the user's own: Primates Rule (11 Nov).** "Oh, I want to use my ship. What was
it? Is it Primates Rule? My war frigate that's painted black and white ... where it's got like the
gold, the black and white thrones, the skeleton cannons. That's just really cool. I want Primates
Rule." So the war frigate for the flotilla is Dachimpy's own Primates Rule
(no apostrophe: the user, 11 Nov): painted black and white, with gold, black-and-white thrones and skeleton cannons.
Drawn from the user's pictures of her (TODO.md, "Pictures of Primates Rule"), with the paint,
furniture and cannon names as YPPedia gives them.
**Primates Rule as an entry point (11 Nov):** "whether it's a flotilla or pillaging or something ...
there's no reason that can't be the starting [point] for either going for a pillaging or flotilla or
blockade or something, you know, that could be an entry point." So the war frigate's the way into the
bigger-ship activities, whichever comes first; modelling her started 11 Nov.
**Mems as the XO (11 Nov):** "need mems as the xo, she was so awesome. There's a second from the
old viridian days who I can't remember though." Mems, a real pirate (pirate name only; her
ocean, pirate page and portrait to check before she's drawn, and she goes into PIRATES): the XO,
second in command, aboard Primates Rule for the flotilla (to confirm with the user). A second
crewmate from the user's Viridian days to add once the user remembers who.
- **Racing him for pink slips: how you win Primates Rule (11 Nov).** The other way to the frigate, rather
  than buying her ("Maybe it's the alternative"), a friend's idea: you go to Daquan, and he, cocky, says
  "yeah, I'll race you for pink slips. Your sloop against my [war] frigate. Haha, you'll never win" (the
  user's sketch of it, not his words; whose frigate she is, Primates Rule or one of his, to pin down). "I guess you can show him as being a bit cocky ... you can be very arrogant, like, I've never
  been beaten. Kind of have it that way. It's not that quote, but I feel like he is on some level. He's
  very prideful, we'll put it that way." A race between your sloop and the frigate, using the den's sailing
  for real (the winds, a chain's run ahead, the whirlpools as a shortcut) and the oars: "I think we've got
  the racing mechanics, and it lets us do the rowing and all that kind of stuff." Win, and she's yours.
  The loser rows off in a little boat (as in "Sunk at the checkpoint: row home in a little boat"): "the
  loser is definitely just rowing off in their boat. Or maybe you'll end up rowing back because he keeps
  your [sloop], so you have to row. There's a little animation of you just rowing back to your home." So
  win, and Daquan rows off; lose, and he keeps your sloop and a little cutscene has you rowing home to
  the den.
  (To shape with the user: the course, how a sloop can fairly beat a frigate (her winds and the whirlpools
  a frigate can't take? see "Bigger ships ride out the winds"), when he's met, and his lines: prideful,
  never quoting him.)

## A bigger ship from the shipwright (10 Nov)

"Later we can figure out how ... you can have some shipbuilding, shipwright quest to ... strengthen
your [ship] ... maybe that's the alternative if you go back into the base ... to get past the
checkpoint by building a bigger, stronger ship." Another way past the checkpoint (as well as
sailing through on a Vegas): back at the den, build a bigger, stronger ship that can take its
guns. Built by puzzle, as everything is.
- **Damage and bilge meters come with her (10 Nov):** "maybe in a sloop you get damaged and you
  have to patch it up instantly, and then those full damage [and] bilge meter things are bigger
  ship features that we can discover later." On a bigger ship, as in Puzzle Pirates: hits raise her
  damage, Carpentry brings it down when you choose, and while she's damaged her bilge rises and
  Bilge pumps it out; sunk when her damage is full. The little sloop keeps her instant patch ("it
  gives a bit of personality to this little small sloop").

## Rewards that mean something (10 Nov)

The user likes the clifftop lagoon ("I like the little lagoon"), but its treasure, 32 doubloons,
is "a bit meh at the moment": money has to be more meaningful, something to spend or show, and
that comes with the social side eventually (trading, a crew, other players). Way outside the proof
of concept for now; to figure out later.

## Reasons to come home to the den: crew from the barracks (10 Nov)

After ten minutes' playtesting, "it's turned into just, you know, you go out and about doing your
thing, but there's no reason to come back." The sea and the den should feed each other, so a
voyage starts and ends at home. Not next ("Obviously, we're going to do the [Kikkit] line"
first).

- **The den's soldiers as her crew:** "the soldiers can jump on [the sloop]. So if you need a
  couple of rowers, ... maybe I need a couple of soldiers to crew my ship." Before you sail off,
  you take some of the den's soldiers aboard (from the barracks), and that's how you get more
  crew. They could be her rowers (the figures already at her oars), and more hands could make
  some work at sea lighter or quicker. Then the den's soldiers matter out at sea too, and
  building up the barracks ("a little army up later", above) pays off on the water.
- **A shore party for Dalnoth's island:** "I guess that will make more sense ... when we get to
  [Dalnoth's] bit later in his island, ... we need them as like a shore party." Land them on his
  beach to fight their way up (the Swordfight way in, STORY.md step 6), so how many you bring
  from home counts.
- **The pull home:** the den is where you pick up crew before a voyage. Soldiers lost or left on
  a shore come back to the barracks, and there they're trained or recruited again. What else
  should bring you home (spending what you bring back: "Rewards that mean something", above) is
  to pin down with the user.

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


## A Puzzle Pirates wedding: decorating and dressing up as a side quest (10 Nov, "a must")

The user: "we really do need to showcase something here on the more, make, I guess, the decorating
and fashion stuff, yeah, maybe a bit more central ... one of the side quests, I think, needs to be,
you know, someone just going decorating crazy. So like they've got a house that they need you to
decorate or something, or they're ... planning the wedding or puzzle pirate wedding or something,
and they need you to pick out a bunch of outfits and dress up all the pirates ... there's a puzzle
pirate wedding, and you've got to do all the furniture, to organise like all the furniture and
arrangements, dress up all the pirates at the wedding. Oh, people would go absolutely crazy. Puzzle
pirate wedding absolutely is a must."

- **The quest:** a pirate planning a wedding asks for your help. You lay out the venue (furniture,
  flowers, banners, the arch, the seating: Decorate mode, the same placing as in the den) and dress
  every guest, the couple included, from the wardrobe (YPP clothes and dyes, as in Your pirate).
- **Decorating and fashion made central,** not a side menu: the den's Decorate mode and the
  wardrobe become the puzzle-free heart of one quest, a showcase for them.
- **The wedding takes in the house idea (10 Nov):** "the wedding thing supersedes the decorate the
  house thing, that encapsulates everything." No separate decorate-their-house quest.
- **Freeform, with an excited host (10 Nov; the "bride" is now Mischievious as planner, below):** "it definitely needs to be very freeform because the
  whole point is it's being creative, but I still think you need that kind of almost giggly
  excited bride that tells you how much she loves the outfits ... or compliments you as you're
  designing things. Maybe she asks you questions, you choose some different color palettes ... or
  design schemes." So no score and no brief to meet: you place and dress what you like, and
  Mischievious reacts as you go, delighted at an outfit, gushing over the arch. She asks you things along
  the way (which colour palette, which scheme: say, sunset gold, ocean blues, jungle greens), and
  your answer sets the mood she cheers you on toward, never a rule you can fail.
- **The wedding itself, and where (10 Nov):** "we definitely would need a cutscene, guest
  reacting, the whole wedding shot. And you can have options. I think you definitely would need
  options of where it's held." So it ends with the wedding as a cutscene (the den's cine.js, as
  Dalnoth's and Dignity's): the couple, the guests you dressed reacting, the place you laid out. And
  you choose the venue from a few (a chapel in the cliff-top town, a beach, an island, the den, a
  ship's deck: to pin down).
- **Goes with:** "Side quests that leave friends about the den" (the couple could visit the den
  after), "Inside the house: furniture placed the same way, as in a YPP house" and "More clothes"
  (Making it yours, below).
- **Mischievious, who keeps marrying (10 Nov):** "Mischievious is a good friend of the game.
  She's always the romantic sort, let's say that always is marrying. I'm sure she'd be like a
  volunteer for [it] ... 'That was a fun wedding. Should we have another one?' 'I'd always like to
  marry so and so as well.' I mean, I don't think she'd object to it. She'd go with that."
  Mischievious is a real pirate (drawn from her portrait, every piece she wears in the wardrobe, as
  ever), and the quest comes round again: after one wedding she's soon planning the next.
- **Mischievious runs the venue; you marry whoever you like (10 Nov):** "we've got to be gender
  neutral about it, so maybe recast mischievous more in the wedding planner role than the default.
  Maybe she can be like the default bride, so you turn up and she's kind of ... in charge of the
  venue. And you have the choice between ... let's marry mischievous. But ... you have the choice
  to ... configure whoever you want to marry ... marrying a guy, marrying a woman, whatever." So
  she's the planner and host, and the one you marry if you don't choose otherwise; or you set up
  your partner yourself (any pirate, any look, from the wardrobe).
- **A line of suitors, blind-date style (10 Nov):** "she's the one of like, oh, yeah, I'd really
  love to [marry you], but yeah, if not, I've got, here we go, I've got this ... I can set you up
  with this guy ... The last wedding had a ... mishap ... maybe that can be the default guy ... he's
  ready ... as a suitor ... you can have the line of suitors ... pirates and different outfits that
  are all kind of coming at you with bouquets of flowers ... I'm imagining her playing it. She'd be
  like, here are your bachelors. Bachelor number one. You got the blind date style game going on
  here." So choosing who you marry is a game show: Mischievious offers herself first, and if not,
  presents a line of suitors in their finery, bouquets out, "Bachelor number one!" The default
  among them is the groom left over from the last, ill-fated wedding (his bride had a mishap), ready
  to try again. Suitors of every sort, so anyone can find a match; or set up your own.
- **Happy and cheesy, or dark humour: your choice (10 Nov):** "Maybe the whole mishap of the
  previous wedding and suggesting the previous groom thing comes in if you choose the kind of darker
  humour theme or something. So you could choose the happy cheesy or the dark humour ... Depending
  on what kind of wedding you want to go for." So the tone's chosen first: happy and cheesy (the
  venue clean and pretty, her welcome all giggles, no mishap, no leftover groom) or dark humour (the
  wreck, the welcome below, the leftover groom as Bachelor number one). It flavours her lines and
  what she suggests first; every theme and plot stays open in either.
- **Married five times a day, and the line of them to show for it (11 Nov):** "Mischie[v]ious
  agrees, should leave it open to males or females, but she's not naming the females. Yeah, I kind
  of imagine you could turn up and say, oh, weddings are fun, I've gotten married 5 times a day, and
  you can kind of just see the line of various people that she's married of all sorts." So she
  greets you breezily ("Weddings are fun! I've got married five times today"), and there they all
  are: a line of her husbands and wives of the day, of every sort, milling about the venue. Open to
  men and women alike, as she agrees. Nobody in the line is named: "she's not naming her women,
  obviously based on like the real pirates' names" (her real spouses are real pirates).
  But not too far down that line (11 Nov): "I don't want this to go too far down that line ... she's
  just the facilitator for this wedding mechanic. I don't want this to be a [Mischievious] show"
  (RULES.md, "The host, not the show"). Now agreed, as fun not promiscuous: TODO.md, "Five weddings
  today, for the fun of it".
- **The welcome, darkly funny (10 Nov):** "when you first turn up ... the last wedding party has
  gone horribly well. Mischievious is there, kind of trying to proposition you, and it's just like,
  yeah, don't pay attention to the blood and guts, yeah, it's fine. We've hired a bit of extra
  security. The last wedding went a bit bloody and gory, but it's fine. How are you? Would you like
  to get married? ... casually as you do. This stuff happens around here all the time." The venue
  still a wreck from the last one, and her not in the least bothered.
- **Start from a theme, then tune it (10 Nov):** "similar to ... modern AI tooling, so you would ...
  be able to get started with some kind of basic theme, like ... pick a happy, rosy theme, or
  bloody, gory wedding, or just drunkards fest ... choose the location ... in the theme. So that'll
  give you a default furniture set and layout, and then they could start tuning and working from
  there." Pick a venue and a theme; it lays out a starting set (furniture, flowers, colours, guests
  dressed to suit); you change whatever you like from there.
- **And how the wedding goes (10 Nov):** "you've got to have fun with the animations ... you can
  choose kind of how the wedding goes. Is it a sweet, romantic, happy, blissful wedding, or is it
  one where ... the raiders turn up halfway through, or somebody gets drunk, or starts a fist fight
  or a brawl?" You choose the plot of the ceremony too, and the cutscene plays it out. "I want to
  go beyond Puzzle Pirates, add that stuff in, as well as all the furniture and the portraits."
- **A wedding portrait to keep and share (10 Nov):** "they would like a nice screenshot at the end
  of configuring all of this, so they have a nice portrait generated of their wedding. So that
  would need to be probably just saved and published somehow, especially the configuration if they
  spend time doing this." The last shot of the cutscene framed as a portrait to save, and the
  whole set-up (venue, theme, layout, outfits, partner, plot) saved so it isn't lost, and shareable
  (how and where it's published: to pin down; the leaderboard's Worker and D1 could hold it).
- **Keep it small, make it fun (10 Nov):** "don't want to go too crazy with assets and things on
  that, but I do want it to be fun and really show ... I want just a really cheesy animation at the
  end. That would be incredible, even just as a single proof of concept one." A first version
  could be one venue, a couple of themes, one plot, and one gloriously cheesy ending.
- **To pin down with the user:** which venues and themes to offer first, the plots, Mischievious's
  lines and when she says them, the palettes she offers, how the portrait is saved and shared, and
  what it pays. Check YPPedia for Puzzle Pirates' own weddings and wedding clothes first.

## A fashion show (11 Nov, parked: "a bit duplicated for a proof of concept")

"I could certainly imagine having a fashion show or something like that, like certainly based on
how [Mischievious] twirls and goes through her different outfits. Everyone like designs an outfit
or look ... for a certain theme, and they all the contestants twirl through each one for people to
vote on." A theme is set, everyone dresses a look for it in the wardrobe, and the contestants come
down the runway one by one, twirling as Mischievious does through her outfits, for people to vote
on. Built from what's there (the wardrobe, her twirl, the wedding's crowd), which is why it's
parked: too close to the wedding for a proof of concept. One for if people love dressing up.

- **And a decorating competition (11 Nov):** "Same kind of idea with a decorating competition.
  Like, that'd definitely be something people go for. Like decorating a house or something." A
  theme, everyone decorates a house for it (the housing district's houses, Gravee's the first, and
  the furniture as modular pieces: RULES.md), then a tour of the entries to vote on. Parked with
  the fashion show, for the same reason; the houses make it nearer to hand.

## Your own little island to decorate (11 Nov)

"I can definitely imagine like the housing idea being extended to like ... having your own little
island and being able to decorate your island and design it. That I imagine people would find
awesome." Like the houses in the housing district (Gravee's the first), but a whole little island
of your own on the sea: its shape, its palms and sand, what stands on it, all placed from the same
modular pieces (furniture, creatures, talking pirates: RULES.md), and kept in this browser as
everything you make your own is. Goes with the decorating competition (above).

## A museum, in Dachimpy's house: how the Blockade Simulator began (11 Nov; first an island)

"I'd love an island that's a museum of the really old school first versions of the blockade
simulator and dachimpy.com." First an island on the sea; now Dachimpy's own house (below, "the museum
is Dachimpy's house"), its exhibits the real thing, oldest first. The user's screenshots are kept in `notes/museum/`
(not deployed), numbered in that order:


**Where it all started: Dlonelyone (11 Nov), a "Did you know?":** "She's a pirate that
definitely needs referencing in a museum. You know, this all started when I saw her. I think she
was like teaching somebody how to use a ship or a sloop or something for the first time." The user
wished they could do the same, but "I'm not quite as extroverted or did not feel confident enough
to do that. So I ended up starting the [Dachimpy].com things ... spawned from ... my preference for
helping people in a more indirect way. But that's the moment that it started." So the museum opens
with her: **Dlonelyone** (a real pirate: name's spelling, portrait and ocean to check on YPPedia
before she's drawn), drawn at a sloop's helm showing a new pirate the ropes, under a "Did you
know?" plaque telling how watching her started it all, and that Dachimpy.com was the quieter way of
doing the same: helping people learn. The user's feelings go on the plaque
(11 Nov: "the emotion should be there ... a relatively light version of it. But yes, with the
emotions."): told lightly, in a line or two, with the wish to do what she did and not quite the
confidence to, and Dachimpy.com as the quieter way of helping that came of it.

**Dachimpy shows you round (11 Nov):** "It very much fits me, kind of just ... showing you around
all the history of the things that I've built. They are my pride and joy." So the museum's guide is
Dachimpy, in their rose pink wig, belt and braces and kilt, walking with you from exhibit to
exhibit as Gravee shows you her house (the same shared piece: a host who walks with you and talks
at each stop), proud of every one, bugs and all.
- **v1, "an insanely basic html page":** the Bnav Guide, a page of plain links. Ship movement;
  winds and rocks; whirlpools (the basics, turning around with one, holding your place in one,
  reaching the other side); shooting and grappling; collisions, same class and different; then
  practice with a health bar: shooting a moving target, a target that fires back, move
  generation, damage and bilge, and "Dalnoth traverses the board" I to III. Its last line plans a
  Survival Game: waves of bot ships, each wave harder, your ship improving as you sink them.
- **"The very first shoot Dalnoth!":** a 9×9 board ringed with rocks, a whirlpool, winds and
  Dalnoth's face on four squares to shoot. Then the first prototype board (a whirlpool, the little
  ship, left/forward/right and Execute Move). Then the **version before Whirled** (2a and 2b),
  after the website's collision-mechanics boards: "I bet people probably don't even recognise it."
  The flat blue board with flags, rocks, whirlpools and winds, and "Your ship" counting lefts,
  forwards and rights, chat beside it, on a multiplayer server whose name the user half remembers
  ("some Fox or something": SmartFoxServer, the user agrees). It tried to be more realistic: its
  "Create new game" had Starting Jobbers and Jobbers per Turn for each team, so you had to fill
  your ship with jobbers. "I remember deciding just to simplify it because it was too
  complicated. Just focus on the ship navigating part." A good line for its caption. The game
  set-up wireframe
  (Admiral and Nav per team, chat, user list); the Blockade Sim lobby (choose your ship, jobber
  level Weak, Normal or Elite, Ready?), its teams and "Create your game" (map, turn time,
  friendly fire); and the finished thing in play, isometric, with the Blockade! move panel.
- **The sloop rotations:** "love the sloop rotations, someone had to do these by hand that I paid
  a tiny bit manually back in the day, poor guy!" Thirty-two hand-drawn sloops, every heading,
  shown turning round on a stand (the source PSD is on the user's own drive).

- **Then Dachimpy.com, through its versions ("the various evolutions"):** the first, a grey page
  with parchment-scroll menus (Home, Stations, Piracy, Crafting, Carousing, Misc) and a Gunning
  guide: wild style, the two-cannon loop, board sitting, central looping. Then the blue site with
  the chimp in the pirate hat on its header and the sloop on the right: Puzzle Guides for every
  puzzle (Piracy, Carousing, Crafting), Applications (the **Blockade Simulator**, "blockade
  practice without the need to gather hundreds of jobbers", and the **Distilling Simulator**,
  2010-10-02, "Distilling with control over when columns are burnt", 1,798 views), and its 2010
  updates log ("Blockade simulator is up on whirled!", 13 April 2010, then freeze and sync fixes
  into June). Rumble tips drawn with arrows ("start in the middle and then cut through"); Spades
  tips on side tabs; the Swordfighting guide's videos and the "So you think you can SF?" series
  (Novo vs Antartic, Novo vs Dunny); a teaming-strategy tip sourced from **Tzz** ("Bots tend to
  play like a #1 SFer with a broken space bar ... don't stall. Ever."), who has her own island
  coming; and the 2011 home page with carousels of every puzzle. Shown on the museum's walls as
  framed pages (the shared frames), or on an old monitor you can click through.
- **The site's own art (kept, 10 and 11 in `notes/museum/`):** the videos' title card (the
  Dachimpy.com logo over the sea, faint jigsaw pieces across it, a little ship sailing in the top
  corner) and the header banner (the chimp in his blue pirate hat, a dashed treasure-map trail to
  an X, the cliffs, the sloop on its green ring). The title card could play when you step in, or
  on the old monitor; the banner over the museum's door.
- **Privacy:** some of those pages show the user's real name, an e-mail and a forum handle. The
  museum shows only the pirate name Dachimpy: crop or redraw those parts, never put them in.

**Pictures and the story, no gameplay (11 Nov):** "No need for gameplay, just pictures and
telling the story." The exhibits are the pictures on the walls, in order, each with a few lines of
its story, and the museum walks you through it:
- how it began as a plain HTML guide, then the boards, then Flash and the lobby, then live on
  Whirled (13 April 2010);
- the sad part: "Flash got deprecated and Whirled was taken down", and the sim went with them;
- then **Imaduck's version**, the **Global Cade Sim** (globalcadesim.com, still running: "I think
  it's imaduck"; his pirate name's spelling to check), shown as the Blockade Simulator's evolution. It works perfectly, which is the joke: "It didn't
  have quite the same charm as mine ... there was always a fun gamble that ... your ship might
  randomly spin and jump into the rocks on mine ... the bugs are what made it, kept it
  interesting. They gave it the character. His version just works perfectly. Like, where's the
  fun in that?" So the museum is fond of the bugs: the caption for the old sim boasts of them,
  maybe a little sloop by the exhibit that now and then spins and hops into the rocks, and the
  caption for the newer one says, deadpan, that it works perfectly.

**A tribute, and a thank-you (11 Nov):** "there should be some tribute to the people, friends
and relationships I've had from PP and a thank-you to all the people who make it such an awesome
place. Plus my cuddly monkeys, Mini in particular." The museum's last room: the friends drawn from
their portraits (pirate names only), the ones already in the den among them (Dalnoth, Dignity,
Mischievious, Kikkit, Gravee, Tzz, Daquan, Mems), and a thank-you to everyone who makes Puzzle
Pirates what it is. And the user's cuddly monkeys, **Mini** above all, in pride of place (what Mini
looks like, from a photo, to pin down with the user). Kept warm, not soppy, the den's humour still
there.

**The tribute moves home, to Dachimpy's house (11 Nov):** "for my tribute to my friends, I think
I need for in my house, yeah, just my trinkets and portraits. That's probably the best thing.
Obviously, reference for the real monkeys and stuff like that, maybe. But yeah, all my trinkets,
and my beloved friends, and certainly the special, really special, truly special ones. So [Kikkit]
and [her], they absolutely need their special references." So the tribute isn't the museum's
last room but Dachimpy's own house in the housing district (one more house, like Gravee's): the
trinkets on shelves and tables (the real ones, from Dachimpy's pirate page's trophies and trinkets on
YPPedia, each a shared furniture piece), their friends' portraits on the walls (the portraits piece,
from their looks), and the truly special ones given pride of place with something of their own
that refers to them: **Kikkit**, and **Zizzy**, her most recent pirate, on the Meridian Ocean
("I really can't remember at times": she had others before; the game uses pirate names only, so
Zizzy; her portrait to check on YPPedia (Meridian) before she's drawn). The real
cuddly monkeys, Mini above all, from the user's photos. The museum keeps the story of the sims;
the house keeps the people.
**And Sanne (13 Nov):** "Sanne needs to be in the truly special board as well." So Sanne beside Kikkit and Zizzy in
pride of place (a real pirate, pirate name only; she, from her portraits below).
**Dachimpy's pirate pages and portraits, both oceans (checked 13 Nov, at the user's asking: "Check my profile on
Meridian ... Also check all my portraits for connections to other friends on both oceans"):**
- **Emerald:** Senior Officer and Bait of the crew **Reverie**, of the flag Crash Out; Captain in the Admiral Island
  Navy. Its gallery, 11 portraits, with: **Kikkit** (four, every Valentine's Day 2008 to 2010: "For love of sex and
  cookies" with Alkazzar and Jennielise; "United in cookies, marriage too"; "Swan Molestation", "That swan never saw
  what was coming"; "Cursed & Cookied", hers), Milleh ("Happy bday mille", 2007), Scabard's group (Fordenis, Scabard,
  **Daquan**, 2008), **Gravee** ("Oh, Gawd!", on her vessel Familiar Plaice, 2025), Demonologist and Hielo ("One of us,
  one of us, one of us!", 2025); and Dachimpy alone ("The monkey man", 2007; two more). One 2008 sitting was at The
  Mausoleum "under the fine governance of Dalnoth".
- **Meridian:** Captain of the crew Swinging Pink Bananas, Lord of the flag Necessary Roughness, Admiral in the Kirin
  Island Navy; familiars Arthur and Fable. Its gallery, 16 portraits, with: **Sanne** ("Monkey Couple", 5 Jan 2007,
  the two in matching red on a beach, each with a monkey on the shoulder; "I love you babae", hers, Valentine's 2007,
  she crowned with a sceptre and a monkey, he in a green kilt holding a deed: "yup i got the deed to her heart <3"),
  **Zizzy** ("Pinky and the pink", 2012, as Dachimpy-East: her long pink hair and pink gown; and "Dachimpy-East's group"
  at Zizzy's Villa with Gibbs, Angelforyou and Wasabia), Adicia (three, 2006), Huppel (two, 2006: "the chef ... don't
  miss his Elite brig pilages"), Peppyredhair, Nikogold, Anchovia, Kookiez ("Dachimpy and his sweet kookiez"), Melilea,
  Tera and Zionng ("Sexy Treats"), and Fable ("Welcome Back Dachimpy!", June 2025).
- **The pink wig and kilt** are Dachimpy's on Meridian since 2007 (the pink beehive in "Peppy and her Monkey",
  "Anchy's HAWT pink moment", "Pinky and the pink"), a kilt in "I love you babae". And on Emerald "Reverie" is the crew
  (the user's "Who in Reverie could be" the race commentator).
- **Sanne's look** (Meridian portraits): fair skin, blonde hair tied back, a monkey on her shoulder; matching red
  (shirt, trousers, a gold buckle, white boots) in "Monkey Couple"; a gold crown and sceptre, green and black, in
  "I love you babae". **Zizzy's:** fair skin, long pink hair, a pink off-shoulder gown.

**Cookies and hugs at the door; the house doubles as the museum (11 Nov):** "a random thing about
myself as well is I'm very well known for giving just like hugs and cookies ... anyone that comes
into my house, which I guess you can double up as a museum, I need to give them cookies." So
Dachimpy's house and the museum may be one place: the house in the housing district, its rooms the
museum's exhibits (the sims' story, oldest first) and the tribute (the trinkets, the friends' portraits,
Kikkit, Zizzy, Mini), Dachimpy showing you round all of it. Whoever comes in is met at the door
with a hug and a cookie, every visit, as Dachimpy did in Puzzle Pirates; the cookie maybe yours to
keep (in your hold or on a shelf at home).
**Settled (11 Nov): the museum is Dachimpy's house.** "I think an island is maybe a bit of overkill
for the museum thing. So yeah, maybe it could just be my own house ... a museum thing ... showing
off some beloved memories and things like that could be a generic enough thing." So no museum
island: the museum is Dachimpy's house in the housing district, the sims' story and the tribute its
rooms. And showing off beloved memories is a piece of its own, not Dachimpy's code: exhibits (a
picture, a trinket, a plaque with its story) placed in any house as config, the host walking you
from one to the next and telling each one's story, every exhibit in the 2D viewer too. Gravee's
portraits, Pandayay's trophies and Dachimpy's sims are all that piece.

Still to collect: the user's pictures not saved to disk need putting in `notes/museum/` by hand
(the v1 page, the first shoot-Dalnoth board and the Dachimpy.com pages), and pictures of Imaduck's
Global Cade Sim.

## Helium, and Distilling (11 Nov, from Mischievious)

Mischievious (the real pirate, giving feedback on her wedding): "Wanted to mention helium. He has a
lot of puzzle talents and really loves distilling if there were certain tutorials and such."
**Helium**, a real pirate (portrait and ocean to check on YPPedia before they're drawn; then into
PIRATES and the wardrobe), as the one who teaches a puzzle, Distilling above all: a still on an
island of theirs, or a corner of the den, where they show you how it's done and play it with you.
Distilling would be a new puzzle module of its own (rules in `src/`, knowing nothing of where it's
played), as every puzzle is. It goes with the museum's Distilling Simulator (the user's own, "with
control over when columns are burnt"), and with smuggling's cheap rum, made yourself. The user
(11 Nov): "that's more of an idea thing ... whenever you get to distilling or something
somewhere": no hurry; Helium comes in whenever Distilling does.

**A hidden Easter egg, a secret still (11 Nov):** "Maybe the helium thing can be a bit more of a
hidden Easter egg where you have to explore the houses ... Maybe he's not running a distillery
shop. Maybe he's got a secret distillery operation going. If you find his house, he ... teaches
you how to make some rum. But he's very kind of by the by, and that leads into some of the
smuggling things where you can smuggle the rum to the other island or some side mission." So
Helium's is one of the houses in the housing district (the doorway in the den's cliff), with
nothing to say it's special: inside, a secret still (hidden behind something, found by poking
about). They're offhand about it, and teach you Distilling as if it were nothing, and the rum you make
is the start of smuggling (below: taxes, embargoes and the back beaches), run to another island as
a side mission. Hidden, never hinted (RULES.md).

**The mishap (11 Nov):** "just for the comedic layer ... occasionally, distilleries have been
known to blow up. So I'm guessing when you sneak in and he starts showing you, you can have a bit
of a mishap. So, oops, that happened sometimes. Don't worry about it." As he shows you round, the
still goes up with a bang (soot, a hat blown off, bits of copper raining down) and Helium, unfazed,
waves it off: "Oops. That happens sometimes. Don't worry about it." Then carries on teaching you as
if nothing had. The humour's a layer on the real thing (RULES.md): it could even be what a burnt
Distilling board looks like (the user's own Distilling Simulator was all about when columns get
burnt), so a botched batch in the puzzle gets a little bang of its own.

**Their look, from their portrait (checked 12 Nov):** Helium of Emerald (Senior Officer of a rum-making
crew, Revered at Distilling and Ultimate on the ocean, distilleries on five islands, a tailoring stall
beside Mischievious's; familiars King, plum, and Serendipity, light blue). Their portrait: dark skin, white
hair swept up, the Feminine feline in black (a black eye mask with cat's ears), an eyepatch, a gold hoop
earring, a blue starfish on the cheek, a black Vampire raiment (high collar, gold buttons, lined in gold),
black pants, black fancy boots with plum tops, a hook for the left hand, King the plum (soft violet)
monkey on the shoulder, and a glowing blue jar in the right hand (not in the wardrobe, left out); a night
palace and a treasure hoard behind. In PIRATES and the wardrobe as that look. (The portrait's figure is a
woman's, and the page says "Lady of the flag": drawn as a woman, called "they" in the den's words, 13 Nov.)

**An island of his own instead (12 Nov):** "I think I've changed my mind on it. Him being in a hidden
house, maybe he can just have his own little island. That just seems to be the theme somewhere. Maybe
that can link into where the Smuggle Beach is. I don't know. I bet he just wants an island for him
somewhere." So Helium's still is on a little island of theirs (a place of its own in the code, as every
island is), perhaps near the smugglers' beach, where their rum would go out. Whether it's hidden like the
house would have been: to pin down with the user. **Their mishaps (12 Nov):** "the kind of exploding kind
of mishaps that I mentioned with the distilling, where he kind of gets the balance wrong."

**The penguin in the balaclava leads you there: a smuggling ring (12 Nov).** "I feel like we've got to
actually link in these things ... it fits to me that she kind of rambles about crazy things, but often turn
out to be true. So when she says the penguin in the balaclava was up to something, maybe he's the one that
can tell you about, hey ... don't tell anybody, you know, we're in a secret smuggling ring, and he tells you
how to find the distilling island. Yeah, if you could bring us rum. We can show you how to sneak past the
customs in the Imperial Outpost kind of thing. He's a shifty penguin. [Kikkit] was right." So the places
link up into one thread:
- **Vegas Island:** the penguin in the balaclava, caught with his sack, is in a secret smuggling ring, as
  Kikkit always said ("up to something, he was. You can always tell"). Shifty, sworn to secrecy, telling
  you anyway. Another of her rambles turning out true.
- **His offer:** bring the ring rum, and they'll show you how to sneak past the customs at Port Decorum,
  the imperial outpost (the way through the smugglers' beach, the back way into a port shut to pirates).
- **Where the rum comes from:** he tells you how to find Helium's island, the distilling island. Helium
  teaches you Distilling; the rum you distil goes back to the ring.
- **So Kikkit leads to the penguin, the penguin to Helium, Helium's rum to the smugglers' beach and past
  the customs into Port Decorum,** and smuggling becomes one of the den's ways of earning (below, under
  Primates Rule). His lines go in `src/lines/penguin.ts`, Kikkit's knowing "told you so" in hers.
  (To shape with the user: what sneaking past the customs is as play, and what the ring gives you.)

**The characters talk about each other (12 Nov):** "I really would love the idea of things being
interconnected, like Helium saying ... I have a large shipment of rum for one of Mischievious's weddings, or
Kikkit's been at the stash again. Those kind of interlinked things with the personalities". So Helium's
lines point at the others: a big order of rum for Mischievious's next wedding (she does keep getting
married), Kikkit at their stash again (which explains a lot about her directions), the smuggling ring's
penguin waiting on their barrels. And the same the other way: a guest at a wedding toasting with Helium's
rum, Kikkit swearing she only had a little. Each one in character, the joke true to who they are, and
each a line in `src/lines/` (STORY.md, "The characters know each other").

**Helium's opening scene: the still blows up, and no eyebrows (12 Nov):** "the first time you come across
Helium's Island, I feel like the good opening scene, you know, has to be the distillery exploding and Helium
just treating it as kind of a casual everyday event, just like, oh, sorry, just a little distilling mishap.
It's like, oh, would you like me to teach you some distilling or something? And I guess your pirate's face
could just kind of look very tense, just like, is it safe? ... of course it's safe. What would make you think
it's not safe? This is perfectly normal. It's fine." And: "they just obviously would need to make the joke of
you've got no eyebrows left, and they can make the joke back ... none of us have got eyebrows. It's, you know,
... I keep asking the developers for some, but I've not gotten them yet. Also the implication that you could
joke that they've been burned off by the explosions, but, you know, actually we just don't. None of us have got
any. Double check that joke. I'm pretty sure it's true." So the first visit: the bang, soot and copper; Helium
unfazed, offering a lesson; your pirate tense ("is it safe?"); "Of course it's safe. What would make you think
it's not?"; your pirate on their missing eyebrows, burned off surely; and them: none of us have any, they keep asking
the developers. Then the lesson. (Given to the Helium pass, 12 Nov.) **The joke's fact, to check:** that no
pirate in Puzzle Pirates has eyebrows; a web search (12 Nov) found nothing either way, so it's to be checked on
real portraits before the line goes in as fact.

**Helium goes over your session with you: a replay, and "where did we go wrong?" (12 Nov):** "as well as
like getting help in the moment, is if you can have a replay of your puzzling session, and he can kind of
give you hints, if you can ask him for hints during the replay of, well, what do you think, where do you
think we went wrong? And it could say stuff like, well, at the start ... compared to the CC12, you know, you
were making a lot of moves to get things over to the right, and you started using X technique a bit too
early." And: "it should have some concept of ... splitting really in ... lots of phases to it, and when you
kind of move into using different techniques associated with that phase, it should be able to like judge
and be like ... you did a good timing in this phase, but you went into this mode and started like crawling
or doing these techniques too early."
- **Help in the moment, and afterwards:** as well as a hint while you play (the bots' `advise`), your whole
  session is kept, and you can play it back with Helium beside you and ask them at any point what they think.
- **Phases, read from your board:** he splits the session into its phases (the opening sweep, carrying colour
  over, turning the right side, the late scarce-colour techniques; DISTILLING.md §3 and its seventh note) by
  what was on the board, not by the clock, and says which technique you were using in each.
- **Judged against a good player:** for each phase, how many moves you spent per piece of junk got over,
  against what the best bot (a CC^12 run) would spend on the same board; and whether you switched technique
  at the right time: "good timing in this phase", or "you started crawling too early, while half the board
  was still colour, and a quick sweep would have done".
- **In his voice:** offhand, as he teaches everything (his lines in `src/lines/`), never a lecture.
- **What it builds on:** the bots' techniques, each recognised by name and ranked by how move-efficient it
  is, and their idea of the stage the board's at (the Distilling pass running now, 12 Nov); a session
  recorded move by move, as the race's replays are (`race-replay.ts`); and the replays-down-to-the-puzzling
  idea further down. The bots could judge their own sessions the same way, a check that the coach is right.

## Every house means something: visiting gives you things to go and do (11 Nov)

The user (11 Nov): "Obviously, each house needs a meaning, so maybe visiting them can give you some
things to go and do that give you trophies or something." So no house is only a look round: each
is about its owner (Gravee's portraits and the Count; Pandayay's trophies and Vikings; Dachimpy's
sims and friends) and sends you off with something to do because of it, done out in the world and
rewarded with a trophy (or a portrait, a cookie, a thing for your shelf at home). Gravee might send
you to find her a yeti for her "proof"; Pandayay to try a first of each thing (her "spread your
adventures far"); Multibella to forage with fewer moves. The trophies could be the den's own entry
trophies (Pandayay's house, below), kept in this browser, shown at home. How trophies work, and
each house's errand: to settle with the user.

## Pandayay's house: her trophies, and her love of Vikings (11 Nov)

The user (11 Nov): "Pandayay is sounding very cute, she can have a house where she shows you her
trophy collection and love of vikings." **Pandayay**, a real pirate (pirate name only; her ocean,
pirate page, trophies and portrait to check before she's drawn, then into PIRATES and the
wardrobe). In her own words (to the user, 11 Nov): "they are sentimental trophies for me, as back
then I was a very nervous little navver who went from only bnavving in the navy or if another
officer was on my ship, to hosting Vikings/IO's, to hosting BK's, to being confident to host lots
of things! So I love vikings and IO's."

So a house in the housing district (one more entry in HOUSES, its own scene), where Pandayay shows
you round her trophy collection, walking with you (the shared host piece, as Gravee does), and
each trophy is a step in her story: the nervous navver who'd only battle-navigate with another
officer aboard, then hosting Vikings and IOs, then BKs, then hosting anything. Told lightly, with
the feeling in it (as Dlonelyone's plaque is): the trophies are sentimental, not boasts. Her love
of Vikings is the house's theme (what's on its walls, what she's wearing, maybe a longship). The
same thread as the museum's: helping and leading people, and growing into it.
- **To check on YPPedia before it's built:** what Vikings, IOs and BKs are in Puzzle Pirates (the
  events she hosted; names as she wrote them, not guessed), her real trophies (her pirate page's
  trophy collection), and her portrait.
- **Her advice: spread your adventures far (11 Nov).** Pandayay, in a chat the user shared, to
  another pirate after more trophies: "You can also spread your adventures far to get a lot of the
  entry trophies, 1/25 lair frays, 1/25 wolf frays, early flotilla sink trophies (people will job
  any THer to help get some poe), first couple of CI frays/forage, entry KH." And: "I can also
  recommend a lot of trophies people put off that will get you thru ranks, such as IO's, Vikings,
  forage/TH expeditions." Her voice in the house: encouraging, telling you to try a bit of
  everything, since the first trophy of each kind is within anyone's reach. Maybe the den has its
  own entry trophies too, a first one for trying each thing (a puzzle, a place), shown on a shelf
  at home, with Pandayay the one who tells you about them (to settle with the user; the names
  above, frays, CI, KH, to check on YPPedia before any are used).
- Each trophy as a shared furniture piece; her lines in src/lines/; the house's pictures in the
  2D viewer too (TODO.md, "A 2D view of the portraits").

- **Her Vikings bring you back to the den, and Dalnoth is the Vikings (11 Nov).** "the Vikings and
  the [IOs] would actually be quite a good reason ... to be back at the Den ... that's the Viking
  attack, isn't it? ... they come and attack your den ... [Dalnoth] is the Viking raids. So ... when
  you go find their house, you can spawn more Viking raids ... [Dalnoth] can just be the Vikings.
  Like, we could drop any, like, bigger role for him ... stick to this kind of smaller
  self-contained thing." YPPedia, "Viking raid" (checked 11 Nov): an expedition, from a map bought
  at an explorers' hall or won from a chart box, to a tiny outpost island; the crew mans the shore
  fortifications' guns (Gunnery: "Each cannon fired adds damage blocks to the vikings' puzzles")
  while the longships come in, then "the vikings will descend upon the island, starting either a
  swordfight or rumble"; win it and it pays out. Sizes small (1 longship, 5-11 Vikings) to huge
  (8-9 longships, up to 260). Which is the den already: its gun tower, its wall, its Swordfight.
  So the den's raiders become Vikings, led by Dalnoth (already in his Viking helmet), and
  Pandayay, who loves hosting them, is how you call a raid on: visit her and she sends Vikings at
  your den, any size you dare, a reason to go home and defend it (STORY.md step 8 already has
  "raids that come ... when you ring the bell"). Dalnoth stays this small, self-contained thing,
  the Vikings' chief, rather than a bigger story of his own.
  **Settled (11 Nov): Viking-themed, faithful to the mechanic.** "just keep it as Viking themed. I
  just don't think we've naturally gotten to a reason to go attack him like that. I'm sure that can
  evolve naturally from something else as a mechanic, but I'm going with faithful depiction of
  mechanics, and Vikings seem a good fit for him." So Dalnoth's raids on the den are Viking raids, as
  YPPedia has them (the guns while the longships come in, then the fray), and going after him
  (STORY.md steps 6 and 7, his treasure, his return) waits until a reason grows out of something
  else. IOs: what they
  are in Puzzle Pirates, to check on YPPedia.
- **A double act with Multibella (11 Nov).** The user: "Multibella is very sweet as well, maybe
  they can do a duo act." **Multibella**, a real pirate (pirate name only; ocean, pirate page and
  portrait to check before they're drawn), in the same chat: "Foraging is mostly about using less
  moves", and to someone finding it hard, "I can probably show you some foraging sometime to learn
  from if you want?" and "You got this!" So Pandayay and Multibella together, both encouraging:
  Pandayay with her trophies and Vikings, Multibella the one who'll show you Foraging (the den's
  Foraging puzzle is already its own module), kind and practical ("using less moves"). Where they
  meet you, to settle with the user.
  **Neither is the sidekick (11 Nov):** "I don't want [Multibella] to be like the secondary character
  though. Like having it be [Pandayay]'s house seems mean." So the double act isn't a guest in
  Pandayay's house: they're equals, in a place that's both of theirs (a house they share, or a house
  each with the double act in both), each with their own thing to show you and their own errand.
  **Settled (11 Nov): one mechanic, trophies, split between them.** "the pull that was bringing them
  together was one mechanic ... for proof of concept, these are trophies ... one shows you the
  collection ... [Multibella] being the more helpful one that's got [their] little island somewhere
  that teaches ... helps you get your own trophy." So: **Pandayay's house** shows you her trophy
  collection, each one a step in her story (the exhibits piece). **Multibella's little island**,
  somewhere on the sea, is where they teach you and help you earn a trophy of your own (Foraging
  first: "mostly about using less moves", on the den's Foraging module), kept and shown at home.
  The two halves of trophies, each theirs: seeing what they mean, and getting your own. The den's
  trophies (what earns one, where they're kept) are the proof of concept, to work out when it's built.


## Roobear's little house: Robert the kangaroo bear that roobs ears (12 Nov)

**Built, 13 Nov: the small house only** (RULES.md, "Roobear's house, her ROOm"; `den.html?at=roobear`): her
ROOm (a sign, and her hello), Robert roobing your ear as the welcome and whenever you ask, the gallery of
guesses with her line on whose each was, her answer the biggest frame; her in PIRATES from the description
below. **Still open:** her look checked side by side against her real portrait (her skin and feet are
guesses; the crow's colour too); something to send you off with (the house has no quest or keepsake yet);
whether Dignity says her own guess somewhere (for now Roobear credits it); a line between her and Gravee
the other way (Gravee on her lodger); and whether the crow is Bliss.

The user (12 Nov): "This absolutely needs to be a memory later, she needs her little house in the game."
**Roobear** (she; a real pirate, pirate name only; her pirate page and portrait to check before she's
drawn, then into PIRATES and the wardrobe). From a chat the user shared: they were guessing what her name
stands for, "a french sounding Robert, roo like kangaroo plus a bear, or did someone roob an ear?" (they
asked Dignity too), and Roobear answered: "I could be Robert the kangaroo bear that roobs ears ... I like
it." Dignity's guess: "or from winne the pooh - Roo was baby kanga and bear was winner? Yes abstract I
know." The user: "That's who I was thinking of when I thought Roo + Bear XD." (A line for Dignity, then, if she's in the house's story; the books' characters themselves stay out
of the den.)

So a little house of her own in the housing district (one more entry in HOUSES, its own scene, Roobear
walking you round as Gravee does), its theme her name's story: Robert the kangaroo bear, half kangaroo and half bear,
who rubs ears. Maybe he's there, a familiar or a plush on her shelf, and an ear rub is the house's
welcome. Like every house, it should send you off with something to do (the section above). What that is,
and how the name's joke is told without explaining it to death: to settle with the user. A small,
warm one, the memory of a funny moment between friends kept in the den.
- **A gallery of the guesses (the user, 12 Nov):** "I don't know if you can put that in portraits where
  you've got all the interpretations of the guesses of her name. Or is she the Roobear that roobs ears?
  You need that." So her walls hold a portrait for each guess, framed like Gravee's (portraits.js), each
  painted of her in her own look:
  - **Robert:** a French Robert, very much a monsieur.
  - **Roo + bear:** half kangaroo, half bear.
  - **Did someone roob an ear?:** the scene of the crime, an ear being rubbed.
  - **Roo and bear from the books (Dignity's guess):** a baby kangaroo and a bear, drawn as our own and
    never the books' characters.
  - **The answer, her own:** Robert the kangaroo bear that roobs ears, the biggest frame, the one you
    "need". Roobear herself as him, or with him.
  She tells you which guess was whose as you walk past each one. Every portrait keeps her real look
  (below).
- **Her pirate page, checked (12 Nov):** Roobear is on the Emerald Ocean
  (https://emerald.puzzlepirates.com/yoweb/pirate.wm?target=Roobear). Captain (and Prisoner) of the crew
  Tea Time, of the flag Do Not Reply, a Lieutenant Commander in the Admiral Island Navy; a Grand-Master
  Forager, a Master at Sailing and Bilging; trophies like Ultimate Forager and Heroic Hauler; nineteen
  familiars (Bliss, Primrose, Cotton Candy, Sir Hiss, Rafiki among them). **She rooms at Bedside Manors,
  Gravee's manor**, so her little house could be her room there, a door off Gravee's tour, rather than a
  house of its own. The user first chose a room at the manor, then changed their mind (12 Nov): **a house of her own**,
  "It needs to be close to Puzzle Pirates. Like, people have their own house, even if it's ... bigger or
  smaller ... that's the point. You should ... go visit those different pirates." So a house of her own in
  the housing district, one more entry on its list, small or grand as suits her. (Rooming at Gravee's
  could still be a line between them: Gravee mentions her lodger, or Roobear her landlady.)
  When the user told her they were giving her "a room in my game", Roobear: "a ROOm you mean? xD". A line
  for her at the door, or a plaque over it: it's a house, but she'll call it her ROOm.
  - **Her portrait:** not all in black but **deep purple**; only her hair is black. Glossy black hair
    pinned up with loose curls by the ears, crowned with a wreath of dark purple roses with gold leaves; a
    gold hoop earring, no eyepatch, a small friendly smile. A strapless deep purple corset bodice, a dark
    purple ruffled cuff on her upper arm, deep purple fitted trousers ending in ruffled flares below the
    knee. A silver hook for her left hand; in her right, a blue-and-white lace china bowl heaped with
    blueberries. On her shoulder a pale periwinkle crow (perhaps Bliss, periwinkle in her list: a guess).
    Behind her, a pink sky over a violet, sparkling sea. Portrait image:
    http://emerald.puzzlepirates.com/media/emerald/portraits/716/1d03d832a5428adc3b3d276dc5656.jpg
## Puzzles you can size up, and play by keys (11 Nov)

From the same chat the user shared: a pirate whose mouse aim isn't steady said Puzzle Pirates'
update letting you resize the puzzles "was such a blessing ... my stats became better almost
instantly", and Multibella suggested keyboarding Foraging where timing doesn't matter. So every
board in the den could be made bigger (a size you choose, kept in this browser) and played fully by
keys, with no mouse-only puzzle. Worth checking each puzzle against (to settle with the user).

## Placing creatures: choose what they get up to (11 Nov)

"when you're placing ... familiars and pets in scenes, like, you should have options for, like,
what animation they're doing ... do you want the parrot to be jumping up and down? Do you want it
should have some ability to, like, fly between two points instead? Or get up to some mischief."
Each placed creature (js/den/creatures.js) gets a behaviour picked by name, the same set for every
creature where it makes sense: hop in place, fly between two points, wander, perch, sleep, and
some mischief (pinching things, chasing the others, stealing a hat). The same for a placed pirate's
idle animation (js/den/props-people.js). For when places are decorated and dressed by players.

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
- **Gravee leads you there (10 Nov):** "I think we need Gravee, she's a sweety. She can be involved
  in leading you to the vampire lair." Gravee, a real pirate (pirate name only; check her pirate
  page and portrait before drawing her, and every piece she wears goes in the wardrobe), a sweet
  guide to the lair: the gentle one who brings you to the coffins. Her familiar, if she has one,
  a character in the scene too.
  **A big portrait collector (10 Nov):** "that needs to be worked into it, you can see she has like
  seven pages of them" (her gallery: https://emerald.puzzlepirates.com/yoweb/gallery/index.wm?pirate=Gravee).
  Look through it before drawing her. All agreed by the user (10 Nov: "Absolutely, all of those
  are absolutely her"): portraits of her lining the walls on the way down to the lair, one of them
  the vampire's, whose eyes follow you (a warning before he sits up); once you've nailed him back
  in, she sits you for a portrait of your own, for her collection, as your reward; and she's far
  more excited about adding you to her collection than worried about the vampire.
  **The endless gallery (10 Nov):** you see your pirate and Gravee walking down past them, on and on:
  "oh, it's just past my portraits", then "how many portraits? We've been walking quite a long
  way. Just got to go through this giant gallery." A running gag, and a long walk of frames.
  Never tedious (10 Nov): "you wouldn't want to make it too tedious, but eventually you just start
  zooming along": a few steps at walking pace, then the camera whizzes along the rest at speed, frames
  blurring past, to show just how far it goes.
  - **Config-driven:** the gallery is a list of portraits, each a pirate drawn by the pirate maker
    from a look (as the real pirates are), so adding a picture is adding an entry, and it shows off
    that any pirate can be pictured.
  - **Her definitive proof:** among them, a yeti or abominable-snowman-style picture, the blurry
    proof she's so sure of (from her real gallery).
  - **The ending: your portrait, scared to death (10 Nov).** "the end of [Gravee's] thing should
    absolutely be her adding you to her portrait collection when you get scared to death by the
    vampire. She could just be like, 'Oh, that looks like a perfect portrait moment. Just hold
    that pose while I paint.' Then you appear pride of place on her portrait wall." So the
    portrait she paints is of your pirate frozen mid-fright as the vampire sits up (hair on end,
    mouth open, arms flung up), with Gravee delighted, brush already out. Then it hangs pride of
    place in her gallery, the one you walked down, among all the others, your own look drawn by
    the pirate maker in that terrified pose.
- **Her house, in a housing district like old Puzzle Pirates' (11 Nov, refined):** "maybe I want
  to refine that to be more like, you know, old Puzzle Pirates, you have like the areas of houses
  and you have the enter a house stuff and you can choose whose house to go into. And maybe she's
  just one of them. That gives us ... another just proof of concept of modularity. And she can show
  you, be showing you around her house. And the vampires and do the portrait thing. Maybe we don't
  go as far as a vampire game. It's more just about exploring her house and the portrait angle of
  it. And the taking a portrait and a snapshot, because that's fun. It's a nice way of adding other
  friends in later if I just want people to have their own little house and their own scenes."
  So the rapid-Carpentry coffin game (above) waits; first Gravee's house as the first house of a
  district (TODO.md, "Gravee's house").

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
    **Tested (10 Nov):** a test page played it, beside the plain split board. Bots over 30
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
    **Fewer kinds, tested (10 Nov):** the test page let you pick 3 to 7 kinds of piece (Bilge has
    7; 5 is the default now), with the den's look on the boards and her rowing in 3D beside them.
    Bots, 30 games of 80 moves, squares made good by greedy and by looking two moves ahead: 7
    kinds 2.8 and 10.4; 6 kinds 5.7 and 21.2; 5 kinds 15.2 and 40.6; 4 kinds 63.5 and 60.5. At 5,
    looking ahead still pays a lot and careful play goes straight about two thirds of the time,
    and a random player rows in circles a quarter of the time; at 4 the cascades do the playing
    and thinking no longer helps. So 5 is the sweet spot. Still no bot ever gets a Vegas on both
    sides at once.
    **In (10 Nov):** mirror strokes is the den's rowing on the sloop (RULES.md, "Rowing by mirror
    strokes"): the boards either side of the screen and the sea between them, balanced so going
    straight is something to aim for, the side pulling harder turning her toward it. The test page
    is gone; the puzzle's module, its tests and the bots stay.
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

## Gunnery in two styles: Rapportus's loops, Balloffire's free gunning (11 Nov)

Changed (11 Nov): "I think rapportus actually deserves the gunning tutorial one, especially for loops as
he made the original guides. Ball of fire can come in somewhere like free loop gunning." So
**Rapportus** (he; "the original gunning guide guy") is the Gunnery tutor, loops above all. His
YPPedia page (checked 11 Nov) has the spelling: Rapportus, of Hunter (now merged into Emerald), once #1
at Gunnery on four oceans, and the writer of YPPedia's "Top Gunner - Going from Ultimate to #1" guide
(yppedia.puzzlepirates.com/Top_gunner): his loops to come from there. **Balloffire** (she) is "much
better at free loop gunning, but I don't really know how you put that into a tutorial". Then (11 Nov):
"there's no reason it can't be a two-part tutorial. You know, she can demo that there's different
styles ... she's very good at ... the free gunning, and [Rapportus] does the loop gunning demo." So a
two-part Gunnery lesson: two styles, each shown by the pirate who loves it, then you try. The two styles,
as the user put it (11 Nov): loop gunning, arrows making a loop round the cannons so the pieces come
round and go in ("cognitively it's a lot easier"); free gunning, "you're not looking for a loop, you're
just grabbing them and putting them wherever", faster ("you don't have to wait for things to come
around the loop, you just grab them where they are") but harder for most people. "Some people have a
different preference and skill for one or the other." The user's not sure of free gunning's detail:
a video from Balloffire, or someone, before it's built. Where, still
open. His portrait and hers to check before they're drawn. Way off: an idea, not a TODO.

Before that (11 Nov): "Balloffire is definitely down to be the gunning tutor ❤️". **Balloffire**, a
real pirate who has said yes (pirate name only; ocean, pirate page and portrait to check before
they're drawn, then into PIRATES and the wardrobe), teaches Gunnery as Tzz teaches Sailing (RULES.md,
"A pirate showing you a puzzle is the heart of it"): a funny animated scene showing you real
Gunnery moves, then "now you try", on the den's one Gunnery module (the gun tower's and her deck's).
Their own way of showing it, and where you meet them (the gun tower, an island of their own), to
settle with the user. Waits its turn (RULES.md, "Finish one thing at a time").

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

## Browser smoke tests for the 3D side (long term, 11 Nov)

The rules in `src/` have unit tests; the hand-written 3D in `js/den/` (drawing, cameras, animation,
wiring) is only checked by hand in the browser. The user (11 Nov): "It's not really been a problem
yet ... I don't think the complexity is there. We're iterating too fast. [I don't] want to be slowed
down by that stuff, but yeah, certainly there will be, you know, testing pyramid style things, you
need some smoke tests for that sort of stuff. Longer term." So, later, not now: a headless browser
suite (Playwright), its own command beside `npm test`, that loads every ?at= starting point and fails
on a console error, then drives a few key flows through `window.den` (into a house, the gallery, the
2D view, the coffin scare, a whirlpool) and checks what's on screen (one bubble per speaker, say).
The top of the pyramid, kept small.

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

## An imperial island (11 Nov)

"start sketching out even just like, even if it's just an empty island or something where you can't
interact yet, is just some island that's, say, under imperial control. So, you know, I guess you could
naturally run into [Dignity] again there or something. But, you know, to create trading mechanics,
looting mechanics, smuggling mechanics, all that kind of stuff. Just proof of concepts around those
things ... that can certainly be the place for a few more puzzles." First the island, empty (TODO.md);
later, proofs of concept: trading, looting, smuggling (smuggling still needs its own go-ahead), Dignity
met again, more puzzles there.

**Monlizzy, its queen (11 Nov):** "Monlizzy definitely needs to be in. She had a flag named imperial
coalition so she can definitely be the queen of the imperial island." **Monlizzy** (she; a real pirate,
pirate name only; her pirate page, ocean, flag and portrait to check before she's drawn, then into
PIRATES): the queen of Port Decorum, the imperial island. Not thought out yet (the user, 11 Nov): "I don't
really think that they necessarily need to be fully connected up ... [Dignity] is just a guard at the
thing. I don't see a huge need to continue any of that over yet." So no tie to Dignity for now. Her
flag's name, Imperial Coalition, to confirm on YPPedia.

## Affame, the queen of sweetness (11 Nov)

"Need to work affame into it somewhere... I have dubbed her the queen of sweetness so she can have a nice
kind peaceful role somewhere." **Affame** (she; a real pirate, pirate name as the user spelt it, to check
on her pirate page with her ocean and portrait before she's drawn, then into PIRATES): the queen of
sweetness, a kind, peaceful part, where and what still open. (Nearby ideas it might sit with: Dachimpy's
house with its cookies and hugs at the door, the houses that each give you something kind to do.)

## SunnyKira, a fan of the tutorials (11 Nov)

"SunnyKira has been really cute in how excited she was to see me and is clearly a huge fan of the
tutorials so she can go in the ideas list. Just a few ideas below, I think all are free?" Her ideas, as
she sent them: "bilge rigs Ci and De". The user's reading: "CI I think is citadel runs and De for dens?"
Confirmed by her (11 Nov): "ci  cursed isle  and yes  dens". So: Bilge, rigging, Cursed Isles, and dens
(what Cursed Isles are in Puzzle Pirates, from YPPedia, before anything's built). **SunnyKira** (she; a real pirate, pirate name only; her
pirate page and portrait to check before she's drawn, then into PIRATES): her part still open, fitting
someone who loves the tutorials (RULES.md, "A pirate showing you a puzzle is the heart of it").
Then (11 Nov): "she's sublime in rigging. I think that definitely gives her credibility for loving that
puzzle. She's got a nice distinctive look on her portrait as well, so that's always a good thing. We want
to get more distinctive looks in." So she's the natural one to teach Rigging, Puzzle Pirates' other
puzzle at the same station as Sailing (its own module from YPPedia's rules, not built yet; RULES.md
keeps Sailing never called "the rigging", as they're two puzzles). Her portrait to check, and her look
added to PIRATES and the wardrobe from it. And a general aim: more distinctive looks in the den.
**How Rigging would move her, a note for later (11 Nov):** at sea a heavy combo is what rushes her past
guns, whirlpools and winds, sailed or rowed ("it's the combo, heavy combo that gets you through, not
anything specific to either one"). Rigging doesn't fit that as it stands: "rigging's got a lot more
natural small breaks. You're like, you're supposed to do something every 2 or 3 moves. Obviously, you can
do some bigger moves like looping and clearing all of one color, hooking, that kind of thing. But I don't
know, we'll have to obviously think about that and how rigging will fit in as a puzzle." Not pressing:
"not that we necessarily need to worry about adding every single puzzle, we've got enough concepts here."
One way (the user, 11 Nov, thinking of SunnyKira's love of it): "maybe rigging, maybe you could be set up
a bit better, so you get given a board where there's already a, more likely to be, big clears in progress.
But obviously it would need to be balanced with sailing and whatnot." So Rigging dealt with big clears
already half-built on its board (as the den's first wave deals Carpentry fair: RULES.md), so a heavy move
is within reach, tuned to be as quick a way through as a big Sailing chain, no quicker.
(To shape with the user, if Rigging comes: what counts as its heavy move, say a loop or clearing a whole
colour, and what it does for her at sea.)

## Money, and the war frigate as the reason to earn it (11 Nov)

"I don't know if that need, is where we actually start bringing some kind of money in and gives you the
incentive to do the various things to earn money, whether that's fighting the Vikings, the smuggling,
whatever." Primates Rule, out past Port Decorum, as where money starts to matter: something to earn
toward, and the den's ways of earning (fighting off the Vikings, smuggling Helium's rum through the
smugglers' beach, trading at Port Decorum's market) the way there. (To shape with the user: whether you
buy her, crew her or win her, what money is in the den, and what each way of earning pays.)

## Umami teaches you to forage (11 Nov)

"obviously the foraging probably needs to be brought up to the same level as the others of the
tutorial. Like maybe after you free him, you know, Umami can teach you how to forage, because I don't
know, a capybara's good at foraging. I mean, at least this one is. They can teach you, give you a
foraging tutorial." So once he's freed, Umami gives a Foraging lesson as Tzz gives hers for Sailing:
it breaks the puzzle down, shows each idea on the board itself, and lets you work it out (RULES.md,
the lesson principle), good play rather than just legal play, and tested. Played on the one Foraging
(src/foraging.ts, js/den/foraging.js), his board's skin. (To shape with the user: what the lesson's
steps are, where he gives it, at his bank in the lagoon or at the den, and how a capybara shows
things.)

## Bigger ships ride out the winds: a deep-water mechanic (11 Nov, for the future)

"maybe for the future, yeah, that [wind] mechanic, again, can be something that affects small ships like
the sloop, but obviously, I guess, for a bigger war frigate, would they be less affected? So they can
navigate in those kind of waters much more freely. So it's equivalent to a deep water mechanic as well?"
So the winds (and maybe the whirlpools) push a sloop about but barely move a war frigate: rough or
deep water that's a maze in a sloop is open sea in a frigate, and a reason to want the bigger ship
(see "Money, and the war frigate as the reason to earn it"). The rules of a wind already live in
src/den-wind.ts and a whirlpool's in src/den-whirl.ts, so a ship's size (src/ships.ts) would be what
they're told. (To shape with the user: how much less a frigate is moved, whether whirlpools spare her
too or Kikkit's stay a sloop's way only, and whether some shallow waters are a sloop's alone, as
the flip side.)

## Raiding Port Decorum's treasury round the back (11 Nov)

"I wonder if you could maybe sail around the back. And is there some destructible, could be some
destructible point where you essentially, there's some like treasury or something like that, and you
can basically blow it up with guns with the [risk]. So, you know, if you aggravate it, obviously it could
shoot you. And obviously that gives you treasure hauling opportunity, obviously the good source of money
in this game, which allows you to buy the ship." So round Port Decorum's back, a treasury you can shell
with her guns; once you've started on it, the fort fights back (only then: looking round the port stays
safe, RULES.md "Port Decorum is safe to look round"); blow it open and you haul its treasure up (Treasure
Haul, src/treasure-haul.ts and src/den-haul.ts), the den's good source of money, toward buying Primates
Rule (see "Money, and the war frigate as the reason to earn it"). The destructible part is the gun at
sea's module (src/den-turret.ts) as config, or something like it. (To shape with the user: how you get
round the back, given its rocks and the smugglers' beach behind them reached only by way of Kikkit's
whirlpools (TODO, 11 Nov): the treasury beside that cove, or a way round for a bigger ship; how hard the
fort fights back; and what the haul is worth.)

## A sloop race: an S-shaped course, a puzzle shortcut at every bend (11 Nov)

The user: "maybe we've got enough to start some sloop races ... we've got enough mechanics here to make a
little racing course, especially like all the sloop snakes and ladders sort of stuff we talked about."
First thought: four routes, "which one do you want to compete on?" ("probably a bit more Puzzle
Pirate-esque"). Then, wanting it "a bit more tactical": "a winding, snakes and ladders, zigzagging kind of
course, just with a lot of shortcuts, and each shortcut is a different puzzle, and you have to choose either
the long way round, just ... without doing anything, and the long way it potentially involves running past
some cannons ... so there's a risk of having to do a bit of carpentry, but not as much as, say, with a crane
... a zigzagging S-shaped course where you have puzzle-based shortcuts for each one." And "it should be
significant", long enough that the choices matter. It pulls together the racing notes above ("Racing, one
day", "A course like snakes and ladders", "Guns trained on squares", "Quick clears against big combos",
"A puzzling decathlon").

**A first design (to shape with the user):**

```
 START ══ leg 1 ═══════════════════════════╗
          ▲ guns on marked squares           ║ [A] the gun gap (Gunnery)
 ╔══ leg 2 ════════════════════════════════╝
 ║ [B] the headwind gap (rowing)        ◄── a wind down the leg: the snake
 ╚══ leg 3 ════════════════════════════════╗
          ~ ~ whirlpool reef ~ ~             ║ [C] over the whirlpools (Sailing, a Vegas)
 ╔══ leg 4 ════════════════════════════════╝
 ║ [D] the locks through the headland (Bilge)
 ╚══ leg 5 ════════════════════════════════╗
                                             ║ [E] the crane over the neck (Carpentry)
            FINISH ═════════════════════════╝
    (*) the starlit door: a hidden tunnel in the cliffs, leg 2 to leg 5 (Duty Navigation)
```

- **The course:** five legs, back and forth down the page, with a spit of land or reef between each pair.
  The long way sails right round every bend, needs no puzzle and is open to anyone, but it's long, and runs
  past guns trained on marked squares (as at the checkpoint: src/den-checkpoint.ts, src/den-turret.ts).
  Land on one and you're holed: a little deck patch (Carpentry, src/den-patch.ts) before you sail on. "A
  bit of carpentry, but not as much as ... with a crane."
- **The shortcuts (the ladders), one at each bend, each a different puzzle, each cutting the bend off:**
  - **[A] the gun gap (Gunnery):** a turret sits in a narrow gap through the first spit. Load her guns
    (src/gunnery.ts, src/den-guns.ts) and shoot it out, and the gap's open. Miss, and it holes you.
  - **[B] the headwind gap (rowing):** a gap with the wind blowing straight back through it, so no sail
    gets through: row it by mirror strokes (src/mirror-row.ts). Drift and the wind carries you back up
    the leg, the snake, "all the way back to the start and you've got to row back up again".
  - **[C] over the whirlpools (Sailing):** a whirlpool reef across the bend, as at Kikkit's
    (src/den-whirl.ts): only a Vegas carries you over (src/sailing.ts). Less, and they spin you back.
  - **[D] the locks (Bilge):** a canal cut through the headland, two locks up and down, pumped by Bilge
    (src/den-lock.ts), as the canal round the checkpoint.
  - **[E] the crane (Carpentry):** a neck of land to haul her over, the crane built by Carpentry
    (src/carpentry-frame.ts), as up the cliff into the lagoon. The biggest saving, and the most work.
- **The tactics:** each shortcut saves about what a good player takes on its puzzle, so a shortcut only
  pays if that's your puzzle: the race comes down to which puzzles you back yourself on, and how fast and
  well you play them (big combos or quick clears: "Quick clears against big combos"). A good Gunner takes
  [A] and sails round [E]; a good Carpenter does the reverse. Doing all five badly loses to the long way.
- **Who you race:** to start, one rival sloop, a pirate of the den's (Daquan, say, before the pink slips:
  "Racing him for pink slips", above), taking a set route at a set pace, and your best time to beat. PvP
  later ("Solo for now").
- **Its own place:** an island of its own in the code (its course in src/, its 3D in js/den/, its lines in
  src/lines/), reached by a starting buoy off one of the islands, with its own `?at=` link to the start.
  Ends where it started, so the den's sea is left as it is.

**The starlit door: Duty Navigation finds the secret passage (11 Nov).** The user, of the Navigation duty
puzzle finding hidden routes: "I don't like the idea of like how exactly you're going to look at the sky to
see this route ... how would you actually reveal that mechanic? ... the only thing that comes to mind is in
[The Fellowship of the Ring] ... going into the mines of Moria, and he's ... doing the thing to reveal the
door by starlight. Can we do a similar kind of thing and use duty navigation as the puzzle for how you find
the door and have it discoverable in some way similar to the carpentry spots?"
- **The real puzzle (YPPedia, "Navigation", checked 11 Nov):** a round board of three rings, eight places
  round each (up, down, left, right and the diagonals). Stars fall in from outside toward the middle; you
  pick a ring and turn it (and its stars) clockwise or anticlockwise, and a star with nothing under it
  falls inward. Three or more of a colour in a line, out from the middle or round a ring, vanish. The aim
  is a **constellation**: stars of the right colours in the marked places, which then vanish and score.
  Dropping a star onto a full outer ring is a booch: the ship turns around. Keys: left and right turn the
  ring, up and down change ring, Space drops.
- **The door:** a stretch of plain cliff along the course with, for anyone looking closely, faint marks
  in the rock (found as the crane's ledge is: noticed, never pointed out; "Hidden gems, never hinted").
  Stop beside it under the night sky, and the Navigation board is the sky: each constellation you complete
  lights up its stars on the rock, and once they're all lit the outline of a door glows and swings open.
  A booch sends her about, away from the cliff. Inside, a tunnel through the cliffs comes out on a later
  leg: the biggest ladder on the course, for whoever finds it and can navigate. (Ours, not the film's: no
  words to speak, no elvish, just the stars.)
- **New work:** the one puzzle the den doesn't have yet, so it gets a module of its own (src/, knowing
  nothing of the den, with bots like Sailing's), and could find other hidden ways later (the smugglers'
  beach, Port Decorum's treasury).

**The evil constellation, somewhere else in the world (11 Nov):** built first as the starlit door's last
constellation, then taken off it to keep the race competitive: "Maybe save the evil [constellation] idea for
somewhere else in the world, then put that on the ideas list." The user's own design, made with Umami in mind
("what would be a really evil thing for Umami ... to have to contend with?"): a constellation that can only be
filled by a combo, which never matters in Duty Navigation as it's played. Found building it: three, four or
five of a colour side by side on the inner ring can still be made a star at a time (two, a gap, two, the last
into the gap), so it takes six, the last two landing together (the ring above turned so two slide over the
two gaps at once). Kept in the puzzle's module, ready for anywhere (src/navigation.ts: `given` constellations,
`bottomRow`, `needsCombo`; the bots' EVIL=1 in tools/nav-bots.mjs: with five colours the planner filled it in
6 goes of 40, with four 16 of 40, about 270 moves). Somewhere a long, deliberate challenge fits, not a race:
a vault, a treasure's lock, a navigator's trial. Credit Umami in the changelog when it lands ("we should
definitely credit that Umami ... I was just thinking of the change log being funny").

**Balancing from what players do (11 Nov, for a full competitive version):** "Once we got to a full competitive
version, if we got to that far, we would start recording times people took through different routes and
puzzle times, and ... collect data for ... balancing ... I think they do it in like Age of Empires, don't
they, where it's like ... percentage of people winning by ... going this certain route." So a race would log
each run: the route taken (which shortcuts, which snakes), the time on each puzzle and each leg, and the
finish, kept by the leaderboard's worker (worker/index.js, D1) as the Carpentry primer's scores are. Then
how often each route wins, and what each shortcut really saves at each skill, to tune the course by (not
auto-balancing, data for the user to balance by). Only with players' runs, anonymous, by pirate name at
most. **Replays, down to the puzzling, and watching a race (11 Nov):** "the full version, you'd have ...
replays, and ... that would go down to the detail of the actual puzzling, because that's kind of what you're
watching and part of the whole point of the race. It's also what makes this so fantastic. It would be so
fantastic to watch. You could see everybody puzzling and racing." So a replay shows the sea and every
sloop on it, and beside each one the board they're playing, move by move: the Vegas being built at the
whirlpools, the panicked dash past the guns. Cheap to keep, as the puzzles are dealt from a seed: a run is
its seeds and its moves with their times, played back through the same puzzle modules. And watched live,
a race to spectate: the sea, and each racer's board.

**Shooting each other: Gunnery's other use in a race (11 Nov):** "one of the advantages of [gunnery] as well
is that you can disrupt somebody trying to do the sailing Vegas or something ... by shooting them. So yeah
... I forgot there's going to be those competitive elements to this." So her guns, loaded by Gunnery, aren't
only for knocking out the gun gap: a rival sitting still to build a Vegas at the whirlpools or the tunnel is
a sitting duck for you, holed and patching while you sail on (as "Dodging, and what a hit does" above has
it: dazed, never knocked out). And the other way round: build your big combo where nobody can get a shot
at you. First against the rival sloop (it could fire on you too), then players against each other.
Shots as a budget (the user, 11 Nov): "Maybe start with one or two guns to enable that gameplay? And make
obstacles need to either use those instead of vs other players as a kind of peaceful racer bonus or just need
more hits idk." So every racer starts with a gun or two already loaded, enough to matter at the crowded line
through the whirlpools. Either the shot-away obstacles (the gun gap's guns, the shoot-away rocks) want those
same shots, so firing at another racer costs you a way through and leaving them in peace is its own reward;
or the obstacles simply need more hits than a starting gun or two, so the loaded shots are for racers and the
obstacles still take Gunnery. To weigh with the balance simulation (TODO.md), which can run both. Agreed
(11 Nov): "I definitely want to be able to shoot other racers. That's absolutely part of this." Now in
TODO.md, "Shooting other racers".

**A Rigging passage: trimming her through shifting winds (11 Nov):** the user wants Rigging in, "certainly in
a way that's like rigging ... I'm not sure I ever liked it as a compliment to the sailing puzzle ... my
understanding of like rigging. Usually, is all about changing winds and whatnot ... the rigging shortcut is
one full of unpredictable winds where you've got to change the rigging quick ... changing the rigging
positions to deal with high wind, low wind, catching the wind from a different direction ... similar to
what we've done with rowing, are we able to ... tweak the rigging puzzle so that ... you can deal with
really gusty, unpredictable passages, and that, again, would give you another path through, is a rigging
path. But you've got to constantly change and adapt the rigging to get through it."
- **A first shape (to shape with the user):** a passage of gusty, shifting wind, its next change shown a
  little ahead (stronger, lighter, round to another quarter), as mirror strokes turned a puzzle's clears
  into pulling the oars. On the Rigging board, what you clear sets her trim: reefed for a blow, full sail
  for light airs, sheeted round to the side the wind's coming from. Trimmed to the wind she's carried on;
  caught wrong she's pushed back or stalls (a knockdown in a blow: the snake).
- **Why it suits Rigging:** its play comes in small breaks every two or three moves (above, "How Rigging
  would move her"), which here is the point: the wind keeps changing, so it's quick, constant adjusting
  that gets her through, not holding out for a heavy combo. The opposite of the Sailing and rowing
  shortcuts, so it's a different kind of player's way through.
- **The real puzzle (YPPedia, "Rigging", read 11 Nov):** a hexagonal grid of pieces, moved in straight
  lines in six directions; **six pulleys** round it, one always active, the active one moving on clockwise
  after every move, pull or not. A chain of a colour in front of the active pulley is pulled off the board;
  big pulls score, lots of small ones don't. Surrounding pieces in a pull is a loop (a bonus, and loops on
  the rope coil); the coil full (20 loops) gives a wild piece; no pull three moves running loses 5 loops.
  Special pieces: wild, gaff (pulls everything round it; from surrounding a non-matching piece), tar (from
  pulling all of a colour, five or more), splice (a second chain pulled; from linking an inactive pulley).
- **The six pulleys as her rigging points (the user, 11 Nov):** "the different combos or a hook or something
  would like impact whether you're putting the sails up, down, catching the angles. I don't want it just to
  be like rowing ... normally rigging's all about, you know, it goes around in a circle ... is it 8 points
  ... or is it 6? ... it's like a toggle. So if you clear a piece on any one of the [points] around ... it
  toggles the rigging for that point. So essentially ... if you want sails down, you have to unclip all ...
  of them. If you want full set, you have to do more of them, and maybe ... they almost charge, so ... bigger
  combo will hook it immediately, or you have to do multiple to kind of slowly kind of tighten it. That would
  work actually very well." So each of the six pulleys is a line of her rigging: a pull at it hauls that
  line in, a big pull (or a loop) hauls it taut at once, small ones a bit at a time; let alone, a line slowly
  pays out. All six hauled is full sail for light airs; all let go, sails down to ride out a blow; hauled on
  one side and not the other, sheeted round to catch a wind from that quarter. The active pulley going round
  clockwise is the tactics: you can only haul the line whose turn it is, so you plan your pulls round the
  board to have her trimmed for the gust that's coming.
- Keep it the real puzzle with a new job, as mirror strokes did for rowing. SunnyKira, "sublime in
  rigging", to teach it.

**More kinds of shortcut, for later versions of the course (11 Nov):** "we've got a good collection of
mechanics actually here that you can have all different kinds of shortcuts." One the user suggested:
"some destructible object that then reveals the shortcut. So like you shoot some rocks or something" (rocks
across a gap, blasted away by her guns, loaded by Gunnery). The first draft's gun gap reuses the
checkpoint's mechanic instead (TODO.md).

(To shape with the user: where the course is and how you come to it; how long a race runs (a few minutes
the long way?); whether the rival takes shortcuts too; what winning gets you; whether it's night all race
or the door only shows at dusk; and what to build first: the course, the long way and one or two shortcuts
the den already has, before the Navigation puzzle and the door.)

## The race course coming alive with the den's characters (12 Nov)

The user: "making the course have a bit more personality and come alive ... so you can bring in the
different characters ... just bring those personalities in, even if it's just like little [talk that]
comes out in their little speech bubbles, like you pass a corner where you can see mischievous putting up
some banners or something and decorating." Their examples:
- **Gravee paints the race:** "she can be like doing a painting of the race and the best moments are
  painted by [Gravee]." An easel by the course, and at the finish the race's best moments as her
  paintings (like the wedding's collage of key moments, painted flat as her portraits are). She's the
  fourth racer when the race is watched, so she'd paint when she isn't racing, or someone else races.
- **Helium providing the rum,** once they're in (they're on hold with Distilling, and drawn from their portrait
  first): a stall or a barge of barrels along the course.
- **Mischievious decorating and styling the event:** banners and bunting going up as you pass a corner,
  her chatting about the colours. The host, not the show, as at her wedding.
- Little moments as you sail past, each in a speech bubble, cheap to add (the den's talking pirates and
  `Voices`, whom you hear at sea). Others to fit in: the starter at the line, Umami somewhere on a bank.
  Each a bit of config by the course, not a change to the race's rules.

## Puzzles the server can check, so nobody can cheat (12 Nov)

The user (12 Nov): "that is a problem that Puzzle Pirates really suffers from, is that everything is in a
client, especially like running puzzles ... it makes it very vulnerable to hacks and like tampering with
client-side code. So long term ... a great proof of concept, is creating puzzles and things like that that
can be run efficiently within a server-based environment." Not only whether a result is possible, but
whether its timing is: "you can't just say, oh yeah, I put the puzzle here, here, here, and here for
sailing magically ... you've had 5 minutes to send your first move, then you suddenly made 90." And "how
intensive is that? What network usage does that have?"

- **How it would work:** you still play on your own screen, instantly, but each move goes to the server
  too, and the server plays the same move on its own copy of the board (the puzzles are already rules
  with no 3D in `src/`, so the same code runs there). The server deals the pieces and shows a browser only
  what the puzzle shows (the next piece or two), so nobody can work out a run in advance. It times moves
  by when they arrive, not by what the browser says, so ninety moves can't land at once after five
  minutes of nothing. A move faster than a person could make is refused. If the two copies disagree, the
  server's wins (it only happens to someone tampering).
- **How much traffic (a rough sum, 12 Nov):** a move is a few bytes (which move, a turn, where), and a fast
  player makes one to three a second. Sent in little batches four times a second, that's about 100 bytes a
  second up: about 60 KB for a ten-minute race, less than one picture on the changelog. The server's
  snapshots of six sloops back down are a kilobyte or so a second. Checking a move costs the server a
  fraction of a millisecond.
- **What it can't stop:** a program playing the puzzle for you in the browser (a bot) is making real,
  legal moves at a person's pace. That's caught only by its patterns, as in any online game.
- **Where it'd run:** Cloudflare, as the den's rooms already do. The free plan covers playtests; the paid
  Workers plan ($5 a month, as last known) covers a lot of races before anything more is charged.
- Racing first (RACE.md §6, "Long term, a proper server"), then every puzzle played online.

**But a bot client still plays legally (12 Nov):** "what's to stop ... some kind of botted client from ...
determining the perfect ideal placement of a piece and slotting it in exactly at the right spot ... and
just sending the message back"; bilging is the clearest case, "it's so easy to detect a bilge move for a
bot and ... execute" it rapid fire. "Is there any way of architecturing and structuring it in a more
fundamental way so that you don't have to think, oh, how are we going to detect hacks and unfair play?
... experiment with technical security solutions." Thoughts to experiment with:
- **Nothing makes it impossible.** If a person can see the board and answer with a move, so can a
  program. Chess is the proof: the whole board is public and the server checks every move, and cheating is
  still caught only by detection. So the server stops *impossible* play (tampering, too fast, moves sent in
  bulk, seeing the future); what's left is a bot playing *possible* moves very well.
- **Cap the speed at a human's best.** The server takes moves no faster than a top player makes them
  (Bilge's swaps a second, Sailing's drops), so a bot is at best a flawless top player, never a machine
  gun. The gap left is only in the choices.
- **Bound what puzzling is worth.** Design so a perfect puzzle can't win on its own: a shortcut saves at
  most so much (the race already works so: each saves about what it takes to play), and a lock or a crane
  takes some seconds whatever you do. Then the rest is routing, timing a gamble, shooting, reading the
  others: judgment a puzzle bot doesn't have.
- **Catch it as chess does, by agreement with a bot.** We have bots for every puzzle already (`src/*-bot.ts`):
  the server can score how often your moves are the bot's best one, and how your thinking time follows how
  hard the board is (people slow down on a hard board and speed up on an easy one; a bot's even). A person
  agrees with the best move now and then; a bot nearly always. Quiet, after the race, never accusing on
  one result.
- **Raw input, not decisions.** Send the pointer's path and key timings, and the server replays the input
  rather than trusting "piece here". A bot then has to fake a human hand as well: harder, not impossible.
- **Make room for bots instead.** A bot league, labelled, with its own table (Dachimpy.com's simulators
  were half this already); ranked play only in rooms among people who know each other, or with a
  reputation to lose.

## A commentator for the sloop race (12 Nov)

The user, watching: "in spectator mode, obviously you should be able to toggle it off, but we need
somebody to be a commentator ... That's a spot for someone. They can be the [sloop] race commentator, and
they're off, and somebody, oh nope, they went over [a] Vegas through the whirlpool ... it's just
commenting [on] all the actions. Those going the round way. Oh no, Kikkit went down. Oh, Kikkit took 5
lefts again ... probably just a bit more action focused on actions than being too goofy." A commentator's
voice over a watched race (and a replay), in speech bubbles from a booth or a boat by the course, calling
what happens as it happens: the start, a Vegas over the whirlpools, someone taking the long way, a hit,
a snake catching someone, a lead changing, the finish; with the racers' own quirks (Kikkit's lefts).
Mostly the action, a little character. Can be turned off. **Who:** a spot kept open for a real pirate who
wants to be involved ("certainly when ... somebody wants to be involved we can give them a space"); a
stand-in voice till then. **Reserved (12 Nov):** the user will ask a friend, amhduck on Discord (he),
whether he'd like it. His pirate name and portrait to check before he's drawn or named in the game;
only his pirate name ever appears on the site. Their lines in `src/lines/`, called from what the race's events already say.

- **Who (13 Nov):** "Will let [Disengaged] be the commentator perhaps" (a real pirate, from Reverie by the
  user's earlier "Who in Reverie could be"; pirate name only; their pirate page and portrait to check before
  they're drawn, then into PIRATES; "perhaps", to confirm).

## Tutorials with pieces that don't come perfect (12 Nov)

On Tzz's balloon lesson: "the pieces she's getting for this are like completely perfect for her plan, so
she's kind of fine for this tutorial, but maybe for the ideas list, or at least later, that it's irking me a
bit." Later, a lesson (hers, Helium's Distilling one) could show what a real player does with the pieces
that actually come: parking an awkward pair out of the way, changing the plan when the wrong colour turns
up, so the plan bends to the pieces rather than the pieces fitting the plan.

## What Puzzle Pirates Adventures should have been: many little adventures (13 Nov)

Someone said to the user that the den is "basically like what Puzzle Pirates Adventures should have been".
The user found a wiki page on it: an attempt at this kind of idea from around 2008 that apparently didn't go
very well (the user doesn't remember it, and the page has few details). The thought: the den as several
different adventures, "especially since it's relatively cheap to design them now". It fits how the den is
already built, each place and event a little island of its own (CLAUDE.md), so more adventures don't
compound in complexity. The den's adventures so far, as the user sees them (13 Nov):
- **Defending the den:** the raids, the wall, the guns.
- **Umami the capybara.**
- **The little sailing Vegas adventure:** Kikkit's whirlpools, Tzz's balloons, the penguins.
- **Helium's distilling, the smuggling and the imperial island, combined:** "especially if you have
  distilling and the smuggling and the Imperial Island all combined", the one after the Vegas adventure.
The sloop race is something else: "more of a full-on fun feature", not an adventure.
(To shape with the user: what an adventure is, start to end, and how they're found.)

## Helium's rum run: deliveries, then smuggled past the Empire (13 Nov)

Once you've done some distilling, Helium asks: could you help them smuggle it to the island? They jump
aboard your sloop, and her deck's "slightly full of barrels just piled all in the deck". The run: a delivery
to Mischievious for her wedding, some for Kikkit, then the rest smuggled to the island (Port Decorum) past
the imperial outposts, Helium all innocence as you go by: "nothing suspicious at all", whistling, "whoop-de-
doop-de-doop-de-doo". "That would be cool and sweet." The adventure after the sailing Vegas one (above):
Distilling, the smuggling and the imperial island as one. Helium aboard as the spouse is (js/den/spouse.js),
the barrels a deck load that shows (and might shift or go over in a rough sea), each stop its own little
scene with that character's lines, and the checkpoint's guards (Dignity's) looking on as you sail past. (To
shape with the user: what getting past the outposts is as play, perhaps the smugglers' back way through the
beach, and what the run earns.)
**A first version built (13 Nov; RULES.md, "Helium's rum run"),** on defaults to confirm: it starts at their
still once two casks are filled; six barrels on her deck, Helium aboard as your spouse is drawn; Mischievious
two and Kikkit one, either way round, then the rest to Port Decorum, at its jetty under the guard's nose or up
the smugglers' beach; Helium whistling past the checkpoint and Port Decorum, Dignity remarking, its guards
watching; it earns the barrels counted and Helium's thanks. Still open: the barrels shifting or going over in
a rough sea; a sharper search at the checkpoint (a guard who comes aboard, say, or Dignity's spyglass on your
deck) as play of its own; what a run earns beyond thanks, if anything; whether the smugglers' beach should be
easier to reach for it than a Vegas; the smuggling ring and its penguin as the way in; more runs, each a
little different.

## The grand frigate and the tunnel: "we can fix that later" (13 Nov)

A funny one, for Primates Rule or a ship like her, perhaps a trading character's mission: sailing a grand
frigate up to a long cave tunnel. You look at it: "I don't think the ship's going to fit in there". The
captain: the ship'll be fine. Then someone goes up the mast and starts taking a giant saw to it, you watching
in horror; the mast falls and cracks on the deck. "Don't worry about it, we can fix that later. Let's get
going." A cutscene (js/den/cine.js) on the way into a tunnel (like the starlit door's, sized for a frigate),
with the damage still there after: perhaps Carpentry to patch the deck, and the mast to put back.
(Whose mission and who's captain: to shape with the user.)

## A Puzzle Pirates tutor AI, with everything we've taught the den in it (13 Nov)

The user (13 Nov): "It would be really nice eventually to have our own kind of puzzle pirate tutorial AI ...
all these things that obviously we're training into the distilling thing or the puzzle, the pirate knowledge
questions, you know, to have that all encoded in there." Eventually, one tutor that knows what the den has
learned: each puzzle's rules and techniques as the bots play them (DISTILLING.md and its bots, Sailing's,
Navigation's, rowing's, the greedy ones), the user's corrections on where a bot went wrong, and the pirate
knowledge (the real pirates, the islands, the lore). You could ask it about your own board and it would read
it, name the technique and show it, as "Help, Helium" does for Distilling, but for every puzzle, and answer
questions about the game besides. A start that's already there: the bots' `advise` and Helium's lines. How
it's built (in the den, a page of its own, or both) is to shape with the user.

But a side adventure, never the place to learn it all (the user, the same day: "don't forget ... the greatest
love of the game is talking to other pirates ... this is not a replacement for the game ... a tool, a side
adventure ... We should be watching people, looking at YouTube videos, talk to people"). The tutor would
say so itself, and point you to other pirates (STORY.md, the principles).

## Making the puzzles mobile friendly, the hard ones too (13 Nov)

The user (13 Nov): "any kind of ideas to try and make things more mobile friendly. I think they tried it and
failed to try and make it more mobile friendly. So I think it works well for some puzzles, I believe, like
bilging. Like that's very easy, but others, I'm guessing like carpentry and rumbling were a lot harder to adapt.
So any kind of ideas later that we could figure out for those things would be great concepts to explore." A
place to gather ideas, puzzle by puzzle: what's easy on a touch screen already (Bilge's swaps; Distilling's
drags, its board now filling a phone's width at Helium's still, Helium in a little window at the top left),
and what isn't (Carpentry's pieces picked, turned and placed on a small grid; the rumble, to look into), and
ways round each: bigger targets, drag-and-drop with a held preview, a piece turned by a tap on it, a zoomed-in
view of the part of the board you're working, the den's menus folded away (TODO.md, the hamburger menu).

Carpentry by turning the phone, for a laugh (the user, 13 Nov: "would you be able to do carpentry with phone
control? So it's like you're dizzy. Like you could rotate the pieces by turning your phone. That'd be horribly
impractical, but it would be funny"). It can be done: the browser reports the phone's tilt and turn (device
orientation; on an iPhone only after a tap to allow it, and only on https, which the site is). The piece in
hand turns a quarter each time the phone's turned past 45 degrees one way or the other, with a little give so
it doesn't flicker, and tilting it nudges the piece across the frame. A mode, never the normal controls; maybe
someone's dizzy game (Kikkit's, after the stash?), the whole den swaying with it.
The user loved it (13 Nov): "It can be the, yeah, Kikit's Dizzy Carpentry ... Of like, right, we're going to
make you really dizzy. We've tried porting carpentry to [mobile, to perfection?], so this adventure needs to be
played on a mobile phone with carpentry. That would be hilarious. That's fantastic as an idea." So: **Kikkit's
Dizzy Carpentry**, an adventure of its own that has to be played on a phone, turning it to turn the pieces;
Kikkit's joke being that Carpentry's been "ported to mobile" at last. (One of the little adventures, above.)

## Dignity's tutorial: four-tier Duty Navigation in the werewolf den (13 Nov)

A tutorial asked for by Dignity (the real pirate behind the checkpoint's commander; she): four-tier Duty Navigation,
in the werewolf den. The user, 13 Nov: "I just wanted to make sure we had ... the 4-tier duty nav in the werewolf
den to the kind of tutorials list that's been requested by Dignity." It hadn't been noted anywhere before this.
The den already plays Duty Navigation (src/navigation.ts, its bots, the starlit door's three-star constellation),
so the puzzle's there to teach from; Dignity, already in the den, the natural teacher. With its read version, as
every tutorial has (RULES.md). To pin down with the user (or Dignity): what "four-tier" means here (four rings, a
four-tier constellation, or the duty's tiers of difficulty), and what and where the werewolf den is (a place in
Puzzle Pirates, or one to make), before anything's built.
- **What players say, and a looting run watched (14 Nov).** The user asked on Discord about wolf-den looting
  nav and shared what came back. Pandayay: you don't need triples for "fren"; go fast enough and singles do it,
  and any good set of doubles will too. Duty Navigation is hard, and the higher-level tactics shouldn't put a
  learner off. Four screenshots of a good player's run:
  1. A constellation of four places up at once (two yellow, an orange, a red), the next star waiting on the
     left spoke.
  2. "Single! +3": one line of three cleared.
  3. "Double! +6": what fell after it made a second line in the same move. The top place now holds a star
     (it looked multicoloured to the user).
  4. "Triple! Constellation! +213": the third clear of the cascade filled the constellation. Its places flash
     multicoloured as it goes, and it scores about seventy times a line.
  My reading of them: the game is to set a cascade going whose last clear fills the constellation; lines alone score next to
  nothing. That's how src/navigation.ts already scores: a line a point a star times its step in the cascade
  (+3, +6, +9 as in the pictures), and a constellation filled by a combo three times its points. Not yet in the
  den: the board naming the cascade "Single!", "Double!", "Triple!" over the stars. Still to pin down: what
  "fren" is (the duty's top rating while looting, frenzy?) and whether a constellation's places really turn
  wild (any colour) mid-cascade or only flash as it goes.

## Distilling with a higher skill cap: fun variations (13 Nov)

The user, 13 Nov: "I know some puzzles have a skill cap, like distilling. People can just play that so perfectly.
So anything we can just to create a fun kind of variation of distilling would be brilliant to make it
challenging." Distilling played well is near solved (a perfect player sends up CC^12 again and again), so the den
could have variations on it with more to master, each its own mode on the same rules module (src/distilling.ts),
knowing nothing of where it's played. Ideas to shape with the user:
- **A hotter furnace:** the fire speeds up as the chain grows, or with each column; the clock is the skill cap.
- **Tainted spice:** some spice that spoils a Crystal Clear, or spice that moves, so the block can't be built and
  forgotten.
- **Two furnaces:** one each side, whites to one, junk to the other, the board pulled both ways.
- **A taller still:** more rows or columns, so the V and the channels are longer and the hauls harder.
- **Orders from Helium:** a target pattern for the batch (so many whites, a CC of a given length by a given
  column, a column of only browns), scored on meeting it, like a daily challenge.
- **Duels:** two players on mirrored boards, a Crystal Clear of yours dropping a junk piece onto theirs.
- **Blind pours:** the next column's pieces hidden till they slide in, so you plan for the unknown.
Each with a bot tier tuned to it (src/distill-bots.ts), and a read version, as every tutorial has (RULES.md).

## A war frigate and a sloop on one board, and a blockade board shaped for both (13 Nov, for the weekend)

The user, 13 Nov, last thing: "random big ideas for tomorrow ... I think we started on primates rule, but yeah, even
just like doing any kind of proof of concepts of what a big [war frig] on any kind of a board, like a navigation board,
would look like next to a sloop, and just how they would look moving around, interacting with each other, having some
kind of a blockade board whereby ... if you look at blockading, like where there's clusters that are ... clearly for
war frigates because they're out big and in the open, but then there's smaller coves that only ... [are] accessible to
small ships because of the narrower gaps. I think that would be a cool proof of concept to do over the weekend."

- **A war frigate on the sea board beside the sloop:** Primates Rule (src/den-frigate.ts, js/den/frigate.js; on the
  unlinked frigate-test.html, not yet at sea) sailing on the same square board as the sloop, at her size against the
  sloop's (src/ships.ts, `hullFor`), taking more than one square; how the two look moving round each other, passing,
  turning, side by side; a first look at them interacting (a broadside each, a frigate's bigger one).
- **A blockade board shaped by ship size:** like Puzzle Pirates' blockades, its open water in clusters out in the open,
  plainly frigate country, and small coves behind gaps too narrow for a frigate, a sloop's to hide in or hold. One
  board, both ships on it, the shape of the sea deciding which goes where. Ties in with "Bigger ships ride out the
  winds" (a deep-water mechanic) and Daquan's flotilla (the underdogs against the giant ship).
- A proof of concept: something to look at and steer, not a full game; on its own test page, like frigate-test.html.
