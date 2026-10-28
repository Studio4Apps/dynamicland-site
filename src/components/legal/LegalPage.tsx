import Image from 'next/image';
import type { ReactNode } from 'react';
import { product } from '@/content/product';
import { privacy } from '@/content/legal/privacy';
import { terms } from '@/content/legal/terms';
import type { LegalBlock, LegalDocument, LegalText } from '@/content/legal/types';
import { LegalContents } from './LegalContents';
import { LegalIcon } from './LegalIcon';
import styles from './Legal.module.css';

const documents = [terms, privacy];

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

const blockText = (block: LegalBlock): string =>
  typeof block === 'string'
    ? block
    : 'list' in block
      ? block.list.join(' ')
      : 'link' in block
        ? block.link
        : block.contact;

function readingMinutes(doc: LegalDocument) {
  const text = [
    ...doc.preamble,
    ...doc.sections.flatMap((section) => [
      section.title,
      ...(section.body ?? []),
      ...(section.subsections ?? []).flatMap((sub) => [sub.title, ...sub.body]),
    ]),
  ]
    .map(blockText)
    .join(' ');
  return Math.max(1, Math.round(text.split(/\s+/).length / 230));
}

const inline = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|\n/g;

/** Renders the owner's text as written, turning its **bold**, [links](…) and line breaks into markup. */
function Rich({ text }: { text: LegalText }) {
  const parts: ReactNode[] = [];
  let from = 0;
  for (const match of text.matchAll(inline)) {
    const [whole, bold, label, href] = match;
    parts.push(text.slice(from, match.index));
    parts.push(
      bold ? (
        <strong key={match.index}>{bold}</strong>
      ) : label ? (
        <a key={match.index} href={href}>
          {label}
        </a>
      ) : (
        <br key={match.index} />
      ),
    );
    from = match.index + whole.length;
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}

const lettered = /^\(([a-z])\)\s+/;
const labelled = /^\*\*(.+?)\*\*\s*/;

function List({ items, style }: { items: LegalText[]; style?: 'checks' | 'grid' }) {
  if (items.every((item) => lettered.test(item)))
    return (
      <ol className={styles.lettered}>
        {items.map((item) => {
          const [marker, letter] = item.match(lettered)!;
          return (
            <li key={letter}>
              <span className={styles.letter} aria-hidden="true">
                {letter}
              </span>
              <span>
                <span className="srOnly">({letter}) </span>
                <Rich text={item.slice(marker.length)} />
              </span>
            </li>
          );
        })}
      </ol>
    );
  if (items.every((item) => labelled.test(item)))
    return (
      <dl className={styles.definitions}>
        {items.map((item) => {
          const [marker, label] = item.match(labelled)!;
          return (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <Rich text={item.slice(marker.length)} />
              </dd>
            </div>
          );
        })}
      </dl>
    );
  if (style === 'checks')
    return (
      <ul className={styles.checks}>
        {items.map((item) => (
          <li key={item}>
            <span className={styles.checkMark}>
              <LegalIcon name="check" size={15} />
            </span>
            <span>
              <Rich text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  return (
    <ul className={style === 'grid' ? styles.grid : styles.bullets}>
      {items.map((item) => (
        <li key={item}>
          <Rich text={item} />
        </li>
      ))}
    </ul>
  );
}

function Blocks({ blocks, subject }: { blocks: LegalBlock[]; subject: string }) {
  return blocks.map((block, index) => {
    if (typeof block === 'string')
      return (
        <p key={index}>
          <Rich text={block} />
        </p>
      );
    if ('list' in block) return <List key={index} items={block.list} style={block.style} />;
    if ('link' in block) {
      const external = /^https?:/.test(block.href);
      return (
        <a key={index} className={styles.linkCard} href={block.href}>
          <span className={styles.linkIcon}>
            <LegalIcon name={external ? 'external' : 'agreement'} />
          </span>
          <span className={styles.linkText}>
            <strong>{block.link}</strong>
            <span>{external ? block.href.replace(/^https:\/\/(www\.)?/, '') : 'DynamicLand'}</span>
          </span>
          <LegalIcon name="arrow" size={18} />
        </a>
      );
    }
    const initials = block.contact
      .split(' ')
      .map((word) => word[0])
      .join('');
    return (
      <div key={index} className={styles.contact}>
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <dl className={styles.contactDetails}>
          <div>
            <dt>Developer</dt>
            <dd>{block.contact}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${block.email}`}>{block.email}</a>
            </dd>
          </div>
        </dl>
        <a
          className={`button buttonPrimary ${styles.contactButton}`}
          href={`mailto:${block.email}?subject=${encodeURIComponent(subject)}`}
        >
          <LegalIcon name="mail" size={18} />
          Send an email
        </a>
      </div>
    );
  });
}

export function LegalPage({ doc }: { doc: LegalDocument }) {
  const effective = longDate(doc.effective);
  const minutes = readingMinutes(doc);
  const other = documents.find((candidate) => candidate.path !== doc.path)!;
  const subject = `DynamicLand ${doc.label}`;
  const sectionNumber = (id: string) => doc.sections.find((section) => section.id === id)!.number;

  return (
    <main id="main" className={styles.page}>
      <div className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <nav aria-label="Legal documents" className={styles.switch}>
              {documents.map((candidate) => (
                <a
                  key={candidate.path}
                  href={candidate.path}
                  aria-current={candidate.path === doc.path ? 'page' : undefined}
                >
                  {candidate.label}
                </a>
              ))}
            </nav>
            <h1>
              {doc.title} {doc.subtitle && <span className={styles.subtitle}>{doc.subtitle}</span>}
            </h1>
            <p className={styles.lead}>
              <Rich text={doc.lead} />
            </p>
            <ul className={styles.meta}>
              <li>
                <LegalIcon name="calendar" size={17} />
                <span>
                  Effective <time dateTime={doc.effective}>{effective}</time>
                </span>
              </li>
              <li>
                <LegalIcon name="sections" size={17} />
                {doc.sections.length} sections
              </li>
              <li>
                <LegalIcon name="clock" size={17} />
                {minutes} min read
              </li>
            </ul>
          </div>
          <div className={styles.cover} aria-hidden="true">
            <div className={styles.sheetBack} />
            <div className={styles.sheet}>
              <div className={styles.sheetBrand}>
                <Image src={product.logo} alt="" width={30} height={30} unoptimized />
                {product.name}
              </div>
              <p className={styles.sheetTitle}>{doc.label}</p>
              <div className={styles.sheetLines}>
                {Array.from({ length: 7 }, (_, line) => (
                  <span key={line} />
                ))}
              </div>
              <div className={styles.sheetFoot}>
                <span className={styles.seal}>
                  <LegalIcon name={doc.path === '/terms' ? 'agreement' : 'sell'} size={22} />
                </span>
                <span>
                  Effective
                  <strong>{effective}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className={`container ${styles.glance}`} aria-labelledby="at-a-glance">
        <div className={styles.glanceHead}>
          <h2 id="at-a-glance">At a glance</h2>
          <p>A quick summary. The full text below is what applies.</p>
        </div>
        <ul className={styles.glanceGrid}>
          {doc.highlights.map((highlight) => (
            <li key={highlight.title}>
              <a href={`#${highlight.section}`} className={styles.glanceCard}>
                <span className={styles.glanceIcon}>
                  <LegalIcon name={highlight.icon} size={22} />
                </span>
                <strong>{highlight.title}</strong>
                <span className={styles.glanceText}>{highlight.text}</span>
                <span className={styles.glanceLink}>
                  Section {sectionNumber(highlight.section)}
                  <LegalIcon name="arrow" size={16} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className={`container ${styles.layout}`}>
        <LegalContents
          sections={doc.sections.map(({ id, number, title }) => ({ id, number, title }))}
        />
        <article className={styles.article} aria-labelledby="document-title">
          <div className={styles.docHead}>
            <p id="document-title" className={styles.docTitle}>
              {doc.officialTitle}
            </p>
            <p>
              <strong>Effective Date:</strong> <time dateTime={doc.effective}>{effective}</time>
            </p>
          </div>
          {doc.preamble.length > 0 && (
            <div className={styles.preamble}>
              <Blocks blocks={doc.preamble} subject={subject} />
            </div>
          )}
          {doc.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={`${section.id}-title`}
            >
              <div className={styles.sectionHead}>
                <h2 id={`${section.id}-title`}>
                  <span className={styles.number}>
                    {section.number}
                    <span className="srOnly">.</span>
                  </span>{' '}
                  {section.title}
                </h2>
                <a
                  href={`#${section.id}`}
                  className={styles.anchor}
                  aria-label={`Link to section ${section.number}, ${section.title}`}
                >
                  <LegalIcon name="hash" size={16} />
                </a>
              </div>
              {section.body && <Blocks blocks={section.body} subject={subject} />}
              {section.subsections?.map((sub) => (
                <div key={sub.title} className={styles.subsection}>
                  <h3>
                    {sub.number && <span className={styles.subNumber}>{sub.number}</span>}{' '}
                    {sub.title}
                  </h3>
                  <Blocks blocks={sub.body} subject={subject} />
                </div>
              ))}
            </section>
          ))}
        </article>
      </div>

      <section className={styles.related} aria-labelledby="related-title">
        <div className="container">
          <h2 id="related-title">Questions about the details?</h2>
          <p className={styles.relatedLead}>
            Read the other document, find help, or write to the developer directly.
          </p>
          <ul className={styles.relatedGrid}>
            <li>
              <a href={other.path} className={styles.relatedCard}>
                <span className={styles.glanceIcon}>
                  <LegalIcon name={other.path === '/terms' ? 'agreement' : 'sell'} size={22} />
                </span>
                <strong>{other.label}</strong>
                <span>Effective {longDate(other.effective)}</span>
                <LegalIcon name="arrow" size={18} />
              </a>
            </li>
            <li>
              <a href="/support" className={styles.relatedCard}>
                <span className={styles.glanceIcon}>
                  <LegalIcon name="help" size={22} />
                </span>
                <strong>Support</strong>
                <span>Setup, permissions, and Pro purchases.</span>
                <LegalIcon name="arrow" size={18} />
              </a>
            </li>
            <li>
              <a
                href={`mailto:${product.supportEmail}?subject=${encodeURIComponent(subject)}`}
                className={styles.relatedCard}
              >
                <span className={styles.glanceIcon}>
                  <LegalIcon name="mail" size={22} />
                </span>
                <strong>Email the developer</strong>
                <span>{product.supportEmail}</span>
                <LegalIcon name="arrow" size={18} />
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
