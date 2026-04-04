import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type AnbiReceiptData = {
  mosqueName: string;
  mosqueAddress: string;
  rsin: string;
  kvk: string | null;
  receiptNumber: string;
  donorName: string;
  donorAddress: string | null;
  year: number;
  fundBreakdown: { fundName: string; amount: number; count: number }[];
  totalAmount: number;
  issueDate: string;
  /** If the donor has an active periodic gift agreement, include the details */
  periodicGift?: {
    annualAmount: number; // cents
    startDate: string;
    endDate: string;
  };
};

/** Format cents as Dutch euro string, e.g. "€ 1.234,56" */
function formatEuro(cents: number): string {
  const euros = cents / 100;
  return (
    "\u20AC " +
    euros.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 60,
    color: "#000",
  },
  header: {
    marginBottom: 30,
  },
  mosqueName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 140,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderTopWidth: 1.5,
    borderTopColor: "#000",
    marginTop: 4,
  },
  colFund: {
    flex: 3,
  },
  colAmount: {
    flex: 2,
    textAlign: "right",
  },
  colCount: {
    flex: 1,
    textAlign: "right",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  statement: {
    marginTop: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
  },
  statementText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 60,
    right: 60,
  },
  footerText: {
    fontSize: 8,
    color: "#666",
  },
  footerDivider: {
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export function AnbiReceipt({ data }: { data: AnbiReceiptData }) {
  const totalCount = data.fundBreakdown.reduce((sum, f) => sum + f.count, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Text style={styles.mosqueName}>{data.mosqueName}</Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              Referentie: {data.receiptNumber}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Jaarlijkse Giftenverklaring</Text>

        {/* Organization section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gegevens instelling</Text>
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
          <Text style={styles.sectionTitle}>Gegevens donateur</Text>
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

        {/* Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Periode</Text>
          <View style={styles.row}>
            <Text style={styles.value}>
              1 januari {data.year} – 31 december {data.year}
            </Text>
          </View>
        </View>

        {/* Donation breakdown table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overzicht giften</Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colFund]}>Fonds</Text>
            <Text style={[styles.tableHeaderCell, styles.colCount]}>
              Aantal
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>
              Bedrag
            </Text>
          </View>

          {/* Table rows */}
          {data.fundBreakdown.map((fund, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colFund}>{fund.fundName}</Text>
              <Text style={styles.colCount}>{fund.count}</Text>
              <Text style={styles.colAmount}>{formatEuro(fund.amount)}</Text>
            </View>
          ))}

          {/* Total row */}
          <View style={styles.totalRow}>
            <Text style={[styles.colFund, styles.bold]}>Totaal</Text>
            <Text style={[styles.colCount, styles.bold]}>{totalCount}</Text>
            <Text style={[styles.colAmount, styles.bold]}>
              {formatEuro(data.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Gift type classification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soort gift</Text>
          {data.periodicGift ? (
            <>
              <Text style={styles.statementText}>
                Periodieke gift op basis van een schriftelijke overeenkomst als
                bedoeld in artikel 6.38 Wet inkomstenbelasting 2001.
              </Text>
              <View style={[styles.row, { marginTop: 4 }]}>
                <Text style={styles.label}>Jaarbedrag:</Text>
                <Text style={styles.value}>
                  {formatEuro(data.periodicGift.annualAmount)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Looptijd:</Text>
                <Text style={styles.value}>
                  {data.periodicGift.startDate} t/m {data.periodicGift.endDate}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.statementText}>
              Gewone gift (geen periodieke overeenkomst). Voor de
              belastingaangifte gelden de drempel- en maximumbedragen voor
              gewone giften.
            </Text>
          )}
        </View>

        {/* ANBI statement */}
        <View style={styles.statement}>
          <Text style={styles.statementText}>
            Het bestuur van {data.mosqueName} (RSIN: {data.rsin}) verklaart dat
            de instelling is aangemerkt als Algemeen Nut Beogende Instelling
            (ANBI) als bedoeld in artikel 5b van de Algemene wet inzake
            rijksbelastingen. De hierboven vermelde giften zijn ontvangen in de
            periode 1 januari {data.year} tot en met 31 december {data.year}.
          </Text>
          <Text style={[styles.statementText, { marginTop: 6 }]}>
            Contante giften zijn uitgesloten van deze verklaring conform de
            wettelijke vereisten voor aftrekbare giften.
          </Text>
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
  );
}
