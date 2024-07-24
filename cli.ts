#!/usr/bin/env node

import { promptUser } from "./prompts/promptUser";
import { createProject } from "./utils/createProject";
import * as color from "ansi-colors";

(async () => {
  const defaultName = process.argv[2];
  const config = await promptUser(defaultName);
  await createProject(config);
  console.log(color.bgBlueBright("Done. Keep coding and fly on!"));
})();
