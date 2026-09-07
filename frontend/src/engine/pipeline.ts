// src/engine/pipeline.ts
// End-to-end Compliance Pipeline Wiring (§0.4, §6.2, §6.3)
// Orchestrates: in-memory redaction -> auto-detect -> Green/Amber parsing -> Rule Engine evaluation

import {
  EngineEvaluationResult,
  evaluateNormalizedConfig,
} from "./ruleEngine";
import { detectVendorFromConfig, getAdapter } from "../adapters";
import { exemplarStore } from "./exemplarStore";
import {
  FrameworkId,
  NormalizedConfig,
  SupportedVendor,
} from "../types/canonical";

export interface PipelineExecutionOptions {
  deviceId?: string;
  vendorOverride?: SupportedVendor;
  frameworks?: FrameworkId[];
  forceLane?: "deterministic" | "llm_fallback" | "auto";
  confidenceGate?: number;
}

export interface PipelineExecutionResult {
  normalizedConfig: NormalizedConfig;
  auditResult: EngineEvaluationResult;
  detectedVendor: SupportedVendor;
  detectionConfidence: number;
  detectionSignatures: string[];
  laneUsed: "deterministic" | "llm_fallback";
  unresolvedCount: number;
  exemplarReusedCount: number;
}

export function runCompliancePipeline(
  rawConfig: string,
  options: PipelineExecutionOptions = {}
): PipelineExecutionResult {
  const {
    deviceId = "device-audit-01",
    vendorOverride,
    frameworks = ["cis_v8"],
    forceLane = "auto",
    confidenceGate = 0.80,
  } = options;

  // Step 1: Auto-detect vendor (unless overridden)
  const detection = detectVendorFromConfig(rawConfig);
  const vendorToUse = vendorOverride || detection.vendor;
  const adapter = getAdapter(vendorToUse);

  // Step 2: Green Lane (Deterministic Parse)
  let normalized = adapter.parse(rawConfig, { deviceId });
  let laneUsed: "deterministic" | "llm_fallback" = "deterministic";
  let exemplarReusedCount = 0;

  // Step 3: Amber Lane Fallback (if forceLane === "llm_fallback" or unresolved lines exist or auto route)
  const exemplars = exemplarStore.getExemplars(vendorToUse);

  if (forceLane === "llm_fallback" || normalized.unresolvedLines.length > 0) {
    const aiResult = adapter.parseWithAI(rawConfig, normalized.unresolvedLines, exemplars);

    // Merge AI extracted partials into normalized config
    normalized = {
      ...normalized,
      parameters: {
        ...normalized.parameters,
        ...aiResult.partial,
      },
      unresolvedLines: aiResult.stillUnresolvedLines,
      parsedLane: Object.keys(aiResult.partial).length > 0 ? "llm_fallback" : "deterministic",
    };
    laneUsed = "llm_fallback";
    exemplarReusedCount = aiResult.resolvedViaExemplars.length;

    // If unresolved lines remain below confidence threshold, enqueue them into Training Queue
    if (aiResult.stillUnresolvedLines.length > 0 && aiResult.confidence < confidenceGate) {
      for (const line of aiResult.stillUnresolvedLines) {
        exemplarStore.enqueueItem({
          deviceId,
          vendor: vendorToUse,
          rawCommandBlock: line,
          lineNumbers: "Dynamic",
          confidence: aiResult.confidence,
        });
      }
    }
  }

  // Step 4: Deterministic Rule Engine Evaluation (rules engine, never the LLM, decides compliance!)
  const auditResult = evaluateNormalizedConfig(normalized, frameworks);

  return {
    normalizedConfig: normalized,
    auditResult,
    detectedVendor: vendorToUse,
    detectionConfidence: detection.confidence,
    detectionSignatures: detection.matchedSignatures,
    laneUsed,
    unresolvedCount: normalized.unresolvedLines.length,
    exemplarReusedCount,
  };
}
