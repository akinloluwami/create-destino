import * as fs from "fs";
import * as path from "path";
import { ProjectConfig } from "types";

export const createDestinoConfig = (config: ProjectConfig): void => {
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
