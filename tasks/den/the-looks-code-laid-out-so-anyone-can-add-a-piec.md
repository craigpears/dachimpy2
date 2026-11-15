---
title: The looks' code laid out so anyone can add a piece
status: done
asked: 14 Nov
updated: 15 Nov
---

"it's not very obvious at all where the source
stuff is for all of the graphics ... I was expecting like there to be a folder somewhere that's got kind of the
code for drawing each item and little components, each of the colors and rendering, or like the different
hairstyles being a lot more modular and broken down so that if people wanted to contribute, they could just like
plug in something for that, or like furniture, like [what] Fable wants to do." Today the whole wardrobe (every
hairstyle, garment, hat, familiar and colour) is one long file, js/den-look.js, and every piece of furniture
another, js/den/furniture.js. So a folder of small pieces, one file each: hairstyles, garments, hats, familiars,
furniture, the colours (started 14 Nov: the palette as its own module), each piece registered by name, with a
short guide (CONTRIBUTING.md) on adding one and a test page to see it on its own.
And the pictures by whose they are (14 Nov): "it feels a bit weird that museum is in the top level for the images
... that's just a feature related to essentially a house ... like houses, and then [Dachimpy], and then ...
[museum]. But ... you should have similar for anyone else who has specific images for their house." **Done 14
Nov:** the museum's pictures moved to houses/dachimpy/museum/; any other house's own pictures go in houses/<host>/.
And catalogue pages to see every piece (14 Nov): "if this is going to support her helping with things ... she's
going to need some kind of less technical way of viewing them ... a list of here are all the colors that are
configurable. Here's a list of all the furniture and kind of what they look like, a list of each of the hairstyles
and such, and ... a rendering of each ... something for them to work with and then be able to give critique and
feedback on ... It's partly documentation, but also a test page." So a catalogue page for each kind of piece,
each drawn from the same registry the den uses (so a new piece shows there by itself): colours (started 14 Nov,
catalogue-colours.html), then furniture, hairstyles, clothes and familiars, each rendered.
The colours page with a scene beside it (14 Nov): "some test scene on the right ... a selection of distinct
furniture and a few pirates that are kind of spinning around, maybe through different outfits that end up being
dressed in the colour that you've selected."
And the "Your pirate" wardrobe itself (14 Nov): "could really do with an upgrade as well ... some of the things is
fine, [the] tongue out, yes, no ... but ... if you've got like so many different hairstyles, scrolling through a
list doesn't feel like it's enough ... a two-column thing. So on the right, if you're choosing your beard, you can
see all of them with a preview of what each looks like, especially with things like that and the colors
selection ... the names of the colors next to them ... people are going to know things by name as well, because
they're used to coming from Puzzle Pirates." So: the yes/no toggles stay simple; for anything with many choices
(hair, beards, hats, clothes, familiars, colours), a list of names on one side and a grid of previews of each
on the other, every colour shown with its Puzzle Pirates name; the previews drawn by the same registry as the
catalogue pages.

## Log

- 15 Nov: moved over from TODO.md, its column a first guess.
