import chalk from "chalk";
import type { ScanResult, Severity, Finding } from "../types.js";

const SEVERITY_COLORS: Record<Severity, (s: string) => string> = {
  critical: chalk.red,
  high: chalk.yellow,
  medium: chalk.cyan,
  low: chalk.white,
  info: chalk.gray,
};

export function formatTerminal(result: ScanResult): string {
  const lines: string[] = [];

  if (result.findings.length === 0) {
    lines.push(chalk.green("No issues found."));
    lines.push(`Found 0 issues across ${result.files} workflow(s).`);
    return lines.join("\n");
  }

  // Group by workflow file
  const grouped = new Map<string, Finding[]>();
  for (const f of result.findings) {
    const key = f.location.workflow;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  }

  for (const [file, findings] of grouped) {
    lines.push(chalk.underline(file));
    lines.push("");

    for (const f of findings) {
      const color = SEVERITY_COLORS[f.severity];
      const tag = color(`[${f.severity.toUpperCase()}]`);
      const node = f.location.nodeName ? ` (${f.location.nodeName})` : "";
      lines.push(`  ${tag} ${f.title}${node}`);
      lines.push(`       ${f.message}`);
      if (f.remediation) {
        lines.push(`       ${chalk.dim("Fix:")} ${f.remediation}`);
      }
      lines.push("");
    }
  }

  const parts: string[] = [];
  for (const sev of ["critical", "high", "medium", "low", "info"] as Severity[]) {
    if (result.summary[sev] > 0) {
      parts.push(`${result.summary[sev]} ${sev}`);
    }
  }
  lines.push(`Found ${parts.join(", ")} issues across ${result.files} workflow(s).`);

  return lines.join("\n");
}
