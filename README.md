# FlowGuard

> The missing security scanner for n8n workflows.

[![npm version](https://img.shields.io/npm/v/n8n-flowguard)](https://www.npmjs.com/package/n8n-flowguard)
[![license](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/MohibShaikh/FlowGuard/blob/main/LICENSE)
[![tests](https://img.shields.io/badge/tests-111%20passing-brightgreen)]()

Security scanner for [n8n](https://n8n.io) workflows. Scans exported JSON files or connects directly to a running n8n instance via API. Detects vulnerabilities mapped to the [OWASP Top 10 for Agentic Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/).

## Why FlowGuard?

n8n powers automation for thousands of organizations, but its workflows are security-blind by default:

- **230,000+ n8n instances** are publicly exposed ([Shodan](https://www.shodan.io/)), many running unpatched versions vulnerable to CVEs like [CVE-2024-28241](https://www.cvedetails.com/cve/CVE-2024-28241/) (SSRF) and [CVE-2023-27564](https://www.cvedetails.com/cve/CVE-2023-27564/) (auth bypass).
- Workflows routinely pipe webhook input directly into code execution, databases, and shell commands — with zero validation.
- Hardcoded API keys and tokens sit in node parameters instead of the credential store.
- No existing tool audits n8n workflows for these patterns.

FlowGuard fills this gap. It performs graph-based static analysis, catches dangerous patterns before they hit production, and outputs SARIF for CI/CD integration. Unlike [Agentic Radar](https://github.com/splx-ai/agentic-radar) (which focuses on LLM agent frameworks like LangChain/CrewAI), FlowGuard is purpose-built for n8n's node-and-connection model.

## Install

```bash
npm install -g n8n-flowguard
```

Or run from source:

```bash
git clone https://github.com/MohibShaikh/FlowGuard.git
cd FlowGuard
npm install && npm run build
```

## Usage

### Scan exported workflow files

```bash
# Scan a single file
flowguard scan workflow.json

# Scan a directory of workflows
flowguard scan ./workflows/
```

### Scan a live n8n instance

```bash
# Connect directly to n8n via API
flowguard scan --url https://your-n8n.example.com --api-key YOUR_API_KEY

# Combine: scan local files + a live instance
flowguard scan ./workflows/ --url https://your-n8n.example.com --api-key YOUR_API_KEY
```

### Output formats

```bash
# JSON output
flowguard scan workflow.json --json

# SARIF output (for GitHub Code Scanning, VS Code, etc.)
flowguard scan workflow.json --sarif

# Fail in CI if critical or high findings exist
flowguard scan ./workflows/ --fail-on high
```

## Example Output

```
workflow.json

  [CRITICAL] Unrestricted Code Execution (Code)
       Trigger "Webhook" flows to code execution node "Code" without validation
       Fix: Add an IF, Switch, or Filter node between the trigger and code execution node.

  [HIGH] Missing Input Validation (Code)
       Trigger "Webhook" feeds into "Code" (n8n-nodes-base.code) without input validation
       Fix: Add an IF, Switch, or Filter node to validate input before it reaches sensitive nodes.

Found 1 critical, 1 high issues across 1 workflow(s).
```

## Detection Rules

| Rule | OWASP | Severity | What it detects |
|------|-------|----------|-----------------|
| Excessive Agency | A01 | High | Overly broad permissions, wildcard scopes, high-agency nodes (executeCommand, SSH) |
| Unrestricted Code Execution | A02 | Critical | Trigger nodes flowing to code execution without validation |
| Missing Input Validation | A03 | High | External input reaching sensitive nodes (code, DB, HTTP) without validation |
| Unsafe Output Handling | A04 | Medium | HTTP responses flowing into code execution or database nodes unvalidated |
| Insecure Credential Usage | A06 | Critical | Hardcoded API keys, tokens, and secrets in node parameters |
| Excessive Data Exposure | A07 | Medium | Full HTTP responses forwarded to logging/notification channels without filtering |
| Unauthenticated Webhook | A03 | High | Webhook nodes with no authentication configured |
| Sub-Workflow Escalation | A01 | High | Trigger → executeWorkflow without validation (privilege escalation) |
| AI Agent Tool Access | A01 | Critical | LLM agent nodes connected to code/workflow/HTTP tools |

## Output Formats

- **Terminal** (default) — color-coded findings grouped by file
- **JSON** (`--json`) — machine-readable scan results
- **SARIF** (`--sarif`) — [SARIF v2.1.0](https://sarifweb.azurewebsites.net/) for integration with GitHub Code Scanning, VS Code, etc.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No findings at or above `--fail-on` threshold (or flag not set) |
| `1` | Findings at or above `--fail-on` threshold |
| `2` | Scanner error (bad input, conflicting flags, etc.) |

## CI/CD

```yaml
# GitHub Actions — scan exported workflow files
- name: Scan n8n workflows
  run: |
    npx n8n-flowguard scan ./workflows --sarif > results.sarif
    npx n8n-flowguard scan ./workflows --fail-on high

- name: Upload SARIF
  if: always()
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

```yaml
# GitHub Actions — scan a live n8n instance
- name: Audit n8n instance
  run: npx n8n-flowguard scan --url ${{ secrets.N8N_URL }} --api-key ${{ secrets.N8N_API_KEY }} --fail-on high
```

## Development

```bash
npm install          # install dependencies
npm test             # run tests (111 tests)
npm run build        # build CLI
npm run lint         # type check
```

## License

[AGPL-3.0](LICENSE)
