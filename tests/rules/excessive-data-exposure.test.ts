import { describe, it, expect } from "vitest";
import { excessiveDataExposureRule } from "../../src/rules/owasp/excessive-data-exposure";
import { makeWorkflow, makeNode } from "../helpers";

describe("excessive-data-exposure rule", () => {
  it("flags httpRequest directly connected to Slack (logging node)", () => {
    const graph = makeWorkflow(
      [
        makeNode("Trigger", "n8n-nodes-base.webhook", {}),
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("Slack", "n8n-nodes-base.slack", {}),
      ],
      {
        Trigger: { main: [[{ node: "HTTP", type: "main", index: 0 }]] },
        HTTP: { main: [[{ node: "Slack", type: "main", index: 0 }]] },
      }
    );
    const findings = excessiveDataExposureRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("medium");
  });

  it("flags httpRequest with fullResponse → logging node", () => {
    const graph = makeWorkflow(
      [
        makeNode("Trigger", "n8n-nodes-base.webhook", {}),
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {
          options: { response: { response: { fullResponse: true } } },
        }),
        makeNode("Slack", "n8n-nodes-base.slack", {}),
      ],
      {
        Trigger: { main: [[{ node: "HTTP", type: "main", index: 0 }]] },
        HTTP: { main: [[{ node: "Slack", type: "main", index: 0 }]] },
      }
    );
    const findings = excessiveDataExposureRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it("does not flag when Set node is between HTTP and logging", () => {
    const graph = makeWorkflow(
      [
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("Set", "n8n-nodes-base.set", {}),
        makeNode("Slack", "n8n-nodes-base.slack", {}),
      ],
      {
        HTTP: { main: [[{ node: "Set", type: "main", index: 0 }]] },
        Set: { main: [[{ node: "Slack", type: "main", index: 0 }]] },
      }
    );
    const findings = excessiveDataExposureRule.run(graph);
    expect(findings).toHaveLength(0);
  });

  it("does not flag when IF node is between HTTP and logging", () => {
    const graph = makeWorkflow(
      [
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("IF", "n8n-nodes-base.if", {}),
        makeNode("Telegram", "n8n-nodes-base.telegram", {}),
      ],
      {
        HTTP: { main: [[{ node: "IF", type: "main", index: 0 }]] },
        IF: { main: [[{ node: "Telegram", type: "main", index: 0 }]] },
      }
    );
    const findings = excessiveDataExposureRule.run(graph);
    expect(findings).toHaveLength(0);
  });

  it("does not flag HTTP connected to non-logging node", () => {
    const graph = makeWorkflow(
      [
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("Code", "n8n-nodes-base.code", {}),
      ],
      { HTTP: { main: [[{ node: "Code", type: "main", index: 0 }]] } }
    );
    const findings = excessiveDataExposureRule.run(graph);
    expect(findings).toHaveLength(0);
  });

  it("flags HTTP → Set (keepAllFields) → Slack as still exposed", () => {
    const graph = makeWorkflow(
      [
        makeNode("HTTP", "n8n-nodes-base.httpRequest", {}),
        makeNode("Set", "n8n-nodes-base.set", { options: { keepAllFields: true } }),
        makeNode("Slack", "n8n-nodes-base.slack", {}),
        makeNode("Trigger", "n8n-nodes-base.webhook", {}),
      ],
      {
        "Trigger": { main: [[{ node: "HTTP", type: "main", index: 0 }]] },
        "HTTP": { main: [[{ node: "Set", type: "main", index: 0 }]] },
        "Set": { main: [[{ node: "Slack", type: "main", index: 0 }]] },
      }
    );
    const findings = excessiveDataExposureRule.run(graph);
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});
