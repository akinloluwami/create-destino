#!/usr/bin/env node

import { promptUser } from "./prompts/promptUser";
import { createProject } from "./utils/createProject";
import figlet from "figlet";
import color from "ansi-colors";

function renderBigBoldText(text: string) {
  return color.bold(figlet.textSync(text));
}

(async () => {
  const defaultName = process.argv[2];
  const header = renderBigBoldText("create-destino");
  console.log(header);
  console.log("Let's get started!");

  const config = await promptUser(defaultName);
  await createProject(config);

  console.log(color.bgBlueBright.black("Done. Keep coding and fly on!"));
})();
