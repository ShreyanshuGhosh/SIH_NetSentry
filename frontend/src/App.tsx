// src/App.tsx
// Authoritative Consolidated ApexNet Platform Application
// Zero-Slop Architecture with Persistent NavRail, TopBar, and Phase 0 Pipeline Integration

import React, { useState, useCallback, useMemo } from 'react';
import { NavRail, ActiveNavTab } from './components/shell/NavRail';
import { TopBar } from './components/shell/TopBar';
import { PublicLandingPage } from './components/landing/PublicLandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { IngestionConsole } from './components/IngestionConsole';
import { AuditResultsView } from './components/AuditResultsView';
import { TrainingUI } from './components/TrainingUI';
import { RulePackExplorer } from './components/RulePackExplorer';
import { TacticalRemediationScanner, ScannerDialect } from './components/TacticalRemediationScanner';
import { LivePullSimulator } from './components/LivePullSimulator';
import { DualLaneEngine } from './components/DualLaneEngine';
import { SettingsView } from './components/settings/SettingsView';

import { FrameworkId, ParsingLane, SampleDeviceConfig } from './types/audit';
import { SAMPLE_CONFIGS } from './data/sampleConfigs';
import { runCompliancePipeline, PipelineExecutionResult } from './engine/pipeline';
import { exemplarStore } from './engine/exemplarStore';
import { BulkConfigFile } from './components/ingest/BulkDropzone';
import { SupportedVendor } from './types/canonical';

export function App() {
  // Top-level mode: 'landing' (public gateway) or 'console' (authenticated operations)
  const [viewMode, setViewMode] = useState<'landing' | 'console'>('landing');
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');

  // Active configuration & audit state
  const [selectedConfig, setSelectedConfig] = useState<SampleDeviceConfig>(SAMPLE_CONFIGS[0]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<FrameworkId[]>(['cis_v8']);
  const [selectedLane, setSelectedLane] = useState<ParsingLane | 'auto'>('auto');
  const [isAuditing, setIsAuditing] = useState(false);

  const handleToggleFramework = useCallback((fwId: FrameworkId) => {
    setSelectedFrameworks((prev) => {
      if (prev.includes(fwId)) {
        if (prev.length === 1) return prev; // Keep at least 1 selected
        return prev.filter((f) => f !== fwId);
      } else {
        return [...prev, fwId];
      }
    });
  }, []);

  // Initial audit execution using Phase 0 canonical pipeline
  const [pipelineResult, setPipelineResult] = useState<PipelineExecutionResult>(() =>
    runCompliancePipeline(SAMPLE_CONFIGS[0].rawText, {
      deviceId: SAMPLE_CONFIGS[0].id,
      vendorOverride: SAMPLE_CONFIGS[0].vendor as any,
      frameworks: ['cis_v8'],
    })
  );

  // Training queue counter from store
  const [pendingTrainingCount, setPendingTrainingCount] = useState<number>(() =>
    exemplarStore.getQueue(0.80).length
  );

  // Recent audits cache for Dashboard fleet overview
  const [recentAudits, setRecentAudits] = useState<any[]>(() => {
    return SAMPLE_CONFIGS.slice(0, 4).map((cfg) => {
      const res = runCompliancePipeline(cfg.rawText, {
        deviceId: cfg.id,
        vendorOverride: cfg.vendor as any,
        frameworks: ['cis_v8'],
      });
      return {
        deviceId: cfg.id,
        deviceName: cfg.name,
        vendor: cfg.vendor as SupportedVendor,
        model: cfg.model,
        score: res.auditResult.summary.complianceScore,
        pass: res.auditResult.summary.passed,
        fail: res.auditResult.summary.failed,
        auditResult: res.auditResult,
      };
    });
  });

  // Automatically scroll to top whenever activeTab changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Data Loss Protection — Prompt before page unload/reload when in console session
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (viewMode === 'console') {
        e.preventDefault();
        e.returnValue = 'Data Loss Protection: Unsaved audit state will be lost if you reload.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [viewMode]);

  // Execute compliance audit through Phase 0 pipeline
  const handleExecuteAudit = useCallback(() => {
    setIsAuditing(true);
    setTimeout(() => {
      const res = runCompliancePipeline(selectedConfig.rawText, {
        deviceId: selectedConfig.id,
        vendorOverride: selectedConfig.vendor as any,
        frameworks: selectedFrameworks,
        forceLane: selectedLane === 'auto' ? undefined : (selectedLane as any),
      });

      setPipelineResult(res);
      setIsAuditing(false);
      setActiveTab('results');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // Update recent audits list
      setRecentAudits((prev) => {
        const filtered = prev.filter((a) => a.deviceId !== selectedConfig.id);
        return [
          {
            deviceId: selectedConfig.id,
            deviceName: selectedConfig.name,
            vendor: selectedConfig.vendor as SupportedVendor,
            model: selectedConfig.model,
            score: res.auditResult.summary.complianceScore,
            pass: res.auditResult.summary.passed,
            fail: res.auditResult.summary.failed,
            auditResult: res.auditResult,
          },
          ...filtered,
        ];
      });
    }, 450);
  }, [selectedConfig, selectedFrameworks, selectedLane]);

  // Handle batch audit execution from BulkDropzone
  const handleBatchAudit = useCallback(
    (files: BulkConfigFile[]) => {
      if (files.length === 0) return;
      setIsAuditing(true);

      setTimeout(() => {
        const batchEvaluations = files.map((file) => {
          return runCompliancePipeline(file.rawText, {
            deviceId: file.id,
            vendorOverride: file.detectedVendor,
            frameworks: selectedFrameworks,
          });
        });

        // Set the first evaluated file as active in Results
        setPipelineResult(batchEvaluations[0]);

        // Merge all into recent audits
        const newAudits = files.map((file, idx) => ({
          deviceId: file.id,
          deviceName: file.fileName,
          vendor: file.detectedVendor,
          model: file.dialect,
          score: batchEvaluations[idx].auditResult.summary.complianceScore,
          pass: batchEvaluations[idx].auditResult.summary.passed,
          fail: batchEvaluations[idx].auditResult.summary.failed,
          auditResult: batchEvaluations[idx].auditResult,
        }));

        setRecentAudits(newAudits);
        setIsAuditing(false);
        setActiveTab('results');
      }, 650);
    },
    [selectedFrameworks]
  );

  // Live pull ingestion handoff
  const handleIngestFromLivePull = useCallback(
    (config: SampleDeviceConfig) => {
      setSelectedConfig(config);
      const res = runCompliancePipeline(config.rawText, {
        deviceId: config.id,
        vendorOverride: config.vendor as any,
        frameworks: selectedFrameworks,
      });
      setPipelineResult(res);
      setActiveTab('results');
    },
    [selectedFrameworks]
  );

  // Callback when Training GUI updates few-shot store (demonstrates Test 2: Mapping reuse!)
  const handleTrainingUpdated = useCallback(() => {
    setPendingTrainingCount(exemplarStore.getQueue(0.80).length);
    // Re-run pipeline on current device to reflect the newly learned exemplar
    const updated = runCompliancePipeline(selectedConfig.rawText, {
      deviceId: selectedConfig.id,
      vendorOverride: selectedConfig.vendor as any,
      frameworks: selectedFrameworks,
      forceLane: 'llm_fallback',
    });
    setPipelineResult(updated);
  }, [selectedConfig, selectedFrameworks]);

  // Telemetry metrics for top bar
  const currentSummary = pipelineResult.auditResult.summary;

  // Callback when launching console from landing page
  const handleLaunchFromLanding = useCallback(
    (configId?: string, targetTab?: string) => {
      if (configId) {
        const found = SAMPLE_CONFIGS.find((c) => c.id === configId);
        if (found) {
          setSelectedConfig(found);
          const res = runCompliancePipeline(found.rawText, {
            deviceId: found.id,
            vendorOverride: found.vendor as any,
            frameworks: selectedFrameworks,
          });
          setPipelineResult(res);
          setActiveTab((targetTab as ActiveNavTab) || 'results');
          setViewMode('console');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      if (targetTab) {
        setActiveTab(targetTab as ActiveNavTab);
      }
      setViewMode('console');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [selectedFrameworks]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* MODE 1: PUBLIC LANDING OVERVIEW (Institutional, Light Mode, Tactical Reticle) */}
      {viewMode === 'landing' ? (
        <PublicLandingPage onLaunchConsole={handleLaunchFromLanding} />
      ) : (
        /* MODE 2: AUTHENTICATED CONSOLE (Persistent NavRail + TopBar) */
        <div className="flex-1 flex min-h-screen">
          {/* Persistent Nav Rail */}
          <NavRail
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            pendingTrainingCount={pendingTrainingCount}
            onViewLandingPage={() => setViewMode('landing')}
          />

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Persistent Top Bar */}
            <TopBar
              currentDeviceName={selectedConfig.name}
              currentVendor={pipelineResult.detectedVendor}
              complianceScore={currentSummary.complianceScore}
              passCount={currentSummary.passed}
              failCount={currentSummary.failed}
              isAuditing={isAuditing}
              activeTab={activeTab}
              onExecuteAudit={handleExecuteAudit}
              onViewPublicOverview={() => setViewMode('landing')}
              onBackToDashboard={() => setActiveTab('dashboard')}
              onViewLandingPage={() => setViewMode('landing')}
            />

            {/* View Router */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full">
              {activeTab === 'dashboard' && (
                <DashboardView
                  recentAudits={recentAudits}
                  pendingTrainingCount={pendingTrainingCount}
                  onNavigate={setActiveTab}
                  onSelectAuditResult={(device) => {
                    const found = SAMPLE_CONFIGS.find((c) => c.id === device.deviceId);
                    if (found) setSelectedConfig(found);
                    if (device.auditResult) {
                      setPipelineResult((prev) => ({
                        ...prev,
                        auditResult: device.auditResult,
                        detectedVendor: device.vendor,
                      }));
                    }
                  }}
                />
              )}

              {activeTab === 'ingest' && (
                <IngestionConsole
                  selectedConfig={selectedConfig}
                  onSelectConfig={setSelectedConfig}
                  selectedFrameworks={selectedFrameworks}
                  onToggleFramework={handleToggleFramework}
                  onSelectAllFrameworks={(fws) => setSelectedFrameworks(fws)}
                  selectedLane={selectedLane}
                  onSelectLane={setSelectedLane}
                  onExecuteAudit={handleExecuteAudit}
                  onBatchAudit={handleBatchAudit}
                  isAuditing={isAuditing}
                />
              )}

              {activeTab === 'results' && (
                <AuditResultsView
                  result={pipelineResult.auditResult}
                  deviceName={selectedConfig.name}
                  platform={selectedConfig.model}
                  osVersion={selectedConfig.osVersion}
                  onReAudit={handleExecuteAudit}
                  onOpenRemediation={() => setActiveTab('remediation')}
                  onOpenTraining={() => setActiveTab('training')}
                />
              )}

              {activeTab === 'training' && (
                <TrainingUI onTrainingUpdated={handleTrainingUpdated} />
              )}

              {activeTab === 'rules' && <RulePackExplorer />}

              {activeTab === 'remediation' && <TacticalRemediationScanner />}

              {activeTab === 'live-pull' && (
                <LivePullSimulator onIngestPulledConfig={handleIngestFromLivePull} />
              )}

              {activeTab === 'architecture' && (
                <DualLaneEngine onOpenTraining={() => setActiveTab('training')} />
              )}

              {activeTab === 'settings' && <SettingsView />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
