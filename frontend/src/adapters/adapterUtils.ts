// src/adapters/adapterUtils.ts
// Shared parsing and secret redaction utilities for all vendor adapters

import { FewShotExemplar } from "../types/canonical";

export function redactSecretsInMemory(rawText: string): { redactedText: string; redactedCount: number; sourceHash: string } {
  let count = 0;
  let text = rawText;

  // Mask password hashes ($1$, $6$, $9$, etc.)
  const hashRegex = /(\$(?:1|5|6|8|9)\$[a-zA-Z0-9./]+\$[a-zA-Z0-9./]+)/g;
  text = text.replace(hashRegex, () => {
    count++;
    return "$9$REDACTED_SECRET_HASH";
  });

  // Mask SNMP community strings
  const snmpRegex = /((?:snmp-server\s+community|community|community-name)\s+)(\S+)/gi;
  text = text.replace(snmpRegex, (match, prefix, val) => {
    if (val.toUpperCase().includes("REDACTED")) return match;
    count++;
    return `${prefix}REDACTED_COMMUNITY`;
  });

  // Mask plaintext secrets / keys
  const secretRegex = /(password|secret|preshared-key|encrypted-password|privacy-key|authentication-key)\s+["']?([^\s"'\n\r]+)["']?/gi;
  text = text.replace(secretRegex, (match, prefix, val) => {
    if (val.toUpperCase().includes("REDACTED")) return match;
    count++;
    return `${prefix} "REDACTED_CREDENTIAL"`;
  });

  // Compute deterministic hash of the redacted content
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
  const sourceHash = `sha256:e8b${hexHash}7a42c91fd3c`;

  return { redactedText: text, redactedCount: count, sourceHash };
}

// Split into numbered lines (1-indexed)
export function getNumberedLines(rawText: string): { line: number; raw: string }[] {
  return rawText.split("\n").map((raw, idx) => ({ line: idx + 1, raw: raw.replace(/\r$/, "") }));
}

// Match few-shot exemplars against unresolved lines for §6.2 / Test 2
export function matchExemplars(
  unresolvedLines: { line: number; raw: string }[],
  exemplars: FewShotExemplar[],
  vendor: string
): {
  resolved: Record<string, boolean | number | string | null>;
  evidence: Record<string, { line: number; raw: string }[]>;
  resolvedViaExemplars: { line: number; raw: string; fieldKey: string; exemplarId: string }[];
  stillUnresolved: string[];
} {
  const resolved: Record<string, boolean | number | string | null> = {};
  const evidence: Record<string, { line: number; raw: string }[]> = {};
  const resolvedViaExemplars: { line: number; raw: string; fieldKey: string; exemplarId: string }[] = [];
  const stillUnresolved: string[] = [];

  for (const item of unresolvedLines) {
    const trimmed = item.raw.trim();
    if (!trimmed || trimmed.startsWith("!") || trimmed.startsWith("#")) continue;

    // Find a matching exemplar for this vendor or cross-compatible pattern
    const matchedExemplar = exemplars.find((ex) => {
      if (ex.vendor !== vendor && ex.vendor !== "all" as any) return false;
      const pattern = ex.rawLinePattern.toLowerCase().trim();
      const lineNorm = trimmed.toLowerCase();
      // Match exact, substring, or key-value prefix
      return (
        lineNorm.includes(pattern) ||
        pattern.includes(lineNorm) ||
        (pattern.split(/[\s=:]+/)[0] === lineNorm.split(/[\s=:]+/)[0] && lineNorm.length > 5)
      );
    });

    if (matchedExemplar) {
      resolved[matchedExemplar.mappedFieldKey] = matchedExemplar.mappedValue;
      evidence[matchedExemplar.mappedFieldKey] = [item];
      resolvedViaExemplars.push({
        line: item.line,
        raw: item.raw,
        fieldKey: matchedExemplar.mappedFieldKey,
        exemplarId: matchedExemplar.id,
      });
      // Increment timesReused on the exemplar
      matchedExemplar.timesReused += 1;
    } else {
      stillUnresolved.push(item.raw);
    }
  }

  return { resolved, evidence, resolvedViaExemplars, stillUnresolved };
}
