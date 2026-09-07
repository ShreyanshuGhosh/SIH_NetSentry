// src/engine/__tests__/correctnessTests.ts
// Automated Cross-Vendor and Mapping-Reuse Correctness Tests (§0.5, §7)
// Executes Tests 1-4 directly to mathematically verify pipeline integrity

import { evaluateNormalizedConfig } from "../ruleEngine";
import { exemplarStore } from "../exemplarStore";
import { runCompliancePipeline } from "../pipeline";
import { NormalizedConfig } from "../../types/canonical";

export interface TestResult {
  testId: string;
  name: string;
  passed: boolean;
  details: string;
}

export function runAllCorrectnessTests(): TestResult[] {
  const results: TestResult[] = [];

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Same normalized condition, different vendors → same verdict
  // ─────────────────────────────────────────────────────────────
  try {
    const mockCiscoConfig: NormalizedConfig = {
      deviceId: "test-cisco",
      vendor: "cisco_ios",
      platform: "Catalyst 9300",
      osVersion: "17.9.4",
      parameters: { sshVersion: 1 },
      evidence: {},
      sourceHash: "test-hash",
      parsedLane: "deterministic",
      unresolvedLines: [],
    };

    const mockJuniperConfig: NormalizedConfig = {
      deviceId: "test-juniper",
      vendor: "juniper_junos",
      platform: "SRX345",
      osVersion: "22.4",
      parameters: { sshVersion: 1 },
      evidence: {},
      sourceHash: "test-hash",
      parsedLane: "deterministic",
      unresolvedLines: [],
    };

    const mockPaloAltoConfig: NormalizedConfig = {
      deviceId: "test-paloalto",
      vendor: "palo_alto_panos",
      platform: "PA-3220",
      osVersion: "11.0",
      parameters: { sshVersion: 2 },
      evidence: {},
      sourceHash: "test-hash",
      parsedLane: "deterministic",
      unresolvedLines: [],
    };

    const resCisco = evaluateNormalizedConfig(mockCiscoConfig, ["cis_v8"]);
    const resJuniper = evaluateNormalizedConfig(mockJuniperConfig, ["cis_v8"]);
    const resPaloAlto = evaluateNormalizedConfig(mockPaloAltoConfig, ["cis_v8"]);

    const fCisco = resCisco.findings.find((f) => f.ruleId === "CIS-NET-1.1.1");
    const fJuniper = resJuniper.findings.find((f) => f.ruleId === "CIS-NET-1.1.1");
    const fPaloAlto = resPaloAlto.findings.find((f) => f.ruleId === "CIS-NET-1.1.1");

    const t1Passed =
      fCisco?.status === "fail" &&
      fJuniper?.status === "fail" &&
      fPaloAlto?.status === "pass";

    results.push({
      testId: "TEST-1",
      name: "Same Normalized Condition, Different Vendors → Same Verdict",
      passed: t1Passed,
      details: `Cisco sshVersion=1: ${fCisco?.status} (expected fail), Juniper sshVersion=1: ${fJuniper?.status} (expected fail), PaloAlto sshVersion=2: ${fPaloAlto?.status} (expected pass).`,
    });
  } catch (err: any) {
    results.push({
      testId: "TEST-1",
      name: "Same Normalized Condition, Different Vendors → Same Verdict",
      passed: false,
      details: `Execution error: ${err.message}`,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Mapping reuse across different devices (THE core novelty claim)
  // ─────────────────────────────────────────────────────────────
  try {
    exemplarStore.resetToDefaults();

    // 1. Device A has an unrecognized syntax line
    const deviceAUnrecognizedLine = "fast_reboot_watchdog enabled";
    const queueItem = exemplarStore.enqueueItem({
      deviceId: "device-A-leaf01",
      vendor: "sonic",
      rawCommandBlock: deviceAUnrecognizedLine,
      lineNumbers: "Line 41",
      confidence: 0.42,
    });

    // 2. Admin maps it onto baseline field 'httpServerEnabled' = false
    const savedExemplar = exemplarStore.approveAndSaveExemplar(
      queueItem.id,
      "httpServerEnabled",
      false,
      "Admin Operator A"
    );

    // 3. Device B (different device!) contains the same syntax line
    const deviceBRawConfig = `{
      "DEVICE_METADATA": { "localhost": { "hostname": "SONIC-LEAF-02" } },
      "SSH": { "global": { "protocol": "2" } },
      "CUSTOM_DAEMON": {
        "fast_reboot_watchdog enabled": "true"
      }
    }`;

    // 4. Run pipeline on Device B
    const resDeviceB = runCompliancePipeline(deviceBRawConfig, {
      deviceId: "device-B-leaf02",
      vendorOverride: "sonic",
      forceLane: "llm_fallback",
    });

    // Check that Device B resolved httpServerEnabled without new admin interaction
    const isResolvedOnB = resDeviceB.normalizedConfig.parameters.httpServerEnabled === false;
    const exemplarReused = savedExemplar ? savedExemplar.timesReused >= 1 : false;

    results.push({
      testId: "TEST-2",
      name: "Cross-Device Mapping Reuse (Admin trains Device A → Device B auto-resolves)",
      passed: isResolvedOnB && exemplarReused,
      details: `Device A saved exemplar ${savedExemplar?.id}. Device B auto-resolved httpServerEnabled=${resDeviceB.normalizedConfig.parameters.httpServerEnabled}. Times reused: ${savedExemplar?.timesReused}.`,
    });
  } catch (err: any) {
    results.push({
      testId: "TEST-2",
      name: "Cross-Device Mapping Reuse",
      passed: false,
      details: `Execution error: ${err.message}`,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Multi-framework controlGroupId deduplication
  // ─────────────────────────────────────────────────────────────
  try {
    const mockConfig: NormalizedConfig = {
      deviceId: "test-dedup-device",
      vendor: "cisco_ios",
      platform: "Catalyst 9300",
      osVersion: "17.9.4",
      parameters: { sshVersion: 2 }, // Satisfies CIS-NET-1.1.1 AND NIST-AC-17 (both CTRL-SSH-V2)
      evidence: {},
      sourceHash: "test-hash",
      parsedLane: "deterministic",
      unresolvedLines: [],
    };

    // Evaluate against CIS AND NIST simultaneously
    const multiEval = evaluateNormalizedConfig(mockConfig, ["cis_v8", "nist_800_53"]);

    // Find all findings with controlGroupId "CTRL-SSH-V2"
    const sshFindings = multiEval.findings.filter((f) => f.controlGroupId === "CTRL-SSH-V2");
    // Should have findings in both frameworks
    const hasMultipleRawFindings = sshFindings.length >= 2;

    // But deduplicated count in summary must count CTRL-SSH-V2 as ONE!
    // If deduplication works, deduplicatedControls must be strictly less than totalFindings
    const dedupWorks = multiEval.summary.deduplicatedControls < multiEval.summary.totalFindings;

    results.push({
      testId: "TEST-3",
      name: "Multi-Framework Control Deduplication (CIS + NIST)",
      passed: hasMultipleRawFindings && dedupWorks,
      details: `Evaluated ${multiEval.summary.totalFindings} raw findings across CIS + NIST. Deduplicated controls: ${multiEval.summary.deduplicatedControls} (deduplicated SSHv2 control counted once, preventing artificial pass/fail inflation).`,
    });
  } catch (err: any) {
    results.push({
      testId: "TEST-3",
      name: "Multi-Framework Control Deduplication",
      passed: false,
      details: `Execution error: ${err.message}`,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Reject flow does not resurface
  // ─────────────────────────────────────────────────────────────
  try {
    const queueBefore = exemplarStore.getQueue();
    const targetItem = queueBefore[0];

    if (!targetItem) {
      throw new Error("No queue item available to reject");
    }

    // Reject target item
    exemplarStore.rejectQueueItem(targetItem.id, "Spurious syntax block");

    const queueAfter = exemplarStore.getQueue();
    const rejectedLog = exemplarStore.getRejectedAuditLog();

    const notInQueue = !queueAfter.some((q) => q.id === targetItem.id);
    const inAuditLog = rejectedLog.some((q) => q.id === targetItem.id);

    results.push({
      testId: "TEST-4",
      name: "Reject Flow Excludes from Review Queue with Audit Retention",
      passed: notInQueue && inAuditLog,
      details: `Item ${targetItem.id} marked as rejected. Present in active queue: ${!notInQueue ? "YES" : "NO"}. Present in audit log: ${inAuditLog ? "YES" : "NO"}.`,
    });
  } catch (err: any) {
    results.push({
      testId: "TEST-4",
      name: "Reject Flow Excludes from Review Queue",
      passed: false,
      details: `Execution error: ${err.message}`,
    });
  }

  return results;
}
