/** The scroll position of a section's content: its padding is breathing room
 *  between chapters, so what is centred is what sits inside it. */
export function sectionContentTop(section: HTMLElement) {
  return (
    section.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(section).paddingTop)
  );
}

/** Brings a landing section into view with its content centred on screen, or
 *  its top just under the header when it is too tall to centre. */
export function scrollToSection(section: HTMLElement, behavior: ScrollBehavior) {
  const style = getComputedStyle(section);
  const height =
    section.getBoundingClientRect().height -
    parseFloat(style.paddingTop) -
    parseFloat(style.paddingBottom);
  // The same clearance the browser keeps under the floating header for anchors.
  const clearance = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const offset = Math.max((innerHeight - height) / 2, clearance);
  window.scrollTo({ top: Math.max(sectionContentTop(section) - offset, 0), behavior });
}
