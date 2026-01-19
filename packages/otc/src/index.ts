#!/usr/bin/env bun
/**
 * OpenTeamCode CLI (otc)
 * Team-native collaboration primitives for AI-assisted coding
 */

import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { InitCommand } from "./commands/init"
import { StatusCommand } from "./commands/status"
import { DoctorCommand } from "./commands/doctor"
import { GuardrailCommand } from "./commands/guardrail"
import { HandoffCommand } from "./commands/handoff"
import { SessionsCommand } from "./commands/sessions"
import { ContinueCommand } from "./commands/continue"

const VERSION = "0.1.0"

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName("otc")
    .version(VERSION)
    .usage("$0 <command> [options]")
    .command(InitCommand)
    .command(StatusCommand)
    .command(DoctorCommand)
    .command(GuardrailCommand)
    .command(HandoffCommand)
    .command(SessionsCommand)
    .command(ContinueCommand)
    .demandCommand(1, "Please specify a command")
    .help()
    .alias("h", "help")
    .alias("v", "version")
    .strict()
    .wrap(Math.min(100, process.stdout.columns || 80))
    .epilogue(
      "For more information, see: https://github.com/your-org/openteamcode\n" +
        "Built on OpenCode: https://opencode.ai"
    )
    .parse()
}

main().catch((error) => {
  console.error("Error:", error.message)
  process.exit(1)
})
