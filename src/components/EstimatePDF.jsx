import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

function fmt(n) {
  if (!n || isNaN(n) || n === 0) return 'R 0';
  return 'R ' + Math.round(n).toLocaleString('en-ZA');
}

function fmtX(n) {
  const v = Number(n);
  if (!v || isNaN(v)) return '(x 1.00)';
  return `(x ${v.toFixed(2)})`;
}

function fmtRate(n) {
  const v = Number(n);
  if (!v || isNaN(v) || v === 0) return 'R0.00';
  return 'R' + v.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#111111', paddingTop: 36, paddingBottom: 52, paddingHorizontal: 40, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: '#111111', borderBottomStyle: 'solid' },
  logoImg: { width: 120, height: 52, objectFit: 'contain', backgroundColor: 'transparent' },
  brandText: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111111', marginBottom: 2 },
  brandSub: { fontSize: 7.5, color: '#979899' },
  brandUrl: { fontSize: 7.5, color: '#185fa5' },
  rightCol: { alignItems: 'flex-end' },
  refLabel: { fontSize: 7, color: '#979899', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  refNum: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111111' },
  dateText: { fontSize: 7.5, color: '#979899', marginTop: 3 },
  infoRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 7, color: '#979899', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 8.5, color: '#111111' },
  infoValueSub: { fontSize: 7.5, color: '#979899', marginTop: 1 },
  dividerInfo: { borderTopWidth: 0.5, borderTopColor: '#E4E5E5', borderTopStyle: 'solid', marginBottom: 14 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111111', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#E4E5E5', borderBottomStyle: 'solid' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#E4E5E5', borderBottomStyle: 'solid' },
  rowLabel: { fontSize: 8.5, color: '#979899', flex: 1 },
  rowLabelBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#111111', flex: 1 },
  rowVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#111111', textAlign: 'right' },
  rowUplift: { fontSize: 8.5, color: '#979899', textAlign: 'right' },
  rowMeta: { fontSize: 8, color: '#979899', textAlign: 'right', width: 40, marginRight: 10 },
  divLine: { borderTopWidth: 1, borderTopColor: '#1a1a18', borderTopStyle: 'solid', marginVertical: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#FAFAFA', borderRadius: 3, marginTop: 4 },
  totalLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#111111' },
  totalVal: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#111111' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#111111', borderRadius: 5, marginBottom: 12 },
  grandLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#F9FAFA' },
  grandVal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#F9FAFA' },
  advisorBox: { padding: 10, backgroundColor: '#F9FAFA', borderWidth: 0.5, borderColor: '#FF8210', borderStyle: 'solid', borderRadius: 5 },
  advisorText: { fontSize: 8.5, color: '#111111', lineHeight: 1.5 },
  paramGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  paramHalf: { width: '50%', paddingRight: 8 },
  disclaimer: { marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#E4E5E5', borderTopStyle: 'solid' },
  disclaimerTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#979899', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  disclaimerText: { fontSize: 6.5, color: '#979899', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: '#cccccc' },
});

export function EstimatePDF({ inputs, result, userDetails, project, client, reference, numCats, isRenovation, advisorSummary }) {
  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  const base = result?.weightedBaseRate || 0;

  const multiplierRows = [
    { label: 'Quality \u2014 ' + (inputs.qualityKey || ''), uplift: base * ((result?.qualityMultiplier || 1) - 1) },
    { label: 'Site \u2014 ' + (inputs.siteAccessKey || '').replace(' Setting', ''), uplift: base * (result?.qualityMultiplier || 1) * ((result?.siteMultiplier || 1) - 1) },
    { label: 'Complexity \u2014 ' + (inputs.complexityKey || '').replace(' Complexity', ''), uplift: base * (result?.qualityMultiplier || 1) * (result?.siteMultiplier || 1) * ((result?.complexityMultiplier || 1) - 1) },
    inputs.projectTypeKey === 'Addition' ? { label: 'Addition factor (x1.15)', uplift: base * (result?.qualityMultiplier || 1) * (result?.siteMultiplier || 1) * (result?.complexityMultiplier || 1) * ((result?.projectTypeMultiplier || 1) - 1) } : null,
  ].filter(Boolean);

  const landRate = result?.landProcurementRatePerM2 || 0;
  const landAllowancePct = (result?.landDevelopmentMultiplier || 0) * 100;
  const landSlopeMult = result?.earthworksMultiplier || 1;
  const financialRows = [
    { label: 'Construction cost', value: result?.constructionCost },
    { label: `Contingency (${Math.round((inputs.contingencyPct || 0) * 100)}%)`, value: result?.contingencyAmount },
    { label: `Contractor profit (${Math.round((inputs.profitPct || 0) * 100)}%)`, value: result?.contractorProfit },
    { label: `Preliminaries (${Math.round((inputs.preliminariesPct || 0) * 100)}%)`, value: result?.preliminaries },
    { label: `Professional fees (${Math.round((inputs.feesPct || 0) * 100)}%)`, value: result?.professionalFees },
    { label: `VAT (${Math.round((inputs.vatPct || 0) * 100)}%)`, value: result?.vatAmount },
    (inputs.landProcurementType && inputs.landProcurementType !== 'N/A') ? { label: `Land procurement rate`, value: null, meta: `${fmtRate(landRate)}/m²` } : null,
    (inputs.landProcurementType && inputs.landProcurementType !== 'N/A') ? { label: `Land development allowance`, value: null, meta: `${Math.round(landAllowancePct)}%` } : null,
    (inputs.landProcurementType && inputs.landProcurementType !== 'N/A') ? { label: `Land type / slope`, value: null, meta: fmtX(landSlopeMult) } : null,
    result?.landProcurementCost > 0 ? { label: 'Land procurement cost', value: result?.landProcurementCost } : null,
    result?.landDevelopmentCost > 0 ? { label: 'Land development allowance amount', value: result?.landDevelopmentCost } : null,
    (result?.totalLandCost ?? 0) > 0 ? { label: 'Total land cost', value: result?.totalLandCost } : null,
  ].filter(Boolean);

  const uses = [
    inputs.use1Category && inputs.use1Subtype ? { label: `Use 1: ${inputs.use1Category} \u2014 ${inputs.use1Subtype}`, alloc: inputs.use1Allocation, rate: result?.rate1 } : null,
    numCats >= 2 && inputs.use2Category && inputs.use2Subtype ? { label: `Use 2: ${inputs.use2Category} \u2014 ${inputs.use2Subtype}`, alloc: inputs.use2Allocation, rate: result?.rate2 } : null,
    numCats >= 3 && inputs.use3Category && inputs.use3Subtype ? { label: `Use 3: ${inputs.use3Category} \u2014 ${inputs.use3Subtype}`, alloc: inputs.use3Allocation, rate: result?.rate3 } : null,
  ].filter(Boolean);

  const hasUserInfo = true;
  const hasClientInfo = client && (client.company_name || client.contact_name);
  const hasProjectInfo = project && (project.project_name || project.reference_number);

  return (
    <Document title={'AprIQ Estimate \u2014 ' + reference} author="AprIQ" creator="AprIQ">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header} wrap={false}>
          <View>
            {userDetails?.logo_url
              ? <Image src={userDetails.logo_url} style={s.logoImg} />
              : <Image src="/logo-transparent.png" style={{ width: 120, height: 52, objectFit: 'contain' }} />
            }
          </View>
          <View style={s.rightCol}>
            <Text style={s.refLabel}>Reference</Text>
            <Text style={s.refNum}>{reference}</Text>
            <Text style={s.dateText}>{today}</Text>
            <Text style={s.dateText}>ROM Cost Estimate</Text>
          </View>
        </View>

        {/* Info block: user + client/project */}
        {(hasUserInfo || hasClientInfo || hasProjectInfo) && (
          <View style={s.infoRow} wrap={false}>
            {hasUserInfo && (
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>Prepared by</Text>
                {userDetails.full_name && <Text style={s.infoValue}>{userDetails.full_name}</Text>}
                {userDetails.company_name && <Text style={s.infoValueSub}>{userDetails.company_name}</Text>}
                {userDetails.email && <Text style={s.infoValueSub}>{userDetails.email}</Text>}
                {userDetails.phone && <Text style={s.infoValueSub}>{userDetails.phone}</Text>}
              </View>
            )}
            {(hasClientInfo || hasProjectInfo) && (
              <View style={s.infoBlock}>
                {hasProjectInfo && <>
                  <Text style={s.infoLabel}>Project</Text>
                  {project.project_name && <Text style={s.infoValue}>{project.project_name}</Text>}
                  {project.reference_number && <Text style={s.infoValueSub}>Ref: {project.reference_number}</Text>}
                  {project.address && <Text style={s.infoValueSub}>{project.address}</Text>}
                  {project.description && <Text style={s.infoValueSub}>{project.description}</Text>}
                </>}
                {hasClientInfo && <>
                  <Text style={[s.infoLabel, { marginTop: hasProjectInfo ? 6 : 0 }]}>Client</Text>
                  {client.company_name && <Text style={s.infoValue}>{client.company_name}</Text>}
                  {client.contact_name && <Text style={s.infoValueSub}>{client.contact_name}</Text>}
                  {client.email && <Text style={s.infoValueSub}>{client.email}</Text>}
                  {client.address && <Text style={s.infoValueSub}>{client.address}</Text>}
                </>}
              </View>
            )}
          </View>
        )}

        {(hasUserInfo || hasClientInfo || hasProjectInfo) && <View style={s.dividerInfo} />}

        {/* Parameters */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Project Parameters</Text>
          <View style={s.paramGrid}>
            {uses.map((u, i) => (
              <View key={i} style={s.paramHalf}>
                <View style={s.row}>
                  <Text style={s.rowLabel}>{u.label}</Text>
                  {numCats > 1 && <Text style={s.rowVal}>{Math.round(u.alloc * 100)}%</Text>}
                </View>
              </View>
            ))}
            {inputs.projectTypeKey && (
              <View style={s.paramHalf}>
                <View style={s.row}>
                  <Text style={s.rowLabel}>Project type</Text>
                  <Text style={s.rowVal}>{inputs.projectTypeKey} {fmtX(result?.projectTypeMultiplier || 1)}</Text>
                </View>
              </View>
            )}
            {inputs.floorArea > 0 && <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Floor area</Text><Text style={s.rowVal}>{inputs.floorArea} m²</Text></View></View>}
            {isRenovation && inputs.renovationArea > 0 && <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Renovation area</Text><Text style={s.rowVal}>{inputs.renovationArea} m²</Text></View></View>}
            {inputs.qualityKey && <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Quality</Text><Text style={s.rowVal}>{inputs.qualityKey}</Text></View></View>}
            {inputs.siteAccessKey && (
              <View style={s.paramHalf}>
                <View style={s.row}>
                  <Text style={s.rowLabel}>Site access</Text>
                  <Text style={s.rowVal}>{inputs.siteAccessKey.replace(' Setting', '')} {fmtX(result?.siteMultiplier || 1)}</Text>
                </View>
              </View>
            )}
            {inputs.complexityKey && (
              <View style={s.paramHalf}>
                <View style={s.row}>
                  <Text style={s.rowLabel}>Complexity</Text>
                  <Text style={s.rowVal}>{inputs.complexityKey.replace(' Complexity', '')} {fmtX(result?.complexityMultiplier || 1)}</Text>
                </View>
              </View>
            )}
            {inputs.landProcurementType && inputs.landProcurementType !== 'N/A' && <>
              <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Land type</Text><Text style={s.rowVal}>{inputs.landProcurementType}</Text></View></View>
              {inputs.landArea > 0 && <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Land area</Text><Text style={s.rowVal}>{inputs.landArea} m²</Text></View></View>}
              {inputs.landSlopeKey && <View style={s.paramHalf}><View style={s.row}><Text style={s.rowLabel}>Land type / slope</Text><Text style={s.rowVal}>{fmtX(result?.earthworksMultiplier || 1)}</Text></View></View>}
            </>}
          </View>
        </View>

        {/* Rate summary */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Rate Summary</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>{numCats === 1 ? `Base rate (${inputs.use1Subtype || ''})${inputs.rate1Adjustment ? ' \u2014 ' + (inputs.rate1Adjustment > 0 ? '+' : '') + inputs.rate1Adjustment + '% adjusted' : ''}` : 'Weighted base rate'}</Text>
            <Text style={s.rowVal}>{fmt(result?.weightedBaseRate)} /m²</Text>
          </View>
          {multiplierRows.map(r => (
            <View key={r.label} style={s.row}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowUplift}>{r.uplift > 0 ? '+ ' : r.uplift < 0 ? '\u2212 ' : '  '}{fmt(Math.abs(r.uplift))} /m²</Text>
            </View>
          ))}
          <View style={s.divLine} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{isRenovation ? 'Construction rate — new work' : 'Total adjusted base rate'}</Text>
            <Text style={s.totalVal}>{fmt(result?.totalAdjustedBaseRate)} /m²</Text>
          </View>
          {isRenovation && result?.renovArea > 0 && <>
            <View style={[s.row, { marginTop: 4 }]}>
              <Text style={s.rowLabel}>{'Renovation — ' + (inputs.renovationComplexityKey||'') + ' (x' + (result?.renovationMultiplier||'') + ')'}</Text>
              <Text style={s.rowUplift}>+ {fmt((result?.totalAdjustedBaseRate || 0) * ((result?.renovationMultiplier || 1) - 1))} /m²</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Construction rate — renovation</Text>
              <Text style={s.totalVal}>{fmt((result?.totalAdjustedBaseRate || 0) * (result?.renovationMultiplier || 1))} /m²</Text>
            </View>
          </>}
        </View>

        {/* Element breakdown */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Element Breakdown</Text>
          {(result?.elementBreakdown || []).map(el => (
            <View key={el.key} style={s.row}>
              <Text style={s.rowLabel}>{el.label}</Text>
              <Text style={s.rowMeta}>{(el.effectivePct * 100).toFixed(1)}%</Text>
              <Text style={s.rowVal}>{fmt(el.amount)}</Text>
            </View>
          ))}
          {isRenovation ? <>
            {result?.newArea > 0 && <View style={s.row}><Text style={s.rowLabelBold}>Construction cost \u2014 New ({result?.newArea} m²)</Text><Text style={s.rowVal}>{fmt(result?.baseConstructionCostNew)}</Text></View>}
            {result?.renovArea > 0 && <View style={s.row}><Text style={s.rowLabelBold}>Construction cost \u2014 Renovation ({result?.renovArea} m²)</Text><Text style={s.rowVal}>{fmt(result?.baseConstructionCostRenovation)}</Text></View>}
          </> : null}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Construction cost ({result?.newArea} m²)</Text>
            <Text style={s.totalVal}>{fmt(result?.constructionCost)}</Text>
          </View>
        </View>

        {/* Financial stack */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Financial Stack</Text>
          {financialRows.map((r) => (
            <View key={r.label} style={s.row}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowVal}>{r.meta ? r.meta : fmt(r.value)}</Text>
            </View>
          ))}
        </View>

        {/* Grand total */}
        <View style={s.grandTotal} wrap={false}>
          <Text style={s.grandLabel}>Total Project Cost</Text>
          <Text style={s.grandVal}>{fmt(result?.totalProjectCost)}</Text>
        </View>

        {advisorSummary && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>AprIQ Advisor Summary</Text>
            <View style={s.advisorBox}>
              <Text style={s.advisorText}>{advisorSummary}</Text>
            </View>
          </View>
        )}

        {/* Escalation */}
        {inputs.includeEscalation && result?.escalationYears?.length > 0 && (
          <View style={s.section} wrap={false}>
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
        )}

        {/* Disclaimer */}
        <View style={s.disclaimer} wrap={false}>
          <Text style={s.disclaimerTitle}>ROM Disclaimer</Text>
          <Text style={s.disclaimerText}>
            This estimate is a Rough Order of Magnitude (ROM) for early-stage planning and feasibility purposes only. Figures are based on average market rates from AprIQ's internal cost database and are subject to variation depending on site conditions, specification, contractor pricing, and market conditions at time of tender. This does not constitute a formal quantity survey, bill of quantities, or professional cost advice. AprIQ accepts no liability for decisions made on the basis of this estimate. A registered professional quantity surveyor should be appointed for detailed cost planning.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{reference} \u00b7 {today}</Text>
          <Text style={s.footerText}>Report generated by AprIQ \u2014 apriq.co.za</Text>
        </View>

      </Page>
    </Document>
  );
}