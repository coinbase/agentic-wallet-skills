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

// Fetch the latest version from the npm registry and validate its shape before
// it is used to rewrite pinned references in the skill markdown files.
function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    const request = https
      .get(
        "https://registry.npmjs.org/awal/latest",
        { headers: { Accept: "application/json" } },
        (res) => {
          // Fail fast on non-2xx responses instead of attempting to parse an
          // error page as JSON.
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            res.resume(); // Drain the body so the socket is released.
            reject(
              new Error(
                `npm registry returned HTTP ${res.statusCode} for awal/latest`
              )
            );
            return;
          }
          res.setEncoding("utf-8");
          let data = "";
          // Bound the buffered response so a hostile or malformed response
          // cannot exhaust memory before it is parsed.
          const maxResponseBytes = 64 * 1024;
          res.on("data", (chunk) => {
            data += chunk;
            if (data.length > maxResponseBytes) {
              request.destroy(
                new Error("npm registry response exceeded 64 KiB")
              );
            }
          });
          res.on("end", () => {
            try {
              const version = JSON.parse(data).version;
              // Only accept a well-formed semver string. The fetched version is
              // interpolated into markdown files, so any value containing
              // unexpected characters must be rejected before files are
              // written.
              if (
                typeof version !== "string" ||
                !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)
              ) {
                reject(
                  new Error(
                    `npm registry returned an unexpected version value: ${JSON.stringify(
                      version
                    )}`
                  )
                );
                return;
              }
              resolve(version);
            } catch (e) {
              reject(
                new Error(`Failed to parse npm registry response: ${e.message}`)
              );
            }
          });
        }
      )
      .on("error", reject);
    // Abort requests that hang so the script cannot block indefinitely.
    request.setTimeout(15000, () => {
      request.destroy(new Error("npm registry request timed out after 15s"));
    });
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
  // Print the message of real Error objects and fall back to String() so a
  // non-Error rejection still produces a readable failure instead of
  // "undefined".
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
