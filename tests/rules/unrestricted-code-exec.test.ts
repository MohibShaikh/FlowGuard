import { describe, it, expect } from "vitest";
import { unrestrictedCodeExecRule } from "../../src/rules/owasp/unrestricted-code-exec";
import { makeWorkflow, makeNode } from "../helpers";

describe("unrestricted-code-exec rule", () => {
  it("flags webhook directly connected to code node", () => {
    const graph = makeWorkflow(
      [makeNode("Webhook", "n8n-nodes-base.webhook", { path: "test" }), makeNode("Code", "n8n-nodes-base.code", { jsCode: "return items;" })],
      { Webhook: { main: [[{ node: "Code", type: "main", index: 0 }]] } }
    );
    const findings = unrestrictedCodeExecRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("critical");
    expect(findings[0].message).toContain("Webhook");
    expect(findings[0].message).toContain("Code");
  });
  it("flags webhook → code through non-validation node", () => {
    const graph = makeWorkflow(
      [makeNode("Webhook", "n8n-nodes-base.webhook", {}), makeNode("Set", "n8n-nodes-base.set", {}), makeNode("Code", "n8n-nodes-base.code", {})],
      { Webhook: { main: [[{ node: "Set", type: "main", index: 0 }]] }, Set: { main: [[{ node: "Code", type: "main", index: 0 }]] } }
    );
    expect(unrestrictedCodeExecRule.run(graph)).toHaveLength(1);
  });
  it("does not flag when IF node is between webhook and code", () => {
    const graph = makeWorkflow(
      [makeNode("Webhook", "n8n-nodes-base.webhook", {}), makeNode("IF", "n8n-nodes-base.if", {}), makeNode("Code", "n8n-nodes-base.code", {})],
      { Webhook: { main: [[{ node: "IF", type: "main", index: 0 }]] }, IF: { main: [[{ node: "Code", type: "main", index: 0 }]] } }
    );
    expect(unrestrictedCodeExecRule.run(graph)).toHaveLength(0);
  });
  it("does not flag code node with no trigger upstream", () => {
    const graph = makeWorkflow([makeNode("Code", "n8n-nodes-base.code", {})], {});
    expect(unrestrictedCodeExecRule.run(graph)).toHaveLength(0);
  });
  it("flags httpRequest (no predecessors) → executeCommand", () => {
    const graph = makeWorkflow(
      [makeNode("HTTP", "n8n-nodes-base.httpRequest", {}), makeNode("Exec", "n8n-nodes-base.executeCommand", {})],
      { HTTP: { main: [[{ node: "Exec", type: "main", index: 0 }]] } }
    );
    expect(unrestrictedCodeExecRule.run(graph)).toHaveLength(1);
  });
});
