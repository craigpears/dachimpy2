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
  Masterpiece holds. Only a completely empty hole lets raiders straight in; any wood at all (even
  one piece in an unfinished hole) has to be hacked through with swords first. No magic jumping
  through a hole that has wood in it. A thief whose way out has been mended hacks out from inside.
- **Throw pieces at raiders, don't bonk them.** A plain bonk was underwhelming. The carried piece
  is the weapon: it hurls at a raider, who goes flying. It costs the piece.
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
  - **Any piece will do:** a piece may stick out over the frame's edge, and the spare is sawn off
    when it's full.
  - **Never stuck:** a gap that none of the pieces to hand can reach any more is plugged with
    offcuts.
  - **Shipshape:** every frame's shape can be filled exactly. A frame filled with nothing sawn off
    or plugged is Shipshape and pays a bonus.
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
  stone battlements. Any rail, flag or trim on it has to be built from pieces as well, or left off.
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
  reset. Walking follows the way the camera faces. Q/E turn the piece, right-click flips it.
- **The wheel turns the piece whenever it's showing a spot to fit** (that's what it was for first);
  only otherwise does it zoom.
- **Throwing at a raider is the only way to discard.** No scrap fire, no bin: a piece you don't
  want (often a rare one) can only be got rid of by throwing it at an enemy pirate, which deals a
  fresh piece onto that crate. Swapping at the crates just puts it back. With no raiders about,
  you fit it, board it over, nail it on behind a mended hole, or lay it in a rampart frame.
- **You must see what's happening in the den.** Raiders inside get a ⚔ marker, pinned to the edge
  of the screen when they're out of view (gold when carrying loot). The view widens on narrow screens.
- **Give enough time to build.** A piece takes about ten seconds to fetch and fit, so the first wave
  waits 75 seconds and starts small.
- **The den has a gate** and raiders attack from the far side of the wall, with swords and (from
  wave 2) a cannon that blasts fresh holes. Keep repairing.
- **You must be able to see the raiders.** Behind the wall they show as red silhouettes through
  the stone; labels over each hole show its strength and who's attacking it.
