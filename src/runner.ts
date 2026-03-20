import type { WorkflowGraph, Rule, ScanResult, Severity, Finding } from "./types.js";
import { SEVERITY_ORDER } from "./types.js";

export function runScan(graphs: WorkflowGraph[], rules: Rule[]): ScanResult {
  const findings: Finding[] = [];

  for (const graph of graphs) {
    for (const rule of rules) {
      findings.push(...rule.run(graph));
    }
  }

  findings.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

  const summary: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of findings) {
    summary[f.severity]++;
  }

  return {
    files: graphs.length,
    findings,
    summary,
  };
}
