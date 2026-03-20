import { describe, it, expect } from "vitest";
import { unsafeOutputHandlingRule } from "../../src/rules/owasp/unsafe-output-handling";
import { makeWorkflow, makeNode } from "../helpers";

describe("unsafe-output-handling rule", () => {
  it("flags httpRequest directly connected to code node", () => {
    const graph = makeWorkflow(
      [
        makeNode("Webhook", "n8n-nodes-base.webhook", {}),
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("Code", "n8n-nodes-base.code", {}),
      ],
      {
        Webhook: { main: [[{ node: "HTTP", type: "main", index: 0 }]] },
        HTTP: { main: [[{ node: "Code", type: "main", index: 0 }]] },
      }
    );
    const findings = unsafeOutputHandlingRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("medium");
  });

  it("flags httpRequest → database node", () => {
    const graph = makeWorkflow(
      [
        makeNode("Webhook", "n8n-nodes-base.webhook", {}),
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("Postgres", "n8n-nodes-base.postgres", {}),
      ],
      {
        Webhook: { main: [[{ node: "HTTP", type: "main", index: 0 }]] },
        HTTP: { main: [[{ node: "Postgres", type: "main", index: 0 }]] },
      }
    );
    const findings = unsafeOutputHandlingRule.run(graph);
    expect(findings).toHaveLength(1);
  });

  it("does not flag when IF node is between HTTP and code", () => {
    const graph = makeWorkflow(
      [
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("IF", "n8n-nodes-base.if", {}),
        makeNode("Code", "n8n-nodes-base.code", {}),
      ],
      {
        HTTP: { main: [[{ node: "IF", type: "main", index: 0 }]] },
        IF: { main: [[{ node: "Code", type: "main", index: 0 }]] },
      }
    );
    const findings = unsafeOutputHandlingRule.run(graph);
    expect(findings).toHaveLength(0);
  });

  it("does not flag httpRequest connected to non-sensitive node", () => {
    const graph = makeWorkflow(
      [
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("Set", "n8n-nodes-base.set", {}),
      ],
      { HTTP: { main: [[{ node: "Set", type: "main", index: 0 }]] } }
    );
    const findings = unsafeOutputHandlingRule.run(graph);
    expect(findings).toHaveLength(0);
  });
});
