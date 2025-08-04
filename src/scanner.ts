import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

/**
 * Extracts environment variable references from various formats:
 * - process.env.VARIABLE_NAME
 * - import.meta.env.VITE_SOME_KEY
 * - env.PORT
 * - env("DATABASE_URL") (Prisma style)
 * - process.env["VARIABLE_NAME"] (bracket notation)
 */
export function extractEnvVarsFromContent(content: string): string[] {
  const envVarsSet = new Set<string>();

  const combinedRegex =
    /(?:process\.env|import\.meta\.env|\benv\b)(?:\.([A-Za-z0-9_]+)\b|\[['"]([A-Za-z0-9_]+)['"]\]|\(['"]([A-Za-z0-9_]+)['"]\))/g;

  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    const varName = match[1] || match[2] || match[3];
    if (varName) {
      envVarsSet.add(varName);
    }
  }

  return Array.from(envVarsSet).sort();
}

/**
 * Scans all files in the given directory for environment variable references
 */
export async function scanFiles(
  dir: string = process.cwd(),
  filePatterns: string[] = [
    "**/*.js",
    "**/*.ts",
    "**/*.jsx",
    "**/*.tsx",
    "**/*.prisma",
    "**/*.env*",
  ]
): Promise<Map<string, string[]>> {
  console.log(`Scanning directory: ${dir}`);

  const ignorePatterns = [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/.next/**",
    "**/coverage/**",
  ];

  const files = await glob(filePatterns, {
    cwd: dir,
    ignore: ignorePatterns,
    absolute: true,
  });

  console.log(`Found ${files.length} files to scan`);

  const results = new Map<string, string[]>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const envVars = extractEnvVarsFromContent(content);

      if (envVars.length > 0) {
        const relativePath = path.relative(dir, file);
        results.set(relativePath, envVars);
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  return results;
}

/**
 * Helper function to display results in a readable format
 */
export function displayResults(results: Map<string, string[]>): void {
  if (results.size === 0) {
    console.log("No environment variables found.");
    return;
  }

  console.log("\n📋 Environment Variables Found:");
  console.log("=" + "=".repeat(50));

  // Get all unique environment variables
  const allEnvVars = new Set<string>();
  results.forEach((vars) => vars.forEach((v) => allEnvVars.add(v)));

  console.log(
    `\n🔍 Summary: ${allEnvVars.size} unique environment variables found in ${results.size} files\n`
  );

  // Display by file
  for (const [file, envVars] of results) {
    console.log(`📄 ${file}`);
    envVars.forEach((envVar) => {
      console.log(`   └── ${envVar}`);
    });
    console.log();
  }

  console.log("🌟 All Unique Variables:");
  Array.from(allEnvVars)
    .sort()
    .forEach((envVar) => {
      console.log(`   • ${envVar}`);
    });
}

/**
 * Main scanning function with built-in result display
 */
export async function scanAndDisplay(
  dir: string = process.cwd(),
  filePatterns?: string[]
): Promise<Map<string, string[]>> {
  const results = await scanFiles(dir, filePatterns);
  displayResults(results);
  return results;
}
