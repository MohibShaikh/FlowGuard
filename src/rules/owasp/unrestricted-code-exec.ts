import type { Rule, Finding, WorkflowGraph, GraphNode } from "../../types.js";
import { CODE_EXEC_NODES, VALIDATION_NODES, isTrigger } from "../node-types.js";

function findTriggerPaths(graph: WorkflowGraph, codeNode: GraphNode): GraphNode[] {
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
  for (const pred of graph.getPredecessors(codeNode.id)) { walk(pred.id); }
  return triggers;
}

export const unrestrictedCodeExecRule: Rule = {
  id: "unrestricted-code-exec",
  title: "Unrestricted Code Execution",
  description: "Detects code execution nodes reachable from external input without validation",
  severity: "critical",
  owaspCategory: "A02:2025 Unrestricted Code Execution",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];
    const codeNodes = graph.nodes.filter((n) => (CODE_EXEC_NODES as readonly string[]).includes(n.type));
    for (const codeNode of codeNodes) {
      const triggers = findTriggerPaths(graph, codeNode);
      for (const trigger of triggers) {
        findings.push({
          ruleId: this.id, severity: this.severity, title: this.title,
          message: `Trigger "${trigger.name}" flows to code execution node "${codeNode.name}" without validation`,
          location: { workflow: graph.filePath, nodeId: codeNode.id, nodeName: codeNode.name, nodeType: codeNode.type },
          remediation: "Add an IF, Switch, or Filter node between the trigger and code execution node to validate input.",
          owaspCategory: this.owaspCategory,
        });
      }
    }
    return findings;
  },
};
