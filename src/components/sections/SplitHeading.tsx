import type { ReactNode } from 'react';
import styles from './Home.module.css';

// Title on the left, a short paragraph answering it on the right.
export function SplitHeading({
  id,
  title,
  children,
  dark = false,
}: {
  id: string;
  title: ReactNode;
  children?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`${styles.split} ${dark ? styles.splitDark : ''}`}>
      <h2 id={id} data-reveal>
        {title}
      </h2>
      {children && (
        <p data-reveal="120" className={styles.splitText}>
          {children}
        </p>
      )}
    </div>
  );
}
