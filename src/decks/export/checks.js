// Runs inside the page via page.evaluate — no imports, must be a plain
// function.
//
// Deliberately checks ONLY .deck-slide itself, not every descendant.
// .deck-slide (SlideCanvas) is the one element with overflow:hidden —
// that's the actual visual clip boundary. An initial version checked
// every nested element and produced ~30 false positives (centered text
// naturally has scrollHeight slightly exceeding clientHeight without
// anything actually being cut off, since nothing clips it). Content that
// overflows the slide itself IS a real bug (this caught the real
// TeamGridSlide overflow in Phase 3).
export function runOverflowCheck() {
  const problems = [];
  document.querySelectorAll('.deck-slide').forEach((slide) => {
    if (slide.scrollHeight - slide.clientHeight > 2 || slide.scrollWidth - slide.clientWidth > 2) {
      problems.push({ slideId: slide.getAttribute('data-slide-id') || 'unknown' });
    }
  });
  return problems;
}
