import type { Rule, Finding, WorkflowGraph } from "../../types.js";

export const webhookNoAuthRule: Rule = {
  id: "webhook-no-auth",
  title: "Unauthenticated Webhook",
  description: "Detects webhook trigger nodes with no authentication configured",
  severity: "high",
  owaspCategory: "A03:2025 Missing Input Validation",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];

    for (const node of graph.nodes) {
      if (node.type !== "n8n-nodes-base.webhook") continue;

      const auth = node.parameters.authentication as string | undefined;
      if (!auth || auth === "none") {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          title: this.title,
          message: `Webhook "${node.name}" has no authentication configured — anyone with the URL can trigger it`,
          location: {
            workflow: graph.filePath,
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
          },
          remediation: "Set the webhook's authentication to Header Auth, Basic Auth, or JWT to restrict access.",
          owaspCategory: this.owaspCategory,
        });
      }
    }

    return findings;
  },
};
