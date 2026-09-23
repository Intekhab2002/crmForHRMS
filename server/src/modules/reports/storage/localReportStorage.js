import fs from "node:fs/promises";
import path from "node:path";

import reportsConfig from "../reports.config.js";

export async function writeLocalArtifact({ reportId, fileName, buffer }) {
  const directory = path.join(reportsConfig.storageRoot, reportId);
  await fs.mkdir(directory, { recursive: true });

  const safeName = path.basename(fileName);
  const absolutePath = path.join(directory, safeName);
  await fs.writeFile(absolutePath, buffer);

  return {
    storageKey: path.relative(reportsConfig.storageRoot, absolutePath).replaceAll("\\", "/"),
    absolutePath,
  };
}

export async function removeLocalArtifact(storageKey) {
  const safeKey = path.normalize(storageKey);
  const root = path.resolve(reportsConfig.storageRoot);
  const absolutePath = path.resolve(root, safeKey);

  if (!absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid report storage key.");
  }

  await fs.rm(absolutePath, { force: true });
}

export async function readLocalArtifact(storageKey) {
  const safeKey = path.normalize(storageKey);
  const root = path.resolve(reportsConfig.storageRoot);
  const absolutePath = path.resolve(root, safeKey);

  if (!absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid report storage key.");
  }

  return fs.readFile(absolutePath);
}

export default Object.freeze({
  writeLocalArtifact,
  readLocalArtifact,
  removeLocalArtifact,
});
