import { Command } from "commander";
import { parseWorkflows } from "./parser.js";
import { fetchWorkflows } from "./fetcher.js";
import { buildGraph } from "./graph.js";
import { runScan } from "./runner.js";
import { allRules } from "./rules/index.js";
import { formatTerminal } from "./formatters/terminal.js";
import { formatJson } from "./formatters/json.js";
import { formatSarif } from "./formatters/sarif.js";
import type { Severity, RawWorkflow } from "./types.js";
import { SEVERITY_ORDER } from "./types.js";

const VALID_SEVERITIES = Object.keys(SEVERITY_ORDER) as Severity[];

const program = new Command();

program
  .name("flowguard")
  .description("Security scanner for n8n workflow JSON files")
  .version("0.1.1");

program
  .command("scan")
  .description("Scan n8n workflow files for security issues")
  .argument("[paths...]", "File or directory paths to scan")
  .option("--url <url>", "n8n instance URL to scan via API")
  .option("--api-key <key>", "n8n API key")
  .option("--json", "Output results as JSON")
  .option("--sarif", "Output results as SARIF v2.1.0")
  .option("--fail-on <severity>", "Exit with code 1 if findings at or above this severity")
  .action(async (paths: string[], options: { url?: string; apiKey?: string; json?: boolean; sarif?: boolean; failOn?: string }) => {
    // Validate mutually exclusive format flags
    if (options.json && options.sarif) {
      console.error("Error: --json and --sarif are mutually exclusive.");
      process.exit(2);
    }

    // Validate --url and --api-key pairing
    if (options.url && !options.apiKey) {
      console.error("Error: --api-key is required when using --url.");
      process.exit(2);
    }
    if (options.apiKey && !options.url) {
      console.error("Error: --url is required when using --api-key.");
      process.exit(2);
    }

    // Validate that at least one input source is provided
    if (paths.length === 0 && !options.url) {
      console.error("Error: Provide file/directory paths or use --url to scan an n8n instance.");
      process.exit(2);
    }

    // Validate --fail-on value
    if (options.failOn && !VALID_SEVERITIES.includes(options.failOn as Severity)) {
      console.error(`Error: --fail-on must be one of: ${VALID_SEVERITIES.join(", ")}`);
      process.exit(2);
    }

    try {
      const warnings: string[] = [];
      const warn = (msg: string) => {
        warnings.push(msg);
        console.error(`Warning: ${msg}`);
      };

      // Collect workflows from all sources
      const allParsed: Array<RawWorkflow & { filePath: string }> = [];

      // File/directory scanning
      if (paths.length > 0) {
        const fileParsed = await parseWorkflows(paths, warn);
        allParsed.push(...fileParsed);
      }

      // n8n API scanning
      if (options.url && options.apiKey) {
        const fetched = await fetchWorkflows(options.url, options.apiKey, warn);
        allParsed.push(...fetched);
      }

      if (allParsed.length === 0) {
        if (warnings.length === 0) {
          console.error("Warning: No workflow files found.");
        }
        process.exit(0);
      }

      const graphs = allParsed.map((p) => buildGraph(p, p.filePath));
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
