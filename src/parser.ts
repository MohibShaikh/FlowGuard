import { readFile, stat } from "fs/promises";
import { glob } from "glob";
import path from "path";
import type { RawWorkflow } from "./types.js";

export interface ParsedWorkflow extends RawWorkflow {
  filePath: string;
}

function isWorkflow(data: unknown): data is RawWorkflow {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.nodes) && typeof obj.connections === "object" && obj.connections !== null;
}

export async function parseWorkflows(
  paths: string[],
  onWarning?: (message: string) => void
): Promise<ParsedWorkflow[]> {
  const warn = onWarning ?? (() => {});
  const results: ParsedWorkflow[] = [];
  const filePaths: string[] = [];

  for (const p of paths) {
    let fileStat;
    try {
      fileStat = await stat(p);
    } catch {
      warn(`Path not found: ${p}`);
      continue;
    }
    if (fileStat.isDirectory()) {
      const found = await glob("**/*.json", { cwd: p, absolute: true, nofollow: true });
      if (found.length === 0) {
        warn(`No workflow files found in ${p}`);
      }
      filePaths.push(...found);
    } else {
      filePaths.push(path.resolve(p));
    }
  }

  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);
      if (!isWorkflow(data)) continue;
      results.push({ ...data, filePath });
    } catch (err) {
      warn(`Failed to parse ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return results;
}
