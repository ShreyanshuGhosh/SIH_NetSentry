// src/adapters/ciscoIosAdapter.ts
// Cisco IOS / IOS-XE Deterministic Parser (Green Lane) + Amber Lane Fallback

import { FewShotExemplar, NormalizedConfig } from "../types/canonical";
import { AdapterParseOptions, AIParseResult, VendorAdapter } from "./types";
import { getNumberedLines, matchExemplars, redactSecretsInMemory } from "./adapterUtils";

export const CiscoIosAdapter: VendorAdapter = {
  vendorId: "cisco_ios",
  name: "Cisco Systems",
  dialect: "IOS-XE",

  detect(rawConfig: string): { confidence: number; signatures: string[] } {
    const signatures: string[] = [];
    const text = rawConfig.toLowerCase();

    if (text.includes("version 17.") || text.includes("version 16.") || text.includes("ios-xe")) {
      signatures.push("IOS-XE Version Header");
    }
    if (text.includes("service timestamps") || text.includes("service password-encryption")) {
      signatures.push("Cisco System Services");
    }
    if (text.includes("line vty") || text.includes("line con 0")) {
      signatures.push("Cisco Line Terminal Syntax");
    }
    if (text.includes("boot-start-marker") || text.includes("aaa new-model")) {
      signatures.push("Cisco Bootstrap/AAA Model");
    }

    const confidence = signatures.length >= 3 ? 0.98 : signatures.length >= 2 ? 0.85 : signatures.length === 1 ? 0.45 : 0.05;
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
      snmpVersion: null,
      syslogServers: null,
      sessionIdleTimeoutMinutes: null,
      ntpConfigured: null,
      loginBannerConfigured: null,
    };

    const evidence: Record<string, { line: number; raw: string }[]> = {};
    const unresolved: { line: number; raw: string }[] = [];

    let insideVty = false;
    let vtyTransportSsh = false;
    let vtyTransportTelnet = false;
    let vtyTimeout: number | null = null;
    let hasServicePasswordEncryption = false;
    let hasNoServicePasswordEncryption = false;

    for (const item of lines) {
      const line = item.raw.trim();
      if (!line || line.startsWith("!") || line === "end") continue;

      // Line VTY block tracking
      if (/^line\s+vty\s+/i.test(line)) {
        insideVty = true;
        continue;
      }
      if (insideVty && /^(line\s+|interface\s+|router\s+|ip\s+route)/i.test(line)) {
        insideVty = false;
      }

      if (insideVty) {
        if (/transport\s+input\s+.*ssh/i.test(line)) {
          vtyTransportSsh = true;
          evidence.telnetEnabled = (evidence.telnetEnabled || []).concat(item);
        }
        if (/transport\s+input\s+.*telnet/i.test(line) || /transport\s+input\s+all/i.test(line)) {
          vtyTransportTelnet = true;
          evidence.telnetEnabled = (evidence.telnetEnabled || []).concat(item);
        }
        const timeoutMatch = line.match(/exec-timeout\s+(\d+)\s+(\d+)/i);
        if (timeoutMatch) {
          vtyTimeout = parseInt(timeoutMatch[1], 10);
          evidence.sessionIdleTimeoutMinutes = [item];
        }
        continue;
      }

      // SSH Version
      if (/^ip\s+ssh\s+version\s+2/i.test(line)) {
        parameters.sshVersion = 2;
        evidence.sshVersion = [item];
      } else if (/^ip\s+ssh\s+version\s+1/i.test(line)) {
        parameters.sshVersion = 1;
        evidence.sshVersion = [item];
      }

      // HTTP Server
      if (/^no\s+ip\s+http\s+server/i.test(line)) {
        parameters.httpServerEnabled = false;
        evidence.httpServerEnabled = [item];
      } else if (/^ip\s+http\s+server/i.test(line)) {
        parameters.httpServerEnabled = true;
        evidence.httpServerEnabled = [item];
      }

      // Password encryption
      if (/^service\s+password-encryption/i.test(line)) {
        hasServicePasswordEncryption = true;
        evidence.passwordEncryptionEnabled = [item];
      } else if (/^no\s+service\s+password-encryption/i.test(line)) {
        hasNoServicePasswordEncryption = true;
        evidence.passwordEncryptionEnabled = [item];
      }

      // AAA Authentication
      if (/^aaa\s+new-model/i.test(line) || /^aaa\s+authentication/i.test(line)) {
        parameters.aaaAuthEnabled = true;
        evidence.aaaAuthEnabled = (evidence.aaaAuthEnabled || []).concat(item);
      }

      // SNMP Version
      if (/snmp-server\s+group\s+\S+\s+v3/i.test(line) || /snmp-server\s+user\s+\S+\s+\S+\s+v3/i.test(line)) {
        parameters.snmpVersion = "v3";
        evidence.snmpVersion = [item];
      } else if (/snmp-server\s+community\s+\S+\s+(?:ro|rw)/i.test(line) && parameters.snmpVersion !== "v3") {
        parameters.snmpVersion = "v2c";
        evidence.snmpVersion = [item];
      }

      // Syslog
      if (/^logging\s+host\s+([0-9.]+)/i.test(line)) {
        const m = line.match(/^logging\s+host\s+([0-9.]+)/i);
        if (m) {
          parameters.syslogServers = m[1];
          evidence.syslogServers = [item];
        }
      }

      // NTP
      if (/^ntp\s+server\s+/i.test(line)) {
        parameters.ntpConfigured = true;
        evidence.ntpConfigured = (evidence.ntpConfigured || []).concat(item);
      }

      // Banner
      if (/^banner\s+(login|motd)/i.test(line)) {
        parameters.loginBannerConfigured = true;
        evidence.loginBannerConfigured = [item];
      }
    }

    // Resolve compound parameters
    if (vtyTransportTelnet) {
      parameters.telnetEnabled = true;
    } else if (vtyTransportSsh) {
      parameters.telnetEnabled = false;
    }

    if (vtyTimeout !== null) {
      parameters.sessionIdleTimeoutMinutes = vtyTimeout;
    }

    if (hasNoServicePasswordEncryption) {
      parameters.passwordEncryptionEnabled = false;
    } else if (hasServicePasswordEncryption) {
      parameters.passwordEncryptionEnabled = true;
    }

    return {
      deviceId: options?.deviceId || "cisco-core-01",
      vendor: "cisco_ios",
      platform: options?.platform || "Catalyst 9300",
      osVersion: options?.osVersion || "IOS-XE 17.9.4a",
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
      "cisco_ios"
    );

    return {
      partial: resolved,
      confidence: Object.keys(resolved).length > 0 ? 0.94 : 0.45,
      stillUnresolvedLines: stillUnresolved,
      resolvedViaExemplars,
    };
  },
};
