#!/usr/bin/env node

/**
 * Bundle the plugin for distribution
 * Uses esbuild to create a single-file bundle
 */

import * as esbuild from "esbuild"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")

async function build() {
  try {
    await esbuild.build({
      entryPoints: [join(rootDir, "src/index.ts")],
      bundle: true,
      outfile: join(rootDir, "dist/index.js"),
      platform: "node",
      target: "node20",
      format: "esm",
      sourcemap: true,
      external: [
        "@opencode-ai/plugin",
        "@opencode-ai/sdk",
        "@anthropic-ai/sdk",
        "zod",
      ],
      banner: {
        js: "// @opencode-ai/otc-plugin - OpenTeamCode Plugin for OpenCode\n",
      },
    })
    console.log("Build complete: dist/index.js")
  } catch (error) {
    console.error("Build failed:", error)
    process.exit(1)
  }
}

build()
