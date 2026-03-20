import type { Rule, Finding, WorkflowGraph, GraphNode } from "../../types.js";
import { SENSITIVE_NODES, VALIDATION_NODES, isTrigger } from "../node-types.js";

function findUnvalidatedSensitiveNodes(graph: WorkflowGraph, triggerNode: GraphNode): GraphNode[] {
  const sensitiveNodes: GraphNode[] = [];
  const visited = new Set<string>();
  function walk(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = graph.getNode(nodeId);
    if (!node) return;
    if ((VALIDATION_NODES as readonly string[]).includes(node.type)) return;
    if (nodeId !== triggerNode.id && (SENSITIVE_NODES as readonly string[]).includes(node.type)) { sensitiveNodes.push(node); return; }
    for (const succ of graph.getSuccessors(nodeId)) { walk(succ.id); }
  }
  for (const succ of graph.getSuccessors(triggerNode.id)) { walk(succ.id); }
  return sensitiveNodes;
}

export const missingInputValidationRule: Rule = {
  id: "missing-input-validation",
  title: "Missing Input Validation",
  description: "Detects trigger nodes feeding directly into sensitive nodes without validation",
  severity: "high",
  owaspCategory: "A03:2025 Missing Input Validation",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];
    const triggers = graph.nodes.filter((n) => isTrigger(n, graph));
    for (const trigger of triggers) {
      const sensitiveNodes = findUnvalidatedSensitiveNodes(graph, trigger);
      for (const sensitive of sensitiveNodes) {
        findings.push({
          ruleId: this.id, severity: this.severity, title: this.title,
          message: `Trigger "${trigger.name}" feeds into "${sensitive.name}" (${sensitive.type}) without input validation`,
          location: { workflow: graph.filePath, nodeId: sensitive.id, nodeName: sensitive.name, nodeType: sensitive.type },
          remediation: "Add an IF, Switch, or Filter node to validate input before it reaches sensitive nodes.",
          owaspCategory: this.owaspCategory,
        });
      }
    }
    return findings;
  },
};
