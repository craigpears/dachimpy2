# Pirate Den: future design ideas

Ideas the user has brain-dumped for later. Nothing here is built yet. When one gets built, move
its rules into [RULES.md](RULES.md) and delete it from here. Not published with the site
(`.assetsignore` skips `*.md`).

The thread through all of them: each Puzzle Pirates puzzle should feel like *that puzzle* played
in the 3D den, the way the rampart frames feel like carpentry. Nothing should magically appear or
transform; things are made from pieces you can see, and stay as those pieces.

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
