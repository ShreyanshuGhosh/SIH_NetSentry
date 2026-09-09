// src/components/results/PdfReportPreview.tsx
// Authentic preview of the ApexNet PDF Audit Report matching the website theme palette (Warm Stone + Saffron Gold + Deep Charcoal)

import React, { useState } from 'react';
import { FilePdf, DownloadSimple, ShieldCheck } from '@phosphor-icons/react';
import { EngineEvaluationResult } from '../../engine/ruleEngine';
import { generateAuditPdf } from '../../utils/pdfGenerator';

interface PdfReportPreviewProps {
  auditResult: EngineEvaluationResult;
  deviceName: string;
  platform: string;
  osVersion: string;
}

export const PdfReportPreview: React.FC<PdfReportPreviewProps> = ({
  auditResult,
  deviceName,
  platform,
  osVersion,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const summary = auditResult.summary;
  const total = summary.totalFindings || 1;
  const passed = summary.passed || 0;
  const failed = summary.failed || 0;
  const unknown = summary.notApplicable || 0;
  const accuracy = ((passed / total) * 100).toFixed(1);

  const sessionId = auditResult.sourceHash || `SES-APX-${auditResult.deviceId.slice(0, 12).toUpperCase()}`;

  const handleDownload = () => {
    setIsGenerating(true);
    setDownloadError(null);
    try {
      generateAuditPdf({
        device: {
          id: auditResult.deviceId,
          name: deviceName,
          vendor: auditResult.vendor as any,
          vendorName: auditResult.vendor.toUpperCase(),
          deviceType: 'Switch',
          model: platform,
          serialNumber: 'APX-98420-NX7K',
          osVersion,
          redactedSecretsCount: 4,
          rawText: '',
        },
        framework: auditResult.frameworks[0] || 'cis_v8',
        lane: 'deterministic',
        baseline: {} as any,
        findings: auditResult.findings as any,
        summary: {
          totalRules: total,
          passed: passed,
          failed: failed,
          unknown: unknown,
          complianceScore: summary.complianceScore,
          criticalFindings: summary.criticalCount || 0,
          highFindings: summary.highCount || 0,
          mediumFindings: summary.mediumCount || 0,
          lowFindings: summary.lowCount || 0,
        },
        durationMs: 14,
        evaluatedAt: auditResult.evaluatedAt,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err: any) {
      console.error('PDF Generation Failed:', err);
      setDownloadError(err?.message || 'Error generating PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="p-6 rounded-xl border space-y-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E1C1A]">
            <FilePdf size={18} className="text-[#C8830A]" />
            <span>ApexNet Official Multi-Vendor Compliance PDF Report</span>
          </div>
          <p className="text-[11px] text-[#7C7269] mt-0.5">
            Institutional R30-format PDF report preview featuring AI baseline normalization, 5-column metric summary, exact CLI remediation, and CISO attestation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {downloadError && (
            <span className="text-[11px] font-mono text-rose-600">
              {downloadError}
            </span>
          )}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50`}
            style={{ backgroundColor: downloadSuccess ? '#2D6A3F' : '#C8830A' }}
          >
            {downloadSuccess ? (
              <>
                <ShieldCheck size={16} weight="bold" />
                <span>Downloaded PDF Report</span>
              </>
            ) : (
              <>
                <DownloadSimple size={16} weight="bold" />
                <span>{isGenerating ? 'Generating PDF...' : 'Download Full Audit PDF Report'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reference PDF Authentic Visual Preview Box */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg border border-[#D1CBC0] shadow-xl overflow-hidden text-[#1E1C1A] text-xs font-sans">
        
        {/* 1. Deep Charcoal Top Banner with Saffron Gold Accent Line */}
        <div className="bg-[#1E1C1A] text-white px-5 py-3 flex items-center justify-between gap-4 border-b-2 border-[#C8830A]">
          <div className="font-extrabold text-sm tracking-tight truncate min-w-0 flex-1" title={`APEXNET | ${deviceName} Security Audit Report`}>
            APEXNET | {deviceName} Security Audit Report
          </div>
          <div className="text-[10px] font-mono text-[#F5C578] shrink-0 whitespace-nowrap">
            Session ID: {sessionId.substring(0, 32)}
          </div>
        </div>

        {/* 2. Device Identification Metadata Grid (4x2 Table) */}
        <div className="p-4 bg-white space-y-4">
          <table className="w-full text-left text-[10.5px] border border-[#D1CBC0] border-collapse">
            <tbody>
              <tr className="border-b border-[#D1CBC0]">
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] w-32 border-r border-[#D1CBC0]">Device Hostname:</td>
                <td className="px-3 py-1.5 text-[#2E2B28] border-r border-[#D1CBC0]">{deviceName}</td>
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] w-32 border-r border-[#D1CBC0]">Evaluated Against:</td>
                <td className="px-3 py-1.5 text-[#2E2B28]">{auditResult.frameworks.map(f => f.toUpperCase()).join(' + ')}</td>
              </tr>
              <tr className="border-b border-[#D1CBC0]">
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] border-r border-[#D1CBC0]">Serial Number:</td>
                <td className="px-3 py-1.5 text-[#2E2B28] border-r border-[#D1CBC0]">APX-98420-NX7K</td>
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] border-r border-[#D1CBC0]">Evaluation Date:</td>
                <td className="px-3 py-1.5 text-[#2E2B28]">{new Date(auditResult.evaluatedAt).toUTCString()}</td>
              </tr>
              <tr className="border-b border-[#D1CBC0]">
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] border-r border-[#D1CBC0]">Hardware Model:</td>
                <td className="px-3 py-1.5 text-[#2E2B28] border-r border-[#D1CBC0]">Switch — {platform}</td>
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] border-r border-[#D1CBC0]">Operator ID:</td>
                <td className="px-3 py-1.5 text-[#2E2B28]">operator-admin (admin@apexnet.gov.in)</td>
              </tr>
              <tr>
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] border-r border-[#D1CBC0]">Vendor / Firmware:</td>
                <td className="px-3 py-1.5 text-[#2E2B28] border-r border-[#D1CBC0]">{auditResult.vendor.toUpperCase()} ({osVersion})</td>
                <td className="bg-[#EDE8DF] font-bold px-3 py-1.5 text-[#1E1C1A] border-r border-[#D1CBC0]">AI Engine Lane:</td>
                <td className="px-3 py-1.5 text-[#2E2B28]">AI Normalization (Dual-Lane NLP Heuristics)</td>
              </tr>
            </tbody>
          </table>

          {/* 3. System Overview & AI Engine Callout */}
          <div className="p-3 bg-[#F5F0E8] border border-[#C8830A] rounded text-[10px] space-y-1">
            <div className="font-bold text-[#C8830A] uppercase tracking-wider">
              AI-Augmented Compliance Engine & Normalization Scope
            </div>
            <p className="text-[#2E2B28] leading-relaxed">
              Engine extracts proprietary CLI syntaxes (Cisco, Juniper, Arista, Palo Alto, Fortinet, Check Point, SONiC, Cloud SASE) into a standardized Security Baseline Model. Deviation analysis maps configuration statements against CIS, NIST SP 800-53, DISA STIG, and ISO 27001 controls with AI Few-Shot learning loop traceability.
            </p>
          </div>

          {/* 4. 5-Column Connected KPI Summary Box */}
          <div className="grid grid-cols-5 border border-[#D1CBC0] rounded overflow-hidden text-center">
            <div className="p-3 bg-[#F5F0E8] border-r border-[#D1CBC0]">
              <div className="text-xl font-bold text-[#1E1C1A]">{total}</div>
              <div className="text-[10px] text-[#7C7269] font-semibold mt-0.5">Total Clauses</div>
            </div>
            <div className="p-3 bg-[#E6F7F0] border-r border-[#D1CBC0]">
              <div className="text-xl font-bold text-[#2D6A3F]">{passed}</div>
              <div className="text-[10px] text-[#2D6A3F] font-semibold mt-0.5">Compliant</div>
            </div>
            <div className="p-3 bg-[#FDE8E8] border-r border-[#D1CBC0]">
              <div className="text-xl font-bold text-[#B91C1C]">{failed}</div>
              <div className="text-[10px] text-[#B91C1C] font-semibold mt-0.5">Non-Compliant</div>
            </div>
            <div className="p-3 bg-[#FEF3C7] border-r border-[#D1CBC0]">
              <div className="text-xl font-bold text-[#A16207]">{unknown}</div>
              <div className="text-[10px] text-[#A16207] font-semibold mt-0.5">Overridden</div>
            </div>
            <div className="p-3 bg-[#FDF7ED]">
              <div className="text-xl font-bold text-[#C8830A]">{accuracy}%</div>
              <div className="text-[10px] text-[#C8830A] font-semibold mt-0.5">Compliance Score</div>
            </div>
          </div>

          {/* 5. Detailed Results Title */}
          <h2 className="text-sm font-bold text-[#C8830A] pt-2">Detailed Compliance Findings & Actionable Remediation Paths</h2>

          {/* 6. Detailed Results Table (5 Columns) */}
          <table className="w-full text-left text-[10.5px] border border-[#D1CBC0] border-collapse">
            <thead>
              <tr className="bg-[#C8830A] text-white font-bold text-[10.5px]">
                <th className="px-2.5 py-2 w-28 whitespace-nowrap border-r border-[#A66A06]">Clause</th>
                <th className="px-2.5 py-2 border-r border-[#A66A06]">Control & Severity</th>
                <th className="px-2.5 py-2 w-28 whitespace-nowrap text-center border-r border-[#A66A06]">Status</th>
                <th className="px-2.5 py-2 border-r border-[#A66A06]">Evidence / AI Citation</th>
                <th className="px-2.5 py-2">CLI Remediation Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8]">
              {auditResult.findings.map((f: any, idx: number) => {
                const clauseId = f.ruleId || `3.1.${idx + 1}`;
                const isPass = f.status === 'pass';
                const isFail = f.status === 'fail';
                const severity = (f.severity || 'HIGH').toUpperCase();

                let citation = 'Verified against rule baseline.';
                if (isFail) {
                  const lineEv = f.evidenceLines && f.evidenceLines.length > 0
                    ? `Line ${f.evidenceLines[0].line}: "${f.evidenceLines[0].raw.trim()}"`
                    : f.evidenceSnippet ? `Line ${f.evidenceLine || 'N/A'}: "${f.evidenceSnippet}"` : 'Missing mandatory hardening statement';
                  citation = `Non-compliant. ${lineEv}`;
                } else if (f.evidenceLines && f.evidenceLines.length > 0) {
                  citation = `Verified line ${f.evidenceLines[0].line}: "${f.evidenceLines[0].raw.trim()}"`;
                }

                const remCmd = f.remediationCommand || (isFail ? 'configure terminal\n  service password-encryption\nend' : 'N/A (Compliant)');

                return (
                  <tr key={f.ruleId} className="hover:bg-[#F9F8F5]">
                    <td className="px-2.5 py-2 font-mono font-bold text-[#1E1C1A] border-r border-[#E4E0D8] whitespace-nowrap">{clauseId}</td>
                    <td className="px-2.5 py-2 text-[#2E2B28] border-r border-[#E4E0D8]">
                      <div>{f.ruleTitle || f.title}</div>
                      <div className="font-mono text-[9.5px] font-bold text-[#C8830A] mt-0.5">[{severity}]</div>
                    </td>
                    <td className="px-2.5 py-2 text-center border-r border-[#E4E0D8] whitespace-nowrap">
                      <span
                        className={`font-bold whitespace-nowrap ${
                          isPass
                            ? 'text-[#2D6A3F]'
                            : isFail
                            ? 'text-[#B91C1C]'
                            : 'text-[#7C7269]'
                        }`}
                      >
                        {isPass ? 'COMPLIANT' : isFail ? 'NON-COMPLIANT' : 'N/A'}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-[#4A4440] text-[10px] leading-relaxed border-r border-[#E4E0D8]">{citation}</td>
                    <td className="px-2.5 py-2 text-[#1E1C1A] font-mono text-[9.5px] bg-[#FAF8F5] leading-relaxed whitespace-pre-line">{remCmd}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 7. Ecosystem Note & Sign-off Box */}
          <div className="pt-2 space-y-3">
            <div className="p-2 bg-[#EDE8DF] text-[9.5px] text-[#2E2B28] rounded text-center">
              Supported Ecosystems: Cisco (IOS/NX-OS), Juniper (JunOS), Arista (EOS), Palo Alto (PAN-OS), Fortinet (FortiOS), Check Point, SONiC, AWS/Azure Security Groups.
            </div>

            <div className="flex items-center justify-between pt-4 px-2 text-[10px]">
              <div>
                <div className="border-b border-[#D1CBC0] w-48 mb-1"></div>
                <div className="font-bold text-[#2E2B28]">Evaluated By: Security Admin / Auditor</div>
              </div>
              <div>
                <div className="border-b border-[#D1CBC0] w-48 mb-1"></div>
                <div className="font-bold text-[#2E2B28]">Approved By: Chief Information Security Officer (CISO)</div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Document Footer Bar */}
        <div className="bg-[#F5F0E8] border-t border-[#D1CBC0] px-5 py-3 text-center text-[10px] text-[#A89F92] space-y-0.5 font-sans">
          <div>Generated using ApexNet AI-Augmented Compliance Engine | Reviewed by operator-admin</div>
          <div>Mandatory human operator validation required prior to production CLI deployment.</div>
          <div className="flex justify-between items-center pt-1 font-mono text-[9px] text-[#A89F92]">
            <span>www.apexnet.gov.in</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
