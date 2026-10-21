import { product } from '@/content/product';
import { DownloadIcon } from './Icon';
export function DownloadButton({
  compact = false,
  secondary = false,
  label,
}: {
  compact?: boolean;
  secondary?: boolean;
  label?: string;
}) {
  return (
    <a
      className={`button ${secondary ? 'buttonSecondary' : 'buttonPrimary'}`}
      href={product.downloadUrl}
    >
      {!compact && <DownloadIcon />}
      {label || (compact ? 'Download' : 'Download for Mac')}
    </a>
  );
}

export function AppStoreBadge() {
  return (
    <a className="appStoreBadge" href={product.downloadUrl}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mac-app-store-badge.svg"
        alt="Download on the Mac App Store"
        width={156}
        height={40}
      />
    </a>
  );
}
