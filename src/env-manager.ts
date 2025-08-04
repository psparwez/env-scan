import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

/**
 * Checks if .env file exists in the specified directory
 * If it doesn't exist, creates an empty one
 */
export function checkEnvFile(dir: string = process.cwd()): {
  exists: boolean;
  path: string;
} {
  const envPath = path.join(dir, ".env");
  const exists = fs.existsSync(envPath);

  if (!exists) {
    console.log(".env file not found, creating one...");
    fs.writeFileSync(envPath, "# Environment Variables\n", "utf8");
    return { exists: false, path: envPath };
  }

  return { exists: true, path: envPath };
}

/**
 * Parses the existing .env file and returns the variables
 */
export function parseEnvFile(filePath: string): Record<string, string> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return dotenv.parse(content);
  } catch (error) {
    console.error("Error parsing .env file:", error);
    return {};
  }
}

/**
 * Updates the .env file with new environment variables
 */
export function updateEnvFile(
  filePath: string,
  newVars: string[],
  existingVars: Record<string, string> = {}
): void {
  const varsToAdd = newVars.filter((varName) => !(varName in existingVars));

  if (varsToAdd.length === 0) {
    console.log("No new environment variables to add.");
    return;
  }

  const additions = varsToAdd.map((varName) => `${varName}=`).join("\n");

  try {
    fs.appendFileSync(filePath, `\n${additions}\n`, "utf8");
    console.log(
      `Added ${varsToAdd.length} new environment variables to .env file.`
    );
  } catch (error) {
    console.error("Error updating .env file:", error);
  }
}
