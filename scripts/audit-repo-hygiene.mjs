#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const localOnlyEntries = [
  ".agents",
  ".claude",
  ".worktrees",
  ".session-note.txt",
  ".vercel",
  ".npm-cache",
  "node_modules",
  "dist",
  "test-results",
  "_local",
];

const noisyExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".mp4",
  ".mov",
  ".zip",
  ".html",
]);

function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  }).trimEnd();
}

function getSize(targetPath) {
  let stats;
  try {
    stats = lstatSync(targetPath);
  } catch {
    return 0;
  }

  if (stats.isSymbolicLink()) {
    try {
      return statSync(targetPath).size;
    } catch {
      return 0;
    }
  }

  if (!stats.isDirectory()) {
    return stats.size;
  }

  let total = 0;
  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    total += getSize(path.join(targetPath, entry.name));
  }
  return total;
}

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function summarizeStatus() {
  const porcelain = runGit(["status", "--short"]);
  const lines = porcelain ? porcelain.split("\n") : [];

  const trackedChanges = [];
  const untracked = [];

  for (const line of lines) {
    if (line.startsWith("?? ")) {
      untracked.push(line.slice(3));
      continue;
    }
    trackedChanges.push(line);
  }

  return { trackedChanges, untracked };
}

function summarizeLocalOnly() {
  return localOnlyEntries
    .map((entry) => {
      const fullPath = path.join(repoRoot, entry);
      if (!existsSync(fullPath)) {
        return null;
      }

      return {
        entry,
        size: getSize(fullPath),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.size - a.size);
}

function classifyUntracked(untracked) {
  return untracked
    .map((entry) => {
      const fullPath = path.join(repoRoot, entry);
      const ext = path.extname(entry).toLowerCase();
      const topLevel = entry.split("/")[0];

      let reason = "review";
      if (entry.startsWith("docs/")) {
        reason = "docs";
      } else if (topLevel === "reference-shots" || topLevel === "reference-studies") {
        reason = "reference";
      } else if (noisyExtensions.has(ext)) {
        reason = "artifact";
      }

      let size = 0;
      if (existsSync(fullPath)) {
        size = getSize(fullPath);
      }

      return { entry, reason, size };
    })
    .sort((a, b) => b.size - a.size);
}

function printSection(title, lines) {
  console.log(`\n${title}`);
  if (lines.length === 0) {
    console.log("- none");
    return;
  }

  for (const line of lines) {
    console.log(`- ${line}`);
  }
}

const branch = runGit(["status", "--short", "--branch"]).split("\n")[0] ?? "";
const { trackedChanges, untracked } = summarizeStatus();
const localOnly = summarizeLocalOnly();
const untrackedSummary = classifyUntracked(untracked);

console.log("HADAL repo hygiene report");
console.log(branch);

printSection(
  "Tracked changes to keep in view",
  trackedChanges.map((line) => line.trim()),
);

printSection(
  "Local-only generated directories and files",
  localOnly.map(({ entry, size }) => `${entry} (${formatSize(size)})`),
);

printSection(
  "Untracked candidates to review",
  untrackedSummary.map(
    ({ entry, reason, size }) => `${entry} [${reason}] (${formatSize(size)})`,
  ),
);

console.log("\nSuggested rule:");
console.log("- ignore local agent/worktree/build clutter");
console.log("- keep product docs and references only when they are intentional");
console.log("- delete or archive large one-off artifacts after they stop informing active work");
