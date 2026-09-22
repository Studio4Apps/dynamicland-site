import { product } from '@/content/product';
import { getSiteConfig } from '@/lib/config';
export const dynamic = 'force-dynamic';
export function GET() {
  const { origin } = getSiteConfig();
  const content = `# ${product.name}\n\n> ${product.description}\n\nPlatform: ${product.platform}.\nPublisher: ${product.publisher}.\n${product.pricing}\n\n## Links\n\n- [Download DynamicLand](${product.downloadUrl})\n${origin ? `- [Overview](${origin}/)\n- [Support](${origin}/support)\n` : ''}`;
  return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
