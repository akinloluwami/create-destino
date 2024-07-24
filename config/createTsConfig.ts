import * as fs from "fs";
import * as path from "path";
import { ProjectConfig } from "../types";

export const createTsConfig = (config: ProjectConfig): void => {
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
