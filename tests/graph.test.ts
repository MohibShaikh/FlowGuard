import { describe, it, expect } from "vitest";
import { buildGraph } from "../src/graph";
import type { RawWorkflow } from "../src/types";

const WORKFLOW: RawWorkflow = {
  name: "Test Workflow",
  nodes: [
    { name: "Webhook", type: "n8n-nodes-base.webhook", parameters: { path: "test" }, position: [0, 0] },
    { name: "IF", type: "n8n-nodes-base.if", parameters: {}, position: [200, 0] },
    { name: "Code", type: "n8n-nodes-base.code", parameters: { jsCode: "return items;" }, position: [400, 0] },
  ],
  connections: {
    Webhook: { main: [[{ node: "IF", type: "main", index: 0 }]] },
    IF: { main: [[{ node: "Code", type: "main", index: 0 }]] },
  },
};

describe("buildGraph", () => {
  it("creates nodes from workflow", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes[0].id).toBe("Webhook");
    expect(graph.nodes[0].name).toBe("Webhook");
    expect(graph.nodes[0].type).toBe("n8n-nodes-base.webhook");
  });

  it("sets graph name and filePath", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    expect(graph.name).toBe("Test Workflow");
    expect(graph.filePath).toBe("test.json");
  });

  it("flattens connections into edges", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges).toContainEqual(expect.objectContaining({ source: "Webhook", target: "IF" }));
    expect(graph.edges).toContainEqual(expect.objectContaining({ source: "IF", target: "Code" }));
  });

  it("getNode returns the correct node", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const node = graph.getNode("IF");
    expect(node).toBeDefined();
    expect(node!.type).toBe("n8n-nodes-base.if");
  });

  it("getNode returns undefined for missing node", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    expect(graph.getNode("nonexistent")).toBeUndefined();
  });

  it("getSuccessors returns downstream nodes", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const successors = graph.getSuccessors("Webhook");
    expect(successors).toHaveLength(1);
    expect(successors[0].id).toBe("IF");
  });

  it("getPredecessors returns upstream nodes", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const predecessors = graph.getPredecessors("Code");
    expect(predecessors).toHaveLength(1);
    expect(predecessors[0].id).toBe("IF");
  });

  it("getNodesByType returns matching nodes", () => {
    const graph = buildGraph(WORKFLOW, "test.json");
    const webhooks = graph.getNodesByType("n8n-nodes-base.webhook");
    expect(webhooks).toHaveLength(1);
    expect(webhooks[0].name).toBe("Webhook");
  });

  it("handles workflow with no connections", () => {
    const workflow: RawWorkflow = {
      name: "Isolated",
      nodes: [{ name: "Code", type: "n8n-nodes-base.code", parameters: {}, position: [0, 0] }],
      connections: {},
    };
    const graph = buildGraph(workflow, "test.json");
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
    expect(graph.getSuccessors("Code")).toHaveLength(0);
    expect(graph.getPredecessors("Code")).toHaveLength(0);
  });
});
