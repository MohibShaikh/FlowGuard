import { describe, it, expect } from "vitest";
import { parseWorkflows } from "../src/parser";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");

describe("parseWorkflows", () => {
  it("parses a single valid workflow file", async () => {
    const results = await parseWorkflows([path.join(FIXTURES, "valid-workflow.json")]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Test Workflow");
    expect(results[0].nodes).toHaveLength(2);
    expect(results[0].connections).toBeDefined();
  });

  it("returns file path on each result", async () => {
    const filePath = path.join(FIXTURES, "valid-workflow.json");
    const results = await parseWorkflows([filePath]);
    expect(results[0].filePath).toBe(filePath);
  });

  it("skips non-workflow JSON files silently", async () => {
    const results = await parseWorkflows([path.join(FIXTURES, "not-a-workflow.json")]);
    expect(results).toHaveLength(0);
  });

  it("skips invalid JSON files with warning", async () => {
    const warnings: string[] = [];
    const results = await parseWorkflows([path.join(FIXTURES, "invalid.json")], (msg) => warnings.push(msg));
    expect(results).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("scans a directory recursively for .json files", async () => {
    const results = await parseWorkflows([FIXTURES]);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty array with warning for empty directory", async () => {
    const warnings: string[] = [];
    const emptyDir = path.join(FIXTURES, "empty-dir");
    const { mkdirSync, rmdirSync } = await import("fs");
    mkdirSync(emptyDir, { recursive: true });
    try {
      const results = await parseWorkflows([emptyDir], (msg) => warnings.push(msg));
      expect(results).toHaveLength(0);
    } finally {
      rmdirSync(emptyDir);
    }
  });

  it("warns on non-existent path", async () => {
    const warnings: string[] = [];
    const results = await parseWorkflows(["/nonexistent/path"], (msg) => warnings.push(msg));
    expect(results).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
