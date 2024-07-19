#!/usr/bin/env node

import { input, select, confirm, number } from "@inquirer/prompts";
import * as fs from "fs";
import * as path from "path";
import * as color from "ansi-colors";
import { execSync } from "child_process";

interface ProjectConfig {
  name: string;
  language: "JavaScript" | "TypeScript";
  configuration: "default" | "custom";
  port?: number;
  enableJsonParser?: boolean;
  enableUrlencoded?: boolean;
  serveStatic?: { folder: string; route: string }[];
  enableRateLimit?: boolean;
  packageManager: "npm" | "yarn" | "pnpm";
}

const promptUser = async (defaultName: string): Promise<ProjectConfig> => {
  const name = defaultName || (await input({ message: "Project name:" }));

  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    console.error(
      color.red(
        "Invalid project name. Only letters, numbers, hyphens, and underscores are allowed."
      )
    );
    process.exit(1);
  }

  const language = (await select({
    message: "Language:",
    choices: [
      { name: "JavaScript", value: "JavaScript" },
      { name: "TypeScript", value: "TypeScript" },
    ],
  })) as "JavaScript" | "TypeScript";

  const configuration = (await select({
    message: "Configuration:",
    choices: [
      { name: "default", value: "default" },
      { name: "custom", value: "custom" },
    ],
  })) as "default" | "custom";

  const packageManager = (await select({
    message: "Package manager:",
    choices: [
      { name: "npm", value: "npm" },
      { name: "yarn", value: "yarn" },
      { name: "pnpm", value: "pnpm" },
    ],
  })) as "npm" | "yarn" | "pnpm";

  const config: ProjectConfig = {
    name,
    language,
    configuration,
    packageManager,
  };

  if (configuration === "custom") {
    config.port = await number({
      message: "Enter port number:",
      default: 3344,
    });
    config.enableJsonParser = await confirm({
      message: "Enable JSON parser?",
      default: true,
    });
    config.enableUrlencoded = await confirm({
      message: "Enable URL encoding?",
      default: true,
    });
    if (
      await confirm({
        message: "Do you want to serve static files?",
        default: false,
      })
    ) {
      const folder = await input({ message: "Static files folder:" });
      const route = await input({
        message: "Static files route (leave empty for root):",
        default: "",
      });
      config.serveStatic = [{ folder, route }];
    }
    config.enableRateLimit = await confirm({
      message: "Enable rate limits?",
      default: false,
    });
  }

  return config;
};

const createPackageJson = async (config: ProjectConfig): Promise<void> => {
  const latestVersion = (pkg: string) =>
    execSync(`npm show ${pkg} version`).toString().trim();

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

const createTsConfig = (config: ProjectConfig): void => {
  const tsConfig = {
    compilerOptions: {
      target: "ES6",
      module: "commonjs",
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: "./dist",
    },
    exclude: ["node_modules", "dist"],
  };

  const tsConfigPath = path.join(process.cwd(), config.name, "tsconfig.json");
  fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
};

const createDestinoConfig = (config: ProjectConfig): void => {
  const defaultConfig = {
    cors: {
      options: {
        origin: "*",
      },
    },
    enableJsonParser: true,
    enableUrlencoded: true,
  };

  const customConfig = {
    port: config.port,
    cors: {
      options: {
        origin: "*",
      },
    },
    enableJsonParser: config.enableJsonParser,
    enableUrlencoded: config.enableUrlencoded,
    serveStatic: config.serveStatic,
    rateLimit: config.enableRateLimit
      ? {
          route: "/*",
          options: {
            duration: "15m",
            max: 100,
            headers: true,
            message: "Limit exceeded",
          },
        }
      : undefined,
  };

  const finalConfig =
    config.configuration === "default" ? defaultConfig : customConfig;

  const configFileName =
    config.language === "TypeScript"
      ? "destino.config.ts"
      : "destino.config.js";
  const configPath = path.join(process.cwd(), config.name, configFileName);

  let configContent;
  if (config.language === "TypeScript") {
    configContent = `import { Config } from "destino";

const config: Config = ${JSON.stringify(finalConfig, null, 2)};

export default config;`;
  } else {
    configContent = `const config = ${JSON.stringify(finalConfig, null, 2)};

module.exports = config;`;
  }

  fs.writeFileSync(configPath, configContent);
};

const createExampleRoutes = (config: ProjectConfig): void => {
  const routesDir = path.join(process.cwd(), config.name, "routes");

  const helloRouteContent =
    config.language === "TypeScript"
      ? `import { Request, Response } from 'express';

export function GET(req: Request, res: Response) {
  res.send('Hello Destino!');
}

export function POST(req: Request, res: Response) {
  const { message } = req.body;
  res.status(200).json({ message });
}
`
      : `const express = require('express');

function GET(req, res) {
  res.send('Hello Destino!');
}

function POST(req, res) {
  const { message } = req.body;
  res.status(200).json({ message });
}

module.exports = {
  GET,
  POST
};
`;

  fs.writeFileSync(
    path.join(
      routesDir,
      "hello." + (config.language === "TypeScript" ? "ts" : "js")
    ),
    helloRouteContent
  );
};

function createGitIgnore() {
  const gitIgnoreContent = `
# Node modules
node_modules/
`;

  const gitIgnorePath = path.join(process.cwd(), ".gitignore");

  fs.writeFileSync(gitIgnorePath, gitIgnoreContent.trim());
}

const createProject = async (config: ProjectConfig): Promise<void> => {
  const projectPath = path.join(process.cwd(), config.name);
  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(path.join(projectPath, "routes"), { recursive: true });

  await createPackageJson(config);
  createDestinoConfig(config);
  createExampleRoutes(config);

  if (config.language === "TypeScript") {
    createTsConfig(config);
  }

  const indexFilePath = path.join(
    projectPath,
    `index.${config.language === "TypeScript" ? "ts" : "js"}`
  );

  const indexFileContent =
    config.language === "TypeScript"
      ? `import { createServer } from "destino";

createServer();

`
      : `const { createServer } = require("destino");

createServer();

`;

  fs.writeFileSync(indexFilePath, indexFileContent);

  console.log(color.green(`Project ${config.name} created successfully.`));

  createGitIgnore();

  const installDependencies = await confirm({
    message: "Do you want to install dependencies now?",
    default: true,
  });

  if (installDependencies) {
    const installCommand =
      config.packageManager === "npm"
        ? "npm install"
        : config.packageManager === "yarn"
        ? "yarn install"
        : "pnpm install";
    execSync(`cd ${config.name} && ${installCommand}`, { stdio: "inherit" });
    console.log(color.green("Dependencies installed successfully."));
  } else {
    console.log(
      color.yellow(
        `Sure, you can always install dependencies later by running '${config.packageManager} install'.`
      )
    );
  }
};

(async () => {
  const defaultName = process.argv[2];
  const config = await promptUser(defaultName);
  await createProject(config);
  console.log(color.blue("Done. Keep coding and fly on!"));
})();
