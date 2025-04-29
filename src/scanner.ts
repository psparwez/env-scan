import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

/**
 * Extracts process.env.VARIABLE_NAME and import.meta.env.VITE_SOME_KEY references from a file's content
 * Handles various formats including direct access and bracket notation
 */
export function extractEnvVarsFromContent(content: string): string[] {
  const envVars: string[] = [];

  const processEnvRegex =
    /process\.env\.([A-Za-z0-9_]+)|process\.env\[['"]([A-Za-z0-9_]+)['"]\]/g;

  const viteEnvRegex =
    /import\.meta\.env\.([A-Za-z0-9_]+)|import\.meta\.env\[['"]([A-Za-z0-9_]+)['"]\]/g;

  let match;

  while ((match = processEnvRegex.exec(content)) !== null) {
    const varName = match[1] || match[2];
    if (varName && !envVars.includes(varName)) {
      envVars.push(varName);
    }
  }

  while ((match = viteEnvRegex.exec(content)) !== null) {
    const varName = match[1] || match[2];
    if (varName && !envVars.includes(varName)) {
      envVars.push(varName);
    }
  }

  return envVars;
}

/**
 * Scans all files in the given directory for process.env references
 */
export async function scanFiles(
  dir: string = process.cwd(),
  filePatterns: string[] = ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
): Promise<Map<string, string[]>> {
  console.log(`Scanning directory: ${dir}`);

  const ignorePatterns = [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
  ];

  const files = await glob(filePatterns, {
    cwd: dir,
    ignore: ignorePatterns,
    absolute: true,
  });

  console.log(`Found ${files.length} files to scan`);

  // Map to store results: filename -> [envVars]
  const results = new Map<string, string[]>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const envVars = extractEnvVarsFromContent(content);

      if (envVars.length > 0) {
        results.set(path.relative(dir, file), envVars);
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  return results;
}
