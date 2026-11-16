---
title: A mobile review: an agent going through the site at phone size, like the smoke tests
status: doing
asked: 16 Nov
updated: 16 Nov
session: local_c50dfa1b-cd67-4001-bfd6-81b63c632b87
---

**Asked:** I'm noticing repeatedly when I go on the mobile view that menus or like control things, just taking a disproportionate amount of the space ... I feel like it's obvious to say it's not following mobile user experience design principles ... are we able to do it almost so like there's some agent that goes through the site on mobile, similar to the smoke tests or something, and reviews the user experience of a mobile phone? Like, can I actually see the action? Is the menu following good UX principles? And have that kind of a mobile review agent? (16 Nov)

**Done looks like:** npm run mobile opens every page and ?at= link at phone size, measures how much of the screen the controls cover, tap targets, text off the edge, and shoots each; a reviewer (headless Claude) judges the shots against a short written list of phone principles and puts what's wrong on cards

## Log

- 16 Nov: added.
- 16 Nov: being done
- 16 Nov: Built: npm run mobile (tools/mobile.mjs, sharing tools/site.mjs with the smoke tests) measures all 46 pages at 390x844 with touch in about a minute: action covered, its middle, fixed chrome, taps under 44px, words under 12px, off the edge; shots and a ranked report in mobile-report/ (gitignored); --landscape, --root for another branch's checkout. RULES.md 'On a phone', six principles. The reviewer, npm run mobile -- --review <pages> (tools/mobile-review.md, headless Sonnet), tried on the blockade, the den at sea and the wolf den: notes on the blockade's, the den's menu and the wolf den's phone cards, and a new card, the-den-at-sea-on-a-phone-the-controls-dock-cove. Worst pages: the den's own places (60-80% of the sea under the menu, the dock, the key hints and the toast). The rest not reviewed yet: token heavy, ask first.
- 16 Nov: for you to review
- 16 Nov: Reviewed the rest (44 pages, seven batches): 30 new phone cards, all asked, in their streams; notes on the hamburger and den-at-sea cards for the den's shared controls. changelog.html the only page found fine. The prompt now skips the den's shared controls on each place and reads a card before noting.
- 16 Nov: The user, 16 Nov: "don't spawn lots of little cards, tidy up anything you've created, just go through and fix any UX things that you come across". The 31 phone cards removed; the reviewer now writes mobile-report/review.md, never cards; fixing what it found under this card.
- 16 Nov: being done
