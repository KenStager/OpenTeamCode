/**
 * otc doctor - Health check with pass/fail checklist and remediation
 */

import type { CommandModule } from "yargs"
import { access, readFile } from "fs/promises"
import { join } from "path"
import * as output from "../util/output"
import {
  findAiFolder,
  loadConfig,
  loadPolicies,
  loadStandards,
  AI_FOLDER,
  CONFIG_FILE,
  STANDARDS_FILE,
  POLICIES_FILE,
  SESSIONS_FOLDER,
} from "../util/config"

interface DoctorArgs {
  config?: boolean
  json?: boolean
}

interface CheckResult {
  name: string
  passed: boolean
  detail?: string
  remediation?: string
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function runChecks(): Promise<CheckResult[]> {
  const checks: CheckResult[] = []

  // Check 1: .ai/ folder exists
  const aiPath = await findAiFolder()
  checks.push({
    name: ".ai/ folder exists",
    passed: !!aiPath,
    detail: aiPath ? aiPath : undefined,
    remediation: !aiPath ? "Run 'otc init' to create the .ai/ folder" : undefined,
  })

  if (!aiPath) {
    return checks
  }

  // Check 2: config.yaml exists and is valid
  try {
    const config = await loadConfig(aiPath)
    if (config) {
      checks.push({
        name: "config.yaml is valid",
        passed: true,
      })
    } else {
      checks.push({
        name: "config.yaml exists",
        passed: false,
        remediation: "Run 'otc init' to create config.yaml",
      })
    }
  } catch (error) {
    checks.push({
      name: "config.yaml is valid",
      passed: false,
      detail: String(error),
      remediation: "Fix the YAML syntax in .ai/config.yaml",
    })
  }

  // Check 3: standards.md exists
  const standards = await loadStandards(aiPath)
  checks.push({
    name: "standards.md exists",
    passed: !!standards,
    remediation: !standards ? "Create .ai/standards.md with team coding conventions" : undefined,
  })

  // Check 4: standards.md has content
  if (standards) {
    const hasContent = standards.trim().length > 100 && !standards.includes("<!-- Add your team")
    checks.push({
      name: "standards.md has been customized",
      passed: hasContent,
      detail: hasContent ? undefined : "Still contains template placeholders",
      remediation: !hasContent ? "Edit .ai/standards.md to add your team's coding conventions" : undefined,
    })
  }

  // Check 5: policies.yaml exists and is valid
  try {
    const policies = await loadPolicies(aiPath)
    if (policies) {
      checks.push({
        name: "policies.yaml is valid",
        passed: true,
        detail: `${policies.patterns.length} patterns defined`,
      })

      // Check 6: policies have valid regex
      let allRegexValid = true
      let invalidPattern: string | undefined
      for (const pattern of policies.patterns) {
        try {
          new RegExp(pattern.regex)
        } catch {
          allRegexValid = false
          invalidPattern = pattern.name
          break
        }
      }
      checks.push({
        name: "All policy patterns have valid regex",
        passed: allRegexValid,
        detail: !allRegexValid ? `Invalid regex in "${invalidPattern}"` : undefined,
        remediation: !allRegexValid ? "Fix the regex pattern in .ai/policies.yaml" : undefined,
      })
    } else {
      checks.push({
        name: "policies.yaml exists",
        passed: false,
        remediation: "Run 'otc init' to create policies.yaml",
      })
    }
  } catch (error) {
    checks.push({
      name: "policies.yaml is valid",
      passed: false,
      detail: String(error),
      remediation: "Fix the YAML syntax in .ai/policies.yaml",
    })
  }

  // Check 7: sessions/ directory exists
  const sessionsExists = await fileExists(join(aiPath, SESSIONS_FOLDER))
  checks.push({
    name: "sessions/ directory exists",
    passed: sessionsExists,
    remediation: !sessionsExists ? "Create .ai/sessions/ directory" : undefined,
  })

  // Check 8: memory/ directories exist
  const memoryDirs = ["memory/patterns", "memory/gotchas", "memory/decisions"]
  for (const dir of memoryDirs) {
    const exists = await fileExists(join(aiPath, dir))
    checks.push({
      name: `${dir}/ exists`,
      passed: exists,
      remediation: !exists ? `Create .ai/${dir}/ directory` : undefined,
    })
  }

  // Check 9: OpenCode is available
  let opencodeAvailable = false
  try {
    const response = await fetch("http://localhost:4096/health", { signal: AbortSignal.timeout(2000) })
    opencodeAvailable = response.ok
  } catch {}
  checks.push({
    name: "OpenCode server is reachable",
    passed: opencodeAvailable,
    detail: opencodeAvailable ? "localhost:4096" : undefined,
    remediation: !opencodeAvailable ? "Start OpenCode with: opencode serve" : undefined,
  })

  // Check 10: .gitignore includes sessions (optional warning)
  try {
    const gitignorePath = join(process.cwd(), ".gitignore")
    const gitignore = await readFile(gitignorePath, "utf-8")
    const ignoresSessions = gitignore.includes(".ai/sessions") || gitignore.includes(".ai/sessions/")
    checks.push({
      name: ".gitignore excludes .ai/sessions/",
      passed: ignoresSessions,
      detail: !ignoresSessions ? "Sessions may be committed to git" : undefined,
      remediation: !ignoresSessions ? "Add '.ai/sessions/' to .gitignore" : undefined,
    })
  } catch {
    // No .gitignore, skip this check
  }

  return checks
}

export const DoctorCommand: CommandModule<{}, DoctorArgs> = {
  command: "doctor",
  describe: "Health check with pass/fail checklist and remediation",
  builder: (yargs) => {
    return yargs
      .option("config", {
        type: "boolean",
        description: "Only check configuration files",
        default: false,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    const checks = await runChecks()

    if (args.json) {
      output.json({
        checks,
        passed: checks.filter((c) => c.passed).length,
        failed: checks.filter((c) => !c.passed).length,
        total: checks.length,
      })
      return
    }

    output.header("OpenTeamCode Health Check")

    const passed = checks.filter((c) => c.passed).length
    const failed = checks.filter((c) => !c.passed).length

    for (const check of checks) {
      output.check(check.name, check.passed, check.detail)
    }

    console.log()

    if (failed > 0) {
      output.warning(`${passed}/${checks.length} checks passed`)
      console.log()
      output.info("Remediation steps:")
      for (const check of checks) {
        if (!check.passed && check.remediation) {
          output.listItem(check.remediation)
        }
      }
    } else {
      output.success(`All ${checks.length} checks passed`)
    }

    console.log()

    // Exit with non-zero if any checks failed
    if (failed > 0) {
      process.exit(1)
    }
  },
}
