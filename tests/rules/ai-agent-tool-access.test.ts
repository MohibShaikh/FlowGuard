import { describe, it, expect } from "vitest";
import { aiAgentToolAccessRule } from "../../src/rules/owasp/ai-agent-tool-access";
import { makeWorkflow, makeNode } from "../helpers";

describe("ai-agent-tool-access rule", () => {
  it("flags LangChain agent connected to toolCode", () => {
    const graph = makeWorkflow(
      [
        makeNode("Chat", "@n8n/n8n-nodes-langchain.chatTrigger", {}),
        makeNode("Agent", "@n8n/n8n-nodes-langchain.agent", {}),
        makeNode("Code Tool", "@n8n/n8n-nodes-langchain.toolCode", {}),
      ],
      {
        "Chat": { main: [[{ node: "Agent", type: "main", index: 0 }]] },
        "Agent": { main: [[{ node: "Code Tool", type: "main", index: 0 }]] },
      }
    );
    const findings = aiAgentToolAccessRule.run(graph);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("critical");
  });

  it("flags agent connected to toolWorkflow", () => {
    const graph = makeWorkflow(
      [
        makeNode("Agent", "@n8n/n8n-nodes-langchain.agent", {}),
        makeNode("WF Tool", "@n8n/n8n-nodes-langchain.toolWorkflow", {}),
      ],
      {
        "Agent": { main: [[{ node: "WF Tool", type: "main", index: 0 }]] },
      }
    );
    expect(aiAgentToolAccessRule.run(graph)).toHaveLength(1);
  });

  it("flags agent connected to toolHttpRequest", () => {
    const graph = makeWorkflow(
      [
        makeNode("Agent", "@n8n/n8n-nodes-langchain.agent", {}),
        makeNode("HTTP Tool", "@n8n/n8n-nodes-langchain.toolHttpRequest", {}),
      ],
      {
        "Agent": { main: [[{ node: "HTTP Tool", type: "main", index: 0 }]] },
      }
    );
    expect(aiAgentToolAccessRule.run(graph)).toHaveLength(1);
  });

  it("does not flag agent with no tool connections", () => {
    const graph = makeWorkflow([
      makeNode("Agent", "@n8n/n8n-nodes-langchain.agent", {}),
    ]);
    expect(aiAgentToolAccessRule.run(graph)).toHaveLength(0);
  });

  it("does not flag non-agent nodes connected to tools", () => {
    const graph = makeWorkflow(
      [
        makeNode("Set", "n8n-nodes-base.set", {}),
        makeNode("Code Tool", "@n8n/n8n-nodes-langchain.toolCode", {}),
      ],
      {
        "Set": { main: [[{ node: "Code Tool", type: "main", index: 0 }]] },
      }
    );
    expect(aiAgentToolAccessRule.run(graph)).toHaveLength(0);
  });
});
