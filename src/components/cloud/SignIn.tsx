import Image from 'next/image';
import { product } from '@/content/product';
import { plan, formatBytes } from '@/lib/cloud/limits';
import { AppleLogo, Icon } from './Icons';
import styles from './SignIn.module.css';

export function SignIn({ preview }: { preview: boolean }) {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.art} aria-hidden="true">
        <Image
          src="/media/invite-island-1600.webp"
          alt=""
          fill
          sizes="(max-width: 860px) 100vw, 55vw"
          priority
          unoptimized
        />
      </div>
      <section className={styles.panel} aria-labelledby="signin-title">
        <a href="/" className={styles.back}>
          ← DynamicLand
        </a>
        <div className={styles.card}>
          <Image
            src={product.logo}
            alt=""
            width={64}
            height={64}
            priority
            unoptimized
            className={styles.logo}
          />
          <h1 id="signin-title">
            Cloud<span>Land</span>
          </h1>
          <p className={styles.lede}>
            Your files, notes and DynamicLand exports — kept on the same island as your Mac.
          </p>
          <button type="button" className={styles.apple} disabled aria-describedby="signin-status">
            <AppleLogo size={19} />
            Sign in with Apple
          </button>
          <p id="signin-status" className={styles.status}>
            Sign in opens when CloudLand launches. There’s no separate account to create.
          </p>
          {preview && (
            <a href="/cloud" className={styles.preview}>
              Open the local preview
            </a>
          )}
          <ul className={styles.points}>
            <li>
              <Icon name="key" size={17} /> No passwords. Apple confirms it’s you with Face ID or
              Touch ID.
            </li>
            <li>
              <Icon name="lock" size={17} /> Choose Hide My Email to keep your address private.
            </li>
            <li>
              <Icon name="storage" size={17} /> {formatBytes(plan.quota)} with {plan.name}, from the
              DynamicLand app on your Mac.
            </li>
          </ul>
        </div>
        <p className={styles.legal}>
          By continuing you agree to the <a href="/terms">Terms</a> and{' '}
          <a href="/privacy">Privacy</a> notice.
        </p>
      </section>
    </main>
  );
}
