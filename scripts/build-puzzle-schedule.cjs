/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const tempDir = path.join(projectRoot, ".schedule-build");
const outputFile = path.join(
  projectRoot,
  "src",
  "lib",
  "generatedPuzzleSchedule.json"
);

fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

execFileSync(
  process.execPath,
  [
    path.join(projectRoot, "node_modules", "typescript", "bin", "tsc"),
    "--module",
    "commonjs",
    "--target",
    "ES2020",
    "--outDir",
    tempDir,
    "--rootDir",
    "src",
    path.join(projectRoot, "src", "lib", "puzzleScheduleCore.ts"),
    path.join(projectRoot, "src", "lib", "dictionary.ts"),
    path.join(projectRoot, "src", "lib", "findSlots.ts"),
    path.join(projectRoot, "src", "types", "puzzle.ts"),
  ],
  {
    cwd: projectRoot,
    stdio: "inherit",
  }
);

const compiled = require(path.join(tempDir, "lib", "puzzleScheduleCore.js"));
const schedule = compiled.buildSerializedSchedule(
  compiled.SCHEDULE_START,
  compiled.SCHEDULE_END
);

fs.writeFileSync(outputFile, JSON.stringify(schedule, null, 2) + "\n", "utf8");
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`Wrote ${outputFile}`);
