import * as fs from "fs";
import * as path from "path";
import color from "ansi-colors";
import { execSync } from "child_process";
import { createPackageJson } from "../config/createPackageJson";
import { createTsConfig } from "../config/createTsConfig";
import { createDestinoConfig } from "../config/createDestinoConfig";
import { createExampleRoutes } from "../files/createExampleRoutes";
import { createGitIgnore } from "../files/createGitIgnore";
import { ProjectConfig } from "../types";
import { confirm } from "@inquirer/prompts";

export const createProject = async (config: ProjectConfig): Promise<void> => {
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

    const startServer = await confirm({
      message: "Do you want to start the dev server now?",
    });

    if (startServer) {
      const startCommand =
        config.packageManager === "npm"
          ? "npm run dev"
          : config.packageManager === "yarn"
          ? "yarn dev"
          : "pnpm dev";
      execSync(`cd ${config.name} && ${startCommand}`, { stdio: "inherit" });
    } else {
      console.log(
        color.yellow(
          `Sure, you can always start the dev server later by running '${config.packageManager} run dev'.`
        )
      );
    }
  } else {
    console.log(
      color.yellow(
        `Sure, you can always install dependencies later by running '${config.packageManager} install'.`
      )
    );
  }
};
