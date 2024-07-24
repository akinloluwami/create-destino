import * as fs from "fs";
import * as path from "path";

export const createGitIgnore = () => {
  const gitIgnoreContent = `
# Node modules
node_modules/
`;

  const gitIgnorePath = path.join(process.cwd(), ".gitignore");

  fs.writeFileSync(gitIgnorePath, gitIgnoreContent.trim());
};
