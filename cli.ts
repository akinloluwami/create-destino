#!/usr/bin/env node

import { input, select, confirm, number } from "@inquirer/prompts";
import * as fs from "fs";
import * as path from "path";
import * as color from "ansi-colors";

interface ProjectConfig {
  name: string;
  language: "JavaScript" | "TypeScript";
  configuration: "default" | "custom";
  port?: number;
  enableJsonParser?: boolean;
  enableUrlencoded?: boolean;
  serveStatic?: { folder: string; route: string }[];
  enableRateLimit?: boolean;
}

const promptUser = async (defaultName: string): Promise<ProjectConfig> => {
  const name = defaultName || (await input({ message: "Project name:" }));
  const language = await select({
    message: "Language:",
    choices: [
      { name: "JavaScript", value: "JavaScript" },
      { name: "TypeScript", value: "TypeScript" },
    ],
  });
  const configuration = await select({
    message: "Configuration:",
    choices: [
      { name: "default", value: "default" },
      { name: "custom", value: "custom" },
    ],
  });

  //@ts-ignore
  const config: ProjectConfig = { name, language, configuration };

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

const createPackageJson = (config: ProjectConfig): void => {
  const packageJson = {
    name: config.name,
    version: "1.0.0",
    main: config.language === "TypeScript" ? "index.ts" : "index.js",
    scripts: {
      start:
        config.language === "TypeScript" ? "ts-node index.ts" : "node index.js",
      dev: "nodemon",
    },
    dependencies: {
      express: "^4.17.1",
      "@destiny-js/core": "^1.0.0",
    },
    devDependencies: {
      nodemon: "^2.0.7",
    },
  };

  if (config.language === "TypeScript") {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      //@ts-ignore
      "ts-node": "^9.1.1",
      typescript: "^4.1.3",
    };
  }

  const packageJsonPath = path.join(process.cwd(), config.name, "package.json");
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

const createDestinyConfig = (config: ProjectConfig): void => {
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
      ? "destiny.config.ts"
      : "destiny.config.js";
  const configPath = path.join(process.cwd(), config.name, configFileName);

  let configContent;
  if (config.language === "TypeScript") {
    configContent = `import { Config } from "@destiny-js/core";

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

  // Create hello route file
  const helloRouteContent =
    config.language === "TypeScript"
      ? `import { Request, Response } from 'express';

export function GET(req: Request, res: Response) {
  res.send('Hello Destiny!');
}

export function POST(req: Request, res: Response) {
  const { message } = req.body;
  res.status(200).json({ message });
}
`
      : `const express = require('express');

function GET(req, res) {
  res.send('Hello Destiny!');
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

const createProject = (config: ProjectConfig): void => {
  const projectPath = path.join(process.cwd(), config.name);
  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(path.join(projectPath, "routes"), { recursive: true });

  createPackageJson(config);
  createDestinyConfig(config);
  createExampleRoutes(config);

  const indexFilePath = path.join(
    projectPath,
    `index.${config.language === "TypeScript" ? "ts" : "js"}`
  );

  const indexFileContent =
    config.language === "TypeScript"
      ? `import { createServer } from "@destiny-js/core";

createServer();

`
      : `const { createServer } = require("@destiny-js/core");

createServer();

`;

  fs.writeFileSync(indexFilePath, indexFileContent);

  console.log(color.green(`Project ${config.name} created successfully.`));
  console.log(
    color.yellow(
      `Run 'cd ${config.name} && npm install' to install dependencies.`
    )
  );
};

import * as readline from "readline";

const handleExit = () => {
  console.log("\n" + color.yellow("Initialization cancelled."));
  process.exit(1);
};

const init = async (): Promise<void> => {
  const args = process.argv.slice(2);
  let projectName = args[0] || "";
  const currentDir = process.cwd();

  if (process.platform === "win32") {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on("SIGINT", () => {
      rl.pause();
      handleExit();
    });
  } else {
    process.on("SIGINT", handleExit);
  }

  if (projectName === ".") {
    projectName = path.basename(currentDir);
    const files = fs.readdirSync(currentDir);
    if (files.length > 0) {
      console.error(
        color.red(
          "The current directory is not empty. Please choose an empty directory."
        )
      );
      process.exit(1);
    }
  } else if (projectName && fs.existsSync(path.join(currentDir, projectName))) {
    console.error(
      color.red("The project name conflicts with an existing directory.")
    );
    process.exit(1);
  }

  const config = await promptUser(projectName);
  createProject(config);
};

init();
