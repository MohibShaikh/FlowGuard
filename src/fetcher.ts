import type { RawWorkflow } from "./types.js";

export interface FetchedWorkflow extends RawWorkflow {
  filePath: string; // set to "<baseUrl>/workflow/<id>"
}

export async function fetchWorkflows(
  baseUrl: string,
  apiKey: string,
  onWarning?: (message: string) => void
): Promise<FetchedWorkflow[]> {
  const warn = onWarning ?? (() => {});
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/workflows`;

  const response = await fetch(url, {
    headers: { "X-N8N-API-KEY": apiKey },
  });

  if (!response.ok) {
    throw new Error(`n8n API returned ${response.status}: ${response.statusText}`);
  }

  const body = (await response.json()) as { data: Array<Record<string, unknown>> };

  if (!body.data || !Array.isArray(body.data)) {
    throw new Error("Unexpected n8n API response format");
  }

  const results: FetchedWorkflow[] = [];
  for (const wf of body.data) {
    if (!Array.isArray(wf.nodes) || typeof wf.connections !== "object") {
      warn(`Skipping invalid workflow: ${wf.name ?? wf.id ?? "unknown"}`);
      continue;
    }
    results.push({
      name: wf.name as string | undefined,
      nodes: wf.nodes as RawWorkflow["nodes"],
      connections: wf.connections as RawWorkflow["connections"],
      filePath: `${baseUrl.replace(/\/+$/, "")}/workflow/${wf.id ?? "unknown"}`,
    });
  }

  return results;
}
