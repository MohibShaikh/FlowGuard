import type { GraphNode, WorkflowGraph } from "../types.js";

export const TRIGGER_NODES = ["n8n-nodes-base.webhook", "n8n-nodes-base.formTrigger", "n8n-nodes-base.emailReadImap"] as const;
export const CODE_EXEC_NODES = ["n8n-nodes-base.code", "n8n-nodes-base.function", "n8n-nodes-base.functionItem", "n8n-nodes-base.executeCommand", "n8n-nodes-base.ssh"] as const;
export const DATABASE_NODES = ["n8n-nodes-base.postgres", "n8n-nodes-base.mysql", "n8n-nodes-base.mongoDb", "n8n-nodes-base.redis", "n8n-nodes-base.microsoftSql"] as const;
export const HTTP_NODES = ["n8n-nodes-base.httpRequest", "n8n-nodes-base.graphql"] as const;
export const SENSITIVE_NODES = [...CODE_EXEC_NODES, ...DATABASE_NODES, ...HTTP_NODES] as const;
export const VALIDATION_NODES = ["n8n-nodes-base.if", "n8n-nodes-base.switch", "n8n-nodes-base.filter"] as const;
export const TRANSFORM_NODES = ["n8n-nodes-base.set", "n8n-nodes-base.itemLists"] as const;
export const LOGGING_NODES = ["n8n-nodes-base.slack", "n8n-nodes-base.discord", "n8n-nodes-base.telegram", "n8n-nodes-base.emailSend"] as const;

export function isTrigger(node: GraphNode, graph: WorkflowGraph): boolean {
  if ((TRIGGER_NODES as readonly string[]).includes(node.type)) return true;
  if (node.type === "n8n-nodes-base.httpRequest") return graph.getPredecessors(node.id).length === 0;
  return false;
}
