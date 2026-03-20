# FlowGuard

Security scanner for [n8n](https://n8n.io) workflow JSON files. Detects vulnerabilities mapped to the [OWASP Top 10 for Agentic Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/).

## Install

```bash
npm install -g flowguard
```

Or run from source:

```bash
git clone https://github.com/MohibShaikh/FlowGuard.git
cd FlowGuard
npm install && npm run build
```

## Usage

```bash
# Scan a workflow file
flowguard scan workflow.json

# Scan a directory of workflows
flowguard scan ./workflows/

# JSON output
flowguard scan workflow.json --json

# SARIF output (for GitHub Code Scanning, etc.)
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
# GitHub Actions example
- name: Scan n8n workflows
  run: npx flowguard scan ./workflows --sarif > results.sarif --fail-on high

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

## Development

```bash
npm install          # install dependencies
npm test             # run tests (73 tests)
npm run build        # build CLI
npm run lint         # type check
```

## License

MIT
