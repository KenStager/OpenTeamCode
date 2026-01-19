/**
 * Configuration loading utilities for .ai/ folder
 */

import { readFile, access, readdir, stat } from "fs/promises"
import { join, resolve } from "path"
import { parse as parseYaml } from "yaml"
import { z } from "zod"

// Schema for .ai/config.yaml
export const ConfigSchema = z.object({
  version: z.string().default("1"),
  team: z.string().optional(),
  opencode: z
    .object({
      server: z.string().optional(),
      port: z.number().optional(),
    })
    .optional(),
  sessions: z
    .object({
      directory: z.string().default("sessions"),
      visibility: z.enum(["team", "private"]).default("team"),
    })
    .optional(),
  guardrails: z
    .object({
      enabled: z.boolean().default(true),
      policies: z.string().default("policies.yaml"),
    })
    .optional(),
})

export type Config = z.infer<typeof ConfigSchema>

// Schema for .ai/policies.yaml
export const PolicyPatternSchema = z.object({
  name: z.string(),
  regex: z.string(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  description: z.string().optional(),
  falsePositiveIndicators: z.array(z.string()).optional(),
})

export const PoliciesSchema = z.object({
  version: z.string().default("1"),
  patterns: z.array(PolicyPatternSchema).default([]),
  excludePaths: z.array(z.string()).optional(),
  excludeExtensions: z.array(z.string()).optional(),
})

export type Policies = z.infer<typeof PoliciesSchema>
export type PolicyPattern = z.infer<typeof PolicyPatternSchema>

// Session metadata schema
export const SessionMetadataSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  intent: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(["active", "handed-off", "completed", "archived"]).default("active"),
  created: z.string(),
  updated: z.string(),
  plan: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
  opencode: z
    .object({
      sessionId: z.string().optional(),
      compacted: z.boolean().optional(),
    })
    .optional(),
})

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>

export const AI_FOLDER = ".ai"
export const CONFIG_FILE = "config.yaml"
export const STANDARDS_FILE = "standards.md"
export const POLICIES_FILE = "policies.yaml"
export const SESSIONS_FOLDER = "sessions"

/**
 * Find the .ai/ folder starting from a directory and walking up
 */
export async function findAiFolder(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = resolve(startDir)

  while (true) {
    const aiPath = join(currentDir, AI_FOLDER)
    try {
      await access(aiPath)
      return aiPath
    } catch {
      const parentDir = resolve(currentDir, "..")
      // Stop when we've reached the filesystem root (parent equals current)
      if (parentDir === currentDir) {
        return null
      }
      currentDir = parentDir
    }
  }
}

/**
 * Check if .ai/ folder exists in the given directory
 */
export async function hasAiFolder(dir: string = process.cwd()): Promise<boolean> {
  try {
    await access(join(dir, AI_FOLDER))
    return true
  } catch {
    return false
  }
}

/**
 * Load and parse the .ai/config.yaml file
 */
export async function loadConfig(aiPath: string): Promise<Config | null> {
  const configPath = join(aiPath, CONFIG_FILE)
  try {
    const content = await readFile(configPath, "utf-8")
    const parsed = parseYaml(content)
    return ConfigSchema.parse(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    // Provide user-friendly error messages for common issues
    if (error instanceof z.ZodError) {
      const issues = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      throw new Error(`Invalid config.yaml schema: ${issues}`)
    }
    if (error instanceof Error && error.name === "YAMLParseError") {
      throw new Error(`Invalid YAML syntax in config.yaml: ${error.message}`)
    }
    throw error
  }
}

/**
 * Load and parse the .ai/policies.yaml file
 */
export async function loadPolicies(aiPath: string): Promise<Policies | null> {
  const policiesPath = join(aiPath, POLICIES_FILE)
  try {
    const content = await readFile(policiesPath, "utf-8")
    const parsed = parseYaml(content)
    return PoliciesSchema.parse(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    // Provide user-friendly error messages for common issues
    if (error instanceof z.ZodError) {
      const issues = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      throw new Error(`Invalid policies.yaml schema: ${issues}`)
    }
    if (error instanceof Error && error.name === "YAMLParseError") {
      throw new Error(`Invalid YAML syntax in policies.yaml: ${error.message}`)
    }
    throw error
  }
}

/**
 * Load the .ai/standards.md file
 */
export async function loadStandards(aiPath: string): Promise<string | null> {
  const standardsPath = join(aiPath, STANDARDS_FILE)
  try {
    return await readFile(standardsPath, "utf-8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    throw error
  }
}

/**
 * List all sessions in .ai/sessions/
 */
export async function listSessions(aiPath: string): Promise<SessionMetadata[]> {
  const sessionsPath = join(aiPath, SESSIONS_FOLDER)
  const sessions: SessionMetadata[] = []

  try {
    const entries = await readdir(sessionsPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const sessionJsonPath = join(sessionsPath, entry.name, "session.json")
      try {
        const content = await readFile(sessionJsonPath, "utf-8")
        const parsed = JSON.parse(content)
        sessions.push(SessionMetadataSchema.parse(parsed))
      } catch {
        // Skip invalid session folders
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return []
    }
    throw error
  }

  // Sort by updated date, most recent first
  sessions.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
  return sessions
}

/**
 * Get a specific session by ID
 */
export async function getSession(aiPath: string, sessionId: string): Promise<SessionMetadata | null> {
  const sessionsPath = join(aiPath, SESSIONS_FOLDER)

  try {
    const entries = await readdir(sessionsPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const sessionJsonPath = join(sessionsPath, entry.name, "session.json")
      try {
        const content = await readFile(sessionJsonPath, "utf-8")
        const parsed = JSON.parse(content)
        const session = SessionMetadataSchema.parse(parsed)
        if (session.id === sessionId || entry.name.includes(sessionId)) {
          return session
        }
      } catch {
        // Skip invalid session folders
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Get the session folder path for a session ID
 */
export async function getSessionFolder(aiPath: string, sessionId: string): Promise<string | null> {
  const sessionsPath = join(aiPath, SESSIONS_FOLDER)

  try {
    const entries = await readdir(sessionsPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const sessionJsonPath = join(sessionsPath, entry.name, "session.json")
      try {
        const content = await readFile(sessionJsonPath, "utf-8")
        const parsed = JSON.parse(content)
        const session = SessionMetadataSchema.parse(parsed)
        if (session.id === sessionId || entry.name.includes(sessionId)) {
          return join(sessionsPath, entry.name)
        }
      } catch {
        // Skip invalid session folders
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Get the file stats for .ai/ folder files
 */
export async function getAiFolderStats(aiPath: string): Promise<{
  config: { exists: boolean; modified?: Date }
  standards: { exists: boolean; modified?: Date }
  policies: { exists: boolean; modified?: Date }
  sessions: { exists: boolean; count?: number }
}> {
  const result = {
    config: { exists: false } as { exists: boolean; modified?: Date },
    standards: { exists: false } as { exists: boolean; modified?: Date },
    policies: { exists: false } as { exists: boolean; modified?: Date },
    sessions: { exists: false } as { exists: boolean; count?: number },
  }

  try {
    const configStats = await stat(join(aiPath, CONFIG_FILE))
    result.config = { exists: true, modified: configStats.mtime }
  } catch {}

  try {
    const standardsStats = await stat(join(aiPath, STANDARDS_FILE))
    result.standards = { exists: true, modified: standardsStats.mtime }
  } catch {}

  try {
    const policiesStats = await stat(join(aiPath, POLICIES_FILE))
    result.policies = { exists: true, modified: policiesStats.mtime }
  } catch {}

  try {
    const entries = await readdir(join(aiPath, SESSIONS_FOLDER), { withFileTypes: true })
    const sessionCount = entries.filter((e) => e.isDirectory()).length
    result.sessions = { exists: true, count: sessionCount }
  } catch {}

  return result
}
