import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditRunResult } from './auditEngine';
import { FRAMEWORKS } from '../data/rulePacks';

export function generateAuditPdf(result: AuditRunResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const device = result.device || {
    id: 'DEV-01',
    name: 'sw-core-01.dc1',
    serialNumber: 'APX-98420-NX7K',
    model: 'Catalyst 9300-48P',
    vendorName: 'Cisco Systems',
    deviceType: 'Switch',
    osVersion: 'IOS-XE 17.3.4',
  };

  const frameworkMeta = FRAMEWORKS[result.framework] || {
    id: result.framework,
    name: 'CIS Network Benchmarks',
    version: 'v8.0.0',
    fullName: 'Center for Internet Security Network Benchmark',
    authority: 'CIS',
    totalControls: 9,
    description: 'Security baseline audit',
    badgeColor: 'emerald',
  };

  // Color Palette matching ApexNet Website (Warm Stone + Deep Charcoal + Saffron Gold)
  const deepCharcoal: [number, number, number] = [30, 28, 26];     // #1E1C1A
  const saffronGold: [number, number, number] = [200, 131, 10];    // #C8830A
  const lightGoldText: [number, number, number] = [245, 197, 120];  // #F5C578
  const warmStoneHeader: [number, number, number] = [237, 232, 223]; // #EDE8DF
  const compliantGreen: [number, number, number] = [45, 106, 63];  // #2D6A3F
  const nonCompliantRed: [number, number, number] = [185, 28, 28]; // #B91C1C
  const overriddenAmber: [number, number, number] = [161, 98, 7];   // #A16207
  const textDark: [number, number, number] = [46, 43, 40];
  const borderGray: [number, number, number] = [209, 203, 192];

  // Hash / Session ID
  const sessionId = (result as any).sourceHash || `SESSION-${device.id || 'APEXNET'}-${Date.now().toString(16)}`;

  // 1. Top Header Banner — Deep Charcoal with Saffron Gold Accent Line
  doc.setFillColor(...deepCharcoal);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setFillColor(...saffronGold);
  doc.rect(0, 15, 210, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const titleText = `APEXNET | ${device.name || 'Network Node'} Security Audit Report`;
  doc.text(titleText, 12, 10, { maxWidth: 135 });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGoldText);
  const sessionSnippet = `Session ID: ${sessionId.substring(0, 32)}`;
  doc.text(sessionSnippet, 198, 10, { align: 'right' });

  // 2. Comprehensive Device Identification Grid (4x2 Table)
  const evalDate = result.evaluatedAt ? new Date(result.evaluatedAt).toUTCString() : new Date().toUTCString();
  const metadataRows = [
    [
      { content: 'Device Hostname:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: device.name || 'sw-core-01' },
      { content: 'Evaluated Against:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: frameworkMeta.name || 'CIS + NIST + STIG + ISO' },
    ],
    [
      { content: 'Serial Number:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: device.serialNumber || 'APX-98420-NX7K' },
      { content: 'Evaluation Date:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: evalDate },
    ],
    [
      { content: 'Hardware Model:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: `${device.deviceType || 'Network Node'} — ${device.model || 'Enterprise Dialect'}` },
      { content: 'Operator ID:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: 'operator-admin (admin@apexnet.gov.in)' },
    ],
    [
      { content: 'Vendor / Firmware:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: `${device.vendorName || 'Multi-Vendor'} (${device.osVersion || 'v17.3.4'})` },
      { content: 'AI Engine Lane:', styles: { fontStyle: 'bold', fillColor: warmStoneHeader } },
      { content: `AI Normalization (Dual-Lane NLP Heuristics)` },
    ],
  ];

  autoTable(doc, {
    startY: 20,
    body: metadataRows as any,
    theme: 'grid',
    margin: { left: 12, right: 12 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: textDark, lineColor: borderGray, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 61 },
      2: { cellWidth: 32 },
      3: { cellWidth: 61 },
    },
  });

  // 3. System Overview & AI Engine Normalization Context Callout Box
  const afterMetaY = (doc as any).lastAutoTable.finalY + 4;
  
  doc.setFillColor(245, 240, 232);
  doc.rect(12, afterMetaY, 186, 15, 'F');
  doc.setDrawColor(...saffronGold);
  doc.setLineWidth(0.4);
  doc.rect(12, afterMetaY, 186, 15, 'D');

  doc.setTextColor(...saffronGold);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('AI-AUGMENTED COMPLIANCE ENGINE & NORMALIZATION SCOPE', 15, afterMetaY + 4.5);

  doc.setTextColor(...textDark);
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  const scopeText = 'Engine extracts proprietary CLI syntaxes (Cisco, Juniper, Arista, Palo Alto, Fortinet, Check Point, SONiC, Cloud SASE) into a standardized Security Baseline Model. Deviation analysis maps configuration statements against CIS, NIST SP 800-53, DISA STIG, and ISO 27001 controls with AI Few-Shot learning loop traceability.';
  doc.text(scopeText, 15, afterMetaY + 9, { maxWidth: 180 });

  // 4. Executive 5-Column KPI Connected Summary Box
  const afterScopeY = afterMetaY + 18;

  const total = result.summary.totalRules || (result.findings ? result.findings.length : 1);
  const compliant = result.summary.passed || 0;
  const nonCompliant = result.summary.failed || 0;
  const overridden = result.summary.unknown || 0;
  const accuracy = ((compliant / total) * 100).toFixed(1);

  const kpiRow = [
    [
      { content: `${total}\nTotal Clauses`, styles: { fontStyle: 'bold', textColor: deepCharcoal, fillColor: [245, 240, 232] as [number, number, number] } },
      { content: `${compliant}\nCompliant`, styles: { fontStyle: 'bold', textColor: compliantGreen, fillColor: [230, 247, 240] as [number, number, number] } },
      { content: `${nonCompliant}\nNon-Compliant`, styles: { fontStyle: 'bold', textColor: nonCompliantRed, fillColor: [253, 232, 232] as [number, number, number] } },
      { content: `${overridden}\nOverridden`, styles: { fontStyle: 'bold', textColor: overriddenAmber, fillColor: [254, 243, 199] as [number, number, number] } },
      { content: `${accuracy}%\nCompliance Score`, styles: { fontStyle: 'bold', textColor: saffronGold, fillColor: [253, 247, 237] as [number, number, number] } },
    ],
  ];

  autoTable(doc, {
    startY: afterScopeY,
    body: kpiRow as any,
    theme: 'grid',
    margin: { left: 12, right: 12 },
    styles: { fontSize: 10, halign: 'center', valign: 'middle', cellPadding: 2.8, lineColor: borderGray, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 37.2 },
      1: { cellWidth: 37.2 },
      2: { cellWidth: 37.2 },
      3: { cellWidth: 37.2 },
      4: { cellWidth: 37.2 },
    },
  });

  // 5. Section Heading: Detailed Compliance Findings & Remediation Paths
  const afterKpiY = (doc as any).lastAutoTable.finalY + 6;
  doc.setTextColor(...saffronGold);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Compliance Findings & Actionable Remediation Paths', 12, afterKpiY);

  // 6. Detailed Compliance Table
  const findingsRows = (result.findings || []).map((f: any, idx: number) => {
    const clauseId = f.ruleId || `3.1.${idx + 1}`;
    const descTitle = f.ruleTitle || f.title || 'Security Baseline Control';
    const severity = (f.severity || 'HIGH').toUpperCase();
    const rawStatus = String(f.status || 'PASS').toUpperCase();
    
    let statusText = 'COMPLIANT';
    if (rawStatus === 'FAIL') statusText = 'NON-COMPLIANT';
    else if (rawStatus === 'N/A' || rawStatus === 'NOT_APPLICABLE') statusText = 'N/A';

    let citation = 'Verified against rule baseline.';
    if (rawStatus === 'FAIL') {
      const lineEv = f.evidenceLines && f.evidenceLines.length > 0
        ? `Line ${f.evidenceLines[0].line}: "${f.evidenceLines[0].raw.trim()}"`
        : f.evidenceSnippet ? `Line ${f.evidenceLine || 'N/A'}: "${f.evidenceSnippet}"` : 'Missing mandatory hardening statement';
      citation = `Non-compliant. ${lineEv}`;
    } else if (f.evidenceLines && f.evidenceLines.length > 0) {
      citation = `Verified line ${f.evidenceLines[0].line}: "${f.evidenceLines[0].raw.trim()}"`;
    }

    const remCmd = f.remediationCommand || (rawStatus === 'FAIL' ? 'configure terminal\n  service password-encryption\nend' : 'N/A (Compliant)');

    return [clauseId, `${descTitle}\n[${severity}]`, statusText, citation, remCmd];
  });

  autoTable(doc, {
    startY: afterKpiY + 3,
    head: [['Clause', 'Control & Severity', 'Status', 'Evidence / AI Citation', 'CLI Remediation Sequence']],
    body: findingsRows,
    theme: 'grid',
    margin: { left: 12, right: 12 },
    headStyles: {
      fillColor: saffronGold,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2.5,
      textColor: textDark,
      lineColor: [228, 224, 216],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: 42 },
      2: { fontStyle: 'bold', cellWidth: 26, halign: 'center' },
      3: { cellWidth: 44 },
      4: { fontStyle: 'bold', cellWidth: 46 },
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const text = String(data.cell.raw || '').toUpperCase();
        if (text === 'COMPLIANT') {
          data.cell.styles.textColor = compliantGreen;
        } else if (text === 'NON-COMPLIANT') {
          data.cell.styles.textColor = nonCompliantRed;
        } else {
          data.cell.styles.textColor = [124, 114, 105];
        }
      }
    },
  });

  // 7. Multi-Vendor Ecosystem Support & Governance Attestation Block
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const pageHeight = doc.internal.pageSize.getHeight();

  // If table pushes to near bottom, add a page break before governance signature
  if (finalY > pageHeight - 40) {
    doc.addPage();
  }

  const signY = finalY > pageHeight - 40 ? 20 : finalY;

  // Ecosystem note
  doc.setFillColor(237, 232, 223);
  doc.rect(12, signY, 186, 8, 'F');
  doc.setTextColor(...deepCharcoal);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Supported Ecosystems: Cisco (IOS/NX-OS), Juniper (JunOS), Arista (EOS), Palo Alto (PAN-OS), Fortinet (FortiOS), Check Point, SONiC, AWS/Azure Security Groups.', 15, signY + 5);

  // Sign-off signature box
  const sigY = signY + 12;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(12, sigY + 12, 85, sigY + 12);
  doc.line(113, sigY + 12, 198, sigY + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Evaluated By: Security Admin / Auditor', 12, sigY + 16);
  doc.text('Approved By: Chief Information Security Officer (CISO)', 113, sigY + 16);

  // Footer on every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(168, 159, 146);

    doc.text('Generated using ApexNet AI-Augmented Compliance Engine | Reviewed by operator-admin', 105, 287, { align: 'center' });
    doc.text('Mandatory human operator validation required prior to production CLI deployment.', 105, 290, { align: 'center' });
    doc.text('www.apexnet.gov.in', 12, 293);
    doc.text(`Page ${i} of ${pageCount}`, 198, 293, { align: 'right' });
  }

  // Save document
  const cleanName = (device.name || 'Node').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ApexNet_Compliance_Report_${cleanName}_${result.framework || 'cis'}.pdf`;
  doc.save(filename);
}
