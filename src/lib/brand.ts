/**
 * Windows Hawaii brand palette and identity, in one place.
 *
 * Sampled from the logo: a black wordmark over a Diamond Head silhouette that
 * runs orange to deep red-orange, with a plumeria in a lighter amber.
 */
export const BRAND = {
  /** Primary orange, sampled from the Diamond Head silhouette in `public/logo.png`. */
  orange: '#E14A28',
  /** Lighter amber, from the plumeria; for fills and secondary accents. */
  amber: '#F59A3C',
  /** Deeper red-orange for emphasis on light fills. */
  orangeDark: '#C03A1C',
  /** The wordmark black. */
  black: '#111111',

  /** Neutral body text and hairlines. */
  ink: '#374151',
  muted: '#6b7280',
  hairline: '#e5e7eb',
  tint: '#fdf2e9',

  company: {
    name: 'Windows Hawaii',
    division: 'A Division of Northwest Exteriors',
    tagline: "The one and only Ali'i Extreme Windows",
    license: 'C-30910',
    address: '123 Aloha Street, Honolulu, HI 96801',
    phone: '(808) 555-1234',
    email: 'info@windowshawaii.com',
  },

  /**
   * Where the PDF renderer loads the logo from.
   *
   * In the browser — where these documents are generated today — this is a URL
   * served from `public/`. A server-side renderer resolves it against the
   * filesystem instead, so `PDF_LOGO_PATH` can point at an absolute path there.
   * Set to null to fall back to the text wordmark: @react-pdf has no error
   * boundary for a missing image, and a broken path fails the whole document.
   */
  logoSrc: ((typeof process !== 'undefined' && process.env?.PDF_LOGO_PATH) ||
    '/logo.png') as string | null,
} as const
