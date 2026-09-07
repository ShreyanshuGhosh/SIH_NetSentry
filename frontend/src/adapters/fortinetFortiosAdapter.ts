// src/adapters/fortinetFortiosAdapter.ts
// Fortinet FortiOS Deterministic Parser (Green Lane) + Amber Lane Fallback

import { FewShotExemplar, NormalizedConfig } from "../types/canonical";
import { AdapterParseOptions, AIParseResult, VendorAdapter } from "./types";
import { getNumberedLines, matchExemplars, redactSecretsInMemory } from "./adapterUtils";

export const FortinetFortiosAdapter: VendorAdapter = {
  vendorId: "fortinet_fortios",
  name: "Fortinet",
  dialect: "FortiOS",

  detect(rawConfig: string): { confidence: number; signatures: string[] } {
    const signatures: string[] = [];
    const text = rawConfig.toLowerCase();

    if (text.includes("config system global") || text.includes("config log syslogd")) {
      signatures.push("FortiOS Block Configuration Hierarchy");
    }
    if (text.includes("admin-telnet-service") || text.includes("admin-http-service")) {
      signatures.push("FortiOS Administrative Daemon Directives");
    }
    if (text.includes("set admintimeout") || text.includes("pre-login-banner")) {
      signatures.push("FortiOS Hardening Attributes");
    }

    const confidence = signatures.length >= 2 ? 0.98 : signatures.length === 1 ? 0.65 : 0.05;
    return { confidence, signatures };
  },

  parse(rawConfig: string, options?: AdapterParseOptions): NormalizedConfig {
    const { redactedText, sourceHash } = redactSecretsInMemory(rawConfig);
    const lines = getNumberedLines(redactedText);

    const parameters: Record<string, boolean | number | string | null> = {
      sshVersion: 2, // FortiOS default SSH version
      telnetEnabled: null,
      httpServerEnabled: null,
      passwordEncryptionEnabled: true,
      aaaAuthEnabled: true,
      snmpVersion: "v3",
      syslogServers: null,
      sessionIdleTimeoutMinutes: null,
      ntpConfigured: null,
      loginBannerConfigured: null,
    };

    const evidence: Record<string, { line: number; raw: string }[]> = {};
    const unresolved: { line: number; raw: string }[] = [];

    for (const item of lines) {
      const line = item.raw.trim();
      if (!line || line.startsWith("#")) continue;

      // Telnet service
      if (/set\s+admin-telnet-service\s+disable/i.test(line)) {
        parameters.telnetEnabled = false;
        evidence.telnetEnabled = [item];
      } else if (/set\s+admin-telnet-service\s+enable/i.test(line)) {
        parameters.telnetEnabled = true;
        evidence.telnetEnabled = [item];
      }

      // HTTP service
      if (/set\s+admin-http-service\s+disable/i.test(line)) {
        parameters.httpServerEnabled = false;
        evidence.httpServerEnabled = [item];
      } else if (/set\s+admin-http-service\s+enable/i.test(line)) {
        parameters.httpServerEnabled = true;
        evidence.httpServerEnabled = [item];
      }

      // Idle timeout
      if (/set\s+admintimeout\s+(\d+)/i.test(line)) {
        const m = line.match(/set\s+admintimeout\s+(\d+)/i);
        if (m) {
          parameters.sessionIdleTimeoutMinutes = parseInt(m[1], 10);
          evidence.sessionIdleTimeoutMinutes = [item];
        }
      }

      // Banner
      if (/set\s+(?:pre|post)-login-banner\s+enable/i.test(line)) {
        parameters.loginBannerConfigured = true;
        evidence.loginBannerConfigured = [item];
      }

      // Syslog server
      if (/set\s+server\s+["']([0-9.]+)["']/i.test(line)) {
        const m = line.match(/set\s+server\s+["']([0-9.]+)["']/i);
        if (m) {
          parameters.syslogServers = m[1];
          evidence.syslogServers = [item];
        }
      }

      // NTP sync
      if (/set\s+ntpsync\s+enable/i.test(line)) {
        parameters.ntpConfigured = true;
        evidence.ntpConfigured = [item];
      }

      // Password encryption
      if (/password\s+ENC/i.test(line)) {
        parameters.passwordEncryptionEnabled = true;
        evidence.passwordEncryptionEnabled = [item];
      }
    }

    return {
      deviceId: options?.deviceId || "fortinet-fg60f",
      vendor: "fortinet_fortios",
      platform: options?.platform || "FortiGate 60F Edge Appliance",
      osVersion: options?.osVersion || "FortiOS v7.4.2 build2573",
      parameters,
      evidence,
      sourceHash,
      parsedLane: "deterministic",
      unresolvedLines: unresolved.map((u) => u.raw),
    };
  },

  parseWithAI(
    rawConfig: string,
    unresolvedLines: string[],
    exemplars: FewShotExemplar[]
  ): AIParseResult {
    const linesWithNumbers = unresolvedLines.map((raw, idx) => ({ line: idx + 1, raw }));
    const { resolved, evidence, resolvedViaExemplars, stillUnresolved } = matchExemplars(
      linesWithNumbers,
      exemplars,
      "fortinet_fortios"
    );

    return {
      partial: resolved,
      confidence: Object.keys(resolved).length > 0 ? 0.94 : 0.45,
      stillUnresolvedLines: stillUnresolved,
      resolvedViaExemplars,
    };
  },
};
