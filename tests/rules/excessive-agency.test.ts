import { describe, it, expect } from "vitest";
import { excessiveAgencyRule } from "../../src/rules/owasp/excessive-agency";
import { makeWorkflow, makeNode } from "../helpers";

describe("excessive-agency rule", () => {
  it("flags nodes with wildcard scope in parameters", () => {
    const graph = makeWorkflow([
      makeNode("Google Sheets", "n8n-nodes-base.googleSheets", { scope: "*" }, { googleApi: {} }),
    ]);
    const findings = excessiveAgencyRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("excessive-agency");
    expect(findings[0].severity).toBe("high");
  });
  it("flags nodes with admin scope value", () => {
    const graph = makeWorkflow([makeNode("Slack", "n8n-nodes-base.slack", { permission: "admin" }, { slackApi: {} })]);
    expect(excessiveAgencyRule.run(graph)).toHaveLength(1);
  });
  it("flags scope lists with more than 5 entries", () => {
    const graph = makeWorkflow([makeNode("API", "n8n-nodes-base.httpRequest", { scope: "read,write,delete,admin,users,billing" }, { apiKey: {} })]);
    expect(excessiveAgencyRule.run(graph)).toHaveLength(1);
  });
  it("flags executeCommand nodes as inherently high-agency", () => {
    const graph = makeWorkflow([makeNode("Shell", "n8n-nodes-base.executeCommand", { command: "ls" })]);
    expect(excessiveAgencyRule.run(graph)).toHaveLength(1);
  });
  it("flags ssh nodes as inherently high-agency", () => {
    const graph = makeWorkflow([makeNode("SSH", "n8n-nodes-base.ssh", { host: "example.com" })]);
    expect(excessiveAgencyRule.run(graph)).toHaveLength(1);
  });
  it("does not flag nodes with narrow scopes", () => {
    const graph = makeWorkflow([makeNode("Sheets", "n8n-nodes-base.googleSheets", { scope: "read" }, { googleApi: {} })]);
    expect(excessiveAgencyRule.run(graph)).toHaveLength(0);
  });
  it("does not flag nodes without credentials or dangerous types", () => {
    const graph = makeWorkflow([makeNode("Set", "n8n-nodes-base.set", { field: "value" })]);
    expect(excessiveAgencyRule.run(graph)).toHaveLength(0);
  });
  it("flags wildcard scope even when node has no credentials block", () => {
    const graph = makeWorkflow([
      makeNode("OAuth", "n8n-nodes-base.httpRequest", { scope: "*", apiKey: "hardcoded" }),
    ]);
    const findings = excessiveAgencyRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some(f => f.message.includes("overly broad scope"))).toBe(true);
  });
});
