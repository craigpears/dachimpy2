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

- **A demonstration shows its plan before it builds (12 Nov).** In any tutorial (Tzz's balloons, Helium's
  Distilling), the plan is on the board and said before the pieces go in, so every move is seen to serve
  it, not explained only at the end: "while she's building it, it's a bit like, wait, why were you putting
  that there? What was that doing?" The end's "here's the plan. This is where it's going to drop" is the
  standard ("perfectly clear and fantastic"), shown from the start, the parts to come faint.
  Built first in Tzz's lesson (12 Nov): her whole plan's on the board from the start of the Double and
  the Bingo, faint till it's built (`marks()` in src/balloons.ts, `faint`), and she says it first: the
  Bingo's bottom blues "wait: a blue falls on them from upstairs". Her Bingo send-off points you on, since
  a Bingo won't get you to the penguins ("she says, bingo, go clear some whirlpools, but we need a Vegas"):
  "Two more and it's a Vegas: that's what gets you out to the penguins."
- **Never rage-inducing (12 Nov, a standing principle).** "even if it is a bit cute and funny, like, it should not be drastic and rage-inducing. That's always what I keep saying. That's almost like a constant principle here. It should not be rage-inducing." A setback is a little
  "ah, damn it, not again": a few squares back, a wrong turn, a whirlpool going a bit squiffy and sending you
  the wrong way, never one that throws away the race or a long stretch of play. Bad luck is mild; big
  swings come only from choices you made. Check every snake, gamble, trap and penalty against it (RACE.md §1).
- **Your pirate stays where you turn them (10 Nov).** In the pirate maker your pirate turns slowly
  on their own, but once you drag them round they stay put (the user: "it keeps rotating. I can't
  make it stay. That's really frustrating ... if you drag it, it should stick"), till it's next opened.
- **No stutter when something's first drawn (10 Nov).** Running the checkpoint's gauntlet "goes a bit
  laggy": the first shot, splash and hit each froze the game a tenth of a second while its shader was
  built. So shaders are built ahead in the background (`warm()` in world.js, called when a place is
  built, and for anything made before it's shown), the driver isn't asked for each shader's error
  log, and shots and splashes share one shape and material, freed or reused, never made afresh.
- **Only the cheats asked for (10 Nov).** Of "Copy the deal" and "Real pirates on the beach": "What
  on earth is this ...?", "I never asked for that cheat." The cheats menu holds only what the
  user asked for (the stages, and skips to get to a scene). A tool for checking my own work stays
  out of it: use the console (`window.den`) or a test instead.
- **No file a blocker would stop (10 Nov).** The den wouldn't load for the user, in any window,
  incognito too: "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT ... Trying to load
  umami.js". Umami is also the name of a well-known analytics script, so ad and privacy blockers
  stop any file called that, and one module missing stops the whole den. So no file the site
  serves is named after an analytics, ad or tracking tool (umami, analytics, gtag, matomo,
  plausible, pixel, beacon, ads and the like): Umami's files are `capybara.js`. A test checks
  every file name.
- **The raiders are Vikings, Dalnoth's (11 Nov).** "If we're depicting Dalnoth now as the Viking,
  obviously the little raiders need to be Vikings as well." Each is a look from the wardrobe (a Viking
  helmet, its fur in brown, tan or white; long hair and a beard; a rag or plain shirt in earthy dyes),
  most with a battle axe, the rest a cutlass (YPPedia, Viking raid: in a swordfight "vikings may use a
  battle axe"). The den calls them Vikings wherever it names them ("Wave 2: Vikings!").
- **Nothing but a cutscene's own keys in one (11 Nov).** Rowing came up over Tzz's lesson: "I'm not
  quite sure if I accidentally clicked something ... somehow the rowing thing ended up overlaying it."
  The sea's bar (Oars, Guns, Sailing) is hidden in a cutscene and its buttons do nothing.
- **What's new, from inside the den (11 Nov).** "as each bigger feature's added, and it should be more
  visual", and "I don't see why the changelog as well can't be visible from within the game. So if
  somebody's coming back to the den, they can see it." `changelog.html`: each bigger feature with a
  teaser shot, a few lines and its link to try it, newest first; a What's new button at the end of the
  den's row, with a dot while there's something newer than you last saw (CLAUDE.md says how it's kept).
- **The race in the changelog, and how it's designed (12 Nov).** "make sure that's in the change log
  with a nice picture and link. Same as the race map", and "a separate game design ... the different
  kinds of gates, the different tactics and game thinking ... relatively high level with pictures just
  to help people see the kind of thinking that's gone into it." The changelog has the course's chart,
  drawn without anything of the starlit door (`PUBLIC=1` in tools/race-map.mjs); `design.html`, "How
  it's designed", linked from the changelog's header: the race's routes, gates and tactics, then the den's
  wider principles, a picture each. (Since 12 Nov the starlit door's on both, and the chart: no hidden gems
  in the proof of concept; and no gambles, since the race's next pass the same day.)
- **One changelog entry per real feature, not per step (12 Nov).** "be wary ... of how much we're actually
  adding in the change log. Like, I don't want it to be like, I've done this big thing on sl[o]op races 5
  times ... see if anything kind of needs compacting together so that it's ... actually each thing is
  meaningful as a new feature, not just ... steps and iterations on a feature." So a later pass on a
  feature already in the changelog updates its entry (or joins a few passes into one), rather than adding
  another. The race's seven entries became three: the race itself (11 Nov), its next pass (the bribe, the
  rocks, the chart: 12 Nov), and watching it (12 Nov).
  **Big features and smaller updates (12 Nov):** "you've got the [sloop race], which is great, but ... I
  want things like showered in gifts ... in there, but ... that should be more like a smaller update ...
  Mischievious's wedding was a big feature, but that is more of a smaller update ... but it's got the same
  prominence as the giant features." So under each day's big features, "Smaller updates": a thumbnail and
  a line or two (an addition to something already there, a new look, a model on a test page). Showered in
  gifts, Primates Rule and Dalnoth's Vikings are smaller updates.
- **Behind-the-scenes rules stay behind the scenes (12 Nov).** Of the design page saying Mischievious is
  "funny about herself, never run down; cheeky, never dirty": "don't mention like the behind-the-scenes
  things ... we should not be exposing that even in the notes ... any pirate can be cheeky but never dirty.
  That's a behind-the-scenes rule, not something I want in a design document. That's public, like easily
  found." So the public pages (the changelog, the design page) never state how the characters are written:
  their tone rules, what they're kept off (a love life), what the real pirates asked for or against. Those
  live only in RULES.md and `src/lines/`. The design page talks about places, puzzles and the game.
- **The cheats jump to what's hard to get to, one per place (11 Nov).** "There's a lot there that are
  like basically the same thing ... these are supposed to help jump you to places that are hard to get
  to." So no cheat for what's a key away (Sailing's board: go sailing, then 1), and one per place, not
  one per spot in it: the housing district, not Gravee's house as well (one is kept "because you need
  it for the link", and the district's is the link the user's shared: Gravee's is a click from its list); Kikkit's island, not her whirlpools as well ("they're right next to each other").
  Vegas Island and its penguins are a place of their own beside it, though (12 Nov: only a Vegas gets
  there), and so are the smugglers' beach and the starlit door: each a cheat and a link (`penguins`,
  `smugglers`, `door`), shown like everything else ("No hidden gems in the proof of concept").
- **The cheats in sections (12 Nov).** "have a peek at the cheats menu to make sure it still looks
  relatively organized ... all of the cheats ... can be grouped into sections at this point, and it's
  probably quite a long menu." So the menu is a few short headed sections: a fresh den built up to a
  stage, at the den, out to sea, the islands, the sloop race. Two columns of them on a laptop, all on
  one screen without scrolling; one column on a phone. A new cheat goes in the section it belongs to
  (`CHEAT_SECTIONS`, `js/den/menus.js`), keeping its own wording.
- **Every starting point has a link, to share (10 Nov).** "Make it so that each starting point is
  something that I can put into the URL as well, so that I can share that animation with
  somebody." `den.html?at=` and a name opens the den straight there: the cheats' stages (`start`,
  `walk`, `gun-tower`, `built`) and their starts and scenes (`shack`, `map-scene`, `sea`,
  `dignity`, `umami`, `wedding`, `married`, and since: `kikkit`, `penguins`, `tzz`, `imperial`, `smugglers`, `race`, `door`, `race-watch`, `lodgings`). Choosing one from the cheats puts its link in the address bar, and its
  button's tooltip shows it. A name that isn't one says so. A new scene or start gets a name too.
- **The layout follows the screen's shape, not the device (11 Nov).** A tall, narrow window on a
  desktop gets the phone's layout (the wedding planner as a sheet along the bottom, say), and
  that's right: "That's kind of by design. The whole point of the design is you adapt the layout to
  the screen size ... whether that's because it's a desktop or a phone doesn't really matter."
- **The code's in a good spot (11 Nov).** The 8 Nov ask to pull the tricky parts into tested pieces
  is done as far as it needs to go: "things seem very modular and we're working on things well. So
  I would say architecturally the game seems in a good spot for the complexity that we've got right
  now." No separate architectural review; keep to the split in CLAUDE.md as things are added.
- **It's a proof of concept: breadth first, depth for what people love (11 Nov).** "Keep in mind,
  yeah, this is proof of concept. If people really love one particular thing, like the weddings,
  then yeah, we can do that, add the multi-player saving state and all that kind of stuff, and dive
  more into those modules." So a place or event is built to be fun on its own, and needn't carry
  saved progress, other players or a deep economy yet; those come later, for the parts that prove
  popular. Keeping each one a little island in the code is what lets any of them grow then.
  **Except what people make their own (11 Nov):** "the spouse thing and anything you do to style
  ... you should definitely at least save that into local storage or something, because people
  will be very upset if that gets lost, even for a proof of concept." So whoever you married, your
  look, the den's decorations, your name and the wedding you planned are kept in this browser,
  through a reload and a new game alike; any new thing you dress, style or keep is saved the same
  way. Voyage progress (the map, the sea, found pets) still starts afresh.
- **The humour's a layer on a real mechanic (11 Nov).** Of Tzz teaching Sailing as balloon animals:
  "it works well as a mechanic. Everything works together, that's always the point. The humour is
  the layer on top, but there's a genuine mechanic underneath." A joke is never just set dressing:
  it explains or teaches something you then really play (the balloon animals are why Sailing's
  pieces pop; Kikkit's nonsense is the literal way through her whirlpools). And a mechanic is never
  left dry when a joke could carry it.
- **Ships, physically proportional, by YPPedia's numbers (11 Nov).** "As always, make it
  proportional ... the sloop in Puzzle Pirates is ... basically designed for ... 7 people max? A war
  frigate's ... up to 75? So, in this game, you know, I want everything physically proportional.
  Obviously, the war frigate should have some ... more visible people hanging around up and below
  decks." Each ship is sized, gunned and crewed as YPPedia has it (checked 11 Nov): a **sloop**,
  7 crew at most, 4 small cannons (1 shot a side), 4 move tokens a turn; a **war frigate**, 75 crew
  at most (17 at least), 24 large cannons (2 shots a side), 3 move tokens a turn, its hold sixteen
  times the sloop's; a **grand frigate**, 159 crew. Her size, her guns and the people you see aboard
  her, on deck and below, all match: a frigate visibly busy with dozens of crew, a sloop a
  handful.
  **How a bigger ship is sized (11 Nov):** the pirates stay the same size, so she isn't the sloop
  scaled up. Her hull holds as many times the sloop's as her hold does (a war frigate's 324,000
  litres, sixteen times the sloop's 20,250), laid out longer and beamier (3.4 times the sloop's
  length, twice her beam, the rest in depth: 15 m by 4.6, 3.1 deep, her deck 1.8 up, against the
  sloop's 4.4 by 2.3, 1.3 deep, 0.75 up); her sails as many times the sloop's as her sail cloth (400
  to 75); her guns on deck as YPPedia's main deck has its Gunnery stations (12 of her 24). The numbers
  are `src/ships.ts`, tested.
- **Primates Rule, as Puzzle Pirates drew her (11 Nov).** The user's own war frigate, no apostrophe:
  "my war frigate that's painted black and white ... the gold, the black and white thrones, the
  skeleton cannons." How close: "obviously Puzzle Pirate elements ... should be faithful ... the
  skeleton cannons and the black and white theme and a few of the bits of furniture ... the gibbet,
  the skeleton set ... most of the stuff like on the top of the deck looks good ... go relatively
  close." So the war frigate is drawn as Puzzle Pirates draws one (from her picture,
  `notes/primates-rule/1-top-deck.jpg`): black hull, white rails and two white stripes (YPPedia's
  paints for her: hull, sideboard, railing), two rows of square ports, bare wood below the paint, three
  masts with crow's nests, a raised quarterdeck aft and forecastle forward, a black beast's head at her
  bow with gold scrollwork. On deck, by YPPedia's names where it has them: the skeletal large cannons
  (black, banded in bone, a skull on each), gibbets, the skeleton chair (one with a skeleton sat in
  it), suits of armour on plinths, a black grand piano, anchor-backed chairs, tables of cards and
  bottles, jars with creatures in them, tool chests. Each is shared furniture any scene can place
  (`js/den/furniture.js`); she's any war frigate's plan with her config (`src/den-frigate.ts`,
  `PRIMATES_RULE`), so another frigate is only another config. The gold is kept, but isn't the point.
  **Her curves (11 Nov), on first seeing her ("Oh, I absolutely love it"):** "is it intentional with
  the style that it really is such a square back? I mean, looking at the [sloop], that's got the
  same ... I'd like to see it maybe with a bit more curves ... Maybe experiment with the curvature a
  bit." So a ship's hull is curved as Puzzle Pirates draws one (YPPedia's War frigate and Sloop
  pictures): her stern rounded in rather than square across, her bow full in the shoulder but still
  coming to a point, her sides falling in above the water (tumblehome) and rounding under below it,
  her deck line, stripes, ports and rails rising toward bow and stern (sheer), her decks level. One
  shape for every ship, the frigate and the sloop alike (`SHIP_SHAPE` in `src/ships.ts`, drawn by
  `js/den/hull.js`), so what stands on a deck still fits; the amounts tried side by side on
  `frigate-test.html?curve=` (box, as before; gentle; curved, the one chosen; round). **Her ports
  (11 Nov):** "the ones at the bottom are like touching the bottom line instead of being centered."
  Each row of ports sits in the middle of its band of black: the lower between the line where her
  paint stops and her lower stripe, the upper between her stripes (`portRows`, worked out from the
  stripes, never set by hand).
  **At anchor, still to come (11 Nov):** "add that to the scene somewhere so you can just, once you
  start getting out to sea, you just kind of see that out there and put [a mark] on it. [To] make it
  clear, it's kind of a to-do item." Something modelled but not yet playable can wait on the sea in
  plain sight, plainly marked as coming: Primates Rule lies at anchor, sails furled, out past Port
  Decorum, to its left (since 11 Nov: "Primates Rule out past Port Decorum", below; she was first just
  to the right of the trade winds' first run out from the beach) (`LAY.PRIMATES`, open sea two squares
  round her, not to be sailed through), a sign over her ("Primates Rule · coming soon"), and sailing up
  near her you say she's not ready yet. No boarding her, nothing to do there, until she's built
  (`src/den-moored.ts`, `js/den/moored.js`).
- **The same thing looks the same everywhere (11 Nov).** Of the whirlpools' winds, drawn their own
  way: "Why do the winds look different than the sea lane ones? Like, the graphic representation
  of them should be the same." A wind is a wind, whether it's a sea lane or one beside a whirlpool:
  one look, from one shared piece of drawing code, never a second version for a new place. The same
  goes for any other thing that turns up again (a rock, a buoy, a gun).
- **Talking pirates, animations and creatures are pieces too (11 Nov).** "what we've got here for
  [Kikkit], where she goes on this kind of loop and ramble ... you could almost have this as a
  furniture item. It's a pirate with a configurable loop of text, and obviously animations ...
  modular as well. So you can choose what animation they stand there doing and use that generally
  everywhere ... these pets here, as we keep adding the penguins and the creatures, you should be
  able to add these to your [scenes], similar to the furniture." So a pirate standing about saying
  lines is one reusable piece (a look, its lines, looping or once, an idle animation picked by name
  from a shared set), and every creature (a familiar, a penguin, a bat) is a placeable piece too; a
  place only places and configures them.
  **A character is only config (11 Nov):** "the point of [Kikkit] though is they shouldn't be in a
  [Kikkit file] ... [Kikkit] should just be a bit of config. Like, this is what [Kikkit] looks like.
  This is what her lines are. But then it should be using ... some generic pirate talking ...
  configured with an animation ... There's little unique to [Kikkit] other than ... adding her to
  the scene essentially on that island." So no character gets code of her own: her look, her
  lines (and in what order: once, then looping), her animation and where she stands are data,
  handed to the generic talking pirate; her familiars are creatures placed beside her. What's left
  to a place is its own mechanics (Kikkit's whirlpools), never the person in it.
  Done for Kikkit (11 Nov): she's `KIKKIT_CAST` in `src/den-kikkit.ts` (her look, where she
  stands, her `tipsy` sway and swig, her earshot) and `KIKKIT_SAYS`, a Script (the ramble once,
  then her tangents for ever, the ramble retold after the last, "Too many leftsehhh!" slotted in
  when she's spat back), which `src/chatter.ts` plays for any talking pirate. Her familiars and the
  penguins (the balaclava'd sneak among them) are placed creatures with named behaviours. Her
  island's file, `js/den/whirlpools.js`, keeps only the whirlpools, the winds, Vegas Island and the
  throw-out. She now finishes her line and waits while a whirlpool has you or you're out of
  earshot, picking up where she left off, and her ramble carries on after a spat line.
- **Modelling looks is a piece too (11 Nov).** "That way that [Mischievious] changes outfits and
  spins, that definitely needs to be a generic module so that you can just ... go through someone
  like as a wardrobe furniture kind of thing that you can just like cycle and demo some outfits ...
  that is incredibly reusable." `js/den/showcase.js` (its rules `src/showcase.ts`): give it a pirate
  (or let it place one) and a list of looks, and it changes into each in turn with the one twirl
  there is, a spin and a little hop, saying each look's title; any piece can be swapped on every
  look (a familiar, say). Her wedding only configures it.
  - **Mischievious's familiar (11 Nov, her own feedback):** "The squirrel is cute and moving on my
    shoulder. Nice touch. I'm usually wearing a monkey but maybe I could switch fams as well as
    outfits?" Marrying her, once you've picked her look you can pick her familiar: her look's own,
    then the monkey (she usually wears one), then the rest, or none, coloured as another of her
    looks wears it. Kept with the wedding, in its link (a plain link's as short as before, old
    links still work), in her portrait and at the den once you're wed.
- **Furniture and props are modular, usable in any scene (11 Nov).** Of Gravee's house: "anything
  in these houses, they should all be modular objects that can be reused in other scenes. So, like,
  if we're doing the vampire's coffin, that should just be a bit of furniture that you can use
  anywhere." Every piece (a coffin, a portrait frame, an easel, a chair) is its own reusable object
  in a shared module, animated by its own little tick if it moves; a house or a scene only places
  pieces, never builds its own one-off copy.
- **Every pirate their own house, as in Puzzle Pirates (the user, 12 Nov):** "It needs to be close to
  Puzzle Pirates. Like, people have their own house, even if it's, you know, a bigger or smaller ... that's
  the point. You should see, go visit those different pirates." A real pirate in the den gets a house of
  her own on the housing district's list, sized to suit her, not a room in someone else's (Roobear's,
  IDEAS.md, was nearly a room at Gravee's manor). Who lodges where can still be a line between them.
- **The housing district, and Gravee's house (11 Nov).** "you have like the areas of houses and
  you have the enter a house stuff and you can choose whose house to go into. And maybe she's just
  one of them ... she can show you ... around her house. And the vampires and do the portrait
  thing. Maybe we don't go as far as a vampire game ... the taking a portrait and a snapshot ... a
  nice way of adding other friends in later." As in Puzzle Pirates (YPPedia, House): a doorway in
  the den's left-hand cliff lists the houses by owner, and you pick whose to go in. A house is data
  (src/den-houses.ts) plus its own scene, so a friend's house is one more entry. Gravee's is the
  first, **Bedside Manors** (her real manor's name), Gravee drawn from her portrait (the white
  Berserker pelt, the starfish on her cheek, a green gown, a hook, a lit candle, Spud her tan
  monkey) and in PIRATES. She shows you round: her portraits, from her real gallery's titles, line
  the walls (her "Definitive Proof" of the yeti among them), the endless gallery that goes on and
  on; the Count's portrait's eyes follow you; lift his coffin's lid and he
  sits up, you both scream, and she paints you mid-fright. Your portrait hangs pride of place on
  her wall, kept in this browser, and you can save it as a picture. No vampire game. Built from
  the shared pieces: furniture, talking pirates, creatures.
  - **Whoever shows you round walks with you (11 Nov).** "I think [Gravee] should be walking with
    you ... She was very slow to, though", and "this definitely needs to be a standard feature for
    people in houses and things". Any house's host keeps at your side at your pace, hurries if
    you've got ahead, talks as they walk, and stands by each thing while they show it you: the house
    shell's, a house only says who and where.
  - **The gallery is walked; whizzing along it is a skip (11 Nov).** The whiz was "a little too
    fast. That was just like, what happened?", and "you can zoom by as a skip. I don't think it
    should do that by default, though." You walk it with her (the joke's that it goes on); "Whiz
    along" (a button and Q) runs you to the other end, slow enough the first time to see it go on
    and read the titles. Any house can have such a stretch.
  - **One bubble per speaker, gone when the line's done (11 Nov).** "I see 4 of them open there at
    the moment": a finished line takes its bubble with it.
  - **The painting's camera eases and holds (11 Nov).** "hold it there, does the painting ... It
    doesn't really flow right": the camera eases from shot to shot, never cutting: onto the coffin
    as he sits up, in on your fright, round to her painting you, held till she's done, then back.
  - **Look round freely in any house (11 Nov).** "If I'm standing next to the portraits ... I should be
    able to move the camera freely, zoom in, look around." Drag (either button, or a finger) turns the
    camera round you, as the den's right-drag does; the wheel or a pinch zooms, right in to a portrait at
    about your eye height, along the walls either way but never out of the open front or through a wall.
    Stood still you keep your look; walk on and the house's own view eases back; a cutscene takes it over
    and hands back the house's view. A click without a drag still walks you.
  - **Whoever shows you round talks about what you're looking at (11 Nov).** "like she talks about the
    portrait you are looking at." Stop by a portrait, or turn the camera onto one, a moment, and the host
    says their line about it: who it is, the story behind its title. Never over anything else said, and
    once a visit each. Any house's host can.
  - **Pictures close up, flat, like a puzzle's 2D view (11 Nov).** "needs a 2D version similar to the
    puzzles, so you can go through the portraits easily with keyboard controls." Tab (or the button) opens
    them one at a time, big, with the title and the host's line; Left and Right (A and D) through them in
    the order they hang, round and round; Esc back. It opens on the one you're looking at or nearest, and
    yours is among them once she's painted you. Any list of pictures can use it (a museum's, later).
  - **Drawn to the coffin, with no arrows (11 Nov).** "if you're on the other side of the room,
    there's nothing really pushing you in that direction." Once you're in her bedchamber she stands
    by the coffin and beckons you over now and then; its lid rattles, the Count snores, a candle
    burns beside it, the bat circles over it.
  - **Her face shows under the pelt (11 Nov).** "I love her hat, but you really can't see her at
    all." The Berserker pelt sits as Puzzle Pirates' does, the bear's head up on top, its hide down
    her back; fixed in the pelt, so it's right wherever it's worn.
  - **The easel stays behind its canvas (11 Nov):** fixed in the shared easel.
  - **She paints with a brush, at the canvas (11 Nov).** "her hand should actually be holding a brush
    at least pointing in the general direction of the canvas." Any pirate who paints holds a brush
    (the talking pirates' 'paint' idle), stands facing the canvas within a brush's reach (toPaint, in
    src/den-houses.ts), and dabs at it.
  - **Watching eyes are a piece (11 Nov).** "The vampire portrait that's following you definitely
    needs to be a normal thing." Any portrait can have eyes that follow you (`watch`): the Count's,
    and Dignity's "Off Duty (Never)", one eye under her patch.
- **Kikkit's whirlpools, by YPPedia's rules (11 Nov).** The first go only spun her and flung her
  back; the user: "Whirlpools are basically four tiles ... each one ... rotates the ship and sends
  it to the opposite corner ... on some of them you'd naturally have like a whirlpool but with a
  corner missing where there's some winds ... it sends you to the opposite corner, which then gets
  you on some winds and sends you back", and "obviously, follow the [YPPedia] thing". So, as
  YPPedia has it: a whirlpool is 2×2 squares; each move she's on one it sends her clockwise round
  to the opposite corner and turns her a quarter clockwise (four and she's back as she was); it acts
  after her move, once a move. A wind pushes her one square (and, as the den's trade winds do,
  turns her its way). Kikkit's are whirlpools with a corner missing, winds in the gap carrying her
  home to the passage's mouth: a plain clear is blown into one and brought back; a Double clears
  the reef; a bigger chain gets through but into the second, and home; only a Vegas reaches the
  penguins. A whirlpool lets her go after a whole turn round, so she's never held for ever. The
  pilot never takes her onto one, or onto a wind that feeds one. Any whirlpool anywhere on the sea
  is the same piece (src/den-whirl.ts).
  - **One step, between your moves (12 Nov).** At the race's start and Kikkit's: "you do your own
    move, and then the [whirlpool] does an action to take you to the corner, and then your move
    happens again ... if I do like forward into a whirlpool, it should be like take me into the
    whirlpool, then to the other corner, rotate it a bit, and then my next forward should happen."
    What went wrong: its step landed her on the far corner, a square of it still, and it went again
    straight away, four steps in a row, round to where she came in; her next move then went on from
    there. Now it's her move, then the pool's one step (to its far corner, a quarter turn right, a
    short beat of its own, about a quick move's: WHIRL.SECS), then her next move from there (YPPedia:
    landed on a special square by one, "it has no effect for this phase"). A wind that takes her on
    from where it put her still does, in the same beat. With nothing more to play and her on it
    still, it takes her on a step a breather later, till a whole turn round lets her go. Tested in
    tests/den-whirl.test.ts.
  - **Her "eh" is emphasis, drawn out (11 Nov).** First: "her mannerisms are definitely like
    everything ends in EH, so it's not a twirl, it's twirl EH." Then, of "annoying-eh": "It's supposed
    to be a childlike it was all sparklehhhhhhh and whooshhehhhhhhh. Not sure how to describe the rules
    but annoyingeh just doesn't fit ... Like it's a form of accentuation? Not just random on random
    words." So she draws out the one word she's savouring, like a child, run on and stretched
    (sparklehhh, whooshehhh, twirlehhh, penguinehhh, Too many leftsehhh!, WHOOSHEHHHH), at most one word
    a line, most lines plain, never on a plain word (no annoyingeh). Her "five lefts and a right" is
    still literally true (the right's the twirl). A test keeps the rule.
  - **The first go's charm, kept (11 Nov):** "I do love how when you go to the whirlpool there, it
    does throw you out and say too many lefts, and yeah, it lines up with what [Kikkit] said and the
    little animation where it throws you out. So if we're able to keep some of that charm in, that
    would be brilliant." So the winds don't just carry her home, they spit her out, a big bounding
    hop and a splash each square, and she lands to "Too many lefts!", as Kikkit warned, Kikkit's
    first word on it "Too many leftsehhh! I told you!" (a test keeps it).
  - **A way through only on purpose; the reef a plain line of rocks (11 Nov).** Sailing with the
    Sailing board open, a chain heading out to sea past her island carried the sloop over the winds
    that feed the whirlpools, through the reef with them, and out by the checkpoint ("Something got
    clipped"). And "there definitely needs to be a much more visible line of rocks. Like, this is
    supposed to be a secret way round. It's literally right next to it." So a chain's gust stops short
    of the way through (the whirlpools, their winds, the gap) and of the reef, as of any rock, unless
    it starts at the way through's mouth facing into it (off her island, out through the gap; or past
    the reef, on out to the penguins): sailing by, you never stumble through; sailing to the mouth and
    chaining, as she tells it, still works, and so do your own moves onto the winds. The reef is drawn
    as one unbroken line of rocks with surf along it, out to the sea's edge (js/den/reef.js: the sea's
    own rocks, merged a square at a time), so the gap with the whirlpools reads as the one way through.
  - **Penguin Island only by way of the whirlpools (11 Nov).** "Make sure you can't get to Penguin
    Island without going through the whirlpools ... the idea that, you know, you can get to the
    penguins by going behind it is obviously a bit weird ... Also, there should be a way through,
    because it's a shortcut. The penguins ... should be an obvious bonus to go, oh, look, I found the
    penguins. They should be at least a few rocks around them." Sailed the long way, past the
    checkpoint, she could come up beside Vegas Island from the open sea behind it (its left, below it,
    its right). Now a ring of rocks, drawn as the reef is, closes in every square round it, corners
    too, but the whirlpools' own way in: a Vegas over them is the one way to the penguins, and a
    Double through them still the shortcut out to the open sea past the reef. A test searches every
    way she can go without touching the whirlpools (her moves, the winds, a chain's gusts) and finds
    nowhere beside the penguins.
  - **Her lines are protected (11 Nov):** "I want her line[s in] source control because they're
    brilliant. I think they're so spot on with their personality right now. I want that protected
    in source control." They're plain data in `src/lines/kikkit.ts`, recorded in `LINES.md`, both
    committed: change them only on purpose, add to them freely, and never lose one in a rework.
  - **Standing on the ground (11 Nov):** "the pets on [Kikkit's] Island ... are sinking into the
    ground." Everyone on an island stands on its real ground height, its sand's top.
- **Kikkit never stops talking (11 Nov).** "I love how long she goes on tangents ... you're sailing
  past, you've not even engaged, and she's going on these tangents ... a never-ending loop of
  tangents and her speech bubbles that don't stop. That suits so incredibly well." Once she's told
  her ramble (the real way through her whirlpools), she's off on one tangent after another for as
  long as you're within earshot of her island, hailed or not: a very long list of them, round and
  round, the ramble retold after the last, Space skipping on to the next. Out of earshot she
  finishes her line and stops; come back and she starts up again. Keep adding to the list; a bit of
  the real way can hide in them, never a hint at anything else.
- **Tzz's balloon lesson (11 Nov).** The sensible one after Kikkit, on a little island of her own a
  hop from hers (IDEAS.md, "Tzz's huge Vegas"): once Kikkit's told her ramble you wonder aloud, a line
  of your own, whether anyone could explain it with fewer tangents (never who or where). Nobody comes
  aboard: "I like Kikkit just kind of on her island. It works." Seeing the first go, the user:
  - **A real board, a real lesson:** "it's not really a real looking sailing board, it's just things
    stacked on each other ... She's helping you ... how to build doubles and bingos and things." Her
    board is the den's own Sailing board (sail-board.js's look) on a stand, every pair steered down
    by real moves and dropped by the real rules: a Double, then a Bingo (src/balloons.ts).
  - **The real way, never bodged (11 Nov, first play):** "the colours are not going into the right
    spots ... they're just going in random places and bodging it. This is a tutorial, and she's just
    showing bodging moves." Built as YPPedia's Sailing strategy has it: a platform one target short, a
    stack of three beside its gap, a pair whose half finishes the line and whose partner drops into the
    gap. Every balloon goes in a target of its own colour or a line that pops, platforms are blocks,
    and nothing's left once it's popped (tests/balloons.test.ts). The Bingo is the Double with another
    storey on top whose pop drops a parked pair onto it.
  - **Just balloons, blown up (11 Nov):** "Maybe it would be simpler just to be like, they're balloons
    and she's blowing them up ... Maybe my balloon animal thing was a bit too complicated." No
    twisting into animals: she blows each up at her mouth, ties it off (squeak), pairs them, tosses
    them on, facing her audience (the camera) while she does.
  - **Now you try:** "she sets up the balloons, you do the pop." She builds each; the last pair is
    yours, on Sailing's own keys. Miss and she eggs you on with the board put back; three misses and
    she shows you.
  - **One look in hand and on the board:** "the visual appearance between when it's in her hand and
    when it's on the board is too different." She blows up the board's own balloons and tosses the
    pegged pair onto the top of the board, where it comes in as the falling pair.
  - **Slow enough to see** ("it goes really quickly in her hand ... Fiddling around some Play-Doh"):
    each balloon blown up and twisted off, squeak by squeak, about three seconds a pair.
  - **Careful with shapes and colours** ("it looks a bit wrong ... with balls at the end"): round
    balloons in the board's three colours only; nothing long with knobs on, no flesh tones.
  - **Keep her in view:** "She's hidden quite behind." One shot held through it, her and her board
    side by side.
  - **The plan shown on the board, not only said (11 Nov, Tzz again):** "her speech explains things.
    It doesn't really visibly show you the plan very well. Like, we're starting a stack. Great. What on
    earth does that even mean? What is the impact of that?" So as she builds, the board marks what each
    balloon's for, read off the routine by the real rules (src/balloons.ts, plan and marks; drawn by
    sail-board.js, sailBoardMarks), each as soon as there's something for it to point at: a platform's
    gap glowing in the colour it wants, "gap" in it, once it's the only square left; a stack's three
    squares ringed (those still to come dashed) from its first balloon, and the square for its fourth,
    a dashed ring and "4", once there are three; a dotted arrow from a balloon that'll drop to where it
    drops (the Bingo's parked pair as soon as it's down). On your go, your pair as a ghost where it goes,
    "you" over it, its drop, and gold badges 1, 2, 3... for what pops after what. Shown, then named:
    "words like trigger are shown before they're named", and in plain words ("she's using the right
    terminology, like the trigger ... But ... that doesn't mean anything to most"): "trigger" first
    comes once the gap's been shown, said what it is ("That gap's the trigger: fill it last, and the
    whole lot pops"). Tested: every mark points at what it says, and every note comes as its mark does.
  - **Her instructions apart from her chatter, and persistent (11 Nov):** "her [important] instructions
    disappear very quickly. Like ... when she's telling me blue over the yellow and top the stack, that
    should be a lot clearer that it's just not her being a bit just chatting. It's an actual instruction
    to you, and it should be more prominent and persistent." What's for you to watch or do is a note in
    a panel by her board (js/den/lesson-panel.js, a piece any teaching pirate can use), not her
    parchment bubble: dark, a coloured edge, "Watch" over what to look at, "Your go!" in gold over what
    to do. It stays up till the next replaces it, flashing as one comes in; a beat with a note lingers
    long enough to read it. Left of the board where there's room, else above it. Her lines split
    accordingly in src/lines/tzz.ts: chatter (start, twists, yours, again, help, popped) and
    instructions (brief, watch, task, chain).
  - **A fair go at the top (11 Nov):** "once she hands over to you, it's not very clear ... surely it
    should start at the top ... give you a bit more of a chance" and "all of a sudden a white and a
    yellow thing starts dropping, and it's like, ah, what am I supposed to do?" So your go is announced
    plainly ("Your go!" in her bubble and on the panel), the panel shows the pair you've got, says to
    steer it onto its ghost, and gives the keys (← → move, ↑ ↓ turn, Space faster). The pair comes in at
    the top of the middle columns as in the real game, waits there two seconds as she hands it over
    (Space starts it at once), then falls a row every 0.9 s (at sea 0.6 s): time to steer
    (SHOW.YOU_WAIT, YOU_FALL; tested). Miss and the board's put back, the task still up, the ghost
    still there, and she eggs you on kindly.
  - **Room of her own, and easy to start (11 Nov, first play):** "TZZ just seems kind of crammed into
    the middle ... can we see if we can just space things out a bit?" The sea grew five squares out
    to the right (27 across, the reef with it) and her island moved out into it: three squares, open
    sea two squares deep all round, still a hop from Kikkit's and on the den's side of it; the
    Wedding Isle and Kikkit's island stay put, no longer against the edge. "To actually get the
    [lesson] to trigger was awkward. So you've got to go straight in front, and then the [ship]
    blocks the view": it starts from any square beside her island, all round it (free, not mid-turn,
    the Sailing board put away), and as it starts the sloop's brought alongside at one spot
    (LAY.TZZ.MOOR) off to the side of the shot, so she and her board are always clear in it.
  - **Further from the whirlpools (11 Nov, sailing by her island):** a chain's gust blew her through
    Kikkit's whirlpools to Dignity: "somehow I have ended up over near Dignity ... I don't know how I
    managed to just make a mishap near the Whirlpools. Something got clipped. Maybe they need to be a
    little bit further away from each other." Her island moved three squares in toward the den, beside
    the Wedding Isle's far shore, six squares or more from the whirlpools, their winds and the reef,
    still a hop from Kikkit's and on the den's side of it, open sea two squares deep all round.
    Everything of hers (where she stands, her board, still and palm, the lesson's camera, ?at=tzz) is
    placed from her island's first square, so it moves as one.
  - **The whirlpools are one point of interest on the captain's map, nothing named (11 Nov):** "I
    don't want [Kikkit's] Island or ... the detailed individual ones ... the whole point of that map is
    here's a point of interest. It's ... a different way through. That's about all ... That's for you
    to discover." Their islands are drawn, and one note, "Whirlpools: another way through?", marks
    them; whose islands they are, and what's on them, isn't said.
- **Port Decorum, an island under imperial control, sketched (11 Nov).** "start sketching out even just
  like, even if it's just an empty island or something where you can't interact yet, is just some island
  that's, say, under imperial control ... to create trading mechanics, looting mechanics, smuggling
  mechanics, all that kind of stuff. Just proof of concepts around those things." First the place, nothing
  to do there yet: in imperial waters, where the main shipping lane leads, straight out past the
  checkpoint's gate beyond the old wreck, so the checkpoint guards the way to it and getting through is a
  reason to go. The sea grew eight squares out to sea for it (34 rows), everything already there staying
  put (the wreck's wind running on out to the new edge, so there's still no sailing round it to the locks),
  open sea two squares deep all round it. A proper island, twice Kikkit's: a stone fort with a keep
  flying the Empire's flag, a watchtower, a stone quay and a jetty out toward the gate (where trading will
  happen), a customs house, a market, a warehouse, and guards in the Empire's uniform, all from the
  wardrobe, in the checkpoint's stone, crimson and gold (js/den/empire.js: the same look everywhere).
  Sailing up, the status line says whose it is, once a voyage, and the guard on the jetty halts you and
  grumbles on while you're within earshot, never a hint how you might get in. On the captain's map it's
  drawn, one note, "Imperial waters", never its name. `?at=imperial` and one cheat. Trading, looting,
  smuggling (its own go-ahead first) and Dignity met again there come later (IDEAS.md, "An imperial
  island").
- **A pirate showing you a puzzle is the heart of it (11 Nov).** "if somebody introduces you to a
  puzzle that, it has like a tutorial element, that's kind of the whole history of my website and
  things. This is hopefully the latest modern iteration of what my tutorial stuff can be. It's a bit
  of fun, a bit more animated, a bit more funny." Dachimpy.com taught Puzzle Pirates' puzzles; the
  den is its newest form. Each puzzle comes with a real pirate who teaches it in their own way, as a
  scene, not a manual: Tzz blows Sailing up out of balloons, Helium will show you real distilling
  moves; you watch, then "now you try". Still a game, not a tutorial ("It's a game, not a
  tutorial", above): the teaching is a funny little scene and then you play.
  - **What they show is good play, tested, not just legal play (11 Nov).** Tzz's first routines were
    real chains by the real Sailing module (it steered, dropped and popped every piece), but the moves
    she chose were "bodging": pieces parked on squares that weren't their targets to fall later. Her
    tests only asked that the chain had the right name and nothing popped early. The user: "it's
    concerning that it went this badly wrong". The puzzle module answers what's legal and what pops;
    a lesson's moves are content, and need their own tests of what a good player would do (every
    piece in a target of its colour or a line that clears, nothing left idle, the trigger left one
    short), from the puzzle's real strategy (YPPedia) or the user, never invented.
- **A lesson breaks it down, shows it on the board, and lets you work it out (11 Nov).** Of Tzz's
  lesson once the plan was shown on her board: "I'm loving the changes ... It's much more tutorial and
  educational. That's fantastic." And as the rule for every lesson: "capture that principle in general
  ... where it helps you visualize it, break it down, absorb it slowly. You know, actually lets you
  figure it out, and it shows you, doesn't just demonstrate it. It breaks it down." So any pirate
  teaching a puzzle (Tzz's Sailing; Helium's Distilling, Rapportus's and Balloffire's Gunnery,
  SunnyKira's Rigging to come):
  - **Breaks it into steps**, one idea at a time, slow enough to take in, never a rush of moves.
  - **Shows it on the board**: what each move is for, marked where it happens (the gap left as the
    trigger glowing, where the line will form, an arrow for what drops where, what pops after what),
    shown before it's named, in plain words, no unexplained jargon.
  - **Instructions to you stand apart from chatter**: prominent, and up till you've done them.
  - **Lets you work it out**: "now you try", your turn announced plainly with a ghost of where it goes
    and the keys, a kind second go if you miss.
  - **Real, good play** (above): every move what a good player would make, tested.
- **Finish one thing at a time (11 Nov).** "try and finish things, because I don't want to move too
  quickly, because I'm conscious we haven't play tested any of the [Tzz] stuff yet. So we need to
  finish things really one at a time", and "I want to reveal things one at a time." A feature is
  built, played by the user, fixed and finished before the next is started; the next ones wait in
  TODO.md, ready to start, not started.
- **No hidden gems in the proof of concept: show everything (12 Nov, replacing the rule below).** "make
  the [starlit] door public. Yeah, no hidden. I think we get rid of the hidden gem idea ... I just want to
  show stuff ... maybe in a full game, some of these things will be hidden gems, but not for a proof of
  concept. It didn't really work." So the starlit door, the penguins and Vegas Island, and the smugglers'
  beach are shown like everything else: in the changelog, on the design page and the race's public chart,
  each with a `?at=` link and a cheat, and the race's starter names the door among the shortcuts. What
  stays from the old rule: the den doesn't nag you with "try this" hints as you play; it just doesn't
  keep anything secret. (The old rule, kept for a full game one day, below.)
- **Hidden gems, never hinted (10 Nov; set aside for the proof of concept 12 Nov, above).** The user, of the checkpoint's "I wonder if there's another
  way round" and "Run it, row it, or knock its guns out": "I don't like it giving you a hint as to
  what you can do ... I like these just to be hidden gems that you work out ... make the fact that
  how you can get through and everything else discoverable." Nothing says what you could do to get
  past something, where a secret way is, or that the oars exist: no hints, no "try this". What's
  said is what's happened (hit, through, the wind's shifted), and how to work a thing once you're
  at it (Space to haul). The one exception agreed: after you've been sunk and rowed home, a small
  note that 3 gets the oars out (TODO.md, "Sunk at the checkpoint").
  **And the demo's quest list (10 Nov):** "I just know there's a lot of stuff in here and I want
  to make it ... discoverable given it's a proof of concept demo." Asked, the user chose the map
  stage only, and "tease, don't tell": "we can kind of hint at umami, the capybara to rescue ...
  I like that, that there are little quests ... you've got like the build the shack quest." So the
  first time you open the captain's map, a five-step tour (skippable with Esc, shown once, T again)
  walks round it: the den and the sloop at the jetty, the winds and the lane (pins, or steer), the
  checkpoint ("There's more than one way past it, mind. Which? That's for ye to find"), the wreck
  and the X, and "there's more off the edges o' this map". Beside the map, a "Quests" scrap: the
  den's jobs named plainly (the walk, the stairs, the gun tower, yer shack), the X's treasure, and
  under "Still to find" counts only, worded to give nothing away: ways past the checkpoint (of 2),
  hidden places (of 2), secret treasure (of 1), a friend to rescue (of 1). Each ticks when done.
  It says there's something to find, never the way to it, and never that the oars beat the wind.
  **It counts routes, not ways (11 Nov):** "I'm really not even sure how you're getting to four ...
  just do the [routes] only for now ... there's got to be something really different." Running it,
  rowing it and knocking its guns out are all through the gate; the locks go round: 2. (The reef's
  whirlpools will make a third.) Rule: `src/den-finds.ts` (ROUTES).
  Rules: `src/den-finds.ts`; drawn by `js/den/quests.js`.
- **A puzzle's pieces look like the real ones (10 Nov).** The user: "the last few puzzles, the
  graphics have been placeholders rather than matching the Puzzle Pirate pieces, so use the actual
  Puzzle Pirate page." Every Puzzle Pirates puzzle in the den draws its pieces after the real ones
  on its YPPedia page (colour, shape and the markings that tell them apart at a glance), in the
  den's 3D style, as the gun tower is "instantly recognisable as Gunnery". Check the finished
  board side by side with YPPedia's pictures before calling it done. No placeholder tiles.
  **Checked side by side, 11 Nov** (each puzzle's YPPedia page and its piece pictures), one look
  per puzzle, shared wherever it's played:
  - **Treasure Haul** (`js/den/treasure.js`; the wreck beyond the checkpoint and the lagoon's
    wreck) keeps its own look, not YPPedia's: its coins, net and chest were redrawn as the real ones
    on 11 Nov and put back on 12 Nov, since the old look reads better: "There was a much better
    contrast. I don't like the [YPPedia] version of that." Contrast on the board comes before
    matching the real pieces. (The redraw is in git, 8e7a564, should any of its coins come back.)
  - **Bilge** (`js/den/bilge.js`, and the rowing boards that borrow its pieces): five of the
    seven match YPPedia's screenshots; three patterns were redrawn to them (the teal octagon's
    three curling waves, the blue sphere's white curling wave, the pale green sphere's three
    wavy strokes), the dark blue square's corners slightly rounded, and the cursor red lined in
    yellow as the real one (it was orange). Not confirmed: the colours of the last two kinds, the
    rounded square with waves and the pentagon with stripes. YPPedia's screenshots show only five
    kinds; their shapes are from its high-contrast "alternate pieces" picture, which matches the
    real ones shape for shape, but not their usual colours. The crab, pufferfish and jellyfish match.
  - **Swordfight** (`src/den-sword-draw.ts`): the crates are the den's own (8 Nov, the user's
    call), so only what's on them was checked against YPPedia's sword pieces: the four swords
    match (skull dagger, dagger, machete, scimitar); the yellow, green and blue now have the real
    ones' cord-bound grips, the scimitar the real one's broad blade, and the yellow is lemon, not
    the orange it came out as on the crates' wood. The real pieces are glossy gems; that stays a
    crate, as the user chose.
  - **Gunnery** (`js/den/gundeck.js`, the tower and her deck): already matched (deck, red
    gunwale and gold rail, crates of shot and red stores, the barrel, the four stores, yellow
    arrows). Only the powder bag changed: tied off at the top with a cord and a flared tuft, as
    the real one's sack, where it was a plain red ball.
  - **Distilling** (`js/den/distill-board.js`, 12 Nov; not in the den yet, played on the unlinked
    `distilling-test.html`): drawn after the real panel as DISTILLING.md §2 describes it, from the client
    port's own measures (no picture of the real one was looked at side by side yet): the still and flask
    above, 40 px glossy bubbles in the honeycomb, khaki nubs bridging swappable pairs, red corner brackets
    for the cursor, the furnace's grille lit from the bottom as the burn nears, the copper trough.
- **Distilling's rules are the real client's, made smooth (12 Nov).** The rules (`src/distilling.ts`)
  are the game's own, from the port of its client (DISTILLING.md §1). Two of the real game's frustrations
  are smoothed over, the user: "certainly make it smooth. I want this enjoyable." A drag doesn't stop on a
  slightly sloppy path where the intent is clear: the piece held swaps toward the way nearest the mouse
  it can go (within 50 degrees, once the mouse is over half a piece out: `wayToward`), where the real
  game swapped only with the mouse near a piece's middle. And no column-shift glitch: the links are drawn
  from the rules' board every frame (the look only follows it), and nothing moves while the board
  slides, so a piece flung as the board shifts never loses its links.

- **Messages stay up long enough to read (10 Nov).** The checkpoint's message "vanished very
  quickly": a longer message stays up longer (about 70 ms a letter, 1.8 to 7 seconds), and one
  that comes while another is still being read waits its turn instead of wiping it (only the
  latest waits, so they never pile up). Bad news, a hit, never waits.
- **Something new to do stands out (10 Nov).** "It says space, but it's such a tiny little thing
  at the bottom. I did not see it." When the prompt at the bottom offers something new to do with
  Space (board her, build the crane, haul the wreck), it's bigger, glows, and pulses as it comes
  up. Not the running tips while you carry a piece or play a puzzle, which stay as they were.
  Each offer pulses the first time it comes up only, and after that just glows (10 Nov: "a lot of
  like flashing yellow things ... when I'm standing around the carpentry puzzle and the sword
  fighting, it's really irritating": walking about there, the offer changed every few steps and
  pulsed each time).
  - **Started where you're looking, by a click (10 Nov, done 11 Nov).** That wasn't enough: "Still
    got to fix that carpentry hauling up thing. Like, it should be in the middle of the screen where
    I'm looking so that I can click on it and start it. It should not be a space along the bottom
    ... it's not in my eye line at all." So something new to start is also offered on the thing
    itself, in the view: a marker over it with what it starts ("Build a crane here", over the
    crane's chalked frame on the ledge), and a click on it starts it. Space still does, and the
    prompt at the bottom still says so. One at a time, the prompt's own offer; kept clear of the
    den's panel and the prompt; brought in to the edge when the thing's just off the screen, gone
    when it's well off or behind you; pulsing the first time each offer comes up only. Offered so
    far: boarding her from the jetty, the crane's starts (building it, back to building it, hauling
    her up, lowering her down, the lagoon's wreck), freeing Umami, the old wreck at sea. One shared
    piece any place can offer one through (src/start-mark.ts, js/den/start-mark.js), so more can
    adopt it.

- **A puzzle game, not an action game.** The raiders are there for a bit of interest and a bit of
  pressure, so you can't ignore things altogether; the emphasis is always on wanting to finish the
  puzzle in front of you (the next section to build, the next Gunnery load). It mustn't be a
  pressured fight against defeat. The user (9 Nov): "there's not as much of a worry about making
  things too easy ... progression is fun. It's to be expected. ... we can add more challenging
  elements later." So when a change could go either way, keep it simple and on the easy side.
- **You choose your puzzles; walking past never pulls you in (9 Nov).** The user: "while I'm
  trying to walk around, it feels like you get dragged into puzzles far too easily. Like, you
  should have to actively interact with something ... I'm just being pulled into everything now."
  So every puzzle starts only when you ask for it: Space at the sword rack, the pumps, the map and
  the sloop; Space on the gun tower to take charge of the guns (walking across it no longer swings
  the camera round and starts Gunnery; Esc steps back, and while you're in charge WASD points your
  chalk instead of walking you: see the gun tower); Tab or the arrow keys
  on a frame for its Carpentry view (Space still fits a piece there in 3D). The one exception, as
  the user suggested ("maybe the front wall could be a bit of an exception"): stopping at the wall
  with a piece in hand still brings up the wall's view.
- **Every other way through costs a puzzle (10 Nov).** A choice of routes is a choice of
  puzzles: run a checkpoint's guns and patch the holes (Carpentry), round it by the locks
  (Bilge), or a crane up the cliff (Carpentry): "that is a nice balance ... you need a puzzle to
  execute the alternatives". So even a sloop, which can take every little route, is choosing which
  puzzle to play. But not the same trick everywhere: "having a lock everywhere is just a bit of a
  cringy feature". A crane up a cliff can go "naturally ... anywhere"; a lock is a one-off. Each
  puzzle should plausibly stand for the work it does (pumping is Bilge, mending is Carpentry).
- **Every reward is won by a puzzle, never just picked up (9 Nov).** A chest from the wrecked
  turret that you sailed over to collect was "not Puzzle Pirates' spirit at all. Like, you need to
  have to haul it up. It's just mandatory. It's the Puzzle Pirates way. You need puzzles." So
  treasure is hauled up by Treasure Haul (the wreck beyond the checkpoint, the lagoon's wreck; the
  turret's chest, while there was a turret), and any new
  reward comes through a puzzle too, one of the few the den already has where it fits.
- **Sailing, a first go (9 Nov).** The user: "can you do a proof of concept for ... how you end up
  getting a ship? ... a ship would just be waiting in the cove", with Battle Navigation's feel:
  "drop a pin, like a destination point, but it almost like auto moves ... it still moves like a
  Puzzle Pirate ship. So it goes left, pauses, right, pauses, forward, forward ... the fact that you
  chart the waypoints out gives it the speed." Steering it by hand with W, A and D, they loved it:
  "it gives you the very Puzzle Pirate feel of moving. It gives such a nostalgia." So:
  - **The old sloop:** from the moment the siege is over she's at anchor close in off the left of
    the beach, broadside on so you see her from the beach (one mast, a square sail and topsail,
    your own flag at the masthead): there in the cutscene behind Dalnoth, and there when you've
    read his map. Their ship makes sail in the background once he's rowed back aboard, quickly;
    nothing waits on it (the user, 9 Nov: "I'm sat here quite a while waiting for his sloop to sail
    off ... That should be a background feature as soon as he's rowed back", and she should be "in
    a more natural place"). Walk down to the water by her and Space boards her.
  - **The board:** a grid of sea out from the cove, there underneath but never drawn; only the
    square you point at shows, faintly. A few rocks stand out of the water as sea stacks (seen
    from the den too). The water round her mooring is always clear, and every open square can be
    reached.
  - **Battle Navigation's moves:** forward is a square ahead; left and right are a square ahead
    and a square to that side, ending up facing that way, sailed as a quarter circle (she heels
    into the turn). Forward into a rock or the board's edge, she bumps and stays put; a blocked
    turn turns her on the spot.
  - **Turns:** up to four moves a turn, one at a time with a pause after each, then a breather:
    about seven seconds a turn ("5 or 10 seconds"). Crossing the whole board takes well under a
    minute. Shown along the bottom as Battle Navigation's tokens: this turn's (the one being sailed
    lit) and the next turn's.
  - **The pin and the pilot:** click the sea to drop a pin (a red buoy); the pilot works out the
    fewest moves there round the rocks, and the course is dotted on the water. A pin on a rock or
    off the board goes to the nearest open water. W, A and D put in a forward, left or right
    yourself, played ahead of the pilot's (in gold; up to a turn's worth ahead); S takes one back;
    Esc pulls up the pin; H heads home. A turn under way always finishes.
  - **Her guns (9 Nov):** a gun each side, as on Puzzle Pirates' sloop ("a gun on each, gun port
    on each side, so you can go along and shoot the rocks"): smaller copies of the gun tower's,
    muzzles out over her sides. A matching pair, in the same slot each side, straight across from
    each other between her mast and the tiller (10 Nov: "it really bugs me that the cannons are not
    aligned with each other ... they should be just cannons on opposite sides of the ship, but in
    the same slots each side"; they'd been staggered). She's 2.3 across for it (from 2.0), so the
    two clear each other even both run in at once; her rowers and their sweeps sit out with her
    sides. Q fires the port gun (her left), E the
    starboard, whenever you like as she sails: not on a token as in Battle Navigation, since she's
    always moving, so it's your timing that brings the shot on ("you have to time it"). A shot
    goes straight out of that side from the square and heading she's nearest, up to three
    squares, and stops at the first rock: a burst of rock chips and spray, the stacks shudder, "A
    hit on the rocks!"; otherwise it splashes down. The gun kicks back, smokes, and runs out again
    with the next load. The rocks don't break (as in Puzzle Pirates). Things worth shooting that
    move are IDEAS.md ("Gunnery at sea").
  - **Her guns are loaded by Gunnery (10 Nov).** The user: "we should have to load the guns through
    the puzzle". Q and E fire only a gun that's loaded; she puts out with none ("No shot loaded to
    port: 2 to load her guns by Gunnery"). 2 (or Load on the sailing bar) takes you to her guns:
    the den's own Gunnery board, the gun tower's puzzle and look, laid along her deck, its top row
    toward her bow, you looking down it from over her stern, her mast, sails and own guns struck out
    of the way. Its four guns are hers, as in Puzzle Pirates, where what the gunners load is what
    the ship can fire: the two down its left side her port guns, the two down its right her
    starboard. So she holds two shots a side, shown as pips on the gun indicators. Firing a side
    fires one of its loaded guns, which then wants a bucket to swab it, as after any shot in Gunnery;
    a second shot that side waits while her gun runs out again (1.2 seconds, the bar filling).
    Played as on the tower: click a plank to chalk an arrow (drag the way it should point, the wheel
    turns it, click an arrow to turn it, right-click rubs it out), or the arrows move a cursor,
    Space chalks and Backspace rubs out. "Loaded! A shot for her port (Q)". She sails on to the pin
    while you load, W A D still put in moves and Q E fire; the sailing bar's hidden, the stores' key
    shows. Esc (or 2) leaves the guns as they are, to come back to; the board only plays while
    you're at it. One board on her deck at a time: with her oars out 2 says to ship them first, and
    3 at the guns goes to the oars; holed, the board gives way to the deck patch, at the lock to the
    quay's Bilge, and comes back after. Rules: `src/den-guns.ts`; the board: `js/den/sea-guns.js`.
  - **The trade winds and a lock (9 Nov).** The user: "just really go for it. Add some
    shipping lanes ... a fork in the road ... some kind of a lock and canal ... there's a bit of a
    cliff. You have to go up a lock". A first go of IDEAS.md's shipping lanes, on her sea:
    - **The trade winds:** runs of wind squares, streaked on the water. Sail onto one and it sweeps
      her along a square at a time, quickly (about a quarter of a second a square), turning her
      the way it blows round a corner: "The trade winds have her!" She can't stop on a lane, so a
      pin dropped on one means "ride this lane": the pin moves to where the wind drops her off,
      she sails onto the lane there or upwind of it, and arrives when the wind sets her down (9
      Nov: "I don't seem to be able to drop a pin onto the lanes"). The pilot picks the quickest
      way by the clock, a ride on the wind quick but not free, so she takes a lane when it saves
      time and never rides a lane out of her way to save a move (it was "going crazy around them",
      round the loop that was).
    - **Rebuilt round the checkpoint (10 Nov).** The user: "there's no need for that cannon near the
      turret near the den now, because ... we've got the Imperial checkpoint. That's the evolution
      of it." So the turret, its chest and the loop of winds round it went. A lane runs out from off
      the beach to a junction; on from there, the main shipping lane carries her out to the imperial
      checkpoint, dropping her short of its guns; and another runs back home, from beside where the
      main lane drops her to just off the beach ("The trade winds have carried her home").
    - **The junction:** at the first lane's end it drops her off "just like a normal square": on,
      the main shipping lane out to the checkpoint; left or right, open sea. Nothing's said there
      (the canal's mouth is yours to find: "The way to the locks", below).
    - **The canal and the lock (the first of a chain: below):** a lock in the foot of a cliff, a little canal up to it.
      Sail into the lock and she waits; nothing happens on its own. Bilge on the quay pumps it up,
      a proper go of it (about seven moves' worth: sixteen, till the user, 10 Nov: "tone down how
      many times you need to get through the locks, just so I can get in there a bit quicker. For
      now ... Maybe take a third off"; then eleven, till rowing in at the canal's mouth came too, 10
      Nov: "the locks are incredibly [bilge] heavy now because we've got the rowing to get in ... a
      bit of balancing on how much bilging is needed"), not "way too quickly": the lock's water rises
      a step with every clearing and she rises with it ("you should see the line of water
      gradually going up"), and a real pump stands on the quay by the board, its handle working
      and water gushing into the lock as you bilge ("we need the actual bilge pump"). The board
      reads the right way up from the quay (9 Nov: it looked "upside down"). Once it's full the
      top gates swing open and, once they're open, she sails on up the canal behind the cliff, its
      water higher. Coming back down, the lock drains by itself in under a second, and she
      waits for the gates again before she sails out. Its water and gates are a beat, never a wait
      (12 Nov, racing: "it shouldn't feel like you're losing the race because you're waiting on the
      animation"): draining or filling by itself 0.8 s, its gates 0.4 s, and the last of a pumped lift
      there in a moment (`LOCK` in `src/den-lock.ts`; they were 2 s, 0.8 s and over a second). Esc while she waits lets her off. (A
      shortcut that costs puzzle work, not reflexes: IDEAS.md, "Locks on a canal".)
    - **A chain of locks, the secret way round the checkpoint (10 Nov).** The user: "make it a bit
      more of a journey ... be more than just the one lock ... maybe there's 4 or 5 or something in
      total. Might be swallowing a bit too much", each filled by Bilge, coming back down to rejoin
      the sea beyond the checkpoint: the alternate way round it, "a bit more getting through the
      locks", which makes it more discoverable ("I wonder if there's a secret way"; something
      then no hint at all: "Hidden gems, never hinted", below). The lagoon, its wreck and the rescued animal branch off "after the second
      or third lock", off the track the locks lead you along, "almost more like an Easter egg" you
      find by wandering off. So:
      - **Two up and two down:** from the first lock the canal climbs a second, up onto the
        clifftop, runs along the top of the cliffs, and comes down two more cut through the
        checkpoint's headland, out onto the open sea beyond it, by the old wreck. Its cliffs step
        up with its water, a lock's lift at a time. Out of the checkpoint's sight and its guns'
        reach the whole way.
      - **The way to the locks: found, not shown (10 Nov).** The user: "the hint to the canal is
        only supposed to appear once you get right next to the Imperial checkpoint ... it should be
        a bit more out of sight, really, because it's supposed to be more of an Easter egg. It
        shouldn't be like right there for you to see. You should have to sail around to find it a
        bit ... even if it's just a few, like, slightly out of the main viewport, doesn't need to be
        far." So the canal's mouth is in the high ground's face toward the den, off to the left, six
        squares from the trade wind's run: out of view from the run and the junction (from her
        mooring it's at the very edge). Nothing points it out, at the junction or the checkpoint
        ("Hidden gems, never hinted", above).
      - **Which way on from a lock (10 Nov).** The user: "The lock's very confusing. Like it just
        looks like you're staring at a cliff once you go through the first run. There's no
        indication that you have to turn right", and at the second, "you are having to bump into
        the walls to get around this lock system. That does not seem right." So the four locks
        stand in one straight line out to sea, up one channel cut through the cliffs and down
        through the headland: out of every lock she faces on along the canal, its water, banks and
        the next lock's gates ahead, never a blank cliff, and she can be steered by hand (W) or
        rowed all the way up and down without touching a bank.
      - **The way on pulls you; the side ways push back** (STORY.md): the main way leads straight
        on; the arm to the hidden cove doubles back off the clifftop canal toward the den, one
        square wide, two turns tight together, easy to miss.
      - **The wind at its mouth (10 Nov).** The user: "there should be some wind stopping you from
        getting to the locks on the left as well. Again, it's that Easter egg idea. People have got
        to figure out that they can use the oars to go past the wind, and that's how they get over
        there." A wind zone (see "Wind zones", below) over the canal's mouth and the first lock,
        blowing down out of the cut toward the den: under sail she can't get into the first lock
        (and the pilot won't take her up the canal), and coming back down she runs out before it.
        The oars take her in. Nothing ever says so.
        - **A sheltered harbour (10 Nov).** The user, playtesting the way in: "it just maybe needs a
          few rocks along the right-hand side so you can't try and, like, sneak around the wind. I
          mean, you can't, but it kind of feels like you almost can ... almost like it's a bit of a
          harbour, sheltered area. And like the wind just to expand up to the cliff. At the moment,
          it's just kind of in the middle of nowhere." So two arms of rock jut out from the cliff's
          foot either side of the mouth (LAY.HARBOUR), the right one the longer (four squares, the
          left three), each two thick where it meets the cliff, drawn as the cliff's own rock
          running on out and sloping down into the sea, boulders round its foot. The mouth's wind
          fills the water between them, wall to wall and right up to the cliff and the lock; its
          streaks run right up to the rock and the cliff (a zone's streaks fade out only toward
          open sea). Its open end faces the den, downwind: under sail there's no square of the
          harbour she can get into, from the front or round either side.
      - **Into a lock, the oars ship themselves (10 Nov).** The user: "in the locks, it should
        automatically, once you get through the lock and you figured out the rowing, it should auto
        switch back to sailing so that it doesn't make it seem like you're having bilge the whole
        way through." Rowed into a lock, she ships her oars there as she comes to wait on it (to be
        pumped up, to drain, or for its gates): the move out of it she's waiting to make stays, and
        she makes it under sail once its gates open; anything else rowed is let go, and the rowing
        boards don't come back. Then she sails on up the canal. Nothing's said of it (Helm, in
        `src/den-sail.ts`).
      - **It costs puzzles, not just time:** every lock up is a go of Bilge on its quay, either way
        you go (out, the first two; back, the two through the headland). Going down is free: with
        her in it the lock drains by itself, and a lock left drained that she wants to go down
        fills from the canal above by itself before she goes in (nobody's being lifted). Only
        lifting her costs a puzzle.
      - **One lock, put down four times:** every lock is the same thing, its rules
        `src/den-lock.ts` (its water, what it needs, pumping, draining and filling, its gates), its
        3D `js/den/lock.js` (chamber, piers, gates, the water rising, the quay's pump and the
        Bilge board, the one Bilge puzzle `src/bilge.ts`); the sea's lay places each one
        (LAY.LOCKS in `src/den-sail.ts`). Its quay is on its bank toward the den, or on its
        right-hand bank if it runs out to sea. Its banks are rock, so she only ever goes through
        a lock straight.
      - **She's never through a lock's gates (10 Nov).** The user: "the front part of the ship is
        sticking out of the gate when the [lock] is draining." She's longer than a square, so a
        lock's chamber runs on past its square each way: its high gates 3.5 out from its middle
        (past her bowsprit), its low gates a whole square out (they swing into the chamber, as a
        real lock's do, and any nearer swept her stern and bow). The two through the headland, a
        square apart, are a staircase: one pair of gates between the two chambers, opening once
        the water's the same both sides. Waiting outside a lock for its water (it filling from
        above for her, say), or lying off it, she lies back from its shut gates, bow and stern
        clear of them and their swing, and glides on in as they open (she used to wait on the
        square beside it, her bow through them). Rules: `src/den-lock.ts` (gatesOf, lieAmong).
      - **The quay's Bilge board, turned to her and wholly on the quay (10 Nov).** The user,
        playtesting: "[pulling] in[to] the locks and the [nose], so you can't see the [bilging]
        puzzle. Obviously, it should be orientated to the ship or the dock or whatever", and "You
        can see some of it, but I think some of it's in". Every lock's board had been laid the same,
        its top row out to sea, seen from the den side: coming back up the headland's two the view
        had her bow coming at you, and at the lower of them (its quay only a square long, between
        the sea and the staircase's higher bank) half the board was sunk in that bank. Now the
        board's top row is toward the lock's high side, the way she faces waiting to be pumped up,
        and the view comes round behind her to it, her bow ahead, whichever lock and whichever way
        she came. It lies wholly on its quay's own flat ground (never a higher bank, never over the
        sea), nudged toward the high side room allowing; where there's only the one square, its
        squares are a little smaller to fit, the view coming in to suit, so it looks the same. Rule:
        `src/den-lock.ts` (quayOf).
      - **The ways past the checkpoint:** a heavy combo that zooms her through, fight its guns, or the
        locks. **It's the combo that gets you through, not sailing or rowing as such** (the user, 11 Nov):
        a big Sailing chain's boost, or a combo rowed on both sides (a Vegas each side, "the equivalent of
        a Vegas ... that gives you a big [push], the same as in sailing"), rushes her past the guns' marks;
        "it's the combo, heavy combo that gets you through, not anything specific to either one." Rowing
        on its own, a stroke at a time, doesn't: "There is no rowing through ... That just makes you a
        sitting duck." Rowing's own place is the winds ("Rowing is only helpful in windy situations"). The reef's
        far end, the long way round that cost only time, is closed now the locks are the way round.
      - **Nothing signposts it:** nothing at the junction, and nothing at the checkpoint either
        ("Hidden gems, never hinted", below).
      - **The pilot** finds its way through the locks to a pin anywhere along them, reckoning a lock
        up a go of Bilge (about 28 seconds); and from the open sea to a pin on the open sea it never
        takes her up a lock at all, even for a pin a wind keeps her from otherwise: the locks are
        yours to find (once she's on the canal, or the pin is, they're the way). A pin dropped on a
        lock goes to the water beside it.
      - **Said:** "A lock up the cliff: bilge on the quay to pump her up", then "Another lock: bilge
        on the quay to pump her up again"; "Up on the clifftop: the canal runs on along the top of
        the cliffs"; the first time one drains or fills for her, "Down she goes: the lock drains by
        itself" (or "The lock fills from the canal above by itself"); and through, "Round the
        checkpoint by the locks, and they never saw her! The open sea beyond" (back, "Back round
        the checkpoint by the locks, and they never saw her").
    - **The hidden cove, an Easter egg off the chain (10 Nov):** up on the clifftop, at the top of
      the locks, an arm runs off the clifftop canal, off the way the locks lead you, down to the
      hidden cove beside the first stretches of the canal, a wall of cliff between (two squares
      across now, 10 Nov), its water the clifftop's, a strip of sand at its back (the den's side)
      with an old bilge pump on it, left there quietly for a later step of the story and never
      talked of ("A hidden cove, tucked away off the canal"; the user, 10 Nov: "it's saying about a
      bilge pump. I've got no idea what that bilge pump is supposed to be"). The crane's ledge is
      in it, as before, its headland as far above it as ever.
    - **The turret (9 Nov, gone 10 Nov):** a gun on a rock between the lanes, which fired on her
      square while she was in reach and was wrecked by three hits, a chest floating free to be
      hauled up. The checkpoint's guns took its place and its rules (see "The imperial checkpoint").
    - **A destructible turret is one module, to plug in (10 Nov).** The user: "there should be an
      object for a destructible turret. We shouldn't have to be recoding something. It should just
      be there to plug in." So every gun that shoots at her is a destructible turret: its rules in
      `src/den-turret.ts` (in reach it fires on her square, or on marks it's trained on; a hit
      quietens it, the third wrecks it; it holds fire while she's dazed and after a patch), its 3D
      in `js/den/turret.js` (the gun turning to aim, its shots and red rings, smoking while quiet,
      the toppling and the smoking stump). A place puts one down and sets it up: its square, reach,
      marks, timings and look. The checkpoint's two bastion guns are two of them; the turret near
      the den was one, and new ones plug in the same way.
    - **Hauling up a chest beside her (10 Nov):** stop her on the chest's square or one beside
      it and Space starts Treasure Haul (the real puzzle's rules; sailing past or over it never
      starts it). The board lies on the water alongside her on the chest's side, its top row along
      her side, and you look down on it from beyond, back toward her, so the treasure rises up the
      screen toward her. The chest is on the board, at its foot in the middle, with forty coins it
      spilled round it; no other chests come up, and now and then a ruby or an emerald does (they
      help raise the chest). Haul the chest to the top row (it swings up onto her deck) and every
      coin up, and "The chest's aboard! N doubloons": 25, and one more for every 40 points the haul
      scored, 60 at most. Esc leaves it: the chest stays where it is and its board as you left it,
      to come back to. The sailing bar's hidden while you haul. Drawn after the real puzzle (the
      user, 10 Nov: "as always, have a double check of the Puzzle Pirates graphics and make it
      closer"; YPPedia's screenshots): a rope cargo net hung from her rail, a thin silver frame,
      ropes down its sides, seaweed at its foot; the olive square-holed coin, the silver crossed
      cutlasses, the gold cross and the tan eight-sided coin with a crowned head; an octagon ruby
      and an emerald-cut emerald; an iron-bound lattice chest with a big padlock; a red and yellow
      cursor; coins hauled fly up the board toward her. Rules: `src/den-haul.ts`; the board
      in the world: `js/den/treasure.js`, for the wreck beyond the checkpoint and the clifftop
      lagoon's wreck.
    - **Dazed, not damaged:** a hit holes her ("Hit! She's holed: patch her to sail on"): she
      finishes the move she's on (or the wind's ride), then waits till you patch the hole in her
      deck by Carpentry, a whole hole to fill, with the wall's rules (a piece covers at least one
      open square and nothing already fitted, and may rest on the deck round it). The pieces are
      offered in the same tray along the bottom as ashore, a bit bigger, and you click them there
      or use the Carpentry view's keys, as at the wall; nothing lies on deck, and the sailing bar
      is hidden while you patch ("simplify. It's a very cluttered user interface. Just simplify
      it, standardize it"). The deal is fair every time and there's no walking to the crates.
      Taking pieces back is the same as everywhere you build (one Carpentry, below: "A gap is
      never filled for you"): empty-handed, Space or a click picks up the piece you're pointing
      at, any of them; Backspace takes the last one back out. The
      camera looks almost straight down, the hole at least as big on screen as a wall hole ("it
      hurts my eyes ... a bit tiny") and sitting just above the tray, not far up the screen. Then "Patched! She sails on." Carpentry, not
      Bilge (the user, 9 Nov: "what do you mean bilge? I've been hit by a cannonball", and bilging
      it out was "one fix and it was done"); Carpentry and Bilge "have got to go together", as in
      Puzzle Pirates, "but the primary one needs to be carpentry". Nobody's sunk or knocked out
      ("it keeps it faster paced, but while keeping the puzzles key"). Rules: `src/den-patch.ts`.
    - **Nothing of the patch while she rows (10 Nov):** once she's patched, none of it shows while
      she rows: not the tray, the pieces, the ghost, nor the planks fitted in her deck (the user:
      "when I've just clicked oars, I see the carpentry pieces for the repairing the damaged
      carpentry puzzle I've just played"). Holed while she rows, the patch comes up with her sails
      and guns still struck.
    - **A new hole, a clear deck (10 Nov):** hit again, every earlier patch's planks come off her
      deck first, so the new hole and its board are plain to see (the user: "the carpentry pieces
      ... from the last time I got shot are all still on there and they are blocking the board. I
      can't even tell where it thinks my supposed hole is"). A crane frame played since had left
      the older planks on her.
  - **Ashore, from anywhere near the beach (10 Nov):** the user: "how to get back to shore is not
    very obvious ... more squares should have that action. So you get to the general vicinity, not
    one specific square." The landing is the stretch of water along the den's beach, her mooring
    in it: the sea's first two rows out, eight squares across. From any square of it, stopped or
    under way (not holed), Space brings her in to her mooring and puts you on the beach beside
    her. It stands out from the sea: a post flying your flag at each end, a line of red and white
    floats along its seaward edge, its water a little lighter, and a short jetty out to her mooring
    with a torch at its end. Rules: `src/den-beach.ts`; the look: `js/den/landing.js`.
    - **Walk out along the jetty to her (10 Nov).** "I like the little pier to the side. I feel
      like I want to actually walk on the pier to the sloop, though. Like, it's just kind of a
      random pier in the middle of the water at the moment. I want to actually walk to it." So the
      jetty runs from dry sand above high tide's mark out to her mooring, just astern of her, with a
      step at its foot and a rope rail on short posts. You walk out along its boards (never off its
      sides or end into the sea) and Space boards her from its far end, nowhere else; going ashore
      puts you on its end, to walk back along it. Its boards are low enough that on it you're still
      out on the beach (the camera, the silhouette and the captain's map as on the sand). Rules:
      `src/den-beach.ts` (JETTY, beachStep, canBoard, ashoreAt).
  - Alone only for now (no crews at sea yet). No tokens to earn yet, no destinations: those are
    IDEAS.md ("Sailing between places, for real"). Rules: `src/den-sail.ts`.
  - **The wind, and her oars (a first go, 10 Nov).** **Parked for now (10 Nov).** The user: "I think
    maybe we need to park the wind idea for now. That's just getting irritating ... I think it's the
    arrows getting in my way." So the weather's switched off, by one switch (`WEATHER.parked` in
    `src/den-wind.ts`): under sail she goes the same every way, at a good wind's pace with it behind
    her (a move 0.4 seconds), with no calms, no light airs, no irons and no changes, and nothing
    said of them; no arrows by her, no streaks, no wind on the sailing bar; her flag streams aft and
    her sails stand full, a steady fair wind. The oars and the trade winds are as they were. The
    code's kept, to refine later (IDEAS.md): turned back on, what follows is what comes back. When
    it's on: the user (9 Nov): "try it. We'll see how it
    feels, whether it's overcomplicated or not." The wind can drop, and a ship that's all sails is
    "dead in the water until the wind picks back up again"; under sail you "can't go against the
    wind"; oars keep her moving either way, never stuck. Not "just going faster". Made plainer the
    same day (the user: "I like the animation and some of the idea, but it's very confusing"):
    - **Wind zones: a wind in one place only (10 Nov).** The user, with the weather parked: "once
      you get past the Imperial checkpoint, there's that bit to the left ... where you can have the
      wind to the left, where I can see a bit of a shipwreck. The one that you can get through by
      going through the locks", "tempting, but you can't get to it unless you go around the back
      way", and "it should only really apply to this little ... area, not everywhere, because
      otherwise it's irritating". So a wind zone is a patch of sea with a wind of its own, felt
      whatever the weather, and the wind's own rules hold in it, the same rules as above (one
      module, `src/den-wind.ts`; each place puts its zones down: LAY.ZONES in `src/den-sail.ts`):
      she never makes a square against it (in irons: she makes no way, a turn swinging her head
      round where she is), and how she lies to it sets her pace (behind her 0.4 seconds a square,
      across her 1.2, light airs 2.2 times as long). The wind she feels on a move is the wind
      where she's going, so heading into a zone against its wind heads her off at its edge, and
      out of one she's free. The pilot plans by it: a pin she can't sail to, she waits, and says
      so once ("The wind's dead against her there: she can't sail to the pin"). The first time a
      zone heads her off, "The wind's dead against her here". The oars beat it, as they beat any
      wind, but nothing ever says so ("we won't tell anybody that, but they can figure out oars go
      against the wind"): no toast or prompt mentions the oars. Shown plainly but only there: the
      water in it ruffled darker with long white streaks drifting the way it blows, fading out at
      its edges on the open sea (against rock or cliff they run right up to it), and while she's in it her flag streams downwind and her sails answer it (square
      and full with it behind her, braced round and flatter across it, flogging in irons). No
      arrows. Three so far:
      - **The old wreck's**, beyond the checkpoint to the left, blowing from the left: from the
        checkpoint's side the wreck's in sight but the wind's dead against her; down the locks she
        comes out beside it with it across her or behind her. It starts a column short of the last
        lock's foot, so from beside the wreck she can slip out of it westward and back up the locks.
      - **The canal's mouth**, blowing down out of the cut: see "The wind at its mouth" (the chain
        of locks).
      - **Under the checkpoint's gatehouse**, light airs across her: see "A real chance to get
        past, but work" (the imperial checkpoint).
    - **The wind** blows one of the board's four ways, a good wind, light airs or a calm, and lasts
      a good while ("it changes quite quickly"): a good wind 2 to 3 minutes, then mostly drops to
      light airs (sometimes it shifts a quarter and blows on instead); light airs last 20 to 30
      seconds and die to a calm about half the time, otherwise freshen; a calm lasts 15 to 25
      seconds and comes back as light airs, often from a new way, which freshen. Every change is
      seen coming: 8 seconds before it, a toast ("The wind's easing: it'll drop soon", "The wind's
      backing round: soon it'll blow from the left"), and the streaks and her flag ease toward
      what's coming. She puts out in a good wind blowing across the cove from the left.
    - **Easy to read at a glance:** two big white arrows on the water either side of her, drifting
      the way it blows (fainter in light airs, gone in a calm, and gone while she rows); faint
      streaks over the water; her flag streaming downwind (limp in a calm); her sails full, slack or
      hanging; and on the sailing bar at the left, an arrow the way it blows (turned with the view),
      how strong ("Good wind", "Light airs", "Calm") and how she lies to it ("behind her: fastest",
      "across her: slower", "dead ahead: in irons").
    - **Under sail, how she lies to it is what matters** ("I'm not seeing like a big speed
      difference"): with the wind behind her a move takes 0.4 seconds, across it 1.2 (three times
      as long), and in light airs everything takes 2.2 times as long; a turn takes the mean of its
      two headings. The pause after a quick move is shorter too (the pause scales with the square of
      the move's time, full after a second's move), so running before the wind a turn's worth takes
      well under half as long as across it. In a calm she can't make way: the turn waits
      ("Becalmed"), and the token on the bar isn't lit while she waits. She never makes a square
      against the wind: a move that would is "in irons", she makes no way, a turn swinging her head
      round where she is (as a blocked turn does), and it shows on her: her sails shake and flog
      while it lasts, and it's said ("In irons! Her bow's into the wind: she makes no way"). Becalmed,
      she's fair game for the checkpoint's guns.
    - **The pilot** plans by the clock, under sail by the wind there is (never a square against it,
      and the quicker headings preferred). The pin goes where you drop it, wind or no wind. A pin
      the wind won't let her sail to at all, she waits, and says so once ("She can't sail to the
      pin: it's dead against the wind"; nothing about the oars: they're yours to find); the
      pilot never runs the oars out for her any more (the user: "it's coming up a pop-up saying you
      can't sail there. Well, it is letting me"). Only say she can't when she really won't. The
      trade winds are currents of their own and sweep her on whatever the weather. Rules:
      `src/den-wind.ts`.
    - **The oars:** 3, or the button at the right of the sailing bar, runs them out; while they're
      out she's rowed by mirror strokes, below. Esc (or 3) ships them again, and she
      sails on to the pin, if there is one, by the wind. Running them out or shipping them, the rest
      of a turn under way goes after the move she's on (it was planned for the other rig).
  - **Rowing by mirror strokes (10 Nov).** First the real Bilge board split down the middle, port
    on the left and starboard on the right (the user, on IDEAS.md's "Port and starboard":
    "absolutely hilarious ... a nice twist on bilging"); then, after the user played mirror strokes
    on a page of its own ("This is actually quite a good puzzle. I love it"; "ready enough to be
    slotted in ... even just that prototype mirrored thing"), mirror strokes is her rowing, and the
    test page went ("remove the mirror strokes test": its module, tests and bots stay).
    - **The boards:** two Bilge boards of their own, port's and starboard's, every rule of Bilge
      but dealt from five kinds of piece rather than seven (for the cascades: "that makes more of a
      risk for cascades and unintended effects"). Every swap made on one is made in mirror on the
      other, so setting something up on one side scrambles the other ("Oh god, everything's in
      reverse"). Arrows or the mouse move the cursor (on either board, mirrored on the other), Space or a
      click swaps.
    - **Where they are, and seeing where she's going:** the user, of the one board laid along her
      deck: "I know it's like zoomed in is good to see the puzzle, but like I can't see where I'm
      rowing." So the boards stand either side of the screen, port's on the left and starboard's
      on the right as you look over her bows, each dressed as its side (its planking washed red or
      green, her sidelights' colours, PORT or STARBOARD across its bow end), and the sea she's
      rowing through is between them: the view from behind her and above, turned with her, her low
      in it and the next several squares ahead above her, the rocks and the red rings. In a window
      too narrow for that, the boards sit side by side along the bottom and the sea's above them.
      While you row her mast, sails and guns are struck out of the way (the guns run in: Q and E
      say so), and the sailing bar's hidden, as for the deck patch.
    - **All under water (10 Nov):** no water line across the boards ("it shouldn't have a bilge
      line ... everything should be under the water, really, for this mode"): a wash of sea over
      each whole board, light rippling across it, every piece swaying a little. (The rules keep
      Bilge's least water, three rows; with no crabs dealt, it makes no difference to play.)
    - **Her rowers (10 Nov):** two of them, one a side, in striped shirts (red for port, green for
      starboard), each with one long sweep, its loom in their hands and through its rowlock on the
      gunwale ("make sure the little rowing characters and the oars are actually lined up. Maybe
      just go back to having two little characters and two oars"); they lean to the catch and back
      on the pull in step with it. The same size as you ("why are they so mini and you're like a
      giant on the back of the ship?"), sat side by side on one thwart facing aft, so she's a little
      beamier than she was, 2 across rather than 1.7 ("make the ship a little wider so the little
      guys can sit next to each other"). When they're off the oars (holed, at the lock) the sweeps
      come in.
    - **What it rows:** what a board clears pulls that side's oars, as hard as the move's worth (the
      bilging guides' reckoning: a three 1, a Good 1.5 up to a Bingo 8, a Sea Donkey 12 and a Vegas
      15; a chain's link 0.5, a crab 2). Every 3 of matched pull is a square forward, as on Battle
      Navigation's tokens.
    - **Balance: going straight is something to aim for.** The user, on the split board: "it only
      took three moves to generate three clears to generate a turn ... one on one side and two on
      the other. So that's basically impossible to go straight." So a small lopsidedness still rows
      her straight, and only a clear imbalance turns her. Pull one side's made that the other
      hasn't yet is that side's lead; the other side's next pull catches it up first, and what's
      caught up drives her ahead (both sides pulled, if not on the same move). Each bit of pull
      matched also straightens up a quarter of what's left of the lead, into forward pull too, as
      her keel holds her straight: rowed steadily, one side pulling up to one and a half times the
      other never turns her. Only a lead of 7.5 (two and a half squares' pull) turns her, a quarter
      turn, and the turn uses it up: three threes on one side don't, a Bingo on one side does, a
      Vegas on one side swings her half round ("you just end up rowing in circles"). From the bots
      (tools/row-bots.mjs, 30 games of 60 moves): a player out to row straight never turns, one who
      clears whatever's biggest, never minding the side, turns about every eight moves, and one out
      to turn her does it in three or four moves. (At 6 the side-blind player turned every six
      moves and rowed a circle in most games; at 9 a Bingo on one side didn't turn her.) A board
      glows its colour while its side's lead waits, and flashes as it pulls. Rules:
      `src/mirror-row.ts` (BALANCE, Stroke).
    - **The turn goes the way you'd expect** (the user: "if you pull on the right-hand side, it
      should definitely go right"): more pull from the right-hand board (starboard) turns her
      right, more from the left (port) turns her left. Real oars do the opposite; that's not the
      point here.
    - **She answers the oars as the pull builds (10 Nov).** The user: "I'm not seeing any physical
      difference. Like ... I expect the boat to start, tilt it, angling to one side if I'm just
      rowing one side, and it to actually see some sense of movement." She still moves a whole
      square at a time, but between squares she creeps ahead as forward pull builds (up to 0.3 of a
      square with a whole square's worth), swings her bows toward the side that's leading and
      heels into it. When the square's move comes it starts from where she'd crept to and the lean
      melts into it: never a jump back. The camera keeps square to her heading and follows her
      creep only halfway, so you see her angle and edge ahead.
    - **The turn building shows on her, no compass (10 Nov).** There was a compass by the boards
      (a needle swinging toward the turn, ↰ ↑ ↱, "NEXT MOVE"); it went: "the next move compass is a
      bit confusing, and like the left right arrows are very tiny"; "even just ... you can actually
      see the oars and the ship itself pulling gives you enough of an indication. Do we need much
      else?" So she shows it, big enough to read, scaled to how big the lead is: the side leading
      keeps rowing while the other rests (its rower stroking up to 2.4 a second faster, its sweep
      swinging up to 60% wider, white water churned up at its blade as it bites), and her bows
      swing toward it (up to 0.4 of a quarter turn, about 36°, with a whole turn's lead) as she
      heels into it. All eased so a little lead shows plainly: a three on one side, 0.13 of a
      turn, shows as 0.3 of the most. The boards still glow their colour while their lead waits.
      ("We're going to have to prototype a bit more": the numbers are LEAN and CREW in
      `src/den-row.ts`.)
    - **The pieces and the water stay Bilge's (10 Nov):** "part I did love of this similarity
      [to] bilge is that they are very watercoloured ... I still like it in idea", so no new
      pieces and no rowing benches ("you already see the guys with the rowing [oars]"). Five
      kinds, and not the pentagon ("didn't we talk about having fewer pieces? ... I see the
      pentagon"): the den deals mirror strokes' five, drawn as the pale octagon, dark square, mint
      circle, teal octagon and slate rounded square (the fifth had been drawn as the pentagon).
    - **How quick:** she rows the squares straight away, no breather between turns. One square on
      its own takes 1.15 seconds; a pile of them waiting goes quicker, each taking 1.15 seconds over
      the size of the pile, as quick as the trade winds at most (0.28 seconds a square), the whole
      pile at the pace of its biggest. No cap on how many squares a big clear is worth ("that's the
      point of Vegas"): a Vegas on each side at once is ten squares straight ahead at the trade
      winds' pace, "she's flying!".
    - **The rowers** stroke as hard as their side's been pulling lately (fading over a couple of
      seconds): steady while she's under way, and "like crazy" after a big clear on that side (4 or
      more of pull: a two-line combo), bouncing on the gunwale, their sweeps thrashing and throwing
      spray, and it's said ("The port rower's going like crazy!").
    - **Pins and the pilot:** the boards are the steering while the oars are out, so the pilot
      doesn't row for her. A pin stays where you dropped it, a buoy to row for, and goes when she
      gets there; the prompt says which way it lies and which side to pull harder: the side it's
      on ("the pin's to starboard: pull harder on starboard"). Holed, the boards give way to the
      deck patch; at the lock, to the quay's Bilge; and come back after, the same boards. To haul up
      a wreck's treasure, ship the oars first; to load her guns, too (one puzzle at a time). Rules:
      `src/mirror-row.ts` (the puzzle) and `src/den-row.ts` (at sea); in the world:
      `js/den/rowing.js` and the boards' look, `js/den/row-boards.js`.
    - **How to turn her, told once (10 Nov):** the first time the oars go out: "Oars out! Even
      clears on both boards row her ahead; a big combo on one side turns her that way." (The user:
      "[turning] on the spot works brilliantly, it's just not very obvious [what] you have to do to
      achieve it ... I think a tip maybe would be good.") Turning itself is as it was: hemmed in,
      she turns where she sits.
  - **The imperial checkpoint (10 Nov).** The user: "this race idea was the funny one. We absolutely
    need that. We need our own puzzle where we have to get through the Imperial checkpoint by doing
    slow row and then fast rowing with the Vegas." And on its guns: they're trained on particular
    squares; land on one and she's hit, mended by Carpentry, or "build a combo big enough to jump
    two squares at once and skip the gun's square. Quick small clears keep her moving but walk into
    the guns; a big combo leaves her sitting still while you build it, but rushes her past."
    - **The sea grew** to 22 squares across and 26 out (the user wanted "a bit of the map, not just
      tiny sections"), out to the right and further out to sea; everything that was there is where
      it was, its scattered rocks the same. The hidden cove's cliff now closes it in behind too.
    - **The main shipping lane:** on from the junction is a trade wind now, out to the checkpoint;
      it drops her four squares short of the gate, just out of reach of its guns, facing it.
    - **The checkpoint:** a line across the sea, closed but for its gate, under a gatehouse of pale
      stone (two towers and an arch high enough for her mast, crimson banners down them, the
      Empire's crimson flag with a gold crown and rising sun over it, a boom chain lying slack under
      the water between its piers). A bastion either side has a gun on it. On its left a headland
      (cliff), the chain of locks cut down through it; on its right a reef out to the edge of the
      sea (its far end was open, the long way round, till the locks were the way round, 10 Nov).
      "Pirates aren't welcome", so its guns fire on her, out and back.
    - **Its guns are trained on marks:** red rings on the water on the way through, three of them:
      two squares before the gate, the gate itself, two squares beyond. Whenever she's on a mark and
      its gun is loaded (2.5 seconds between shots) it fires on that square, and the shot's down 0.9
      seconds later: still there, she's holed (patched by Carpentry); gone, it
      splashes down. So a square rowed on its own, which she stops on, is hit; two or more rowed at
      once go straight over the marks between, and a Vegas on each side (ten squares) carries her
      through the lot at the trade winds' pace. Under sail she takes most squares too quickly to be
      hit, but under the gatehouse its walls take the wind out of her sails (light airs across
      her: a wind zone, below), so she ghosts through the gate slowly, on its mark (the pilot
      tacks in to it). Patched, its guns hold fire five seconds, as the turret's did. Out of their
      reach she's safe, so you can stop short and build your combo (or row in circles while you
      do).
    - **A real chance to get past, but work (10 Nov).** The user: "you need some chance to actually
      sail through. I think getting hit once or twice is funny, but they hit like there's no
      opportunity to really get past ... That's just a bit too much going on here." And then:
      "these checkpoints are supposed to be strong things, not things you just casually get
      through on the first try ... you should be able to get through here, but it should be work",
      enough that the way round is worth finding. So a gun that's hit her holds its fire on its
      marks till she's out of the checkpoint's sight (each gun has her once a run: a hit or two at
      most, never one after another); and a bold run under sail always takes the gate's hit (the
      light airs under the gatehouse), a patch by Carpentry before she sails on. A combo rowed as
      one still rushes her past every mark. Once she's fired on it, it's a fight, and they fire on
      her whatever.
    - **Its guns can be wrecked (10 Nov).** The user: the checkpoint's guns should be "just the same
      as the other one" (the turret): "everything should be destructive", so knocking them out is a
      way through of its own. But it costs a puzzle (see "Every other way through costs a
      puzzle"): her guns are loaded by Gunnery. A hit from her guns on a gun's bastion (sailing
      across its column, a broadside up it; three squares' reach) quietens that gun ten seconds,
      smoking ("2 more to wreck it"); the third hit wrecks it for good, the same toppling and
      smoking stump as the turret (each bastion's gun is a destructible turret): its gun topples off, its battlements fly apart, the bastion
      sinks to a scorched stump with embers in it, smoking. A wrecked gun fires on its marks no
      more; with both wrecked the way through is safe ("Both its guns are wrecked! The way through
      the checkpoint is safe"). What's wrecked stays wrecked (a new game starts it whole). A hit on
      the gatehouse's piers is only stone. No chest from the guns: the wreck beyond is the prize.
    - **And it's a fight:** once she's fired on the checkpoint (a hit on its bastions or its
      gatehouse), its surviving guns also fire on her square while she's within three squares of
      them, as the turret did: a red ring on the water where the shot will come down, about a
      second and a half later; still there, she's holed and patched by Carpentry; gone, it splashes
      down. Four seconds between those shots, and five seconds' grace once she's patched. "It's a
      fight now: its guns are on her." Out of its sight (more than five squares from the gate) it
      calms down: "its guns go back to their marks". The main lane's drop and the lane home both
      start out of their reach, so she can stop there and load before a fight.
    - **Or round it by the locks** (the chain of locks, above): the long way round the reef's end
      that was there, costing only time, went (10 Nov).
    - **Said:** nothing as she comes up to it (no hint of what you can do: "Hidden gems, never
      hinted", below); once she's past
      its last mark, "Through the checkpoint! Not
      a scratch on her" (or "Holed once, patched, and through"), or round by the locks, and "Back
      through" or "Back round" coming home.
    - **The old wreck beyond it:** run aground on a sandbar on the open sea, out of reach of its
      guns: the reason to get past. Stop beside it and Space hauls its treasure up by Treasure Haul,
      (the board on her other side, clear of the wreck); once it's up the
      wreck's bare.
    - **Room left for later:** the gatehouse's boom for the bribe. (The top of the gatehouse's arch
      is where Dignity, its commander, stands: "Dignity at the checkpoint".) (A crane up and over its headland
      had room kept for it, till the crane went to the hidden cove and the locks became the way
      round.) Rules:
      `src/den-checkpoint.ts` (the lay: LAY.CHECKPOINT in `src/den-sail.ts`); in the world:
      `js/den/checkpoint.js`.
  - **A crane up the cliff, to a clifftop lagoon (10 Nov).** The user (9 Nov): "could I go somewhere
    to the side of a cliff and like construct a crane to get in?", built "with like the carpentry
    puzzle", and somewhere of its own: "I don't want ... the lock the same thing as the crane." The
    next step of her journey (canal, locks, hidden cove), "more of an adventure ... we can have a
    multi-step thing and gradually build up on it":
    - **The headland and the ledge:** the hidden cove's left-hand side is a headland now, taller
      than the cove's walls, off the board's left edge. At its foot, on the cove's middle row, a
      ledge is cut into the rock: an old smugglers' landing.
    - **How you get in is plain, not a puzzle of the wrong kind (10 Nov).** The user, in the cove:
      "I don't know how you're supposed to get into this lagoon. It certainly got me puzzled. I can
      see the crane, and it's saying about a bilge pump ... And I thought we were constructing this
      crane." And: "If you're building a crane, you've literally got a crane here that's helping
      you build the crane. Yeah, it's a slight logic issue." So:
      - **The place to stop is plain:** the ledge is obviously somewhere to moor, two stout
        bollards along its edge (a rope's coil on one), rope fenders down its face, mooring rings.
        The first time she stops in the cove: "A ledge under the left-hand cliff, somewhere to moor
        her: stop alongside it".
      - **Nothing looks built before it's built:** no old hoist (it went: a crane helping build the
        crane). Before you start, the crane's place waits: four squared stone footings set in the
        clifftop where its foot will go, and the first frame's outline chalked on the ledge where
        it'll be laid (10 Nov: "I like the outline on the floor for the crane. That's definitely
        looking a lot better").
      - **Stopping there says what to do:** "Alongside the ledge · Space: build a crane on the ledge
        to haul her up the cliff (Carpentry)".
      - **No bilge pump talk:** the old pump on the cove's sand is for a later step of the story,
        and sits there quietly.
    - **Building the crane:** stop her on the ledge's square (oars shipped) and she's warped in
      alongside it; Space builds a crane by Carpentry, a part at a time: its foot, its post and its
      jib, about four pieces each, thirteen in all. Each part's frame is laid on the ledge and
      filled with the deck patch's tray (1, 2, 3, dealt fair), keys and mouse, the camera looking
      down on it from over the cove, her mast struck and you ashore on the ledge by it. The den's
      frame rules: a piece covers an empty square, clear of the pieces in, and may stick out over
      the edge (here up to two squares); empty-handed, Space or a click picks up the piece you're
      pointing at, any of them, and Backspace takes the last one back out, as everywhere you build
      (the user, 10 Nov: "why can I not do it here when I can do it in the other areas?"); Esc leaves the
      frame on the ledge as it is, to come back to. Single squares jut out of each frame for the
      rare pieces (the post's are its tenons). Full, it's sawn to fit (what sticks out falls away
      as sawdust; "Shipshape!" if nothing did), you leap up onto the clifftop and haul it up by hand
      on ropes over the lip, hand over hand, and it goes into its place: the foot laid on its
      footings, the post raised on it, the jib swung up; then the next frame's laid. The crane is
      the pieces you fitted, nothing by magic, and looks it (the user: "It is just such a brilliant
      thing for the puzzle"): the foot flat on the clifftop, the post standing on it, the jib
      angled up from its top. Once it's whole its windlass and block are rigged on it, its rope run
      from the windlass up the post and out along the jib, a hook under the tip, the slings round
      her sides when it lifts her. Space skips watching a part go up.
    - **Hauling her up:** "Under the crane · Space: haul her up the cliff". A short, cheesy moment
      (about ten seconds, black bars, Space or Esc skips): you leap up to the windlass ("Up she
      comes!"), the hook comes down and slings go round her, you wind her up out of the water
      dripping ("Heave!" "Ho!"), her mast and sails struck, the jib swings her round over the
      clifftop ("Easy... easy..."), she's lowered into the lagoon ("Mind her paint!"), and you leap
      down onto her deck ("Wheee!") as she's warped out from under the jib: "Ooh, a lagoon!"
    - **The clifftop lagoon:** a still lake up on the headland, unlike the lock or the cove: dark
      green and glassy, clear enough to see down to its bed, fringed with reeds and bulrushes, lily
      pads (a few in flower) on it, boulders round its shore. She isn't sailed there (it's off the
      board): she rests by an old wreck sunk in it, its snapped mast out of the water (she can be
      poled along the shore to its far bank: Umami, below). Space hauls
      up its treasure by Treasure Haul, the board on the water over the wreck, as for the other
      chests; once it's up the wreck's bare.
    - **Never stuck:** H (or Space, once the treasure's up) lowers her back down the same way, into
      the cove alongside the ledge, and she sails on from there. No pins, moves, oars or guns up in
      the lagoon. Once built the crane stays built (a new game starts without it).
    - **Room left for later:** the lagoon's other shores (a stream out over the headland, say) and
      the headland itself, for the steps that come after. Rules: `src/den-crane.ts`; in the world:
      `js/den/crane.js` (its frames are played with the deck patch's Carpentry: `patch.away` in
      `js/den/sea-puzzles.js`).
  - **Umami the capybara, rescued from the lagoon's far bank (10 Nov).** A friend's side quest (the
    friend asked for the name): an animal trapped up there, freed by a puzzle, who then lives at the
    den as "a pet that you found and rescued". A capybara, so it has to make sense ("not just hanging
    around on the land"): he's by the water there, and at home in it at the den.
    - **Found, never hinted:** nothing's said about him beforehand. From where the crane sets her
      down you can see the lagoon's far bank across the water, a mound of mud and roots with reeds
      round it, his Foraging board on its face, whole, pieces and all, in its own look, as the den's
      other boards are seen before you start (the user: "you should surely just see the whole board"),
      him high on it in an old driftwood fish trap. W or up (or a click on the water by him) poles her
      along the shore to him, S or down (or a click back by the wreck) back again (about three
      seconds). Coming in to him the first time: "A capybara, shut in an old fish trap on the bank!";
      beside him: "Space: free him (Foraging)". The wreck's haul and lowering her (H) are from the
      wreck's mooring; H at the bank poles her back and lowers her.
    - **Not seen from the cove below (11 Nov):** "why am I looking at the foraging puzzle? ... I've
      just built the crane." His board stays out of view till she's first been up in the lagoon (the
      mud bank shows from the cove, as part of the place); after that it stays, so it never vanishes
      as she's lowered. Its tiles never flash black: no face sits a hair's breadth behind another.
      Rule: `src/den-capybara.ts` (boardSeen).
    - **Freed by Foraging** (the user: "Definitely foraging ... it's got the same kind of logic as
      treasure haul, but like reversed"): the one Foraging module, played on the bank's face, its
      foot at the water. He's the board's one container (a basket's 2x2), dealt at its top in its
      middle two columns, nothing more to come. Esc leaves the board as it is, to come back to; her
      mast's struck while you play. Clear the tiles under him and he sinks; nothing left under him at
      the foot and he drops off it.
    - **A real puzzle's worth of clearing** (the user: "I don't understand as well how he seems to
      get free after just 2 clicks"): his board deals no shovels, which dig a whole column out under
      him in one go (two landing over him freed him in a move or two). He comes down row by row,
      and it's plain why he's free when he is: he's dropped off the foot.
    - **Never stuck** (the user: "as long as you can get through eventually if you make a
      mistake"): dug out on one side, a container only sinks once its other side's cleared, and
      against the board's edge that side can never be lined up. So he's dealt in the middle
      columns and his board deals no earthquakes (the only thing that moves a container sideways):
      a line can always be brought under him. Bots show it, blundering first and freeing him after.
    - **Trapped, then free and happy** (the user: "being in the cage or being trapped in some way
      visually makes sense while you're trying to free them. They break free and happily start
      jumping around"): a cute capybara three-quarters to you in a little cage of pale driftwood
      bars lashed with rope, on a bit of mud, reeds round it; no picture behind it (the user found
      the first look "not very inviting"). He and his trap go down the board together. Off its foot
      the trap bursts open, its bars flying off, he wriggles upright on the mud at the bank's foot,
      bounds along it three times for joy, leaps into the lagoon, swims to her and clambers aboard
      onto her foredeck, the camera watching him. "He's free! Umami the capybara".
    - **Only he leaves** (the user, of the test page: "it wasn't just the animal itself. It was some
      background pieces got caught up in it"): of his square on the board only he (in his trap)
      leaves; the mud and reeds under him break up where they were.
    - **In step, smooth, slow enough to watch** (the user: "why is it so out of sync with the pieces?
      And it looks very jittery ... too fast ... ding, ding, ding, ding"): every Foraging board's
      pieces move on one clock, as a function of the time since the move started, never a step a
      frame: what falls gathers speed together (up to 5.5 squares a second) and stops where it
      lands, so he falls with the tiles round him and the new ones coming in over him; a turn swings
      over in a fifth of a second. Bobs and bounds are slow, soft arcs.
    - **At home:** he rides home on her foredeck, and once you're ashore at the den he hops off into
      the shallows and lives at the water's edge, on the beach left of her mooring (the shack's end):
      mostly in the water, wading, swimming, sitting in the shallows, now and then sitting on the sand
      at the edge, staying a while at each spot (4 to 11 seconds) before moving on. A new game (or a
      refresh) starts without him.
    - **His link:** "Umami's rescue" in the cheats, `den.html?at=umami`: the crane built at once and
      her moored by his bank. Rules: `src/den-capybara.ts` (his fall's pace: `FALL` in
      `src/foraging.ts`); in the world: `js/den/capybara.js` (the bank: `BANK` in `js/den/crane.js`; his
      look and his trap: `capybaraSkin` in `js/den/foraging.js`, the test page's too).
- **A quick siege to start, then calm (9 Nov).** The first three waves come as they always have,
  each counting down after the last. Beat the third and their captain calls it off ("We'll be
  back!") and the ship sails out of the cove, its cannon with it. The den's quiet after that: no
  countdown, so you're free to build, roam and puzzle. The user liked the quick intro under attack
  but wanted raids "more opt-in ... so you're not constantly under pressure and you feel free to go
  explore": "do a few waves". What brings raiders back later is to come (IDEAS.md, "Raids you
  choose" and "The captain's map"); for now only the cheat's "Next wave now" does, the ship back
  at anchor, and the den goes quiet again once it's beaten. Rules: `src/den-raids.ts`.
- **The captain's map, and the cheesy cutscene that brings it (9 Nov).** Beat the third wave and
  a short cutscene plays (the user: "I want a little cutscene, so they're not just sailing off in
  the distance ... a short, cheesy one"), black bars top and bottom, the den's buttons and keys
  out of the way: their captain, **Dalnoth**, is at their cannon on the ship's deck (not just
  appearing on the beach: "it feels just a bit forced how he just magically appears. Like maybe he
  should be the one like manning the cannon on the boat"), hops over the side into his rowboat and
  rows in, stomps up the beach and shakes his fist at your wall ("We'll be back! *hic*", the shot
  high enough that his bubble's in it: it was cut off), runs for his boat, and a rolled-up map
  tumbles out of his coat onto the sand. Then a good long shot of him rowing back out to the ship
  ("a few more seconds of him rowing away on the boat would be good"), the ship held at anchor
  till he's aboard, and only then your pirate walks out through the gate on their own, picks it
  up ("A map!") and opens it out on the sand in front of them, the camera looking down on it.
  About seventeen seconds in all. The den's labels stay out of the cutscene. Whatever
  you had in hand goes back on its crate first. **Space or Esc skips it**, and then the map's left
  lying on the beach, "A map?" over it, for you to walk out and pick up with Space. **M** opens
  it again wherever you're standing on the ground (out on the jetty, it lies on the planks, 11
  Nov); M, Esc, Space or a click rolls it up. **While
  it's open, only the map shows** (the user, 9 Nov: the crates and the piece instructions "ruin
  the immersion"): the buttons, the crates, the keys and the labels fade away, leaving a quiet
  "M, Esc or Space: roll it up" at the bottom. The map
  leads out across the sea, not back up the cliffs ("it feels weird going backwards ... it would
  be better if you can go forward"). In a crew, whoever picks it up, everyone can open it.
  Skipping straight to a stage after the siege (the cheats) leaves it lying there, with no
  cutscene; the cheat "The captain's map scene" plays it again. Rules: `src/den-map.ts`.
  - **The map matches the sea (10 Nov).** The user: "the map obviously needs updating as well
    now, because we've added a lot of stuff. Obviously, don't show off the secrets, but certainly,
    like, even just like the checkpoint or something should, like, the line, it should match up
    with what is actually on the map". (It was a schematic from before the sea: his island at the
    top, and a way in for each puzzle, one of them "a hidden cove ... an old bilge pump".) It's
    drawn from the sea's own lay (LAY in `src/den-sail.ts`), square for square, so it stays
    matching when the sea changes; stretched across, as a hand-drawn chart is, in the same inked
    parchment style. On it: your den and its beach at the bottom, its wall and gate between the
    cove's rocks; the trade winds out of the cove and home ("The trade winds", written up between
    them) and the main shipping lane on from the junction ("Shipping lane"); the imperial
    checkpoint's line across the sea from the headland to the reef, its gatehouse over the gate
    with the Empire's crimson flag, the slack boom, a gun on a bastion either side ("The Imperial
    checkpoint", "Pirates not welcome"); the reef on out to the edge ("Reef"); the cliffs and the
    headland on the left ("Cliffs", "Headland"); the rocks along the lanes and out on the far
    water (not the scattered ones, different every game); and beyond the line "The open sea" and
    "An old wreck", "aground on a sandbar", the X on it. The captain's dotted way runs out of the
    den, up the winds and the lane, through the gate and on to the X. The captain's scrawl is the
    same ("we hear there's some secret treasure here, guarded by a fearsome enemy").
  - **Nothing secret on it** ("Hidden gems, never hinted", above): the cliffs are drawn whole, no
    canal, locks or hidden cove cut into them; no harbour arms or wind at the canal's mouth (the
    scrawl sits over that water); nothing off the edge of the sea (the lagoon, its crane); no word
    of the oars, or of how to get past the checkpoint, only what's there to see. The ways past
    Dalnoth himself (sword, gun, flooding him out: leave the choices open) come onto it when his
    hideout's built (STORY.md). A test checks the line and lanes come from the lay and that
    nothing's drawn on a secret square (`tests/den-map.test.ts`).
  - **Dalnoth looks like Dalnoth (9 Nov).** The first go, a captain in a red coat and hat, "really
    does not look very much like Dalnoth": he's drawn from his portrait on YPPedia (his pirate
    page was down), not from memory. Dark skin and a big black beard, a silver helmet with gold
    bands, a nose guard, white horns and yellow fur at the sides, gold earrings, a long yellow coat
    with gold buttons over a white shirt, a white sash, yellow breeches and stockings, a frothy
    pewter tankard in his right hand (the ale slopping as he rants, and a bit unsteady on his
    feet), and his white monkey on his left shoulder. (In the portrait the one on his shoulder is
    his black Hunter Archetype familiar; the white monkey is the Champion one, the one that comes
    to you.) **Any real pirate drawn in the den: check their portrait first.**
  - **Every pirate whose look is checked goes into the game (11 Nov).** "as always, when you're
    checking each of these pirates' portraits and looks, make sure they're added to the game if
    they're not already there." Each real pirate looked up (a guide, someone in a gallery, a
    friend's house) becomes a look in `PIRATES`, with anything they wear or carry added to the
    wardrobe, whether or not the scene that needed them shows all of it.
  - **Real pirates are only looks, and you can wear anything they wear (10 Nov).** The user: "we
    shouldn't be drawing Dalnoth. Dalnoth just happens to be a guy dressed in yellow gold with a
    Viking helmet ... when you go on to your pirate, you should be able to put any clothing on of
    these people." So every real pirate is a plain look in `PIRATES` (`js/den-look.js`), dressed
    by the same pirate maker as yours, and every piece any of them wears is a wardrobe item, for
    both bodies where it makes sense: no pirate-specific drawing anywhere (what's not clothing,
    like Dalnoth's ale slopping as he rants, stays with the scene that animates him). A new real
    pirate means new wardrobe items first, then a look. **Dalnoth:** Viking helmet (yellow fur),
    bushy beard, gold earrings in both ears, a gold Swashbuckler's jacket, a white sash, gold pants
    and boots, a tankard in his right hand, his white monkey. **Dignity** (her Emerald portrait,
    checked 10 Nov; the user: "go with the portrait photo, because then she's more distinctive"):
    tan-brown skin, smiling, wavy blonde hair loose to her shoulders, an eyepatch over her right
    eye; a Buccaneer jacket in shadow (a dusky purple) with atlantean (pale periwinkle) facings,
    wide cuffs and gold buttons in two rows over a white shirt; a black belt with a big round gold
    buckle; shadow pants; shadow Fancy boots with atlantean turned-down tops; a brass spyglass in
    her right hand (a wardrobe item: "In hand"); and Bella, her lavender monkey (a limited-edition
    monkey colour on YPPedia: what looked like little purple wings in the portrait is her curled
    tail). She's the imperial checkpoint's commander ("Dignity at the checkpoint", below).
    - **Faithful to the portrait (10 Nov).** Her hair: "nice, long kind of hair ... instead of
      like just straight long hair gathered at the back ... why has she got bumps? Or it looks like
      she's got more kind of pigtails", and then "I know like most of the style in this game is
      simple, but ... it needs a bit more". So Wavy hair (the item itself, for anyone who wears it)
      hangs loose and full to the shoulders, open only at the face: volume at the crown, separate
      wavy locks falling past the shoulders, two short ones framing the face, and a fringe swept
      from a side part. Her colours: "is it definitely that colour?", and "those colours that she's
      got in the portrait and her general look are Puzzle Pirate colours, so ... if we haven't got
      them in the game, they're missing." **The palette is Puzzle Pirates' own, and a colour a real
      pirate wears that's missing from it is a gap to fill, not a reason to change their look.**
      Dye names come from YPPedia (Clothing palette); their colours are sampled from the game's
      own portraits (a flat mid-tone of the garment), since the wiki's swatches aren't faithful.
      Added so far: shadow and atlantean, from Dignity's portrait.
- **Dignity at the checkpoint, and her little cutscene (10 Nov).** "Adding [her] as the dutiful
  commander of the imperial checkpost, kind of peering down from the gates ... give her a little
  cutscene similar to Dalnoth ... come up with something witty for her"; "I need to give it a bit
  of a cheeky giggle and a win"; "we've really got to go all in with Dignity's little cutscene.
  She's got to be very cute. The lavender monkey has got to be involved somehow ... the little
  monkey is the one that fires the cannon at you"; and, seeing it: "I love it. The cheeky giggle
  and the spyglass, definitely complete it." She stands on top of the gatehouse's arch, the
  Empire's flag behind her. **The first time you sail within sight of it from the cove's side**
  (where the trade wind drops you), a cutscene of about twenty-five seconds (every line at a comfortable reading pace, "Look
  lively!" said on her before the camera goes to Bella: the user, 10 Nov), black bars, **Space or
  Esc skips it**: the camera finds her with her spyglass up, sweeping the horizon; she lowers it
  and starts ("Halt! Imperial checkpoint. State your busi..."), a hand to her forehead ("...oh.
  Pirates. It's always pirates."), then to Bella on her shoulder, pointing her spyglass at you:
  "Look lively! And do try to hit them this time." Bella chatters ("Eek eek!") and scampers down,
  **to one of the checkpoint's own guns** ("can you actually make the monkey pop to the actual
  cannons that shoot at you? Having a fake little cannon at the top seems ... try and keep it
  more real to what actually fires at you"): the bastion gun on Dignity's left (the other if it's
  wrecked), in quick monkey bounds along the gatehouse's top, off the tower and down onto the
  bastion ("why does the monkey look like he's zip wiring in slow motion down?"). On its breech
  she salutes, lights the fuse with a little linstock, covers her ears, and the warning shot
  comes from that gun's muzzle, the camera following it out to the sloop: it lands just short of
  her bow, a column of water and spray over her deck, and misses. Back to Bella's proud little
  pose on the gun (a fist pumped, "Eek!"), then Dignity's giggle (neither rushed: the user, 10 Nov,
  "the giggling monkey or her giggling at the end all go by very quickly"; Bella's pose holds over
  two seconds, the giggle over five), a hand to her mouth: "Hee hee!
  Oops. That was a warning shot. Mostly. Come any closer and the next ones won't be.", wagging
  her spyglass at you as Bella scampers back up to her shoulder. What the checkpoint has to say
  waits till the cutscene's over. After it, **a line over her head as things
  happen, each said once**: a stroke short of its guns' first mark, "One more stroke and I'll have
  to shoot. There'll be paperwork. I hate paperwork."; a gun of hers wrecked, "That was Imperial
  property!"; through her gate, either way, "This is going in my report. In very small, very cross
  handwriting."; out round her by the locks, "Nobody uses the canal. Nobody!" (that one even if
  she never saw you sail up, and then there's no cutscene after). Between times she peers out with
  her spyglass now and then and turns to watch you. The cheat "Dignity's scene" plays it again
  (sailing out first). Rules: `src/den-dignity.ts`; in the world: `js/den/dignity.js`; the
  cutscene machinery every scene shares (Dalnoth's too): `js/den/cine.js`.
- **Every character's lines in files of their own, kept in history (11 Nov).** "make sure that all
  the various lines, characters, and personalities are in like some configurable files ... I just
  want there to be a record of them in case any get lost that I really love, so I can see how
  they've evolved over time." Every line anyone says is in `src/lines/`, a file per character with
  who they are, and the code takes its lines from there; LINES.md, made from them by the build, is
  the readable record, and git's history of it shows every line as it changes. A new line or a new
  speaking character goes there first.
- **Mischievious's wedding, on her island (10 Nov), a proof of concept of the whole thing.** The
  user: "really go for it, really generate me a proof of concept for the whole thing ... the cheesy
  ending, pre-generated scenes ... on an island somewhere." The design is IDEAS.md's "A Puzzle
  Pirates wedding"; what's built: her island, a place of its own like the sea (the cheat
  "The Wedding Isle", `den.html?at=wedding`). Rules: `src/den-wedding.ts`; drawn by
  `js/den/wedding.js` and its `wedding-*.js` parts.
  - **Her name's Mischievious** (with the extra i: "That's not the pirate page you showed, it was
    missing an i"). Her Emerald pirate page, not the similarly named Mischievous's.
  - **Which version of her you marry** ("Go through her portraits, so you could choose which version
    of [her] you would like to marry, or something silly"): five of her 399 portraits, each by its
    own title, she modelling each in turn: "Son of a Nutcracker!" (her Wanted poster now: a feline
    mask, plum dress top and short dress, a pistol and a hook, Ash her grey squirrel), "What is
    Love?" (red curls, crimson), "Taco Princess" (a tiara, purple, a sceptre, a lemon krakling),
    "Wicked" (a witch, a black bat) and "Hotter Than Hell" (crimson midriff blouse and bloomers).
    Every piece is a wardrobe item, as ever (`MISCHIEVIOUS_VERSIONS`, `js/den-look.js`).
  - **Happy and cheesy, or dark humour, chosen first (10 Nov):** "the whole mishap of the previous
    wedding and suggesting the previous groom thing comes in if you choose the kind of darker humour
    theme." Happy: the venue clean, her welcome all giggles, Sweet William as Bachelor number one.
    Dark: the wreck of the last wedding, "don't mind the blood and guts ... we've hired a bit of
    extra security", and Barnaby, the bandaged groom left over, as Bachelor number one.
  - **Then the planner, her reacting to everything** (never the same line twice running, never
    "wrong"): who (her; the bachelors, walking up with bouquets, each stepping forward with a line;
    or someone of your own), the venue (the beach, the chapel ruin on the headland, the ship by the
    jetty), a theme (Happy and rosy, Bloody and gory, Drunkards' fest) that lays out the props and
    dresses eight guests, then anything tuned freely (move, turn, recolour, add or remove props;
    redress a guest), then the plot.
  - **The suitors' cheesy lines, loved (11 Nov):** "Oh, I love the cheesy lines ... the variety is
    funny", Captain Rosalind's "I've sunk forty ships, darling, but nobody's ever sunk my heart"
    among them. Keep them cheesy and varied. And cohesive: Lady Marigold's "a parrot who swears. We
    come as a set" had no parrot, "but the guy next to her does", so whatever a suitor mentions,
    they have (a test checks).
  - **Funny about her, never mean (11 Nov):** "we'd rather be a lot more humorous about
    [Mischievious], but not negative. Like, I don't like where it says, oh, marry [her], she's free,
    she's nearly always free. Like, that feels mean." She jokes about herself (the dress already on,
    "a dress that's hardly been bled on"), never runs herself down; a test checks her lines.
  - **The host, not the show (11 Nov):** "she's just the facilitator for this wedding mechanic. I
    don't want this to be a [Mischievious] show, but it still needs a bit of fun and personality.
    And Puzzle Pirate personality, though, especially, rather than specific people. There's the
    balance." And, of how often she's married: "I don't want this to go too far down that line ...
    But I want there to be a bit of chattery banter." So her lines are the wedding's and the Ocean's
    (the tailor, dyes and doubloons, the inn's grog, the furnisher, security earning their pay), not
    her own love life, and you can ask her things as you plan ("Who's paying for all this?" "The
    crew's coffers, love. Don't tell the purser."). A test checks.
    - **Cheeky, never dirty (11 Nov):** "I love ... the more funny lines where she's got, oh, yes,
      yes, right there, when you placed some of the furniture, I guess it gets her kind of
      promiscuous side in without it being overly, yeah, but dirty." A wink in a line about the
      furniture is the right amount; keep those ("Yes, yes, yes! There!", "Just there!").
    - **Loopy about weddings (12 Nov):** "I'm going for like the loopy version where, you know, she's
      just really excited to marry people and decorate ... she married a parrot to a capybara earlier
      or something." She'll marry anything to anything: two crabs this morning (her welcome), a parrot
      to a capybara after breakfast, two barrels of grog, a cannon to a rowboat; ask her "Who else have
      you married off?", "Have you ever turned a wedding down?", "Do you ever take a day off?". Others'
      weddings, never her own love life. A test checks.
  - **Five weddings today, for the fun of it (11 Nov):** "showing that ... you can keep doing it for
    fun all the time ... not in a promiscuous way, but in a this is a fun game ... tie it into the
    mechanics in a happy, fun way." She's been through six ceremonies today (five till the presents
    came, 12 Nov) because she enjoys them, and each is one of the wedding's own options: roses on the
    beach, raiders at the chapel ("it didn't quite go so well"), cake on the deck, a brawl, a mountain of
    presents on the deck, a sweet one to finish. She says so in her
    welcome, recalls the matching one whenever you choose a venue, theme or plot, and tells them all
    if asked: her stories show you what you can choose (`TODAY`; a test checks every option's there).
  - **On a phone (11 Nov):** "I can't look at that on the mobile ... the dialogue covers up
    everything." On an upright screen the planner's a sheet along the bottom (under half the
    screen), sideways a narrow panel on the right, both tucking away; the camera frames the venue in
    what's left; her bubble's small and kept on screen; taps, dragging props, pinching to zoom, a
    double tap to skip. The desktop's as it was. ("Ask her", the questions above, is a button in
    the planner's footer.)
  - **She opens by explaining it, close up (11 Nov):** "It should definitely be opening more with a
    cutscene where ... she explains to you what it is and what's going on. Definitely more zoomed in."
    Arriving, the camera's close on her: she greets you, says what this is, and asks the tone; then
    what you do here, in that tone. Coming back to a saved or shared wedding, a shorter welcome. The
    camera stays close while you choose, on whatever the choice is about (her, a bachelor, a venue,
    the guests, the couple at the arch). Space, Esc or a double tap skips.
  - **Dress your own sweetheart as you dress yourself (11 Nov):** "you could do random, but you need
    to be able to customize them." The same wardrobe as your own pirate's, with a name and Surprise
    me, kept in the set-up and the share link.
  - **Guests stand, clear of everything, outfits on show; room to see her (11 Nov):** "the pirates
    are kind of ... going through the benches ... we want to show their outfits off," and "front
    benches right up on them, so you can barely even see [Mischievious]." Guests stand by their
    bench, never in a prop, each other, the aisle, or the clear space at the front where she and the
    couple stand; benches start well back. No prop goes on her, the couple or the guards.
  - **The ship's deck doesn't flicker (11 Nov):** surfaces never share a height. Nor a wall and what
    hangs on it a depth (11 Nov, Gravee's captions): wall, wainscot, frame, picture and plaque each
    clearly in front of the last (js/den/furniture.js's LAYER).
  - **Guests and furniture to get lost in (11 Nov):** "people are really going to be like wanting
    more control and variety ... on the furniture ... how many guests you want. Do you want big,
    small, cozy, large? Do you want the grand wedding where half the ocean turns up? ... the ability
    to like go around like with a camera and click on each pirate and configure them." So:
    - **How many guests:** Cosy 6, Small 8, Big 20, Large 48, Grand 140 (half the ocean), filling
      the benches, a second rank, the ends, then the back and sides; never in a prop, the aisle or
      the front. The nearest are full pirates, the rest a cheap crowd (a few draw calls).
    - **Furniture in kinds:** seats, food and grog, lights, flowers, finery, music, piratey (32
      props); each placed one yours to move, turn, dye, copy or remove; nothing dropped into
      another (rugs, petals and splatters go under, cakes on tables). She has a line for each.
    - **Every guest yours:** click any, even in the crowd, to drag, turn, or dress them as you dress
      yourself (Surprise me), or put them back. Only those you changed go in the share link.
    - **A camera to roam with** while placing guests and decorating: orbit, pan, zoom (touch: one
      finger looks, two pinch and pan). Her close shots elsewhere stay.
  - **Named for the wedding, not her (11 Nov):** "she's a primary character, but not the star of the
    show." The Wedding Isle; the planner's "Your wedding".
  - **Whoever you marry comes home with you (11 Nov):** "whoever you marry, I think naturally has to
    jump on the ship with you after you leave the Isle to have that continuity and hang out with the
    Den with you ... It's got to carry out into the world." In their wedding look they come aboard
    and stand by her mast on the way home, then live at the den: strolling clear of crates and
    stairs, waving, and a word when you walk up (each spouse their own lines). Kept in this browser,
    a new wedding bringing a new one. `?at=married` starts home, married. Rules: `src/den-spouse.ts`.
    **Aboard every trip (11 Nov):** not just the first sail home: whenever you set sail from the den
    they're on her deck with you, and back home they step off and stroll the den again.
    **Out of the way of her deck's puzzles (12 Nov):** "the bride gets in the way of the puzzles on
    deck on the ship." While her mast and guns are struck for a puzzle on her deck (Gunnery, a patch,
    the oars, the crane), they step out of view too, and back when it's put away (`strike` in
    `js/den/sea.js`, the one implementation the deck puzzles and the crane share).
  - **A collage of the whole wedding, not one portrait (11 Nov):** "you should get snapshots of all
    the key moments, so you have a nice kind of collage of the whole wedding." A snapshot at each of
    the plot's key moments as the ceremony plays, laid out as one keepsake with a big shot and the
    rest round it, a caption each in the tone; skip the ceremony and it's the one portrait.
  - **The plots:** sweet and blissful; raiders crash it (the guards knock them into the sea); somebody's
    drunk (face first into the cake); a brawl (benches flying); showered in gifts (below). Each ends in "I do", the kiss,
    hearts and confetti, and a group shot framed in gilt as the wedding portrait: save the picture,
    copy a link (`?at=wedding&w=...`, the whole set-up, opening ready to play it again), or plan
    another. The set-up's kept as you go.
  - **Showered in gifts (12 Nov), and she thinks it's all about her.** Mischievious herself, laughing,
    of her weddings: "Something fun (not expected) maybe that I expect everyone to shower me with gifts
    😂". The user first: "you don't want her to seem demanding, but just make it fun ... maybe it can fit
    into the thing of like a wedding theme with lots and lots of gifts." Then her correction, the same
    day: "maybe she's a bit delusional, but she does think it's all about her. So I think she is happy
    with being a bit more attention-seeking and being the one wanting lots more gifts." So the presents
    are the couple's, but she's sure half of them are hers, comically: cheeky and delusional, never
    nasty. The wedding's choices are still yours (the host, not the show, above):
    - **A fourth theme, Showered in gifts:** bright ribbon colours (red, gold, aqua, magenta, lime),
      gilded benches, a stack of presents either side of the arch, a mountain of them beside the couple
      (a treasure chest in it), more up the aisle between the rows and by the back row, the cake; and a
      present in every guest's hand, the big crowd's too (the wardrobe's hand item Present, its paper
      dyed as a bouquet's flowers are).
    - **A fifth plot, Showered in gifts: "Everyone brought a present. Everyone."** After the vows, the
      guests file up the aisle and lay theirs at the couple's feet, outdoing each other ("I got them a
      cannon!" "I got them TWO cannons."); then the rest come flying in from the crowd till the couple
      are in them up to the neck, arms waving out of the top ("Mmf! Lovely! Thank you all! Mmf!"); then
      the pile tumbles over, spilling across the front, and the ceremony carries on. With any theme (in
      another, the presents are its colours). Its keepsake snapshot: buried to the neck.
    - **Her lines:** all about her ("Some of these must be for me", "Pass me the gold one", "The
      planner gets first pick, you know", "Thank-you notes later. Mine first."); a test checks nearly all
      of hers claim the presents, and none is nasty. The guests do the outdoing.
  - **The clothes are Puzzle Pirates'** ("There isn't officially anything in Puzzle Pirates for any of
    this stuff, other than clothing and obviously furniture"): Dress top, Gown, Veil, Tiara,
    Butterfly, Frilly shirt with sash, from YPPedia; the bouquet, the props and the plots are ours.
  - **Her isle, out at sea (10 Nov):** "on an island somewhere ... islands can all have their own
    little thing out there." Out to the right of the lanes on the den's side of the checkpoint, so
    you can sail there from the start, no oars or locks (a test sails there and home on 20 seas):
    sand, palms, her chapel ruin on a rise, a jetty, her heart flag. The water off its jetty is kept
    clear of the scattered rocks, on every sea (11 Nov). Off its jetty, Space puts you
    ashore to the wedding; "Back aboard" puts you back on her at the jetty (the cheat's way goes back
    to the den). It's on the captain's map by name, in plain sight, and the quest list's "Out at sea"
    has "See what's afoot on the Wedding Isle", ticked once you've had a wedding.
    **Named for the wedding, not her (11 Nov):** "she's a primary character, but not the star of
    the show": the Wedding Isle on the map, the quest, the prompts at sea and the cheat. Rules:
    `src/den-isle.ts` (`LAY.ISLE` in `src/den-sail.ts`).
- **Legs walk, never jitter (11 Nov).** "in the whiz along, it's definitely not really a walking
  motion. It's just kind of jittery legs ... you should actually look like [you're] walking when
  [you're] walking out to get the map." Whoever moves a pirate (you, a cutscene, a skip), their legs
  swing with the distance they actually go, a run when they're fast, and ease to rest when they stop;
  one shared walk (src/walk.ts), right everywhere. Not high-quality animation, but always a walk.
- **You can see out to sea (9 Nov).** The taller wall shut the view in: "it just feels like I'm
  staring at a wall. It's lost some of the chop. I don't feel like there's any background to look
  at. I don't know why it's so black. Rather like there's supposed to be a sea over there." So:
  - **Towers either side, the middle lower** (the user's own thought: "better suited to having
    like towers ... if the middle was a bit lower, then that fixes the problem where you can see
    the beach a bit better, but ultimately also where the gunning platform would eventually go").
    The stretches with the holes stand full height; the curtain round the gate (three columns
    either side of it) is the old six rows, a row of stone over the gate's beam. Over it you see
    the beach, the sea and the raiders' ship. Once built, the wall-walk and the gun tower span
    it on their posts, like a timber gallery between the towers, and the beach still shows under
    them. No hole or breach in the low middle (`lowMiddle`, src/den-wall.ts).
  - **A night sky over the sea**, not a flat near-black: dark overhead, lighter down to a horizon
    glow, with the moon (where the moonlight comes from) and stars, coloured to the landscape.
    The fog takes the horizon's colour and starts further off, so the sea out to the ship shows
    and then fades into the sky.
    - **Fixed: the sea's shading jumped about as the camera turned (12 Nov).** "At different camera
      angles, the ... fog of war kind of shading seems to jump about ... like you can't decide where
      it's going to shade" (and the distant water oddly dark in wide shots). It wasn't the fog: the
      seabed under the see-through sea is nudged toward the camera (to sit over the den's ground), and
      looking along the water from far enough off that nudge beat the water's few centimetres, so the
      dark bed cut across the far sea in a hard line that slid about with every turn, tilt and zoom. The
      water is now nudged further still (js/den/land.js), and reaches a haze's width past the sloop's
      last square every way, so no edge of it shows. The haze itself is steady too: by each thing's true
      distance from the camera, per pixel, not its depth along the view; set by the distance the view
      is settling to, eased, not the camera's lagging one as it swings round (which dipped it in a turn);
      always whole before the camera's far plane; and the sky below the horizon is the haze's own colour,
      so the far sea fades into it with no dark band (js/den/world.js, `hazeAt`).
- **A cove (9 Nov).** The den should feel like a pirate hideout in a cove, a step towards the
  more ship-based den the user would like (without starting again). Whatever the landscape, out
  beyond the wall is a beach and the sea. The raiders row in from their ship in little rowboats,
  one each, run them up the beach and walk up to the wall; a raider who gives up (or gets away
  with the loot) walks back to their boat and rows off, and a boat left empty drifts back out.
  Their cannon is on the deck of their ship, anchored broadside on out in the cove (dark hull,
  gold stripe, two masts, black flag), run out from wave 2 ("Their ship's run out a cannon!").
  Dalnoth himself is their gunner, from the first shot (10 Nov: "Surely it should be [Dalnoth] on
  the ship. That just looks like a guy with like a stripy or dark shirt ... you don't want him to
  magically change [to Dalnoth] later. You want him to be on the ship shooting the cannon"), so
  the captain in his cutscene is the one you've seen at their cannon all along.
  Only the look changed: raiders land about where they used to appear, so a wave's timing is
  about the same (a few seconds' rowing first). The user: "instead of them just walking over ...
  they're rowing in little rowboats onto the beach of your pirate hideout, and the cannon is
  actually a ship off in the distance".
- **The gate opens, and you can walk out onto the beach (9 Nov).** The user: "go implement opening
  the gate ... be able to walk through the gate". Walk up to the gate, from either side, and the
  drawbar slides back into the wall and the two leaves swing in; it shuts again once nobody's by
  it. Through it, the whole beach is yours, down to the water's edge (round the gun tower's legs,
  under its deck). It's only for pirates: the raiders never go for it (it's only ever open while
  someone's stood by it). Out there you can't fit pieces (you mend the wall from inside), but you
  can throw them straight at raiders on the sand, no lob. The camera looks down over the wall at
  you, and you show as a gold outline through anything in the way, **and only where something's
  really in the way** (9 Nov: "the character shouldn't have a yellow silhouette if you can
  actually see him"). His own arms and legs never count: in plain view on the sand he's just
  himself. The raiders' red silhouettes work the same way. This is the first step
  towards fighting on the beach (soldiers going out, the Kraken: IDEAS.md).
- **Bilging the shallows (9 Nov).** The user: "can you bilge out the ocean? ... reveals some like
  obstacles they have to pass over that hurts and damages them ... but it gradually comes back over
  time"; better than the mine idea "because it helps everything stay focused on this one area"; it
  should feel real, "almost like the bilge pieces are in the water. So when you kind of clear
  something and it moves, that piece of water recedes"; and combos could dredge up "an explosive
  barrel ... you can blow up as people go past". So:
  - **The board** is the real Bilge (YPPedia, read 9 Nov): 6 wide by 12 high, seven kinds, a
    two-square cursor that swaps side by side (any swap, even one that clears nothing), three or
    more in a row or column clear, pieces float up and new ones come in at the bottom, chains;
    crabs (can't be moved, cleared as a bonus when they come up out of the water), pufferfish
    (swapped, it clears itself and the eight round it) and jellyfish (swapped with a piece, clears
    every piece of that kind); the combo names Good, Great, Arrr!, Har!, Yarrr!, Bingo!, Sea
    Donkey!, Vegas!. Specials come in as the raids go on: pufferfish from wave 2, crabs 3,
    jellyfish 4 (in the real puzzle, with your standing). Tests: tests/bilge.test.ts.
  - **Where:** it lies in the shallows to the right of the gun tower, a metre a square, its top
    row on the sand 8 m out from the wall and running out into the sea, with stakes down its sides.
    Space by its top end to play; Esc to walk. You see it as in the real puzzle, from the sea end
    looking back at the den: row 0 at the top of the screen, the water at the bottom. Arrows (or
    WASD) and Space, or the mouse and a click.
  - **The water is the tide.** The board's water line is the sea's edge all along the beach, so
    clearing pieces draws the sea back. It starts at three rows, as the puzzle does; left alone it
    comes in a row every 30 seconds, up to nine (the top three rows always dry). Each move pumps
    out as much as it's worth in moves, as the bilging guides reckon it (a three a little under a
    move, two lines about three, a Bingo about eight; crabs well, more the higher the water; a
    pufferfish or jellyfish's own clear nothing). A three every three seconds keeps up with it.
    The raiders row in to wherever the sea's edge is.
  - **Rocks:** the sand the tide leaves bare past high tide's mark (up to 6 m of it) is strewn with
    sharp rocks. Raiders landing beyond them have to cross: slowed, and a point of stamina gone for
    every metre, so they reach the wall tired and give up sooner.
  - **Powder barrels:** two lines at once dredges one up, a Bingo two, more three (six on the beach
    at most). It's rolled up the beach to the foot of the wall by a hole, and blows up the next
    raider who comes by, knocking flat every raider within a couple of metres.
    You're told, not left to find it (10 Nov: "the exploding barrels thing from like bilging on
    the tide, if you do a combo, should be a bit more discoverable as well. That's too hidden"):
    the tip as you first start says two lines in one swap dredges up a powder barrel that blows up
    raiders who come by, and if you come back to the board without ever having dredged one, it
    says so once more.
  - **The look matches Puzzle Pirates' bilge (the user, 9 Nov: "the graphics need to match Puzzle
    Pirates ... it's supposed to be in the water ... semi-transparent water underneath it, around
    it ... so you can see the water receding").** Seven glassy pieces in the sea's colours, each
    its own shape and pattern (two octagons, two spheres, a square, a rounded square, a pentagon);
    an orange crab, a yellow pufferfish, a cyan and pink jellyfish; orange corner brackets for the
    cursor. They lie flat on wet sand marked into squares, and the rows under water show through a
    deep clear blue, as in the real puzzle. The sea everywhere is see-through, clearest at its
    edge, over a sandy bed that falls away into the deep, so you watch it draw back off the sand.
  - **Solo only for now,** like Swordfight: in a crew there's no board and the sea stays about
    where it always was.
  The numbers are in src/den-bilge.ts (tests/den-bilge.test.ts).
- **Every puzzle stays high fidelity to the original.** Small tweaks are fine, but the puzzle's own
  rules come over as they are; the 3D only decides where the board stands and who is on the other
  end. The user turned down a clay golem built from smashed Swordfight blocks, with breakers won
  from kills, as "too far away from the sword fighting puzzle", and said this goes for all of them.
  A new job's look (a golem, a forge) can be a skin, never a change to the rules.
- **The rampart's timber after the siege (10 Nov).** "what happened to building the [gun tower]?
  Have I got no way of doing that now because there was that triggered after a third wave or
  something?" Each later part's timber came only with a wave beaten off, and only once nothing
  was still being built: still on the walk when the third wave ended, the stairs and the gun tower
  never came. Once the siege is over, each part's timber comes as soon as the one before is built
  (`timberComes`, `src/den-raids.ts`).
- **The occasional raider after the siege (10 Nov).** With the siege over nobody came, and a
  piece you didn't want had nowhere to go: "building the platform and the stairs and things in the
  base is really difficult now because you've got no way of wasting pieces ... the key was that
  you could throw things at the enemies". Agreed: "a bit peaceful, yeah. Definitely the occasional
  raiders ... It gives it a bit of life, and as you said, a way to throw scrap." So in peace, 90
  to 180 seconds after the last lot were seen off (the clock only runs while you're in the den:
  not at sea, in a cutscene or reading the map), a raider or two put in, a boat each, a few
  seconds apart (45% one, 45% two, 10% three). They row in from where their ship lay and try the wall or the
  gate like any raider: the tide, the rocks, the soldiers and the gun tower all count, and beating
  them pays as ever (a doubloon or few, and their weapon crates). One who reaches the chest
  steals as ever, but never the last doubloon: stragglers can't end the game (`theft`). No siege: the den stays at peace,
  no cannon, no countdown, no "Wave". As they come: "A boat's putting in: a raider after an easy
  mark" (the first time adding "Spare pieces? Shift throws"); the banner says how many are ashore; when
  they're gone, "That's them seen off." (`STRAGGLERS`, `src/den-raids.ts`.)
- **Kept because people like them (10 Nov).** Two things nearly cut, kept: Bilge on the beach in
  the opening siege (the tide, its rocks, the powder barrels: "don't get rid of the bilge on the
  [beach] ... people like that ... it adds to the scenicness. And the opening of it"), and patching
  her deck by Carpentry when a cannonball holes her ("people like it. It's funny. It's good"). Ask
  before taking out anything players already enjoy, however early an idea it was.
- **Walking off the mended wall (10 Nov).** "Once you finish the last hole, and you've not got a
  piece ... WASD is supposed to move you around. You kind of get stuck having to hit escape, even
  though you've finished the puzzle effectively." A mended hole can still take a patch, so the
  view held on to you. Now, with no hole left open on the wall and nothing in your hands, WASD and
  the arrows walk you off it as they do anywhere (`walksOff`, `src/den-carp-view.ts`).
- **The Carpentry view (9 Nov).** The user, after Bilge: "have a 3D mode, but when you're
  puzzling, like I just don't think you can beat 2D, especially like the biggest critique and
  feedback I've got is people like to use keyboard controls, and this 3D experience is just not very
  good. Yeah, it's fun, but it's not good for puzzling and keyboard control." Not a separate
  screen: "to make it really feel like, oh, look, I can put things on the stairs. I can put things
  on the wall or the deck or ramparts". Swordfight is already close ("you kind of zoom in and you
  get that same effect"). So:
  - **Tab, from anywhere on the den floor,** goes into the Carpentry view on the nearest thing
    being built (the wall if you're by it); Tab again goes on to the next (the wall, then each
    frame: the wall-walk, the stairs, the gun tower's parts, your shack); Esc walks off. Bringing a
    piece to the wall and stopping there brings the wall's view on by itself; a frame's comes on
    when you ask (Tab, or the arrow keys with a piece), since being pulled in just by standing on
    one was too much (see "You choose your puzzles"). It's always that frame's, never the wall's
    (the user, 9 Nov, at the walk frame: "I'm still seeing the same view as before ... I'm
    certainly not getting that more 2D isometric view"). After Esc it stays off until you walk a few steps or take another piece.
    Pointing at a frame with the mouse, the piece goes in wherever it is, however far away.
  - **The camera goes straight on to it,** like a 2D board: the wall square on, the whole of it
    (a stretch round the piece if it's ever too long); a frame on the floor from above, its rows running up the
    screen; the stairs square on to their face. Your pirate walks along to stand by the piece,
    out of the way, so others see you building.
  - **Puzzle Pirates' own Carpentry keys** (YPPedia "Carpentry", read 9 Nov): 1-3 take a crate's
    piece (the toolbox), the arrows move it a square, X and C turn it, Z flips it, Q/W/A/S centre
    it over the upper-left, upper-right, lower-left and lower-right holes (on the wall, the real
    four: the high and low holes left and right of the gate, going on round any cannon breach in
    that corner; on a frame, that quarter of it), Space puts it in. Backspace takes the last
    piece back off (the real puzzle lets you adjust your last piece), and empty-handed, Space or a
    click picks up the piece you're pointing at. E and F still turn and flip.
    The mouse works too: point and click.
  - **The keys stay exactly the real game's, and each hole shows its key (9 Nov).** The user
    pressed W and S for up and down, as when walking, and the piece leapt to the top-right and
    bottom-right holes ("I was just working in the bottom left hole, pressed up, and I ended up in
    the top right"); D did nothing, so "left and right" seemed dead. Told it's Puzzle Pirates' own
    Q/W/A/S (a little square on the keyboard, like the four holes), they chose: "we want to be
    completely faithful to the Puzzle Pirate controls." So in the Carpentry view each hole's label
    starts with its key (Q and A on the left of the gate, W and S on the right).
  - **Nothing in the way, and switching is seamless (9 Nov).** The user: "everything's really
    obscured", and moving between the wall, the stairs and the platform should be like Carpentry's
    four holes, with no going out and back in. So: a row of tabs over the prompt names everything
    being built, the one you're on lit and a tick on each one the piece in your hands fits
    cleanly; click one (or Tab) to go straight to it, piece and all. Your pirate stands beside the
    piece (at the wall) or off the frame's near edge, never in front, and the piece over their
    head is hidden while the ghost shows where it goes. It works from up on the rampart too,
    without walking anywhere. The den is 4 m deeper (to make room for all that's built), the
    wall-walk's frame and your shack at the back.
  - **It stays on between pieces,** and the next piece starts where the last one went. A piece can
    be held anywhere over the board and turned there, whether it fits or not, and put in from
    anywhere in the view, no walking.
  - **Immersive, never an overlay (9 Nov).** A flat Carpentry board drawn over the den at the wall
    (the holes in two rows) was tried and dropped the same day. The user: "I can't even see the wall
    now ... The wall one feels very forced ... I want it to feel more immersive, like you're in the
    3D world. This one feels a lot more detached", and "don't create a separate overlay. I think
    that's bad. That just suggests there's a deeper design problem". The wall-walk's view, where you
    see the full 3D world and nothing's blocked, is the model. If the wall needs to be closer to the
    real puzzle, change the wall itself: done, "The wall in two courses" below.
  - **The keys must be dependable (9 Nov).** The user, playing by keyboard: "this needs a lot more
    quality control for keyboard use. A lot of it." So, tested key by key:
    - **An arrow always moves the piece, and never further than it must** (the user, 9 Nov: "you
      should always be able to go left and right and move to the next available spot"; the piece
      seemed "to be jumping two spaces and going right to the bottom", sent to the next hole's best
      fit). A square at a time while the piece touches a hole (overhanging its edges counts); off
      it, over the bare stone and the gate ("it just blocks me instead of skipping over it") to the
      first spot touching the next hole in line with it, its row kept (left and right keep to its
      course, high or low; up and down work the same way between a side's two holes); with no hole
      in line that way, a plain square on, right to the wall's edge. Never a diagonal jump, never
      to a fit it chose for you: that's what Q/W/A/S are for (`arrowStep`, src/den-carp-view.ts).
    - **You can always turn and flip the piece, fit or no fit** (the user, 9 Nov: "It not fitting
      should not stop you flipping it"). It turns where it is, about its middle (turning it round
      and round doesn't walk it off), and the wheel turns any piece you carry (see below).
    - Q/W/A/S never send the piece back to the hole it's already at (it did, with the piece a little
      right of its hole's middle: "it isn't jumping").
    - A hand resting on the mouse doesn't undo key moves: after a key, the mouse takes over again
      only once it has really moved.
    - 1-3 swap the piece in your hands for that crate's; for the same letter, a note says so (or it
      looks as if nothing happened).
    - Tab and Shift+Tab go round everything being built, both ways; the tabs sit in a bar of their
      own, the one you're on in gold, with "Tab next" beside them.
  The rules for the keys and jumps are in src/den-carp-view.ts (tests/den-carp-view.test.ts).
- **The Sailing puzzle (10 Nov), as the user remembers playing it.** One module, `src/sailing.ts`,
  knowing nothing of the den (its bots: `tools/sail-bots.mjs`). Where the module had to guess,
  the user's memory wins:
  - **You see the next pair**, "obviously not just the single one in the top left somewhere".
  - **A pair can be steered as it falls** (YPPedia: "moved or rotated while it is still falling"),
    so it can come to rest anywhere it can be steered to, under ledges too.
  - **Difficulty is more and bigger platforms:** "you may start with 2 or 3, you end up with 4 or
    5 and more ... Doesn't get drastically bigger." Two or three at first, four to six at the top,
    single or in small blocks, never more than twelve squares.
  - **A Vegas is doable, even easy if you know how:** "you end up with like Vegas 3s and 4s quite
    easily." Four to pop, built as a staircase: three of a colour a column, the third's partner
    hanging over the step below, so each clear drops it onto the next. A test replays a staircase
    (recorded with `tools/sail-bots.mjs record`) into a Vegas; the staircase bot is the only bot
    that makes them.
  - **Platforms break last:** "it's the opposite of what I said, where the platforms break last.
    So it waits to do kind of the platform break ... it gets like a Vegas before it's even
    cleared the first platform and then kind of chains down from there." Lines clear and chain
    first; a filled platform clears only once no lines are left, and its fall can chain on.
    (YPPedia's "Resolution order" has platforms then lines each round: the user's memory wins
    here, and the code notes YPPedia's.)
- **Sailing at sea (11 Nov).** Sailing's board is out anywhere at sea on **1** (a Sailing button on
  the sailing bar too), as 2 is her guns and 3 her oars (see "The puzzles' keys at sea, in one bank"). It's called Sailing wherever a player sees it,
  never "the rigging" (the user, 11 Nov: "It's supposed to be sailing, not rigging"; Rigging is
  another of Puzzle Pirates' puzzles, played from the same station). "You should
  be able to jump into the sailing puzzle whenever you want to ... it allows you to basically go
  really, really fast, and like in one go, like a trade winds, kind of, just jump multiple tiles."
  Each chain's run carries her that many squares straight ahead in one go, a gust played like the
  trade winds' squares, stopping short of rocks, land, locks, other water levels, and Kikkit's
  whirlpools and the reef but from the way through's mouth (`src/den-sailing.ts`; see "A way through
  only on purpose"). **Through the checkpoint's gate it carries her** (11 Nov; till then it stopped
  short): "It does not help you get through a checkpoint. The only thing that will do that is obviously
  the big sailing boost, but same with the whirlpools and the wind barriers is to just zoom over those."
  A gust's squares are gone before a gun's shot is down, so a big chain past its marks is untouched; one
  that ends on a mark is hit. A combo rowed on both sides does the same: it's the heavy combo that gets
  you through, either way ("not anything specific to either one"). 1 or Esc puts it away. The pair is steered live as it falls (`src/sail-pair.ts`),
  on the real game's keys (see "Sailing's keys, as the real game's").
- **The puzzles' keys at sea, in one bank (11 Nov).** "The R does not make sense as a button for
  sailing ... surely they should at least all be in the same bank of keys for activating the
  puzzles." Settled: "I think 1, 2, 3 makes sense." At sea **1** is Sailing, **2** Gunnery (her
  guns), **3** the oars (rowing), the order of their buttons at the right of the sailing bar. Each
  key puts its puzzle out or away, and from one goes on to another (from the oars, 2 says to ship
  them first). R, G and O do nothing at sea now. Ashore, 1 2 3 still take from the crates
  (`js/den/sailing.js`, sailKey).
- **Sailing's keys, as the real game's (11 Nov).** "when I press down, is it going down? ... isn't
  that rotate? space is supposed to be down". YPPedia's Sailing, Controls: "Left and Right arrow
  keys: Move the falling pair left or right; Up and Down arrow keys: Rotate the pair clockwise or
  counterclockwise; Space bar: Increase the pair's falling speed." So on every Sailing board (at
  sea, Kikkit's whirlpools' easy board, your turn in Tzz's lesson): ← → (A D) move it, ↑ (W, Q)
  turns it anticlockwise, ↓ (S, E) clockwise, and Space makes it fall faster, still steerable.
  (YPPedia doesn't say which arrow is which; ↑ was clockwise at first, and the user, 11 Nov: "could
  you really double check which way round the keys are rotating the sailing pieces? Because it feels
  kind of opposite to me." Their feel wins.) No
  key drops it to the bottom: it falls by itself (a row every 0.6 s). Of Space: "the space usually
  kind of speeds up the drop. It doesn't drop it entirely. So if you're like halfway down the screen
  and you just want it to get 2/3 of the way down or 3/4, you normally tap space just so you zoom
  kind of near the bottom but not at the bottom." A tap is a burst of a fifth of a second at a row
  every 0.04 s (five rows); held, it falls that fast till it's let go; a new pair needs a fresh
  press. The touch pad's Faster button is held the same way. Rules: `src/sail-pair.ts` (FALL,
  rush, ease), tested.
  - **Its look, from the user's screenshot of "a huge multi Vegas" (10 Nov):** 8 wide by 16 tall;
    the next pair top left; markers over the middle columns where pairs come in. Three balls,
    yellow knotted rope, white swirled sail, blue wavy water, a pair's halves joined by a little
    brown peg that stays after they land. Platforms are translucent tiles with a thin ledge, coloured
    corner brackets for the colour each square wants. A wave and a ship's sails behind the board.
    On a wide screen it's down the left; on a tall one along the bottom with a touch pad beside it.
  - **Balloons, so they pop (11 Nov):** the pieces are balloon animals (IDEAS.md, Tzz's lesson), so
    they're glossy and knotted, squash as they land, and a chain pops down the board a stage at a
    time, pop-pop-pop, its name rising as it climbs.
  - **Each pop shown for what it is (11 Nov, after Tzz's lesson):** "when things popped, it did not
    seem to be following the mechanics ... there was no chain of four or platform clear. It was ...
    a yellow on a white block, and somehow it cleared a platform." The board was drawing what the
    rules did (checked step by step), but a platform read as a white block. So before a step pops,
    what it is lights up for a moment (the step says, src/sailing.ts: a line's squares, a platform
    that went): a line's four ringed in their colour, or a platform's outline in gold. Then they pop
    together, the platform fading and its ledge dropping away. The same board at sea, Kikkit's and Tzz's.
    (Targets were first tinted the colour they want; that read as filled, below.)
  - **Pieces slot in as solid blocks; empty targets look empty (11 Nov, Tzz's board beside a video of
    a real Vegas):** "when you slot something into the platform visually, it goes from a circle to
    ... it almost slots in perfectly, like it's a solid square of color ... They just look like
    they're kind of hanging on the background. There's not that same visual impact." And "I thought
    she'd completely filled the platform. Why is it not being set off? ... I think it's all visual":
    tinted empty targets read as filled. So a piece that comes to rest in a target of its own colour
    squares off into a solid block of that colour filling the square, its symbol on it (a quick
    swell and flash as it seats), and stays a block till the platform goes; a piece in a target of
    another colour, or on a square that's no target, stays a round balloon. An empty target has no
    fill at all, the board showing through, only its thin outline and corner brackets in the colour
    it wants. A finished platform reads as solid colour, one with a gap as plainly one short; it
    lights up gold only once its last block has seated.
  - **Bigger in Tzz's lesson (11 Nov):** "that puzzle can be a bit bigger. It's very tiny." Her
    board's stand is taller than she is and the lesson's shot closer in (src/den-tzz.ts), her and it
    both in frame.
  - **Sparkly full sails when you sail well, "very importantly" (11 Nov):** "when you do well in
    sailing, you normally get like a sparkly indicator to show how well you're doing ... you need
    lots of sparkly full sails like in the game." A sparkle meter on the board fills with your
    chains and drains slowly (a booch knocks most of it out); her own sails sparkle with each
    chain, a little glitter for a Double, and on a Vegas they billow full and gilded, sparkles
    streaming aft and a whoosh of wind, holding while the gust lasts and fading after. It's what
    Kikkit's "really, really big and really sparkly" ramble is about, so her lines must match.
  - **Seen from behind her, and never under a toast (11 Nov, seen when it was built).** From the
    usual camera at sea, behind her and above, her sails were seen at a slant, nearly edge-on, and
    a belly out toward her bow hardly showed, so a Vegas's billow barely showed. Now the billow
    squares her sails across her (the gust's right behind her), so from behind they face you full
    on, and swells them wider and taller, their bellies deeper, on top of whatever the wind does
    (src/den-sailing.ts, billow); the sparkles come off the side of the cloth the camera sees. The
    camera's no different. And on a phone the den's big toast covered the Sailing board for a moment
    after a chain: with the board out, toasts go in the sea it leaves, no wider than it, and on a
    tall screen smaller, just under the den's panel, so they're never over the board.
- **What a clear leaves in the air falls at once (12 Nov).** "when you clear a platform, pieces just kind
  of floating in the air until the next piece hits the ground." After a drop's last clear, a platform's
  or a line's, whatever it held up falls straight away, as a step of its own on the board, not when the
  next pair lands (src/sailing.ts, a last 'fall' stage).
- **A quick tap of Space is a nudge (12 Nov).** "A quick tap of the spacebar also seems a bit overpowered in
  sailing. It's like, whoa". The pair falls a row every 0.06 s while Space speeds it (it was 0.04), so a
  quick tap is three or four rows, not five or more; held, it still races down (`FALL.FAST`, src/sail-pair.ts).
- **Sailing's pair pushes off a wall as it turns (11 Nov).** "it doesn't turn when it's against the
  wall. If you rotate it and it's against the wall, it should kind of push away from the wall." A turn
  that would put a half into the wall or a piece steps the pair a column away (from the nearer side
  first, then the other), or a row up (Sailing.turned in src/sailing.ts, used by the pair as it falls and
  by moves() alike).
  - **Fixed: the pair jumped back up the board after Space and a turn (12 Nov).** "if you hit the space
    bar and then rotate the piece, it kind of jumps halfway back up the screen." Pushing off a piece
    could put the pair in a nook (under a ledge or a pair's overhang) that moves() didn't search, since
    it only turned in place; where it came to rest wasn't a place Sailing.drop would take, so it was
    dropped straight down its column from the top instead, landing on whatever was over the nook. Now
    moves() turns the way the pair does, so it lands where it was turned (tests/sail-pair.test.ts).
- **Sailing's platforms are blocks, never a little row (11 Nov).** "Platforms never look that small.
  Like, they're always like 2 by 3 or 3 by 3, aren't they? I mean, check the actual official pages."
  YPPedia's "Sailing" page gives no sizes in words; its "typical sailing board" picture shows a 2 by
  2 and two 2 by 3s. So platforms are two wide (three wide as it gets harder), two or three high, on
  every Sailing board: at sea, Kikkit's whirlpools' easy board, Tzz's lesson (src/sailing.ts).
- **A platform's colours, as the real game's: no colour on top of itself, gaps on a zigzag (11 Nov).** "it's
  almost like a grayed out block ... on the platform, it's just like a gap. Like that definitely does
  not happen in sailing ... I never feel like I've seen the same color on top of each other. They
  either kind of, if they're going to do that, they're either next to each other, or you can have
  like really big platforms with like a diagonal shape"; and "white and yellow next to each other,
  and then another white and yellow above them ... I've never seen that pattern. They would always
  be alternating." So a colour runs on side by side or down a diagonal, never sitting on itself
  (src/sailing.ts, paint); Tzz's boards were already so. Then, of the gaps: "Yeah, you can get gaps
  ... they're usually diagonal to each other. So ... if you've got 2 by 3 square, you'll have 3 that
  are part of the platform that have to fill with colours, and they'll be all on a diagonal, so then
  the gaps will be on the corresponding other kind of zigzag. But there's no kind of grey outline.
  It's just empty space. There's no graphic for it, which I think is what really confused me." So a
  platform is targets all over, or (half of them) targets on a zigzag with the gaps on the other, and
  a gap is drawn as nothing at all, only the platform's ledge running under it.
- **Duty Navigation (11 Nov), built by the real puzzle.** The night sky in front of a hidden cliff door,
  each constellation lighting its stars on the rock ("The starlit door", below). One module, `src/navigation.ts`,
  knowing nothing of the den; its look `js/den/nav-board.js` (`navBoard`); played on its own in the
  unlinked `navigation-test.html`; bots in `tools/nav-bots.mjs`. As YPPedia ("Navigation", read 11 Nov)
  and its two pictures of a board have it:
  - Its look, checked against YPPedia's board pictures at full size (11 Nov, after "double check the
    graphics ... are they definitely following it?"): an upright panel, 3 wide by 4 high, "Navigation"
    in pale serif letters at the top, a pale crescent moon top left, a navy night sky with a few faint
    stars, and from the middle down a flat painted sea of wavy navy, teal and royal-blue bands. On it
    an olive-gold ship's wheel whose handles reach the panel's sides. Three rings of eight places, on
    the spokes: the outer ring is the wheel's own broad rim (white tick marks round it), the middle a
    second broad rim, the inner a thin ring by the hub. Thin spokes run out past the rim to handles,
    each a little ring with two leaves. Gold filigree in the hub: a half dome, an anchor, and a ship's
    hull of peaks and loops at the bottom. Stars of five colours, glossy and cut (each point a light
    facet and a dark one), each its own shape: yellow a fat six-pointed star, red a sharp five-pointed
    one, orange a spiky burst, white eight thin points, blue a compass star (four long points, four
    short). The ring selected is a little brighter (the pictures don't show how the real one marks it).
    The next star waits out on a spoke's handle with a pale halo; Space drops it in and it falls toward
    the middle down that spoke. Without its sky (`sky: false`, for the cliff) it's the wheel alone,
    square.
  - Up moves to the higher ring, Down to the lower; Left turns the ring selected anticlockwise, Right
    clockwise, its stars with it (WASD too; the mouse picks the ring nearest it, a left click turns it
    anticlockwise, a right click clockwise). A star with nothing under it falls in.
  - Three or more of a colour in a line vanish: a spoke all of a colour (out from the centre), or
    three or more in a row round a ring (round its join too). What falls in can line up again (a
    cascade). Lines score little: a point a star, times its step in the cascade.
  - The constellation: places marked in colours, nothing joining them. Empty, a thick ring of its
    colour round a dark middle with that colour's star outlined in it; holding its colour, a coin of
    it with the star on it; holding another colour, the ring with that star sitting in it. Fill every
    one and it vanishes, its stars with it, and scores; a new one's shown. Down the panel's bottom left
    a column of little stars, lit from the bottom, and at its top right a cluster of four small ones,
    as in the pictures; what they mean isn't said, so here (made up) the column is a star a place,
    all lit until you pass par and then going out as par / moves, and the cluster sparkles as a
    constellation goes.
    Made with a line at once, the constellation goes first (YPPedia: such a part "must be completed
    last").
  - Its points: 10 x stars squared, times par / moves when over par (par 6 + 4 a star), times 3 when
    a combo (a line clearing, what falls then filling it) finishes it. Rated Poor, Fine, Good,
    Excellent, Incredible at 10, 30, 60, 120 points, so one or two stars can only rate low, as on
    YPPedia.
  - A booch: dropping a star onto a star in the outer ring. 25 points off, the board blown clear of
    stars, and the constellation rated Booched (the ship turns about).
  - Made up, as YPPedia doesn't say: the points, par and ratings' thresholds; that Up is outward; the
    booch clearing the board; the next star's spoke and colour plain random; turns and drops are the
    moves counted (choosing a ring isn't); constellations' places weighted toward the middle (filled
    from the centre out, its strategy) and never a line of three of a colour among themselves; sizes
    one star, then two, three... a constellation (SIZES, a host can give its own, and fewer colours).
  - A first go is the first three, one, two and three stars (FIRST_GO): the greedy bot takes about 66
    moves over them (15, 21 and 30), a minute or two at the keys, and booches about once in thirteen
    goes.
- **Port Decorum towers over the sloop (11 Nov).** "just looking at port decorum size relative to the
  sloop. Isn't the wall for it going to tower over that? ... we've clearly got a scale problem here."
  Its fort's walls were lower than her mast, its towers lower than the checkpoint's. Now its curtain
  walls are 7.5 m (her mast's top is about 5 m), its towers 10.5 m, its keep 13.5 m, the tallest thing
  on the sea; the town's buildings two storeys, their doors still pirate-sized (js/den/imperial-isle.js,
  FORT).
- **Port Decorum is safe to look round: no guns on it (11 Nov).** First asked for gun turrets on its
  towers, too many and too fast to take on, enforcing a no-access area; then: "Actually, no, I've
  changed my mind on the [Port Decorum] cannons. It's fine as it is. I don't want that mechanic too
  much. It's just going to get irritating. Like, you want to be able to check out the port without
  being blown up." So its fort has no guns that fire, and nothing there sinks you; the jetty guard's
  halt and grumbles are all the warning it gives.
- **Port Decorum's back way in: the smugglers' beach, only by way of the whirlpools (11 Nov).** "for the
  Imperial Outpost, the kind of beach, so the back way in, I think that will be better, like, accessed far
  through those whirlpools by, you know, [Kikkit]. I think having it one open area is a bit off ...
  Penguin Island, and then you have the, you know, Smuggler's Beach there. So that you can go sell the rum
  made by [Helium] ... redesign the fort so that, you know, there's some rocks and whatnot blocking some
  back entry ... for that mechanic to plug into later." So a line of rocks, drawn as the reef is, shuts off
  Port Decorum's back from the open sea, from its left-hand shore round behind it and up its right-hand
  side to the rocks round Vegas Island (its front, jetty and quay as they were, open sea two deep there).
  Behind them a narrow run of water leads from beside the penguins' water down to a cove at the island's
  back, behind the warehouse: a little sandy beach, a lantern on a post, crates and barrels under a tarp,
  a rowboat drawn up (shared furniture, placed from config). The run's one way in is off the penguins'
  water (a Vegas over the whirlpools gets you there), turning out of it to starboard; its top opens onto
  the whirlpools' wind, so the way home is spat back to Kikkit's island ("too many lefts"). A test searches
  every way she can go without the whirlpools (her moves, the winds, a chain's gusts) and finds nowhere
  behind the rocks; another sails it: a Vegas to the penguins, the run, the cove. The pilot never takes
  her there from the open sea. A hidden gem: nothing names it till you're in its cove ("A smugglers'
  beach, round the back of Port Decorum! Not a guard in sight"), the captain's map draws the rocks whole
  (the run as rock) till you've been, then the beach and its name, and it's a hidden place on the quests
  (of 4). Nothing to do there yet: smuggling, and Helium's rum, plug in there. `?at=smugglers`, and named in the cheats like Umami's rescue (the
  user, 11 Nov: "having it there is fine for now. So this is all just a demo proof of concept thing"). Rules:
  `src/den-smugglers.ts` (its squares `LAY.SMUGGLERS`); drawn by `js/den/smugglers.js`.
- **Primates Rule out past Port Decorum (11 Nov).** "it's ready for that [war frig] to be dropped in maybe
  a bit past in that same kind of deeper ocean area near where the [Port Decorum] is. The Imperial
  Island, I'm sure if you go over to the left, you'll ... find the [war frig]." So she lies at anchor out
  past Port Decorum, beyond its back, off to its left (squares 3 to 6 across, 34 out), still marked as
  coming, still not to be sailed through, open sea two squares round her. The sea grew three squares out
  to sea for her (37 rows), everything already there staying put, the old wreck's wind running on to the
  new edge (so still no sailing round its far end to the locks: she lies in it, so from Port Decorum's
  side you sail up to her as far as its edge, two squares off her, near enough to say she's not ready).
- **The sloop race (11 Nov), its second pass.** "a winding, snakes and ladders, zigzagging kind of course,
  just with a lot of shortcuts, and each shortcut is a different puzzle, and you have to choose either the
  long way round, just ... without doing anything", "it should be significant", and of the first draft:
  "Obviously, this will be out near where Primates Rule is ... We're going to have to go through several
  iterations of this course." A minigame, not a sea battle ("creative new mechanics, and tutorials").
  RACE.md is its design document, with the reasoning and the simulation's numbers.
  - **Where:** its own place out past Primates Rule, behind a line of rocks right across the sea (row 37)
    with one gate in it, right of the old wreck's wind, so nothing on the den's side changes. The sea grew
    to 74 rows for it (65 for the first draft); the captain's map still shows the 37 it had (the course is
    off the map, `SAIL.CHARTED`). It's laid out on the den's own sea, from a few numbers in
    `src/den-sail.ts` (`RACE_LAY`, `LAY.RACE`), to rework freely; `tools/race-measure.mjs` measures it.
  - **The start (11 Nov: "pick your starting spot along the starting edge"):** Space by the buoy off the
    gate takes her in to the starting line, behind the line of rocks; A and D move her along it (never onto
    a rival's spot), 1 to 3 pick how many rivals race her; the starter's card explains the race and says
    who's racing; Space, and he counts you down.
  - **The start's field, fresh each race (12 Nov: "there should be some element of randomness to it so that
    it's not the same on every single thing"):** six rows below the line of slow winds and whirlpools to
    eyeball a way through ("you would say left into a whirlpool because the wind action then takes you one
    tile further up"), laid from the race's seed (`src/start-field.ts`, `Race.seed`; online, the room's, so
    everyone's is the same, shown in the lobby before the count), always with a way through from every spot
    (checked with the pilot; a draw that fails is laid again). Two or three plain whirlpools and six to nine
    short runs of slow winds, leaning toward buoy 1 on the left, back on the right. Fixed in it: a conveyor
    along its first row from the left-hand edge that sets her down above the hop; on the right past the hop, a
    row of headwinds and, under them, a wind back into the hop's lane; and **the hop** (12 Nov: "that could
    have a nice hop to the ball thing to get started"): a row of headwinds over a walled lane (columns 15 to
    20) that runs her along and down onto leg 1 at column 21, toward buoy 1. A Double from the row above,
    facing down, hops the headwinds into the lane (about 10 s saved, as the Double's gap); anything less and
    she's blown back up a square. The quickest spots are above the hop and on the right; the far left is about
    ten seconds slower (`SIM.SPOTS`, the mean over many fields).
  - **Two kinds of wind, in Puzzle Pirates' order (12 Nov: "the trade wind kind that really just blows you
    and you don't get the chance, but you also need the slower wind that only nudges you one per turn"):**
    each move goes her own move first (left, forward, right; or staying put, idle, after a breather), then
    the square she comes to rest on acts once: a slow wind pushes her one square its way (`Sea.nudge`), a
    whirlpool turns her clockwise to its opposite corner, a quarter turn clockwise (`src/den-whirl.ts`). A
    square that puts her on another special square acts no more that phase (YPPedia: "it has no effect for
    this phase"). Trade winds stay instant: the snakes, the lanes a Double, Triple or Vegas hops, the hop's
    lane. Slow winds are drawn as soft dotted tiles each with one arrow, nudging the way they blow; trade
    winds as racing streaks. The pilot reckons with both.
  - **The course:** five legs, two squares deep, back and forth, a spit of land between each pair, the long
    way round its end; the course's own breeze blowing out across it (every leg a reach, every bend a run).
    The run home is one square wide, sailed left to the finish line. About 3:42 the long way.
  - **Knowing where you're going (11 Nov: "clearer [buoys] for the main route"):** a tall numbered buoy at
    each bend of the long way, on the outside of its turn; the one she's sailing for lit, its lamp and its
    number bright; the clock's bar says "Leg 2 of 5 · to buoy 2". The gate's flags and the finish flag are
    gone. Shortcuts are never marked.
  - **Snakes, gentle: a few squares back, to try again, never a lost race (12 Nov: "that's really too brutal.
    That sends you back almost 2 legs worth ... it should send you back by a few tiles and basically make you
    repeat the thing ... I don't want it to be rage-inducing"; the tight water's "3 or 4 squares ... that's the
    kind of snakes and ladders level that's a good tune"):** each carries her three or four squares back, to
    the start of what she was doing (tested, `tests/den-race.test.ts`):
    - **The tight water past the gun gap:** a move too far out of the gap, and its wind along leg 2's second
      row carries her three squares back toward the bend; a turn to port out of the gap is the way on.
    - **The trade wind back across leg 3:** a wind across both rows of leg 3 (column 23) up into a notch in
      spit 2's far face, back along it three columns and down onto the leg again: a loop. A Double from right
      behind it or a square further back, either row, hops it (lined up, as the wind gaps are); less, and
      she's three squares back to hop it again. Every racer on the long way meets it.
    - **The left-hand trade wind:** beside each left-hand bend (spits 2 and 4), up the left-hand edge past the
      spit's end and back out onto the leg she was finishing; and along the run home's second row, a few
      squares blowing back the way she came, then one blowing her up onto the run home again. Beside spits 1,
      3 and 5 the edge is land now, so nothing's swept down it.
    The starter calls out each one ("A few squares back: round ye go again").
  - **A shortcut through each spit, and every size of them,** each a puzzle the den already has, by its
    one module (`RACE.DECENT`, tested). **In proportion (12 Nov: "each an element of puzzling surely should be
    the same distance"):** every stopped puzzle's shortcut skips about the same stretch, about 22 seconds, each
    puzzle sized to about the same time to play, a decent player about breaking even, a good one gaining; the
    chain hops grow with their chain. As laid: spit 1, the imperial gate (column 19), its Quad, its guns shot
    quiet, run, or its guard bribed with the wreck's 40 coins (22 s); spit 2, the headwind gap, rowed (25 s),
    and the Double's gap (9 s); spit 3, the whirlpool channel's Vegas (48 s), the rocks (25 s) and the barrier
    of driftwood (16 s, where spit 3 has room); spit 4, the locks, 6 Bilge clears to raise her (23 s); spit 5,
    the crane, its small frames (23 s), and the Triple's gap (14 s, "a Triple clearly bigger"); and the starlit
    door (40 s up on leg 3). On the long way, leg 4 before the locks is the zigzag: headwinds blowing back along
    it, alternating side to side; weaving through takes about 17 s, hopping each with a well-timed Double
    about 9. Every shortcut's way in is a gap beside a leg, plain to see as she sails by, and reads as what
    it is (12 Nov): the starlit door a door, the headwind gap a channel with its wind drawn in it (spit 2's
    cliffs low), the wreck in its own notch.
  - **The rocks blasted open for everyone (12 Nov: "once it's been destroyed, that opens it up ... for
    everybody, not just them ... it's a way for the loser to catch up ... Maybe you could do it with like 3
    gunshots or something"):** a wall of grey boulders across the mouth of a gap in spit 3 (column 17), off leg
    3, along from the whirlpool channel. A broadside that comes down on it (her port side, sailing along leg
    3, either row) is a hit, anyone's, counted by the race's field (`Field.rocks`); each knocks a course of
    boulders off with a burst of stone; at three (`RACE.ROCKS.HITS`) the wall falls, rubble heaped against
    the banks, and the gap's open water for every racer for the rest of the race: down through spit 3 onto
    leg 4 (25 s). Out in the open. Her shots are her budget (two at the gun, four at most, more by Gunnery),
    so blasting costs what she'd fire at rivals. Online, the room keeps the count, everyone's, in its
    snapshot. The rivals' bots of the rocks' route load their shots on the move and fire as they come by;
    any racer who comes to them down goes through, free. A new race, they're back. Rules: `Rocks` in
    `src/den-race.ts`; drawn by `js/den/race-rocks.js`.
  - **The barrier of driftwood (11 Nov: "You just have to clear the barrier"):** a jam of logs across a gap
    in spit 3. She sails into the notch in front of it and Space stands a board of Foraging on the jam
    (`src/foraging.ts`, played as Umami's), dealt with two bundles of driftwood on it and nothing more to
    come; cleared down off the bottom, the jam breaks up and floats off, and the gap's open water for the
    rest of the race (a new race, it's back). **Sheltered:** the notch is tucked into the spit, between the
    gap's banks, so no broadside reaches her there; with the whirlpools on the same spit out in the open, it's
    the leader's shortcut on that stretch.
  - **The gun gap as an imperial gate, and its bribe (12 Nov: "build the bribe gate ... to show how many
    different ways you have of really getting through the course"):** the gap wears the Empire's look, as the
    checkpoint does (the same gatehouse and bastions: `js/den/empire.js`): a gatehouse of pale stone over its
    way in, crimson banners, the Empire's flag over its arch, its guns on the Empire's bastions, and a guard in
    the Empire's uniform on a step at the foot of its left tower. He halts you as you come up, grumbles now and
    then, names his price and hints at a wreck back along the leg (`src/lines/gate-guard.ts`). Its ways through
    are as they were, and a third: **pay him.** The coins come from an old wreck run aground at the back of a
    notch in spit 1, off leg 1, before the gate: lie in the notch and Space lays Treasure Haul's own board on
    the water behind her (`src/treasure-haul.ts`), no chest on it, just his price in coins to bring up (40,
    `BRIBE.PRICE`); Esc leaves it as it is, to come back to. **Sheltered**, as the other notches are; one racer
    at a time. With them aboard, stopped by the gate (in front of its way in, or a square either side, on leg
    1), Space pays him: his guns hold their fire on her for the rest of the race, and his men warp her through
    on the gate's line, through the gap's three squares and out onto leg 2, carried as a gust carries her (out
    of anyone's reach). Short of his price, he sends her back to haul the rest; paid already, he waves her on.
    Each racer hauls her own; a new race, the wreck's coins are back and the gate's unpaid. No rival takes it
    yet. Rules: `src/den-bribe.ts` (its squares `LAY.RACE.BRIBE`); drawn and played by `js/den/race-bribe.js`.
  - **Sheltered spots off the leg:** the crane's ledge is a notch in spit 5, off leg 5; a racer waiting her
    turn at the up lock waits in a berth, a notch beside its way in; the barrier's notch; the wreck's notch. Each has a wind along
    the leg in front of it, so she can sail back out under sail.
  - **The finish (11 Nov: "a more ceremonious finish goal line"):** a line across the run home between two
    striped towers, one on spit 5 and one out past the left-hand trade wind, a chequered banner strung between
    them and a chequered line on the water. Over it, a burst of colour and a card with her time and place.
    Past it, Space takes her back out to the starting buoy for another go.
  - **Your rivals, the den's own characters (11 Nov: "Everyone's got their own little profile and way they
    approach it"):** up to three sloops racing you, three to start with, one to three picked on the line
    (one is Kikkit; two, Kikkit and Tzz). Each is the sloop's own look in her colours (Kikkit's red sails and
    black flag, Tzz's blue, Dalnoth's gold), her pirate at the tiller, and sails from her own spot on the line
    her favourite way round in her own style, as the simulation's bots do (`src/race-sim.ts`, `simDrive`):
    Kikkit greedy for the Vegas over the whirlpools, stopping at the channel's mouth in the open, and firing
    on anyone she finds sitting still; Tzz steady, hopping the Double's and the Triple's gaps on the move,
    never firing; Dalnoth (in Daquan's place till Daquan's drawn) through the barrier of driftwood, Umami the
    capybara aboard on her foredeck doing his foraging, and firing on anyone sitting still, loading more by
    Gunnery. Each is a level better at her own route's puzzle. A rival builds her own crane and clears her own
    barrier; none takes the starlit door. Each has a line on the line before the gun and one over the finish
    line, in a bubble over her sloop. Home in about 3:13 (Kikkit, her Vegas chancy: 3:00 to 3:45), 3:24 (Tzz)
    and 3:36 (Dalnoth), against the long way's 3:42 sailed. Your best time's kept in this
    browser.
  - **The race explained (11 Nov: "Here are your options"):** the starter's card on the line: the long way;
    the field (slow winds and whirlpools, fresh every race, and its hop); shortcuts that cost a puzzle with a
    few named (bilge up through a lock, build a crane, row the headwind gap, zoom over the whirlpools on a
    Vegas, hop a headwind with a Double, haul up some treasure and pay off the guard at the gate, blast the
    rocks off leg three, three hits and they're open for everyone, and the starlit door); the winds that
    sweep ye back a few squares; and that the others shoot you if you sit still in the open.
  - **Racers shoot each other (11 Nov):** "I definitely want to be able to shoot other racers. That's
    absolutely part of this." Q and E fire her broadside, as anywhere at sea: a rival on its squares, before
    any rock or land, is holed, sits low and smoking with stars over her till she's patched, then races on.
    Your rivals fire on you by their styles when you've sat on one square a second and a half in the open: a
    flash and smoke on her, and you patch her deck as after any hit (knocked off the starlit door's board, if
    she was at it). At the gun she's loaded up to two shots, one a side; the clock's bar shows her shots.
  - **Two to four racers on one course (11 Nov; on the water since stage 3):** "start adding multiple players
    to this first, even if it's like 2 to 4 players with some bots". The field (`src/den-racers.ts`): each
    racer's pose, the stretches she's reached in order, what she's doing (sailing, waiting her turn,
    puzzling, dazed, carried by a gust, the crane or the tunnel, finished), her time and place. The den's
    race is you and your rivals. The clock's bar shows your place as you race ("2nd of 4"), by how far round
    the long way each has got; over the finish line the card lists everyone's places and times, those still
    racing filled in as they come home (shown again once they're all home).
    - **First come, first served:** the up lock, the down lock, the crane, the barrier's notch and the
      wreck's notch are each one racer's at a time; the next waits her turn, in the order they came ("If you got through it first,
      we get through it first").
    - **A broadside three squares out of her side** (`SAIL.RANGE`), stopped by rock or land (no shooting
      across a spit), holes the first racer on it who can be hit: dazed, still, till she's patched by
      Carpentry, never knocked out, and not hit again till she's patched. Every racer starts with two shots
      (`FIELD.SHOTS`), holds four, and loads more by Gunnery.
    - **Sheltered:** in a lock's chamber, the canal between them, the berth, the crane's notch, the
      barrier's notch or the wreck's notch, nobody's broadside reaches her; nor while she's carried. Everywhere else, stopped,
      she's a sitting duck for whoever comes by (the user: "Some can be safe, like ... the locks and the
      crane").
    - **The gun gap's guns take the same shots as racers,** a hit a gun to quieten (`RACE.GAP.MODE`
      'shared': leaving other racers in peace pays), settled by the simulation; and roused, they load
      again in 6 s, not the checkpoint's 4, since in a race they fire on whoever comes near ("If they're
      aggroed, they are very relentless").
  - **Simulated, and laid to it (11 Nov):** "a test harness underneath this ... where you don't need to worry
    about the graphical elements ... and just actually make sure they all have a relatively equal chance of
    winning." `src/race-sim.ts`, run by `tools/race-sim.mjs`: bots of every route and racing style, from
    their spots on the line, raced on the course as laid over many seeded races; `tests/race-sim.test.ts`
    fails if a route wins under half or over 1.6 times its fair share in a field of four, if a style or a
    part of the starting line strays far from fair, or if a leader has no shortcut worth taking (sheltered
    or on the move) on some stretch. RACE.md §8 has the numbers.
  - **The starlit door:** a door in the cliff of the second spit off leg 2 (squares 15 and 16 across, 52 out)
    and its tunnel's one exit, a cleft in the spit's far face onto leg 3 (54 out), `LAY.RACE.DOOR`: "The
    starlit door (11 Nov)", below.
  - **Watched: four bots and no player (12 Nov):** "are you able to show me a link today to just see all four
    bots?", and as a spectator "I can see the puzzle, as I said, the puzzling, the just move around free
    camera, including jumping between watching each person in the race." `?at=race-watch` (and a cheat, "Watch
    the sloop race"; `&seed=` a race of its own, the same every time): Kikkit, Tzz, Dalnoth with Umami, and
    Gravee (`WATCHED`, `src/den-rivals.ts`; her racing in `src/lines/gravee.ts`), up through the locks,
    pumping the up lock by Bilge, cautious, from spot 10, a way round none of the three takes. They race on a
    field of their own, sailed by the same bots as race you (`sail`, `you: false`); your sloop waits out of
    sight by the buoy.
    - **The camera:** free (W A S D or the arrows move it over the course, Q E or a drag turn and tilt it, the
      wheel, - = or a pinch zoom), or following a racer: 1 to 4, Tab the next (from the free camera, the
      leader), Shift+Tab back, 0, F or Esc the free camera again. Following, the same turns and zoom go round
      her. N another race, X stop watching (back at the helm by the buoy), P pauses.
    - **The bar** along the top: the clock, who you're watching, her place ("2nd of 4"), her leg, and what
      she's doing in plain words ("pumping the lock (Bilge)", "building a Vegas at the whirlpools' mouth",
      "sailing the long way (Sailing on the pilot)", "holed! Patching her deck"); and the four of them in
      their places, a click to follow one.
    - **Her board as she plays it:** the puzzle she's at, its moves the puzzle's own bot's on its own rules,
      drawn by its own look, paced to the simulation's seconds (`src/race-watch.ts`, `boardOf`, `paceOf`),
      so the race is the one the balance test runs: Sailing down the left of the screen, as at sea, a pair
      steered down a move at a time (on the pilot, a Double or Triple built on the move, a big combo for
      the gap; a Vegas at the whirlpools' mouth is one the staircase bot made, its last drops played in her
      time, the last as it comes off, a fresh one for each go); Bilge on the up lock's quay, its water going
      down as she pumps; Foraging on the barrier's jam; Gunnery on her deck while she loads (a shot she
      fires is a gun fired on her board); Carpentry on her deck patching a hole (a piece lifted back out if
      a gap's shut in). Her mast is struck and she stands at her stern while a board's on her. Rowing's
      boards aren't drawn yet (nobody watched rows). Only the racer you follow plays hers; each keeps her
      boards as she left them.
    - **The door stays a secret:** nobody watched takes it, and nothing said names it (tested).
  - **Racing your friends online (12 Nov, a proof of concept for playtests).** "a handful of people playing
    if we get to play testing it", never peer to peer: one room runs the race (RACE.md §6 has the build).
    - **A real lobby, no codes (12 Nov, after the user's first try online:** "how do I know that people are
      here instead of bots?", "you can either wait for people, start with bots", "I [don't] think I want
      people to share codes. You should just see a lobby and be able to join it", and "I eventually found the
      race online thing. That really was not clear"):
      - **The way in:** Race online on the den's top panel (from anywhere: out to the race's buoy and in to the
        line), on the starter's card at the line, or O there.
      - **The open races** (three, `NET.LOBBIES`): each with what it's doing and who's in ("Waiting: Anne",
        "Racing now · next: Cara", "Nobody yet", "Full"), and Join, one click. A pirate name once (kept, as
        the crew's). No code to type or share; a private race's link, `den.html?at=race&race=CODE`, still works.
      - **The room's lobby:** the course's chart; who's in, each row her sails, her name and PIRATE or BOT
        plainly (a player's sloop a bot's taken over: "bot sailing"), Start ✓ or waiting; − + how many racers
        in all (four to start, bots filling what players don't, one at least); and two choices, **Wait for
        pirates** (where you start) or **Start now** (bots fill the empty places). Everyone's pressed Start:
        the count at once. Someone has: "Anne pressed Start: off in 15s", whoever's pressed it by then racing,
        the rest racing the next. A D your spot (never another player's), Space start or wait, Esc or Leave.
      - **A race on that you're not in** (you came in during it, or a bot has your sloop): who's racing and
        their places, and "Next race:" who's waiting for it, you among them; Race the next one to be in it.
        Once every player in it is home or out, with someone waiting, the race is called 20 seconds later.
      - **After a race:** the places for 15 seconds (Race again to be in the next; everyone pressing it goes
        straight there), then the lobby again for the next race.
    - **Racing and in the lobby, only what applies:** the den's top panel only its name, Race online and
      Pause; the starter's card a line of the race and who's racing ye, the rest behind How it works; no
      sailing bar on the line; the sailing bar's keys without H: head home (H does nothing in a race) and
      without the puzzles' keys, already on its buttons.
    - **Who's who on the water:** a name over every sloop in the race, small, over her masthead: a pirate's
      in her sails' colour, a bot's dimmer and marked BOT; yours too online, "(you)".
    - **The count and the gun are the room's,** the same in every browser; then each sails and puzzles her own
      sloop as alone, everyone else's sloop drawn a moment behind, in their own sails (players' by their
      place in the room), their names over them at the count.
    - **One at a time at a spot:** a lock, the crane's ledge, the barrier's notch or the wreck's is whoever's
      who got there first; while it's someone else's it's shut to you ("Tzz has the up lock: wait yer turn")
      and you're put in the locks' berth (still in line for it) or in front of it; it's yours when they're
      through.
    - **Hits:** your broadside on someone holes her in every browser; you can't hole her again till she's
      patched. A bot's broadside or a friend's on you holes you, even if you missed seeing it fired.
    - **Places and times** are the room's; the finish card fills in as they come home.
    - **A closed tab** has six seconds to come back; then a bot sails her sloop home ("A bot's sailing yer
      sloop home now"). Sailing back out of the gate does the same at once. A lost room: back to racing alone.
    - **Every race online is written down** (its seed, each player's actions by the race's steps, what the
      room heard and decided) and kept, to replay exactly; the viewer's still to come. During a race the
      helm runs in whole steps, sixty a second, alone or online.
  - **From the user's playtest (12 Nov), as built:**
    - **The locks a beat, not a wait:** "I was spending just as much time waiting for the ship to go forward
      ... it shouldn't feel like you're losing the race because you're waiting on the animation." A lock's
      water and gates are quick wherever locks are (above: 0.8 s to drain or fill, 0.4 s its gates, the
      last of a lift there in a moment), and the race's locks are made ready for each race (`readyLocks`):
      the up lock drained to go into, the down lock full from the canal to go into, so nothing fills that
      only drains again. Pumped up, she's through both and out on leg 5 in about two and a half seconds
      (the whole trip, sailed, 4.3 s; it was 10). The locks moved two squares toward the bend (column 11)
      to keep their saving honest (23 s; RACE.md §8).
    - **The buoys' numbers seen at any distance:** "[Buoy] markers ... usually vanish unless you're at the
      right distance." Their boards were painted over by the sea's see-through water and wind lanes (a
      sprite keeps no depth), faded by the fog, and past the camera's far plane from a wide view. Now drawn
      after the water, out of the fog, kept inside the far plane along their own line of sight (looking
      the same size), and never smaller than about a thirtieth of the view's height (`js/den/race-marks.js`).
    - **The wind gaps lined up for you:** "it's a bit awkward to set the ship up to get through them." A
      gust big enough to hop a gap, broken anywhere in its mouth, swings her onto the square in front of it,
      facing through, and carries her on over (`LAY.RACE.LINEUPS`; `src/den-sailing.ts`, `lineUp`): the
      Double's gap from either row of leg 2 a column either side of it, the Triple's from either row of leg
      5 a column either side; a zigzag headwind from right behind it or a square further back, sailing at
      it. Only if it carries her clean over (ending clear of any wind or whirlpool); else it's a plain gust.
      Never marked. The Double's gap saves 9 s now (it was 8).
    - **Space at the start buoy with the Sailing board open is the board's:** it speeds the pair, never takes
      her in to the starting line (or pays the gate's guard, or anything of the race's): `boardHasKey`,
      `Race.takes`.
    - **The starter's card names the bribe:** "haul up some treasure and pay off the guard at the gate",
      among the ways through. The starlit door stays unmentioned.
    - **The barrier a square along (12 Nov: "how do you get to it? Like, you have to spin on the spot after
      jumping over the, that snake trade wind thing. It just feels like it's one square off"):** it, its notch
      and its gap moved a column east (column 21), two past the trade wind back up the course. A Double over
      that wind along leg 3 lands her a square short of it, and one turn to port takes her up into the notch
      from the leg's second row (from its first, a turn and a move). It saves 12 s now (it was 15; the helm's).
  - **No gambles (12 Nov: "it just seems no cost to taking that gamble right at the start ... not really in
    the ... good sportsman-like spirit", and "Yes, drop both"):** the veiled wind and the turning pool are
    gone, the turning pool's spit plain land again. Never rage-inducing (above): any risk left on the course is
    mild, a whirlpool turning her a bit the wrong way or a snake a few squares back, never a race lost to luck;
    every whirlpool turns the same way, clockwise (12 Nov, of a rival in the turning pool: "they kind of went
    left into it and then ... came out as it was like into the right turn ... That is not how a whirlpool
    works").
  - **Your own course (12 Nov: "having a map editor are going to be like the top of demands ... you'd need to
    be able to switch between 2D and 3D views"):** `race-editor.html` (RACE.md §10 has the detail).
    - **The chart:** the course in 2D in the race chart's look. Click a buoy, a shortcut or a snake (or its
      name) to pick it, outlined in gold; drag it along its spit, or ◂ ▸ (the arrow keys too); Esc lets go.
      Its numbers are in the side panel: the up lock's Bilge clears (3 to 20), the crane's frames (small,
      standard, large), the barrier's bundles (1 to 4), the guard's price (10 to 100 coins, in tens). The rocks move
      along spit 3 too. The start's field isn't edited (each race's own).
    - **Always a race:** each way through inside its spit, a column of land either end and between it and
      the next way through, where the legs either side reach it; the long way open round every buoy, every
      shortcut sailable. Anything out of place is listed in plain words and the chart's edged in red; it
      can't be shared or raced till it's put right.
    - **3D:** "Race it in 3D" (or the 3D tab) opens `den.html?at=race&course=...`: the den's race laid from
      the course, read once as the page loads, rivals and all. "Back to the course editor (2D)", top right,
      goes back with it. Its best time is kept apart from the den's own course's.
    - **Share:** "Copy share link" (`race-editor.html?course=` and about 22 characters; a link from before 12 Nov opens the den's own); the page's own
      address keeps the course too. Reset goes back to the den's own course. A link that's garbled, or not a
      race, opens the den's own.
    - **Balance check:** 300 races of four of the simulation's bots, in a worker, about ten seconds: each way
      round's wins against its fair share (red outside half to 1.6 times it), what each shortcut saves on the
      course and really saved a decent, good and great racer; each feature's wins on
      the chart too.
    - **The starlit door stays where it is** on every course (public since 12 Nov), drawn on the chart with its
      tunnel and raced in the balance check; nothing else cuts through a spit in its columns.
  `?at=race` and one cheat. Rules: `src/den-race.ts`; drawn and played by `js/den/race.js`, its start
  `js/den/race-start.js`, its buoys and finish `js/den/race-marks.js`, its barrier `js/den/race-forage.js`;
  the starter's lines `src/lines/race.ts`.
- **The camera's yours again after the tunnel (12 Nov).** "after you go through the tunnel, it's got really
  breaks the camera angle. And you don't seem to be able to change it." Coming up the cleft, the door's
  shot from the leg's side lasts at most 2 s, and lets go as soon as she moves or you turn, tilt or zoom
  (js/den/door.js).
- **The starlit door (11 Nov).** "Can we do a similar kind of thing [as Moria's door by starlight] and use
  duty navigation as the puzzle for how you find the door and have it discoverable in some way similar to
  the carpentry spots?", and of the tunnel: "a really long, straight passage. But it requires some like more
  hardcore puzzling ... you've got to do like big Vegas". The race course's hidden gem (not the starter's,
  not the map's, no cheat or `?at=`):
  - **Back to simple, Navigation only (12 Nov: "I love some of the animation and the styles on it, but I think
    it needs just probably to go back to being simple... nav only shortcut that takes you just like one step
    through, and maybe can be tuned to be a bit trickier. Because I could just imagine someone good at doing
    Vegas, it takes you out of the race. It's too isolated otherwise"):** the stretches, the Sailing clear to get
    in, the Vegas under the cleft, the far end onto leg 5 and the Sailing board in the doorway (with "Getting
    in, plain and forgiving", the same day, which they made unneeded) are gone. As built now:
  - **The door:** a crag on the second spit off leg 2, a door plainly in it (public since 12 Nov: "Is there
    supposed to be a visible marker ...? Surely"): a frame of pale dressed stone, two iron-bound timber leaves,
    stars round it twinkling, and the wheel's 24 places carved high up the face. Off it: "The starlit door ·
    Space: Duty Navigation on the rock opens it".
  - **Space there** stands Duty Navigation on the rock beside the carved wheel, as the night sky, in the world
    (the camera straight on to both). Its run is one constellation of three stars, dealt as ever, the puzzle's
    own five colours: about 34 moves for the bots (`tools/nav-bots.mjs`, `DOOR=1`), about forty seconds,
    sized by the simulation so the door's saving is in proportion (two small ones, the day before's, left it
    winning 3% of its races, a constellation more 2%; RACE.md §8, §9). Filled, its stars light on the carved
    wheel, the door's outline glows and its two leaves swing in on the tunnel. Esc steps back, the board kept
    as it is. Open, it stays open that race; a new race (or a fresh voyage) shuts it again.
  - **A booch** turns her about, away from the cliff, pushed off a square; the board's gone and every star on
    the rock dark: the run starts again.
  - **Through, one stretch:** swung open, the door carries her straight through (`through` in
    `src/den-door.ts`), in at the door, along the tunnel's cavern under the spit (its walls lit by glowing
    stones, a dark still water) and up its cleft onto leg 3 (squares 15 or 16 across, 55 out, the column she
    was off, facing straight on): about 40 seconds saved (`DOOR.SAVES`, tested with the helm; her trip 3.1 s).
    Off it again later with it open, Space takes her through. Nobody can shoot her in the tunnel; out of it
    she's back among the field, in the open as anywhere, the trade wind back across leg 3 still to hop. The
    race counts leg 3 reached (`Race.under`). The camera watches her come up from the leg's side.
  - **The cleft** is the door's: two of its stars over its mouth, so it reads as the door's way out, not an
    open gap.
  - **Simple, to be competitive (11 Nov):** built first with an evil constellation last (six of a colour side
    by side on the inner ring, only to be filled by a combo), its run took minutes of puzzling to save two and
    a half of sailing: "simplify the duty navigation down to be more competitive." The evil constellation is
    kept in the puzzle's module for elsewhere (`given`, `bottomRow`, `needsCombo`; IDEAS.md).
  - **Ours, not the film's:** no words to speak, no elvish, just the stars.
  Rules: `src/den-door.ts`; drawn and played by `js/den/door.js` (a console hook, `doorTest`, for testing).
- **A hull's sides slant a little, top to bottom (11 Nov).** "I can definitely see the back of the
  ship has gotten a lot more curved, but I'm talking about, like, the top to bottom ... that's still
  quite boxy ... it needs a tiny bit of a slant." Tumblehome 0.15 (it was 0.05, too little to see), a
  straight slant from the waterline up, the same on every ship (src/ships.ts, SHAPES.curved).
- **Sailing's pair glides down (11 Nov).** Of Space: "could also be a lot smoother. That's noticeably
  jumpy." The pair is drawn where it's fallen to between rows (src/sail-pair.ts, y), not hopping a
  row at a time, at any speed.
- **Pirates talk now and then; Kikkit rambles (11 Nov).** "it's feeling like they come through a bit
  fast. Like the idea of [Kikkit] was supposed to be she's just a rambling, tangenting person that
  just goes on and on and on ... There should be more distinct difference. I think like this guy at
  the Imperial Island. Like, it's not the odd bonus thing. Like, it's coming along every few seconds
  ... Obviously, don't touch [Kikkit]. She's fantastic." So anyone standing about talking says the
  odd line, a good while apart (src/chatter.ts, PACE.ASIDE, 16 to 28 seconds; a greeting or a halt
  still comes at once); Kikkit alone goes on line after line (PACE.RAMBLE).
- **Bilge is the model to aim for (9 Nov).** The user loved it most for being "so faithful and
  close": "really close one-to-one with the puzzle ... it just plays like the puzzle. It's not like
  a dumbed down version at all", while you can still see what's going on in the den. They loved
  how it "goes into that different view" (from the sea end, the board filling the screen, the den
  behind it), and that the board is out in the world, visible to everyone: "it's not just somebody
  standing at a post. You can see somebody puzzling." Carpentry should move closer to this (see
  IDEAS.md, "Carpentry as close to the puzzle as Bilge").
- **Nothing pauses the raid.** The den is quick-paced, so a job can't stop the action for a long
  one-on-one. The user turned down Swordfight duels at the wall (as in some Puzzle Pirates scenes)
  because a two-minute duel while raiders hack through the wall is "really disjointed". A slow
  puzzle has to pay off big instead: that's why the user came to the golem, one puzzle that makes
  something able to fight a crowd, not just one raider.
  **Except a boss fight.** A Swordfight against a golem is a big standoff in the open, "almost
  heroic", not "any old one-on-one", so there it makes sense for the rest of the raid to pause.
  The golem's size also makes big Swordfight boards look in proportion.
- **Crewmates help each other's puzzle, visibly.** Even when one pirate plays a puzzle (one
  swordfighter against the golem), the rest of the crew should be able to help from their own
  jobs: a cannon shot that hits the golem drops black blocks onto its board. The help has to be
  easy to see, so the puzzle feels real. Keep these ideas simple, not multi-step.
- **Every way of fighting the raid is there at once; you choose as you go.** No picker, no mode
  to choose up front: the user, "attackers are coming and you just choose which ways to deal with
  them. Similar to how you can defend with carp or jump to the gun turret later" (8 Nov; the idea
  came from the Age of Apes tutorial's choice of three mini-games).
  - **The same goes for quests: leave the choices open (9 Nov).** An obstacle on a side quest (a
    pirate guarding his treasure, say) can be got past with any of the den's puzzles, each in its
    own believable way: swordfight him, shoot him off from a gun deck, or bilge water in to flood
    him out. The user: "I like that principle. Like, leave the choices open."
- **Swordfight at the armoury hoist: soldiers and wall repairs (8 Nov).** Each raider beaten
  (knocked flat, by a thrown piece, the guns or a soldier; or turned away at the wall) drops their
  weapons: a pair of crates, a Swordfight pair, that lands inside the den. Walk over it to pick it up: it goes on your back (eight pairs at most). **Walk up to the hoist
  and they come off your back onto its shelves by themselves,** no key needed (the user, 9 Nov:
  "you should be able to just drop them off, like by going near the armory. You shouldn't have to
  press space"): six shelves of four on its right-hand side, the top one next down, **filling up
  as you bring more** ("you should see the collection really building up"). If the stack topples,
  the board clears but the shelves keep their crates. At the armoury hoist, against the left of the den, Space at the winch plays
  them on a real Swordfight board, by the real rules (6 by 13, pairs in at the top of the fourth
  column, fusing, breakers, chains; stack up into the red stripes at the top of the fourth column
  and the stack topples, with the crates you had). A pair only comes in while you're at the
  winch; nothing pauses the raid. What a break would send at an opponent goes to the raid instead:
  - **Chests arm soldiers.** Only a fused block (2x2 or bigger, a big chest of swords) arms
    anyone: a soldier for each one broken, two for each on the second link of a chain, three on
    the third, and so on; bigger blocks make tougher, bigger soldiers; five at most to start with
    (ten till 9 Nov: the user wanted "only so many soldiers ... limited to a handful at the start,
    but can be upgraded ... as you build more of a pirate den", to "build a little army up later"). The user: "you'd
    have to do a combo, like a fuse block to get a soldier, and obviously combo for multiples".
    Soldiers go for raiders loose in the den and stand just inside the gaps in the wall (or behind
    the holes being hacked), and a raider coming through a gap they hold stops to fight them. They
    go out through the gate to raiders on the beach, and back in through it (10 Nov: "now we've got
    the soldiers and then these small raids. It breaks the immersion for them to not go out and fight
    the attackers. It's like, what, you're just going to sit there and let them attack, hack at the
    wall?"): raiders walking up from their boats, hacking at a hole, dazed, or on a ladder's bottom
    rungs, up to 6 m out from the wall and above the tide line (not ones still rowing, or high up a
    ladder: those they meet inside). Raiders in the den come first: a soldier only goes out once
    each one inside has about three on him. They wait at the gateway's mouth till the gate swings
    open, walk through it, never through stone, round the gun tower's legs, and come back in the same
    way when nobody's left outside. In the siege and for the occasional raiders alike
    (`src/den-sword.ts`: Field, outReach). **But only with you (10 Nov):** "they kind of follow
    you out the gate, so they just don't die needlessly. It's only when you go out and decide to
    start engaging." While you're inside, so are they, and raiders on the beach are left be; step
    out onto the sand and they follow you out, standing at your back with nobody to fight and going
    for raiders out there; go back in and they come in after you. With nobody to fight or guard they wait off to the winch's side of
    the hoist, past where you stand to work it, never in front of the stack (the user, 9 Nov: they
    "stand in a spot that obscures the swordfighting board"; `waitSpot`, src/den-sword.ts).
  - **Loose crates mend the wall, for good.** Each sprinkle is a loose crate broken up for planks,
    thrown onto the lumber pile at the foot of the hoist (on the wall side); every 4 crates' worth
    is nailed into a hole as a piece's worth of planks (a pentomino's shape, pale boards with nail
    heads), as if you'd fitted that piece, and stays. It goes to the hole that needs it most (a gap
    raiders can walk through first, then the one hacked hardest, then the weakest; the nearest done
    if it's a tie), lowest down, and always where the rest of the hole can still be finished
    exactly, so a Masterpiece is still there to be made (and if the planks finish it, it is one,
    breaker and all). Planks with no hole to mend wait on the pile, three pieces' worth at most.
    The break's message says how many crates went for planks and how near the next repair is. The
    user, on the barricades this replaced (crates piled inside the breaches): "It says three
    sprinkles to the barricades, but I just see blocks on the ground ... this is confusing. Maybe
    you have to do a certain number and it actually fills in a hole a bit ... more of like a
    permanent wall repair for sprinkling."
  - **Masterpieces pay in breakers.** A Masterpiece (a hole, a layer behind one, or a frame built
    without waste) also pays a pair of crates with a breaker in it, flown straight to the hoist's
    landing as the next pair down (onto the floor by you if your hands are full). Once per
    Masterpiece: taking a piece back and fitting it again doesn't pay twice, but a hole broken open
    and mended again does. The gold is still paid, since it's what the raiders steal. The user:
    gold "is fairly meaningless. So getting a reward like some breakers would be a lot better".
  - A raider who gets in while you're at the winch nails crates shut on your stack (sprinkles, as
    an opponent's attack would). Playing alone only so far.
  **It's part of the den, not a picture:** the board is a real stack of weapon crates under a timber
  hoist, at the den's scale; each pair is lowered on the rope and turns on it, and the crates
  you've brought wait on a landing at the top. Each colour is a crate of one weapon (red a skull
  dagger, yellow a broadsword, green a machete, blue a sabre, stencilled on), a breaker the bare
  sword glowing, a fused block a big chest with brass corners, attack blocks crates nailed shut
  with iron bands. The hoist stands side on to the usual view, so it hides nothing; at the winch the
  camera turns to face it. The board on a sign before it "just feels like it's been forced in.
  There's nothing natural looking about it. It's very glaring" (the user), and setting it into a
  wall "doesn't really make sense".
  **You can see what you're carrying, and see things break (8 Nov).** The crates you've picked up
  ride on your back, lashed to a carrying frame (the first three pairs), and a
  tile beside the crates in the toolbox shows the first few, breakers glowing, and how many are on
  your back; picking one up says how many and where they go. The user: "it doesn't really have any
  indication, visual or otherwise, that you're carrying any breakers. You just kind of walk into
  them and it's like, okay, well, now what?" A break plays out a link of the chain at a time: what's
  about to break shakes and swells, then smashes into flying planks (a breaker's blade just
  flashes), and what was on it drops into the gap, faster as it falls; only then does the break
  send its soldiers and planks, and the next pair waits till it's done. The user: "it needs the
  breaking animation, not just to magically break."

- **A pirate mends a den wall.** Pieces sit on three crates (the toolbox); you carry them over and
  fit them into holes in a stone wall. Same pieces, weights and Masterpiece rule as the main game.
  Every piece on a crate, and the one held overhead, has a bold dark edge on both faces, so its
  shape reads from above on its crate and from behind over your head; held over a spot it fits,
  it goes only half see-through. The user (8 Nov): "you can't see the pieces on the crates or above
  your head when you're placing them so much anymore. That seems to have gone backwards." (A new
  game had also left the first three crates looking empty.)
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
- **The wall in two courses (9 Nov).** The wall was one long row of holes, so no view showed them
  all and the piece crossed bare stone to get anywhere; a flat board over it was "forced" (see
  "Immersive, never an overlay"). The user: "Try with 2 wall courses. Let's see how that works."
  So the wall itself is the real puzzle's board: a high hole over a low one each side of the gate,
  four holes two up and two down, a row of stone between them and under the low one
  (`src/den-wall.ts`). It's nine or ten rows tall (5 m, it was six), about 17 m long (it was
  about 24), so the Carpentry view shows the whole of it. Holes lie on their side (wider than tall)
  to keep it low.
  - **The gate stays five rows tall** (2.75 m, as on the six-row wall), under a beam with stone
    over it. Run up the taller wall's full height it "just feels very stretched now". No cannon
    breach opens in the stone over it.
  - **High holes: raiders bring ladders.** Raiders going for a high hole lean a ladder under it
    and climb up; from there they hack its wood, or if it's open, climb straight in and drop down
    inside. There's no stone to hack wider first (that's the low holes), so an open high hole is
    the one to mend first. A raider dazed on a ladder falls off and climbs again. Raiders split
    between a side's high and low hole at chance; an open hole draws the raiders near it, as
    before. A cannon breach in the top half of the wall is a high hole too.
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
- **A wall giving way hits the ones hacking at it.** The user found three raiders bursting a hole
  together and walking straight in: "there doesn't seem to be any win for it". Three at once open
  it three times as fast, so each had barely tired (at wave 5, about 15% tired, a second's pause
  inside). Now when the last of a hole's wood or stone goes, every raider hacking it reels back
  dazed for 3 seconds (swaying, yellow sparks round the head), and stone that gives way chokes the
  new gap with fallen rubble (5 seconds of one raider's hacking) they must clear first, which tires
  them further. Plug the gap while it's choked and they're back to hacking wood. At wave 5, three
  raiders on one small hole now take about 8 seconds from the wall giving way to heading for the
  chest, where it was about 2. Dazed raiders at the wall can be hit from the rampart, and the gun
  tower aims at them too. Raiders hacking a hole with a doorway stand in the doorway.
- **Wood comes out a piece at a time.** The user found a hole's wood all coming off in one go
  frustrating, boards behind a Masterpiece or not, and liked the chance to "push back and refix it"
  when part of it goes but leaves a gap too small to walk through. As in the real puzzle (a neglected
  hole loses its most recently placed piece), the last piece put in falls out first. Each piece
  holds an equal share of the hole's strength (a three-piece Masterpiece loses one about every 15
  seconds of one raider's hacking). The gap a piece leaves needs that piece again, and refilling it
  finishes the hole as before. **A piece has its share from the moment it goes in (8 Nov).** Fitted
  into a hole raiders were hacking at, it went straight back out; the user: "it doesn't seem to have
  any health, it's more like it gets thrown at them" (its strength only counted once it had flown in,
  so they were hacking at nothing meanwhile). Now a fresh piece holds them off for its own share (8:
  about 15 seconds of one raider in the first wave, 8 at full speed). Any wood left still keeps them out. You can refill the front of a
  hole with boards behind it wherever no board covers it.
- **Holes made in a raid are roomy and fit the common pieces; the first wall stays small.** The user
  kept getting shapes they could never fill, with nowhere to dump the awkward pieces: in the real
  puzzle fresh holes keep coming, but the wall is fixed. They like the opening wall's simple 1, 2
  and 3-piece holes, so only holes made during a raid changed. A cannon breach is the roomiest that
  fits (three pieces if there's the stone for it, else two, else a single P, F or Y, never a W or a
  U), and of a few candidate shapes it's the one with the most ways to fill it from P, F, Y, T, N
  and L. A weak spot hacked wider gives way the same way. (A test of a player who always picks the
  most flexible spot: random 1- and 2-piece breaches left them with no piece that fits about 4
  draws for every piece placed; 3-piece breaches picked this way, about 1.5.)
  **The first wall keeps its sizes but is picked the same way.** The user was still "not getting
  the right pieces a lot at the start". Its one-piece hole is for a P, F, Y, T, N or L, and its two
  and three-piece holes are the best of six for the common pieces. (Same test, the whole opening
  wall: 3.2 stuck draws per piece placed with random shapes, 2.0 now.)
- **The first wave is dealt fair: the crates bring the pieces that finish its holes.** Even so, the
  user was left needing three F's and an L that never came, with only a T in the toolbox: "This
  first wave definitely needs to be perfectly considered." So from a new game until wave 1 is beaten,
  each deal looks at what's left of every open hole and deals a piece still missing from a way of
  finishing them all as Masterpieces, picking the way that uses most of what's already on the crates
  or in your hands. It looks afresh every deal, so a piece put somewhere else or knocked out just
  changes the plan. Once nothing's missing, or a hole can't be finished exactly any more, it deals
  at random as usual, and from wave 2 on it's all random: asked whether to keep it on past wave 1,
  the user said first wave only. (The same test: dealt at random, all
  eight games got stuck after 3 to 7 pieces with nothing on the crates that fits cleanly; dealt
  fair, five games out of five finished all four holes as Masterpieces in eight pieces.)
  **It's only for mending the first wall, and it never goes round and round.** Building a frame
  with it still on, the user got "four M pieces in a row ... and so many U pieces. The favourable
  pieces thing seems to be stuck on." Each piece the wall was missing went into the frame, so the
  next deal brought the same piece again. So a piece dealt fair that goes into a frame is held
  back for the next three deals, and once every hole of the first wall is
  done the deal is the usual one for good, even when raiders knock pieces out in wave 1. (Building
  only the shack from a new game: each piece the wall needed came once, at most twice, then the
  usual deal.)
  **It plans every hole together, counting what's in your hands and on the crates.** Planned one
  hole at a time, an earlier hole could take one of the two W's meant for the hole you were
  mending, and a third W got dealt that was no use once that hole was done (the user: "it was
  deciding I needed another M before realising I'd already finished that first hole"), or P after
  P while two holes needed a Y and an N. Now it tries the holes in every order and keeps the plan
  missing fewest pieces. (A careless test player, any piece in any clean spot: eight games out of
  eight finished all four holes as Masterpieces in eight pieces.)
  **The hole nearest done comes first.** Needing only an L to finish a hole, the user got three or
  four P's meant for other holes: "it certainly does not seem to have been looking at him being
  like, right, he needs this piece". Now the deal is for the hole with fewest pieces still to come.
  (It also used to hold a piece back for good once one dealt fair was thrown or put in a frame, so
  a thrown L meant no hole ever got an L. Now a thrown piece isn't held back, the hole still needs
  it, and one put in a frame is held back for three deals only.)
  **And it keeps to the usual odds: a rare piece only when the holes really need one.** Picking
  evenly among the ways of finishing a hole, a way that needs a cross came up as often as one that
  needs a P, and the user got five crosses in thirteen pieces: "That feels very broken." Now each
  way is picked with the chance of being dealt the pieces it still needs (softened, square roots
  of the odds: weighted fully, half of what came was P's), and of the plans missing fewest pieces
  the likeliest is kept. (On the same half-built walls, rare pieces went from 11% of what it asked
  for to 2%. Seven test walls all finished as Masterpieces: P's 39%, F's 20%, Y's 16%, and the odd
  V, W or Z.)
- **Throw pieces at raiders, don't bonk them.** A plain bonk was underwhelming. The carried piece
  is the weapon: it hurls at a raider, who goes flying. It costs the piece.
  You see it leave your hands (10 Nov: "I don't really see it being thrown out of his hands. It
  just kind of, like, you see his hands move and then nothing else"): over the wall it's lobbed up
  out of your hands and over the wall's top, a metre or two above it, and down onto them. (It was
  an even arch, and stood at the wall, two courses high, it went 14 to 56 metres up, out of sight.)
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
  **Over the wall from anywhere (9 Nov).** Raiders hacking at the wall outside can be hit from the
  den floor too, not just the rampart: the piece is lobbed high over the top. With a piece in hand
  their ⚔ markers show, and the prompt says "Shift or click a raider: lob it over the wall". (The
  user, after finding raiders who get in too easy to knock flat: "just being able to lob over the
  wall is fine ... don't make it overly complicated.") A click on a spot the piece fits still fits
  it, even with a raider showing through the hole; Shift throws. (The user, 8 Nov, at a hole with a
  dazed raider behind it: there was "no choice but to throw it", wasting the piece, and "it only
  dazes them for enough time for you to pick up the next thing and repeat the dazing, you make no
  progress". Clicking the hole fits the piece, from anywhere in the den.)
- **Misplaced pieces can be taken back.** Placing one square too high was a frustrating misclick.
  With empty hands at the wall, Space (or Backspace) takes the last piece you put up back off, the
  same way round, so you can fit it properly. Not once it's made a Masterpiece, once another
  piece has gone on, or once you've picked up a new piece from the crates. A boarded-over hole you
  undo goes back to open and gives back its pay; damage the hole took meanwhile stays.
- **The rampart: a walk along the top of the whole wall,** with stairs up at the right-hand end
  (both ends till 9 Nov: the user wanted the armoury hoist's end of the den kept clear, "sword
  fighting board on the left, stairs on the right for the ramparts to go up"). That also keeps the
  board from hiding the stairs while you build them (the user, 9 Nov: "the swordfighting board
  obscures the stairs while you are building them"). Raiders hacking
  at the wall can only be hit from up there; it's what makes a Masterpiece pay off: while it holds,
  you go up and knock the raiders off it. The view swings up high to look down at them. Keep it out
  of the way (not in front of the gate), and the full length of the wall.
- **The rampart is built a part at a time, as the reward for beating a wave.** Order: the whole
  walk (then the stairs straight after it), then the gun tower.
  - **One frame at a time.** When a wave is beaten off and nothing is still being built, timber
    arrives for the next part. Its frames come one after another, each only when the last is
    done, so there's never more than one to get on with. The second frame appearing before the
    first was done felt rushed.
  - **The walk comes once the wall's all mended (8 Nov).** The user: "the walk should appear once
    you are safe and have filled in all the holes, so you can work on that while they try in a
    futile attempt to get in". So the walk's timber comes as soon as every hole is mended, mid-wave
    or not (or with a wave beaten off, if that's first); the stairs follow it, and the gun tower
    still comes for beating a wave off (`timberComes`, src/den-raids.ts).
  - **Walk only on what's built.** You can only walk where the walk's pieces actually are.
- **It's built by carpentry, piece by piece, not by magic.** A footing hole opening in the wall was
  bizarre, and a stretch popping up was too easy. A finished frame then turning into a ready-made
  rampart was magic too. **Every part of the rampart is the pieces you fitted, and they stay those
  pieces.** Nothing turns into anything else, and nothing is added that you didn't build.
  - **The walk: one big square frame, sawn into lengths** (about 24 pieces). The user wanted it
    "one big piece", not a stretch at a time, but one long thin frame the length of the wall ran
    you out of the rare pieces it needed. Rather than change the odds, the user wanted it built
    square, "a more faithful depiction of carpentry": "one square, but then when it gets hoisted
    ... it almost gets like sliced in the middle 2 or 3 times". So the walk's length is cut into
    strips (four on most walls, eleven or twelve squares long), three squares deep: two over the
    stone and one out over the den, only two at the ends, clear of where the stairs come up. In
    the frame the strips lie side by side with straight cuts between them, about 11 by 13 squares.
    The outer strips' den sides are the frame's two outer edges: single squares jut out of one
    (see "Room for the rare pieces") and a square or two is bitten out to make the count come
    right. It can always be filled with not a scrap wasted. When it's full it's sawn along the
    cuts (pieces lying across a cut are sawn through) and the lengths go up onto the wall one
    after another, end to end. (In a simulated build with crates dealt at random, the square frame
    wasted about half the deals the long one did: about 48 against 107. Most of what's left is at
    the very end, when only one or two shapes will do.) **It lies on the floor at the right of the
    den,** the strips running back from the wall, its near end well back from where you mend the
    wall, so you only fit pieces in it once you've stepped back to it: just behind you, it kept
    taking the pieces meant for the wall (the user: "the walk frame gets the focus"). A square
    frame is too big for the floor between the wall and the crates, and the user chose the right
    side: the barrel and chest stand behind the crates, and in a narrow den the crates shift left.
    History: two rows and a ragged third was "very slim", with not much room to be creative;
    three and a ragged fourth was still "long thin straight holes that only fit the P".
  - **The stairs (at each end):** a frame standing upright at the end of the den, a stringer four
    squares deep under the treads. (Solid down to the floor until 9 Nov: a band three squares deep
    held only four pieces, with room for an X in one spot in five. With the wall in two courses
    the stairs are half as tall again and solid ones took twice the pieces, about 15; four deep,
    they take six or seven, about what they did.) You fit pieces into it like a hole in the wall, and the
    pieces are the steps. Half-built stairs are in the way; you can't walk through them.
  - **Any piece will do:** a piece may stick out over the frame's edge. On the walk the spare is
    sawn off when it's full (it has to lie flat on the wall).
  - **Room for the rare pieces, as in the main puzzle.** A big hole there leaves room to put an X or
    a W in a corner early on and still have "plenty of hole left for you to work towards one of
    the common two-hole finishes". Frames too slim for that (the user, 8 Nov: "there's nowhere to
    put things like those rarer weird cross shapes or M pieces ... without messing up the hole")
    make the shipshape finish a matter of luck. **The fix is the edge, not just the size:** "making
    it a bit less square". A Puzzle Pirates hole has "lots of little single tile things jutting
    out, and that's where the rarer pieces fit in". So frames have single squares jutting out (the
    walk's den-side edge, the gun tower's parts where they meet), or a stepped edge (the stairs).
    Measured: an X or W goes in cleanly at about half the spots tried, against 2 in 16 for an X in
    the old walk stretches.
  - **The stairs stay exactly as built, never changed by magic.** Nothing's sawn off: bits sticking
    out stay, and you walk on the real tops of the pieces. A one-square step you walk up; a
    two-square one you hop up. So the stairs stay climbable, a piece can't stick up more than one
    square above the tread line.
  - **A gap is never filled for you.** (Gaps no piece could reach used to be plugged with
    offcuts; the user: "if there's a gap, that's it, that's broken. That's the point of it being a
    puzzle. You've got to make the things fit.") The way out is to lift pieces back out: any piece
    in a frame that isn't finished, anyone's, by pointing at it (or standing by it, with the
    keyboard) and pressing Space or clicking. It goes into your hands.
  - **You can see the room a piece has (10 Nov).** "it should certainly be clearer what the
    boundary of the stairs are, because I couldn't figure out really how that I could all rearrange
    this a bit and then work within the boundary in a more creative way." Where a frame limits how
    far a piece may stick out (the stairs, her deck patch, the crane), that room is chalked round
    it: a dashed line at its edge and a faint tint on its squares, the frame's own squares left
    plain, brighter while you hold a piece. It's exactly what fits (`CarpentryFrame.room`), redrawn
    as pieces go in and out, and goes when the frame's full. Frames a piece may stick out of any way
    show none. Having got there by rearranging: "I've gotten there, actually, which makes it more
    rewarding", so the stairs' rules stay as they were.
  - **One Carpentry everywhere you build (10 Nov).** The user, building the crane: "is this not
    supposed to be like the same? That's what I mean by there should be one modular mechanic. So
    the idea that you can pick up a piece like that you've just placed should be in that core
    module." The den's frames, the hole in her deck and the crane's frames are one frame
    (`src/carpentry-frame.ts`): the same fitting, the same lifting of any piece back out till it's
    full, the same sawing, the same keys and clicks, and the prompt in the same words ("Space or
    click: pick the T back up", "Backspace: the last piece back out"). Only how far a piece may
    stick out differs from place to place.
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
  floor behind you.) **Then from anywhere in the den (8 Nov).** There was still a minimum distance;
  the user: "we were meant to remove that so you can place from anywhere". So with the mouse, point
  at the wall from anywhere on the den floor and the piece goes in there; with the keyboard, Tab
  brings up the Carpentry view from anywhere. (Taking one back still wants you by the wall, so an
  empty-handed click elsewhere never undoes a piece.)
- **Puzzle mode at the wall: the whole wall at once.** The user wanted it closer to Puzzle Pirates:
  working on all four holes, moving between them with ease rather than running the pirate about,
  "a hybrid of the 2D version" once you're at the wall. Walk up to the wall with a piece (or press
  an arrow there) and the camera pulls back, straight on, to show the whole wall. The pirate walks
  along under the piece by themself, a step back so they don't hide the hole (the user likes the
  zoom, and finds "seeing him walk back and forth while you're just effortlessly doing things"
  funny).
  - **WASD is pure piece moving there:** a square at a time, always the way the key points on
    screen. **The arrows jump hole to hole** (to the best spot the piece has in the next hole that
    way, or over its middle if it won't go in). Q/E/F turn and flip.
  - **You leave by fitting the piece or by Esc.** Fitting it ends it, but the view stays a moment,
    so taking the next piece with 1 2 3 there carries straight on.
  - **A click only ever fits the piece there,** never throws it at a raider showing through the
    hole (it did, so clicks seemed not to work). Boards behind are fitted the same way.
  - **No Tab "next spot":** the user found it "annoying and useless".
  - **Not by itself on a frame.** Frames lie on the floor right where you stand to mend the wall, so
    standing on or by one, the view doesn't come on by itself: along the right-hand walk frame it
    kept switching on, and the camera changed while the user was trying to start on the frame.
    The arrow keys still take you to the wall from there.
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
- **One copy of the Gunnery puzzle (10 Nov).** The user: "there should be one copy of the gunning
  puzzle. We should not be having different copies, one for the ship, one for the deck in the den
  ... there can be a few wrappers with some of the different visual elements around it, but the
  core puzzle should be more or less the same, as in code-wise." So Gunnery's rules are one tested
  module knowing nothing of the den (`src/gunnery.ts`: the board, the barrel, the stores rolling,
  the arrows, loading, the crates), and the gun tower (`js/den/gundeck.js`) and her deck at sea
  (`js/den/sea-guns.js`) each drive it with a thin wrapper of their own look. The same goes for any
  puzzle played in more than one place.
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
    a carpentry piece is one square of the board, less two squares off each back corner where it
    meets the wall (169 squares isn't a whole number of pieces; 165 is). It's built of ordinary
    pieces in three frames (4, 5 and 4 rows, from the wall out), laid on the den floor and hauled
    up and out over the wall one after another. Where two meet, the nearer one hands three single
    squares of its edge to the next, so each fills exactly and they lock together with squares
    jutting out. (It was 5, 5 and 3 square rows: the front one, 39 squares, could never be filled
    exactly.) The deck still shows the pieces you laid, toned down. You walk out onto it
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
  - **In charge of the guns, WASD points the chalk; it doesn't walk you (8 Nov).** The user, up
    close on the tower: "WASD should change the direction of the arrows, not move the character".
    So once you've taken charge (Space) it's a mode of its own: your pirate stays put, and WASD (or
    the arrow keys) turn the arrow under the pointer, or else the one in front of you, to point
    that way on screen; the next one you chalk points that way too. Esc steps back.
  - **To try it straight away:** `den.html?try=all` (or `?try=gundeck`) starts with the rampart,
    gun tower and house built and you up on the tower, for the user's own testing. It must load
    fast: it once took about a minute, because the engine's solver works row by row and a long,
    thin frame (the tower's 3-row strip, a wall-walk) sent it backtracking for ages. The den's copy
    of the solver turns wide frames on their side and solves them column by column (a millisecond),
    which also stops the game stalling when a new wall-walk frame is laid out. The square walk
    frame is too big for either way round (a fresh one could take ten seconds to check), so the
    frames are checked with a search of their own that gives up on a line as soon as the empty
    squares split into a pocket that isn't a multiple of five: a few milliseconds.
- **The den's buttons sit in a row, all in view** (top left, under the stats): your pirate, your
  den, decorate, pause, play with a crew, cheats. Discoverable matters more than tidy: folded into
  a ☰ menu (8 Nov), the user missed seeing them, as they use your pirate, your den, decorate and
  the cheats a lot. Small text, but big enough to hit easily (shrunk right down, the "hit area is
  tiny").
- **The cheat menu, for trying things out** (the Cheats button, or the backtick key). The user asked
  for a way to skip stages. It pauses the game while it's open. Playing alone only, as with a crew
  everyone's game would have to follow. Kept small: little buttons, few of them.
  - **Skip to a stage:** the start, the walk, the gun tower, or everything built. The den starts
    afresh, built up to there, just as that part's timber arrives (the walk after wave 1, the gun
    tower after 2). Not a stage per frame: that
    puzzled the user. What it builds is filled with a mix of all the pieces, as a crew would: the
    plain solver's fill was nearly all Ps.
  - **Or skip ahead now:** beat this wave (its timber comes as usual), next wave now, mend every
    hole (Masterpieces where they'll go, damage repaired), build the shack. No "finish this frame"
    or "+100 gold": the user found them no help.
- **Making it yours (pirate looks and the den's dress).** The user wants players to be able to make
  it all their own, and the general feel must match the rest of the den. Code: `js/den-look.js`
  (the pirate builder, dyes, familiars, flag drawing) and the "dressing" and "decorating"
  sections of `js/den.js`. **Two panels, two buttons:** **Your pirate** (Pirate, Clothes,
  Familiar) and **Your den** (Flag, Den, Shack). The user: Your pirate is no place for the den's
  things; that's a separate concept. (Your den shows your flag where Your pirate shows the pirate.)
  - **Pirates:** male or female, dressed from the real Puzzle Pirates tailor (YPPedia's clothing
    names: Tricorne, Feathered hat, Captain's hat, Sleeping hat, Viking helmet, Striped shirt with
    vest, Swashbuckler's jacket, Buccaneer jacket, Corset, Stripy knickers, Pantaloons, Kilt, Long
    dress bottom, Buckle shoes, Fancy boots, Curled boots and so on) in the tailor's standard palette
    of 27 dyes (YPPedia: Clothing palette), plus what the real pirates wear (a sash or a big-buckled
    belt round the waist, a tankard in hand). Skin, hair style and colour, beard, eyepatch, earrings
    (none, one, both), a smile. A familiar sits on the left shoulder, as in the portraits; monkeys
    in YPPedia's natural colours, white and lavender. Kept in localStorage (`carp.den.look`; looks
    saved before 10 Nov still load),
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
    **A label over the sign says so before you walk in** ("Your shack: build it here", walk in and
    press Space or click), as the holes have. The user clicked it by accident and couldn't work out
    what had happened. The sign's post stops under the board: running up through it, it hid the S,
    and the sign read "Your hack". The sign is turned to face into the den.
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
  to do was frustrating. Any mended hole (Masterpiece or boarded) takes layers behind it, on the
  den side, up to three deep, damaged or not. Raiders hack through the hole's own wood first, then
  each layer in turn, and only get in once the last is gone.
  - **A layer is the hole again, and its pieces slot together.** (Each piece used to be a layer of
    its own: the user placed one, then another that fitted perfectly beside it, and it started a
    third.) A layer's opening is the hole's shape; you fill it a piece at a time like the hole, and
    only once it's full does the next one open in front of it.
  - **Studwork shows where it goes:** once a hole's mended, a timber frame a square wide goes up
    round it on the den side, with the opening edged in dark wood, and the part still to fill glows
    blue while you hold a piece (the user: "some kind of wooden studwork structure outlining where
    the second layer goes, with material between the holes").
  - **Same grades as the hole:** filled exactly, a Masterpiece layer (as strong as a Masterpiece,
    and paid the same); a piece may hang over onto the studwork, but then the layer's only boarded
    over. Unfinished, each piece adds its share. It comes apart a piece at a time, last in first.
  - **You add to the outermost layer.** A layer raiders have knocked pieces out of from the far
    side can't be reached once there's another in front of it.
  - **Each layer has its own bar** under the hole's on its label (amber while it's unfinished), so
    boarding behind a damaged hole shows (the user saw "no visible difference to the healthbar").
  Clean fits and boarding over come first when choosing a spot; layers behind come last.
- **The camera can be turned and zoomed:** Z/C or right-drag to turn and tilt, -/= to zoom, V to
  reset. **It turns all the way round**, so you can see the outside of the wall (the user wants
  that, especially for decorating it); moonlight from outside lights the wall's outer face.
  Walking follows the way the camera faces. Q/E turn the piece, right-click flips it.
- **You turn the pieces yourself; nothing turns them for you.** Making the carried piece turn
  itself to the best fit was tried and dropped: the user felt it cheapens the puzzle. Speeding the
  carpentry up belongs to a 2D mode instead (IDEAS.md).
- **The wheel turns any piece you're carrying,** whether or not it has a spot to fit (it used to
  turn only a piece showing a spot, and zoomed otherwise: the user, 9 Nov, "you should always be
  able to rotate a piece and flip a piece"). Empty-handed, it zooms, and - and = always zoom.
- **Throwing at a raider is the only way to discard.** No scrap fire, no bin: a piece you don't
  want (often a rare one) can only be got rid of by throwing it at an enemy pirate, which deals a
  fresh piece onto that crate. Swapping at the crates just puts it back. With no raiders about,
  you fit it, board it over, nail it on behind a mended hole, or lay it in a rampart frame; after
  the siege, a raider or two still puts in now and then to throw it at (see "The occasional
  raider after the siege").
  (10 Nov, asked again what to do with a piece you can't use: a pile to saw it up, or a rack to
  keep it, "just feels very uncarpentry like", and "even just the small number of raiders as they
  are is fine". So no bin and no rack; the deal helps instead when a frame's stuck on a rare
  piece. Then, having worked it out: "I just had to rearrange it a bit ... I've gotten there,
  actually, which makes it more rewarding." So the deal doesn't help with a frame either: finding
  the way to fill it is the reward. What helps is seeing the room you have: TODO.md.)
- **You must see what's happening in the den.** Raiders inside get a ⚔ marker, pinned to the edge
  of the screen when they're out of view (gold when carrying loot). The view widens on narrow screens.
- **Keeping them out must be possible, and must feel worth it.** The user found it demoralising
  that raiders got in "no matter what": there seemed no point stopping them. (The other side of it,
  9 Nov: it's "a bit demotivating when it's so easy to just kill them as they come in", since then
  blocking off the holes doesn't matter either. So now you can lob a piece over the wall from the
  den floor: see "Throws go where you point". Raiders inside stay as easy: it's a puzzle game.) The cause was the
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
  waits 75 seconds and starts small. **But no longer than it takes:** the first wave comes as soon
  as you've completed all the holes (the user), 3 seconds after the last one so you see it done,
  with "The wall's mended!" on the banner.
- **Keep the raids big and heavy; give a longer breather instead.** By wave 8 the user was
  overwhelmed (nine raiders, square three-piece holes still open), but didn't want smaller holes or
  fewer raiders: "You need that for the feel of the puzzle ... I like the bigger, heavy raids, and
  especially the cannon and the chaos, and having to pay attention to the wall." So the calm
  between waves is 40 seconds (it was 20), time to catch up on the wall and the frames.
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
