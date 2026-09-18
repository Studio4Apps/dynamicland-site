'use client';
import { useRef } from 'react';
import { downloadCopy } from '@/content/copy';
import { site } from '@/content/site';
import { Arrow } from './Arrow';
export function DownloadButton({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const label = compact ? downloadCopy.compactLabel : site.download.label;
  const className = `download-button ${compact ? 'compact' : ''} ${light ? 'light' : ''}`;
  const content = (
    <>
      {compact && (
        <span className="liquid-button-material" aria-hidden="true">
          <span className="liquid-button-track" />
          <span className="liquid-button-blob" />
        </span>
      )}
      <span className="download-label">{label}</span>
      <Arrow down />
    </>
  );
  if (site.download.url)
    return (
      <a className={className} href={site.download.url} rel="noopener noreferrer">
        {content}
      </a>
    );
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
      >
        {content}
      </button>
      <dialog
        ref={dialog}
        className="download-dialog"
        aria-label="Download DynamicLand"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const r = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom
            )
              e.currentTarget.close();
          }
        }}
      >
        <button
          className="dialog-close"
          aria-label={downloadCopy.closeLabel}
          onClick={() => dialog.current?.close()}
          autoFocus
        >
          ×
        </button>
        <p className="brand-name">DynamicLand</p>
        <h2>{site.download.label}</h2>
        <p>{site.download.unavailable}</p>
        <p className="small-copy">{downloadCopy.detail}</p>
        <button className="text-link" onClick={() => dialog.current?.close()}>
          {downloadCopy.back} <Arrow />
        </button>
      </dialog>
    </>
  );
}
