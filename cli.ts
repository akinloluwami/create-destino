#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as color from "ansi-colors";
import { promptUser } from "./prompts/promptUser";
import { execCommand } from "./utils/execCommand";
import { createDestinoConfig } from "./config/createDestinoConfig";
import { createPackageJson } from "./config/createPackageJson";
import { createTsConfig } from "./config/createTsConfig";
import { createExampleRoutes } from "./files/createExampleRoutes";
import { createGitIgnore } from "./files/createGitIgnore";
import { confirm } from "@inquirer/prompts";

const main = async () => {
  console.log(color.green("Welcome to create-destino!"));

  const defaultName = process.argv[2] ?? "";

  const config = await promptUser(defaultName);

  if (!fs.existsSync(config.name)) {
    fs.mkdirSync(config.name);
  } else {
    console.error(
      color.red("Directory already exists. Please choose another name.")
    );
    process.exit(1);
  }

  if (config.language === "TypeScript") {
    createTsConfig(config);
  }

  createDestinoConfig(config);
  createPackageJson(config);
  createExampleRoutes(config);
  createGitIgnore();

  const packageManager = config.packageManager || "npm";
  const command = `${packageManager} install`;

  const installDependencies = await confirm({
    message: "Do you want to install dependencies?",
    default: true,
  });

  if (installDependencies) {
    console.log(
      color.green(`Installing dependencies using ${packageManager}...`)
    );
    await execCommand(`cd ${config.name} && ${command}`);
  }

  console.log(color.green("Done. Keep coding and fly on."));
};

main().catch((error) => {
  console.error(color.red(error));
  process.exit(1);
});
