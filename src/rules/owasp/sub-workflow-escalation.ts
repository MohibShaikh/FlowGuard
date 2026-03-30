import type { Rule, Finding, WorkflowGraph, GraphNode } from "../../types.js";
import { VALIDATION_NODES, isTrigger, SUB_WORKFLOW_NODES } from "../node-types.js";

function findTriggerPaths(graph: WorkflowGraph, targetNode: GraphNode): GraphNode[] {
  const triggers: GraphNode[] = [];
  const visited = new Set<string>();
  function walk(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = graph.getNode(nodeId);
    if (!node) return;
    if ((VALIDATION_NODES as readonly string[]).includes(node.type)) return;
    if (isTrigger(node, graph)) { triggers.push(node); return; }
    for (const pred of graph.getPredecessors(nodeId)) { walk(pred.id); }
  }
  for (const pred of graph.getPredecessors(targetNode.id)) { walk(pred.id); }
  return triggers;
}

export const subWorkflowEscalationRule: Rule = {
  id: "sub-workflow-escalation",
  title: "Sub-Workflow Privilege Escalation",
  description: "Detects trigger nodes flowing to sub-workflow execution without validation, risking privilege escalation",
  severity: "high",
  owaspCategory: "A01:2025 Excessive Agency",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];
    const subWorkflowNodes = graph.nodes.filter((n) =>
      (SUB_WORKFLOW_NODES as readonly string[]).includes(n.type) && n.type !== "n8n-nodes-base.executeWorkflowTrigger"
    );

    for (const subNode of subWorkflowNodes) {
      const triggers = findTriggerPaths(graph, subNode);
      for (const trigger of triggers) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          title: this.title,
          message: `Trigger "${trigger.name}" flows to sub-workflow node "${subNode.name}" without validation — sub-workflow may have elevated credentials`,
          location: {
            workflow: graph.filePath,
            nodeId: subNode.id,
            nodeName: subNode.name,
            nodeType: subNode.type,
          },
          remediation: "Add validation between the trigger and sub-workflow node. Ensure the sub-workflow uses least-privilege credentials.",
          owaspCategory: this.owaspCategory,
        });
      }
    }

    return findings;
  },
};
