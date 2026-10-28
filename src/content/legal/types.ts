/** Owner-supplied text, kept word for word. It may contain **bold**, [label](href) and line breaks. */
export type LegalText = string;

export type LegalBlock =
  | LegalText
  /** Items written “(a) …” render as a lettered list, and “**Label:** …” as a definition list. */
  | { list: LegalText[]; style?: 'checks' | 'grid' }
  | { link: string; href: string }
  | { contact: string; email: string };

export type LegalSubsection = { number?: string; title: string; body: LegalBlock[] };

export type LegalSection = {
  id: string;
  number: number;
  title: string;
  body?: LegalBlock[];
  subsections?: LegalSubsection[];
};

/** A plain-language pointer to a section. The section's own text is what applies. */
export type LegalHighlight = {
  icon: 'agreement' | 'renew' | 'device' | 'review' | 'account' | 'ads' | 'sell';
  title: string;
  text: string;
  section: string;
};

export type LegalDocument = {
  path: '/terms' | '/privacy';
  /** Name used by the switcher between the two documents. */
  label: string;
  title: string;
  /** Second line of the page heading. */
  subtitle?: string;
  lead: LegalText;
  officialTitle: string;
  /** Effective date, as YYYY-MM-DD. */
  effective: string;
  preamble: LegalBlock[];
  highlights: LegalHighlight[];
  sections: LegalSection[];
};
