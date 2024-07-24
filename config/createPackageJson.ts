import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { ProjectConfig } from "../types";
import { createSpinner } from "nanospinner";

export const createPackageJson = async (
  config: ProjectConfig
): Promise<void> => {
  const latestVersion = (pkg: string) => {
    const spinner = createSpinner(`Fetching ${pkg} version`).start();
    try {
      const version = execSync(`npm show ${pkg} version`).toString().trim();
      spinner.success({ text: `Fetched ${pkg} version: ${version}` });
      return version;
    } catch (error) {
      spinner.error({ text: `Failed to fetch ${pkg} version` });
      throw error;
    }
  };

  const packageJson = {
    name: config.name,
    version: "1.0.0",
    main: config.language === "TypeScript" ? "index.ts" : "index.js",
    scripts: {
      start:
        config.language === "TypeScript"
          ? "node dist/index.js"
          : "node index.js",
      dev: "nodemon",
      ...(config.language === "TypeScript" && { build: "tsc -p ." }),
    },
    dependencies: {
      express: `^${latestVersion("express")}`,
      destino: `^${latestVersion("destino")}`,
    },
    devDependencies: {
      nodemon: `^${latestVersion("nodemon")}`,
      ...(config.language === "TypeScript" && {
        "ts-node": `^${latestVersion("ts-node")}`,
        typescript: `^${latestVersion("typescript")}`,
      }),
    },
  };

  const packageJsonPath = path.join(process.cwd(), config.name, "package.json");
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};
