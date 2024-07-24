import * as fs from "fs";
import * as path from "path";
import { ProjectConfig } from "../types";

export const createExampleRoutes = (config: ProjectConfig): void => {
  const routesDir = path.join(process.cwd(), config.name, "routes");

  const helloRouteContent =
    config.language === "TypeScript"
      ? `import { Request, Response } from 'express';

export function GET(req: Request, res: Response) {
  res.send('Hello Destino!');
}

export function POST(req: Request, res: Response) {
  const { message } = req.body;
  res.status(200).json({ message });
}
`
      : `const express = require('express');

function GET(req, res) {
  res.send('Hello Destino!');
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
