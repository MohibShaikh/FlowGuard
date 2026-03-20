import type { Rule, Finding, WorkflowGraph } from "../../types.js";

const SECRET_VALUE_PATTERNS = [
  /^sk-/,
  /^sk_live_/,
  /^rk_live_/,
  /^AKIA[A-Z0-9]{16}/,
  /^Bearer\s+[A-Za-z0-9\-._~+/]+=*$/,
  /^ghp_/,
  /^github_pat_/,
  /^xox[bpsa]-/,
];

const SECRET_KEY_PATTERN = /password|secret|token|apikey|api_key|auth/i;

function walkParameters(
  params: Record<string, unknown>,
  callback: (key: string, value: string) => void,
  prefix = "",
): void {
  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      callback(fullKey, value);
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item === "string") {
          callback(`${fullKey}[${i}]`, item);
        } else if (typeof item === "object" && item !== null) {
          walkParameters(item as Record<string, unknown>, callback, `${fullKey}[${i}]`);
        }
      }
    } else if (typeof value === "object" && value !== null) {
      walkParameters(value as Record<string, unknown>, callback, fullKey);
    }
  }
}

export const insecureCredentialUsageRule: Rule = {
  id: "insecure-credential-usage",
  title: "Insecure Credential Usage",
  description: "Detects hardcoded credentials in node parameters",
  severity: "critical",
  owaspCategory: "A06:2025 Insecure Credential Usage",
  run(graph: WorkflowGraph): Finding[] {
    const findings: Finding[] = [];

    for (const node of graph.nodes) {
      walkParameters(node.parameters, (key, value) => {
        let isSecret = false;

        // Check value against known secret patterns
        for (const pattern of SECRET_VALUE_PATTERNS) {
          if (pattern.test(value)) {
            isSecret = true;
            break;
          }
        }

        // Check key name + value length for password-like params
        if (!isSecret && SECRET_KEY_PATTERN.test(key) && value.length > 8 && !value.includes("{{")) {
          isSecret = true;
        }

        if (isSecret) {
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            title: this.title,
            message: `Node "${node.name}" has a hardcoded credential in parameter "${key}"`,
            location: {
              workflow: graph.filePath,
              nodeId: node.id,
              nodeName: node.name,
              nodeType: node.type,
            },
            remediation: "Use n8n's built-in credential store instead of hardcoding secrets in node parameters.",
            owaspCategory: this.owaspCategory,
          });
        }
      });
    }

    return findings;
  },
};
