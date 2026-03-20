import { describe, it, expect } from "vitest";
import { missingInputValidationRule } from "../../src/rules/owasp/missing-input-validation";
import { makeWorkflow, makeNode } from "../helpers";

describe("missing-input-validation rule", () => {
  it("flags webhook directly connected to database node", () => {
    const graph = makeWorkflow(
      [makeNode("Webhook", "n8n-nodes-base.webhook", {}), makeNode("Postgres", "n8n-nodes-base.postgres", {})],
      { Webhook: { main: [[{ node: "Postgres", type: "main", index: 0 }]] } }
    );
    const findings = missingInputValidationRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("high");
  });
  it("flags webhook → set → httpRequest (set is not validation)", () => {
    const graph = makeWorkflow(
      [makeNode("Webhook", "n8n-nodes-base.webhook", {}), makeNode("Set", "n8n-nodes-base.set", {}), makeNode("HTTP", "n8n-nodes-base.httpRequest", {})],
      { Webhook: { main: [[{ node: "Set", type: "main", index: 0 }]] }, Set: { main: [[{ node: "HTTP", type: "main", index: 0 }]] } }
    );
    expect(missingInputValidationRule.run(graph)).toHaveLength(1);
  });
  it("does not flag when filter node is between trigger and sensitive node", () => {
    const graph = makeWorkflow(
      [makeNode("Webhook", "n8n-nodes-base.webhook", {}), makeNode("Filter", "n8n-nodes-base.filter", {}), makeNode("Postgres", "n8n-nodes-base.postgres", {})],
      { Webhook: { main: [[{ node: "Filter", type: "main", index: 0 }]] }, Filter: { main: [[{ node: "Postgres", type: "main", index: 0 }]] } }
    );
    expect(missingInputValidationRule.run(graph)).toHaveLength(0);
  });
  it("does not flag non-trigger nodes", () => {
    const graph = makeWorkflow(
      [makeNode("Set", "n8n-nodes-base.set", {}), makeNode("Code", "n8n-nodes-base.code", {})],
      { Set: { main: [[{ node: "Code", type: "main", index: 0 }]] } }
    );
    expect(missingInputValidationRule.run(graph)).toHaveLength(0);
  });
});
