import type { ReactNode } from 'react';
import styles from './Information.module.css';
export function InformationPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className={styles.page}>
      <div className="container">
        <div className={styles.heading}>
          <a href="/" className={styles.back}>
            ← DynamicLand
          </a>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </main>
  );
}
