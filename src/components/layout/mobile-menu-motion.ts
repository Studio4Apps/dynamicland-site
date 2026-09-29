import { createMotionScope, springEasing } from '@/lib/motion';
import { MENU_GLASS } from './mobile-menu-glass';

// Geometry sampled from the owner's 60fps menu recording. The surface travels
// from the trigger, blooms below its destination, then settles into a rectangle.
export const MENU_MOTION = { openMs: 520, closeMs: 420 } as const;
type Shape = { x: number; y: number; width: number; height: number; radius: string };

export function createMobileMenuMotion(root: HTMLDetailsElement, header: HTMLElement) {
  const trigger = root.querySelector<HTMLElement>('summary')!;
  const icon = root.querySelector<HTMLElement>('[data-menu-icon]')!;
  const panel = root.querySelector<HTMLElement>('[data-menu-panel]')!;
  const glass = root.querySelector<HTMLElement>('[data-menu-glass]')!;
  const clip = root.querySelector<HTMLElement>('[data-menu-clip]')!;
  const content = panel.querySelector<HTMLElement>('nav')!;
  const compact = matchMedia('(max-width: 760px)');
  const abort = new AbortController();
  let expanded = root.open;
  let expectedOpen = root.open;
  let moving = false;
  let focusOnOpen = false;
  let restoreOnClose = false;
  let source: Shape;
  let destination: Shape;

  const show = (value: boolean) => {
    expectedOpen = value;
    root.open = value;
  };
  const semantics = () => {
    root.dataset.menuExpanded = String(expanded);
    trigger.setAttribute('aria-expanded', String(expanded));
    // The trigger is consumed by the surface, not a separate close control.
    trigger.tabIndex = root.open ? -1 : 0;
    if (root.open) trigger.setAttribute('aria-hidden', 'true');
    else trigger.removeAttribute('aria-hidden');
    panel.inert = !expanded;
    if (expanded) panel.removeAttribute('aria-hidden');
    else panel.setAttribute('aria-hidden', 'true');
  };
  const finish = () => {
    moving = false;
    scope.cancel();
    show(expanded);
    semantics();
    root.dataset.menuState = expanded ? 'open' : 'closed';
    if (expanded && focusOnOpen) {
      focusOnOpen = false;
      content.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    } else if (!expanded && restoreOnClose) {
      restoreOnClose = false;
      trigger.focus({ preventScroll: true });
    }
  };
  const scope = createMotionScope(finish);
  const measure = () => {
    const from = trigger.getBoundingClientRect();
    const to = panel.getBoundingClientRect();
    source = {
      x: from.left - to.left,
      y: from.top - to.top,
      width: from.width,
      height: from.height,
      radius: `${from.width / 2}px`,
    };
    destination = {
      x: 0,
      y: 0,
      width: to.width,
      height: to.height,
      radius: `${Math.min(MENU_GLASS.radius, to.width / 2, to.height / 2)}px`,
    };
  };
  const surfaceFrame = (shape: Shape): Keyframe => ({
    transform: `translate(${shape.x}px, ${shape.y}px)`,
    width: `${shape.width}px`,
    height: `${shape.height}px`,
    borderRadius: shape.radius,
  });
  const clipFrame = (shape: Shape): Keyframe => ({
    clipPath: `inset(${shape.y}px ${destination.width - shape.x - shape.width}px ${destination.height - shape.y - shape.height}px ${shape.x}px round ${shape.radius})`,
  });
  const referenceFrames = (opening: boolean) => {
    // time, horizontal travel, width growth, height growth, downward arc, corner settling
    const samples = opening
      ? [
          [0, 0, 0, 0, 0, 0],
          [0.035, -0.012, -0.055, -0.055, 0, 0],
          [0.075, 0.07, -0.024, -0.08, 0.015, 0],
          [0.12, 0.32, 0.16, 0.25, 0.07, 0],
          [0.19, 0.67, 0.592, 0.78, 0.18, 0.02],
          [0.26, 0.85, 0.79, 0.922, 0.16, 0.1],
          [0.34, 0.95, 0.91, 0.98, 0.11, 0.25],
          [0.44, 1.015, 1.02, 1.005, 0.045, 0.6],
          [0.56, 1.028, 1.031, 1.009, 0.005, 0.85],
          [0.72, 1.012, 1.013, 1.003, -0.005, 0.98],
          [1, 1, 1, 1, 0, 1],
        ]
      : [
          [0, 1, 1, 1, 0, 1],
          [0.07, 1.004, 1.012, 1.01, 0.035, 0.8],
          [0.19, 0.84, 0.84, 0.93, 0.14, 0.25],
          [0.32, 0.63, 0.62, 0.79, 0.17, 0],
          [0.45, 0.43, 0.41, 0.6, 0.14, 0],
          [0.58, 0.27, 0.23, 0.41, 0.075, 0],
          [0.72, 0.11, 0.1, 0.18, 0.025, 0],
          [0.85, 0.012, -0.015, 0.03, 0, 0],
          [0.93, -0.008, -0.025, -0.035, 0, 0],
          [1, 0, 0, 0, 0, 0],
        ];
    const mix = (a: number, b: number, t: number) => a + (b - a) * t;
    return samples.map(([offset, travel, w, h, arc, corners]) => {
      const width = w < 0 ? source.width * (1 + w) : mix(source.width, destination.width, w);
      const height = h < 0 ? source.height * (1 + h) : mix(source.height, destination.height, h);
      const x = mix(source.x + source.width / 2, destination.width / 2, travel) - width / 2;
      const y =
        mix(source.y + source.height / 2, destination.height / 2, travel) -
        height / 2 +
        destination.height * arc;
      const radius = mix(Math.min(width, height) / 2, parseFloat(destination.radius), corners);
      // A slightly tighter upper-right corner forms the returning droplet.
      const tail = opening ? 0 : Math.sin(Math.PI * Math.max(0, Math.min(1, travel))) * 0.35;
      const shape = {
        x,
        y,
        width,
        height,
        radius: `${radius}px ${radius * (1 - tail)}px ${radius}px ${radius}px`,
      };
      return { surface: { ...surfaceFrame(shape), offset }, clip: { ...clipFrame(shape), offset } };
    });
  };
  const setOpen = (next: boolean, restore = false, instant = false, keyboard = false) => {
    if (next === expanded && !moving) return;
    const interrupted = moving;
    const presentation = interrupted
      ? [glass, clip, content, icon].map((element) => {
          const css = getComputedStyle(element);
          return {
            transform: css.transform,
            opacity: css.opacity,
            filter: css.filter,
            width: css.width,
            height: css.height,
            borderRadius: css.borderRadius,
            clipPath: css.clipPath,
          };
        })
      : [];
    scope.cancel();
    expanded = next;
    focusOnOpen = next && keyboard;
    restoreOnClose = !next && restore;
    // Move focus off controls before they become hidden/inert. Escape restores
    // it only when the returning circle has actually become the button again.
    if (next ? document.activeElement === trigger : panel.contains(document.activeElement))
      (document.activeElement as HTMLElement)?.blur();
    show(true);
    semantics();
    if (
      instant ||
      !compact.matches ||
      scope.reduced.matches ||
      typeof glass.animate !== 'function'
    ) {
      finish();
      return;
    }
    measure();
    moving = true;
    root.dataset.menuState = next ? 'opening' : 'closing';
    const duration = interrupted
      ? next
        ? 360
        : 300
      : next
        ? MENU_MOTION.openMs
        : MENU_MOTION.closeMs;
    const target = next ? destination : source;
    const frames = referenceFrames(next);
    const easing = interrupted ? springEasing(duration, 0.35, 0.88) : 'linear';
    const iconFrames = interrupted
      ? [{ opacity: presentation[3].opacity }, { opacity: next ? 0 : 1 }]
      : next
        ? [
            { opacity: 1, offset: 0 },
            { opacity: 0, offset: 0.12 },
            { opacity: 0, offset: 1 },
          ]
        : [
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.78 },
            { opacity: 1, offset: 1 },
          ];
    scope.animate(icon, iconFrames, { duration, easing: 'linear' });
    const contentStart = interrupted
      ? {
          opacity: presentation[2].opacity,
          transform: presentation[2].transform,
          filter: presentation[2].filter,
        }
      : next
        ? { opacity: 0, transform: 'translateY(8px) scale(1.13)', filter: 'blur(5px)' }
        : { opacity: 1, transform: 'none', filter: 'blur(0px)' };
    const contentEnd = next
      ? { opacity: 1, transform: 'none', filter: 'blur(0px)' }
      : { opacity: 0, transform: 'translateY(10px) scale(1.08)', filter: 'blur(5px)' };
    scope.animate(
      content,
      next
        ? [contentStart, contentEnd]
        : [
            { ...contentStart, offset: 0, easing: 'ease-out' },
            { ...contentEnd, offset: 180 / duration },
            { ...contentEnd, offset: 1 },
          ],
      {
        // Keep the faded content hidden until the shell has returned to the
        // trigger; cancelling a shorter animation would reveal the links again.
        duration: next ? 300 : duration,
        delay: next && !interrupted ? 100 : 0,
        fill: 'both',
        easing: next ? 'ease-out' : 'linear',
      },
    );
    scope.animate(
      clip,
      interrupted
        ? [{ clipPath: presentation[1].clipPath }, clipFrame(target)]
        : frames.map((frame) => frame.clip),
      { duration, easing },
    );
    // Finish last: fallback/throwing animation APIs must resolve every surface.
    scope.animate(
      glass,
      interrupted ? [presentation[0], surfaceFrame(target)] : frames.map((frame) => frame.surface),
      { duration, easing },
      finish,
    );
  };

  trigger.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      setOpen(!expanded, false, false, event.detail === 0);
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    'toggle',
    () => {
      if (root.open !== expectedOpen) setOpen(root.open, false, true);
    },
    { signal: abort.signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && root.open) {
        event.preventDefault();
        setOpen(false, true);
      }
    },
    { signal: abort.signal },
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (expanded && !panel.contains(event.target as Node)) setOpen(false);
    },
    { signal: abort.signal },
  );
  document.addEventListener(
    'focusin',
    (event) => {
      if (expanded && moving && panel.contains(event.target as Node)) finish();
      else if (expanded && !panel.contains(event.target as Node)) setOpen(false);
    },
    { signal: abort.signal },
  );
  compact.addEventListener(
    'change',
    () => {
      if (!compact.matches && root.open) {
        const restore = root.contains(document.activeElement);
        setOpen(false, false, true);
        if (restore) header.querySelector<HTMLAnchorElement>('a')?.focus();
      }
    },
    { signal: abort.signal },
  );
  root.dataset.menuEnhanced = 'true';
  semantics();
  root.dataset.menuState = expanded ? 'open' : 'closed';
  return {
    close: (restore = false, instant = false) => setOpen(false, restore, instant),
    destroy: () => {
      abort.abort();
      expanded = false;
      scope.destroy();
      delete root.dataset.menuEnhanced;
      delete root.dataset.menuExpanded;
      delete root.dataset.menuState;
      trigger.removeAttribute('aria-expanded');
      trigger.removeAttribute('aria-hidden');
      trigger.removeAttribute('tabindex');
    },
  };
}
