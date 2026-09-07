// src/adapters/paloAltoPanosAdapter.ts
// Palo Alto PAN-OS Deterministic Parser (Green Lane) + Amber Lane Fallback

import { FewShotExemplar, NormalizedConfig } from "../types/canonical";
import { AdapterParseOptions, AIParseResult, VendorAdapter } from "./types";
import { getNumberedLines, matchExemplars, redactSecretsInMemory } from "./adapterUtils";

export const PaloAltoPanosAdapter: VendorAdapter = {
  vendorId: "palo_alto_panos",
  name: "Palo Alto Networks",
  dialect: "PAN-OS",

  detect(rawConfig: string): { confidence: number; signatures: string[] } {
    const signatures: string[] = [];
    const text = rawConfig.toLowerCase();

    if (text.includes("set deviceconfig system") || text.includes("set shared log-settings")) {
      signatures.push("PAN-OS Set CLI Syntax");
    }
    if (text.includes("disable-telnet") || text.includes("disable-http")) {
      signatures.push("PAN-OS System Service Hardening");
    }
    if (text.includes("authentication-profile") || text.includes("mgt-config users")) {
      signatures.push("PAN-OS AAA and User Management");
    }

    const confidence = signatures.length >= 2 ? 0.98 : signatures.length === 1 ? 0.65 : 0.05;
    return { confidence, signatures };
  },

  parse(rawConfig: string, options?: AdapterParseOptions): NormalizedConfig {
    const { redactedText, sourceHash } = redactSecretsInMemory(rawConfig);
    const lines = getNumberedLines(redactedText);

    const parameters: Record<string, boolean | number | string | null> = {
      sshVersion: null,
      telnetEnabled: null,
      httpServerEnabled: null,
      passwordEncryptionEnabled: null,
      aaaAuthEnabled: null,
      snmpVersion: "v3", // Default for modern PAN-OS
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

      // SSH Version
      if (/ssh-version\s+2/i.test(line)) {
        parameters.sshVersion = 2;
        evidence.sshVersion = [item];
      } else if (/ssh-version\s+1/i.test(line)) {
        parameters.sshVersion = 1;
        evidence.sshVersion = [item];
      }

      // Telnet Disabled
      if (/disable-telnet\s+yes/i.test(line)) {
        parameters.telnetEnabled = false;
        evidence.telnetEnabled = [item];
      } else if (/disable-telnet\s+no/i.test(line)) {
        parameters.telnetEnabled = true;
        evidence.telnetEnabled = [item];
      }

      // HTTP Server Disabled
      if (/disable-http\s+yes/i.test(line)) {
        parameters.httpServerEnabled = false;
        evidence.httpServerEnabled = [item];
      } else if (/disable-http\s+no/i.test(line)) {
        parameters.httpServerEnabled = true;
        evidence.httpServerEnabled = [item];
      }

      // Password Encryption ($1$ or hashed)
      if (/password\s+\$1\$/i.test(line) || /phash/i.test(line)) {
        parameters.passwordEncryptionEnabled = true;
        evidence.passwordEncryptionEnabled = [item];
      }

      // AAA Profile
      if (/authentication-profile\s+\S+\s+method\s+(radius|tacacs)/i.test(line)) {
        parameters.aaaAuthEnabled = true;
        evidence.aaaAuthEnabled = [item];
      }

      // Syslog
      if (/syslog\s+\S+\s+server\s+([0-9.]+)/i.test(line)) {
        const m = line.match(/server\s+([0-9.]+)/i);
        if (m) {
          parameters.syslogServers = m[1];
          evidence.syslogServers = [item];
        }
      }

      // Idle Timeout
      if (/idle-timeout\s+(\d+)/i.test(line)) {
        const m = line.match(/idle-timeout\s+(\d+)/i);
        if (m) {
          parameters.sessionIdleTimeoutMinutes = parseInt(m[1], 10);
          evidence.sessionIdleTimeoutMinutes = [item];
        }
      }

      // NTP
      if (/ntp-servers\s+primary-ntp-server\s+([0-9.]+)/i.test(line)) {
        parameters.ntpConfigured = true;
        evidence.ntpConfigured = [item];
      }

      // Login banner
      if (/login-banner\s+["'].*["']/i.test(line)) {
        parameters.loginBannerConfigured = true;
        evidence.loginBannerConfigured = [item];
      }
    }

    if (parameters.sshVersion === null) parameters.sshVersion = 2; // Default PAN-OS

    return {
      deviceId: options?.deviceId || "palo-alto-pa3220",
      vendor: "palo_alto_panos",
      platform: options?.platform || "PA-3220 NGFW",
      osVersion: options?.osVersion || "PAN-OS 11.0.2-h3",
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
      "palo_alto_panos"
    );

    return {
      partial: resolved,
      confidence: Object.keys(resolved).length > 0 ? 0.94 : 0.45,
      stillUnresolvedLines: stillUnresolved,
      resolvedViaExemplars,
    };
  },
};
