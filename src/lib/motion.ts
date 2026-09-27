// Web adaptations of DynamicLand's DIAnim and LaunchpadMotion.
// See docs/native-motion-study.md for native evidence and web-specific choices.
export const MOTION = {
  enterMs: 520,
  opacityMs: 130,
  sectionMs: 420,
  sectionExitMs: 140,
  sectionDelayMs: 60,
  disclosureOpenMs: 340,
  disclosureCloseMs: 200,
  staggerMs: 55,
  exitEase: 'cubic-bezier(.4, 0, 1, 1)',
} as const;

// Sample a damped spring once; WAAPI runs the motion without per-frame JS.
export function springProgress(seconds: number, response = 0.38, damping = 0.85) {
  const omega = (2 * Math.PI) / response;
  const damped = omega * Math.sqrt(1 - damping * damping);
  return (
    1 -
    Math.exp(-damping * omega * seconds) *
      (Math.cos(damped * seconds) + (damping * omega * Math.sin(damped * seconds)) / damped)
  );
}

export function springEasing(duration: number, response = 0.34, damping = 0.9) {
  const values = Array.from({ length: 41 }, (_, i) =>
    i === 40 ? 1 : Number(springProgress((duration * i) / 40000, response, damping).toFixed(5)),
  );
  const easing = `linear(${values.join(',')})`;
  return typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', easing)
    ? easing
    : 'cubic-bezier(.16, 1, .3, 1)';
}

export function entranceFrames({
  y = 14,
  scale = 1,
  opacity = 0.65,
  blur = 0,
  duration = MOTION.enterMs as number,
} = {}): Keyframe[] {
  return Array.from({ length: 41 }, (_, i) => {
    const time = (duration * i) / 40;
    const remaining = i === 40 ? 0 : 1 - springProgress(time / 1000);
    const visible = Math.min(1, time / MOTION.opacityMs);
    return {
      offset: i / 40,
      opacity: opacity + (1 - opacity) * visible,
      transform:
        i === 40 ? 'none' : `translateY(${y * remaining}px) scale(${1 + (scale - 1) * remaining})`,
      ...(blur ? { filter: `blur(${blur * Math.pow(Math.max(0, 1 - time / 240), 2)}px)` } : {}),
    };
  });
}

export function createMotionScope(onSettle?: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map<Animation, Element>();
  const abort = new AbortController();
  const cancel = () => {
    animations.forEach((_, animation) => animation.cancel());
    animations.clear();
  };
  const settle = () => {
    cancel();
    onSettle?.();
  };
  const onPreference = () => {
    if (reduced.matches) settle();
  };
  const onVisibility = () => {
    if (document.hidden) settle();
  };
  reduced.addEventListener('change', onPreference, { signal: abort.signal });
  document.addEventListener('visibilitychange', onVisibility, { signal: abort.signal });
  window.addEventListener('resize', settle, { signal: abort.signal, passive: true });
  return {
    reduced,
    cancel,
    isAnimating: (element: Element) => Array.from(animations.values()).includes(element),
    animate(
      element: HTMLElement,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
      onFinish?: () => void,
    ) {
      if (reduced.matches || document.hidden || typeof element.animate !== 'function') {
        onFinish?.();
        return;
      }
      try {
        const animation = element.animate(frames, options);
        animations.set(animation, element);
        animation.finished
          .then(() => {
            if (!animations.has(animation)) return;
            animations.delete(animation);
            animation.cancel();
            onFinish?.();
          })
          .catch(() => {});
      } catch {
        onFinish?.();
      }
    },
    destroy() {
      abort.abort();
      settle();
    },
  };
}
