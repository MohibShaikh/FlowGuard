import { describe, it, expect } from "vitest";
import { webhookNoAuthRule } from "../../src/rules/owasp/webhook-no-auth";
import { makeWorkflow, makeNode } from "../helpers";

describe("webhook-no-auth rule", () => {
  it("flags webhook with authentication: none", () => {
    const graph = makeWorkflow([
      makeNode("Webhook", "n8n-nodes-base.webhook", { path: "test", authentication: "none" }),
    ]);
    const findings = webhookNoAuthRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("high");
  });

  it("flags webhook with no authentication parameter (defaults to none)", () => {
    const graph = makeWorkflow([
      makeNode("Webhook", "n8n-nodes-base.webhook", { path: "test" }),
    ]);
    const findings = webhookNoAuthRule.run(graph);
    expect(findings).toHaveLength(1);
  });

  it("does not flag webhook with headerAuth", () => {
    const graph = makeWorkflow([
      makeNode("Webhook", "n8n-nodes-base.webhook", { path: "test", authentication: "headerAuth" }),
    ]);
    expect(webhookNoAuthRule.run(graph)).toHaveLength(0);
  });

  it("does not flag webhook with basicAuth", () => {
    const graph = makeWorkflow([
      makeNode("Webhook", "n8n-nodes-base.webhook", { path: "test", authentication: "basicAuth" }),
    ]);
    expect(webhookNoAuthRule.run(graph)).toHaveLength(0);
  });

  it("does not flag formTrigger (different auth model)", () => {
    const graph = makeWorkflow([
      makeNode("Form", "n8n-nodes-base.formTrigger", { path: "test" }),
    ]);
    expect(webhookNoAuthRule.run(graph)).toHaveLength(0);
  });
});
