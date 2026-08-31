import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIRECTORY = path.dirname(CURRENT_FILE);
const SERVER_DIRECTORY = path.resolve(
  SCRIPTS_DIRECTORY,
  "..",
);

const OUTPUT_DIRECTORY = path.join(
  SERVER_DIRECTORY,
  "dist-database",
);

const OUTPUT_FILE = path.join(
  OUTPUT_DIRECTORY,
  "seed-rbac.mjs",
);

const main = async () => {
  await fs.mkdir(OUTPUT_DIRECTORY, {
    recursive: true,
  });

  await build({
    entryPoints: [
      path.join(
        SERVER_DIRECTORY,
        "seeders",
        "001_bootstrap_rbac.js",
      ),
    ],

    outfile: OUTPUT_FILE,

    bundle: true,

    minify: true,

    sourcemap: false,

    platform: "node",

    target: "node22",

    format: "esm",

    packages: "bundle",

    legalComments: "none",

    treeShaking: true,

    logLevel: "info",
  });

  console.log("");
  console.log(
    "RBAC seeder production build completed.",
  );
  console.log(`Output: ${OUTPUT_FILE}`);
};

main().catch((error) => {
  console.error("");
  console.error(
    "RBAC seeder production build failed.",
  );
  console.error(error);
  process.exitCode = 1;
});