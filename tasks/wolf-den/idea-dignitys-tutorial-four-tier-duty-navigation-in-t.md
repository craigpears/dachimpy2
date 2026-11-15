---
title: Dignity's tutorial: four-tier Duty Navigation in the werewolf den
status: idea
asked: 13 Nov
updated: 15 Nov
---

*Dignity's tutorial: four-tier Duty Navigation in the werewolf den (13 Nov)*

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
  "fren" is. (The multicoloured place is a wild slot: the guide below.)
- **A full guide to wolf dens (14 Nov):** "Wolf Dens Guide" by a player on r/ypp (Reddit couldn't be read here;
  the Google Doc could). What it settles, in our own words:
  - **The den:** on Woodhallow Isle, after beating werewolf ships at sea (a sloop or cutter's expedition). Six
    rounds, each a Rumble against a pack of wolves, then a puzzle window where the crew splits between
    Navigation and Foraging stations along the island's path (the beach, the village, the lair past gate 2).
    The pack is crew size times 1, 1.3, 1.7, 2.25, 2.9, 3.75 by round; its share of werewolves (full health,
    a bludgeon) grows from about half to all of it. Charting at Navigation turns werewolves back into
    wolf-kin (half health, fists) before the next pack. The window is 2:00 after round 1, then 2:00 plus
    3:00 times the share of the crew still standing. Once the last werewolf's turned back, everyone goes and
    forages, which is what pays.
  - **"Four-tier" is the board's four rings, most likely:** centre, middle, third and a fourth, outer ring
    with no slots, "extra room, mainly for setting up chains" (a star there stays up only over a full column,
    and turns with its ring). Ours has three rings, the next star waiting outside them; the real outer ring
    is that space, playable.
  - **Constellations:** normally 3 slots in the centre ring, 2 in the middle and 1 in the third; a fresh
    board's first has 1 centre slot only. Ours grows from 1 star to 8 instead.
  - **Scoring:** each ring scores weight times (1.5 times its slots) squared, rounded down, the weights
    centre 3, middle 5, third 9: the first constellation 71, a standard one 125, one with 4 centre slots 173.
    In a chain each step's points are times its step: a clear then the chart doubles it (250), two clears
    triple it (375). Only clears before the chart multiply it; a line is 3 points (6 or 9 in a chain). The
    constellation's checked before lines, as ours already does. So in the screenshots: "Single! +3" and
    "Double! +6" were the first two clears, and "Triple! Constellation! +213" a chart on step 3 (71 times 3,
    a fresh board's first constellation).
  - **Wild slots (dens only), the multicoloured place:** a paw print ringed in every colour, filled by any
    star. A constellation charted in a chain (a clear before or after it) deals the next with its 3 centre
    slots wild; two or more clears add a fourth wild centre slot; a clear also turns wild any slot on or
    beside the cells it cleared. A plain chart breaks the run. So in a den, finish every constellation with a
    chain.
  - **The moon:** each window starts full, about 200 charted points per werewolf in the next pack; each
    chart takes its points off, and the moon's percentage of the werewolves are left (chat says when half
    and when the last are turned back). The duty report draws each chart as a moon: thin for no chain,
    fuller for a chain of 2, full for 3 or more.
  - **Named chains (the guide's names, not the game's):** a Trapdoor clears then charts (a pair parked on
    the ring above a slot, turned so a line clears and the right star drops in; multiplies the chart, and
    works in normal Navigation too); an Echo charts then clears (a pair in the centre ring beside a slot, so
    the stars falling into the emptied slots make a line; only wilds the next centre); "H" along a ring, "V"
    down a column; Edge Pair, Sandwich, and a Trapdoor into an Edge Pair (clear, chart, clear). A triple
    needs about eight stars in exact places and rarely pays the time; a double by Trapdoor is the workhorse.
    Don't reset the board: its first constellation is worth only 71.
  - Also in it: Rumble targeting (one on one, when to defend), when to retreat, the den's Foraging with its
    wolf head and moons, and its loot. Still unknown: "fren" (not in the guide).
- **Who explains it (14 Nov):** Multibella (a real pirate; her pronouns "she/it/they", in her own words via the user, 14 Nov:
  "Multibella tells ye, 'she/it/they'"; before that the user asked for neutral ones) was about to explain to the user how the chain counts (one move, as the guide says,
  or a streak across drops). The user: "I think [they] could win the [duty nav] explanation slot if so", so if
  their explanation is the one that lands, they may be the one credited for it (or teaching it) in the
  tutorial. To settle with the user once they've explained it.
- **Settled (14 Nov), from another still of the same run:** it's one move's chain, as the guide says. The user:
  "it is a single. He clears the oranges, and then the red comes down, which I guess is what turns it wild
  because it was a combo, and then you get it. Okay, that makes sense." The oranges' clear (Single, +3) turned
  the constellation's place beside it wild (a clear in a chain wilds any slot on or beside what it cleared), the
  stars falling after it made the second clear (Double, +6), and a red falling into the wild place charted it on
  step 3: the board's first constellation, 71, times 3 is the +213.
- **Multibella's explanation (14 Nov, pasted by the user), the correction:** two ways to make wilds:
  - a constellation charted as part of a combo makes the next constellation's centre ring wholly wild;
  - a combo that charts no constellation turns the places it cleared, and the places beside them, wild.
  In the run: the reds' clear on "Double" turned wild the constellation's place that already held a blue
  star (the wrong colour till then), and with it wild the blue counted, so the constellation charted on the
  "Triple" step. No star had to fall into it. (Matches the guide; Multibella's the clearer telling, and the
  one to credit for the explanation.)
- **Multibella in the tutorial, with cookies (14 Nov):** the user: "everyone loves cookies, so [Multibella] can be
  munching on choco chip cookies while they wait for you to finish what they've helped you set up." So
  Multibella (they) is in it too, the one who explains the wilds: they help you set up a combo (a clear beside a
  wrong-coloured star), then stand by munching chocolate chip cookies while you finish it. A nod to Dachimpy's
  cookies at their house. Their look from their pirate page, checked before they're drawn.
- **Funny cutscenes, and Multibella at a star table (14 Nov):** "For the Wolf Den tutorial, we'll need some funny
  cutscenes ... [Multibella] ... sneaky episodes ... make sure the werewolves don't turn ... see her like really
  rapidly turning the duty nav things, maybe kind of on a table." Inspired by the glowing star-map tables of space
  films (an inspiration for the feel only, nothing copied): a round chart table in a dark hut on the island, the
  Duty Navigation wheel laid on it, its rings glowing, the stars lifting off it as she spins them frantically while
  the moon outside wanes, a werewolf's shadow at the window turning back into a wolf-kin's with each chart. "That ...
  kind of werewolf moon kind of symbology would be quite close." The moon on the board (the den's moon, the guide
  above) fits it: the table's light is the moonlight. To shape with the user.
- **Why Dignity teaches it (14 Nov):** the user: "Maybe we could put Dignity in the game as [the one] to get [it
  from], because ... she's got to catch these pesky pirates trying to figure out the ways they're going around
  their little outpost." Dignity, the checkpoint's commander, charts the stars to find the hidden ways pirates
  sneak round her outpost (the starlit door is one), so she's the natural teacher of Duty Navigation, and her
  lesson has a reason in the story: she's training you to hunt them, or you're learning her trick to slip past.
- **Its basics taught, as what's different (14 Nov):** unlike the other tutorials, this one explains the mechanics,
  since a wolf den's Navigation isn't plain Duty Navigation: how it works and how it differs. A wider explainer of the
  werewolves themselves to come one day. TUTORIALS.md §5.
- **A first version built (14 Nov):** the wolf den's hut (den.html?at=wolfden) with Multibella (Dignity at first) at its star table, the
  four-ring board with wild places, the moon in the window, her lesson, and its read version, wolf-den-guide.html
  (RULES.md, "The wolf den"). Still ideas: the rumbles, the den's Foraging, Multibella at the table with the cookies
  (their look from their pirate page first), the funny cutscenes, a way to it on the sea.
- **Vessel navigation training there too, maybe Daquan's (14 Nov):** "maybe this is where Daquan comes in, is doing
  the VNav training ... I think it'd probably be like Blockade training ... Blockade Sim is definitely where you go to
  PvP and fight each other, but definitely I think we fit into that training, the training tutorial version of it. It
  would be funny just to have those giant wolf rigs, and you could kind of see the sloops maybe competing in the
  background ... Something will be fun." So a tutorial of vessel navigation (sailing a ship in a fight, as in a
  blockade) at the wolf den, perhaps taught by Daquan: the training version, the Global Cade Sim staying the place for
  fighting each other. Giant wolf rigs (sails, or ships, dressed as wolves) to sail, sloops racing past in the
  background. To shape with the user: what's taught, and Daquan's part (his look and ocean first).

## Log

- 15 Nov: moved over from IDEAS.md.
