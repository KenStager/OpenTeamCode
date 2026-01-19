/**
 * Formatted output helpers for CLI
 */

import chalk from "chalk"

export const symbols = {
  success: chalk.green("✓"),
  error: chalk.red("✗"),
  warning: chalk.yellow("!"),
  info: chalk.blue("i"),
  bullet: chalk.dim("•"),
  arrow: chalk.dim("→"),
}

/**
 * Print a header with a separator
 */
export function header(text: string): void {
  console.log()
  console.log(chalk.bold(text))
  console.log(chalk.dim("─".repeat(Math.min(text.length + 10, 60))))
}

/**
 * Print a success message
 */
export function success(message: string): void {
  console.log(`${symbols.success} ${message}`)
}

/**
 * Print an error message
 */
export function error(message: string): void {
  console.log(`${symbols.error} ${chalk.red(message)}`)
}

/**
 * Print a warning message
 */
export function warning(message: string): void {
  console.log(`${symbols.warning} ${chalk.yellow(message)}`)
}

/**
 * Print an info message
 */
export function info(message: string): void {
  console.log(`${symbols.info} ${message}`)
}

/**
 * Print a dimmed/secondary message
 */
export function dim(message: string): void {
  console.log(chalk.dim(message))
}

/**
 * Print a key-value pair
 */
export function keyValue(key: string, value: string, indent: number = 0): void {
  const prefix = " ".repeat(indent)
  console.log(`${prefix}${chalk.dim(key + ":")} ${value}`)
}

/**
 * Print a list item
 */
export function listItem(text: string, indent: number = 0): void {
  const prefix = " ".repeat(indent)
  console.log(`${prefix}${symbols.bullet} ${text}`)
}

/**
 * Print a table from an array of objects
 */
export function table<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string; width?: number; format?: (value: unknown) => string }[]
): void {
  if (data.length === 0) {
    dim("  No data to display")
    return
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    if (col.width) return col.width
    const headerLen = col.header.length
    const maxDataLen = Math.max(...data.map((row) => String(row[col.key] ?? "").length))
    return Math.max(headerLen, maxDataLen) + 2
  })

  // Print header
  const headerRow = columns.map((col, i) => col.header.padEnd(widths[i])).join("")
  console.log(chalk.dim(headerRow))
  console.log(chalk.dim("─".repeat(widths.reduce((a, b) => a + b, 0))))

  // Print rows
  for (const row of data) {
    const rowStr = columns
      .map((col, i) => {
        const value = col.format ? col.format(row[col.key]) : String(row[col.key] ?? "")
        return value.padEnd(widths[i])
      })
      .join("")
    console.log(rowStr)
  }
}

/**
 * Print a box around content
 */
export function box(title: string, lines: string[]): void {
  const maxLen = Math.max(title.length, ...lines.map((l) => l.length)) + 4
  const border = "─".repeat(maxLen)

  console.log(chalk.dim(`┌${border}┐`))
  console.log(chalk.dim("│ ") + chalk.bold(title.padEnd(maxLen - 2)) + chalk.dim(" │"))
  console.log(chalk.dim(`├${border}┤`))
  for (const line of lines) {
    console.log(chalk.dim("│ ") + line.padEnd(maxLen - 2) + chalk.dim(" │"))
  }
  console.log(chalk.dim(`└${border}┘`))
}

/**
 * Print a check result (pass/fail)
 */
export function check(name: string, passed: boolean, detail?: string): void {
  const symbol = passed ? symbols.success : symbols.error
  const nameStr = passed ? name : chalk.red(name)
  const detailStr = detail ? chalk.dim(` (${detail})`) : ""
  console.log(`  ${symbol} ${nameStr}${detailStr}`)
}

/**
 * Format a date relative to now
 */
export function relativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return "just now"
}

/**
 * Print JSON output (for --json flag)
 */
export function json(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

/**
 * Truncate a string to a max length
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + "..."
}
