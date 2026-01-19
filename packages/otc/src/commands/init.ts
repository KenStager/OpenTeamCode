/**
 * otc init - Initialize .ai/ folder with team configuration templates
 */

import type { CommandModule } from "yargs"
import { mkdir, writeFile, access, copyFile, readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import * as output from "../util/output"
import { AI_FOLDER, CONFIG_FILE, STANDARDS_FILE, POLICIES_FILE, SESSIONS_FOLDER, REVIEW_FILE } from "../util/config"

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, "..", "..", "templates")

interface InitArgs {
  force?: boolean
  team?: string
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function copyTemplate(templateName: string, destPath: string, replacements?: Record<string, string>): Promise<void> {
  const templatePath = join(TEMPLATES_DIR, templateName)

  if (replacements) {
    let content = await readFile(templatePath, "utf-8")
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
    }
    await writeFile(destPath, content, "utf-8")
  } else {
    await copyFile(templatePath, destPath)
  }
}

export const InitCommand: CommandModule<{}, InitArgs> = {
  command: "init",
  describe: "Initialize .ai/ folder with team configuration templates",
  builder: (yargs) => {
    return yargs
      .option("force", {
        alias: "f",
        type: "boolean",
        description: "Overwrite existing files",
        default: false,
      })
      .option("team", {
        alias: "t",
        type: "string",
        description: "Team name to set in config",
      })
  },
  handler: async (args) => {
    const cwd = process.cwd()
    const aiPath = join(cwd, AI_FOLDER)

    output.header("Initializing OpenTeamCode")

    // Check if .ai/ already exists
    const aiExists = await fileExists(aiPath)
    if (aiExists && !args.force) {
      output.warning(`.ai/ folder already exists. Use --force to overwrite.`)
      process.exit(1)
    }

    // Create directories
    try {
      await mkdir(aiPath, { recursive: true })
      await mkdir(join(aiPath, SESSIONS_FOLDER), { recursive: true })
      await mkdir(join(aiPath, "memory", "patterns"), { recursive: true })
      await mkdir(join(aiPath, "memory", "gotchas"), { recursive: true })
      await mkdir(join(aiPath, "memory", "decisions"), { recursive: true })
      output.success("Created .ai/ directory structure")
    } catch (error) {
      output.error(`Failed to create directories: ${error}`)
      process.exit(1)
    }

    // Copy templates
    const files = [
      { template: "config.yaml", dest: CONFIG_FILE },
      { template: "standards.md", dest: STANDARDS_FILE },
      { template: "policies.yaml", dest: POLICIES_FILE },
      { template: "review.md", dest: REVIEW_FILE },
    ]

    for (const file of files) {
      const destPath = join(aiPath, file.dest)
      const exists = await fileExists(destPath)

      if (exists && !args.force) {
        output.info(`Skipping ${file.dest} (already exists)`)
        continue
      }

      try {
        await copyTemplate(file.template, destPath)
        output.success(`Created ${file.dest}`)
      } catch (error) {
        output.error(`Failed to create ${file.dest}: ${error}`)
      }
    }

    // Create .gitkeep files for empty directories
    const gitkeepDirs = [
      join(aiPath, SESSIONS_FOLDER),
      join(aiPath, "memory", "patterns"),
      join(aiPath, "memory", "gotchas"),
      join(aiPath, "memory", "decisions"),
    ]

    for (const dir of gitkeepDirs) {
      const gitkeepPath = join(dir, ".gitkeep")
      if (!(await fileExists(gitkeepPath))) {
        await writeFile(gitkeepPath, "", "utf-8")
      }
    }

    // Update config with team name if provided
    if (args.team) {
      const configPath = join(aiPath, CONFIG_FILE)
      let configContent = await readFile(configPath, "utf-8")
      configContent = configContent.replace(
        /# team: your-team-name/,
        `team: ${args.team}`
      )
      await writeFile(configPath, configContent, "utf-8")
      output.success(`Set team name to "${args.team}"`)
    }

    console.log()
    output.info("Next steps:")
    output.listItem("Edit .ai/standards.md with your team's coding conventions")
    output.listItem("Review .ai/policies.yaml guardrail patterns")
    output.listItem("Customize .ai/review.md with your team's PR review rubric")
    output.listItem("Configure ADO settings in .ai/config.yaml for PR commands")
    output.listItem("Run 'otc status' to verify setup")
    output.listItem("Run 'otc doctor' for a health check")
    console.log()
  },
}
