# Rules and design notes

The working rulebook for the primer. When a playtest corrects something, write it down here
so it isn't lost. Two kinds of entry: facts about the real puzzle, and design rules from feedback.

## The real puzzle

- Pieces are the twelve pentominoes plus a putty bucket. Draw weights (from YPPedia):
  P 22, F 14, Y 14, N 8, L 8, T 7, W 4, U 4, V 4, Z 4, X 3, I 2, putty 1 (95 in all).
- **The toolbox holds three pieces.** You play any one of them and a fresh piece tops it up.
- A Masterpiece is a hole filled exactly, with no overlap, before it waits too long.
- Long-grain pieces (I, L, N, Y) score the Grain bonus only when lying along the hole.
- Several holes are open at once. A drawn piece that doesn't suit one hole goes into another.
- Hawkings' advice (YPPedia *Carpentry tutorial*): put the rare, awkward pieces in the odd
  corners while the hole is big; keep the flexible pieces (P above all) for the finish;
  square the hole off and work from the outside in; learn the named two-piece holes
  (Top-Notch, Dogleg, Dome, Middle-Notch, Animal, Offset, Lazy Animal, The Ship, The Rectangle).

## Design rules from playtests

- **It's a game, not a tutorial.** Short, quick-fire, with a journey and a daily puzzle.
- **Words over percentages.** Don't fill the screen with numbers. Grades, meters and rarity
  words are fine. When rarity is shown, also say how often a piece turns up as "about 1 in X"
  pieces. No decimals or percentages in the main play. **Exception:** *Which gap?* is about
  the actual sums, so it shows a percentage on each gap and the full working ("97% × 37% = 36%")
  in a fold-out panel.
- **Every choice must be a real choice.** Never show a single option. If one piece has only
  one sensible spot, offer two pieces to pick from instead.
- **There must be a right answer.** No two options may finish about as often (they must differ by
  at least a tenth and a fifth), or "the green one was stronger" splits hairs. When every move
  really is as good (often because you hold the closing piece), both show green and the feedback
  says either was right.
- **No betting on the voyage.** The bet on the last draw was dropped there; betting lives at the
  harbour table. The voyage is for earning.
- **Options must be plausible.** No obviously bad moves: every option hugs the edge and strands
  no squares. They should differ in what they set up ("leaves a Dogleg", "keeps it square").
- **Feedback must stay on screen long enough to read** before the next step rolls on.
- **The board shakes** on a bad move or a missed draw.
- **Don't say "patching"**: that's a different puzzle. Use "puzzling" or carpentry words.
- **Betting is about the three draws**, not the rarity label. Ask "you get three draws, will it
  turn up?" Betting across several holes at once is more fun than one hole at a time.
- **The trail builds up the toolbox**: one piece at the first ports, two at Tarpot Reef,
  three (the real puzzle) at Kraken's Maw and in Hole of the Day.
- **One purse for the whole site.** Earn doubloons from Masterpieces (voyage, Hole of the Day)
  and right answers; spend them on bets. Every bet is priced against the player (about an 8%
  edge), and the house refuses bets that are too likely. Gambling alone should slowly lose.
- **In-play betting is the fun bit** (like blackjack): pieces come one at a time, prices move,
  and you can add bets between pieces. Holes that don't get finished are "bodged".
- **Which pair fits?** is exactly right for teaching two-piece finishes; build more games in that style.
  Three big buttons above the puzzle (not a small slider) set how many pieces finish the hole (2 to 4; five-piece holes are too slow to build
  and have too many answers). Harder holes must feel properly rewarded, so the pay climbs steeply:
  2 pieces pay 1, 3 pieces 4, 4 pieces 10. **Guessing must not pay:** a wrong answer costs as
  much as a right one pays (in *Which gap?* anything worse than a close second costs 2).
- **Place your bets: no "A before B".** A piece only fills one hole, but the order mustn't feel
  arbitrary. If two holes need the same piece, it goes to the one with more of your money on it,
  and the prices are worked out with that rule. Stakes leave the purse as you place them, and
  the purse is shown on the page, not just in the corner.
- **Every hole on the betting table shows its odds**, two-piece holes too: how often a starting
  piece turns up ("about 1 in 2 pieces") and how often it gets finished from the pieces left.
- **Earn, then face off.** The landing page leads with two steps: earn doubloons (the puzzles,
  best payers first, with what each pays), then bet them against other pirates at the harbour
  table. The menu groups them the same way ("Earn doubloons", "Bet them"). When your purse is
  empty at the table, a clear box sends you to the puzzles.
- **Every game feeds the one purse**, and its page shows your purse and what it pays.
  *Which gap?* pays 2 for the best gap and 1 for a close second.
- **No looping animations.** The bobbing ship and spinning ring on the map hurt to watch. Movement
  should be a short reaction to something you did (a piece dropping in, a shake, a glow).
- **Keep text readable.** Nothing that matters (stakes, returns, odds) in tiny hint text.
- **Say why a move is risky in plain odds.** Every option shows "Finishes about N times in 10"
  (three draws for each piece still needed), and the grades come from that same number.
- **Odds as bookmaker's prices** ("3 to 1", "evens"), worked out from the real chance, not
  from the rarity label.
- **Make it sociable.** Pick a pirate name (letters only, no sign-up) and your purse goes on a
  leaderboard beside the game. The purse lives in the browser, so the board is an honour system
  with guard rails (no huge jumps in one go). Only ever show pirate names, never real ones.
- **Competitive play is capped.** Head-to-head games give everyone the same stake, so a big purse
  buys no edge. If you run out, you earn your way back in with the quick puzzles first.
- **The harbour table is player against player.** One shared round every 45 seconds: 20 seconds
  to bet, then five pieces for everyone. No bookie: all stakes go in one pot. If more than one
  hole gets finished, the rarest one with money on it wins. **The winners share the whole pot by
  stake**, like a horse-racing tote: put 10 of the 40 on the winning hole and you get a quarter.
  Every other bet is lost, so spreading money over every hole has a real cost, and a hole few
  pirates back pays big. Each hole shows its live tote price ("pays 3 to 1"). (Tried and dropped:
  poker-style side pots, where you could only win your own stake from each pirate. Nobody could
  follow the split, and losing bets often came straight back, so covering every hole was free.)
  If nobody backed a finished hole, the whole pot rolls over into the next round's pot. Each hole is labelled Rarest … Likeliest. House pirates
  (Cap'n Bones, One-Eyed Peg, Barnacle Bill) bet every round so there's always a pot. Stakes are
  capped at 20 a round, bets are final, and the pieces stay secret on the server until betting
  closes. The solo table against the bookie stays as *Practice bets*.
- **Who's at the table must be obvious.** A prominent panel beside the holes (above them on narrow
  screens) lists every pirate at the table, house pirates marked, with what each has on which hole,
  and after the round who won and who lost. Each hole also lists its backers by name.
- **The table fits on one screen.** All four holes in one row, a short intro with the pot rules
  folded away, and the page brings the pile into view as the pieces turn over. Betting is one big
  button per hole. **The leaderboard stays visible at the table**; the crew goes beside the holes
  only when there's room, otherwise in a strip above them.
- **Say plainly what you can win.** Each hole shows its price and what you'd win or lose if it
  wins, counting your other bets. After the round, the split panel lists each winner's stake on the
  hole and their share of the pot.
- **Stake first, then holes.** The stake is picked separately (5, 10, 15 or 20, as chips above the
  holes), then each hole's button places it. Betting on several holes at once stays: it's fun.
  (Tried and dropped: one hole per round.) The holes you've backed are highlighted.
- **Show how the split worked, as a picture.** After each round a "How the pot was split" panel
  lists every stake that went in (the winning hole's highlighted), then shows the pot as one bar
  that breaks into each winner's share, labelled with name, fraction ("1/2") and doubloons.
- **Watching is free, playing needs a name.** Anyone can watch the table; a clear "You're only
  watching" box asks for a pirate name before you can bet.
- Ideas to build next: a daily head-to-head on Hole of the Day (same pieces for everyone, a board
  of who got the Masterpiece); and *carpentry poker*: two pieces in your hand,
  the holes on the table, then shared pieces dealt like a flop, turn and river, with betting
  between each; and *crew carpentry*: a co-op Hole of the Day where the crew take turns round a
  circle, each picking one of the dealt pieces, and the whole crew shares the grade and the pay.
- Dropped ideas: *Commit or wait* (not interesting).

## Pirate Den (3D prototype, `den.html`)

Unlisted for now: reachable only by its URL until the user says to put it in the nav.

- **A pirate mends a den wall.** Pieces sit on three crates (the toolbox); you carry them over and
  fit them into holes in a stone wall. Same pieces, weights and Masterpiece rule as the main game.
- **You can never get stuck.** Like real carpentry, a piece may be nailed over the stone around a
  hole ("boarded over"). That always closes the hole, but it's a botch: weak and pays little. A hole
  filled exactly is a Masterpiece: strong, and pays well.
- **Masterpieces make the wall strong.** Raiders hack at mended holes: a boarded hole falls fast, a
  Masterpiece holds. Any wood at all (even one piece in an unfinished hole) has to be hacked
  through with swords first. No magic jumping through a hole that has wood in it. A thief whose way
  out has been mended hacks out from inside.
- **Raiders walk in, they don't jump in.** The user found raiders hopping through tiny gaps high up
  the wall "weird and dumb". Only an empty hole with a gap at the foot of the wall two squares wide
  and three tall lets them walk through. A smaller or higher empty hole is a **weak spot**: they
  hack at the stone round it (8 seconds of hacking, like one piece) until it gives way into a bigger
  hole down to the floor, and walk in. The bigger hole is still whole pieces' worth of squares and
  can always be filled exactly, so the crew can mend it; one piece in the gap stops them again.
  Every wall's holes start off the floor, so every hole is a weak spot until it's widened. The
  user liked it: it's an incentive to fill gaps early and close them off.
- **Every bit of mending counts; it's never all or nothing.** The user: partly filling a hole or a
  sloppy job should still turn a few raiders away, and when they do get through there's always
  something you can do. Tested 7 Nov 2026 (simulated waves with no cannon, nobody throwing):
  - *Nothing mended:* every raider gets in, the first after about 15 seconds.
  - *One piece in each hole:* all of wave 1 turned away, about 60% of wave 3, a quarter of wave 5.
  - *Boarded over (sloppy):* all of wave 1 turned away, about a quarter of waves 3 and 5.
  - *Masterpieces:* every raider turned away, waves 1 to 5.
  - *Mending during the wave* (one piece every 8 seconds, gaps they can walk through first): wave 5
    went from 9 of 12 raiders getting in to 2 of 12.
- **Getting through costs them: they arrive winded.** Covering a hole felt like nothing, and the
  user wanted hacking through to weaken the wave. A raider's strength (16 seconds of hacking) runs
  down as they hack; one who's used much of it comes through bent double, hands on knees, puffing,
  and stands just inside the wall catching their breath (up to 6 seconds, the more tired the
  longer). Then they go for the chest and back out up to 40% slower. That's the window to knock
  them flat with a thrown piece. The first time in a wave it says "Through, but winded: knock them
  flat!" (kept short: a long line filled a phone screen). One who walked in through a gap someone
  left open arrives fresh.
- **Throw pieces at raiders, don't bonk them.** A plain bonk was underwhelming. The carried piece
  is the weapon: it hurls at a raider, who goes flying. It costs the piece.
- **A thrown piece takes a while to come back.** Otherwise you could stand and pelt raiders
  forever. The crate you threw from takes 7 seconds to restock on your own, about 0.6 less for
  each crewmate (5.2 with four), and shows a "Restocking" bar; fitting a piece still restocks its
  crate at once. (It was 8: the user found it close but a touch slow, more so with more pirates.
  Marginal changes only.)
- **You can see the toolbox from anywhere.** A strip along the bottom of the screen shows what's on
  each crate, left to right as they stand: the piece in its wood colour, "In hand" for the one you
  took, a restocking bar, or "Taken" when a crewmate has it. So you can plan your next piece from
  the wall rather than walking back to look (the user: "so that it runs a bit faster"). It's
  hidden on the gun tower and while decorating.
  **And you take pieces from it with 1, 2, 3.** The crates are numbered left to right, and each
  tile shows its number rather than the piece's letter (the user: "instead of showing T, U, F, it
  should show like 1, 2, 3"). Pressing the number, or clicking the tile, takes that crate's piece
  into your hands from anywhere in the den, no walking back (the user chose anywhere over only by
  the crates). Holding another crate's piece, it swaps; the same number again puts it back. Not
  while you're holding a piece lifted out of a frame (fit that first).
  Each piece is drawn the way the main game draws its pieces (`js/render.js`): one solid piece with
  its grain and only its outside edge, in the den's wood colour. (A first try drew separate little
  squares; the user: "why are they in squares just joint from each other instead of one piece?"
  No new art styles: reuse the game's own.)
- **Throwing has its own controls.** Shift (next to WASD; R was too far away) or clicking on a raider. Space
  and plain clicks only pick up and fit, so you can fight beside the crates or the wall without
  fitting by mistake. Up on the rampart Space throws too, since there's nothing to fit there.
- **Throws go where you point.** Shift, Space on the rampart, and clicks all hit the raider by the
  mouse pointer (its body or its ⚔ marker, even pinned to the screen edge), not just the nearest;
  only with nobody near the pointer does it pick the nearest. That raider's marker gets a white
  dashed ring, and the pointer turns to a crosshair over a raider you can hit.
- **Misplaced pieces can be taken back.** Placing one square too high was a frustrating misclick.
  With empty hands at the wall, Space (or Backspace) takes the last piece you put up back off, the
  same way round, so you can fit it properly. Not once it's made a Masterpiece, once another
  piece has gone on, or once you've picked up a new piece from the crates. A boarded-over hole you
  undo goes back to open and gives back its pay; damage the hole took meanwhile stays.
- **The rampart: a walk along the top of the whole wall,** with stairs up at both ends. Raiders hacking
  at the wall can only be hit from up there; it's what makes a Masterpiece pay off: while it holds,
  you go up and knock the raiders off it. The view swings up high to look down at them. Keep it out
  of the way (not in front of the gate), and the full length of the wall.
- **The rampart is built a stretch at a time, as the reward for beating a wave.** Order: left
  stretch, then right, then the middle.
  - **One frame at a time.** When a wave is beaten off and nothing is still being built, timber
    arrives for the next stretch. Its frames come one after another, each only when the last is
    done, so there's never more than one to get on with. The second frame appearing before the
    first was done felt rushed.
  - **Walk only on what's built.** You can only walk where the walk's pieces actually are.
- **It's built by carpentry, piece by piece, not by magic.** A footing hole opening in the wall was
  bizarre, and a stretch popping up was too easy. A finished frame then turning into a ready-made
  rampart was magic too. **Every part of the rampart is the pieces you fitted, and they stay those
  pieces.** Nothing turns into anything else, and nothing is added that you didn't build.
  - **The walk:** a frame laid flat on the den floor in front of the stretch. It's two full rows the
    width of the stretch, so the stretches join up, plus a ragged third row. You lay pieces in it one
    at a time and watch it come together. When it's full the crew haul it up on ropes, pieces and
    all, and lay it along the top of the wall.
  - **The stairs (end stretches):** a frame standing upright at the end of the den, a stepped
    stringer from the floor up to the walk. You fit pieces into it like a hole in the wall, and the
    pieces are the steps. Half-built stairs are in the way; you can't walk through them.
  - **Any piece will do:** a piece may stick out over the frame's edge. On the walk the spare is
    sawn off when it's full (it has to lie flat on the wall).
  - **The stairs stay exactly as built, never changed by magic.** Nothing's sawn off: bits sticking
    out stay, and you walk on the real tops of the pieces. A one-square step you walk up; a
    two-square one you hop up. So the stairs stay climbable, a piece can't stick up more than one
    square above the tread line.
  - **A gap is never filled for you.** (Gaps no piece could reach used to be plugged with
    offcuts; the user: "if there's a gap, that's it, that's broken. That's the point of it being a
    puzzle. You've got to make the things fit.") The way out is to lift pieces back out: any piece
    in a frame that isn't finished, anyone's, by pointing at it (or standing by it, with the
    keyboard) and pressing Space or clicking. It goes into your hands.
  - **Shipshape:** every frame's shape can be filled exactly. A frame filled with nothing sawn off
    is Shipshape and pays a bonus.
- **Up on the wall must stay bright.** The fog keeps its distance from the camera and the view
  brightens as it rises; looking down from the rampart went murky otherwise.
- **Co-op crews: everyone collaborates, nobody gives orders.** Up to four pirates defend one den
  together. No sign-up: a pirate name (3 to 16 letters) and a four-letter crew code, shared as an
  invite link. Every pirate does every job equally. One browser quietly runs the raiders and deals
  the crates, but that's only whose computer does the sums: never call it a captain or show any
  hierarchy. If it leaves, the next pirate in carries on; if your link drops, you carry on alone with
  the den as it was. Only pirate names are ever shown, never real ones.
- **In a crew, things can't be taken twice.** Taking from a crate or fitting a piece is checked
  first, so two pirates can't take the same piece or fill the same spot; whoever loses gets their
  piece back ("Someone got there first"). Waves get bigger with more pirates (half as many again for
  each extra pirate). Crewmates wear their own colours with their name over their head.
- **Keep the pirate-den feel, not medieval.** The rampart is a timber walk like a ship's deck, not
  stone battlements. Any rail or trim on it has to be built from pieces as well, or left off. (Flags
  are the exception, since the user asked for them: Jolly Rogers you design yourself, see below.)
- **Some jobs want accuracy, some want speed.** The user loves the variety: the stairs are rapid
  speed carpentry (any piece will do, just throw them in), while the wall holes and the wall-walk
  reward care. Keep that mix when adding jobs.
- **Keep the opening message short.** The first-screen instructions covered the crates so you
  couldn't start. One or two lines at most, clear of the crates; the prompts and toasts teach
  the rest (boarding over, nailing on behind, the rampart) as it comes up.
- **The layer behind must invite you.** The user didn't feel prompted to build a second layer. So
  while you carry a piece, every mended hole with room shows a pulsing outline on the den side
  where the next layer goes, its label says "room for a layer behind", and once every hole is
  mended the prompt sends you there. (Grading those layers is in IDEAS.md.)
  **And it must be easy to see.** A thin outline was too faint: the user could see "it's trying to
  draw a second shape" but couldn't make anything out. So the layer's squares are filled in a
  pulsing light blue with a bold outline (bars, not a hairline), and the board you're about to
  nail on is a green ghost with a bold white outline (wood-coloured, it got lost against the wood
  in the hole). Every ghost gets the bold outline.
- **Snapping goes where you point.** Boards behind a hole snapped a square or two off, so you
  couldn't line one up: the pointer was read on the stone face while the boards stand out towards
  you. Every spot is matched to the pointer at its own depth. **And the preview must sit on the hole from
  any angle.** The user found the real cause of it still looking off: the boards behind were
  full-depth pieces standing half a metre out, so from the camera's angle the ghost showed about
  half a square below the hole. Boards behind are now planks (14 cm) right against the hole (or
  against a piece boarded over it), each layer in front of the last, and the ghost and the blue
  layer hint sit there too.
- **If it shows you where a piece would go, you can put it there.** With the mouse, you can fit a
  piece from as far back as the preview shows (2.5 m further back than before) and a little further
  along the wall; taking one back works from as far. The user: no value in having to walk closer.
  **That reaches the next hole along** (6 m with the mouse, measured to the piece): holes come in
  pairs about 4 m apart, and from in front of either you can fit a piece in the other. The user:
  "you can place it on adjacent holes. You don't need to walk right up to them." Not across the gate.
  (With the keyboard, stand at the wall as before: it decides between the wall and the frames on the
  floor behind you.)
- **The pirate walks a touch quicker** (5.4 m/s; was 4.6, then 5). The user and a friend both
  wanted the pace a bit quicker.
- **The piece goes where you point.** The user and a friend found it hard to put pieces where they
  wanted. With the mouse, the spot chosen is one that covers the square under the pointer (then the
  one centred nearest it, and a clean fit before boarding over), from a little further off too. It
  holds steady: once the ghost snaps somewhere it stays until you clearly point somewhere better,
  rather than flicking between two spots. This is easier snapping, not auto-play: the piece is never
  turned for you (below).
  **Pointing into the hole means fit it in the hole.** At first, covering the pointed square won
  even if that meant hanging over the stone, and the user saw the ghost sitting off to the side of
  the hole. The ghost was showing the true spot, but the spot was wrong. Now a clean fit nearby beats
  boarding over while you point into a hole or frame. To board over, point at the stone beside it.
- **One breach doesn't let everyone in; the wall you kept strong pays off.** Raiders used to make
  for any open gap along the whole wall (or else the weakest hole), so once one hole went, the
  whole wave poured through it. Now each raider attacks the hole in front of where they come up to
  the wall, and only switches to a breach within about 3 m. Raiders at a Masterpiece mostly tire
  and leave. (They now also need a gap they can walk through: see "Raiders walk in" above.)
- **The gun tower (after Gunnery): it must be instantly recognisable as Gunnery.** The user knows
  the puzzle well, and the first tries missed it: stores bounced into the guns by themselves, the
  deck was too small, the pieces were tiny and hard to tell apart, the bucket and the arrows
  unreadable, and the guns faced the wrong way for the puzzle. So: pay attention to the specifics
  of the real puzzle, and the graphics must look like Puzzle Pirates, not some other 3D game. But
  it must still make sense in the den: the gun you load is the gun that fires, and you see it fire.
  - **Playability and readability above anything.** Making things look better in 3D tends to make
    them harder to pick out, so push contrast and boldness as far as it will go: bold black
    outlines round the stores, crates, guns and barrel as Gunnery draws them; the deck toned down
    close to Gunnery's deck brown so everything on it stands out; stores a size up, lit from within
    a little and with a soft glow under each; arrows big and bold. Colours on the board are drawn true
    (not washed out by the scene's light or haze).
  - **Where and how big:** built last, after the whole rampart: a square platform jutting out from
    the wall over the gate like a bastion, **the size of a Gunnery board, 13 by 13**. One square of
    a carpentry piece is one square of the board. It's built of ordinary pieces in three frames
    (5, 5 and 3 rows, from the wall out), laid on the den floor and hauled up and out over the wall
    one after another. The deck still shows the pieces you laid, toned down. You walk out onto it
    from the wall-walk; the camera then looks down on the whole board, like the Gunnery screen.
  - **The rules are Gunnery's:** a barrel in the middle rolls stores out each way in turn till
    there are two of each on deck; one used, another comes. A store rolls straight; blocked it
    turns right, else left, else back; two that meet both turn back. Arrows steer them, three each,
    the oldest going when you chalk a fourth. Guns load powder, wad, shot; a bucket swabs a fired or
    fouled gun; the wrong store fouls it. Your body is an obstacle too.
  - **The guns lie as in Gunnery: two down each side, muzzle out, with a lane between the muzzle
    and the gunwale.** You load a gun by guiding stores in front of it and in: **a store only goes
    in off an arrow in the lane pointing into the muzzle**; otherwise the gun's an obstacle. (The
    user: pieces going in front of the cannons and being guided in is key to recognising it.)
  - **Firing:** a loaded gun with something to shoot at is run out over its lane (once the lane's
    clear; while out it blocks the lane) with its muzzle through the port, **swivels on the port**
    to aim, forwards at the raiders coming in and their cannon or back along the wall at those
    hacking at it, fires from its own muzzle and recoils back in, square again. They don't all fire
    at the same raider. Every gun is worth loading.
  - **One raider, one gun.** Two loaded guns on one side both ran out at the same raider, then one
    hauled back in; the user found the lunge and back-off weird. A gun now claims its target and
    keeps it till it fires, and the others only pick from who's left (or the raiders' cannon). With
    nothing left to aim at, a loaded gun stays in.
  - **What's in a gun shows in the gun, as in Puzzle Pirates.** The user: whatever's loaded should
    visibly show in the cannon. An open trough along the top of each barrel holds a little copy of
    each store rammed in: powder by the breech, then the wad, then the shot by the muzzle, each
    popping in as it's loaded. The trough glows when it's ready to fire, goes red when fouled, and a
    fired gun smokes until it's swabbed. The gun's label hangs out over its gunport so it never
    hides the barrel.
  - **The board:** no crates round the barrel in the middle, none in the lanes, more out towards
    the edges, never side by side, making pockets that trap a store and loops that bring stores back
    past a gun. Each new board is tried out (stores rolling with no arrows) to pick one where about
    two guns sit on a loop of their own and the rest take more work: as in Gunnery, it's easy to
    load two, harder to load all four, and making loops (or freestyling) is the core of it.
  - **The look:** bright silver guns three squares long, a red gunwale with a gold rail, light-wood
    crates of shot and rum, the barrel on its side; shot bright iron, powder a red bag with a flame
    on it, wad a white puff, the bucket **drawn flat, as Gunnery draws it**
    (a tin pail with blue water, its handle and swab, always facing you: the 3D one looked bizarre).
    Crates sit square to the board, never angled: a puzzle has to read at a glance, so where 3D
    and readability pull apart, go for Gunnery's flat, 2D feel.
    **Arrows are yellow, as in Gunnery** (not blue: the user corrected this): a bold yellow arrow
    with a dark edge on a square lit up yellow underneath; a crewmate's in their own colour. Gun labels show the
    store each wants next as a picture; "Loaded!" in Puzzle Pirates yellow and red. A key to the
    stores shows while you're on the tower.
  - **The mouse works as in Gunnery:** click a plank to chalk the arrow the ghost shows, drag the
    way you want it to point, the wheel turns it (it never zooms on the tower), click an arrow to
    turn it, right-click to rub it out. Space chalks the plank ahead of you, Q/E turn it.
  - **To try it straight away:** `den.html?try=all` (or `?try=gundeck`) starts with the rampart,
    gun tower and house built and you up on the tower, for the user's own testing. It must load
    fast: it once took about a minute, because the engine's solver works row by row and a long,
    thin frame (the tower's 3-row strip, a wall-walk) sent it backtracking for ages. The den's copy
    of the solver turns wide frames on their side and solves them column by column (a millisecond),
    which also stops the game stalling when a new wall-walk frame is laid out.
- **Making it yours (pirate looks and the den's dress).** The user wants players to be able to make
  it all their own, and the general feel must match the rest of the den. Code: `js/den-look.js`
  (the pirate builder, dyes, familiars, flag drawing) and the "dressing" and "decorating"
  sections of `js/den.js`. **Two panels, two buttons:** **Your pirate** (Pirate, Clothes,
  Familiar) and **Your den** (Flag, Den, Shack). The user: Your pirate is no place for the den's
  things; that's a separate concept. (Your den shows your flag where Your pirate shows the pirate.)
  - **Pirates:** male or female, dressed from the real Puzzle Pirates tailor (YPPedia's clothing
    names: Tricorne, Feathered hat, Captain's hat, Sleeping hat, Striped shirt with vest,
    Swashbuckler's jacket, Corset, Stripy knickers, Pantaloons, Kilt, Long dress bottom, Buckle shoes,
    Curled boots and so on) in the tailor's standard palette of 27 dyes (YPPedia: Clothing palette).
    Skin, hair style and colour, beard, eyepatch, earring. Kept in localStorage (`carp.den.look`),
    and crewmates see it (a `look` message; anything received is cleaned against the lists). The
    crew colour stays on the name tag. "Surprise me" picks a random outfit.
  - **Whatever you wear on your feet must always show.** The user couldn't see the feet of a pirate
    in a long dress. So skirts stop above the ankle, aren't wide at the hem, and the feet come a
    little forward under them.
  - **Familiars** (YPPedia: Familiar): a parrot (two colours), a monkey (natural colours only, as in
    the game) or an octopus, on the shoulder, each with a little life (bobbing, flapping, tail).
  - **The shack stays small and open at the back.** The user loves its size ("it gives it a lot of
    character") and having no back is essential to see inside and decorate it: "a cheap, simple
    lean-to thing". Don't add a back wall. The camera follows you right to the back of the den
    where it stands (it used to stop short).
  - **The house is built like everything else.** The user: "you should build it in a carpentry
    style way, the same as you build the decks: you put something on the ground and it starts
    hoisting it into the side of a house". Its four parts (front wall with a door and window, two
    side walls, a lean-to roof) come one at a time as frames laid on the floor by the cave wall on
    the left. Fill each, it's sawn to fit, then hoisted on ropes and swung into place. Its timber
    never comes on its own after a wave, and building it never holds up the rampart's timber.
  - **The shack's plot is there from the start, and it's obvious what to do.** The user loved
    building it but it was hidden in a menu: "you should be able to walk into that corner and it'd
    be clear that there's an action". Its footprint is chalked out on the floor in the far left
    corner, with pegs, a line round it and a "Your shack" sign. Walk in: "Space: build your shack
    here". Once it's up, the same spot says "Space: paint and dress your shack" and opens Your den
    at the Shack tab.
  - **You see the carpentry pieces it's made of.** "It's my little shack. It's made of carpentry
    pieces" (if not as blatantly as the frames). Each piece has a bold dark edge on both faces, and
    paint (walls and roof, any dye) lets each piece's own timber show through.
  - **Decorating is placing things yourself, as in a Puzzle Pirates house:** "just having flags
    appear isn't what you want". Decorate mode: pick a Jolly Roger, a banner, a lantern or a rum
    barrel, a ghost of it follows the pointer, wheel or Q/E turns it, click puts it down,
    right-click takes one down. A ring shows green (fine), red (not there) or amber (one's here).
    Never in front of the wall (z < 5.2, where you mend and build), on a frame, in the house or by
    the crates. Up to 24 things. They stay put game after game. **It must be obvious how to start:**
    the user couldn't find it in the Your pirate panel, so it has its own **Decorate** button next
    to Your pirate (it reads "Done decorating" while you're at it) and the **B** key.
  - **Flags are yours to design:** emblem (skull and crossbones, skull and cutlasses, anchor,
    kraken, bleeding heart), cloth pattern (plain, border, stripes, hoist band) and three dyes. The
    den's own flags (over the gate, on the gun tower's outer corners, on the house roof) fly your
    current design; ones you put up keep the design they had. The den's dress (flag, paint,
    decorations) is kept in localStorage (`carp.den.den`) and shared with the crew (a `den`
    message, and in the sync a joiner gets).
  - **Even the silly things are yours to change.** The user wants to decorate everything, "just all
    silly things": the gun tower's gunwale, rail and crates take any dye (or Gunnery's own red,
    gold and light wood); painted crates keep a hint of their wood.
  - **Pick your landscape:** a barren cave (as it started), a seaside hideout (sand, sandstone,
    palms, the sea and its surf out beyond where the raiders land) or a jungle hideout (mossy
    ground and rock, big trees, ferns at the foot of the cave rocks). The user asked for "something
    simple for right now". Only the look changes, never the play: trees stand out past the raiders'
    cannon, beyond the wall's ends and behind the cave rocks, and ferns never go where the house is.
    These are on Your den's Den tab, kept and shared with the rest of the den's dress.
- **Future ideas live in [IDEAS.md](IDEAS.md).** When the user brain-dumps ideas for later, note
  them there rather than building them.
- **There's always something to do with a junk piece.** Holding three useless pieces with nothing
  to do was frustrating. Any mended hole (Masterpiece or boarded) takes boards nailed on behind it,
  on the den side, up to three deep, damaged or not. They're a second (third, fourth) layer:
  raiders hack through the hole's own wood first, then each board in turn, one at a time, and only
  get in once the last is gone. While boards hold a hacked-open hole, it can't be refilled; you can
  keep nailing more on. Boards may cover the hole's wood and the stone round it, but not another hole
  or the gate. Clean fits and boarding over come first when choosing a spot; boards behind come last.
- **The camera can be turned and zoomed:** Z/C or right-drag to turn and tilt, -/= to zoom, V to
  reset. **It turns all the way round**, so you can see the outside of the wall (the user wants
  that, especially for decorating it); moonlight from outside lights the wall's outer face.
  Walking follows the way the camera faces. Q/E turn the piece, right-click flips it.
- **You turn the pieces yourself; nothing turns them for you.** Making the carried piece turn
  itself to the best fit was tried and dropped: the user felt it cheapens the puzzle. Speeding the
  carpentry up belongs to a 2D mode instead (IDEAS.md).
- **The wheel turns the piece whenever it's showing a spot to fit** (that's what it was for first);
  only otherwise does it zoom.
- **Throwing at a raider is the only way to discard.** No scrap fire, no bin: a piece you don't
  want (often a rare one) can only be got rid of by throwing it at an enemy pirate, which deals a
  fresh piece onto that crate. Swapping at the crates just puts it back. With no raiders about,
  you fit it, board it over, nail it on behind a mended hole, or lay it in a rampart frame.
- **You must see what's happening in the den.** Raiders inside get a ⚔ marker, pinned to the edge
  of the screen when they're out of view (gold when carrying loot). The view widens on narrow screens.
- **Keeping them out must be possible, and must feel worth it.** The user found it demoralising
  that raiders got in "no matter what": there seemed no point stopping them. The cause was the
  raiders' cannon, firing every 9-20 seconds from wave 2, each shot an open hole a raider was
  through two seconds later; nobody can mend that fast. (Tested: with every hole a Masterpiece and
  nothing else done, six raiders still got in over waves 2 and 3.) Now:
  - **The cannon has a few shots a wave** (one in wave 2, two in wave 3, three after), the first
    about 20 seconds in, 22 seconds apart.
  - **It aims first, for 8 seconds**, the spot glowing red on both faces of the wall with a
    countdown ("Their cannon's aiming here!"). A hit from the gun tower spoils its aim.
  - **A fresh breach is choked with rubble**: raiders must hack 10 seconds of it clear before they
    can climb through, and a piece fitted into it clears it. Its label says so. (Cleared, it's
    like any other hole: if it's too small or high to walk through, they hack it wider first.)
  - **A raider who tires at your wall is turned away**: +5 doubloons, a cheer, and a "Turned away"
    count on the HUD. Each wave ends with how many you turned away and how many got in, and a wave
    where not one got in pays +10 more (the user wanted more reward for blocking them off).
  - **Raiders always have swords.** (Swordless early waves were tried and dropped: the user
    prefers to balance how quickly they chop through.)
  - **How fast they chop is the balance.** They start slow and build up: 55% of full speed in wave
    1, 15% more each wave, full from wave 4. Each piece in an unfinished hole takes 8 seconds of
    full-speed hacking (it was 4, and a half-mended hole fell in seconds). To experiment:
    `den.html?hack=0.8` scales all hacking; in the console, `den.tune` (hack, start, step) and
    `den.HP` (master, boarded, piece, patch) change it live.
  - **Balance tests** (a test player getting one random piece every 12 seconds, best of three,
    fitting it exactly if it can, else boarding over, else nailing it on behind; four waves, three
    runs each; chest at the end, starting from 60): full speed from wave 1 with pieces at 4, lost
    in wave 3 every time; the slow start alone, lost in wave 3 or 4; pieces at 8 alone, survived
    with 2-16 left; slow start with pieces at 6, 16-60; **slow start with pieces at 8 (now),
    35-131**, wave 1 usually held completely and wave 4 a real fight.
  - (Tested: a steady solo player fitting a piece every 10 seconds lost nothing in three waves
    and turned nine raiders away. Holes still wear down wave on wave, so boards behind matter.)
- **You can pause.** A Pause button by Your pirate, or P (P, Space, Enter or Esc carries on).
  Everything stops: raiders, the wave timer, the Gunnery stores. It also pauses by itself when you
  switch away from the tab. Only when playing on your own: with a crew the raiders don't wait.
- **Give enough time to build.** A piece takes about ten seconds to fetch and fit, so the first wave
  waits 75 seconds and starts small.
- **The den has a gate** and raiders attack from the far side of the wall, with swords and (from
  wave 2) a cannon that blasts fresh holes (a few a wave, aimed first; see above). Keep
  repairing. **The cannon stands well back** (16 m
  out, behind where the raiders gather): with the gun tower jutting out, the user found it too far
  forward at 10.5 m.
- **A hole is open right through the wall.** The user likes the empty holes, a "nice incomplete
  wall": no backing behind them that looks like cladding or boarding. The dark behind the stones
  (hiding the gaps between them) has the holes cut out of it, including fresh ones from the cannon.
- **You must be able to see the raiders.** Behind the wall they show as red silhouettes through
  the stone; labels over each hole show its strength and who's attacking it.
