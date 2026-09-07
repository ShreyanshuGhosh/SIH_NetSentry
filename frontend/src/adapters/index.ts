// src/adapters/index.ts
// Unified Vendor Adapter Registry and Auto-Detector (§0.2, §0.4)

import { SupportedVendor } from "../types/canonical";
import { VendorAdapter, VendorDetectionResult } from "./types";
import { CiscoIosAdapter } from "./ciscoIosAdapter";
import { JuniperJunosAdapter } from "./juniperJunosAdapter";
import { PaloAltoPanosAdapter } from "./paloAltoPanosAdapter";
import { SonicAdapter } from "./sonicAdapter";
import { FortinetFortiosAdapter } from "./fortinetFortiosAdapter";
import { AristaEosAdapter } from "./aristaEosAdapter";

export const VENDOR_ADAPTERS: Record<SupportedVendor, VendorAdapter> = {
  cisco_ios: CiscoIosAdapter,
  juniper_junos: JuniperJunosAdapter,
  palo_alto_panos: PaloAltoPanosAdapter,
  sonic: SonicAdapter,
  fortinet_fortios: FortinetFortiosAdapter,
  arista_eos: AristaEosAdapter,
};

export function normalizeVendorId(vendorId: string): SupportedVendor {
  const normalized = (vendorId || "").toLowerCase().trim();
  if (normalized === "palo_alto" || normalized === "palo_alto_panos" || normalized === "panos" || normalized === "paloalto") {
    return "palo_alto_panos";
  }
  if (normalized === "sonic" || normalized === "sonic_whitebox" || normalized === "sonic_linux") {
    return "sonic";
  }
  if (normalized === "cisco" || normalized === "cisco_ios" || normalized === "ios" || normalized === "ios_xe") {
    return "cisco_ios";
  }
  if (normalized === "juniper" || normalized === "juniper_junos" || normalized === "junos") {
    return "juniper_junos";
  }
  if (normalized === "fortinet" || normalized === "fortinet_fortios" || normalized === "fortios") {
    return "fortinet_fortios";
  }
  if (normalized === "arista" || normalized === "arista_eos" || normalized === "eos") {
    return "arista_eos";
  }
  return vendorId as SupportedVendor;
}

export function getAdapter(vendorId: SupportedVendor | string): VendorAdapter {
  const normalized = normalizeVendorId(vendorId);
  const adapter = VENDOR_ADAPTERS[normalized];
  if (!adapter) {
    throw new Error(`Unsupported vendor adapter ID: ${vendorId} (normalized: ${normalized})`);
  }
  return adapter;
}

export function detectVendorFromConfig(rawConfig: string): VendorDetectionResult {
  let highestConfidence = 0;
  let bestMatch: SupportedVendor = "cisco_ios";
  let bestDialect = "IOS-XE";
  let bestSignatures: string[] = [];

  for (const [vendorId, adapter] of Object.entries(VENDOR_ADAPTERS)) {
    const res = adapter.detect(rawConfig);
    if (res.confidence > highestConfidence) {
      highestConfidence = res.confidence;
      bestMatch = vendorId as SupportedVendor;
      bestDialect = adapter.dialect;
      bestSignatures = res.signatures;
    }
  }

  // If no match above 0.35, return unrecognized state
  return {
    vendor: bestMatch,
    dialect: bestDialect,
    confidence: highestConfidence > 0 ? highestConfidence : 0.2,
    matchedSignatures: bestSignatures,
  };
}
