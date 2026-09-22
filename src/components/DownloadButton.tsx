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
