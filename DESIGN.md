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

The home page is one continuous scroll in three acts:

1. **Opening** (`components/home/Opening.tsx`). A plaza of our instruments (obelisk, turning armillary, colonnade, domed hall) ray-marched live in a WebGL2 fragment shader and printed in two drums: pink light, blue 45 degree halftone shadow, out of register, with ink rain. Scroll flies the camera in; KOGNIVO's letters fly past it; then the pink floods the frame. No loader. A pointer-following yellow "Scroll down" badge. Reduced motion or no WebGL: a still riso print.
2. **Creation** (`components/home/Creation.tsx`). Michelangelo's two hands, cut out of `scripts/src/creation.jpg` and reprinted in three riso inks with an ink keyline by `scripts/creation.py`, slide in over the pink and almost touch. A yellow spark jumps the gap. The hands pull apart and the spark's star (`public/star.svg`, a mask) opens like a window onto the screen behind them: a ball of prints (`CardSphere.tsx`, three.js), every product's posters on a turning sphere, the far side sinking into the paper. Once open it is a toy: drag to spin it (it keeps your spin, slows under the pointer), hover a print for its name and price, click it to pull the machine.
3. **Into the Atlas.** Keep scrolling and the ball bursts, its cards fly out past you, and a blue wipe carries you to **/atlas**, a page of its own, so scrolling there never drops you back into the hands. It only fires on a real scroll down (never when the browser restores your place on the way back). "Skip to the Atlas" and "Open the Atlas" go straight there.

**The Atlas** (`app/atlas`, `components/home/Floor.tsx`, three.js). Every product is a pile of its prints on a ruled floor that bends away like the top of a globe and wraps in every direction, so it never ends. Drag to move (with inertia), scroll to travel (shift or a sideways swipe for sideways), pinch to rise or sink, arrow keys too. The piles drop in nearest first on arrival. Shelf chips walk you to a shelf and fade the rest; the masthead shows your position. Labels are real buttons. No WebGL: a flat grid of piles. The notice bar and footer stand down on this page; it is the whole screen.

Clicking any print or pile pulls the **machine** (`SlotMachine.tsx`); its ticket opens the product page.

Text over moving pictures always prints on its own paper (paper chip, ink type, hard shadow) so it stays legible whatever passes behind it; the flying KOGNIVO letters are yellow with an ink outline.

The machine: three reels of prints spin and stop one after another on that product, then its ticket prints out. The ticket is the way in.

The **product page** follows an editorial case-study layout: the wide print uncovered on arrival and drifting slower than the page, a giant title with a scrambling mono status, an info grid (© / features / description / buy box), the other prints staggered down the page at different speeds with clip reveals, label-left text-right blocks, and the next product as a full-width coloured link. Moving between products (and from the ticket) runs `PageWipe`: a sheet of the product's ink with a curved edge sweeps up carrying its name.

Elsewhere:

| Component | What it does |
|---|---|
| `RisoText` | Headings printed on two drums; the pink copy drifts out of register as the heading enters and leaves. |
| `Scribble` | Pen notes whose arrows draw themselves in. |
| Ticker | What is on sale today, on a tilted yellow band. Pauses on hover. |
| `DealIn` | Store posters are dealt out of a pile into the grid. |
| `CitedLetter` | OmniReach's sample email: footnotes slide out yellow sticky-note sources. |
| `RisingWordmark` | KOGNIVO rises out of the footer, pink on blue stock. |

All of it collapses to still under reduced motion.

Prints per product: `{plate}.webp` (poster), `{plate}-1..3.webp` (turned left, right, behind; one proof for coming-soon), `{plate}-wide.webp` (16:9 cover). `python3 scripts/riso.py --variants` and `--wide` print them.
