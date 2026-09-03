import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditRunResult } from './auditEngine';
import { FRAMEWORKS } from '../data/rulePacks';

export function generateAuditPdf(result: AuditRunResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const frameworkMeta = FRAMEWORKS[result.framework];
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentEmerald: [number, number, number] = [16, 185, 129]; // Emerald 500
  const alertRose: [number, number, number] = [244, 63, 94]; // Rose 500
  const amberTone: [number, number, number] = [245, 158, 11]; // Amber 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NETSENTRY - NETWORK SECURITY COMPLIANCE AUDIT', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('SIH 2026 | Problem Statement: SIH26155 | Organisation: NTRO (Govt of India)', 14, 22);
  doc.text(`Evaluation Framework: ${frameworkMeta.name} (${frameworkMeta.version})`, 14, 28);
  doc.text(`Generated: ${new Date(result.evaluatedAt).toLocaleString()} | Engine: NetSentry Dual-Lane Core v1.0`, 14, 34);

  // Score Badge in Header Right
  const scoreColor = result.summary.complianceScore >= 80 ? accentEmerald : (result.summary.complianceScore >= 60 ? amberTone : alertRose);
  doc.setFillColor(...scoreColor);
  doc.roundedRect(160, 8, 36, 22, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.summary.complianceScore}%`, 178, 18, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPLIANT', 178, 25, { align: 'center' });

  // 2. Device Metadata Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Device Identification & Telemetry', 14, 48);

  const deviceData = [
    ['Target Device Name', result.device.name, 'Vendor / OS Family', result.device.vendorName],
    ['Hardware Model', result.device.model, 'Firmware / OS Version', result.device.osVersion],
    ['Device Serial Number', result.device.serialNumber, 'Parsing Lane Applied', result.lane === 'deterministic' ? 'Green Lane (Deterministic Parser)' : 'Amber Lane (LLM Fallback)'],
    ['Redacted Secrets', `${result.device.redactedSecretsCount} cryptographic tokens masked`, 'Audit Processing Time', `${result.durationMs} ms`]
  ];

  autoTable(doc, {
    startY: 52,
    body: deviceData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 40 },
      3: { cellWidth: 55 }
    }
  });

  // 3. Executive Summary Cards
  const afterDeviceY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Executive Summary & Control Breakdown', 14, afterDeviceY);

  const summaryData = [
    ['Total Evaluated Controls', result.summary.totalRules.toString()],
    ['Passed Controls', result.summary.passed.toString()],
    ['Failed Controls', result.summary.failed.toString()],
    ['Unknown / Review Required', result.summary.unknown.toString()],
    ['Critical / High Severity Issues', `${result.summary.criticalFindings + result.summary.highFindings}`]
  ];

  autoTable(doc, {
    startY: afterDeviceY + 4,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 80 },
      1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 30 }
    }
  });

  // 4. Compliance Findings Table
  const afterSummaryY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Detailed Audit Findings & Line Evidence', 14, afterSummaryY);

  const findingsRows = result.findings.map(f => [
    f.ruleId,
    f.title,
    f.severity,
    f.status,
    `L#${f.evidenceLine}: ${f.evidenceSnippet.slice(0, 45)}...`,
    `${Math.round(f.confidence * 100)}%`
  ]);

  autoTable(doc, {
    startY: afterSummaryY + 4,
    head: [['Control ID', 'Security Requirement', 'Severity', 'Verdict', 'Line-Level Evidence', 'Confidence']],
    body: findingsRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 },
      1: { cellWidth: 55 },
      2: { cellWidth: 20 },
      3: { fontStyle: 'bold', cellWidth: 20 },
      4: { cellWidth: 50 },
      5: { cellWidth: 20 }
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        const text = data.cell.raw as string;
        if (text === 'PASS') data.cell.styles.textColor = [16, 185, 129];
        else if (text === 'FAIL') data.cell.styles.textColor = [244, 63, 94];
        else if (text === 'UNKNOWN') data.cell.styles.textColor = [245, 158, 11];
      }
    }
  });

  // 5. Remediation CLI Sequences
  doc.addPage();
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('NETSENTRY - DEVICE REMEDIATION SEQUENCES', 14, 12);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Actionable Hardening CLI Commands (Device-Specific)', 14, 28);

  const failFindings = result.findings.filter(f => f.status === 'FAIL' || f.status === 'UNKNOWN');

  if (failFindings.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('Zero compliance violations detected. All evaluated controls satisfy the security baseline.', 14, 38);
  } else {
    const remediationRows = failFindings.map(f => [
      f.ruleId,
      f.title,
      f.remediationCommand,
      f.remediationRationale
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['Control ID', 'Non-Compliant Control', 'Device CLI Fix Sequence', 'Hardening Rationale']],
      body: remediationRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 42 },
        2: { fontStyle: 'italic', fillColor: [248, 250, 252], cellWidth: 62 },
        3: { cellWidth: 50 }
      }
    });
  }

  // Footer Trust Notice
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'NetSentry Trust Boundary: AI extracts syntax. Deterministic YAML rule engine decides compliance.',
      14,
      290
    );
    doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
  }

  // Trigger download
  const cleanName = result.device.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`NetSentry_Audit_${cleanName}_${result.framework}.pdf`);
}
