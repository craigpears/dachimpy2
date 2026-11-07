# Pirate Den: future design ideas

Ideas the user has brain-dumped for later. Nothing here is built yet. When one gets built, move
its rules into [RULES.md](RULES.md) and delete it from here. Not published with the site
(`.assetsignore` skips `*.md`).

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

## Raiders need a real gap to get in (rethink, wanted soon)

The user finds it weird and dumb that raiders seem to hop through tiny gaps, even five-square ones
high up the wall, as if by magic. Today any empty hole counts as a way in, whatever its size or
height. What they want:

- **They walk through, not jump through:** a raider only gets in through an opening big enough to
  walk through: down at floor level, and roughly two squares wide by three tall.
- **A smaller gap makes the wall weaker, not open:** raiders go for it and hack it wider (it falls
  faster than whole stone), so leaving gaps still costs you, but nobody just waltzes in.

A possible way to build it: a hole a raider can't fit through is a weak spot with low strength;
hacked through, it becomes a breach that is a bigger, floor-level carpentry hole (still made of
whole pieces' worth of squares, still solvable), which the crew then mends.

## Grades for the layers behind a hole

Nailing junk pieces on behind a mended hole should reward good work, the way the hole does:

- **Fill a section properly and it's stronger:** e.g. a layer that runs top to bottom of the hole
  and at least a certain width, packed solid, counts as a Masterpiece layer.
- **More than one grade:** carpentry has levels below Masterpiece (the user remembers "good
  work"; check YPPedia for the real names), so a decent but imperfect layer could be a middle
  grade, stronger than loose boards but weaker than a Masterpiece.

## Feel: turning a piece when you're close

Turning the piece when you're close to the wall still feels a bit off to the user, though they
can't yet say how. Worth a playtest to pin down (which way it turns, where the ghost jumps to).

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
- **Keep it democratised:** everyone gets a turn at the fun jobs (see the principle above).

For now the den is the first version, and that works.

## Gun deck (inspired by Gunnery)

Reference: https://yppedia.puzzlepirates.com/Gunnery

In the puzzle, pieces (bucket, shot, powder, wad) leave a barrel in four directions. They travel
straight, turn right at an obstacle (left if they can't, back if neither), and two that meet both
turn back. You steer them with up to three arrows (the oldest goes when you place a fourth). A gun
is loaded powder, then wad, then shot. A bucket cleans it after firing or after a wrong load.

The user's steer: simply picking up wad, powder and shot and dropping them in a cannon doesn't
catch the spirit of the puzzle. It needs the routing and steering, the way the frames catch
carpentry.

Proposed design (not yet agreed):

- **Build it:** after wave 3, a bigger frame is built from pieces and hoisted onto the middle of
  the wall as a gun deck, about 7×5 planks with two guns.
- **Stores roll:** a powder barrel in the middle of the deck rolls out kegs, wads, shot and
  buckets (two of each on deck at once). They follow the turn-right rule.
- **Steer them:** a pirate chalks up to three arrows on the planks, either by standing on a plank
  and facing a way, or by clicking a plank and turning the arrow with the wheel.
- **Load and fire:** powder, wad, shot into a gun's breech. A wrong order fouls the gun until a
  bucket rolls in, and a gun needs a bucket after each shot. Loaded guns fire by themselves at
  raiders at the wall in their arc. The shot knocks down everyone near where it lands, and can
  silence the raiders' cannon for a while.
- **3D twist:** pirates standing on the deck are obstacles, so stores bounce off them: your body
  is a fourth arrow.
- **Get close to chalk:** you have to be near a plank to chalk an arrow on it, so you're out among
  the rolling stores.
- **Knocked flying:** get hit by a flying cannonball and it does something really funny: you're
  knocked clean off the rampart and have to walk back up again.
- **Co-op:** one shared deck; the host's browser runs the rolling.

The user liked this. Their follow-up:

- **Bigger:** make the deck bigger, with more guns and more stores coming out of the barrel.
- **Self-contained:** keep the stores to what the deck holds, not an endless supply, so the gun
  deck stays its own puzzle.
- **Upgrades are for later:** no levels yet. Upgrading the gun deck (more guns, a faster barrel)
  is a future thought.

## Pirate looks (soon)

The user wants this "soonish": players will ask for it.

- **Choose your pirate:** a female pirate as well as the current one, chosen when you name your
  pirate.
- **Change the outfit a bit:** coat colour, hat (tricorn, bandana, none), hair, perhaps a sash
  or an eyepatch. Simple parts on the same body, so it stays cheap to draw.
- **Saved:** kept with the pirate name in localStorage, so it's there next time.
- **In a crew:** sent in the `me` packets (or on joining), so crewmates see your look and not just
  a crew colour. The crew colour could stay as a sash or the name tag, so you can still tell
  pirates apart at a glance.

## A public den anyone can drop into

The user wants the den you land in by default to be a public one, not solo: a friendly, open den
where anyone can drop in, with no cap on numbers. Private crews with a four-letter code can stay
alongside it.

Things to work out:

- **No cap:** the crew room is limited to four at present (`MAX_CREW` in `worker/crew.js`), and
  the first pirate's browser runs the raiders for everyone. With many pirates, that browser's
  upload and the size of each message grow, so the snapshots would need trimming. Pirates far
  away could be sent less often.
- **Raiders scale with the crew** (half again per extra pirate), so a big drop-in crowd needs a
  sensible ceiling on wave size, or a different scaling.
- **Drop-in, drop-out:** someone arriving mid-wave just appears and starts mending. Nobody's
  progress depends on who's there, so a pirate leaving never spoils it for the rest.
- **Solo stays possible:** keep a way to play alone (a "Play alone" button), even if public is the
  default.
- **Moderation:** pirate names are letters only already, but an open room may want a way to hide
  a pirate who's being a nuisance.

## Clay soldiers (inspired by Swordfight)

Reference: https://yppedia.puzzlepirates.com/Swordfight

In the puzzle, coloured blocks drop in pairs. Lumps of one colour, two by two or bigger, fuse into
big blocks. A breaker of the same colour smashes everything touching it in that colour, and the
bigger the blocks smashed, the harder the attack on your opponent. A drop can be two blocks, two
breakers, or one of each.

The user's problem: how do you attack the raiders coming at you without it looking weird and
artificial?

The idea:

- **Raiders drop them:** when you knock out a raider inside the den, they drop a block or a
  breaker (or one of each, as in Swordfight). They're rare, a prize, not an endless supply like
  the carpentry crates.
- **The yard:** at the back of the den is a box (a yard or tray) where you build with them. You
  stack blocks in 3D, so same-coloured blocks grow into big blocks, and set breakers to smash
  them, Swordfight style.
- **Clay soldiers:** the blocks are clay, and a breaker brings what it smashes to life as little
  clay-crafted soldiers who march off and swordfight the raiders. That answers "how do you get
  from a block to a soldier?" for anyone who doesn't know the puzzle.
- **Bigger combos, stronger soldiers:** bigger blocks and longer chains make stronger
  defenders, which keeps the Swordfight feel. A chain is one breaker setting off others.
- **Open questions:**
  - how colours map to soldiers (kinds, or just strength?);
  - whether a breaker can be thrown like a carpentry piece;
  - how big the yard is;
  - whether soldiers crumble back to clay after a while.

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
- **Rumble, as boxers:** like the Swordfight clay soldiers, Rumble could spawn troops of your
  own, but boxers: big brawlers in boxing mode, like the heavies in Team Fortress 2. How the
  puzzle maps onto them is still to work out.
- **Fill out the place:** trees, and water behind the den, so it feels like a pirate den on the
  coast. They attack from land now, but the sea is right there.
- **Ships and voyages:** later, build ships and sail off on voyages for resources: the full Puzzle
  Pirates kind of thing.
