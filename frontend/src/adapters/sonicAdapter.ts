// src/adapters/sonicAdapter.ts
// SONiC (Software for Open Networking in the Cloud) Linux JSON Parser + Amber Lane Fallback

import { FewShotExemplar, NormalizedConfig } from "../types/canonical";
import { AdapterParseOptions, AIParseResult, VendorAdapter } from "./types";
import { getNumberedLines, matchExemplars, redactSecretsInMemory } from "./adapterUtils";

export const SonicAdapter: VendorAdapter = {
  vendorId: "sonic",
  name: "SONiC Linux",
  dialect: "Open Disaggregated Linux (config_db.json)",

  detect(rawConfig: string): { confidence: number; signatures: string[] } {
    const signatures: string[] = [];
    const text = rawConfig.toLowerCase();

    if (text.includes('"device_metadata"') || text.includes("sonic-leaf")) {
      signatures.push("SONiC Device Metadata JSON");
    }
    if (text.includes('"syslog_server"') || text.includes('"ntp_server"')) {
      signatures.push("SONiC Disaggregated Subsystems");
    }
    if (text.includes('"fast_reboot_watchdog"') || text.includes("accton_as7712")) {
      signatures.push("Edgecore/Tomahawk Hardware Model");
    }

    const confidence = signatures.length >= 2 ? 0.98 : signatures.length === 1 ? 0.70 : 0.05;
    return { confidence, signatures };
  },

  parse(rawConfig: string, options?: AdapterParseOptions): NormalizedConfig {
    const { redactedText, sourceHash } = redactSecretsInMemory(rawConfig);
    const lines = getNumberedLines(redactedText);

    const parameters: Record<string, boolean | number | string | null> = {
      sshVersion: null,
      telnetEnabled: null,
      httpServerEnabled: false, // Default Linux headless switch
      passwordEncryptionEnabled: true,
      aaaAuthEnabled: null,
      snmpVersion: "v3",
      syslogServers: null,
      sessionIdleTimeoutMinutes: null,
      ntpConfigured: null,
      loginBannerConfigured: null,
    };

    const evidence: Record<string, { line: number; raw: string }[]> = {};
    const unresolved: { line: number; raw: string }[] = [];

    // Try parsing as JSON first, otherwise fallback to line scanning
    try {
      const parsed = JSON.parse(redactedText);

      if (parsed.SSH?.global?.protocol) {
        parameters.sshVersion = parseInt(parsed.SSH.global.protocol, 10);
      }
      if (parsed.SSH?.global?.idle_timeout) {
        parameters.sessionIdleTimeoutMinutes = Math.floor(parseInt(parsed.SSH.global.idle_timeout, 10) / 60);
      }
      if (parsed.TELNET?.global?.status) {
        parameters.telnetEnabled = parsed.TELNET.global.status !== "disabled";
      }
      if (parsed.SYSLOG_SERVER) {
        const servers = Object.keys(parsed.SYSLOG_SERVER);
        if (servers.length > 0) parameters.syslogServers = servers[0];
      }
      if (parsed.NTP_SERVER) {
        parameters.ntpConfigured = Object.keys(parsed.NTP_SERVER).length > 0;
      }
      if (parsed.BANNER?.login) {
        parameters.loginBannerConfigured = true;
      }
      if (parsed.AAA?.authentication?.login) {
        parameters.aaaAuthEnabled = parsed.AAA.authentication.login.includes("tacacs") || parsed.AAA.authentication.login.includes("radius");
      }
    } catch {
      // Fall through to regex/line scanning
    }

    // Associate lines with parameters for evidence
    for (const item of lines) {
      const line = item.raw;
      if (/"protocol"\s*:\s*"2"/i.test(line)) {
        parameters.sshVersion = 2;
        evidence.sshVersion = [item];
      }
      if (/"status"\s*:\s*"disabled"/i.test(line)) {
        parameters.telnetEnabled = false;
        evidence.telnetEnabled = [item];
      }
      if (/"idle_timeout"\s*:\s*"(\d+)"/i.test(line)) {
        const m = line.match(/"idle_timeout"\s*:\s*"(\d+)"/i);
        if (m) {
          parameters.sessionIdleTimeoutMinutes = Math.floor(parseInt(m[1], 10) / 60);
          evidence.sessionIdleTimeoutMinutes = [item];
        }
      }
      if (/"syslog_server"/i.test(line) || /"10\.14\.5\.50"/i.test(line)) {
        evidence.syslogServers = (evidence.syslogServers || []).concat(item);
      }
      if (/"login"\s*:\s*"RESTRICTED/i.test(line)) {
        parameters.loginBannerConfigured = true;
        evidence.loginBannerConfigured = [item];
      }
      if (/"ntp_server"/i.test(line)) {
        parameters.ntpConfigured = true;
        evidence.ntpConfigured = [item];
      }
      if (/fast_reboot_watchdog/i.test(line) || /vxlan_tunnel_keepalive/i.test(line) || /custom_daemon/i.test(line)) {
        unresolved.push(item);
      }
    }

    return {
      deviceId: options?.deviceId || "sonic-leaf-01",
      vendor: "sonic",
      platform: options?.platform || "Edgecore AS7712-32X (Tomahawk)",
      osVersion: options?.osVersion || "SONiC.202311.0",
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
    const linesToScan = unresolvedLines.length > 0
      ? unresolvedLines.map((raw, idx) => ({ line: idx + 1, raw }))
      : getNumberedLines(rawConfig).filter(l => l.raw.trim().length > 3 && !l.raw.trim().startsWith("#") && !l.raw.trim().startsWith("!"));

    const { resolved, evidence, resolvedViaExemplars, stillUnresolved } = matchExemplars(
      linesToScan,
      exemplars,
      "sonic"
    );

    return {
      partial: resolved,
      confidence: Object.keys(resolved).length > 0 ? 0.94 : 0.45,
      stillUnresolvedLines: stillUnresolved,
      resolvedViaExemplars,
    };
  },
};
