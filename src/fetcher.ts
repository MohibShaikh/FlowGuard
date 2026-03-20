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
  const base = baseUrl.replace(/\/+$/, "");
  const results: FetchedWorkflow[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${base}/api/v1/workflows`);
    url.searchParams.set("limit", "250");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
      headers: { "X-N8N-API-KEY": apiKey },
    });

    if (!response.ok) {
      throw new Error(`n8n API returned ${response.status}: ${response.statusText}`);
    }

    const body = (await response.json()) as {
      data: Array<Record<string, unknown>>;
      nextCursor?: string;
    };

    if (!body.data || !Array.isArray(body.data)) {
      throw new Error("Unexpected n8n API response format");
    }

    for (const wf of body.data) {
      if (!Array.isArray(wf.nodes) || typeof wf.connections !== "object") {
        warn(`Skipping invalid workflow: ${wf.name ?? wf.id ?? "unknown"}`);
        continue;
      }
      results.push({
        name: wf.name as string | undefined,
        nodes: wf.nodes as RawWorkflow["nodes"],
        connections: wf.connections as RawWorkflow["connections"],
        filePath: `${base}/workflow/${wf.id ?? "unknown"}`,
      });
    }

    cursor = body.nextCursor;
  } while (cursor);

  return results;
}
