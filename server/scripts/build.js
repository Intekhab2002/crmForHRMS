import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIRECTORY = path.dirname(CURRENT_FILE);
const SERVER_DIRECTORY = path.resolve(SCRIPTS_DIRECTORY, "..");

const OUTPUT_DIRECTORY = path.join(SERVER_DIRECTORY, "dist");

const cleanOutputDirectory = async () => {
  await fs.rm(OUTPUT_DIRECTORY, {
    recursive: true,
    force: true,
  });

  await fs.mkdir(OUTPUT_DIRECTORY, {
    recursive: true,
  });
};

const buildApplication = async () => {
  await build({
    entryPoints: [
      path.join(SERVER_DIRECTORY, "src", "server.js"),
    ],

    outfile: path.join(
      OUTPUT_DIRECTORY,
      "app.cjs",
    ),

    bundle: true,

    minify: true,

    sourcemap: false,

    platform: "node",

    target: "node22",

    format: "cjs",

    packages: "bundle",

    legalComments: "none",

    treeShaking: true,

    metafile: false,

    logLevel: "info",
  });
};

const main = async () => {
  console.log("Cleaning backend build directory...");

  await cleanOutputDirectory();

  console.log("Building production backend...");

  await buildApplication();

  console.log("");
  console.log("Backend production build completed.");
  console.log(`Output: ${path.join(OUTPUT_DIRECTORY, "app.cjs")}`);
};

main().catch((error) => {
  console.error("");
  console.error("Backend production build failed.");
  console.error(error);
  process.exitCode = 1;
});