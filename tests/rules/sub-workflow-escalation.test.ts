import { describe, it, expect } from "vitest";
import { subWorkflowEscalationRule } from "../../src/rules/owasp/sub-workflow-escalation";
import { makeWorkflow, makeNode } from "../helpers";

describe("sub-workflow-escalation rule", () => {
  it("flags trigger flowing to executeWorkflow without validation", () => {
    const graph = makeWorkflow(
      [
        makeNode("Webhook", "n8n-nodes-base.webhook", {}),
        makeNode("Run Sub", "n8n-nodes-base.executeWorkflow", { workflowId: "123" }),
      ],
      {
        "Webhook": { main: [[{ node: "Run Sub", type: "main", index: 0 }]] },
      }
    );
    const findings = subWorkflowEscalationRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("high");
    expect(findings[0].message).toContain("sub-workflow");
  });

  it("does not flag executeWorkflow with validation in between", () => {
    const graph = makeWorkflow(
      [
        makeNode("Webhook", "n8n-nodes-base.webhook", {}),
        makeNode("IF", "n8n-nodes-base.if", {}),
        makeNode("Run Sub", "n8n-nodes-base.executeWorkflow", { workflowId: "123" }),
      ],
      {
        "Webhook": { main: [[{ node: "IF", type: "main", index: 0 }]] },
        "IF": { main: [[{ node: "Run Sub", type: "main", index: 0 }]] },
      }
    );
    expect(subWorkflowEscalationRule.run(graph)).toHaveLength(0);
  });

  it("flags scheduleTrigger flowing to executeWorkflow", () => {
    const graph = makeWorkflow(
      [
        makeNode("Cron", "n8n-nodes-base.scheduleTrigger", {}),
        makeNode("Run Sub", "n8n-nodes-base.executeWorkflow", { workflowId: "123" }),
      ],
      {
        "Cron": { main: [[{ node: "Run Sub", type: "main", index: 0 }]] },
      }
    );
    const findings = subWorkflowEscalationRule.run(graph);
    expect(findings).toHaveLength(1);
  });
});
