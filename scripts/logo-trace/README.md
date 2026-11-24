# AmiT logo rebuild

Clean vector rebuild of the AmiT logo from a 106 x 54 px original (`src/amit-0.png`).
Final: `public/logos/amit.svg` (also the logo on the AmiT `investor` document in Sanity).

- Letters: A, m and T in Arial Black (the m slanted ~17 degrees), the i in Times New Roman Bold Italic
  (heavier by a 0.5 px stroke, dot at 87%). Boxes fitted to the original's pixels by `fit_letters.py` (`boxes.json`).
- Swoosh: Bezier fit of the original's outline, hand-tuned in the editor and saved as `swoosh.json`
  (`swoosh-fit.json` is the untouched fit).
- Colours: navy #2a3982, red #a62a30.

Needs a Python venv with numpy, pillow, scikit-image, scipy and fontTools, and macOS system fonts.

```
python -I fit_letters.py                 # refit letter boxes -> boxes.json
python -I rebuild_amit.py amit.svg       # build the SVG
node preview.mjs                         # http://localhost:4852 (side by side), /edit (swoosh pen tool)
```
