# Design

A riso print shop. Every product is a poster printed in two or three fluorescent soy inks on uncoated paper: halftoned, a few pixels out of register, speckled where the drum ran dry, taped to the wall with a price sticker. Headings are printed the same way: the words twice, in blue and pink, multiplied, drifting in and out of register as you scroll. Notes are written in pen. Loud, young, made by hand.

| Token | Hex | Use |
|---|---|---|
| Paper | #F7F3EA | page ground, also the paper of every print |
| Paper hi | #FFFDF7 | inputs, cards, the sample letter |
| Paper pink | #FDE4F0 | the OmniReach section's stock |
| Ink | #16163A | text, borders (2px), the notice bar |
| Ink 2 | #4B4B6B | secondary text |
| Pink | #FF48B0 | buttons, second drum on headings, cart count |
| Blue | #0078BF | headings, pen notes, misregistered button shadow, footer stock |
| Yellow | #FFE800 | tape, stickers, ticker, commission stock, highlighter |
| Orange, Teal, Purple | #FF6C2F, #00838A, #765BA7 | shelf colours: hardware, free, projects |

Each shelf prints in its own ink (`TINT` in `components/Chrome.tsx`): software yellow, subscriptions pink, free teal, open source blue, hardware orange, projects purple, coming soon blue.

Type: Bricolage Grotesque Variable, 800 at width 75 to 82 for display, regular for body. DM Mono for labels, prices, stickers and form labels. Reenie Beanie for pen notes only, never for anything a visitor must read to act.

Shape: sharp, 2px ink borders. Buttons are pink blocks with a blue misregistered shadow that presses in on click. Stickers are pills, rotated. Posters tilt a degree or two and straighten on hover.

## Imagery

`scripts/riso.py` (`npm run prints`) prints every poster into `public/prints/`. It re-uses the signed-distance scenes in `scripts/etch.py`, ray-marches them for shading, then separates the shading into spot inks: a flat backdrop shape (sun, arch, half, rings, stripes, diamond) in one ink, the lit body as a 75 degree halftone in a second, shadows as a 15 degree halftone in a third, each drum shifted a few pixels, with patchy coverage and paper speckle. Inks multiply. Products still in development are one-ink proofs of a shape under cloth.

To add a product: write its scene in `etch.py`, add a line to `JOBS` in `riso.py`, run `npm run prints`.

## Motion

| Component | What it does |
|---|---|
| `RisoText` | Headings printed on two drums; the pink copy drifts out of register as the heading enters, settles near-aligned mid-screen, drifts again as it leaves. |
| `PosterPile` | Hero: three prints lean on each other, follow the pointer at different depths, and fan apart as you scroll away. |
| `Scribble` | Pen notes whose arrows draw themselves in. |
| Ticker | One marquee: what is on sale today, on a tilted yellow band. Pauses on hover. |
| `DealIn` | Shelf posters and proofs are dealt out of a pile into the grid. |
| `LabGallery` | "Fresh off the drum": a pinned sideways walk past everything for sale; swipe row on phones. |
| `CitedLetter` | OmniReach's sample email: footnotes slide out yellow sticky-note sources. |
| `InlinePlateHeadline` | A pill window opens between the words of "Have one made for you." |
| `RisingWordmark` | KOGNIVO rises out of the footer, pink on blue stock. |

All of it collapses to still under reduced motion.
