// src/adapters/juniperJunosAdapter.ts
// Juniper JunOS Deterministic Parser (Green Lane) + Amber Lane Fallback

import { FewShotExemplar, NormalizedConfig } from "../types/canonical";
import { AdapterParseOptions, AIParseResult, VendorAdapter } from "./types";
import { getNumberedLines, matchExemplars, redactSecretsInMemory } from "./adapterUtils";

export const JuniperJunosAdapter: VendorAdapter = {
  vendorId: "juniper_junos",
  name: "Juniper Networks",
  dialect: "JunOS",

  detect(rawConfig: string): { confidence: number; signatures: string[] } {
    const signatures: string[] = [];
    const text = rawConfig.toLowerCase();

    if (text.includes("version 22.") || text.includes("version 21.") || text.includes("junos")) {
      signatures.push("JunOS Version Statement");
    }
    if (text.includes("system {") || text.includes("set system")) {
      signatures.push("JunOS System Hierarchy Block");
    }
    if (text.includes("root-authentication") || text.includes("authentication-order")) {
      signatures.push("JunOS Authentication Directives");
    }
    if (text.includes("host-name ") || text.includes("services { ssh")) {
      signatures.push("JunOS Hierarchical Services");
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

    let insideTelnetBlock = false;
    let telnetFound = false;

    for (let i = 0; i < lines.length; i++) {
      const item = lines[i];
      const line = item.raw.trim();
      if (!line || line.startsWith("##") || line.startsWith("/*")) continue;

      // SSH Protocol Version
      if (/protocol-version\s+v2;/i.test(line) || /set\s+system\s+services\s+ssh\s+protocol-version\s+v2/i.test(line)) {
        parameters.sshVersion = 2;
        evidence.sshVersion = [item];
      } else if (/protocol-version\s+v1;/i.test(line)) {
        parameters.sshVersion = 1;
        evidence.sshVersion = [item];
      }

      // Telnet Daemon detection
      if (/telnet\s*\{/i.test(line) || /set\s+system\s+services\s+telnet/i.test(line)) {
        telnetFound = true;
        insideTelnetBlock = true;
        evidence.telnetEnabled = [item];
      }
      if (insideTelnetBlock && line.includes("}")) {
        insideTelnetBlock = false;
      }

      // Web management / HTTP
      if (/web-management/i.test(line)) {
        if (/http\s*\{/i.test(line) && !/https/i.test(line)) {
          parameters.httpServerEnabled = true;
          evidence.httpServerEnabled = [item];
        } else if (/https\s*\{/i.test(line)) {
          parameters.httpServerEnabled = false;
          evidence.httpServerEnabled = [item];
        }
      }

      // Password Encryption (JunOS $6$ or $9$ encrypted passwords)
      if (/encrypted-password\s+["']\$[569]\$/i.test(line)) {
        parameters.passwordEncryptionEnabled = true;
        evidence.passwordEncryptionEnabled = [item];
      }

      // AAA Authentication
      if (/authentication-order\s+.*password/i.test(line) || /tacplus/i.test(line) || /radius/i.test(line)) {
        parameters.aaaAuthEnabled = true;
        evidence.aaaAuthEnabled = [item];
      }

      // SNMP Version
      if (/v3\s*\{/i.test(line) || /usm\s*\{/i.test(line)) {
        parameters.snmpVersion = "v3";
        evidence.snmpVersion = [item];
      } else if (/community\s+/i.test(line) && !parameters.snmpVersion) {
        parameters.snmpVersion = "v2c";
        evidence.snmpVersion = [item];
      }

      // Syslog
      if (/host\s+([0-9.]+)\s*\{/i.test(line)) {
        const m = line.match(/host\s+([0-9.]+)/i);
        if (m) {
          parameters.syslogServers = m[1];
          evidence.syslogServers = [item];
        }
      }

      // NTP
      if (/server\s+([0-9.]+);/i.test(line)) {
        parameters.ntpConfigured = true;
        evidence.ntpConfigured = (evidence.ntpConfigured || []).concat(item);
      }

      // Banner / login message
      if (/message\s+["'].*["'];/i.test(line)) {
        parameters.loginBannerConfigured = true;
        evidence.loginBannerConfigured = [item];
      }

      // Session Idle Timeout
      if (/idle-timeout\s+(\d+);/i.test(line)) {
        const m = line.match(/idle-timeout\s+(\d+);/i);
        if (m) {
          parameters.sessionIdleTimeoutMinutes = parseInt(m[1], 10);
          evidence.sessionIdleTimeoutMinutes = [item];
        }
      }
    }

    parameters.telnetEnabled = telnetFound;
    if (parameters.sessionIdleTimeoutMinutes === null) {
      parameters.sessionIdleTimeoutMinutes = 10; // default JunOS template
    }

    return {
      deviceId: options?.deviceId || "juniper-srx-01",
      vendor: "juniper_junos",
      platform: options?.platform || "SRX345 Enterprise Gateway",
      osVersion: options?.osVersion || "Junos 22.4R2-S2.5",
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
      "juniper_junos"
    );

    return {
      partial: resolved,
      confidence: Object.keys(resolved).length > 0 ? 0.94 : 0.45,
      stillUnresolvedLines: stillUnresolved,
      resolvedViaExemplars,
    };
  },
};
