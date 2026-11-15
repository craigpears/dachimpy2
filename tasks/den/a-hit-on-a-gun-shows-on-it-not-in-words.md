---
title: A hit on a gun shows on it, not in words
status: ready
asked: 10 Nov
updated: 15 Nov
---

"there should be some visible damage once
you fire a cannonball at one of the turrets. Right now it's just like, oh, read the text to work
out that it's been damaged ... I probably shouldn't really be any text. It should just be visible
that you've damaged it, and you work out how many shots it takes." So each hit leaves its mark
on the gun (chipped stone, a scorched and dented barrel, a battlement knocked off, smoking more
as it's worse), and the toasts that count the hits ("2 more to wreck it") go.

## Log

- 15 Nov: moved over from TODO.md, its column a first guess.
- 15 Nov: you said: "Is this still the case, I remember vaguely seeing indication of damage before when I tested this"
- 15 Nov: Checked the code, 15 Nov: partly. A hit smokes the gun while it's quiet and a wreck topples it (js/den/turret.js), but nothing marks the gun between hits, and the toasts still count hits (checkpoint.js, race.js). Still to do.
- 15 Nov: you said: "is it the destructible rocks that do so?"
- 15 Nov: to answer: yes, the race's destructible rocks (js/den/race-rocks.js) show each hit, a course crumbling per hit, but they still also toast the count ('N more and they're down'). Guns (turret.js) only smoke while quiet. Still to do for guns.
- 15 Nov: you said: "ok, this sounds like something that is ready enough to start?"
- 15 Nov: ready to start: user: ready enough to start; guns only smoke while quiet, toasts still count hits
