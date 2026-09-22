import Image from 'next/image';

export function ProBadge({ large = false }: { large?: boolean }) {
  return (
    <Image
      src="/brand/pro-badge.png"
      alt="Pro"
      width={104}
      height={51}
      className={`pro${large ? ' proLarge' : ''}`}
      unoptimized
    />
  );
}
