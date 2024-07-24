import { input, select, confirm, number } from "@inquirer/prompts";
import * as color from "ansi-colors";
import { ProjectConfig } from "../types";

export const promptUser = async (
  defaultName: string
): Promise<ProjectConfig> => {
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
