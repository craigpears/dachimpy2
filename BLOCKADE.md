# The tabletop blockade: design document

Started 16 Nov. A faithful recreation of Puzzle Pirates' blockade, as it plays today, with bots that teach it, like
Distilling's ([DISTILLING.md](DISTILLING.md)). The task board's card: `tasks/tabletop-blockade/`.

**Not the 3D blockade.** The den already has a blockade of its own invention (ships to scale, frigates holding the
open water, sloops in the coves; `idea-a-war-frigate-and-a-sloop-on-one-board-and-a-blo`). This is separate and
faithful, sharing nothing with it (the user, 16 Nov: "this should be completely isolated from the other one. It
should just be like a tabletop version almost, where you could go into someone's on an island and they've got their
little blockade thing set out on a tabletop or something. All separate and modular.")

## The shape of it

- **Its rules, one pure module in `src/`**, knowing nothing of the den, the 3D blockade or where it's played: the
  board, the ships, a turn's moves and shots resolved, winds, whirlpools, rocks, flags and points. Randomness and the
  clock handed in, as every rule in `src/` is.
- **Its bots by tier**, playing it as a person would and saying why, in their own module, run by a `tools/` script;
  watched by link on a test page (seed, bot and speed in the URL).
- **A test page of its own** to play it on a board, flat, like `distilling-test.html`.
- **Later, a tabletop on someone's island**: the board laid out on a table, its little ships as pieces, a host
  teaching it; a place of its own in the den, touching the rest through a few thin hooks.
- **Later, its tutorial in the one shape** (`src/tutorial.ts`, [TUTORIALS.md](TUTORIALS.md)) and its read version.

## 1. The real rules

To research (YPPedia, the old guides, and the Global Cade Sim if its rules are open), each marked with its source,
anything unclear **(to confirm with the user)**:

- The board: its squares, big and small rocks, winds, whirlpools, flags (their points), the safe zone and where
  ships come in.
- The ships: each kind's size, guns (shot size, guns a side), damage it takes and can stand, its influence on a flag,
  its moves a turn, its jobbers.
- A turn: the moves placed (left, forward, right) and shots (each side), in its four slots; how each slot resolves
  (moving, turning, winds and whirlpools acting, collisions with ships and rocks, then guns), and the turn's clock.
- Tokens: what the duty puzzles give (Sailing the moves, Gunnery the guns loaded, Carpentry and Bilge the damage
  and water), how long a token lasts, the auto move.
- Flags and points: who holds a flag, contested flags, points a turn, the round's end, sinking and coming back.

## 2. Teaching it: the user's notes (16 Nov)

From the user's notepad, kept as they wrote them: what blockade nav is about, and how it might be taught. Watching
somebody navigate, 16 Nov: "it's just stuff like teaching about like hotspots, dancing."

Blockade nav challenges:

- Fastest route to the points.
- Hotspot finder.
- Risk analysis: e.g. moves that could leave you vulnerable to 6 hits are dangerous; good ones are usually about
  analysing the risks and mitigating them.
- Daily challenge spots: you "compete" against everyone else and it tells you who you scored the most against. Like
  99% chose x and you beat x, so you win. Average scores over 100 different situations and show the result at the end.
  - Risk of someone cheating by entering lots of "bad" moves that theirs beat?
- Could somehow chain them together, so it's almost like a go-to-page-X kind of story book, where you compete further
  against people who made that move, so you're rewarded for tactically positioning yourself on points etc.
- Damage management: when to trade to win points if you're up, vs staying alive so you last for the next person. How
  do you choose when to trade out? E.g. getting over half damage basically means you're going to be useless and get
  sunk by a replacement; do you want that?
- Die on the points.
  - Only sink others tactically, not at the cost of points.
- Double teaming, being teamed.
  - Incentivises trading (if teaming).
  - Avoid hotspots if at the cost of damage, but still deny the majority of points if teamed; avoid trading.
- Getting to points fast!
- Communication in teams: speak fast and to the point. No chit chat!
- XO and LA comms: tell people when you're going down.
- Comms in a multi-cluster:
  - Coordinate who's covering flags.
  - Let the other know, so they can choose to go for shots instead.
  - The ultimate win is to sink both enemies in quick succession: single sinks still leave one on the flags.
    - If you're both high damage, it's best to purposely trade out and sink yourself so you're back before the other
      ship sinks, instead of sinking together.
  - Coordinate covering each other's vulnerabilities: one covers possibility A, the second option B, that the
    opponent could do.
- Leap-frogging to deeper points clusters.
- Track if you're up or down and tell the board admiral: they need to know if you expect to win or lose, and when.
- You can reverse the damage of being down shots if your opponent is on no damage: that's why you trade when up.
- Shoot! Always shoot! Any possibilities!
- Cluster size: frigs can "cover" a bigger cluster than a brig can. Your goal is to minimise the points they gain,
  like allowing them a one-point flag but denying them the three-pointer until a replacement frig comes along, and
  surviving in the meantime. As a brig you may often "rotate" onto a big cluster when there's a need, while the frig
  comes in through the cluster you came from.
- Cluster hopping: planning a route into the global hotspot, but going through a lesser hotspot to pick up points
  along the way.
- Counting max points a turn against turns left: when is it impossible for them to win, so you can leave the board?
- Training mode?
  - Highlights hotspots.
  - Highlights a route to get to them.
  - Highlights the best ways to get there.
  - Warns you of the risks of a move? Like they could go xyz and put six shots into you?
  - Could prototype by having lots of images, swapping as you click on hotspot mode, route planning etc., with some
    limited options.
- Start really simple:
  - Like a map with two flags where there's only one obvious hotspot.
  - An obvious good and bad route.
  - An obvious good and bad cluster.
- Animated GIFs covering each tip or trick, like Factorio's, for the simpler concepts?
- A few buttons to reposition the ship in different spots, to see how it affects points coverage?
- Could almost do something like hazard detection: highlight the things that get you to the points faster, like
  whirlpools and winds facing towards the cluster.
- Modern blockade nav is more chaotic, more frigs than before: more about getting to and dying on the points?
- An interactive story (like Twine):
  - Start off with a really simple story option, like a sloop trying to get to some points.
  - Your first job is a flag sit! Someone multi-dropped, but they're all busy fighting on the most prestigious
    island. It's your job to get as many points as you can, in case they switch and come over here.
    - Choose a sloop? You don't get enough coverage, and a frig appears before you've got enough points for it to be
      impossible for them to win.
    - Choose a dhow? Great choice! Few jobbers, but much better coverage than a sloop. Only on a map where the flags
      are close, though!
    - Choose a war frig? Bad choice: we don't want to take from the main blockade. Outcome: your flag loses the other
      island because you took the jobbers.
    - A frig could come in at the end?
    - A rival sloop after a while, for a bit of a fight?

## 3. Where it's got to

- 16 Nov: started; the card, this document, the user's notes. Next: research the real rules into §1.
