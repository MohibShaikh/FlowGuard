import { describe, it, expect } from "vitest";
import { formatTerminal } from "../../src/formatters/terminal";
import type { ScanResult } from "../../src/types";

describe("Terminal formatter", () => {
  it("includes finding title and node name", () => {
    const result: ScanResult = {
      files: 1,
      findings: [
        {
          ruleId: "test", severity: "critical", title: "Test Finding",
          message: "Something is wrong with MyNode",
          location: { workflow: "wf.json", nodeName: "MyNode", nodeType: "n8n-nodes-base.code" },
          remediation: "Fix it", owaspCategory: "A01",
        },
      ],
      summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0 },
    };
    const output = formatTerminal(result);
    expect(output).toContain("Test Finding");
    expect(output).toContain("MyNode");
    expect(output).toContain("Fix it");
  });

  it("includes summary line", () => {
    const result: ScanResult = {
      files: 2,
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    };
    const output = formatTerminal(result);
    expect(output).toContain("Found 0 issues");
  });

  it("groups findings by workflow file", () => {
    const result: ScanResult = {
      files: 2,
      findings: [
        {
          ruleId: "r", severity: "high", title: "T", message: "m",
          location: { workflow: "a.json" }, owaspCategory: "A01",
        },
        {
          ruleId: "r", severity: "high", title: "T", message: "m",
          location: { workflow: "b.json" }, owaspCategory: "A01",
        },
      ],
      summary: { critical: 0, high: 2, medium: 0, low: 0, info: 0 },
    };
    const output = formatTerminal(result);
    expect(output).toContain("a.json");
    expect(output).toContain("b.json");
  });
});
