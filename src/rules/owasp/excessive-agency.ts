import type { Rule, Finding, WorkflowGraph } from "../../types.js";

const SCOPE_KEYS = /scope|permission|role|access/i;
const DANGEROUS_VALUES = /\*|admin|root|all/i;
const HIGH_AGENCY_TYPES = ["n8n-nodes-base.executeCommand", "n8n-nodes-base.ssh"];

export const excessiveAgencyRule: Rule = {
  id: "excessive-agency",
  title: "Excessive Agency",
  description: "Detects nodes with overly broad permissions or inherently dangerous capabilities",
  severity: "high",
  owaspCategory: "A01:2025 Excessive Agency",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];
    for (const node of graph.nodes) {
      if (HIGH_AGENCY_TYPES.includes(node.type)) {
        findings.push({
          ruleId: this.id, severity: this.severity, title: this.title,
          message: `Node "${node.name}" uses ${node.type} which provides system-level access`,
          location: { workflow: graph.filePath, nodeId: node.id, nodeName: node.name, nodeType: node.type },
          remediation: "Consider whether this node needs system-level access. Use more restricted alternatives where possible.",
          owaspCategory: this.owaspCategory,
        });
      }
      if (!node.credentials) continue;
      for (const [key, value] of Object.entries(node.parameters)) {
        if (!SCOPE_KEYS.test(key)) continue;
        const strValue = String(value);
        if (DANGEROUS_VALUES.test(strValue)) {
          findings.push({
            ruleId: this.id, severity: this.severity, title: this.title,
            message: `Node "${node.name}" has overly broad ${key}: "${strValue}"`,
            location: { workflow: graph.filePath, nodeId: node.id, nodeName: node.name, nodeType: node.type },
            remediation: "Reduce the scope to only the permissions required. Avoid wildcards and admin-level access.",
            owaspCategory: this.owaspCategory,
          });
        } else if (strValue.split(",").length > 5) {
          findings.push({
            ruleId: this.id, severity: this.severity, title: this.title,
            message: `Node "${node.name}" requests ${strValue.split(",").length} scopes in ${key} — consider reducing`,
            location: { workflow: graph.filePath, nodeId: node.id, nodeName: node.name, nodeType: node.type },
            remediation: "Limit scopes to only what is needed for this workflow's function.",
            owaspCategory: this.owaspCategory,
          });
        }
      }
    }
    return findings;
  },
};
