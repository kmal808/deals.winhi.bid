import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BRAND } from '@/lib/brand'

/**
 * Shared letterhead for the estimate and contract.
 *
 * Renders the logo when `BRAND.logoSrc` is set and falls back to a typographic
 * wordmark otherwise, so a missing asset degrades instead of failing the render.
 */

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.orange,
  },
  logo: {
    width: 190,
    marginBottom: 4,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BRAND.black,
  },
  division: {
    fontSize: 7,
    color: BRAND.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tagline: {
    fontSize: 8,
    color: BRAND.orange,
    marginTop: 2,
  },
  contact: {
    fontSize: 8,
    color: BRAND.muted,
    marginTop: 4,
  },
  meta: {
    alignItems: 'flex-end',
  },
  metaLine: {
    fontSize: 9,
    color: BRAND.ink,
    marginBottom: 2,
  },
  metaLabel: {
    color: BRAND.muted,
  },
  license: {
    fontSize: 8,
    color: BRAND.muted,
    marginTop: 4,
  },
})

interface LetterheadProps {
  /** Right-hand block, e.g. contract number and date. */
  meta?: { label: string; value: string }[]
  /**
   * Overrides `BRAND.logoSrc`. The default is a URL, which resolves in the
   * browser where these documents are rendered; a server-side renderer needs an
   * absolute file path instead.
   */
  logoSrc?: string | null
}

export function Letterhead({ meta = [], logoSrc = BRAND.logoSrc }: LetterheadProps) {
  return (
    <View style={styles.header}>
      <View>
        {logoSrc ? (
          <Image src={logoSrc} style={styles.logo} />
        ) : (
          <>
            <Text style={styles.wordmark}>{BRAND.company.name}</Text>
            <Text style={styles.division}>{BRAND.company.division}</Text>
            <Text style={styles.tagline}>{BRAND.company.tagline}</Text>
          </>
        )}
        <Text style={styles.contact}>
          {BRAND.company.address} | {BRAND.company.phone} | {BRAND.company.email}
        </Text>
      </View>

      <View style={styles.meta}>
        {meta.map((m) => (
          <Text key={m.label} style={styles.metaLine}>
            <Text style={styles.metaLabel}>{m.label}: </Text>
            {m.value}
          </Text>
        ))}
        {/* The logo artwork already carries the licence number; only print it
            in the meta block when falling back to the text wordmark. */}
        {!logoSrc && <Text style={styles.license}>Lic# {BRAND.company.license}</Text>}
      </View>
    </View>
  )
}
