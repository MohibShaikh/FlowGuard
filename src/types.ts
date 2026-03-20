export type Severity = "critical" | "high" | "medium" | "low" | "info";

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export interface Finding {
  ruleId: string;
  severity: Severity;
  title: string;
  message: string;
  location: {
    workflow: string;
    nodeId?: string;
    nodeName?: string;
    nodeType?: string;
  };
  remediation?: string;
  owaspCategory: string;
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  owaspCategory: string;
  run(graph: WorkflowGraph): Finding[];
}

export interface WorkflowGraph {
  name: string;
  filePath: string;
  nodes: GraphNode[];
  edges: Edge[];
  getNode(id: string): GraphNode | undefined;
  getSuccessors(id: string): GraphNode[];
  getPredecessors(id: string): GraphNode[];
  getNodesByType(type: string): GraphNode[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  position: [number, number];
}

export interface Edge {
  source: string;
  target: string;
  sourceOutput?: string;
  targetInput?: string;
}

export interface ScanResult {
  files: number;
  findings: Finding[];
  summary: Record<Severity, number>;
}

export interface RawWorkflow {
  name?: string;
  nodes: Array<{
    id?: string;
    name: string;
    type: string;
    parameters?: Record<string, unknown>;
    credentials?: Record<string, unknown>;
    position: [number, number];
  }>;
  connections: Record<string, Record<string, Array<Array<{ node: string; type: string; index: number }>>>>;
}
