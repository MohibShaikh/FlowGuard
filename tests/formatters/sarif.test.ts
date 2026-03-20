import { describe, it, expect } from "vitest";
import { formatSarif } from "../../src/formatters/sarif";
import { allRules } from "../../src/rules/index";
import type { ScanResult } from "../../src/types";

describe("SARIF formatter", () => {
  it("produces valid SARIF v2.1.0 structure", () => {
    const result: ScanResult = {
      files: 1,
      findings: [
        {
          ruleId: "excessive-agency", severity: "high", title: "Excessive Agency",
          message: "test msg", location: { workflow: "wf.json", nodeName: "Node1" },
          owaspCategory: "A01",
        },
      ],
      summary: { critical: 0, high: 1, medium: 0, low: 0, info: 0 },
    };
    const output = JSON.parse(formatSarif(result, allRules));

    expect(output.$schema).toBe("https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json");
    expect(output.version).toBe("2.1.0");
    expect(output.runs).toHaveLength(1);
    expect(output.runs[0].tool.driver.name).toBe("FlowGuard");
    expect(output.runs[0].tool.driver.rules.length).toBeGreaterThan(0);
    expect(output.runs[0].results).toHaveLength(1);
  });

  it("maps severity to SARIF level correctly", () => {
    const result: ScanResult = {
      files: 1,
      findings: [
        {
          ruleId: "r", severity: "critical", title: "t", message: "m",
          location: { workflow: "wf.json" }, owaspCategory: "A01",
        },
        {
          ruleId: "r", severity: "medium", title: "t", message: "m",
          location: { workflow: "wf.json" }, owaspCategory: "A01",
        },
        {
          ruleId: "r", severity: "info", title: "t", message: "m",
          location: { workflow: "wf.json" }, owaspCategory: "A01",
        },
      ],
      summary: { critical: 1, high: 0, medium: 1, low: 0, info: 1 },
    };
    const output = JSON.parse(formatSarif(result, allRules));
    expect(output.runs[0].results[0].level).toBe("error");
    expect(output.runs[0].results[1].level).toBe("warning");
    expect(output.runs[0].results[2].level).toBe("note");
  });

  it("includes artifact location for workflow file", () => {
    const result: ScanResult = {
      files: 1,
      findings: [
        {
          ruleId: "r", severity: "high", title: "t", message: "m",
          location: { workflow: "path/to/workflow.json" }, owaspCategory: "A01",
        },
      ],
      summary: { critical: 0, high: 1, medium: 0, low: 0, info: 0 },
    };
    const output = JSON.parse(formatSarif(result, allRules));
    expect(output.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri).toBe("path/to/workflow.json");
  });
});
