import type { Rule, Finding, WorkflowGraph } from "../../types.js";
import { AI_AGENT_NODES, AI_TOOL_NODES } from "../node-types.js";

export const aiAgentToolAccessRule: Rule = {
  id: "ai-agent-tool-access",
  title: "AI Agent with Tool Access",
  description: "Detects AI/LLM agent nodes connected to code execution, workflow, or HTTP tools — enabling prompt injection to escalate to system access",
  severity: "critical",
  owaspCategory: "A01:2025 Excessive Agency",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];

    const agentNodes = graph.nodes.filter((n) =>
      (AI_AGENT_NODES as readonly string[]).includes(n.type)
    );

    for (const agent of agentNodes) {
      const successors = graph.getSuccessors(agent.id);
      const toolSuccessors = successors.filter((s) =>
        (AI_TOOL_NODES as readonly string[]).includes(s.type)
      );

      for (const tool of toolSuccessors) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          title: this.title,
          message: `AI agent "${agent.name}" has access to tool "${tool.name}" (${tool.type}) — prompt injection could escalate to code/workflow execution`,
          location: {
            workflow: graph.filePath,
            nodeId: agent.id,
            nodeName: agent.name,
            nodeType: agent.type,
          },
          remediation: "Limit agent tool access to the minimum required. Avoid connecting agents to code execution or unrestricted HTTP tools. Add output validation on tool results.",
          owaspCategory: this.owaspCategory,
        });
      }
    }

    return findings;
  },
};
