import { Command } from "commander";
import { parseWorkflows } from "./parser.js";
import { buildGraph } from "./graph.js";
import { runScan } from "./runner.js";
import { allRules } from "./rules/index.js";
import { formatTerminal } from "./formatters/terminal.js";
import { formatJson } from "./formatters/json.js";
import { formatSarif } from "./formatters/sarif.js";
import type { Severity } from "./types.js";
import { SEVERITY_ORDER } from "./types.js";

const VALID_SEVERITIES = Object.keys(SEVERITY_ORDER) as Severity[];

const program = new Command();

program
  .name("flowguard")
  .description("Security scanner for n8n workflow JSON files")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan n8n workflow files for security issues")
  .argument("<paths...>", "File or directory paths to scan")
  .option("--json", "Output results as JSON")
  .option("--sarif", "Output results as SARIF v2.1.0")
  .option("--fail-on <severity>", "Exit with code 1 if findings at or above this severity")
  .action(async (paths: string[], options: { json?: boolean; sarif?: boolean; failOn?: string }) => {
    // Validate mutually exclusive format flags
    if (options.json && options.sarif) {
      console.error("Error: --json and --sarif are mutually exclusive.");
      process.exit(2);
    }

    // Validate --fail-on value
    if (options.failOn && !VALID_SEVERITIES.includes(options.failOn as Severity)) {
      console.error(`Error: --fail-on must be one of: ${VALID_SEVERITIES.join(", ")}`);
      process.exit(2);
    }

    try {
      const warnings: string[] = [];
      const parsed = await parseWorkflows(paths, (msg) => {
        warnings.push(msg);
        console.error(`Warning: ${msg}`);
      });

      if (parsed.length === 0) {
        if (warnings.length === 0) {
          console.error("Warning: No workflow files found.");
        }
        process.exit(0);
      }

      const graphs = parsed.map((p) => buildGraph(p, p.filePath));
      const result = runScan(graphs, allRules);

      if (options.sarif) {
        console.log(formatSarif(result, allRules));
      } else if (options.json) {
        console.log(formatJson(result));
      } else {
        console.log(formatTerminal(result));
      }

      // Exit code based on --fail-on
      if (options.failOn) {
        const threshold = SEVERITY_ORDER[options.failOn as Severity];
        const hasFindings = result.findings.some(
          (f) => SEVERITY_ORDER[f.severity] >= threshold
        );
        if (hasFindings) {
          process.exit(1);
        }
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(2);
    }
  });

program.parse();
