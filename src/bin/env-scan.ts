#!/usr/bin/env node

import * as path from "path";
import chalk from "chalk";
import { scanFiles } from "../scanner";
import { checkEnvFile, parseEnvFile, updateEnvFile } from "../env-manager";

async function main() {
  try {
    console.log(chalk.blue("🔍 env-scan - Environment Variables Scanner"));
    console.log(
      chalk.gray("Scanning for environment variables in your codebase...")
    );

    const cwd = process.cwd();

    const { exists, path: envPath } = checkEnvFile(cwd);
    if (!exists) {
      console.log(chalk.green("✅ Created new .env file"));
    } else {
      console.log(chalk.green("✅ Found existing .env file"));
    }

    const existingVars = parseEnvFile(envPath);
    console.log(
      chalk.gray(
        `Found ${
          Object.keys(existingVars).length
        } existing environment variables`
      )
    );

    const fileEnvVarsMap = await scanFiles(cwd);

    const allEnvVars = new Set<string>();
    for (const envVars of fileEnvVarsMap.values()) {
      for (const varName of envVars) {
        allEnvVars.add(varName);
      }
    }

    if (fileEnvVarsMap.size > 0) {
      console.log(chalk.yellow("\nEnvironment variables found in files:"));

      for (const [file, vars] of fileEnvVarsMap.entries()) {
        console.log(chalk.cyan(`  ${file}:`));
        console.log(`    ${vars.join(", ")}`);
      }
    } else {
      console.log(
        chalk.yellow("\nNo environment variables found in your codebase.")
      );
    }

    console.log(chalk.blue("\nUpdating .env file..."));
    updateEnvFile(envPath, Array.from(allEnvVars), existingVars);

    console.log(
      chalk.green(
        "\n✨ Done! Your .env file is now in sync with your codebase."
      )
    );
  } catch (error) {
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  }
}

main();
