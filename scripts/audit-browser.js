// Enabled solely by the local preview server's ?audit parameter.
(() => {
  const metrics = {
    lcp: 0,
    cls: 0,
    interactionMax: 0,
    longTasks: 0,
    longTaskMax: 0,
    frames: 0,
    frameOver25ms: 0,
    frameMax: 0,
  };
  const publish = () => (document.documentElement.dataset.auditMetrics = JSON.stringify(metrics));
  const watch = (type, update) => {
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) update(e);
        publish();
      }).observe({ type, buffered: true, durationThreshold: 16 });
    } catch {}
  };
  watch('largest-contentful-paint', (e) => {
    metrics.lcp = Math.round(e.startTime);
  });
  watch('layout-shift', (e) => {
    if (!e.hadRecentInput) metrics.cls += e.value;
  });
  watch('event', (e) => {
    if (e.interactionId) metrics.interactionMax = Math.max(metrics.interactionMax, e.duration);
  });
  watch('longtask', (e) => {
    metrics.longTasks++;
    metrics.longTaskMax = Math.max(metrics.longTaskMax, Math.round(e.duration));
  });
  let last = 0,
    until = 0,
    running = false;
  const sample = (t) => {
    if (last) {
      const d = t - last;
      metrics.frames++;
      metrics.frameMax = Math.max(metrics.frameMax, Math.round(d));
      if (d > 25) metrics.frameOver25ms++;
    }
    last = t;
    if (t < until) requestAnimationFrame(sample);
    else {
      running = false;
      last = 0;
      publish();
    }
  };
  document.addEventListener(
    'scroll',
    () => {
      until = performance.now() + 1400;
      if (!running) {
        running = true;
        requestAnimationFrame(sample);
      }
    },
    { passive: true },
  );
  publish();
})();

if (typeof axe !== 'undefined') {
  window.addEventListener('load', async () => {
    await document.fonts.ready;
    const result = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
    });
    document.documentElement.dataset.auditA11y = JSON.stringify({
      passes: result.passes.length,
      incomplete: result.incomplete.map((x) => x.id),
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    });
  });
}
