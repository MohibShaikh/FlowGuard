import { describe, it, expect } from "vitest";
import { formatJson } from "../../src/formatters/json";
import type { ScanResult } from "../../src/types";

describe("JSON formatter", () => {
  it("serializes ScanResult as valid JSON", () => {
    const result: ScanResult = {
      files: 1,
      findings: [
        {
          ruleId: "test", severity: "high", title: "Test", message: "msg",
          location: { workflow: "test.json" }, owaspCategory: "A01",
        },
      ],
      summary: { critical: 0, high: 1, medium: 0, low: 0, info: 0 },
    };
    const output = formatJson(result);
    const parsed = JSON.parse(output);
    expect(parsed.files).toBe(1);
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.summary.high).toBe(1);
  });
});
