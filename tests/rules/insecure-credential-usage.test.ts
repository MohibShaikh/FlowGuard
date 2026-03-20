import { describe, it, expect } from "vitest";
import { insecureCredentialUsageRule } from "../../src/rules/owasp/insecure-credential-usage";
import { makeWorkflow, makeNode } from "../helpers";

describe("insecure-credential-usage rule", () => {
  it("flags hardcoded OpenAI API key (sk- prefix)", () => {
    const graph = makeWorkflow([
      makeNode("HTTP", "n8n-nodes-base.httpRequest", {
        headers: { Authorization: "sk-1234567890abcdef" },
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].severity).toBe("critical");
  });

  it("flags hardcoded AWS key (AKIA prefix)", () => {
    const graph = makeWorkflow([
      makeNode("S3", "n8n-nodes-base.httpRequest", {
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it("flags GitHub personal access token", () => {
    const graph = makeWorkflow([
      makeNode("GH", "n8n-nodes-base.httpRequest", {
        token: "ghp_ABCDEFGHIJKLMNOPabcdefghijklmnop12",
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it("flags Slack token (xoxb prefix)", () => {
    const graph = makeWorkflow([
      makeNode("Slack", "n8n-nodes-base.slack", {
        token: "xoxb-1234567890-abcdef",
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it("flags password-like parameter names with long string values", () => {
    const graph = makeWorkflow([
      makeNode("DB", "n8n-nodes-base.postgres", {
        password: "mySuperSecretPassword123",
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it("does not flag n8n expressions ({{ references credential store)", () => {
    const graph = makeWorkflow([
      makeNode("DB", "n8n-nodes-base.postgres", {
        password: "{{ $credentials.password }}",
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings).toHaveLength(0);
  });

  it("does not flag short non-secret values", () => {
    const graph = makeWorkflow([
      makeNode("Set", "n8n-nodes-base.set", {
        apiKey: "test",
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings).toHaveLength(0);
  });

  it("flags deeply nested credential values", () => {
    const graph = makeWorkflow([
      makeNode("HTTP", "n8n-nodes-base.httpRequest", {
        options: { headers: { nested: { auth: "sk-deeply-nested-key" } } },
      }),
    ]);
    const findings = insecureCredentialUsageRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});
