---
title: A mobile review: an agent going through the site at phone size, like the smoke tests
status: asked
asked: 16 Nov
updated: 16 Nov
---

**Asked:** I'm noticing repeatedly when I go on the mobile view that menus or like control things, just taking a disproportionate amount of the space ... I feel like it's obvious to say it's not following mobile user experience design principles ... are we able to do it almost so like there's some agent that goes through the site on mobile, similar to the smoke tests or something, and reviews the user experience of a mobile phone? Like, can I actually see the action? Is the menu following good UX principles? And have that kind of a mobile review agent? (16 Nov)

**Done looks like:** npm run mobile opens every page and ?at= link at phone size, measures how much of the screen the controls cover, tap targets, text off the edge, and shoots each; a reviewer (headless Claude) judges the shots against a short written list of phone principles and puts what's wrong on cards

## Log

- 16 Nov: added.
