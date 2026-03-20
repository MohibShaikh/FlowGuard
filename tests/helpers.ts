import type { RawWorkflow } from "../src/types";
import { buildGraph } from "../src/graph";
import type { WorkflowGraph } from "../src/types";

export function makeWorkflow(
  nodes: RawWorkflow["nodes"],
  connections: RawWorkflow["connections"] = {}
): WorkflowGraph {
  const raw: RawWorkflow = { name: "Test", nodes, connections };
  return buildGraph(raw, "test.json");
}

export function makeNode(
  name: string,
  type: string,
  params: Record<string, unknown> = {},
  credentials?: Record<string, unknown>
) {
  return {
    name,
    type,
    parameters: params,
    position: [0, 0] as [number, number],
    ...(credentials ? { credentials } : {}),
  };
}
