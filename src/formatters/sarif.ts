import type { ScanResult, Rule, Severity } from "../types.js";

function severityToLevel(severity: Severity): string {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
    case "info":
      return "note";
  }
}

export function formatSarif(result: ScanResult, rules: Rule[]): string {
  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "FlowGuard",
            version: "0.1.0",
            informationUri: "https://github.com/flowguard/flowguard",
            rules: rules.map((r) => ({
              id: r.id,
              name: r.title,
              shortDescription: { text: r.description },
              defaultConfiguration: { level: severityToLevel(r.severity) },
              properties: { owaspCategory: r.owaspCategory },
            })),
          },
        },
        results: result.findings.map((f) => ({
          ruleId: f.ruleId,
          ruleIndex: rules.findIndex((r) => r.id === f.ruleId),
          level: severityToLevel(f.severity),
          message: { text: f.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.location.workflow },
              },
            },
          ],
          ...(f.remediation ? { properties: { remediation: f.remediation } } : {}),
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
