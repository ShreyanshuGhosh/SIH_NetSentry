// src/engine/ruleEngine.ts
// Phase 0: Pure Rule Engine Contract Implementation (§0.3, §6.4)
// Evaluates NormalizedConfig against selected frameworks and outputs Finding[] + deduplicated summary

import {
  ComplianceRule,
  Finding,
  FrameworkId,
  NormalizedConfig,
  SeverityLevel,
} from "../types/canonical";
import { COMPLIANCE_RULES } from "./rules";

export interface EvaluatedAuditSummary {
  totalFindings: number;
  deduplicatedControls: number;
  passed: number;
  failed: number;
  notApplicable: number;
  complianceScore: number; // 0-100
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface EngineEvaluationResult {
  deviceId: string;
  vendor: NormalizedConfig["vendor"];
  frameworks: FrameworkId[];
  findings: Finding[];
  summary: EvaluatedAuditSummary;
  sourceHash: string;
  evaluatedAt: string;
}

// Map rule parameter dependencies to retrieve evidence
const RULE_EVIDENCE_MAP: Record<string, string> = {
  "CTRL-SSH-V2": "sshVersion",
  "CTRL-TELNET-OFF": "telnetEnabled",
  "CTRL-HTTP-OFF": "httpServerEnabled",
  "CTRL-PASS-ENCRYPT": "passwordEncryptionEnabled",
  "CTRL-AAA-AUTH": "aaaAuthEnabled",
  "CTRL-SNMP-V3": "snmpVersion",
  "CTRL-SYSLOG-SIEM": "syslogServers",
  "CTRL-IDLE-TIMEOUT": "sessionIdleTimeoutMinutes",
  "CTRL-NTP-SYNC": "ntpConfigured",
  "CTRL-LOGIN-BANNER": "loginBannerConfigured",
};

export function evaluateNormalizedConfig(
  config: NormalizedConfig,
  selectedFrameworks: FrameworkId[] = ["cis_v8"]
): EngineEvaluationResult {
  const frameworksToRun: FrameworkId[] = selectedFrameworks.length > 0 ? selectedFrameworks : ["cis_v8"];
  const matchingRules = COMPLIANCE_RULES.filter((r) => frameworksToRun.includes(r.framework));

  const findings: Finding[] = [];

  for (const rule of matchingRules) {
    const status = rule.evaluate(config.parameters);
    const paramKey = rule.controlGroupId ? RULE_EVIDENCE_MAP[rule.controlGroupId] : undefined;
    const evidenceLines = (paramKey && config.evidence[paramKey]) || [];
    const remediationCommand = rule.remediation[config.vendor] || "Vendor remediation not configured";

    findings.push({
      ruleId: rule.id,
      ruleTitle: rule.title,
      framework: rule.framework,
      controlGroupId: rule.controlGroupId,
      status,
      severity: rule.severity,
      evidenceLines,
      remediationCommand,
      frameworkRef: rule.frameworkRef,
    });
  }

  // Deduplicate by controlGroupId for §6.4 multi-framework double-count fix
  const seenControlGroups = new Set<string>();
  let dedupPassed = 0;
  let dedupFailed = 0;
  let dedupNotApp = 0;
  let dedupCritical = 0;
  let dedupHigh = 0;
  let dedupMedium = 0;
  let dedupLow = 0;

  for (const f of findings) {
    const dedupKey = f.controlGroupId || f.ruleId;
    if (seenControlGroups.has(dedupKey)) {
      continue;
    }
    seenControlGroups.add(dedupKey);

    if (f.status === "pass") dedupPassed++;
    else if (f.status === "fail") dedupFailed++;
    else dedupNotApp++;

    if (f.status === "fail") {
      if (f.severity === "critical") dedupCritical++;
      else if (f.severity === "high") dedupHigh++;
      else if (f.severity === "medium") dedupMedium++;
      else if (f.severity === "low") dedupLow++;
    }
  }

  const dedupTotal = dedupPassed + dedupFailed;
  const complianceScore = dedupTotal > 0 ? Math.round((dedupPassed / dedupTotal) * 100) : 100;

  const summary: EvaluatedAuditSummary = {
    totalFindings: findings.length,
    deduplicatedControls: seenControlGroups.size,
    passed: dedupPassed,
    failed: dedupFailed,
    notApplicable: dedupNotApp,
    complianceScore,
    criticalCount: dedupCritical,
    highCount: dedupHigh,
    mediumCount: dedupMedium,
    lowCount: dedupLow,
  };

  return {
    deviceId: config.deviceId,
    vendor: config.vendor,
    frameworks: frameworksToRun,
    findings,
    summary,
    sourceHash: config.sourceHash,
    evaluatedAt: new Date().toISOString(),
  };
}
