import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIRECTORY = path.dirname(CURRENT_FILE);
const SERVER_DIRECTORY = path.resolve(SCRIPTS_DIRECTORY, "..");

const OUTPUT_DIRECTORY = path.join(SERVER_DIRECTORY, "dist");
const WORKERS_OUTPUT_DIRECTORY = path.join(OUTPUT_DIRECTORY, "workers");

const SLA_WORKERS = [
  {
    name: "SLA worker",
    entry: path.join(
      SERVER_DIRECTORY,
      "src",
      "modules",
      "sla",
      "workers",
      "slaWorker.js",
    ),
    output: path.join(WORKERS_OUTPUT_DIRECTORY, "slaWorker.cjs"),
  },
  {
    name: "SLA reconciliation worker",
    entry: path.join(
      SERVER_DIRECTORY,
      "src",
      "modules",
      "sla",
      "workers",
      "slaReconciliation.js",
    ),
    output: path.join(WORKERS_OUTPUT_DIRECTORY, "slaReconciliation.cjs"),
  },
  {
    name: "SLA backfill review worker",
    entry: path.join(
      SERVER_DIRECTORY,
      "src",
      "modules",
      "sla",
      "workers",
      "slaBackfill.js",
    ),
    output: path.join(WORKERS_OUTPUT_DIRECTORY, "slaBackfill.cjs"),
  },
];

const cleanOutputDirectory = async () => {
  await fs.rm(OUTPUT_DIRECTORY, {
    recursive: true,
    force: true,
  });

  await fs.mkdir(WORKERS_OUTPUT_DIRECTORY, {
    recursive: true,
  });
};

const buildEntry = async (entryPoint, outputFile) => {
  await build({
    entryPoints: [entryPoint],
    outfile: outputFile,

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

const buildApplication = async () => {
  const entryPoint = path.join(SERVER_DIRECTORY, "src", "server.js");

  const outputFile = path.join(OUTPUT_DIRECTORY, "app.cjs");

  console.log("Building production API...");

  await buildEntry(entryPoint, outputFile);

  console.log(`API output: ${outputFile}`);
};

const buildSlaWorkers = async () => {
  console.log("\nBuilding SLA worker entry points...");

  for (const worker of SLA_WORKERS) {
    await fs.access(worker.entry);

    console.log(`Building ${worker.name}...`);

    await buildEntry(worker.entry, worker.output);

    console.log(`Output: ${worker.output}`);
  }
};

const verifyBuildArtifacts = async () => {
  const requiredFiles = [
    path.join(OUTPUT_DIRECTORY, "app.cjs"),
    ...SLA_WORKERS.map((worker) => worker.output),
  ];

  for (const filePath of requiredFiles) {
    const stats = await fs.stat(filePath);

    if (!stats.isFile() || stats.size === 0) {
      throw new Error(`Missing or empty build artifact: ${filePath}`);
    }
  }

  console.log("\nAll API and SLA worker artifacts verified.");
};

const main = async () => {
  console.log("Cleaning backend build directory...");

  await cleanOutputDirectory();

  await buildApplication();
  await buildSlaWorkers();
  await verifyBuildArtifacts();

  console.log("\nBackend production build completed.");
  console.log(`Output directory: ${OUTPUT_DIRECTORY}`);
};

main().catch((error) => {
  console.error("\nBackend production build failed.");
  console.error(error);
  process.exitCode = 1;
});
