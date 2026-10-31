# Design

A cabinet of instruments. Every app Kognivo makes is an instrument engraved on a copper plate, numbered Pl. I to Pl. IX. Instruments still in development stand under a draped cloth. Laid paper, oxblood-black etching ink, hairline rules. Light only: this is a print world.

| Token | Hex | Use |
|---|---|---|
| Paper | #EDE7DA | page ground |
| Paper hi | #F5F1E8 | inputs, the sample letter |
| Plate | #E3DBCA | toned sections (evidence, plans), plate backing |
| Ink | #1F1416 | text, rules, the cabinet frame |
| Ink 2 | #5A4A4C | secondary text (7:1 on paper) |
| Oxblood | #7A1F24 | the one accent: buttons, links, plate numbers, stamps, focus |

Type: Cormorant Garamond 500/600 (+ italic) for headings, plate numbers and captions, never below 15px. Instrument Sans for body and controls, 17/1.62. Mono only for source URLs. Self-hosted through @fontsource.

Shape: all sharp, radius 0. The only round things are the footnote buttons in the sample letter.

State stamps (`.stamp`): a rubber stamp in oxblood, slightly rotated, with a noise mask so the ink breaks. Private beta in oxblood, In the lab in ink 2.

## Imagery

Every image is drawn by `scripts/etch.py` (numpy + Pillow, seeded, re-runnable: `npm run etch`). Each instrument is a signed-distance scene ray-marched in numpy; the shading only decides line weight. Lines are slices of the form by parallel planes, so they wrap it the way a burin does, with cross-hatching in the deep shadows, a hand wobble and burr, a ruled sky, a ruled floor pool with the cast shadow, laid paper and a plate mark.

| File | Plate | Use |
|---|---|---|
| `armillary.webp` | Pl. I, OmniReach: an armillary sphere on a turned stand | Hero cabinet, catalogue lead, OmniReach page |
| `cloth-02` to `cloth-09.webp` | Pl. II to IX: eight different shapes under cloth | Catalogue, the lab gallery, lab pages |
| `magnifier.webp` | A reading glass over a letter | Evidence section |
| `dividers.webp` | Drafting dividers on a sheet | Commission |
| `door-left/right.webp` | Engraved cabinet doors: raised panel, wood grain, keyhole, hinges | Hero |

When a lab instrument gets a name, give it its own scene in `etch.py` and swap the cloth.

## Motion

One authored moment per section, all honouring reduced motion (`components/motion`, Motion for React). Patterns are the Zenith Youth Summit site's, re-dressed for this world.

| Component | Zenith pattern | Here |
|---|---|---|
| `CabinetHero` | ScrollHero (pinned, window grows) | Pinned 2.1 screens: the cabinet doors swing open on their hinges, the interior shadow lifts, Pl. I settles. Phones: doors open once in view. Copy and form never move. |
| `SplitText` | SplitText | Every section heading sets letter by letter. |
| `DealIn` | DealIn | The nine plates are dealt out of the case into the grid. |
| `CitedLetter` | (new) | The signature: footnotes in a sample draft slide out their source slips. |
| `StepIndex` | ScrollSpySequence | The plate's key follows the step in view. |
| `LabGallery` | HorizontalGallery | Pinned sideways walk past the eight covered plates; swipe row on phones. |
| `InlinePlateHeadline` | InlineImageHeadline | A plate window opens between the words of "Have one made for you." |
| `RisingWordmark` | RisingWordmark | KOGNIVO rises out of the footer floor. |
