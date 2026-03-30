import type { RawWorkflow, WorkflowGraph, GraphNode, Edge } from "./types.js";

export function buildGraph(workflow: RawWorkflow, filePath: string): WorkflowGraph {
  // Build name→id lookup for resolving connections (which are keyed by name)
  const nameToId = new Map<string, string>();
  for (const n of workflow.nodes) {
    nameToId.set(n.name, n.id ?? n.name);
  }

  const nodes: GraphNode[] = workflow.nodes
    .filter((n) => !n.disabled)
    .map((n) => ({
      id: n.id ?? n.name,
      name: n.name,
      type: n.type,
      parameters: n.parameters ?? {},
      credentials: n.credentials,
      position: n.position,
    }));

  const activeIds = new Set(nodes.map((n) => n.id));

  const edges: Edge[] = [];
  for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
    const sourceId = nameToId.get(sourceName);
    if (!sourceId || !activeIds.has(sourceId)) continue;
    for (const [outputType, outputIndexes] of Object.entries(outputs)) {
      for (const targets of outputIndexes) {
        for (const target of targets) {
          const targetId = nameToId.get(target.node);
          if (!targetId || !activeIds.has(targetId)) continue;
          edges.push({
            source: sourceId,
            target: targetId,
            sourceOutput: outputType,
            targetInput: target.type,
          });
        }
      }
    }
  }

  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) { nodeMap.set(node.id, node); }

  const successorMap = new Map<string, Set<string>>();
  const predecessorMap = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!successorMap.has(edge.source)) successorMap.set(edge.source, new Set());
    successorMap.get(edge.source)!.add(edge.target);
    if (!predecessorMap.has(edge.target)) predecessorMap.set(edge.target, new Set());
    predecessorMap.get(edge.target)!.add(edge.source);
  }

  return {
    name: workflow.name ?? "Unnamed Workflow",
    filePath,
    nodes,
    edges,
    getNode(id: string) { return nodeMap.get(id); },
    getSuccessors(id: string) {
      const ids = successorMap.get(id);
      if (!ids) return [];
      return [...ids].map((sid) => nodeMap.get(sid)).filter((n): n is GraphNode => n !== undefined);
    },
    getPredecessors(id: string) {
      const ids = predecessorMap.get(id);
      if (!ids) return [];
      return [...ids].map((pid) => nodeMap.get(pid)).filter((n): n is GraphNode => n !== undefined);
    },
    getNodesByType(type: string) { return nodes.filter((n) => n.type === type); },
  };
}
