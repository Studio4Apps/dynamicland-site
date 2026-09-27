// This clock measures settled slide dwell, independently of optional product media.
export const GALLERY_TIMING = {
  mode: 'slides',
  dwellMs: 6150,
  travelMs: 900,
  compactTravelMs: 500,
} as const;
export type GalleryState = {
  current: number;
  start: boolean;
  end: boolean;
  playback: 'Play' | 'Pause';
  announcement: string;
};

export function createGalleryController(
  root: HTMLElement,
  dwellMs: number,
  publish: (state: GalleryState) => void,
) {
  const track = root.querySelector<HTMLElement>('[data-gallery-track]')!;
  const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-gallery-card]'));
  const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-gallery-dot]'));
  const fills = dots.map((dot) => dot.querySelector<HTMLElement>('[data-dwell-fill]')!);
  const rotation = root.querySelector<HTMLButtonElement>('[data-rotation]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 734px)');
  const abort = new AbortController();
  const listen = (target: EventTarget, type: string, listener: EventListener, passive = true) =>
    target.addEventListener(type, listener, { signal: abort.signal, passive });
  const duration = Number.isFinite(dwellMs) && dwellMs > 0 ? dwellMs : GALLERY_TIMING.dwellMs;
  let targets: number[] = [],
    current = 0,
    settled = 0;
  let intent: 'play' | 'pause' = reduced.matches || cards.length < 2 ? 'pause' : 'play';
  let inView = false;
  let elapsed = 0,
    clockAt: number | null = null,
    frame = 0,
    disposed = false;
  let nativeUntil = 0,
    pointerDown = false,
    lastWritten = track.scrollLeft;
  let needsMeasure = false,
    needsView = false,
    announcement = '';
  let measuredWidth = 0,
    measuredScrollWidth = 0;
  let previousState: GalleryState | undefined;
  let captionAnimation: Animation | undefined;
  let travel: {
    from: number;
    to: number;
    index: number;
    at: number;
    duration: number;
    manual: boolean;
  } | null = null;
  let drag: {
    x: number;
    y: number;
    scroll: number;
    pointer: number;
    active: boolean;
    mouse: boolean;
  } | null = null;

  const playback = (): GalleryState['playback'] => (intent === 'play' ? 'Pause' : 'Play');
  const eligible = () =>
    intent === 'play' &&
    inView &&
    !document.hidden &&
    !travel &&
    !nativeUntil &&
    !pointerDown &&
    cards.length > 1;
  const sample = (now: number) => {
    if (clockAt !== null) elapsed = Math.min(duration, elapsed + Math.max(0, now - clockAt));
    clockAt = null;
  };
  const request = () => {
    if (!frame && !disposed) frame = requestAnimationFrame(tick);
  };
  const reconcile = (now = performance.now()) => {
    sample(now);
    if (eligible()) clockAt = now;
    root.dataset.playing = String(clockAt !== null);
    if (travel || nativeUntil || needsMeasure || needsView || clockAt !== null) request();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    render();
  };
  const writePosition = (position: number) => {
    track.scrollLeft = position;
    lastWritten = track.scrollLeft;
  };
  const nearest = () =>
    targets.reduce(
      (best, offset, index) =>
        Math.abs(offset - track.scrollLeft) < Math.abs(targets[best] - track.scrollLeft)
          ? index
          : best,
      0,
    );

  function render() {
    if (!targets.length || needsMeasure) return;
    const selected = nearest();
    if (selected !== current) {
      current = selected;
      captionAnimation?.cancel();
      const caption = cards[current]?.querySelector<HTMLElement>('[data-gallery-caption]');
      if (caption?.animate && !reduced.matches && !document.hidden)
        captionAnimation = caption.animate(
          [
            { opacity: 0.6, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 420, easing: 'cubic-bezier(.22,.68,0,1)' },
        );
    }
    // Position weights sum to one: the capsule and playback button never move.
    let lower = 0;
    while (lower < targets.length - 1 && track.scrollLeft >= targets[lower + 1]) lower++;
    const upper = Math.min(lower + 1, targets.length - 1);
    const fraction =
      upper === lower
        ? 0
        : Math.max(
            0,
            Math.min(1, (track.scrollLeft - targets[lower]) / (targets[upper] - targets[lower])),
          );
    dots.forEach((dot, index) => {
      const weight = reduced.matches
        ? Number(index === current)
        : index === lower
          ? 1 - fraction
          : index === upper
            ? fraction
            : 0;
      dot.style.setProperty('--expansion', String(weight));
      fills[index].style.width = `${index === settled ? (elapsed / duration) * 100 : 0}%`;
    });
    const next: GalleryState = {
      current,
      start: track.scrollLeft <= 2,
      end: track.scrollLeft >= track.scrollWidth - track.clientWidth - 2,
      playback: playback(),
      announcement,
    };
    if (
      !previousState ||
      Object.keys(next).some(
        (key) => next[key as keyof GalleryState] !== previousState![key as keyof GalleryState],
      )
    ) {
      previousState = next;
      publish(next);
    }
  }
  function finish(manual: boolean) {
    travel = null;
    nativeUntil = 0;
    track.removeAttribute('data-moving');
    current = nearest();
    if (settled !== current) {
      settled = current;
      elapsed = 0;
    }
    if (manual) announcement = `Highlight ${cards[current].getAttribute('aria-label')}`;
  }
  function completeTravel() {
    if (!travel) return;
    const manual = travel.manual;
    writePosition(targets[travel.index] || 0);
    finish(manual);
  }
  function go(index: number, manual: boolean) {
    const now = performance.now();
    sample(now);
    nativeUntil = 0;
    const selected = Math.max(0, Math.min(cards.length - 1, index));
    const destination = targets[selected] || 0;
    track.dataset.moving = 'true';
    travel = {
      from: track.scrollLeft,
      to: destination,
      index: selected,
      at: now,
      duration: compact.matches ? GALLERY_TIMING.compactTravelMs : GALLERY_TIMING.travelMs,
      manual,
    };
    if (
      reduced.matches ||
      !inView ||
      document.hidden ||
      Math.abs(destination - track.scrollLeft) < 1
    )
      completeTravel();
    reconcile(now);
  }
  const pause = () => {
    sample(performance.now());
    intent = 'pause';
    reconcile();
  };
  const interrupt = () => {
    sample(performance.now());
    travel = null;
    track.removeAttribute('data-moving');
    nativeUntil = performance.now() + 140;
    reconcile();
  };
  const updateView = () => {
    const box = track.getBoundingClientRect();
    const visible = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
    inView = visible > 0 && box.right > 0 && box.left < innerWidth;
    if (!inView) {
      completeTravel();
      captionAnimation?.cancel();
    }
  };
  function measure() {
    // Reflow may clamp scrollLeft before resize fires; preserve the settled identity,
    // rather than interpreting the new offset against the previous measurements.
    const selected = travel?.index ?? settled;
    const manual = travel?.manual ?? false;
    travel = null;
    nativeUntil = 0;
    track.dataset.moving = 'true';
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    measuredWidth = track.clientWidth;
    measuredScrollWidth = track.scrollWidth;
    // offsetLeft rounds each card independently to whole CSS pixels. Native
    // scroll snapping retains fractional positions, especially on Retina screens.
    const firstLeft = cards[0].getBoundingClientRect().left;
    targets = cards.map((card) =>
      Math.min(max, Math.max(0, card.getBoundingClientRect().left - firstLeft)),
    );
    writePosition(targets[selected] || 0);
    finish(manual);
    updateView();
  }
  function tick(now: number) {
    frame = 0;
    sample(now);
    if (needsMeasure) {
      needsMeasure = false;
      measure();
    }
    if (needsView) {
      needsView = false;
      updateView();
    }
    if (travel) {
      const t = Math.min(1, (now - travel.at) / travel.duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      writePosition(travel.from + (travel.to - travel.from) * ease);
      if (t === 1) completeTravel();
    } else if (nativeUntil && now >= nativeUntil && !pointerDown) {
      go(nearest(), true);
      return;
    }
    if (eligible() && elapsed >= duration) {
      go((current + 1) % cards.length, false);
      return;
    }
    reconcile(now);
  }

  dots.forEach((dot, index) => listen(dot, 'click', () => go(index, true)));
  if (rotation) {
    listen(rotation, 'click', () => {
      if (intent === 'play') {
        pause();
        return;
      }
      sample(performance.now());
      intent = 'play';
      announcement = '';
      reconcile();
    });
  }
  listen(
    track,
    'keydown',
    (event) => {
      const key = (event as KeyboardEvent).key;
      if (event.target !== track || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key))
        return;
      event.preventDefault();
      go(
        key === 'Home'
          ? 0
          : key === 'End'
            ? cards.length - 1
            : (travel?.index ?? current) + (key === 'ArrowRight' ? 1 : -1),
        true,
      );
    },
    false,
  );
  listen(track, 'scroll', () => {
    // Native scroll clamping/snap during reflow is not manual navigation.
    if (
      needsMeasure ||
      track.clientWidth !== measuredWidth ||
      track.scrollWidth !== measuredScrollWidth
    ) {
      sample(performance.now());
      needsMeasure = true;
      request();
      return;
    }
    // A native subpixel snap correction is not a new gesture. Treating it as
    // input repeatedly suspends the dwell and starts another settlement.
    if (travel || Math.abs(track.scrollLeft - lastWritten) <= 1) return;
    lastWritten = track.scrollLeft;
    sample(performance.now());
    nativeUntil = performance.now() + 140;
    reconcile();
  });
  listen(track, 'wheel', (event) => {
    const wheel = event as WheelEvent;
    if (Math.abs(wheel.deltaX) > Math.abs(wheel.deltaY)) interrupt();
  });
  listen(track, 'pointerdown', (event) => {
    const e = event as PointerEvent;
    if (e.button !== 0) return;
    sample(performance.now());
    completeTravel();
    pointerDown = true;
    drag = {
      x: e.clientX,
      y: e.clientY,
      scroll: track.scrollLeft,
      pointer: e.pointerId,
      active: false,
      mouse: e.pointerType === 'mouse',
    };
    reconcile();
  });
  listen(
    track,
    'pointermove',
    (event) => {
      if (!drag) return;
      const e = event as PointerEvent,
        dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (!drag.active && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        drag.active = true;
        interrupt();
        if (drag.mouse) {
          track.setPointerCapture(drag.pointer);
          track.dataset.moving = 'true';
        }
      }
      if (drag.active && drag.mouse) {
        e.preventDefault();
        writePosition(drag.scroll - dx);
        nativeUntil = performance.now() + 140;
        render();
      }
    },
    false,
  );
  const release = () => {
    if (!pointerDown && !drag) return;
    if (drag?.active && track.hasPointerCapture(drag.pointer))
      track.releasePointerCapture(drag.pointer);
    drag = null;
    pointerDown = false;
    track.removeAttribute('data-moving');
    if (nativeUntil) nativeUntil = performance.now() + 140;
    reconcile();
  };
  listen(window, 'pointerup', release);
  listen(window, 'pointercancel', release);
  listen(track, 'lostpointercapture', release);
  listen(window, 'blur', release);
  listen(reduced, 'change', () => {
    sample(performance.now());
    if (reduced.matches) {
      intent = 'pause';
      completeTravel();
      captionAnimation?.cancel();
    }
    reconcile();
  });
  listen(document, 'visibilitychange', () => {
    sample(performance.now());
    if (document.hidden) {
      completeTravel();
      captionAnimation?.cancel();
      release();
    }
    updateView();
    reconcile();
  });
  const resized = () => {
    sample(performance.now());
    needsMeasure = true;
    reconcile();
  };
  listen(window, 'resize', resized);
  listen(window, 'scroll', () => {
    sample(performance.now());
    needsView = true;
    request();
  });
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resized) : null;
  resizeObserver?.observe(track);
  cards.forEach((card) => resizeObserver?.observe(card));
  const viewObserver =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          () => {
            sample(performance.now());
            updateView();
            reconcile();
          },
          { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1] },
        )
      : null;
  viewObserver?.observe(track);
  measure();
  root.dataset.enhanced = 'true';
  reconcile();
  return () => {
    disposed = true;
    abort.abort();
    cancelAnimationFrame(frame);
    captionAnimation?.cancel();
    resizeObserver?.disconnect();
    viewObserver?.disconnect();
    if (drag?.active && track.hasPointerCapture(drag.pointer))
      track.releasePointerCapture(drag.pointer);
    track.removeAttribute('data-moving');
    root.removeAttribute('data-enhanced');
    root.removeAttribute('data-playing');
  };
}
