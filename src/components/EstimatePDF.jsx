import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

function fmt(n) {
  if (!n || isNaN(n) || n === 0) return 'R 0';
  return 'R ' + Math.round(n).toLocaleString('en-ZA');
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a18', paddingTop: 36, paddingBottom: 52, paddingHorizontal: 40, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: '#1a1a18', borderBottomStyle: 'solid' },
  brand: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#1a1a18', letterSpacing: -0.5, marginBottom: 2 },
  brandSub: { fontSize: 7.5, color: '#999999' },
  refLabel: { fontSize: 7, color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, textAlign: 'right' },
  refNum: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1a1a18', textAlign: 'right' },
  dateText: { fontSize: 7.5, color: '#555555', marginTop: 3, textAlign: 'right' },
  infoRow: { flexDirection: 'row', marginBottom: 18 },
  infoBlock: { flex: 1, paddingRight: 12 },
  infoLabel: { fontSize: 7, color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 9, color: '#1a1a18' },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1a1a18', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e5e5e3', borderBottomStyle: 'solid' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: '#e5e5e3', borderBottomStyle: 'solid' },
  rowLabel: { fontSize: 8.5, color: '#555555', flex: 1 },
  rowLabelBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1a1a18', flex: 1 },
  rowVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1a1a18', textAlign: 'right' },
  rowUplift: { fontSize: 8.5, color: '#555555', textAlign: 'right' },
  rowMeta: { fontSize: 8, color: '#999999', textAlign: 'right', marginRight: 10 },
  divLine: { borderTopWidth: 1.5, borderTopColor: '#1a1a18', borderTopStyle: 'solid', marginVertical: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#f9f9f7', borderRadius: 4, marginTop: 5 },
  totalLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1a1a18' },
  totalVal: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#1a1a18' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, backgroundColor: '#1a1a18', borderRadius: 6, marginBottom: 14 },
  grandLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  grandVal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  disclaimer: { marginTop: 14, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#e5e5e3', borderTopStyle: 'solid' },
  disclaimerTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  disclaimerText: { fontSize: 7, color: '#999999', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#bbbbbb' },
  paramGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  paramHalf: { width: '50%', paddingRight: 8 },
});

export function EstimatePDF({ inputs, result, profile, reference, numCats, isRenovation }) {
  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  const base = result.weightedBaseRate;

  const multiplierRows = [
    { label: 'Quality \u2014 ' + inputs.qualityKey, uplift: base * (result.qualityMultiplier - 1) },
    { label: 'Site \u2014 ' + inputs.siteAccessKey.replace(' Setting', ''), uplift: base * result.qualityMultiplier * (result.siteMultiplier - 1) },
    { label: 'Complexity \u2014 ' + inputs.complexityKey.replace(' Complexity', ''), uplift: base * result.qualityMultiplier * result.siteMultiplier * (result.complexityMultiplier - 1) },
    inputs.projectTypeKey === 'Addition' ? { label: 'Addition factor (x1.15)', uplift: base * result.qualityMultiplier * result.siteMultiplier * result.complexityMultiplier * (result.projectTypeMultiplier - 1) } : null,
  ].filter(Boolean);

  const financialRows = [
    { label: 'Construction cost', value: result.constructionCost },
    result.landProcurementCost > 0 ? { label: 'Land cost', value: result.landProcurementCost } : null,
    { label: 'Contingency (' + Math.round(inputs.contingencyPct * 100) + '%)', value: result.contingencyAmount },
    { label: 'Contractor profit (' + Math.round(inputs.profitPct * 100) + '%)', value: result.contractorProfit },
    { label: 'Preliminaries (' + Math.round(inputs.preliminariesPct * 100) + '%)', value: result.preliminaries },
    { label: 'Professional fees (' + Math.round(inputs.feesPct * 100) + '%)', value: result.professionalFees },
    { label: 'VAT (' + Math.round(inputs.vatPct * 100) + '%)', value: result.vatAmount },
  ].filter(Boolean);

  return (
    <Document title={'AprIQ Estimate ' + reference} author="AprIQ" creator="AprIQ">
      <Page size="A4" style={s.page}>

        <View style={s.header}>
          <View>
            <Text style={s.brand}>AprIQ</Text>
            <Text style={s.brandSub}>Construction Cost Intelligence</Text>
            {profile?.company_name ? <Text style={[s.brandSub, { marginTop: 5, color: '#555555' }]}>{profile.company_name}</Text> : null}
          </View>
          <View>
            <Text style={s.refLabel}>Reference</Text>
            <Text style={s.refNum}>{reference}</Text>
            <Text style={s.dateText}>{today}</Text>
          </View>
        </View>

        <View style={s.infoRow}>
          {inputs.clientName ? <View style={s.infoBlock}><Text style={s.infoLabel}>Client</Text><Text style={s.infoValue}>{inputs.clientName}</Text></View> : null}
          {inputs.projectName ? <View style={s.infoBlock}><Text style={s.infoLabel}>Project</Text><Text style={s.infoValue}>{inputs.projectName}</Text></View> : null}
          <View style={s.infoBlock}><Text style={s.infoLabel}>Prepared by</Text><Text style={s.infoValue}>{profile?.full_name || 'AprIQ User'}</Text></View>
          <View style={s.infoBlock}><Text style={s.infoLabel}>Report type</Text><Text style={s.infoValue}>ROM Cost Estimate</Text></View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Project Parameters</Text>
          <View style={s.paramGrid}>
            {numCats === 1 ? (
              <>
                <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Building type</Text><Text style={s.rowVal}>{inputs.use1Subtype}</Text></View></View>
                <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Category</Text><Text style={s.rowVal}>{inputs.use1Category}</Text></View></View>
              </>
            ) : [
              { sub: inputs.use1Subtype, cat: inputs.use1Category, alloc: inputs.use1Allocation },
              numCats >= 2 ? { sub: inputs.use2Subtype, cat: inputs.use2Category, alloc: inputs.use2Allocation } : null,
              numCats >= 3 ? { sub: inputs.use3Subtype, cat: inputs.use3Category, alloc: inputs.use3Allocation } : null,
            ].filter(Boolean).map((u, i) => (
              <View key={i} style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Use {i + 1} \u2014 {u.sub}</Text><Text style={s.rowVal}>{Math.round(u.alloc * 100)}%</Text></View></View>
            ))}
            <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Project type</Text><Text style={s.rowVal}>{inputs.projectTypeKey}</Text></View></View>
            <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Floor area</Text><Text style={s.rowVal}>{inputs.floorArea} m2</Text></View></View>
            {isRenovation && inputs.renovationArea > 0 ? <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Renovation area</Text><Text style={s.rowVal}>{inputs.renovationArea} m2</Text></View></View> : null}
            <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Quality</Text><Text style={s.rowVal}>{inputs.qualityKey}</Text></View></View>
            <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Site access</Text><Text style={s.rowVal}>{inputs.siteAccessKey.replace(' Setting', '')}</Text></View></View>
            <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Complexity</Text><Text style={s.rowVal}>{inputs.complexityKey.replace(' Complexity', '')}</Text></View></View>
            {inputs.landProcurementType !== 'N/A' ? (
              <>
                <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Land type</Text><Text style={s.rowVal}>{inputs.landProcurementType}</Text></View></View>
                <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Land area</Text><Text style={s.rowVal}>{inputs.landArea} m2</Text></View></View>
                <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Slope</Text><Text style={s.rowVal}>{inputs.landSlopeKey.replace(' Land', '')}</Text></View></View>
              </>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Rate Summary</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>
              {numCats === 1
                ? 'Base rate (' + inputs.use1Subtype + ')' + (inputs.rate1Adjustment !== 0 ? ' \u2014 ' + (inputs.rate1Adjustment > 0 ? '+' : '') + inputs.rate1Adjustment + '% adjusted' : '')
                : 'Weighted base rate'}
            </Text>
            <Text style={s.rowVal}>{fmt(result.weightedBaseRate)} /m2</Text>
          </View>
          {multiplierRows.map(r => (
            <View key={r.label} style={s.row}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowUplift}>{r.uplift > 0 ? '+ ' : r.uplift < 0 ? '- ' : '  '}{fmt(Math.abs(r.uplift))} /m2</Text>
            </View>
          ))}
          <View style={s.divLine} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{isRenovation ? 'Construction rate \u2014 new work' : 'Total adjusted base rate'}</Text>
            <Text style={s.totalVal}>{fmt(result.totalAdjustedBaseRate)} /m2</Text>
          </View>
          {isRenovation && result.renovArea > 0 ? (
            <>
              <View style={[s.row, { marginTop: 5 }]}>
                <Text style={s.rowLabel}>Renovation \u2014 {inputs.renovationComplexityKey} (x{result.renovationMultiplier})</Text>
                <Text style={s.rowUplift}>+ {fmt(result.totalAdjustedBaseRate * (result.renovationMultiplier - 1))} /m2</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Construction rate \u2014 renovation</Text>
                <Text style={s.totalVal}>{fmt(result.totalAdjustedBaseRate * result.renovationMultiplier)} /m2</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Element Breakdown</Text>
          {result.elementBreakdown.map(el => (
            <View key={el.key} style={s.row}>
              <Text style={s.rowLabel}>{el.label}</Text>
              <Text style={s.rowMeta}>{(el.effectivePct * 100).toFixed(1)}%</Text>
              <Text style={s.rowVal}>{fmt(el.amount)}</Text>
            </View>
          ))}
          {isRenovation ? (
            <>
              {result.newArea > 0 ? <View style={s.row}><Text style={s.rowLabelBold}>Construction cost \u2014 New ({result.newArea} m2)</Text><Text style={s.rowVal}>{fmt(result.baseConstructionCostNew)}</Text></View> : null}
              {result.renovArea > 0 ? <View style={s.row}><Text style={s.rowLabelBold}>Construction cost \u2014 Renovation ({result.renovArea} m2)</Text><Text style={s.rowVal}>{fmt(result.baseConstructionCostRenovation)}</Text></View> : null}
            </>
          ) : null}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Construction cost ({result.newArea} m2)</Text>
            <Text style={s.totalVal}>{fmt(result.constructionCost)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Financial Stack</Text>
          {financialRows.map(r => (
            <View key={r.label} style={s.row}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowVal}>{fmt(r.value)}</Text>
            </View>
          ))}
        </View>

        <View style={s.grandTotal}>
          <Text style={s.grandLabel}>Total Project Cost</Text>
          <Text style={s.grandVal}>{fmt(result.totalProjectCost)}</Text>
        </View>

        {inputs.includeEscalation && result.escalationYears && result.escalationYears.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Escalation at {inputs.escalationRate}% p.a.</Text>
            {result.escalationYears.map(y => (
              <View key={y.year} style={s.row}>
                <Text style={s.rowLabel}>{y.label}</Text>
                <Text style={s.rowVal}>{fmt(y.total)}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Escalated project cost</Text>
              <Text style={s.totalVal}>{fmt(result.escalatedTotal)}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.disclaimer}>
          <Text style={s.disclaimerTitle}>ROM Disclaimer</Text>
          <Text style={s.disclaimerText}>
            This estimate is a Rough Order of Magnitude (ROM) for early-stage planning and feasibility only. Figures are based on average market rates calibrated against the AECOM Africa Construction Cost Guide and are subject to variation depending on site conditions, specification, contractor rates, and market fluctuations at time of tender. This does not constitute a formal quantity survey, bill of quantities, or professional cost advice. AprIQ (Pty) Ltd accepts no liability for decisions made on the basis of this estimate. A registered professional quantity surveyor should be appointed for detailed cost planning and contract documentation.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{reference} \u00b7 {today}</Text>
          <Text style={s.footerText}>Report generated by AprIQ \u2014 apriq.co.za</Text>
        </View>

      </Page>
    </Document>
  );
}
