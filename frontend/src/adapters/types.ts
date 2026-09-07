// src/adapters/types.ts
// Phase 0: Vendor Adapter Interface Specification (§0.2, §6.2)

import { FewShotExemplar, NormalizedConfig, SupportedVendor } from "../types/canonical";

export interface VendorDetectionResult {
  vendor: SupportedVendor;
  dialect: string;
  confidence: number;
  matchedSignatures: string[];
}

export interface AdapterParseOptions {
  deviceId?: string;
  platform?: string;
  osVersion?: string;
}

export interface AIParseResult {
  partial: Record<string, boolean | number | string | null>;
  confidence: number;
  stillUnresolvedLines: string[];
  resolvedViaExemplars: {
    line: number;
    raw: string;
    fieldKey: string;
    exemplarId: string;
  }[];
}

export interface VendorAdapter {
  vendorId: SupportedVendor;
  name: string;
  dialect: string;
  detect(rawConfig: string): { confidence: number; signatures: string[] };
  parse(rawConfig: string, options?: AdapterParseOptions): NormalizedConfig;
  parseWithAI(
    rawConfig: string,
    unresolvedLines: string[],
    exemplars: FewShotExemplar[]
  ): AIParseResult;
}
