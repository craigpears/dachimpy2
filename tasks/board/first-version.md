---
title: The task board, a first version
status: review
asked: 14 Nov
updated: 15 Nov
---

**Asked:** "a Kanban style board ... a clear list of things and what their status is", grouped by stream; "more deterministic ... I don't have to worry about how many tokens are being spent updating the board".

**Done looks like:** cards as files in tasks/, one command to change one, the board drawn by a script.

## From TODO.md

**A board to see what's ready (14 Nov):** "it would be good to actually have some, you know, Kanban style board
where I could then go and see that screenshot once it's done, or see some adventure that's been built once it's
done, rather than having to ask." A page, a card per thing asked for (asked, being done, ready to look at), its
screenshot or link on the card once it's ready.
Later the same day, wider: a basic system that tracks tasks and hands them to agents, "like at work I've got like
a Kanban style tool where you can create cards and ... it delegates them to an agent ... even if it's still me
interacting through this one session ... let's say, just dropping some text file into a folder that then gets
picked up by ... agents, so that there's a clear list of things and what their status is". Statuses like being
done, waiting for me to review, waiting for me to playtest. And grouped by stream of work, each remembering where
it got to: "because I can't even remember all the things I've got in progress". The streams named: the Distilling
guide and its tasks, the frigate test, the sloop race to check and iterate on, the training helpers (bots) that
make Kikkit and the others better at Sailing. A folder of task files (one a card: stream, status, what's asked,
what's ready to look at) is the source; the board reads it.
And (15 Nov): "ideally, I'd like it to be more deterministic ... I don't have to worry about how many tokens are
being spent updating the board and rendering it". So a script draws the board from the files, never a model; an
agent changes a card with one short command.

## Log

- 15 Nov: put on the board.
