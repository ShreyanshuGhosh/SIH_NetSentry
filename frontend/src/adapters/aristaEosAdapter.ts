// src/adapters/aristaEosAdapter.ts
// Arista EOS Deterministic Parser (Green Lane) + Amber Lane Fallback

import { FewShotExemplar, NormalizedConfig } from "../types/canonical";
import { AdapterParseOptions, AIParseResult, VendorAdapter } from "./types";
import { getNumberedLines, matchExemplars, redactSecretsInMemory } from "./adapterUtils";

export const AristaEosAdapter: VendorAdapter = {
  vendorId: "arista_eos",
  name: "Arista Networks",
  dialect: "EOS",

  detect(rawConfig: string): { confidence: number; signatures: string[] } {
    const signatures: string[] = [];
    const text = rawConfig.toLowerCase();

    if (text.includes("eos-") || text.includes("arista")) {
      signatures.push("Arista EOS System Header");
    }
    if (text.includes("management ssh") || text.includes("management api http-commands")) {
      signatures.push("Arista Management Subsystem Hierarchy");
    }
    if (text.includes("no management telnet") || text.includes("transceiver qsfp default-mode")) {
      signatures.push("Arista EOS Operational Directives");
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
      snmpVersion: null,
      syslogServers: null,
      sessionIdleTimeoutMinutes: null,
      ntpConfigured: null,
      loginBannerConfigured: null,
    };

    const evidence: Record<string, { line: number; raw: string }[]> = {};
    const unresolved: { line: number; raw: string }[] = [];

    let insideMgmtSsh = false;

    for (const item of lines) {
      const line = item.raw.trim();
      if (!line || line.startsWith("!")) continue;

      if (/^management\s+ssh/i.test(line)) {
        insideMgmtSsh = true;
        continue;
      }
      if (insideMgmtSsh && /^[a-z]/i.test(line) && !line.startsWith(" ")) {
        insideMgmtSsh = false;
      }

      if (insideMgmtSsh) {
        if (/protocol\s+version\s+2/i.test(line)) {
          parameters.sshVersion = 2;
          evidence.sshVersion = [item];
        }
        if (/idle-timeout\s+(\d+)/i.test(line)) {
          const m = line.match(/idle-timeout\s+(\d+)/i);
          if (m) {
            parameters.sessionIdleTimeoutMinutes = parseInt(m[1], 10);
            evidence.sessionIdleTimeoutMinutes = [item];
          }
        }
        continue;
      }

      // Telnet disabled
      if (/^no\s+management\s+telnet/i.test(line)) {
        parameters.telnetEnabled = false;
        evidence.telnetEnabled = [item];
      } else if (/^management\s+telnet/i.test(line)) {
        parameters.telnetEnabled = true;
        evidence.telnetEnabled = [item];
      }

      // HTTP API disabled
      if (/^no\s+management\s+api\s+http-commands/i.test(line)) {
        parameters.httpServerEnabled = false;
        evidence.httpServerEnabled = [item];
      }

      // AAA Auth
      if (/^aaa\s+authentication\s+login\s+default/i.test(line)) {
        parameters.aaaAuthEnabled = true;
        evidence.aaaAuthEnabled = [item];
      }

      // Password encryption (sha512 secret)
      if (/secret\s+sha512/i.test(line) || /secret\s+5/i.test(line)) {
        parameters.passwordEncryptionEnabled = true;
        evidence.passwordEncryptionEnabled = [item];
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
      if (/^banner\s+login/i.test(line)) {
        parameters.loginBannerConfigured = true;
        evidence.loginBannerConfigured = [item];
      }

      // SNMP Version
      if (/snmp-server\s+group\s+\S+\s+v3/i.test(line)) {
        parameters.snmpVersion = "v3";
        evidence.snmpVersion = [item];
      }
    }

    if (parameters.sshVersion === null) parameters.sshVersion = 2; // Default Arista EOS

    return {
      deviceId: options?.deviceId || "arista-7050x-leaf",
      vendor: "arista_eos",
      platform: options?.platform || "Arista 7050X Data Center Leaf Switch",
      osVersion: options?.osVersion || "EOS 4.30.2F",
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
      "arista_eos"
    );

    return {
      partial: resolved,
      confidence: Object.keys(resolved).length > 0 ? 0.94 : 0.45,
      stillUnresolvedLines: stillUnresolved,
      resolvedViaExemplars,
    };
  },
};
