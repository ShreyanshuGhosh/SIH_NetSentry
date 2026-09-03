import React from 'react';

export const Footer: React.FC = () => (
  <footer style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
    <div
      className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono"
      style={{ fontSize: 11, color: 'var(--text-tertiary)' }}
    >
      <div className="space-y-1">
        <p>NetSentry - AI-Driven Multi-Vendor Network Compliance Auditor</p>
        <p>Problem Statement SIH26155 / Organisation: NTRO / Smart India Hackathon 2026</p>
      </div>
      <div className="text-right space-y-1">
        <p>CIS Network v8 - NIST SP 800-53 Rev. 5 - DISA STIG - ISO/IEC 27001:2022</p>
        <p>Prototype build. No production data transmitted.</p>
      </div>
    </div>
  </footer>
);
