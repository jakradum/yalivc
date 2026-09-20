// House style, learned from Yali's real past assets (docs/: the LinkedIn roundup
// carousels, the portfolio-news posts, the PointAI carousel, the C2i and
// Westbridge posts, the July guest carousel) and docs/CLAUDE.md. This is guidance
// to the model, not a restriction: it's how Yali's own posts look, so start
// from these unless the request says otherwise.
export const HOUSE_STYLE = `HOUSE STYLE (from Yali's real past LinkedIn assets; follow unless asked otherwise)
- Social assets are 1080×1080. Carousels are a set of pages exported as a PDF (one per slide); single posts are one page exported as a PNG.
- Photo-led pages run edge to edge: set page bleed:true, put text in a stack with padding "xl" so it keeps its margin. Text-only pages keep the normal safe margin.
- Type: carousels are mono throughout (heading for headlines, note for the grey paragraph, eyebrow for the small caps label). Portfolio-news posts pair a mono eyebrow with an Inter "headline". Body copy is small and quiet: a big heading over a note, not big body text.
- Colour: light pages use light (#efefef) with ink text and crimson eyebrows; dark pages use ink or black with white headings, gold eyebrows and silver body; crimson pages use white and gold. Alternate light and ink pages through a carousel; open on black or crimson; close on crimson.
- Photos: use tone "house" on every photograph. Never put text on a photo without a fade or scrim. A dark fade (black, from the bottom) under a caption is the usual treatment.
- Bottom crimson band: a shape of kind "band" (8px) closes many light and ink pages.
- Copy: no em dashes. Eyebrows read like "PORTFOLIO NEWS", "PORTFOLIO · C2I SEMICONDUCTORS", "SEMICONDUCTOR PANEL". Group photos carry a micro caption "L-R: name, name". Sign off with "yali.vc"; portfolio-company assets say "A Yali Capital portfolio company". Numbering like "Yali I - 01" (micro, top right) is used on guest cards.

RECIPES (compose these with blocks; all measurements are for the 1080 canvas)
1. Roundup cover: page black, not bleed. Centre column: display "Roundup" (white), a gold heading with the month ("Jun ’26"), a small lockup logo (tone dark, size s). Optionally a layer behind it: a dimmed photo (image tone "dim").
2. Photo + text page (light or ink), bleed:true: an image on top (fit cover, ratio 16:9, tone house) then a stack (padding xl, gap m): eyebrow (crimson on light, gold on ink), heading, note (grey on light, silver on ink), an optional micro credit line; a crimson band at the very bottom.
3. Two-photo page, bleed:true: grid of 2 images (gap xs, ratio 1:1, tone house) then the same text stack.
4. Panel page (crimson), bleed:true: one or two photos on top, then a gold eyebrow ("SEMICONDUCTOR PANEL"), white heading, silver note, then a list of "Name" (white) + role (silver), micro heading "PANELISTS" above it.
5. Guest spotlight (single), black, bleed:true: a layer: photo (tone house), a black fade, then at the bottom a stack (padding xl): a filled crimson tag with the firm, the guest name (heading, white), role and city (caption, silver), a short note. A micro "Yali I - 01" anchored top right.
6. Portfolio news (single), crimson, bleed:true: top ~57%: a layer with the photo (tone house, ratio 16:9) and the lockup logo (tone dark, size s) anchored top left with inset l. Below, a stack (padding xl, gap m): a row with the gold eyebrow "PORTFOLIO NEWS" on the left and the company logo on a light chip (stack fill light, padding s) on the right (an image block of the attached company logo, size "s", fit contain: the page is tight, a bigger logo will not fit); a headline (white) with the company name highlighted; a growing empty stack to push the footer down; a divider; a row with the lockup logo (tone dark, s) and micro "YALI.VC" aligned right.
7. Closing page (crimson): the big white logomark (variant mark, tone dark, size xl) centred, "yali.vc" (heading, white) and "Follow for more updates" (note, silver). Always the logomark here, never the lockup.
8. Statement page (light): crimson eyebrow, large heading, a short ink divider, a mono note paragraph; small footer micro line. Tag pills (outline style) suit a row of facts ("IN-HOUSE IP", "70+ GLOBAL PATENTS").
9. Stat page: eyebrow, then stats in bordered boxes (a grid of stacks with border ink, padding m) or bare stat blocks; label under each.
- The Yali lockup logo is used as an image only, with no text label beside it. On dark or crimson use tone "dark" (it renders white).`;
