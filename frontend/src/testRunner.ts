// src/testRunner.ts
import { runAllCorrectnessTests } from "./engine/__tests__/correctnessTests";

const results = runAllCorrectnessTests();
console.log("=== NETSENTRY CANONICAL ARCHITECTURE CORRECTNESS TESTS ===");
let allPassed = true;
for (const r of results) {
  const mark = r.passed ? "[PASS]" : "[FAIL]";
  console.log(`${mark} ${r.testId}: ${r.name}`);
  console.log(`       Details: ${r.details}`);
  if (!r.passed) allPassed = false;
}
console.log(`\nOVERALL STATUS: ${allPassed ? "ALL 4 CORRECTNESS TESTS PASSED" : "FAILED"}`);
