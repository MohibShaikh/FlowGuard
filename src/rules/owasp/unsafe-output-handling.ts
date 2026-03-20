import type { Rule, Finding, WorkflowGraph, GraphNode } from "../../types.js";
import { HTTP_NODES, CODE_EXEC_NODES, DATABASE_NODES, VALIDATION_NODES, isTrigger } from "../node-types.js";

const DANGEROUS_TARGETS = [...CODE_EXEC_NODES, ...DATABASE_NODES] as readonly string[];

function findUnsafeTargets(
  graph: WorkflowGraph,
  httpNode: GraphNode,
): GraphNode[] {
  const targets: GraphNode[] = [];
  const visited = new Set<string>();

  function walk(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = graph.getNode(nodeId);
    if (!node) return;

    if ((VALIDATION_NODES as readonly string[]).includes(node.type)) return;

    if (nodeId !== httpNode.id && DANGEROUS_TARGETS.includes(node.type)) {
      targets.push(node);
      return;
    }

    for (const succ of graph.getSuccessors(nodeId)) {
      walk(succ.id);
    }
  }

  for (const succ of graph.getSuccessors(httpNode.id)) {
    walk(succ.id);
  }

  return targets;
}

export const unsafeOutputHandlingRule: Rule = {
  id: "unsafe-output-handling",
  title: "Unsafe Output Handling",
  description: "Detects HTTP response data flowing into code execution or database nodes without validation",
  severity: "medium",
  owaspCategory: "A04:2025 Unsafe Output Handling",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];
    const httpNodes = graph.nodes.filter((n) =>
      (HTTP_NODES as readonly string[]).includes(n.type) && !isTrigger(n, graph)
    );

    for (const httpNode of httpNodes) {
      const targets = findUnsafeTargets(graph, httpNode);
      for (const target of targets) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          title: this.title,
          message: `HTTP node "${httpNode.name}" passes response directly to "${target.name}" (${target.type}) without validation`,
          location: {
            workflow: graph.filePath,
            nodeId: target.id,
            nodeName: target.name,
            nodeType: target.type,
          },
          remediation: "Add an IF, Switch, or Filter node to validate HTTP response data before passing to code execution or database nodes.",
          owaspCategory: this.owaspCategory,
        });
      }
    }

    return findings;
  },
};
