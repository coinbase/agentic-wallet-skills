#!/usr/bin/env node

const { readFileSync, writeFileSync, readdirSync } = require("fs");
const { join } = require("path");
const https = require("https");

const skillsDir = join(__dirname, "..", "skills");

// Collect every .md file under skills/ (SKILL.md plus any reference docs).
function collectMarkdownFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// Fetch latest version from npm registry
function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    https
      .get(
        "https://registry.npmjs.org/awal/latest",
        { headers: { Accept: "application/json" } },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data).version);
            } catch (e) {
              reject(
                new Error(`Failed to parse npm registry response: ${e.message}`)
              );
            }
          });
        }
      )
      .on("error", reject);
  });
}

async function main() {
  const latest = await fetchLatestVersion();
  console.log(`Latest awal version: ${latest}`);

  const pattern = /awal@[\w.]+/g;
  let totalReplacements = 0;
  let filesChanged = 0;

  for (const filePath of collectMarkdownFiles(skillsDir)) {
    const relPath = filePath.slice(skillsDir.length + 1);
    const content = readFileSync(filePath, "utf-8");

    const matches = content.match(pattern);
    if (!matches) continue;

    const alreadyCurrent = matches.every((m) => m === `awal@${latest}`);
    if (alreadyCurrent) {
      console.log(`  ${relPath}: already at ${latest}`);
      continue;
    }

    const updated = content.replace(pattern, `awal@${latest}`);
    writeFileSync(filePath, updated);
    const count = matches.filter((m) => m !== `awal@${latest}`).length;
    totalReplacements += count;
    filesChanged++;
    console.log(`  ${relPath}: updated ${count} references`);
  }

  if (filesChanged === 0) {
    console.log("\nAll files already pinned to latest.");
  } else {
    console.log(
      `\nDone. Updated ${totalReplacements} references across ${filesChanged} files.`
    );
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
