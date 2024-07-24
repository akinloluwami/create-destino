export interface ProjectConfig {
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
