import React, { useState } from 'react';
import { BrandLanding } from './components/BrandLanding';
import { Navbar } from './components/Navbar';
import { HeroLanding } from './components/HeroLanding';
import { IngestionConsole } from './components/IngestionConsole';
import { DualLaneEngine } from './components/DualLaneEngine';
import { AuditResultsView } from './components/AuditResultsView';
import { TrainingUI } from './components/TrainingUI';
import { RulePackExplorer } from './components/RulePackExplorer';
import { LivePullSimulator } from './components/LivePullSimulator';
import { Footer } from './components/Footer';

import { FrameworkId, ParsingLane, SampleDeviceConfig } from './types/audit';
import { SAMPLE_CONFIGS } from './data/sampleConfigs';
import { AuditRunResult, evaluateAudit } from './utils/auditEngine';

export function App() {
  // Top-level mode: 'landing' (the influential brand experience) or 'product' (the live audit workspace)
  const [viewMode, setViewMode] = useState<'landing' | 'product'>('landing');

  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [selectedConfig, setSelectedConfig] = useState<SampleDeviceConfig>(SAMPLE_CONFIGS[0]);
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>('cis_v8');
  const [selectedLane, setSelectedLane] = useState<ParsingLane | 'auto'>('auto');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const [auditResult, setAuditResult] = useState<AuditRunResult>(() =>
    evaluateAudit(SAMPLE_CONFIGS[0], 'cis_v8')
  );

  const handleLaunchFromLanding = (vendorId?: string) => {
    if (vendorId) {
      const found = SAMPLE_CONFIGS.find((c) => c.id === vendorId);
      if (found) {
        setSelectedConfig(found);
        const result = evaluateAudit(found, selectedFramework);
        setAuditResult(result);
      }
    }
    setViewMode('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExecuteAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const result = evaluateAudit(
        selectedConfig,
        selectedFramework,
        selectedLane === 'auto' ? undefined : selectedLane
      );
      setAuditResult(result);
      setIsAuditing(false);
      setActiveTab('audit');
    }, 450);
  };

  const handleSelectVendorFromHero = (vendorConfigId: string) => {
    const found = SAMPLE_CONFIGS.find((c) => c.id === vendorConfigId);
    if (found) {
      setSelectedConfig(found);
      const result = evaluateAudit(found, selectedFramework);
      setAuditResult(result);
      setActiveTab('audit');
    }
  };

  const handleIngestFromLivePull = (config: SampleDeviceConfig) => {
    setSelectedConfig(config);
    const result = evaluateAudit(config, selectedFramework);
    setAuditResult(result);
    setActiveTab('audit');
  };

  // Derive score/pass/fail for persistent status strip in the product console
  const pass = auditResult.findings.filter((f) => f.status === 'PASS').length;
  const fail = auditResult.findings.filter((f) => f.status === 'FAIL').length;
  const total = auditResult.findings.length;
  const score = total > 0 ? Math.round((pass / total) * 100) : 0;

  return (
    <div
      className="min-h-screen flex flex-col selection:bg-zinc-800 selection:text-white"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* VIEW 1: BRAND LANDING PAGE (Influential, 3D WebGL Particle Mesh, Authority Storytelling) */}
      {viewMode === 'landing' ? (
        <BrandLanding onLaunchProduct={handleLaunchFromLanding} />
      ) : (
        /* VIEW 2: PRODUCT AUDIT PLATFORM & WORKSPACE (Under 'Try Our Product') */
        <div className="flex-1 flex flex-col" data-no-tracker="true">
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onQuickAudit={handleExecuteAudit}
            onBackToLanding={() => {
              setViewMode('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            auditScore={score}
            passCount={pass}
            failCount={fail}
          />

          <main className="flex-1">
            {activeTab === 'pipeline' && (
              <div>
                <HeroLanding
                  onStartAudit={() => setActiveTab('audit')}
                  onExploreTraining={() => setActiveTab('training')}
                  onSelectVendorConfig={handleSelectVendorFromHero}
                />
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <IngestionConsole
                    selectedConfig={selectedConfig}
                    onSelectConfig={setSelectedConfig}
                    selectedFramework={selectedFramework}
                    onSelectFramework={setSelectedFramework}
                    selectedLane={selectedLane}
                    onSelectLane={setSelectedLane}
                    onExecuteAudit={handleExecuteAudit}
                    isAuditing={isAuditing}
                  />
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div>
                <IngestionConsole
                  selectedConfig={selectedConfig}
                  onSelectConfig={setSelectedConfig}
                  selectedFramework={selectedFramework}
                  onSelectFramework={setSelectedFramework}
                  selectedLane={selectedLane}
                  onSelectLane={setSelectedLane}
                  onExecuteAudit={handleExecuteAudit}
                  isAuditing={isAuditing}
                />
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <DualLaneEngine
                    auditResult={auditResult}
                    onOpenTraining={() => setActiveTab('training')}
                  />
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <AuditResultsView
                    result={auditResult}
                    onReAudit={handleExecuteAudit}
                    onOpenTraining={() => setActiveTab('training')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'training' && (
              <TrainingUI
                onTrainingUpdated={() => {
                  const res = evaluateAudit(selectedConfig, selectedFramework);
                  setAuditResult(res);
                }}
              />
            )}

            {activeTab === 'rules' && <RulePackExplorer />}

            {activeTab === 'telemetry' && (
              <LivePullSimulator onIngestPulledConfig={handleIngestFromLivePull} />
            )}
          </main>

          <Footer />
        </div>
      )}
    </div>
  );
}

export default App;
