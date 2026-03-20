import type { Rule, Finding, WorkflowGraph, GraphNode } from "../../types.js";
import { HTTP_NODES, LOGGING_NODES, VALIDATION_NODES, TRANSFORM_NODES } from "../node-types.js";

const INTERMEDIARY_NODES = [...VALIDATION_NODES, ...TRANSFORM_NODES] as readonly string[];

function findDirectLoggingNodes(
  graph: WorkflowGraph,
  httpNode: GraphNode,
): GraphNode[] {
  const loggers: GraphNode[] = [];
  const visited = new Set<string>();

  function walk(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = graph.getNode(nodeId);
    if (!node) return;

    if (INTERMEDIARY_NODES.includes(node.type)) return;

    if (nodeId !== httpNode.id && (LOGGING_NODES as readonly string[]).includes(node.type)) {
      loggers.push(node);
      return;
    }

    for (const succ of graph.getSuccessors(nodeId)) {
      walk(succ.id);
    }
  }

  for (const succ of graph.getSuccessors(httpNode.id)) {
    walk(succ.id);
  }

  return loggers;
}

function hasFullResponse(params: Record<string, unknown>): boolean {
  try {
    const options = params.options as Record<string, unknown> | undefined;
    const response = options?.response as Record<string, unknown> | undefined;
    const inner = response?.response as Record<string, unknown> | undefined;
    return inner?.fullResponse === true;
  } catch {
    return false;
  }
}

export const excessiveDataExposureRule: Rule = {
  id: "excessive-data-exposure",
  title: "Excessive Data Exposure",
  description: "Detects HTTP responses sent directly to logging/notification nodes without data minimization",
  severity: "medium",
  owaspCategory: "A07:2025 Excessive Data Exposure",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];
    const httpNodes = graph.nodes.filter((n) =>
      (HTTP_NODES as readonly string[]).includes(n.type)
    );

    for (const httpNode of httpNodes) {
      const loggers = findDirectLoggingNodes(graph, httpNode);
      const isFull = hasFullResponse(httpNode.parameters);

      for (const logger of loggers) {
        const extra = isFull ? " (full response enabled)" : "";
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          title: this.title,
          message: `HTTP node "${httpNode.name}" sends response directly to "${logger.name}"${extra} without data minimization. This may expose sensitive data. (Heuristic — verify manually.)`,
          location: {
            workflow: graph.filePath,
            nodeId: logger.id,
            nodeName: logger.name,
            nodeType: logger.type,
          },
          remediation: "Add a Set node to extract only the fields needed before sending to notification/logging nodes.",
          owaspCategory: this.owaspCategory,
        });
      }
    }

    return findings;
  },
};
