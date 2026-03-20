import { describe, it, expect } from "vitest";
import { runScan } from "../src/runner";
import { buildGraph } from "../src/graph";
import type { Rule, Finding, RawWorkflow } from "../src/types";

const WORKFLOW: RawWorkflow = {
  name: "Test",
  nodes: [{ name: "Webhook", type: "n8n-nodes-base.webhook", parameters: {}, position: [0, 0] }],
  connections: {},
};

function makeRule(id: string, findings: Finding[]): Rule {
  return {
    id,
    title: id,
    description: id,
    severity: "high",
    owaspCategory: "test",
    run: () => findings,
  };
}

describe("runScan", () => {
  it("returns empty findings for no rules", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const result = runScan([graph], []);
    expect(result.findings).toHaveLength(0);
    expect(result.files).toBe(1);
  });

  it("aggregates findings from multiple rules", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const finding1: Finding = {
      ruleId: "rule1", severity: "critical", title: "t", message: "m",
      location: { workflow: "test.json" }, owaspCategory: "test",
    };
    const finding2: Finding = {
      ruleId: "rule2", severity: "low", title: "t", message: "m",
      location: { workflow: "test.json" }, owaspCategory: "test",
    };
    const result = runScan([graph], [makeRule("rule1", [finding1]), makeRule("rule2", [finding2])]);
    expect(result.findings).toHaveLength(2);
  });

  it("sorts findings by severity (critical first)", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const low: Finding = {
      ruleId: "r", severity: "low", title: "t", message: "m",
      location: { workflow: "test.json" }, owaspCategory: "t",
    };
    const critical: Finding = {
      ruleId: "r", severity: "critical", title: "t", message: "m",
      location: { workflow: "test.json" }, owaspCategory: "t",
    };
    const result = runScan([graph], [makeRule("r1", [low]), makeRule("r2", [critical])]);
    expect(result.findings[0].severity).toBe("critical");
    expect(result.findings[1].severity).toBe("low");
  });

  it("produces correct summary counts", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const f1: Finding = {
      ruleId: "r", severity: "high", title: "t", message: "m",
      location: { workflow: "test.json" }, owaspCategory: "t",
    };
    const f2: Finding = {
      ruleId: "r", severity: "high", title: "t", message: "m",
      location: { workflow: "test.json" }, owaspCategory: "t",
    };
    const result = runScan([graph], [makeRule("r", [f1, f2])]);
    expect(result.summary.high).toBe(2);
    expect(result.summary.critical).toBe(0);
  });
});
