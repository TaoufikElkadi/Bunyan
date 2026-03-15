import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

export type PeriodicGiftData = {
  mosqueName: string
  mosqueAddress: string
  rsin: string
  kvk: string | null
  donorName: string
  donorAddress: string | null
  annualAmount: number // cents
  fundName: string | null
  startDate: string // formatted date string
  endDate: string
  issueDate: string
  // Optional e-signature fields
  donorSignatureDataUrl?: string
  donorSignedAt?: string
  boardSignatureDataUrl?: string
  boardSignedAt?: string
  boardSignerName?: string
}

function formatEuro(cents: number): string {
  const euros = cents / 100
  return (
    '\u20AC ' +
    euros.toLocaleString('nl-NL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 60,
    color: '#000',
  },
  header: {
    marginBottom: 24,
  },
  mosqueName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 24,
    color: '#444',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 160,
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    flex: 1,
  },
  article: {
    marginBottom: 10,
    paddingLeft: 16,
  },
  articleTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    marginLeft: -16,
  },
  articleText: {
    lineHeight: 1.5,
    fontSize: 9.5,
  },
  signatureArea: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginTop: 40,
    marginBottom: 4,
  },
  signatureHint: {
    fontSize: 8,
    color: '#666',
  },
  signatureImage: {
    width: 150,
    height: 50,
    objectFit: 'contain' as const,
    marginTop: 8,
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 8,
    color: '#444',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    right: 60,
  },
  footerDivider: {
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#666',
  },
})

export function PeriodicGiftAgreement({ data }: { data: PeriodicGiftData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.mosqueName}>{data.mosqueName}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Overeenkomst Periodieke Gift in Geld
        </Text>
        <Text style={styles.subtitle}>
          Als bedoeld in artikel 6.38 Wet inkomstenbelasting 2001
        </Text>

        {/* Organization section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>De instelling</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Naam:</Text>
            <Text style={styles.value}>{data.mosqueName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>RSIN:</Text>
            <Text style={styles.value}>{data.rsin}</Text>
          </View>
          {data.kvk && (
            <View style={styles.row}>
              <Text style={styles.label}>KVK:</Text>
              <Text style={styles.value}>{data.kvk}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Adres:</Text>
            <Text style={styles.value}>{data.mosqueAddress}</Text>
          </View>
        </View>

        {/* Donor section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>De schenker</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Naam:</Text>
            <Text style={styles.value}>{data.donorName}</Text>
          </View>
          {data.donorAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>Adres:</Text>
              <Text style={styles.value}>{data.donorAddress}</Text>
            </View>
          )}
        </View>

        {/* Agreement articles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Komen het volgende overeen</Text>

          <View style={styles.article}>
            <Text style={styles.articleTitle}>Artikel 1 — Periodieke gift</Text>
            <Text style={styles.articleText}>
              De schenker verbindt zich gedurende een tijdvak van ten minste vijf
              jaren jaarlijks een bedrag van {formatEuro(data.annualAmount)} te
              schenken aan de instelling
              {data.fundName ? `, ten behoeve van het fonds "${data.fundName}"` : ''}.
            </Text>
          </View>

          <View style={styles.article}>
            <Text style={styles.articleTitle}>Artikel 2 — Looptijd</Text>
            <Text style={styles.articleText}>
              Deze overeenkomst gaat in op {data.startDate} en eindigt op{' '}
              {data.endDate}. De looptijd bedraagt ten minste vijf jaren.
            </Text>
          </View>

          <View style={styles.article}>
            <Text style={styles.articleTitle}>Artikel 3 — Betaling</Text>
            <Text style={styles.articleText}>
              De schenker betaalt het jaarlijkse bedrag via bank- of
              giro-overschrijving. Contante betalingen zijn uitgesloten.
            </Text>
          </View>

          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              Artikel 4 — Beeindiging
            </Text>
            <Text style={styles.articleText}>
              De verplichting tot het doen van de periodieke uitkeringen eindigt:{'\n'}
              a. bij overlijden van de schenker;{'\n'}
              b. bij faillissement van de schenker;{'\n'}
              c. bij een aanzienlijke daling van het inkomen van de schenker
              waardoor het niet langer redelijk is de verplichting voort te zetten;{'\n'}
              d. aan het einde van de overeengekomen looptijd.
            </Text>
          </View>

          <View style={styles.article}>
            <Text style={styles.articleTitle}>Artikel 5 — ANBI-status</Text>
            <Text style={styles.articleText}>
              De instelling verklaart dat zij door de Belastingdienst is aangemerkt
              als Algemeen Nut Beogende Instelling (ANBI) als bedoeld in artikel
              5b van de Algemene wet inzake rijksbelastingen (RSIN: {data.rsin}).
            </Text>
          </View>
        </View>

        {/* Signature area */}
        <View style={styles.signatureArea}>
          {/* Donor signature */}
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>De schenker</Text>
            {data.donorSignatureDataUrl ? (
              <>
                <Image src={data.donorSignatureDataUrl} style={styles.signatureImage} />
                <Text style={styles.signatureHint}>{data.donorName}</Text>
                {data.donorSignedAt && (
                  <Text style={styles.signatureDate}>Ondertekend: {data.donorSignedAt}</Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureHint}>Naam en handtekening</Text>
                <View style={[styles.signatureLine, { marginTop: 20 }]} />
                <Text style={styles.signatureHint}>Datum</Text>
              </>
            )}
          </View>

          {/* Board signature */}
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>De instelling</Text>
            {data.boardSignatureDataUrl ? (
              <>
                <Image src={data.boardSignatureDataUrl} style={styles.signatureImage} />
                <Text style={styles.signatureHint}>
                  {data.boardSignerName ?? data.mosqueName}
                </Text>
                {data.boardSignedAt && (
                  <Text style={styles.signatureDate}>Ondertekend: {data.boardSignedAt}</Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureHint}>Naam en handtekening</Text>
                <View style={[styles.signatureLine, { marginTop: 20 }]} />
                <Text style={styles.signatureHint}>Datum</Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider}>
            <Text style={styles.footerText}>
              Datum uitgifte: {data.issueDate}
            </Text>
            <Text style={styles.footerText}>Gegenereerd door Bunyan</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
