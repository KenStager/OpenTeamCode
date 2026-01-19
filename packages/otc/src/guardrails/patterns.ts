/**
 * Default guardrail patterns for secrets detection
 * These are used when no .ai/policies.yaml is configured
 */

import type { PolicyPattern } from "../util/config"

export const DEFAULT_PATTERNS: PolicyPattern[] = [
  {
    name: "AWS Access Key",
    regex: "AKIA[0-9A-Z]{16}",
    confidence: "high",
    description: "AWS Access Key ID starting with AKIA",
  },
  {
    name: "AWS Secret Key",
    regex: "(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])",
    confidence: "medium",
    description: "Potential AWS Secret Access Key (40 char base64)",
    falsePositiveIndicators: ["example", "placeholder", "your_key_here"],
  },
  {
    name: "Generic API Key Assignment",
    regex: "(api[_-]?key|apikey)\\s*[=:]\\s*['\"][A-Za-z0-9]{20,}['\"]",
    confidence: "high",
    description: "API key being assigned to a variable",
  },
  {
    name: "Password Assignment",
    regex: "(password|passwd|pwd)\\s*[=:]\\s*['\"][^'\"]{8,}['\"]",
    confidence: "medium",
    description: "Password being assigned to a variable",
    falsePositiveIndicators: ["example", "placeholder", "test", "dummy"],
  },
  {
    name: "Private Key Header",
    regex: "-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
    confidence: "high",
    description: "PEM-encoded private key",
  },
  {
    name: "GitHub Token",
    regex: "gh[pousr]_[A-Za-z0-9]{36,}",
    confidence: "high",
    description: "GitHub personal access token or app token",
  },
  {
    name: "Slack Token",
    regex: "xox[baprs]-[A-Za-z0-9-]{10,}",
    confidence: "high",
    description: "Slack API token",
  },
  {
    name: "Generic Secret Assignment",
    regex: "(secret|token|credential)\\s*[=:]\\s*['\"][A-Za-z0-9_\\-]{16,}['\"]",
    confidence: "medium",
    description: "Secret/token being assigned to a variable",
    falsePositiveIndicators: ["example", "placeholder", "test", "mock"],
  },
  {
    name: "Bearer Token",
    regex: "Bearer\\s+[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+",
    confidence: "high",
    description: "JWT Bearer token in code",
  },
  {
    name: "Basic Auth Header",
    regex: "Basic\\s+[A-Za-z0-9+/=]{20,}",
    confidence: "medium",
    description: "Basic authentication header with encoded credentials",
  },
]

// General false positive context patterns
export const FALSE_POSITIVE_CONTEXTS = [
  /example/i,
  /placeholder/i,
  /your[_-]?key[_-]?here/i,
  /xxx+/i,
  /test[_-]?key/i,
  /dummy/i,
  /fake/i,
  /mock/i,
  /sample/i,
]

// File extensions to scan
export const SCANNABLE_EXTENSIONS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "json",
  "yaml",
  "yml",
  "env",
  "txt",
  "md",
  "sh",
  "bash",
  "config",
  "cfg",
  "toml",
  "ini",
  "properties",
  "xml",
  "html",
  "go",
  "rs",
  "java",
  "kt",
  "rb",
  "php",
  "cs",
  "swift",
  "sql",
]

// Directories to skip
export const SKIP_DIRECTORIES = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  ".venv",
  "venv",
  ".next",
  ".nuxt",
  "coverage",
  ".nyc_output",
  "target",
  "vendor",
]
