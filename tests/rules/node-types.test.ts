import { describe, it, expect } from "vitest";
import {
  TRIGGER_NODES, CODE_EXEC_NODES, DATABASE_NODES, HTTP_NODES,
  SENSITIVE_NODES, VALIDATION_NODES, TRANSFORM_NODES, LOGGING_NODES, isTrigger,
} from "../../src/rules/node-types";
import type { GraphNode, WorkflowGraph } from "../../src/types";

function makeNode(id?: string, type?: string, parameters?: object): GraphNode {
  return { id: id || "test", name: "test", type: type || "n8n-nodes-base.code", parameters: parameters || {}, position: [0, 0] };
}

function makeWorkflow(nodes: GraphNode[] = []): WorkflowGraph {
  return { name: "test", filePath: "test.json", nodes, edges: [], getNode: () => undefined, getSuccessors: () => [], getPredecessors: () => [], getNodesByType: () => [] };
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
    const graph = makeWorkflow([makeNode("webhook", "n8n-nodes-base.webhook", {})]);
    expect(isTrigger(graph.nodes[0], graph)).toBe(true);
  });
  it("returns true for httpRequest with no predecessors", () => {
    const graph = makeWorkflow([makeNode("http", "n8n-nodes-base.httpRequest", {})]);
    expect(isTrigger(graph.nodes[0], graph)).toBe(true);
  });
  it("returns false for httpRequest with predecessors", () => {
    const graph = makeWorkflow([
      makeNode("prev", "n8n-nodes-base.code", {}),
      makeNode("http", "n8n-nodes-base.httpRequest", {}),
    ]);
    const httpNode = graph.nodes[1];
    const mockGraph = { ...graph, getPredecessors: () => [graph.nodes[0]] };
    expect(isTrigger(httpNode, mockGraph)).toBe(false);
  });
  it("returns false for a code node", () => {
    const graph = makeWorkflow([makeNode("code", "n8n-nodes-base.code", {})]);
    expect(isTrigger(graph.nodes[0], graph)).toBe(false);
  });
  it("recognizes chatTrigger as a trigger", () => {
    const graph = makeWorkflow([makeNode("Chat", "n8n-nodes-base.chatTrigger", {})]);
    expect(isTrigger(graph.nodes[0], graph)).toBe(true);
  });
  it("recognizes scheduleTrigger as a trigger", () => {
    const graph = makeWorkflow([makeNode("Cron", "n8n-nodes-base.scheduleTrigger", {})]);
    expect(isTrigger(graph.nodes[0], graph)).toBe(true);
  });
  it("recognizes LangChain chatTrigger as a trigger", () => {
    const graph = makeWorkflow([makeNode("AI Chat", "@n8n/n8n-nodes-langchain.chatTrigger", {})]);
    expect(isTrigger(graph.nodes[0], graph)).toBe(true);
  });
});
