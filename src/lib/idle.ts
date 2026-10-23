/** Runs `work` once the main thread is free, or after `timeout` ms at the latest.
 *  Safari has no requestIdleCallback, so a short timer stands in. Returns a canceller. */
export function whenIdle(work: () => void, timeout = 2000) {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(() => work(), { timeout });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(work, Math.min(timeout, 600));
  return () => clearTimeout(id);
}
