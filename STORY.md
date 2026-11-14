# Pirate Den: the story, and why

The big picture of the game: what happens, in what order, what opens up as you go, and the
principles behind it. [RULES.md](RULES.md) holds the exact rules as built, [TODO.md](TODO.md) the
agreed fixes, [IDEAS.md](IDEAS.md) the ideas still being shaped. This is the thread that ties them
together, so a new feature can be checked against where the game is going. Not published with the
site (`.assetsignore` skips `*.md`).

## What it is

A pirate hideout dug into a cove, played through Puzzle Pirates' own puzzles. You start with a
broken wall and raiders rowing in; you end up with a den of your own, built piece by piece, and a
whole cliffside of places to go. It began as a Carpentry primer and has outgrown it (the user, 9
Nov: "this is obviously far more interesting than the carpentry primer ... It has evolved"), so
in time the den becomes the thing itself (TODO.md, "Split the den off").

**Who it's for, and who it isn't (the user, 14 Nov).** The middle: "I know the basics, but I want to build up the
technique ... see what the techniques are". The game's own tutorials teach the basics; the den gives "the building
blocks and techniques". It isn't "here to get you to #1 ... that's not my goal": mastery comes from playing the
game and the people in it (the Trophy Hunters Discord, the top puzzlers' videos and streams). "This is a sociable
game ... this website here is for a bit of fun and a bit of stuff on the side, but everything is about the people
and the love of that, playing puzzles together, so go do it." The front page says so, and every teacher in the den
sends you on to other pirates.

**What people like so far (the user, 14 Nov).** Tutorials "that are actually in demand, like werewolves" (four-tier
Duty Navigation in the werewolf den); the den itself "cute and a bit of fun ... a bit of a goof", which is why the
user enjoys it; the sloop races "a thing, I think, with more potential". Racing online and crews, not so far. And
the den's spirit: a place for pirates' own rooms and adventures, "meaningful and funny, ideally in a mechanical
sense". Of the user's own experiments, most may fizzle, "but ... there might be that one thing that leads to
something really fun" (the duds are the user's own ideas, never anyone's room: 14 Nov, "I'm talking about my ideas,
not their ideas"). Every place is shown for what it is, proudly: Gravee's house "a big gallery concept and a fun
mechanic", never "a small room", nothing about anyone's place minimised ("Just show the more positive aspect"). The
den as a quick, cheap place for ideas (14 Nov): "all of this is quick and cheap to do. It's all just getting lots of
ideas out ... there may be one good idea that people are really excited about and interested in among them ... At
the very least, it's a bit of fun." Its looks are simple on purpose (14 Nov): "it's not going to create high quality things ...
not ... an original creative platform, but it's a bit of fun and a place to try out the concepts. So intentionally
things are ... relatively low quality ... partly by design, but ... high enough quality that we can have some fun
with it." And every page invites people in: "You got an idea, see something here that you think's missing. Let me
know with a description and some kind of reference, and I'm sure it can be added."

## The principles

- **Full of things to find.** "The game should be full of those little let's go explore,
  discover some Easter eggs" (the user, 10 Nov, "a top principle that we want to follow"). Off
  the track the story leads you along there's always something to stumble on (the lagoon behind
  the locks, its wreck and the animal to rescue), never all signposted. But nothing's kept secret
  in the proof of concept (the user, 12 Nov: "I think we get rid of the hidden gem idea ... I just
  want to show stuff"): the starlit door, the penguins and the smugglers' beach are in the
  changelog, each with a link and a cheat, like everything else (RULES.md).
- **The way on pulls you; the side ways push back.** The main way should guide you naturally,
  easy to follow without a word; going off it to a side quest takes going against the grain, a
  bit of bumping and squeezing (the user, 10 Nov: "it should naturally pull you in a direction.
  And if you want to go against it, then, you know, that leads you to the side quest, but there
  should be a gravity against them").
- **A puzzle game, not an action game.** The raiders give a bit of interest and a bit of
  pressure, but the pull is always the puzzle in front of you: the next hole, the next frame, the
  next load for the guns. Never a pressured fight against defeat. When in doubt, the easy side:
  "progression is fun. It's to be expected."
- **A side adventure, never a replacement for the game.** Puzzle Pirates' greatest love is its people, talking
  to other pirates, and the den never tries to take its place: it's a tool and a side adventure beside the real
  game, not where you learn it all. When a character teaches (Helium, Tzz), they teach a few tricks and send you
  on to the real ones: other pirates, watching them play, their videos, asking about (the user, 13 Nov: "don't
  forget, you know, the greatest love of the game is talking to other pirates ... this is not a replacement for
  the game ... this is a tool, a side adventure. It's not something that's trying to get the main focus ... we
  should never be trying to learn exclusively here. We should be watching people, looking at YouTube videos,
  talk to people"). Tzz, the real one, put the spirit in a line in the game (13 Nov): "i just want to stream
  and talk about puzzles while i play"; and the user: "<3 that's always the heart of the game". Puzzles, and the
  people you talk to while you play them: that's the heart of it. Her island says so too (src/lines/tzz.ts).
- **Faithful to Puzzle Pirates.** The puzzles are the real ones, played by their real rules and
  with their real keys. What's new is where they happen and what they do in the world.
- **Immersive, in the world, never a separate screen.** A puzzle is a thing in the den (the wall,
  a frame on the floor, the weapon crates at the armoury hoist, the tide at the pumps), and what
  you do in it shows in the den. No overlays.
- **Every puzzle has a believable reason to be where it is.** No puzzle "randomly in the middle of
  an open area". You dig where the X is, pump where the water is, shoot from a gun deck. If a
  puzzle can't be made to fit the place (Treasure Haul on a hillside, say), it isn't used there.
- **Leave the choices open.** Whatever's in your way, any of the den's puzzles can get you past
  it, each in its own way: the raid can be met at the wall, the guns or the armoury; a guarded
  treasure by sword, by gun or by flooding him out; a returning enemy at the den or at sea.
  Players love some puzzles and hate others, so nobody is forced through one they hate.
- **Pressure first, then freedom.** A quick, exciting start under attack teaches the den; after
  that the raids come when the world gives a reason, or when you choose, so you're "free to go
  explore, roam, and do different puzzles".
- **Unlocked by doing, not handed out.** Each new part arrives as the result of something you did
  (beat a wave and the timber comes; beat the siege and they leave a map). Nothing appears by
  magic: everything you build is the pieces you fitted. The same goes for prizes: familiars are
  won, as in Puzzle Pirates, not picked from a list.
- **A few mechanics, used many ways.** New things build on what's already there (the wind, the
  rocks, the lock, being dazed, the duty puzzles) rather than each bringing a mechanic of its own:
  "they do need to have some kind of cohesion to them. Not just let's create a new mechanic for
  every ship." A brand new mechanic, or a new puzzle, has to earn its place.
- **Something mechanically original.** A puzzle has to have "something really mechanically
  original" (the user, 10 Nov): mirror strokes "is really something"; a puzzle that only recolours
  one we have (four colours for four oars) has "nothing unique about it".
- **New mechanics, concept ideas and tutorials, not the big fights again.** The den is "supposed to be
  about creative new mechanics, and tutorials, not ... recreating puzzle, imitating" (the user, 11 Nov;
  and then: "new mechanics, concept ideas and tutorials"): "we've got plenty of
  big fighting simulators in Puzzle Pirates itself and the Blockade Sim ... that's all been done. I don't
  think that's really the space this wants to ... fit into." So minigames like the sloop race, a puzzle
  shortcut at every bend, over sea battles.
- **Quick to learn, hard to master.** "The whole point of the Puzzle Pirates puzzles is they need
  an infinite skill curve, like quick to learn, hard to master, Vegas's ... these can't just be
  gimmicks. They need to be meaningful, skill-based mechanics. That's what makes coming up with a
  new puzzle so hard." A twist on a puzzle earns its place only if it deepens the skill, not just
  the look.
- **A hideout, not a city.** Lodgings dug into the cliff, ladders and rope bridges, a den behind a
  wall in a cove. Small and characterful, never a sprawling town.
- **Forward, not back.** The story goes outward: out of the den and across the sea to raid the
  ones who raided you, not back up behind the den ("it feels weird going backwards").
- **The story's path is there, but not a straight line.** Side quests along the way (the scrolls,
  the capybara, foraging), or staying home to build: you choose when to take the next step.
  Side quests everywhere, not each locked behind the last (the user, 10 Nov: "I want them to just
  be side quests everywhere"). Getting through a hard place unlocks a few more of them (Kikkit's
  penguin, off to the right beyond the checkpoint: the user, 10 Nov, "I do want there to be a bit
  of a reward for getting through, and that is unlocking a few more side [quests]").
- **Little cutscenes, short and cheesy,** for the story's big beats: the camera cuts to what's
  happening, and Space always skips. The user loves funny ones (a vampire sitting up in his
  coffin, both of you screaming: IDEAS.md).
- **Always in the world, even between places.** You sail from one place to the next on a real
  board, as in Pillaging or Atlantis, never a jump cut; and when you look closely at something
  (the map), the camera zooms in onto it and the den's buttons get out of the way.
- **Not overpowered.** Building on (more guns, more rampart) is fine as long as it doesn't make
  the game trivial; armies start small (a handful of soldiers) and grow as the den grows.
- **You choose your puzzles.** Walking about the den never drags you into one: you start a
  puzzle when you want to (Space, Tab), the wall with a piece in hand being the one exception.
- **Safe waters, then the wilds (a long way off).** The story's places are safe for light
  adventures; out in the wilds the rewards are higher and so is the risk: krakens, monsters, and
  other players (IDEAS.md).
- **Better together.** In the spirit of Puzzle Pirates, a crew helps each other's puzzles, visibly,
  and drops in and out without spoiling anyone's game. (Later: for now the den is a solo proof of
  concept, 10 Nov; IDEAS.md, "Solo for now".)
- **Characters from the user's world.** Real Puzzle Pirates pirates, by their pirate names only,
  drawn from their pirate pages, with affection (Dalnoth, a bit of a drunk; Dignity, the imperial
  checkpoint's commander). Check the portrait before drawing them: a first guess "always seems to
  be so far off". Each is just a look from the same wardrobe as yours, so you can dress as them.
  Their familiars are characters too, and do things in the scenes (the user, 10 Nov: "We've got
  to get these familiars really involved"): Dignity's lavender monkey, Bella, fires her warning
  shot.
  Mischievious, who keeps getting married, runs the wedding venue on her island (from five of
  her portraits: you choose which of her you'd marry).
- **The characters know each other (12 Nov).** Each island is its own place in the code, but in the
  story they're one neighbourhood, talking about each other in character: "I really would love the idea
  of things being interconnected, like Helium saying ... oh, I have a large shipment of rum for one of
  Mischievious's weddings, or Kikkit's been at the stash again. Those kind of interlinked things with the
  personalities". So a character's lines mention the others as they'd see them, and one place's thread
  leads to the next (the penguin in the balaclava to Helium's island: IDEAS.md). In the code that stays a
  line in `src/lines/`, never a tangle between islands.

## The story so far, and where it goes

Built (✓), being built (▶) and to come (·). Details of each are in RULES.md or IDEAS.md.

1. ✓ **The wall's broken and they're coming.** Mend the holes in the wall by Carpentry before the
   first wave. The first wave's pieces are dealt to be fair, so a new player can always finish.
2. ✓ **The opening siege: three waves.** Raiders row in from their ship in the cove and hack at
   the holes. Meet them at the wall, by throwing pieces, from the rampart, at the guns, or with
   soldiers armed at the armoury hoist (Swordfight). The tide and the pumps (Bilge) come into it.
   - Beat wave 1: timber for the **walk** along the top of the wall, then the **stairs** up to it.
   - Wave 2: their ship runs out a **cannon**; beat it and timber comes for the **gun tower**.
   - Your **shack** can be built whenever you like, in its plot at the back.
3. ✓ **They sail off, and the den's quiet.** Beat wave 3 and their captain, Dalnoth himself,
   calls it off: "We'll be back! *hic*" No countdown after that. But not dead quiet: every
   couple of minutes you're in the den, a boat or two puts in with a straggler or two after an
   easy mark, no siege, just a bit of life and something to throw your spare pieces at ("a way
   to throw scrap", 10 Nov).
4. ✓ **The captain's map.** A short, cheesy cutscene: Dalnoth leaves his cannon on deck, rows
   in, shakes his fist on the beach, "We'll be back!", runs for his boat, and a map falls out of
   his coat; he rows back out to his ship, and your pirate walks out and picks it up. "We hear there's some secret treasure here, guarded by a fearsome enemy." It
   shows the sea as it is (10 Nov: "it should match up with what is actually on the map"): the
   trade winds and the shipping lane out to the imperial checkpoint's line, the cliffs and
   headland on one side and the reef on the other, and beyond it the open sea and an old wreck
   with the X on it, the captain's dotted way out through the gate. Never the secrets (the locks,
   the hidden cove, the lagoon) nor how to get past: those are yours to find. The first time you open it, a short tour walks round it, and a quest list beside it counts what's still out there to find without saying where (10 Nov, for the demo). (It showed his
   island and a way in for each puzzle, one of them the hidden cove, before the sea was built;
   those ways past Dalnoth come back onto it when his hideout's built, step 6.)
5. · **Out to sea, to his hideout.** Forward, not back: you go and raid him, "a mirror of this
   kind of siege". And you really sail there, on a board in 3D, putting in forward, left and
   right, past rocks, the beach coming up as you land (▶ a first go is built: once the siege is
   over there's an old sloop at anchor in the cove; board her, drop a pin and she sails there on
   Battle Navigation's moves, or steer her yourself; she has a gun each side to fire at the rocks
   as you go, loaded by Gunnery played on her deck, the den's own puzzle; trade winds sweep her
   out from off the beach to a junction, and on, the main shipping lane, to an imperial
   checkpoint, another wind bringing her home; its guns are trained on marks along the way
   through, a hit holes her till you patch her by Carpentry, a strong thing that's work to get
   past but can be done: run it (a hit or two, or none on a heavy combo, a big Sailing chain or a combo
   rowed on both sides, that zooms her through), knock its guns out with her own, three hits
   apiece, a fight once you start it, or find the secret way round: tucked away off to the left of
   the trade wind's run, out of view, a wind blowing down out of its mouth that only the oars beat
   (nothing ever says so), the canal climbs two locks straight up the cliff, each pumped up by
   Bilge, runs along the clifftop and comes down two more through the checkpoint's headland, out
   onto the sea beyond it, never seen (nothing signposts it; only, sighting the checkpoint, "An
   imperial checkpoint... I wonder if there's another way round"); beyond it an old wreck whose
   treasure is hauled up by Treasure Haul, in sight from the checkpoint's side but a wind dead
   against her there, so the locks are the way in to it; a bribe comes later. Its commander, Dignity, peers down from its gate: the first time you sail up, a little cutscene, and her monkey Bella fires the warning shot from one of its guns. The turret near the den that came first is gone: the checkpoint is "the evolution of
   it"). Up at the top of the locks, down an arm off the clifftop canal the locks don't lead you
   along, is a hidden cove, an Easter egg you find by wandering off, an old bilge pump on its
   sand (for later: flooding Dalnoth out). The cove is the first step of a journey that grows (▶
   its next step is built): at the foot of its left-hand cliff there's an old smugglers' ledge to
   moor at, and a crane you build there by Carpentry, foot, post and jib, each hauled up the cliff
   by hand, hauls her up the cliff and swings her down into a clifftop lagoon, a
   discovery, still and reedy, an old wreck sunk in it whose treasure is hauled up by Treasure
   Haul, and on its far bank Umami the capybara, shut in an old fish trap, freed by Foraging, who
   comes home with her and lives in the den's shallows; and lowers her back down whenever you like ("more of an adventure ... we can have a
   multi-step thing and gradually build up on it"; more steps to come along the way).
   And not necessarily straight there: the captain drops a pile of scrolls (maps
   to an island to forage, the capybara rescue, plans for the gun platform), and you can stay
   home and do up the den first. Or sneak onto his island for some of his buried loot, without a
   fight; every theft angers them more, and that's what brings the raids back.
   Or sail out to the Wedding Isle, where Mischievious is always planning the next wedding (built as a
   proof of concept, 10 Nov): lay out the venue, dress the guests, pick who you marry and how it
   goes (raiders, a brawl, or every guest bringing a present till you're buried in them), and keep a
   collage of the day. Whoever you marry sails home with you and lives at the den.
   Or knock at the houses in the den's cliff (a proof of concept, 11 Nov): the first is Gravee's,
   Bedside Manors, where she shows you round her portraits, the vampire sits up in his coffin, and
   she paints you scared to death for her wall. Each house is a friend's little scene of their own.
   The second is Roobear's (13 Nov), a little one she calls her ROOm, kept as the memory of a sweet,
   funny moment between friends: asked what her name stands for, she said she could be Robert the
   kangaroo bear that roobs ears, and liked it. So Robert, half kangaroo and half bear, roobs your ear
   at her door, and her walls hold everyone's guesses at her name (Dachimpy's three, Dignity's from
   the books), her own answer the biggest frame. She rooms at Gravee's too. No adventure of hers yet:
   the small house only, to see where it goes.
   The third is Dachimpy's own (13 Nov), the user's pirate, which doubles as a museum: a hug and a
   cookie at the door, every visit, as Dachimpy always gave them; then the story of the Blockade
   Simulator and Dachimpy.com told on its walls in the order it happened (14 Nov), from the user's own
   screenshots and the old site's own files, Dalnoth shot in its first version and its last, each with a
   plaque in Dachimpy's excited words, bugs and all (Dachimpy.com was their own way of helping people learn,
   which is what the den's teachers do too); and a room of friends, no one labelled, because everybody's special
   (14 Nov), the closest in the middle (Daquan, their partner in crime, at its centre, with Kikkit, Zizzy, Sanne and
   Whiterose), a page for everyone they blockaded with, whatever they're called now, and a thank-you to everyone
   who makes Puzzle Pirates what it is. The museum keeps the
   story of the sims; the house keeps the people.
   The fourth is Affame's (14 Nov), the queen of sweetness: the Sweet Spot, a cosy little room hung with the
   four cartoons Dachimpy made her (her knighting as Dame of Everlasting Sweetness with a candy cane, at peace
   among cushions and teddies, the Sweetness War, the Sweetness Index off the charts), and a heap of cushions
   and teddies in its corner to sink into, a moment's peace. A kind, peaceful part; no adventure of hers yet.
   Or find Kikkit on her little island right of the checkpoint, rambling the real way through her
   whirlpools (taken literally), and, with a Vegas, the penguins of Vegas Island beyond them. Once
   she's told it all you wonder aloud whether anyone could explain it with fewer tangents, and a hop
   back toward the den, on a little island of her own, is Tzz, the sensible one (11 Nov): she twists
   balloons, squeak by squeak, into Sailing's pieces and plays them onto a real Sailing board beside
   her, a Double ("that's what zooms you over a whirlpool"), a Bingo and a Vegas, and in each hands you
   the last pair to drop and pop. Then you sail the whirlpools yourself. Kikkit first, always; Tzz is
   the one you go looking for (nothing says where). And on from the penguins, a run of water behind
   the rocks leads to a smugglers' beach round the back of Port Decorum, the imperial island past the
   checkpoint (11 Nov): the back way into a port shut to pirates, where Helium's rum will one day be
   smuggled ashore. Nothing to do there yet. The thread that will tie them (12 Nov, an idea in IDEAS.md):
   the penguin in the balaclava is in a secret smuggling ring, just as Kikkit said; bring the ring rum and
   they'll show you how to sneak past Port Decorum's customs, and he tells you where to find Helium's
   island, where you learn to distil it. "He's a shifty penguin. [Kikkit] was right."
   Helium's island is there already (12 Nov): a little one of their own out past the checkpoint, across the
   smugglers' rocks from their cove, their copper still on it and a board of Distilling on a stand. The
   first time you come up off it the still blows up as you arrive, and they treat it as an everyday thing
   ("of course it's safe"; and the eyebrows none of us have). Then they show you, offhand, as if it were nothing: the swap rule, whites left
   and junk right, the junk column burned, and the next burned with a white in it, bang ("Oops. That
   happens sometimes. Don't worry about it."). Then it's yours, and "Help, Helium" while you play: they read
   your board, say what they'd do and why, name the technique, and do it. They mention the others: a big
   order of rum for Mischievious's next wedding, Kikkit at their stash again. And where their rum goes (13
   Nov, a first version): fill a couple of casks and they ask you along on a rum run, the adventure after the
   Vegas one, Distilling, the smuggling and the imperial island as one. The barrels piled on your sloop's deck
   and Helium aboard, a wedding's worth to Mischievious's jetty and a barrel for Kikkit, either way round, then
   the rest to Port Decorum: brazened out at its jetty under the guard's nose (past the checkpoint, its guns as
   they always were), or quietly up the smugglers' beach round its back (the whirlpools' Vegas the only way
   there). Past the Empire Helium plays it all innocent, whistling, "nothing suspicious at all", Dignity
   taking notes. Then you take them home. (The ring that leads you to them still to come.)
   And out past Primates Rule, a buoy and a gate in a line of rocks: the sloop race (11 Nov), the den's
   own characters racing you round a zigzag course, Kikkit greedy for her Vegas, Tzz steady on her
   Doubles, Dalnoth with Umami aboard to do his foraging, firing on whoever sits still in the open; the
   long way round every bend or a
   shortcut through it by a puzzle the den already has (guns, oars, whirlpools, locks, a crane), so the race
   comes down to which puzzles you back yourself on. Minigames like this, not sea battles. And in
   its cliffs, the starlit door (11 Nov): Duty Navigation on the rock as the night sky,
   two constellations lighting its stars, opens a tunnel under the course, its biggest shortcut, the long
   way round for a navigator (who can then throw a Vegas). The starter names it among the shortcuts (12 Nov).
   *(11 Nov: on hold. Dalnoth is the Vikings' chief, his raids on the den Viking raids as Puzzle
   Pirates has them, and called on by Pandayay; going after him, steps 6 and 7, waits until a reason
   grows out of something else: IDEAS.md, "Her Vikings bring you back to the den".)*
6. · **Dalnoth, guarding his treasure.** A big famous pirate, sitting on his chest with his monkey
   and his tankard. Get past him your way: swordfight him, shoot him off from the gun platform, or
   pump water in from the hidden cove and flood him out so the treasure washes onto the ground. He runs off, but his
   white monkey stays: you're the champion now, and it hops onto your shoulder. (Familiars are
   earned, not picked from a list; this is your first.)
7. · **Dalnoth comes back, furious.** Robbed of his treasure and his monkey, he returns with his crew, and that
   brings on the next round. Your choice again: dig in at the den (fortify, more guns, more
   soldiers, fight him on the beaches), or find the abandoned sloop in the harbour, fix her up and
   see him off at sea on a Battle Navigation board.
8. · **And on from there:** life on the sea (a kraken to sail round, trade winds to ride,
   smuggling rum past the patrols onto a back beach), safe waters and the
   risky wilds beyond, side quests that leave friends about the den, raids that come when the
   world gives a reason (a sail on the horizon) or when you ring the bell, a den that grows (bigger
   barracks, a bigger army), a crew of real players, and one day raiding other dens.

## What unlocks what

| You do | You get |
| --- | --- |
| Mend the wall | The first wave comes (with a beat to see it done) |
| Beat wave 1 | Timber for the walk, then the stairs |
| Beat wave 2 | Timber for the gun tower |
| Beat wave 3 | The siege is over: calm, and the captain's map (a cutscene); their ship sails off, and an old sloop's left in the cove; now and then a raider or two still put in, to throw spare pieces at |
| Find the scrolls (to come) | Maps to side quests, plans for building (the gun platform) |
| Steal his buried loot (to come) | Gold, and his crew's anger: raids come back |
| Break fused chests at the armoury | Soldiers, up to a handful (more as the den grows: to come) |
| Break loose crates | Planks that mend the wall for good |
| Walk into the plot | Your shack, built the same way, any time |
| Come up off Helium's island, past the checkpoint | Their Distilling lesson, then their still to play at, their help on H |
| Fill a couple of casks at Helium's still | Their rum run: Helium and the barrels aboard, to Mischievious, Kikkit and Port Decorum, then home |
| Build the crane at the hidden cove's ledge | Her way up the cliff to the clifftop lagoon, and its wreck's treasure (by Treasure Haul) |
| Get past Dalnoth (to come) | His treasure, and his white monkey on your shoulder |
