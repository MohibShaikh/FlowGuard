import { describe, it, expect } from "vitest";
import {
  TRIGGER_NODES, CODE_EXEC_NODES, DATABASE_NODES, HTTP_NODES,
  SENSITIVE_NODES, VALIDATION_NODES, TRANSFORM_NODES, LOGGING_NODES, isTrigger,
} from "../../src/rules/node-types";
import type { GraphNode, WorkflowGraph } from "../../src/types";

function makeNode(overrides: Partial<GraphNode>): GraphNode {
  return { id: "test", name: "test", type: "n8n-nodes-base.code", parameters: {}, position: [0, 0], ...overrides };
}

function makeGraph(predecessors: GraphNode[] = []): WorkflowGraph {
  return { name: "test", filePath: "test.json", nodes: [], edges: [], getNode: () => undefined, getSuccessors: () => [], getPredecessors: () => predecessors, getNodesByType: () => [] };
}

describe("node-types", () => {
  it("SENSITIVE_NODES includes code exec, database, and HTTP nodes", () => {
    expect(SENSITIVE_NODES).toEqual(expect.arrayContaining([...CODE_EXEC_NODES, ...DATABASE_NODES, ...HTTP_NODES]));
  });
  it("VALIDATION_NODES does not include transform nodes", () => {
    for (const t of TRANSFORM_NODES) { expect(VALIDATION_NODES).not.toContain(t); }
  });
});

describe("isTrigger", () => {
  it("returns true for webhook node", () => {
    expect(isTrigger(makeNode({ type: "n8n-nodes-base.webhook" }), makeGraph())).toBe(true);
  });
  it("returns true for httpRequest with no predecessors", () => {
    expect(isTrigger(makeNode({ type: "n8n-nodes-base.httpRequest" }), makeGraph([]))).toBe(true);
  });
  it("returns false for httpRequest with predecessors", () => {
    expect(isTrigger(makeNode({ type: "n8n-nodes-base.httpRequest" }), makeGraph([makeNode({ id: "prev", name: "prev" })]))).toBe(false);
  });
  it("returns false for a code node", () => {
    expect(isTrigger(makeNode({ type: "n8n-nodes-base.code" }), makeGraph())).toBe(false);
  });
});
