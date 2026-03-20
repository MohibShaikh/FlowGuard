import type { Rule } from "../types.js";
import { excessiveAgencyRule } from "./owasp/excessive-agency.js";
import { unrestrictedCodeExecRule } from "./owasp/unrestricted-code-exec.js";
import { missingInputValidationRule } from "./owasp/missing-input-validation.js";
import { unsafeOutputHandlingRule } from "./owasp/unsafe-output-handling.js";
import { insecureCredentialUsageRule } from "./owasp/insecure-credential-usage.js";
import { excessiveDataExposureRule } from "./owasp/excessive-data-exposure.js";

export const allRules: Rule[] = [
  excessiveAgencyRule,
  unrestrictedCodeExecRule,
  missingInputValidationRule,
  unsafeOutputHandlingRule,
  insecureCredentialUsageRule,
  excessiveDataExposureRule,
];
