import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, "..", "dist", "cli.js");
const FIXTURE = path.join(__dirname, "fixtures", "valid-workflow.json");

function run(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node "${CLI}" ${args}`, { encoding: "utf-8", stdio: "pipe" });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err: any) {
    return { stdout: err.stdout ?? "", stderr: err.stderr ?? "", exitCode: err.status ?? 1 };
  }
}

describe("CLI integration", () => {
  it("scans a workflow file and outputs terminal format", () => {
    const { stdout, exitCode } = run(`scan "${FIXTURE}"`);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("issue");
  });

  it("outputs JSON when --json is passed", () => {
    const { stdout } = run(`scan "${FIXTURE}" --json`);
    const parsed = JSON.parse(stdout);
    expect(parsed.files).toBe(1);
    expect(parsed.findings).toBeDefined();
  });

  it("outputs SARIF when --sarif is passed", () => {
    const { stdout } = run(`scan "${FIXTURE}" --sarif`);
    const parsed = JSON.parse(stdout);
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs).toHaveLength(1);
  });

  it("exits 1 when --fail-on threshold is met", () => {
    const { exitCode } = run(`scan "${FIXTURE}" --fail-on critical`);
    expect(exitCode).toBe(1);
  });

  it("exits 0 when --fail-on is not specified", () => {
    const { exitCode } = run(`scan "${FIXTURE}"`);
    expect(exitCode).toBe(0);
  });

  it("exits 2 when --json and --sarif are both passed", () => {
    const { exitCode, stderr } = run(`scan "${FIXTURE}" --json --sarif`);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("mutually exclusive");
  });

  it("exits 2 for invalid --fail-on value", () => {
    const { exitCode } = run(`scan "${FIXTURE}" --fail-on banana`);
    expect(exitCode).toBe(2);
  });
});
